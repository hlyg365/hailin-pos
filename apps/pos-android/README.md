# 海邻到家收银台 - Android APK 打包指南

## 概述

本指南说明如何在 Windows 开发电脑上为 Android 双屏称重收银一体机打包 APK。

## 系统要求

- **操作系统**: Windows 10/11 (64-bit)
- **内存**: 8GB+
- **硬盘**: 20GB+
- **Java**: JDK 11+
- **Android SDK**: Android Studio 或命令行工具

## 构建步骤

### 方式一：使用 Android Studio（推荐）

#### 1. 安装 Android Studio

下载地址: https://developer.android.com/studio

安装时勾选:
- Android SDK
- Android SDK Platform-Tools
- Android SDK Build-Tools

#### 2. 导入项目

1. 打开 Android Studio
2. 选择 "Open an Existing Project"
3. 选择 `apps/pos-android/android` 文件夹
4. 等待 Gradle 同步完成

#### 3. 安装依赖

Android Studio 会自动下载以下依赖:

```gradle
dependencies {
    implementation 'com.getcapacitor:core:5.x'
    implementation 'com.getcapacitor:android:5.x'
    implementation 'io.github.mikeras73:UsbSerial:2024.1.15'
}
```

#### 4. 构建 APK

```bash
# 方法1: Android Studio 菜单
Build → Build Bundle(s) / APK(s) → Build APK(s)

# 方法2: 命令行
cd apps/pos-android/android
./gradlew assembleDebug
```

#### 5. 获取 APK

APK 文件位置:
```
apps/pos-android/android/app/build/outputs/apk/debug/app-debug.apk
```

---

### 方式二：命令行构建

#### 1. 安装环境

```bash
# 安装 Node.js (如果还没有)
# 下载地址: https://nodejs.org

# 安装 Java JDK 11+
# 下载地址: https://adoptium.net

# 安装 Android SDK 命令行工具
# 下载地址: https://developer.android.com/studio#command-line-tools-only
```

#### 2. 设置环境变量

```bash
# JAVA_HOME (指向 JDK 安装目录)
setx JAVA_HOME "C:\Program Files\Eclipse Adoptium\jdk-11.0.20.8-hotspot"

# ANDROID_HOME (指向 Android SDK)
setx ANDROID_HOME "C:\Users\YourName\AppData\Local\Android\Sdk"

# 将以下路径添加到 PATH
# %JAVA_HOME%\bin
# %ANDROID_HOME%\platform-tools
# %ANDROID_HOME%\tools
# %ANDROID_HOME%\tools\bin
```

#### 3. 接受协议

```bash
# 打开 SDK Manager 并接受协议
%ANDROID_HOME%\tools\bin\sdkmanager --licenses
```

#### 4. 构建

```bash
# 进入 Android 目录
cd apps/pos-android\android

# 清理
.\gradlew clean

# 构建 Debug APK
.\gradlew assembleDebug

# 构建 Release APK (需要签名)
.\gradlew assembleRelease
```

---

## 一体机安装

### 传输 APK

#### 方法1: U盘安装

1. 将 APK 复制到 U盘
2. 将 U盘插入一体机
3. 在一体机上打开文件管理器
4. 点击 APK 文件安装

#### 方法2: 网络安装

```bash
# 启动 ADB 服务
adb start-server

# 通过 IP 连接一体机
adb connect <一体机IP>:5555

# 安装 APK
adb install -r app-debug.apk
```

### USB 权限设置

首次运行时，一体机会请求以下权限:

- **USB 设备访问**: 用于连接电子秤、打印机
- **存储访问**: 用于保存日志

请允许这些权限。

---

## 硬件连接指南

### 电子秤连接

```
一体机 USB OTG 接口
      │
      ├── USB 转串口模块
      │         │
      │         └── 电子秤 (RS232)
      │
      └── USB 扫码枪
```

**支持的电子秤协议**:
- 通用串口协议 (9600, 8N1)
- CAS 秤协议
- 上海耀华协议

### 打印机连接

一体机通常自带小票打印机，通过 USB 直连。

**支持的品牌**:
- 佳博 (Gainscha)
- 芯烨 (Xinye)
- 爱普生 (Epson)
-之星 (Star)

### 钱箱连接

钱箱通常连接到打印机的 RJ11 接口。

---

## 故障排除

### 1. 构建失败: Java 版本不兼容

```bash
# 检查 Java 版本
java -version

# 如果是 Java 17+，可能需要降级
# 或在 gradle.properties 中设置:
org.gradle.java.home=C:/path/to/jdk11
```

### 2. Gradle 同步失败

```bash
# 清除缓存
cd apps/pos-android/android
rmdir /s /q .gradle
rmdir /s /q build
.\gradlew clean
```

### 3. USB 设备无法连接

- 检查 USB OTG 线是否正常
- 确认一体机 USB 驱动已安装
- 在一体机设置中开启 "USB 调试"

### 4. 打印无响应

- 检查打印机电源
- 确认 USB 连接正常
- 重启一体机

---

## 完整构建脚本

```batch
@echo off
echo ===============================
echo 海邻到家收银台 - APK 构建脚本
echo ===============================

cd /d "%~dp0\apps\pos-android\android"

echo [1/4] 清理...
call .\gradlew clean

echo [2/4] 同步 Gradle...
call .\gradlew --refresh-dependencies

echo [3/4] 构建 Debug APK...
call .\gradlew assembleDebug

echo [4/4] 完成!
echo.
echo APK 位置:
dir /s /b app\build\outputs\apk\debug\*.apk

pause
```

---

## 技术支持

如有问题，请联系海邻到家技术支持团队。
