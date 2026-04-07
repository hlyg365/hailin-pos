# 🖥️ 本地构建 APK - 快速开始

## 📋 前置条件

你只需要一台电脑，安装以下3个软件：

| 软件 | 安装地址 | 安装时间 |
|------|----------|----------|
| Node.js | https://nodejs.org | 3分钟 |
| Android Studio | https://developer.android.com/studio | 10分钟 |
| Java JDK | https://adoptium.net | 3分钟 |

---

## 🚀 第一步：安装 Node.js

### Windows / Mac / Linux
访问 https://nodejs.org，点击下载按钮安装。

验证安装：
```bash
node -v
# 应显示 v18.x.x 或 v20.x.x
```

---

## ☕ 第二步：安装 Java JDK

### 下载地址
https://adoptium.net/temurin/releases/?version=17

选择：
- Version: **17**
- OS: 你的系统
- Package: **.msi** (Windows) 或 **.pkg** (Mac)

### 验证安装
```bash
java -version
# 应显示 openjdk version "17.x.x"
```

---

## 📱 第三步：安装 Android Studio

### 下载地址
https://developer.android.com/studio

### 安装时勾选
- ✅ Android SDK
- ✅ Android SDK Platform
- ✅ Android Virtual Device

### 配置环境变量

#### Windows
打开 PowerShell（管理员），执行：
```powershell
# 设置 ANDROID_HOME（根据实际安装路径调整）
[Environment]::SetEnvironmentVariable("ANDROID_HOME", "$env:LOCALAPPDATA\Android\Sdk", "User")

# 设置 JAVA_HOME
[Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Eclipse Adoptium\jdk-17.0.5.8-hotspot", "User")
```

#### Mac
```bash
echo 'export ANDROID_HOME=~/Library/Android/sdk' >> ~/.zshrc
echo 'export JAVA_HOME=$(/usr/libexec/java_home)' >> ~/.zshrc
source ~/.zshrc
```

#### Linux
```bash
echo 'export ANDROID_HOME=~/Android/Sdk' >> ~/.bashrc
echo 'export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64' >> ~/.bashrc
source ~/.bashrc
```

---

## 📁 第四步：获取项目代码

### 如果你有扣子平台代码
下载并解压到本地文件夹

### 如果是全新开始
```bash
git clone <你的仓库地址>
cd hailin-pos
```

---

## 📦 第五步：安装依赖并构建

打开终端，进入项目目录，执行：

```bash
# 安装 pnpm
npm install -g pnpm

# 安装项目依赖
pnpm install

# 构建 Web 应用
pnpm build

# 同步到 Android
npx cap sync android

# 构建 APK
cd android

# Windows
gradlew.bat assembleDebug

# Mac/Linux
chmod +x gradlew
./gradlew assembleDebug

cd ..
```

---

## 📍 APK 文件位置

```
项目目录/android/app/build/outputs/apk/debug/app-debug.apk
```

---

## ⏱️ 预计时间

| 步骤 | 时间 |
|------|------|
| 安装 Node.js | 3分钟 |
| 安装 Java | 3分钟 |
| 安装 Android Studio | 15分钟 |
| 配置环境变量 | 5分钟 |
| 安装依赖 | 5分钟 |
| 构建 APK | 10分钟 |
| **总计** | **约40分钟** |

---

## ⚠️ 常见问题

### Q: 构建卡在 "Downloading Gradle..."
**A**: 这是正常的，首次下载需要5-10分钟。如果太慢，可以配置国内镜像。

### Q: 报错 "ANDROID_HOME is not set"
**A**: 环境变量没配置好，检查 ANDROID_HOME 是否指向正确的 SDK 路径。

### Q: 报错 "Java not found"
**A**: 检查 JAVA_HOME 是否正确配置。

---

## 📞 遇到问题？

请告诉我：
1. 在哪一步遇到问题？
2. 完整的错误信息是什么？

我来帮你解决！
