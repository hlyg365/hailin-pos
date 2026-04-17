# 海邻到家收银台 - Android APK 构建指南

## 下载地址

打包文件：`/workspace/projects/hailin-pos-dist.tar.gz` (2.1MB)

---

## 构建前准备

### 1. 环境要求

- **Node.js**: v18+ (建议 v20 LTS)
- **Java JDK**: JDK 17+ (必须)
- **Android SDK**: API 33+ (Android 13)
- **Gradle**: 8.x (项目内已包含)

### 2. Windows/macOS/Linux 通用流程

```bash
# 解压项目
tar -xzvf hailin-pos-dist.tar.gz
cd hailin-pos

# 进入 Android 目录
cd android

# Windows 用户确保使用管理员权限
# macOS/Linux 用户确保 gradlew 可执行
chmod +x gradlew

# 构建 Debug APK
./gradlew assembleDebug

# 或构建 Release APK (需要签名)
./gradlew assembleRelease
```

### 3. Windows 详细步骤

```bash
# 1. 安装 Node.js (如果没有)
# 下载: https://nodejs.org/

# 2. 安装 JDK 17+
# 下载: https://adoptium.net/

# 3. 安装 Android Studio
# 下载: https://developer.android.com/studio

# 4. 设置环境变量
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.x.x
set ANDROID_HOME=C:\Users\<用户名>\AppData\Local\Android\Sdk

# 5. 打开 Android Studio → SDK Manager → 安装 SDK Platform 33

# 6. 构建 APK
cd android
gradlew.bat assembleDebug
```

### 4. macOS 详细步骤

```bash
# 1. 安装 Homebrew (如果没有)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. 安装 JDK
brew install openjdk@17
brew install --cask android-studio

# 3. 配置环境变量 (添加到 ~/.zshrc)
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
export ANDROID_HOME=~/Library/Android/sdk

# 4. 构建 APK
cd android
./gradlew assembleDebug
```

### 5. Ubuntu/Debian 详细步骤

```bash
# 1. 安装 JDK
sudo apt update
sudo apt install openjdk-17-jdk

# 2. 安装 Android SDK
mkdir -p ~/Android/Sdk/cmdline-tools
cd ~/Android/Sdk/cmdline-tools
wget https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip
unzip commandlinetools-linux-11076708_latest.zip
mv cmdline-tools latest

# 3. 安装 SDK Platform
export ANDROID_HOME=~/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools
yes | sdkmanager --licenses
sdkmanager "platforms;android-33" "build-tools;33.0.0"

# 4. 构建 APK
cd android
./gradlew assembleDebug
```

---

## APK 输出位置

构建完成后，APK 文件位于：

```
android/app/build/outputs/apk/debug/app-debug.apk
```

或 Release 版本：

```
android/app/build/outputs/apk/release/app-release.apk
```

---

## 安装测试

```bash
# 通过 ADB 安装到设备
adb install app-debug.apk

# 或直接将 APK 复制到手机安装
```

---

## 应用信息

- **包名**: com.hailin.pos
- **应用名**: 海邻到家
- **最低系统**: Android 7.0 (API 24)
- **目标系统**: Android 13 (API 33)
