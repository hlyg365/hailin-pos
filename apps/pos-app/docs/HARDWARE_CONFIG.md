# 海邻到家 - 安卓一体机硬件配置指南 V6.0

## 串口通信库

本项目使用 **tp.xmaihh:serialport** 库实现 Android 串口通信。

```gradle
// android/app/build.gradle
dependencies {
    implementation 'tp.xmaihh:serialport:2.1'
}
```

GitHub: https://github.com/xmaihh/android-serialport

---

## 串口权限问题

### 问题描述

串口设备文件（如 `/dev/ttyS1`）属于系统级权限，普通应用直接访问会抛出：

```
java.io.IOException: Permission denied
java.lang.SecurityException: Neither user X nor current process has android.permission.HARDWARE_TEST
```

### 解决方案

#### 方案一：系统签名（推荐）

1. 联系设备厂商获取系统签名文件（`.keystore`）
2. 使用该签名打包你的 APK
3. 将应用安装为系统应用（放到 `/system/app/` 目录）

#### 方案二：Root 权限

1. 设备已 Root
2. 应用申请 Root 权限
3. 使用 `su` 命令临时提升权限

#### 方案三：厂商 SDK

部分商用一体机厂商提供自己的 SDK，包含权限豁免：

| 厂商 | SDK 特点 | 获取方式 |
|------|----------|----------|
| 商米 Sunmi | 直接提供 getWeight() | 官网开发者中心 |
| 海信 Hisense | 硬件控制封装 | 技术支持 |
| 安达通 | 权限豁免 | 商务联系 |

---

## 常见设备路径

### 内置串口（安卓一体机主板）

| 路径 | 说明 | 常见用途 |
|------|------|----------|
| `/dev/ttyS0` | 串口0 | 通常为调试口 |
| `/dev/ttyS1` | 串口1 | **最常用** |
| `/dev/ttyS2` | 串口2 | **第二常用** |
| `/dev/ttyS3` ~ `/dev/ttyS9` | 其他串口 | 视主板而定 |

### USB 转串口

| 路径 | 说明 |
|------|------|
| `/dev/ttyUSB0` | USB 转串口设备1 |
| `/dev/ttyUSB1` | USB 转串口设备2 |
| `/dev/ttyACM0` | USB ACM 调制解调器 |

### 芯片特定

| 路径 | 说明 |
|------|------|
| `/dev/ttyMT1` | 联发科芯片串口 |
| `/dev/ttyHS0` | 高通芯片高速串口 |

---

## 常用波特率

| 波特率 | 说明 | 适用场景 |
|--------|------|----------|
| `9600` | 最常用 | 大多数电子秤 |
| `19200` | 中速 | 部分工业设备 |
| `38400` | 较高速 | 需要快速响应 |
| `57600` | 高速 | 少见 |
| `115200` | 最高速 | 专业设备 |

---

## 秤协议类型

| 协议 | 说明 | 典型设备 |
|------|------|----------|
| `general` | 通用协议（帧头0x02/帧尾0x03） | 大多数国产秤 |
| `dahua` | 大华协议 | 大华电子秤 |
| `toieda` | 托利多协议 | METTLER TOLEDO |
| `soki` | 顶尖协议 | 顶尖电子秤 |

---

## 数据格式

### 通用协议（十六进制）

```
02 47 53 2B 30 31 32 2E 35 30 30 03
┬  ┬  ┬  ┬  ┗━━━━━━━━━━━━━━━┛  ┬
│  │  │  │       数值          单位(kg)
│  │  │  正号(+)
│  │  稳定(G/S)
│  重量单位(G=克,K=千克)
帧头(0x02)                   帧尾(0x03)
```

### 文本格式

```
ST,GS,+0.520,kg
ST,US,+1.234,kg
```

- `ST`: 起始位
- `GS`: 稳定 (US = 不稳定)
- `+`: 正号
- `0.520`: 重量值
- `kg`: 单位

---

## 电子秤控制指令

| 功能 | 指令 | 说明 |
|------|------|------|
| 去皮 | `ESC T` (0x1B 0x54) | 去除容器重量 |
| 清零 | `ESC z` (0x1B 0x7A) | 置零当前重量 |
| 打印 | `ESC p m t1 t2` | 钱箱弹出 |

---

## 网络秤配置

网络秤使用 TCP 连接，默认端口 `9101`。

```
IP地址: 192.168.1.100
端口: 9101
协议: TCP
```

---

## USB HID 电子秤

USB HID 秤通常模拟为键盘设备，数据通过按键事件输入。

识别信息：

```
VID: 厂商ID (如 0x0922)
PID: 产品ID (如 0x8003)
```

---

## 调试建议

1. **先查文档**：查看设备厂商提供的接口定义文档
2. **Shell 命令**：在设备终端执行 `ls -l /dev/tty*` 查看可用端口
3. **串口助手**：使用 Android 串口调试助手先测试
4. **抓包分析**：连接电脑，使用逻辑分析仪或串口监视器
5. **厂商支持**：联系设备厂商技术支持获取帮助

---

## 示例代码

### Kotlin (Android 原生)

```kotlin
// 使用 tp.xmaihh:serialport
val serialHelper = object : SerialHelper("/dev/ttyS1", 9600) {
    override fun onDataReceived(paramComBean: ComBean) {
        val data = paramComBean.bRec
        // 解析重量数据
        parseWeight(data)
    }
}

try {
    serialHelper.open()
    // 发送去皮指令
    serialHelper.sendHex("1B 54")
} catch (e: IOException) {
    e.printStackTrace()
}
```

### TypeScript (前端)

```typescript
import { Capacitor } from '@capacitor/core';
import { Plugins } from '@capacitor/core';

const { DevicePlugin } = Plugins;

// 连接串口秤
await DevicePlugin.scaleConnect({
    port: '/dev/ttyS1',
    baudRate: 9600,
    protocol: 'general'
});

// 监听重量数据
DevicePlugin.addListener('scaleData', (event) => {
    console.log(`重量: ${event.weight} ${event.unit}`);
});
```

---

## 故障排查

| 问题 | 可能原因 | 解决方案 |
|------|----------|----------|
| Permission denied | 权限不足 | 使用系统签名或 Root |
| 设备不存在 | 路径错误 | 确认正确的设备路径 |
| 数据乱码 | 波特率不匹配 | 与秤体设置一致 |
| 无数据输出 | 秤未发送数据 | 检查秤是否正常工作 |
| 连接超时 | 网络不通 | 检查 IP 和端口 |
