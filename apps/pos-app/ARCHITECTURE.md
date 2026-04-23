# 海邻到家 V6.0 系统架构说明

## 一、项目概述

海邻到家是一个面向连锁便利店的智能收银与营销管理系统，采用 **单应用 SPA 架构**，基于 Capacitor 框架实现 Android/iOS 双端支持。

### 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 前端框架 | React + TypeScript | React 19 / TS 5 |
| UI 框架 | shadcn/ui + Tailwind CSS | Radix UI |
| 移动框架 | Capacitor | v5.x |
| 状态管理 | Zustand | - |
| 打包工具 | Vite | v5.x |
| 移动端 | Android | API 22+ |

---

## 二、目录结构

```
apps/pos-app/
├── src/
│   ├── App.tsx                    # 主应用 + 路由配置
│   ├── main.tsx                   # 入口文件
│   ├── index.css                  # Tailwind 全局样式
│   ├── types/                     # TypeScript 类型定义
│   │   └── index.ts               # 核心类型定义
│   ├── services/                  # 业务服务
│   │   ├── posDevices.ts          # 收银设备管理
│   │   └── hardwareService.ts     # 硬件服务层（插件桥接）
│   ├── store/                     # Zustand 状态管理
│   │   └── index.ts               # 全局状态（含持久化）
│   ├── pages/                     # 页面组件
│   │   ├── HomePage.tsx           # 首页（四端入口）
│   │   ├── CashierPage.tsx        # 收银台（AI增强）
│   │   ├── DashboardPage.tsx       # 总部管理后台
│   │   ├── SettingsPage.tsx        # 设置页
│   │   └── ...
│   ├── components/                # 公共组件
│   └── plugins/                   # 插件注册
│       ├── hailin-plugin-register.ts
│       └── plugin-bridge.ts
├── android/                      # Android 原生项目
│   └── app/src/main/
│       ├── java/com/hailin/pos/
│       │   ├── MainActivity.java  # 主入口
│       │   └── HailinHardwarePlugin.java  # 硬件插件
│       └── assets/
│           └── public/            # Web 资源
│               ├── index.html
│               ├── cordova.js      # 插件桥接（重要！）
│               └── cordova_plugins.js
├── public/                       # 前端静态资源
│   ├── cordova.js                # 插件桥接
│   ├── cordova_plugins.js
│   └── *.apk                     # 发布的安装包
└── scripts/
    └── upload-apk.mjs            # APK 上传脚本
```

---

## 三、核心架构

### 3.1 前端架构（SPA）

```
┌─────────────────────────────────────────────────────────────┐
│                      Web 前端层                               │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │ 收银台  │ │ 管理后台 │ │ 店长助手 │ │ 小程序   │          │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘          │
│       └─────────────┬─────────────┬─────────────┘           │
│                     ▼                                      │
│              ┌────────────┐                               │
│              │  路由 (App) │  React Router                  │
│              └──────┬─────┘                               │
│                     ▼                                      │
│              ┌────────────┐                               │
│              │  Zustand   │  全局状态管理                   │
│              └──────┬─────┘                               │
│                     ▼                                      │
│              ┌────────────┐                               │
│              │ Hardware   │  硬件服务层                     │
│              │ Service    │                               │
│              └──────┬─────┘                               │
└─────────────────────┼─────────────────────────────────────┘
                      │ JavaScript Bridge
┌─────────────────────┼─────────────────────────────────────┐
│                      ▼                                      │
│              ┌────────────┐                               │
│              │ cordova.js  │  插件桥接                       │
│              └──────┬─────┘                               │
│                     ▼                                      │
│              ┌────────────┐                               │
│              │ Capacitor  │  跨平台运行时                    │
│              │  Bridge     │                               │
│              └──────┬─────┘                               │
└─────────────────────┼─────────────────────────────────────┘
                      │ AJP (Android JSON Protocol)
┌─────────────────────┼─────────────────────────────────────┐
│                      ▼                                      │
│              ┌────────────────────┐                        │
│              │ HailinHardware     │  Android 原生插件       │
│              │ Plugin            │                        │
│              └──────┬─────────────┘                        │
│                     ▼                                      │
│         ┌──────────┼──────────┐                           │
│         ▼          ▼          ▼                            │
│    ┌────────┐ ┌────────┐ ┌────────┐                      │
│    │ 电子秤  │ │ 打印机  │ │ 扫码枪  │  ...                 │
│    │ Serial │ │ ESC/POS│ │ USB HID│                      │
│    └────────┘ └────────┘ └────────┘                      │
│                      Android 原生层                         │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 插件桥接架构（关键）

```
┌────────────────────────────────────────────────────────────────┐
│                    插件加载流程                                 │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  1. index.html 加载 cordova.js                                │
│              ↓                                                 │
│  2. cordova.js 定义 HailinHardware 对象                       │
│     ├── scaleConnect()                                        │
│     ├── printerConnect()                                      │
│     ├── addListener()                                         │
│     └── _callNative()                                         │
│              ↓                                                 │
│  3. 挂载到 window.HailinHardware                              │
│              ↓                                                 │
│  4. 挂载到 Capacitor.Plugins.HailinHardware                  │
│              ↓                                                 │
│  5. hardwareService.ts 检测并使用插件                        │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 3.3 电子秤数据流

```
┌────────────────────────────────────────────────────────────────┐
│                    电子秤数据流（双重通道）                       │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────┐                                                 │
│  │ 电子秤    │  顶尖 OS2X-15                                    │
│  │  串口    │  /dev/ttyS4, 9600, SOKI协议                      │
│  └────┬─────┘                                                 │
│       │ RS232/USB                                              │
│       ▼                                                        │
│  ┌──────────┐                                                 │
│  │ Android  │  FileInputStream 读取                           │
│  │ 串口驱动  │                                                 │
│  └────┬─────┘                                                 │
│       │                                                        │
│       ▼                                                        │
│  ┌──────────────────────────────────┐                        │
│  │ HailinHardwarePlugin.java        │                        │
│  │  ├── ReaderThread (20ms采样)     │                        │
│  │  ├── parseScaleData() 解析协议   │                        │
│  │  ├── notifyListeners() 通道1     │→ Capacitor Bridge      │
│  │  └── sendToWebView()   通道2     │→ WebView.evaluateJS   │
│  └──────────────┬───────────────────┘                        │
│                 │                                              │
│       ┌─────────┴─────────┐                                   │
│       ▼                   ▼                                   │
│  ┌─────────────┐   ┌─────────────────┐                       │
│  │ 通道1       │   │ 通道2            │                       │
│  │ addListener │   │ HailinHardware   │                       │
│  │             │   │ Bridge()         │                       │
│  └──────┬──────┘   └────────┬────────┘                       │
│         │                   │                                 │
│         └─────────┬─────────┘                                 │
│                   ▼                                           │
│         ┌─────────────────┐                                   │
│         │ emit('weight    │                                   │
│         │ Changed')       │                                   │
│         └────────┬────────┘                                   │
│                  ▼                                            │
│         ┌─────────────────┐                                   │
│         │ setScaleWeight()│                                   │
│         │ → React UI      │                                   │
│         └─────────────────┘                                   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 四、核心模块说明

### 4.1 硬件服务层 (hardwareService.ts)

```typescript
// 核心功能
- getHardwarePlugin()      // 获取原生插件
- bindPluginListeners()     // 绑定事件监听
- bindWebViewBridge()      // WebView桥接（备用）
- scaleConnect()           // 连接电子秤
- scaleDisconnect()         // 断开连接
- scaleReadWeight()         // 读取重量
```

### 4.2 收银设备管理 (posDevices.ts)

```typescript
// AndroidScaleDevice 类
- static isAndroidNative()     // 检测是否原生平台
- static getAndroidPlugin()    // 获取原生插件
- requestAndConnect()         // 请求权限并连接
- disconnect()                 // 断开连接
- readWeight()                 // 读取重量
```

### 4.3 Android 原生插件 (HailinHardwarePlugin.java)

```java
// 电子秤模块
- scaleConnect()              // 连接秤
- scaleDisconnect()           // 断开连接
- scaleReadWeight()           // 读取重量
- scaleTare()                 // 去皮
- scaleZero()                 // 归零
- listSerialPorts()           // 枚举串口

// 打印机模块
- printerConnect()            // 连接打印机
- printerPrintText()          // 打印文本
- printerCut()                 // 切纸

// 其他硬件
- openCashDrawer()            // 打开钱箱
- showOnCustomerDisplay()     // 客显屏
```

### 4.4 串口连接流程

```
用户点击连接
     ↓
SettingsPage → posDevices.requestAndConnect()
     ↓
hardwareService.scaleConnect({port, baudRate})
     ↓
cordova.js.scaleConnect() → _callNative()
     ↓
HailinHardwarePlugin.scaleConnect(call)
     ↓
SerialConnection.connectWithDetail()
     ↓
┌────────────────────────────────────────┐
│  设备类型判断                           │
│  ttyS* (主板串口) → connectBoardSerial │
│  ttyUSB*/ACM* → tryUsbConnection       │
└────────────────────────────────────────┘
     ↓
打开设备文件 → 启动ReaderThread
     ↓
持续读取串口数据 → 解析 → 发送事件
```

---

## 五、构建流程

### 5.1 前端构建

```bash
cd apps/pos-app

# 开发模式
pnpm dev

# 生产构建
pnpm build

# 同步到Android
pnpm sync
```

### 5.2 Android 构建

```bash
cd apps/pos-app/android

# 构建 Debug APK
./gradlew assembleDebug

# 清理并构建
./gradlew clean assembleDebug

# APK 位置
# android/app/build/outputs/apk/debug/app-debug.apk
```

### 5.3 完整构建流程

```bash
# 1. 前端构建
cd apps/pos-app
pnpm build

# 2. 同步到Android（自动恢复cordova.js）
pnpm sync

# 3. Android构建
cd android
export ANDROID_HOME=/opt/android-sdk
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
./gradlew assembleDebug

# 4. 复制APK
cp android/app/build/outputs/apk/debug/app-debug.apk public/hailin-pos-vX.X.XXX.apk

# 5. 上传到对象存储
node scripts/upload-apk.mjs
```

---

## 六、关键配置文件

### 6.1 package.json 脚本

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "sync": "npx cap sync android && node -e \"require('fs').copyFileSync('public/cordova.js','android/app/src/main/assets/public/cordova.js');require('fs').copyFileSync('public/cordova_plugins.js','android/app/src/main/assets/public/cordova_plugins.js');\"",
    "android:build": "npm run build && npm run sync"
  }
}
```

**重要**：`pnpm sync` 脚本会自动在 `cap sync` 后恢复 `cordova.js`，因为 `cap sync` 会把它覆盖为空文件。

### 6.2 AndroidManifest.xml 权限

```xml
<!-- 串口通信 -->
<uses-permission android:name="android.permission.USB_PERMISSION" />
<uses-feature android:name="android.hardware.usb.host" />

<!-- 网络（用于AI识别等） -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

---

## 七、版本管理

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| v1.0.223 | - | 修复cap sync覆盖cordova.js问题 |
| v1.0.222 | - | 增强插件检测日志 |
| v1.0.219 | - | 重建cordova.js插件桥接 |
| v1.0.218 | - | 简化串口连接逻辑 |
| v1.0.217 | - | 增强调试信息 |
| v1.0.216 | - | 添加枚举串口设备功能 |
| v1.0.215 | - | 区分主板串口和USB设备 |
| v1.0.214 | - | 双通道事件传递方案 |

---

## 八、调试方法

### 8.1 LogCat 日志过滤

```bash
# 查看硬件服务日志
adb logcat | grep -E "\[硬件服务\]|\[HailinHardware\]|\[秤\]"

# 查看串口枚举
adb logcat | grep "\[枚举串口\]"

# 查看秤连接
adb logcat | grep "\[秤-主板串口\]\|\[秤\].*连接"
```

### 8.2 关键日志点

| 日志前缀 | 含义 |
|----------|------|
| `[硬件服务]` | 前端硬件服务层 |
| `[HailinHardware]` | cordova.js 插件桥接 |
| `[Cordova]` | Cordova 初始化 |
| `[秤]` | 电子秤相关 |
| `[秤-主板串口]` | 主板串口连接 |
| `[枚举串口]` | 串口设备枚举 |

### 8.3 常见问题排查

| 问题 | 检查点 |
|------|--------|
| 插件未找到 | cordova.js 是否正确打包(13544字节) |
| 串口连接失败 | /dev/ttyS4 是否存在，权限是否正确 |
| 称重数据不显示 | addListener 是否正确绑定 |
| 数据延迟 | 检查20ms采样间隔 |

---

## 九、联系方式

- **技术支持**: 海邻到家技术团队
- **文档版本**: v1.0
- **最后更新**: 2024年
