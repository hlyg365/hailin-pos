# 海邻到家收银台 - Android 应用构建指南

## 项目概述

本项目使用 Capacitor 将 Next.js Web 应用封装为 Android 原生应用，支持扫码枪、蓝牙打印机等硬件集成。

## 环境要求

### 开发环境
- Node.js 18+
- pnpm 包管理器

### Android 构建环境
- Android Studio
- JDK 11 或更高版本
- Android SDK (API Level 33+)
- Gradle

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 构建项目

```bash
pnpm run build
```

### 3. 同步到 Android 项目

```bash
npx cap sync android
```

## Android APK 构建步骤

### 方式 1: 使用 Android Studio（推荐）

1. **打开 Android 项目**
   ```bash
   npx cap open android
   ```
   这将打开 Android Studio 并加载项目

2. **配置签名**
   - 在 Android Studio 中：Build > Generate Signed Bundle/APK
   - 选择 "APK"
   - 创建或选择密钥库文件
   - 填写密钥信息

3. **构建 Release APK**
   - 选择 "release" 构建变体
   - 点击 "Finish"
   - APK 文件将生成在 `android/app/release/app-release.apk`

### 方式 2: 使用命令行

1. **配置签名（首次使用）**
   ```bash
   cd android
   # 创建密钥库
   keytool -genkey -v -keystore release.keystore -alias hailin-pos -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **配置 Gradle**
   在 `android/gradle.properties` 中添加：
   ```properties
   MYAPP_RELEASE_STORE_FILE=release.keystore
   MYAPP_RELEASE_KEY_ALIAS=hailin-pos
   MYAPP_RELEASE_STORE_PASSWORD=your_password
   MYAPP_RELEASE_KEY_PASSWORD=your_password
   ```

3. **构建 APK**
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

4. **获取 APK**
   - Release APK: `android/app/build/outputs/apk/release/app-release.apk`
   - Debug APK: `android/app/build/outputs/apk/debug/app-debug.apk`

## 硬件功能配置

### 已集成的硬件

1. **USB 扫码枪**
   - 自动识别（作为键盘输入设备）
   - 无需额外配置

2. **摄像头扫码**
   - 需要相机权限
   - 支持条码和二维码
   - 使用 `@capacitor-community/barcode-scanner` 插件

3. **蓝牙打印机**
   - 支持蓝牙热敏打印机
   - ESC/POS 指令集
   - 使用 `@capacitor-community/bluetooth-le` 插件

### Android 权限

应用已配置以下权限（`android/app/src/main/AndroidManifest.xml`）：

```xml
<!-- 相机权限（扫码） -->
<uses-permission android:name="android.permission.CAMERA" />

<!-- 蓝牙权限（打印机） -->
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" />

<!-- 位置权限（蓝牙扫描需要） -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />

<!-- USB 权限（扫码枪） -->
<uses-permission android:name="android.permission.USB_HOST" />
```

## 开发模式

### 运行开发服务器

```bash
pnpm run dev
```

### 在 Android 设备上调试

1. **启用开发者选项**
   - 设置 > 关于手机 > 连续点击"版本号"7次

2. **启用 USB 调试**
   - 开发者选项 > USB 调试

3. **连接设备并同步**
   ```bash
   npx cap sync android
   npx cap run android
   ```

## 故障排查

### 构建失败

1. **清理并重新构建**
   ```bash
   cd android
   ./gradlew clean
   ./gradlew assembleDebug
   ```

2. **检查 Java 版本**
   ```bash
   java -version
   ```
   确保使用 JDK 11 或更高版本

3. **更新 Gradle**
   ```bash
   cd android
   ./gradlew wrapper --gradle-version=8.0
   ```

### 硬件功能不工作

1. **检查权限**
   - 设置 > 应用 > 海邻到家收银台 > 权限
   - 确保相机、蓝牙、位置权限已授予

2. **查看日志**
   ```bash
   adb logcat | grep -E "(Capacitor|Barcode|Bluetooth)"
   ```

3. **测试设备连接**
   - USB 扫码枪：插入后在记事本中测试是否能输入
   - 蓝牙打印机：在系统设置中配对设备

## 项目结构

```
├── src/
│   ├── app/                  # Next.js 应用
│   │   └── pos/              # 收银台页面
│   │       ├── page.tsx      # 收银台主页
│   │       └── hardware/     # 硬件配置页面
│   ├── components/           # 组件
│   ├── hooks/                # 自定义 Hooks
│   │   └── use-pos-hardware.ts  # 硬件集成 Hook
│   └── lib/                  # 工具库
│       └── hardware-service.ts  # 硬件服务
├── android/                  # Android 原生项目
│   └── app/
│       └── src/main/
│           ├── AndroidManifest.xml  # Android 清单文件
│           └── assets/              # Web 资源
├── capacitor.config.ts       # Capacitor 配置
└── package.json
```

## 配置说明

### 应用信息

- **应用 ID**: com.hailin.pos
- **应用名称**: 海邻到家收银台
- **包名**: com.hailin.pos

### Capacitor 配置

```typescript
{
  appId: 'com.hailin.pos',
  appName: '海邻到家收银台',
  webDir: '.next',
  server: {
    androidScheme: 'https',
    cleartext: true,
    url: 'http://localhost:5000',
  }
}
```

## 发布流程

1. **版本号管理**
   - 在 `android/app/build.gradle` 中更新版本号
   - `versionCode`: 整数，每次发布递增
   - `versionName`: 版本字符串（如 "1.0.0"）

2. **构建 Release APK**
   - 按照上述"Android APK 构建步骤"操作

3. **测试**
   - 在多个设备上测试
   - 验证硬件功能

4. **发布到应用商店**
   - 准备应用截图和描述
   - 上传 APK 到各大应用商店

## 技术支持

如遇到问题，请检查：
1. Capacitor 官方文档: https://capacitorjs.com/docs
2. 扫码插件文档: https://github.com/capacitor-community/barcode-scanner
3. 蓝牙插件文档: https://github.com/capacitor-community/bluetooth-le

## 许可证

Copyright © 2026 海邻到家
