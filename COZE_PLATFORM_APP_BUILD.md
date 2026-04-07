# 扣子平台部署下的 APP 构建方案

## 📋 方案概览

| 方案 | 实现难度 | 效果 | 推荐场景 |
|------|----------|------|----------|
| **方案A：本地构建** | ⭐⭐ 中 | ⭐⭐⭐⭐⭐ 原生APP | 有本地电脑 |
| **方案B：GitHub Actions** | ⭐⭐⭐ 中 | ⭐⭐⭐⭐⭐ 原生APP | 有GitHub仓库 |
| **方案C：PWA安装** | ⭐ 简单 | ⭐⭐⭐⭐ WebAPP | **立即可用** |
| **方案D：在线构建** | ⭐ 简单 | ⭐⭐⭐⭐ 原生APP | 免配置 |

---

## 🅰️ 方案A：本地构建 APK（推荐）

### 前提条件

你需要一台 **Windows/Mac/Linux 电脑**，并安装以下软件：

| 软件 | 下载地址 | 大小 |
|------|----------|------|
| Node.js 18+ | https://nodejs.org | ~30MB |
| Android Studio | https://developer.android.com/studio | ~1GB |
| Java JDK 11+ | https://adoptium.net | ~100MB |

### 安装步骤

#### 1. 安装 Node.js

```bash
# Windows: 下载安装包直接安装
# Mac: brew install node
# Linux: 
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

验证安装：
```bash
node -v  # 应显示 v18.x.x
npm -v   # 应显示 9.x.x
```

#### 2. 安装 Android Studio

1. 下载 Android Studio：https://developer.android.com/studio
2. 安装时勾选：
   - ✅ Android SDK
   - ✅ Android Virtual Device
3. 安装完成后，设置环境变量：

```bash
# Windows (PowerShell 管理员)
[Environment]::SetEnvironmentVariable("ANDROID_HOME", "C:\Users\你的用户名\AppData\Local\Android\Sdk", "User")
[Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Eclipse Adoptium\jdk-17.0.5.8-hotspot", "User")
$env:Path += ";$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\tools"

# Mac/Linux (~/.bashrc 或 ~/.zshrc)
export ANDROID_HOME=~/Android/Sdk
export JAVA_HOME=$(/usr/libexec/java_home)
export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools
```

#### 3. 克隆项目到本地

```bash
git clone https://你的仓库地址/hailin-pos.git
cd hailin-pos
npm install  # 或 pnpm install
```

#### 4. 构建 APK

```bash
# Windows
npm run build:android

# Mac/Linux
chmod +x ./scripts/build-app.sh
./scripts/build-app.sh
```

#### 5. 获取 APK 文件

```
项目目录/android/app/build/outputs/apk/debug/app-debug.apk
```

#### 6. 部署 APK

**方式1：复制到扣子平台public目录**
```bash
# 如果你有扣子平台代码仓库权限
cp android/app/build/outputs/apk/debug/app-debug.apk public/assistant.apk
git add . && git commit -m "添加APK"
git push
```

**方式2：上传到对象存储**
```bash
# 阿里云OSS
ossutil cp app-debug.apk oss://your-bucket/assistant.apk

# 腾讯云COS
cos-cli upload app-debug.apk cos://your-bucket/assistant.apk

# AWS S3
aws s3 cp app-debug.apk s3://your-bucket/assistant.apk
```

**方式3：上传到CDN**
```bash
# 使用FTP/SCP上传到服务器
scp app-debug.apk user@server:/var/www/html/assistant.apk
```

---

## 🅱️ 方案B：GitHub Actions 自动构建

### 前提条件

1. 项目代码托管在 GitHub
2. GitHub 账户

### 配置步骤

#### 1. 创建 GitHub Secrets

在 GitHub 仓库 Settings → Secrets 添加：

| Secret名称 | 值 | 说明 |
|------------|-----|------|
| `ANDROID_SDK_TOKEN` | 你的Android SDK许可令牌 | 免费申请 |

#### 2. 创建工作流文件

在项目根目录创建 `.github/workflows/build-apk.yml`：

```yaml
name: Build Android APK

on:
  push:
    branches: [main]
    tags:
      - 'v*'
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'pnpm'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install

      - name: Setup Android SDK
        uses: android-actions/setup-android@v2

      - name: Build Web App
        run: pnpm build

      - name: Sync Capacitor
        run: pnpm cap sync android

      - name: Build APK
        run: |
          cd android
          chmod +x gradlew
          ./gradlew assembleDebug

      - name: Upload APK
        uses: actions/upload-artifact@v4
        with:
          name: hailin-assistant-apk
          path: android/app/build/outputs/apk/debug/app-debug.apk
```

#### 3. 发布APK（可选）

添加部署步骤到 workflow：

```yaml
      - name: Deploy to GitHub Release
        if: startsWith(github.ref, 'refs/tags/')
        uses: softprops/action-gh-release@v1
        with:
          files: android/app/build/outputs/apk/debug/app-debug.apk
```

### 自动构建结果

每次推送到 main 分支或打标签，GitHub Actions 会自动：
1. 安装依赖
2. 构建Web应用
3. 同步Capacitor
4. 编译APK
5. 保存APK到构建产物

---

## 🅲️ 方案C：PWA 安装（立即可用）

### 什么是 PWA？

PWA（渐进式Web应用）可以：
- ✅ "安装"到手机桌面
- ✅ 离线使用
- ✅ 推送通知
- ✅ 接近原生APP体验

### 当前项目 PWA 配置

项目已配置 PWA，可直接安装！

#### Android 安装步骤

1. 用**Chrome浏览器**打开：`https://你的域名/pos`
2. 点击右上角菜单（⋮）
3. 选择"添加到主屏幕"或"安装应用"
4. 确认安装

#### iOS 安装步骤

1. 用**Safari浏览器**打开：`https://你的域名/pos`
2. 点击底部"分享"按钮（⬆️）
3. 选择"添加到主屏幕"
4. 点击"添加"

#### PWA 特性

| 特性 | 支持 |
|------|------|
| 离线使用 | ✅ |
| 添加到桌面 | ✅ |
| 启动画面 | ✅ |
| 后台运行 | ⚠️ 有限 |
| 推送通知 | ❌ |
| 硬件访问 | ⚠️ 部分 |

---

## 🅳️ 方案D：在线 APK 构建服务

### 1. Voltbuilder

**网址**：https://volt.build/

**优点**：
- 云端构建，无需本地配置
- 支持 Capacitor/Cordova
- 免费试用

**步骤**：
1. 注册 Voltbuilder 账号
2. 上传项目代码
3. 配置 capacitor.config.json
4. 点击构建
5. 下载 APK

### 2. PhoneGap Build（已停止服务）

已停止维护，不推荐使用。

### 3. Ionic Appflow

**网址**：https://ionic.io/appflow

**优点**：
- 专为 Ionic/Capacitor 项目设计
- 自动构建
- 应用商店发布

---

## 📱 推荐方案总结

### 如果你有本地电脑

**推荐：方案A（本地构建）**

```bash
# 5分钟快速开始
1. 安装 Node.js
2. 安装 Android Studio
3. 克隆项目：git clone <你的仓库>
4. 安装依赖：pnpm install
5. 构建：pnpm cap sync android && cd android && ./gradlew assembleDebug
6. APK位置：android/app/build/outputs/apk/debug/app-debug.apk
```

### 如果你使用 GitHub

**推荐：方案B（GitHub Actions）**

```
优点：
- 自动构建，每次push自动更新APK
- 无需本地配置
- 历史版本可追溯
```

### 如果你想立即使用

**推荐：方案C（PWA安装）**

```
步骤：
1. 用Chrome打开 https://你的域名/pos
2. 菜单 → 添加到主屏幕
3. 即可使用！
```

---

## 🔧 常见问题

### Q1：构建APK需要多久？

**A**：首次构建约5-10分钟，后续增量构建约2-3分钟。

### Q2：APK多大？

**A**：一般20-50MB，具体取决于功能模块。

### Q3：可以上架应用商店吗？

**A**：可以，需要：
- Android：开发者账号（$25一次性）
- iOS：Apple开发者账号（$99/年）

### Q4：PWA和原生APP有什么区别？

| 对比项 | PWA | 原生APP |
|--------|-----|---------|
| 安装 | 即时 | 需下载 |
| 更新 | 自动 | 需手动更新 |
| 离线 | 支持 | 支持 |
| 硬件 | 部分 | 完全 |
| 应用商店 | 不需要 | 需要 |
| 开发成本 | 低 | 高 |

---

## 📞 需要帮助？

如果遇到问题，请提供：
1. 错误信息截图
2. 操作系统版本
3. 已安装的软件版本

---

**文档版本**：v1.0
**更新时间**：2024-04-07
