# 海邻到家 - 收银系统串口电子秤集成方案

## 一、系统架构对比

### 1.1 两种实现方案

| 项目 | 技术栈 | 优点 | 缺点 |
|------|--------|------|------|
| **Windows 收银系统** | WPF + .NET 8 | 完整的原生串口支持 | 只能在 Windows 运行 |
| **海邻到家 APP** | Capacitor + Android | 移动端部署 | 需要通过 Capacitor 桥接 |

### 1.2 通信流程对比

```
Windows 系统:
┌─────────────────────────────────────────────────────────────┐
│  MainViewModel                                              │
│       │                                                     │
│       ▼                                                     │
│  ScaleRepository ─────────────────────────────────────────▶│
│       │                                                     │
│       ▼                                                     │
│  ScaleCommunicationService (USB 串口)                       │
│       │                                                     │
│       ▼                                                     │
│  SerialPort.ReadLine() ──────────────────────────▶ 电子秤   │
│       │                                                     │
│       ▼                                                     │
│  ScaleProtocol.Parse() ──────────────▶ 解析重量数据          │
└─────────────────────────────────────────────────────────────┘

Capacitor APP:
┌─────────────────────────────────────────────────────────────┐
│  DeviceDebugPage / ScaleRepository (TypeScript)             │
│       │                                                     │
│       ▼                                                     │
│  Capacitor.nativePromise() ─────────────────────────▶│     │
│       │                                          │         │
│       ▼                                          ▼         │
│  HailinPluginRegister ──────────────────────▶ HailinHardware │
│       │                                          │         │
│       ▼                                          ▼         │
│  native-bridge.js ──────────────────────────▶ │ Android   │
│                                             │ │ Native   │
│                                             ▼ │          │
│                              HailinHardwarePlugin.java      │
│                                             │              │
│                                             ▼              │
│                            FileInputStream.Read() ──▶ /dev │
│                                             │              │
│                                             ▼              │
│                            ScaleProtocol.Parse() ──▶ 电子秤 │
└─────────────────────────────────────────────────────────────┘
```

## 二、顶尖牌电子秤协议详解

### 2.1 硬件参数

| 参数 | 值 |
|------|-----|
| 品牌 | 顶尖 (TOP) |
| 型号 | OS2X-15 |
| 连接方式 | RS232 串口 / USB 转串口 |
| 波特率 | **2400** (顶尖默认) |
| 数据位 | 8 |
| 停止位 | 1 |
| 校验 | 无 |

### 2.2 数据协议

顶尖秤使用连续数据流方式输出，每帧数据格式：

```
STX  +  状态  +  重量  +  单位  +  CR  +  LF
0x02   0x30    012345   kg      0x0D   0x0A
```

**字段说明:**

| 字节位置 | 内容 | 说明 |
|----------|------|------|
| 0 | STX (0x02) | 帧起始标志 |
| 1 | 状态字节 | 0x30=稳定, 0x31=不稳定, 0x32=零位, 0x35=超重 |
| 2-7 | 重量数据 | 6位数字，含小数点 (如 "01.234") |
| 8-9 | 单位 | "kg" 或 "g" |
| 10 | CR (0x0D) | 回车 |
| 11 | LF (0x0A) | 换行 |

**示例数据:**
```
0x02 0x30 0x30 0x31 0x2E 0x32 0x33 0x34 0x6B 0x67 0x0D 0x0A
```
含义: 稳定状态, 重量 01.234kg

## 三、Android 原生插件实现

### 3.1 HailinHardwarePlugin.java - 核心代码

```java
package com.hailin.pos;

import android.util.Log;
import com.getcapacitor.*;
import com.google.gson.Gson;
import java.io.*;
import java.util.*;
import java.util.concurrent.*;

public class HailinHardwarePlugin extends Plugin {
    private static final String TAG = "HailinHardware";
    private static final String SOKI_PROTOCOL = "soki";  // 顶尖秤协议
    private static final int DEFAULT_BAUD_RATE = 2400;   // 顶尖秤默认波特率
    
    // 秤连接池
    private final Map<String, SerialConnection> serialPool = new ConcurrentHashMap<>();
    // 读数缓存
    private final Map<String, ScaleData> scaleDataCache = new ConcurrentHashMap<>();
    
    // 秤数据模型
    private static class ScaleData {
        double weight = 0;
        String unit = "kg";
        boolean stable = false;
        long timestamp = 0;
    }
    
    // 串口连接封装
    private static class SerialConnection {
        String port;
        int baudRate;
        InputStream inputStream;
        OutputStream outputStream;
        SerialReader reader;
        ScaleData lastWeight = new ScaleData();
    }
    
    // 串口读取线程
    private class SerialReader implements Runnable {
        private final InputStream in;
        private volatile boolean running = true;
        private String connectionId;
        
        SerialReader(InputStream in, String connectionId) {
            this.in = in;
            this.connectionId = connectionId;
        }
        
        @Override
        public void run() {
            byte[] buffer = new byte[256];
            StringBuilder data = new StringBuilder();
            
            while (running && !Thread.currentThread().isInterrupted()) {
                try {
                    int available = in.available();
                    if (available > 0) {
                        int bytesRead = in.read(buffer, 0, Math.min(available, buffer.length));
                        if (bytesRead > 0) {
                            String chunk = new String(buffer, 0, bytesRead, "ISO-8859-1");
                            data.append(chunk);
                            
                            // 解析完整帧
                            int frameEnd = data.indexOf("\r\n");
                            while (frameEnd >= 0) {
                                String frame = data.substring(0, frameEnd);
                                data.delete(0, frameEnd + 2);
                                
                                // 解析顶尖秤协议
                                ScaleData scaleData = parseSokiProtocol(frame);
                                if (scaleData != null) {
                                    SerialConnection conn = serialPool.get(connectionId);
                                    if (conn != null) {
                                        conn.lastWeight = scaleData;
                                        scaleDataCache.put(connectionId, scaleData);
                                    }
                                }
                                frameEnd = data.indexOf("\r\n");
                            }
                        }
                    }
                    Thread.sleep(50); // 避免CPU忙等待
                } catch (Exception e) {
                    Log.e(TAG, "[SerialReader] 读取错误: " + e.getMessage());
                }
            }
        }
        
        void stopReading() {
            running = false;
        }
    }
    
    // 解析顶尖秤协议
    private ScaleData parseSokiProtocol(String frame) {
        if (frame == null || frame.length() < 10) return null;
        
        try {
            // 帧格式: STX + 状态 + 6位重量 + 单位 + CR
            // 0x02 0x30 0x30 0x31 0x2E 0x32 0x33 0x34 0x6B 0x67 0x0D
            
            byte[] bytes = frame.getBytes("ISO-8859-1");
            if (bytes.length < 10 || bytes[0] != 0x02) return null;
            
            ScaleData data = new ScaleData();
            
            // 状态字节
            byte status = bytes[1];
            data.stable = (status == 0x30); // 0x30=稳定
            
            // 重量数据 (2-7位置，6位)
            StringBuilder weightStr = new StringBuilder();
            for (int i = 2; i < bytes.length && i < 8; i++) {
                if (bytes[i] >= 0x30 && bytes[i] <= 0x39) { // 数字
                    weightStr.append((char)bytes[i]);
                } else if (bytes[i] == 0x2E) { // 小数点
                    weightStr.append('.');
                }
            }
            
            try {
                data.weight = Double.parseDouble(weightStr.toString());
            } catch (NumberFormatException e) {
                data.weight = 0;
            }
            
            // 单位 (最后两位)
            if (frame.endsWith("kg")) {
                data.unit = "kg";
            } else if (frame.endsWith("g")) {
                data.unit = "g";
            }
            
            data.timestamp = System.currentTimeMillis();
            return data;
            
        } catch (Exception e) {
            Log.e(TAG, "[parseSokiProtocol] 解析错误: " + e.getMessage());
            return null;
        }
    }
    
    // ==================== 1. 枚举可用串口设备 ====================
    @PluginMethod
    public void listSerialPorts(PluginCall call) {
        Log.i(TAG, "[枚举串口] 开始枚举可用串口设备...");
        
        JSObject result = new JSObject();
        JSONArray ports = new JSONArray();
        
        try {
            File devDir = new File("/dev");
            
            // 检查目录
            Log.i(TAG, "[枚举串口] /dev 存在: " + devDir.exists() + 
                  ", 可读: " + devDir.canRead());
            
            if (!devDir.exists()) {
                result.put("success", false);
                result.put("error", "/dev 目录不存在");
                call.resolve(result);
                return;
            }
            
            File[] files = devDir.listFiles();
            if (files == null) {
                Log.w(TAG, "[枚举串口] 权限不足，无法列出设备");
                result.put("success", false);
                result.put("error", "无法列出设备，可能是权限问题");
                result.put("hint", "请在设置中授权USB权限");
                call.resolve(result);
                return;
            }
            
            // 枚举串口设备
            for (File file : files) {
                String name = file.getName();
                // 匹配: ttyS0, ttyUSB0, ttyACM0
                if (name.matches("ttyS\\d+|ttyUSB\\d+|ttyACM\\d+")) {
                    JSONObject portInfo = new JSONObject();
                    portInfo.put("path", file.getAbsolutePath());
                    portInfo.put("name", name);
                    portInfo.put("readable", file.canRead());
                    portInfo.put("writable", file.canWrite());
                    ports.put(portInfo);
                    
                    Log.i(TAG, "[枚举串口] 发现: " + name + 
                          " (r=" + file.canRead() + ", w=" + file.canWrite() + ")");
                }
            }
            
            result.put("success", true);
            result.put("ports", ports);
            result.put("count", ports.length());
            call.resolve(result);
            
            Log.i(TAG, "[枚举串口] 完成，找到 " + ports.length() + " 个设备");
            
        } catch (Exception e) {
            Log.e(TAG, "[枚举串口] 失败: " + e.getMessage());
            result.put("success", false);
            result.put("error", e.getMessage());
            call.resolve(result);
        }
    }
    
    // ==================== 2. 连接电子秤 ====================
    @PluginMethod
    public void scaleConnect(PluginCall call) {
        String port = call.getString("port", "/dev/ttyS0");
        int baudRate = call.getInt("baudRate", DEFAULT_BAUD_RATE);
        String protocol = call.getString("protocol", SOKI_PROTOCOL);
        String connectionId = call.getString("connectionId", "scale");
        
        Log.i(TAG, "[连接秤] 端口: " + port + ", 波特率: " + baudRate + 
              ", 协议: " + protocol);
        
        executor.execute(() -> {
            try {
                // 关闭已存在的连接
                SerialConnection existing = serialPool.remove(connectionId);
                if (existing != null) {
                    existing.reader.stopReading();
                    existing.close();
                }
                
                // 打开串口
                File device = new File(port);
                FileInputStream fis = new FileInputStream(device);
                FileOutputStream fos = new FileOutputStream(device);
                
                // 配置串口参数 (Android 串口配置需要额外处理)
                // 注意: Android 标准 API 不支持直接配置串口参数
                // 需要使用 USB Serial 库或 root 权限
                
                // 创建连接
                SerialConnection conn = new SerialConnection();
                conn.port = port;
                conn.baudRate = baudRate;
                conn.inputStream = fis;
                conn.outputStream = fos;
                conn.reader = new SerialReader(fis, connectionId);
                
                serialPool.put(connectionId, conn);
                scaleDataCache.put(connectionId, conn.lastWeight);
                
                // 启动读取线程
                new Thread(conn.reader).start();
                
                JSObject result = new JSObject();
                result.put("success", true);
                result.put("connectionId", connectionId);
                result.put("port", port);
                result.put("baudRate", baudRate);
                result.put("protocol", protocol);
                call.resolve(result);
                
                Log.i(TAG, "[连接秤] 成功，连接ID: " + connectionId);
                
            } catch (SecurityException e) {
                Log.e(TAG, "[连接秤] 权限被拒绝: " + e.getMessage());
                JSObject result = new JSObject();
                result.put("success", false);
                result.put("error", "权限被拒绝，请授权USB设备访问");
                result.put("hint", "在系统设置中允许USB设备访问");
                call.resolve(result);
            } catch (Exception e) {
                Log.e(TAG, "[连接秤] 失败: " + e.getMessage());
                JSObject result = new JSObject();
                result.put("success", false);
                result.put("error", "连接失败: " + e.getMessage());
                call.resolve(result);
            }
        });
    }
    
    // ==================== 3. 读取当前重量 ====================
    @PluginMethod
    public void scaleReadWeight(PluginCall call) {
        String connectionId = call.getString("connectionId", "scale");
        
        ScaleData data = scaleDataCache.get(connectionId);
        JSObject result = new JSObject();
        
        if (data != null) {
            result.put("success", true);
            result.put("weight", data.weight);
            result.put("unit", data.unit);
            result.put("stable", data.stable);
            result.put("timestamp", data.timestamp);
        } else {
            result.put("success", false);
            result.put("error", "秤未连接或无数据");
        }
        
        call.resolve(result);
    }
    
    // ==================== 4. 断开连接 ====================
    @PluginMethod
    public void scaleDisconnect(PluginCall call) {
        String connectionId = call.getString("connectionId", "scale");
        
        SerialConnection conn = serialPool.remove(connectionId);
        if (conn != null) {
            conn.reader.stopReading();
            conn.close();
        }
        scaleDataCache.remove(connectionId);
        
        JSObject result = new JSObject();
        result.put("success", true);
        result.put("message", "秤已断开");
        call.resolve(result);
    }
}
```

## 四、TypeScript 前端调用

### 4.1 插件注册 (hailin-plugin-register.ts)

```typescript
/**
 * Capacitor 插件手动注册脚本
 * 使用 nativePromise 获取异步结果
 */

interface HailinHardwareInterface {
  listSerialPorts(): Promise<{
    success: boolean;
    ports: Array<{ path: string; name: string; readable: boolean; writable: boolean }>;
    count: number;
    error?: string;
  }>;
  
  scaleConnect(options: {
    port: string;
    baudRate: number;
    protocol?: string;
    connectionId?: string;
  }): Promise<{ success: boolean; connectionId?: string; error?: string }>;
  
  scaleReadWeight(options?: {
    connectionId?: string;
  }): Promise<{
    success: boolean;
    weight: number;
    unit: string;
    stable: boolean;
    error?: string;
  }>;
  
  scaleDisconnect(options?: { connectionId?: string }): Promise<{ success: boolean }>;
}

// 注册插件
function registerHailinHardwarePlugin(): void {
  if (typeof window === 'undefined') return;
  if (!(window as any).Capacitor) return;
  
  console.log('[HailinPlugin] 注册 HailinHardware 插件...');
  
  const pluginImplementation: HailinHardwareInterface = {
    async listSerialPorts() {
      const cap = (window as any).Capacitor;
      if (cap?.nativePromise) {
        return cap.nativePromise('HailinHardware', 'listSerialPorts', {});
      }
      // Fallback
      return cap?.nativeCallback('HailinHardware', 'listSerialPorts', {});
    },
    
    async scaleConnect(options) {
      const cap = (window as any).Capacitor;
      if (cap?.nativePromise) {
        return cap.nativePromise('HailinHardware', 'scaleConnect', options);
      }
      return cap?.nativeCallback('HailinHardware', 'scaleConnect', options);
    },
    
    async scaleReadWeight(options) {
      const cap = (window as any).Capacitor;
      if (cap?.nativePromise) {
        return cap.nativePromise('HailinHardware', 'scaleReadWeight', options || {});
      }
      return cap?.nativeCallback('HailinHardware', 'scaleReadWeight', options || {});
    },
    
    async scaleDisconnect(options) {
      const cap = (window as any).Capacitor;
      if (cap?.nativePromise) {
        return cap.nativePromise('HailinHardware', 'scaleDisconnect', options || {});
      }
      return cap?.nativeCallback('HailinHardware', 'scaleDisconnect', options || {});
    }
  };
  
  // 注册到 Capacitor.Plugins
  (window as any).Capacitor.Plugins.HailinHardware = pluginImplementation;
  console.log('[HailinPlugin] 注册完成');
}

// 立即注册
registerHailinHardwarePlugin();
```

### 4.2 电子秤服务 (ScaleService.ts)

```typescript
/**
 * 电子秤服务 - 串口通信封装
 */

export interface ScaleConfig {
  port: string;        // 如 "/dev/ttyS0"
  baudRate: number;    // 9600 或 2400
  protocol: 'soki';    // 顶尖秤协议
  connectionId: string;
}

export interface ScaleReading {
  weight: number;      // 重量值
  unit: 'kg' | 'g';    // 单位
  stable: boolean;     // 是否稳定
  timestamp: number;   // 采集时间
}

export interface ScaleStatus {
  connected: boolean;
  port?: string;
  lastReading?: ScaleReading;
  error?: string;
}

class ScaleService {
  private config: ScaleConfig | null = null;
  private status: ScaleStatus = { connected: false };
  private listeners: Set<(status: ScaleStatus) => void> = new Set();
  private pollInterval: number | null = null;
  
  // 获取插件
  private getPlugin() {
    return (window as any).Capacitor?.Plugins?.HailinHardware;
  }
  
  // 枚举可用串口
  async enumeratePorts(): Promise<ScaleStatus['port'][]> {
    const plugin = this.getPlugin();
    if (!plugin) {
      console.error('[ScaleService] 插件未就绪');
      return [];
    }
    
    try {
      const result = await plugin.listSerialPorts();
      console.log('[ScaleService] 枚举结果:', result);
      
      if (result.success) {
        return result.ports.map((p: any) => p.path);
      } else {
        console.error('[ScaleService] 枚举失败:', result.error);
        return [];
      }
    } catch (e) {
      console.error('[ScaleService] 枚举异常:', e);
      return [];
    }
  }
  
  // 连接电子秤
  async connect(config: ScaleConfig): Promise<boolean> {
    const plugin = this.getPlugin();
    if (!plugin) {
      console.error('[ScaleService] 插件未就绪');
      return false;
    }
    
    try {
      console.log('[ScaleService] 正在连接:', config);
      
      const result = await plugin.scaleConnect({
        port: config.port,
        baudRate: config.baudRate,
        protocol: config.protocol,
        connectionId: config.connectionId
      });
      
      console.log('[ScaleService] 连接结果:', result);
      
      if (result.success) {
        this.config = config;
        this.status = {
          connected: true,
          port: config.port
        };
        
        // 启动轮询读取
        this.startPolling();
        
        this.notifyListeners();
        return true;
      } else {
        this.status = {
          connected: false,
          error: result.error
        };
        this.notifyListeners();
        return false;
      }
    } catch (e: any) {
      console.error('[ScaleService] 连接异常:', e);
      this.status = {
        connected: false,
        error: e.message
      };
      this.notifyListeners();
      return false;
    }
  }
  
  // 断开连接
  async disconnect(): Promise<void> {
    if (!this.config) return;
    
    const plugin = this.getPlugin();
    if (plugin) {
      await plugin.scaleDisconnect({ connectionId: this.config.connectionId });
    }
    
    this.stopPolling();
    this.config = null;
    this.status = { connected: false };
    this.notifyListeners();
  }
  
  // 读取当前重量
  async readWeight(): Promise<ScaleReading | null> {
    if (!this.config) return null;
    
    const plugin = this.getPlugin();
    if (!plugin) return null;
    
    try {
      const result = await plugin.scaleReadWeight({
        connectionId: this.config.connectionId
      });
      
      if (result.success) {
        const reading: ScaleReading = {
          weight: result.weight,
          unit: result.unit,
          stable: result.stable,
          timestamp: result.timestamp || Date.now()
        };
        
        this.status.lastReading = reading;
        this.notifyListeners();
        return reading;
      }
    } catch (e) {
      console.error('[ScaleService] 读取失败:', e);
    }
    
    return null;
  }
  
  // 自动检测秤
  async autoDetect(): Promise<ScaleConfig | null> {
    console.log('[ScaleService] 开始自动检测电子秤...');
    
    // 1. 枚举串口
    const ports = await this.enumeratePorts();
    if (ports.length === 0) {
      console.warn('[ScaleService] 未找到可用串口');
      return null;
    }
    
    console.log('[ScaleService] 可用端口:', ports);
    
    // 2. 尝试连接每个端口
    const protocols = ['soki'];
    const baudRates = [2400, 9600]; // 顶尖秤常用波特率
    
    for (const port of ports) {
      for (const protocol of protocols) {
        for (const baudRate of baudRates) {
          const config: ScaleConfig = {
            port,
            baudRate,
            protocol: protocol as 'soki',
            connectionId: 'scale'
          };
          
          console.log('[ScaleService] 尝试:', config);
          
          // 尝试连接
          if (await this.connect(config)) {
            // 等待数据稳定
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // 读取重量验证
            const reading = await this.readWeight();
            if (reading && reading.weight >= 0) {
              console.log('[ScaleService] 找到秤:', config, reading);
              return config;
            }
            
            // 连接成功但无数据，断开重试
            await this.disconnect();
          }
        }
      }
    }
    
    console.warn('[ScaleService] 未检测到电子秤');
    return null;
  }
  
  // 启动轮询
  private startPolling(): void {
    if (this.pollInterval) return;
    
    this.pollInterval = window.setInterval(async () => {
      await this.readWeight();
    }, 500); // 每500ms读取一次
  }
  
  // 停止轮询
  private stopPolling(): void {
    if (this.pollInterval) {
      window.clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }
  
  // 状态订阅
  subscribe(callback: (status: ScaleStatus) => void): () => void {
    this.listeners.add(callback);
    callback(this.status); // 立即通知当前状态
    return () => this.listeners.delete(callback);
  }
  
  private notifyListeners(): void {
    this.listeners.forEach(cb => cb(this.status));
  }
  
  getStatus(): ScaleStatus {
    return this.status;
  }
}

// 导出单例
export const scaleService = new ScaleService();
```

## 五、常见问题排查

### 5.1 问题诊断流程

```
┌─────────────────────────────────────────────────────────────┐
│  问题: 枚举返回空或 listSerialPorts is not a function      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Step 1: 检查 Capacitor.nativePromise 是否可用             │
│  ├─ 在 Console 执行:                                        │
│  │  console.log(Capacitor.nativePromise)                   │
│  └─ 应该返回函数定义，不是 undefined                        │
│                                                             │
│  Step 2: 检查 HailinHardware 插件注册                      │
│  ├─ 执行:                                                   │
│  │  console.log(Capacitor.Plugins.HailinHardware)          │
│  └─ 应该返回对象，包含 listSerialPorts 方法                 │
│                                                             │
│  Step 3: 检查 Android 原生日志                              │
│  ├─ 查看 Logcat 过滤 "HailinHardware"                       │
│  └─ 应该有 "[枚举串口] 开始枚举..." 日志                     │
│                                                             │
│  Step 4: 检查 /dev 目录权限                                 │
│  ├─ 执行: adb shell ls -la /dev/tty*                      │
│  └─ 应该能看到 ttyS0, ttyUSB0 等设备文件                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 常见错误码

| 返回值 | 含义 | 解决方案 |
|--------|------|----------|
| `-1` | callbackId (无回调) | 检查是否使用了 `nativePromise` |
| `undefined` | 方法未定义 | 确认插件已注册 |
| 权限错误 | Android 权限问题 | 检查 USB 权限声明 |
| 设备不存在 | 串口路径错误 | 确认 `/dev/ttyS0` 等文件存在 |

### 5.3 调试命令

```bash
# 查看串口设备
adb shell ls -la /dev/tty*

# 查看特定串口
adb shell ls -la /dev/ttyS0
adb shell ls -la /dev/ttyUSB0

# 测试串口权限
adb shell cat /dev/ttyS0

# 查看应用日志
adb logcat -s HailinHardware:V

# 查看 Capacitor 桥接日志
adb logcat -s Capacitor:V
```

## 六、推荐配置

### 6.1 顶尖牌秤 (TOP OS2X-15)

| 参数 | 值 |
|------|-----|
| 协议 | soki |
| 波特率 | **2400** |
| 数据位 | 8 |
| 停止位 | 1 |
| 校验 | 无 |
| 常用端口 | /dev/ttyS0, /dev/ttyUSB0 |

### 6.2 京东收银机配置

根据京东收银机测试，建议配置:

```typescript
const SCALE_CONFIG = {
  port: '/dev/ttyUSB0',     // USB转串口
  baudRate: 2400,          // 顶尖秤默认波特率
  protocol: 'soki',        // 顶尖秤协议
  connectionId: 'scale'
};
```

## 七、相关文件清单

| 文件路径 | 说明 |
|----------|------|
| `android/.../HailinHardwarePlugin.java` | Android 原生插件 |
| `src/plugins/hailin-plugin-register.ts` | Capacitor 插件注册 |
| `src/services/hardwareService.ts` | 硬件服务层 |
| `src/pages/DeviceDebugPage.tsx` | 设备调试页面 |
