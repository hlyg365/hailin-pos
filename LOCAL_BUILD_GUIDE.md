# 🎯 海邻到家店长助手 - 本地APK构建指南

## 📋 概述

本指南将帮助你在本地电脑上构建海邻到家店长助手APP（APK文件）。

### 构建结果
- APK文件：可用于Android手机安装
- 大小：约20-50MB
- 支持：Android 5.0+

---

## 🖥️ 前置条件

### 硬件要求
| 项目 | 最低配置 | 推荐配置 |
|------|----------|----------|
| CPU | 4核 | 8核 |
| 内存 | 8GB | 16GB |
| 硬盘 | 10GB可用 | 20GB可用 |
| 网络 | 稳定网络 | 稳定网络 |

### 软件要求

| 软件 | 版本 | 下载地址 |
|------|------|----------|
| Node.js | 18+ | https://nodejs.org |
| Java JDK | 11+ | https://adoptium.net |
| Android Studio | 最新版 | https://developer.android.com/studio |

---

## 📥 第一步：安装 Node.js

### Windows

1. 访问 https://nodejs.org
2. 下载 LTS 版本（推荐 v18.x 或 v20.x）
3. 运行安装包，一路点击"Next"
4. 验证安装：
```powershell
node -v
# 应显示 v18.x.x 或更高

npm -v
# 应显示 9.x.x 或更高
```

### Mac

```bash
# 使用 Homebrew 安装
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install node

# 或使用 nvm 安装（推荐）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

### Linux (Ubuntu/Debian)

```bash
# 添加 Node.js 仓库
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 验证安装
node -v
npm -v
```

---

## ☕ 第二步：安装 Java JDK

### Windows

1. 访问 https://adoptium.net/temurin/releases/?version=17
2. 选择：
   - **Version**: 17 (或 11)
   - **OS**: Windows
   - **Architecture**: x64
   - **Package Type**: .msi
3. 下载并安装
4. 设置环境变量：

```powershell
# PowerShell 管理员模式
[Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Eclipse Adoptium\jdk-17.0.5.8-hotspot", "User")
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.5.8-hotspot"
```

### Mac

```bash
# 使用 Homebrew 安装
brew install openjdk@17

# 配置环境变量
echo 'export JAVA_HOME=$(/usr/libexec/java_home)' >> ~/.zshrc
source ~/.zshrc
```

### Linux

```bash
# 安装 OpenJDK 17
sudo apt update
sudo apt install -y openjdk-17-jdk

# 验证安装
java -version
# 应显示 openjdk version "17.x.x"
```

---

## 📱 第三步：安装 Android Studio

### 下载与安装

1. 访问 https://developer.android.com/studio
2. 下载 Android Studio
3. 运行安装程序，选择"Custom"安装
4. 确保勾选以下组件：
   - ✅ Android SDK
   - ✅ Android SDK Platform
   - ✅ Android Virtual Device
   - ✅ Performance (Intel HAXM)
   - ✅ Android SDK Command-line Tools

### 配置 Android SDK 环境变量

#### Windows

```powershell
# PowerShell 管理员模式
# Android SDK 默认安装位置
$ANDROID_SDK = "$env:LOCALAPPDATA\Android\Sdk"

[Environment]::SetEnvironmentVariable("ANDROID_HOME", $ANDROID_SDK, "User")
[Environment]::SetEnvironmentVariable("ANDROID_SDK_ROOT", $ANDROID_SDK, "User")

# 添加到 PATH
$env:PATH += ";$ANDROID_SDK\platform-tools;$ANDROID_SDK\tools;$ANDROID_SDK\tools\bin"

# 永久添加到 PATH
[Environment]::SetEnvironmentVariable(
    "PATH",
    "$env:PATH;$ANDROID_SDK\platform-tools;$ANDROID_SDK\tools;$ANDROID_SDK\tools\bin",
    "User"
)
```

#### Mac/Linux

```bash
# 添加到 ~/.bashrc 或 ~/.zshrc
echo 'export ANDROID_HOME=~/Library/Android/sdk' >> ~/.zshrc
echo 'export ANDROID_SDK_ROOT=~/Library/Android/sdk' >> ~/.zshrc
echo 'export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools:$ANDROID_HOME/tools/bin' >> ~/.zshrc

source ~/.zshrc
```

### 验证配置

```bash
echo $ANDROID_HOME
# 应显示 SDK 路径

ls $ANDROID_HOME
# 应显示 platforms, build-tools 等目录
```

### 安装 SDK 组件（可选）

如果 Android Studio 安装过程中跳过了某些组件：

1. 打开 Android Studio
2. 点击 File → Settings → SDK Manager
3. 安装以下组件：
   - Android SDK Platform 34
   - Android SDK Build-Tools 34.0.0
   - Android SDK Platform-Tools

---

## 📁 第四步：获取项目代码

### 方式1：从扣子平台导出

如果你使用的是扣子平台：
1. 访问扣子平台项目
2. 下载/导出项目代码到本地

### 方式2：从Git仓库克隆

```bash
# 克隆项目（需要仓库地址）
git clone https://your-repo.com/hailin-pos.git
cd hailin-pos

# 如果没有仓库，先创建
# 在 GitHub/GitLab 创建空仓库
git init
git add .
git commit -m "Initial commit"
git remote add origin https://your-repo.com/hailin-pos.git
git push -u origin main
```

---

## 📦 第五步：安装项目依赖

```bash
# 进入项目目录
cd hailin-pos

# 使用 pnpm（推荐）
npm install -g pnpm  # 全局安装 pnpm
pnpm install

# 或使用 npm
npm install

# 或使用 yarn
yarn install
```

等待依赖安装完成，这可能需要5-10分钟。

---

## 🔨 第六步：同步 Capacitor

```bash
# 构建 Web 应用
pnpm build

# 同步到 Android 项目
npx cap sync android
```

---

## 📱 第七步：构建 APK

### 方式A：Debug 版本（推荐测试使用）

```bash
cd android

# Windows
gradlew.bat assembleDebug

# Mac/Linux
chmod +x gradlew
./gradlew assembleDebug

cd ..
```

### 方式B：Release 版本（需要签名）

```bash
cd android

# 先生成签名密钥
# keytool -genkey -v -keystore my-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias

# 配置 signingConfigs（编辑 android/app/build.gradle）
# 然后构建
./gradlew assembleRelease

cd ..
```

---

## 📍 APK 文件位置

构建成功后，APK文件位于：

```
android/app/build/outputs/apk/debug/app-debug.apk
```

完整路径示例：
- **Windows**: `C:\path\to\hailin-pos\android\app\build\outputs\apk\debug\app-debug.apk`
- **Mac**: `/Users/name/projects/hailin-pos/android/app/build/outputs/apk/debug/app-debug.apk`
- **Linux**: `/home/name/projects/hailin-pos/android/app/build/outputs/apk/debug/app-debug.apk`

---

## 📲 第八步：安装到手机

### 方法1：复制APK到手机

1. 用数据线连接手机和电脑
2. 将 APK 文件复制到手机存储
3. 在手机上打开APK文件安装

### 方法2：使用 ADB 安装

```bash
# 连接手机后启用 USB 调试
adb devices  # 查看已连接设备

adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### 方法3：扫描二维码安装

1. 将APK上传到服务器或对象存储
2. 生成下载链接的二维码
3. 手机扫描二维码下载安装

---

## ⚠️ 常见问题

### Q1: Gradle 构建失败

**错误**: `Gradle build failed`

**解决方案**:
```bash
# 清理并重新构建
cd android
./gradlew clean
./gradlew assembleDebug
```

### Q2: Java 版本不兼容

**错误**: `Unsupported Java version`

**解决方案**:
```bash
# 检查 Java 版本
java -version

# 确保是 Java 11 或 17
# 如果需要，配置 JAVA_HOME 环境变量
export JAVA_HOME=/path/to/jdk-17
```

### Q3: Android SDK 未找到

**错误**: `ANDROID_HOME is not set`

**解决方案**:
```bash
# 确认 Android SDK 安装位置
# Windows: C:\Users\<用户名>\AppData\Local\Android\Sdk
# Mac: ~/Library/Android/sdk

# 设置环境变量
export ANDROID_HOME=~/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

### Q4: 依赖下载慢

**解决方案**:
```bash
# 使用国内镜像
npm config set registry https://registry.npmmirror.com
pnpm config set registry https://registry.npmmirror.com

# 或者配置 Gradle 镜像
# 在 android/gradle.properties 添加：
org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.enableJetifier=true
```

### Q5: 签名错误

**错误**: `Keystore not found` 或 `Invalid keystore format`

**解决方案**:
```bash
# 创建新的签名密钥
keytool -genkey -v -keystore my-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias
```

---

## 🚀 快速命令汇总

```bash
# 完整构建流程
cd hailin-pos
pnpm install
pnpm build
npx cap sync android
cd android && ./gradlew assembleDebug && cd ..

# APK位置
ls android/app/build/outputs/apk/debug/

# 安装到手机
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 📞 获取帮助

如果遇到问题，请提供：
1. 完整的错误信息
2. 操作系统版本
3. 已安装软件的版本
   - `node -v`
   - `java -version`
   - `echo $ANDROID_HOME`

---

**文档版本**: v1.0
**更新时间**: 2024-04-07
**适用版本**: 海邻到家店长助手 v1.0+
