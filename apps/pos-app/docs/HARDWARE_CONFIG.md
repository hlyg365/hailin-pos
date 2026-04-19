# 海邻到家 - 安卓一体机硬件配置指南 V6.0

## 目录

1. [串口通信库](#串口通信库)
2. [顶尖电子秤集成](#顶尖电子秤集成)
3. [常见设备路径](#常见设备路径)
4. [秤协议详解](#秤协议详解)
5. [权限问题](#权限问题)
6. [调试指南](#调试指南)

---

## 串口通信库

本项目使用 **tp.xmaihh:serialport** 库实现 Android 串口通信。

```gradle
// android/app/build.gradle
dependencies {
    implementation 'tp.xmaihh:serialport:2.1'
}
```

GitHub: https://github.com/xmaihh/android-serialport

**特点**：
- 开箱即用，无需手动编译 .so 文件
- 支持多种 CPU 架构（armeabi-v7a, arm64-v8a, x86 等）
- API 简洁，适合 Kotlin/Java

---

## 顶尖电子秤集成

### 方案一：串口通信（推荐）

适用于 Android 收银 APP 直接读取重量、去皮等实时操作。

#### 通信参数

| 参数 | 值 | 说明 |
|------|-----|------|
| 波特率 | 9600 | 最常用 |
| 数据位 | 8 | |
| 停止位 | 1 | |
| 校验位 | None | 无校验 |
| 端口 | /dev/ttyS1 | Android 常用串口 |

#### 顶尖 OS2 协议格式

```
数据示例: 01 47 53 2B 30 2E 35 30 30 6B 67 0D
```

| 字节位置 | 内容 | 说明 |
|----------|------|------|
| 0 | 0x01 | 帧头 (STX) |
| 1 | 'G'/'S' | 稳定状态 (G=稳定, S=不稳定) |
| 2 | 'G'/'K' | 单位 (G=克重, K=皮重) |
| 3-10 | 数值 | ASCII 重量值，如 `+0.500` |
| 11 | 0x0D | 结束符 |

#### 数据解析代码

```java
// DevicePlugin.java 中的解析逻辑
public ScaleWeight parseTopSokiOS2Protocol(byte[] data) {
    if (data[0] == 0x01) {  // 帧头检测
        boolean stable = (data[1] == 'G');  // 稳定性
        String unit = (data[2] == 'K') ? "kg" : "g";  // 单位
        
        // 提取数值 (第3-10字节)
        String weightStr = new String(data, 3, 8);
        double weight = Double.parseDouble(weightStr);
        
        // 单位换算
        if ("g".equals(unit)) {
            weight = weight / 1000.0;  // 转为千克
        }
        
        return new ScaleWeight(weight, "kg", stable);
    }
}
```

#### 顶尖 ACLaS 协议格式

```
数据示例: 02 30 30 31 30 30 30 30 30 30 30 30 03
```

| 字节位置 | 内容 | 说明 |
|----------|------|------|
| 0 | 0x02 | 帧头 |
| 1 | 0x30/0x31 | 状态 (0x30=稳定) |
| 2-9 | BCD | BCD 编码的重量值 |
| 最后 | 0x03 | 帧尾 |

### 方案二：官方 SDK/DLL

适用于 Windows 桌面端收银软件。

```csharp
// C# 调用示例
[DllImport("AclasSDK.dll")]
public static extern int __Open(int portNo, int baudRate);

[DllImport("AclasSDK.dll")]
public static extern int __GetWeight(StringBuilder buffer, int size);

public string GetWeight() {
    __Open(1, 9600);  // COM1
    StringBuilder sb = new StringBuilder(20);
    __GetWeight(sb, sb.Capacity);
    return sb.ToString().Trim();
}
```

### 方案三：上位机管理软件

适用于商品信息下发和配置：

| 软件 | 适用设备 | 功能 |
|------|----------|------|
| LINK69 | 标签秤 | 商品下发、打印格式 |
| LINK68 | 标签秤 | 商品下发 |
| LINK65 | 条码秤 | PLU 管理 |
| LS6 | LS 系列条码秤 | 专用管理 |

---

## 常见设备路径

### 内置串口（安卓一体机主板）

| 路径 | 说明 | 备注 |
|------|------|------|
| `/dev/ttyS0` | 串口0 | 通常为调试口 |
| `/dev/ttyS1` | 串口1 | **最常用** |
| `/dev/ttyS2` | 串口2 | **第二常用** |
| `/dev/ttyS3`~`/dev/ttyS9` | 其他串口 | 视主板而定 |

### USB 转串口

| 路径 | 说明 |
|------|------|
| `/dev/ttyUSB0` | USB 转串口设备1 |
| `/dev/ttyUSB1` | USB 转串口设备2 |
| `/dev/ttyACM0` | USB ACM |

### 联发科/高通芯片

| 路径 | 芯片平台 |
|------|----------|
| `/dev/ttyMT1` | 联发科 |
| `/dev/ttyHS0` | 高通 |

---

## 秤协议详解

### 协议类型对照表

| 协议名称 | 帧头 | 帧尾 | 适用品牌 |
|----------|------|------|----------|
| `general` | 0x02 | 0x03 | 大多数国产秤 |
| `soki` | 0x01 | 0x0D | **顶尖 OS2** |
| `aclss` | 0x02 | 0x03 | **顶尖 ACLaS** |
| `dahua` | 0x02 | 0x03 | 大华 |
| `toieda` | 0x02 | 0x03 | METTLER TOLEDO |

### 常用波特率

| 波特率 | 适用场景 |
|--------|----------|
| **9600** | 大多数电子秤（推荐） |
| 19200 | 部分工业设备 |
| 38400 | 需要快速响应 |

### 控制指令

| 功能 | 指令 (Hex) | 说明 |
|------|-----------|------|
| 去皮 | `1B 54` (ESC T) | 去除容器重量 |
| 清零 | `1B 7A` (ESC z) | 置零当前重量 |
| 打印 | `1B 70 00 19 FA` | 触发打印机 |

---

## 权限问题

### 问题原因

串口设备属于系统级权限，普通 APK 无法直接访问：

```
java.io.IOException: Permission denied
java.lang.SecurityException: Neither user nor current process has android.permission.HARDWARE_TEST
```

### 解决方案

| 方案 | 说明 | 适用场景 |
|------|------|----------|
| **系统签名** | 使用厂商提供的 .keystore 签名 | 商业部署（推荐） |
| **Root 权限** | 设备已 Root | 开发测试 |
| **厂商 SDK** | 使用厂商提供的封装接口 | 特定设备 |
| **网络模式** | TCP 连接，无需串口权限 | 远程设备 |

### 获取系统签名

1. 联系设备厂商技术支持
2. 获取系统签名文件（`.keystore`）
3. 使用该签名打包 APK
4. 安装到 `/system/app/` 或签名后安装

---

## 调试指南

### 步骤 1：确定设备路径

```bash
# 在设备终端执行
ls -l /dev/tty*
```

### 步骤 2：测试串口连接

使用 Android 串口调试助手应用测试：

1. 选择端口：`/dev/ttyS1`
2. 设置波特率：`9600`
3. 观察数据输出

### 步骤 3：观察数据格式

稳定称重时的典型数据：

```
顶尖 OS2:  01 47 53 2B 30 2E 35 30 30 6B 67 0D
通用协议:  02 47 53 2B 30 31 32 2E 35 30 30 6B 67 03
文本格式:  ST,GS,+0.520,kg\r\n
```

### 步骤 4：配置调试页面

访问 `/device-debug` 页面进行配置：

```
串口模式: /dev/ttyS1
波特率:   9600
协议:     顶尖 OS2/ACLaS (soki)
```

### 步骤 5：验证数据

在调试页面观察日志输出：

```
[秤] 秤原始数据: 01 47 53 2B 30 2E 35 30 30 6B 67 0D
[秤] 顶尖OS2协议数据: 01 47 53 2B 30 2E 35 30 30 6B 67 0D
[秤] 顶尖OS2解析: 0.520 kg (稳定=true)
```

---

## 故障排查

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| Permission denied | 权限不足 | 使用系统签名 |
| 数据全是 0 | 称重不稳定 | 等待稳定后再读取 |
| 数据乱码 | 波特率不匹配 | 与秤体设置一致 |
| 无数据输出 | 路径错误/秤未开机 | 检查设备和连接 |
| 协议解析失败 | 协议选择错误 | 根据实际数据选择协议 |

---

## 推荐配置

```
┌─────────────────────────────────────────────────┐
│ 顶尖电子秤推荐配置                               │
├─────────────────────────────────────────────────┤
│  端口:   /dev/ttyS1        (或 /dev/ttyS2)     │
│  波特率: 9600               (不要用其他)         │
│  协议:   soki               (顶尖 OS2 协议)      │
│  单位:   kg                 (自动换算)           │
└─────────────────────────────────────────────────┘
```
