# 在线构建 APK 方案

## 📋 概述

如果你的电脑没有安装 Android Studio 或不想配置环境，可以使用以下在线构建服务。

---

## ☁️ 方案1：VoltBuilder（推荐）

### 特点
- ✅ 云端构建，无需本地配置
- ✅ 支持 Capacitor 项目
- ✅ 免费试用额度
- ✅ 支持 Android 和 iOS

### 步骤

#### 1. 注册 VoltBuilder 账号

1. 访问 https://volt.build
2. 点击 "Sign Up" 注册账号
3. 验证邮箱并登录

#### 2. 准备项目

确保项目根目录包含 `voltbuilder.json` 文件（已创建）。

#### 3. 打包项目

```bash
# 在项目根目录执行
cd hailin-pos

# 构建 Web 应用
pnpm build

# 创建 zip 包
# Windows
powershell -command "Compress-Archive -Path '.next','android','capacitor.config.ts','package.json','node_modules' -DestinationPath 'voltbuilder-package.zip'"

# Mac/Linux
zip -r voltbuilder-package.zip .next android capacitor.config.ts package.json node_modules
```

#### 4. 上传到 VoltBuilder

1. 登录 VoltBuilder Dashboard
2. 点击 "New Project"
3. 上传 zip 包
4. 选择平台：Android
5. 点击 "Build"

#### 5. 下载 APK

构建完成后，点击 "Download" 下载 APK 文件。

---

## ☁️ 方案2：GitHub Actions + Releases

### 特点
- ✅ 免费（公开仓库）
- ✅ 自动构建
- ✅ 版本管理
- ⚠️ 需要 GitHub 仓库

### 步骤

#### 1. 创建 GitHub 仓库

1. 访问 https://github.com
2. 创建新仓库：`hailin-pos`
3. 上传项目代码：
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/你的用户名/hailin-pos.git
git push -u origin main
```

#### 2. 启用 GitHub Actions

项目已包含 `.github/workflows/build-apk.yml` 配置文件。

推送代码后：
1. 访问 GitHub 仓库
2. 点击 "Actions" 标签
3. 查看构建状态
4. 构建完成后，点击构建任务
5. 下载 APK 文件

#### 3. 发布版本

```bash
# 创建并推送标签
git tag v1.0.0
git push origin v1.0.0
```

GitHub Actions 会自动构建并创建 Release。

#### 4. 下载 APK

1. 访问仓库主页
2. 点击 "Releases"
3. 下载 APK 文件

---

## ☁️ 方案3：Ionic Appflow

### 特点
- ✅ 专为 Capacitor/Ionic 项目设计
- ✅ 自动构建和部署
- ⚠️ 需要付费订阅

### 步骤

1. 访问 https://ionic.io/appflow
2. 注册并登录
3. 连接 GitHub 仓库
4. 配置构建平台
5. 点击 "Build"

---

## 📦 方案4：打包项目给他人构建

如果你身边有朋友的电脑可以帮忙构建：

### 1. 打包项目

```bash
# 排除 node_modules，使用 npm ci 重新安装
# 这样包体会小很多

# 创建打包脚本
cd hailin-pos

# Windows PowerShell
@"
echo '打包项目...'
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force .next
pnpm install
pnpm build
Compress-Archive -Path '*' -DestinationPath 'hailin-pos-package.zip'
echo '打包完成！'
"@ | Out-File -Encoding utf8 build-package.ps1
```

```bash
# Mac/Linux
#!/bin/bash
echo '打包项目...'
rm -rf node_modules .next
pnpm install
pnpm build
zip -r hailin-pos-package.zip . -x '.git/*'
echo '打包完成！'
```

### 2. 发送压缩包

将 `hailin-pos-package.zip` 发送给有 Android Studio 的朋友。

### 3. 朋友构建后返回 APK

让朋友按以下步骤构建：
```bash
unzip hailin-pos-package.zip
cd hailin-pos
npx cap sync android
cd android && ./gradlew assembleDebug
# 返回 android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 📱 发布应用商店（可选）

### Google Play Store

1. 注册 Google Play 开发者账号（$25 一次性费用）
2. 准备应用信息：
   - 应用名称
   - 应用描述
   - 应用图标（1024x1024）
   - 应用截图
   - 隐私政策 URL
3. 签名 APK：
```bash
cd android
./gradlew assembleRelease
# 使用签名密钥签名
keytool -genkey -v -keystore my-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias
```
4. 上传到 Google Play Console
5. 提交审核

### 国内应用商店

| 商店 | 注册要求 | 审核时间 |
|------|----------|----------|
| 应用宝 | 企业/个人 | 3-7天 |
| 华为应用市场 | 企业 | 5-7天 |
| 小米应用商店 | 企业/个人 | 3-5天 |
| OPPO 软件商店 | 企业 | 5-7天 |

---

## 📋 总结对比

| 方案 | 费用 | 难度 | 自动化 | 推荐场景 |
|------|------|------|--------|----------|
| VoltBuilder | 免费试用 | ⭐ | 否 | 临时构建 |
| GitHub Actions | 免费(公开) | ⭐⭐ | 是 | 持续更新 |
| Ionic Appflow | 付费 | ⭐ | 是 | 企业使用 |
| 本地构建 | 免费 | ⭐⭐⭐ | 否 | 最佳控制 |

---

## 🎯 推荐流程

```
首次构建：使用 GitHub Actions
     ↓
自动构建 + 发布 Releases
     ↓
用户下载 APK
     ↓
后续更新：推送到 GitHub
     ↓
自动构建 → 用户下载更新
```

---

**文档版本**: v1.0
**更新时间**: 2024-04-07
