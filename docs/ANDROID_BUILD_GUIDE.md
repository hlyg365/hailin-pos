# 海邻收银台 Android APP 构建指南

## 概述

海邻收银台是一个独立的 Android 应用，用于便利店的日常收银工作。本文档说明如何将收银台打包成 Android APP。

## 技术架构

- **前端框架**: Next.js 16 + React 19
- **移动端封装**: Capacitor 8.2.0
- **APP ID**: com.hailin.pos.cashier
- **应用名称**: 海邻收银台

## 环境要求

### 必需环境
- Node.js 18+
- pnpm 9.0+
- Java JDK 11+ (推荐 JDK 17)
- Android Studio (推荐最新版)
- Android SDK (API 22+)

### 环境变量配置

```bash
# ~/.bashrc 或 ~/.zshrc
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk
```

## 快速构建

### 方法一：使用构建脚本

```bash
# 执行完整构建流程
chmod +x scripts/pos-app-build.sh
./scripts/pos-app-build.sh

# 打开 Android Studio
pnpm run android:open

# 在 Android Studio 中构建 APK
```

### 方法二：手动构建

```bash
# 1. 安装依赖
pnpm install

# 2. 构建 Next.js 项目
pnpm run build

# 3. 同步到 Android
npx cap sync android

# 4. 构建 Debug APK
cd android && ./gradlew assembleDebug && cd ..

# APK 输出位置: android/app/build/outputs/apk/debug/app-debug.apk
```

## 构建选项

### Debug 版本（开发测试用）

```bash
cd android
./gradlew assembleDebug
```

- APK 路径: `android/app/build/outputs/apk/debug/app-debug.apk`
- 特点: 未签名，可调试，体积较大

### Release 版本（正式发布）

```bash
# 首次需要生成签名密钥
keytool -genkey -v -keystore android/release.keystore \
  -alias hailin-pos \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# 配置签名 (android/app/build.gradle)
# android {
#   signingConfigs {
#     release {
#       storeFile file('../release.keystore')
#       storePassword 'your_password'
#       keyAlias 'hailin-pos'
#       keyPassword 'your_password'
#     }
#   }
#   buildTypes {
#     release {
#       signingConfig signingConfigs.release
#     }
#   }
# }

# 构建 Release APK
cd android && ./gradlew assembleRelease && cd ..
```

## APP 功能说明

### 登录认证
- 员工使用手机号 + 密码登录
- 支持"店长"和"营业员"两种角色
- 登录状态本地持久化

### 核心功能
1. **商品管理**: 商品分类、搜索、扫码
2. **购物车**: 添加商品、修改数量、抹分
3. **结算支付**: 现金、微信、支付宝、银行卡、混合支付
4. **AI识别**: 拍照识别商品
5. **订单管理**: 查看历史订单
6. **会员管理**: 会员识别、积分

### 移动端优化
- 自适应屏幕尺寸
- 触摸友好的按钮尺寸
- 快捷操作手势

## 常用命令

```bash
# 开发模式（带热更新）
pnpm run dev

# 构建 Web 项目
pnpm run build

# 同步到 Android
pnpm run android:sync

# 打开 Android Studio
pnpm run android:open

# 类型检查
pnpm run ts-check
```

## 目录结构

```
.
├── src/
│   ├── app/
│   │   ├── pos/              # 收银台页面（APP核心）
│   │   │   ├── page.tsx      # 主收银页面
│   │   │   ├── login/        # 登录页
│   │   │   ├── orders/       # 订单管理
│   │   │   ├── members/      # 会员管理
│   │   │   ├── products/     # 商品管理
│   │   │   └── ...
│   │   └── ...               # 后台管理页面
│   └── contexts/
│       └── PosAuthContext.tsx # 认证上下文
├── android/                   # Android 项目
│   └── app/
│       └── build/outputs/apk/ # APK 输出目录
├── capacitor.config.ts        # Capacitor 配置
└── scripts/
    └── pos-app-build.sh       # 构建脚本
```

## 注意事项

1. **首次构建**: 确保已安装 Android SDK 并配置好环境变量
2. **签名密钥**: Release 版本必须签名，请妥善保管密钥文件
3. **网络配置**: APP 默认连接 `http://localhost:5000`，部署时需修改
4. **权限**: APP 需要相机权限（用于扫码和AI识别）

## 故障排除

### 构建失败
```bash
# 清理并重新构建
cd android
./gradlew clean
cd ..
pnpm run build
npx cap sync android
```

### 模拟器无法访问网络
- 确保模拟器使用正确的网络配置
- 检查防火墙设置

### 扫码功能不工作
- 确保已授予相机权限
- 在真机上测试（模拟器可能不支持相机）

## 联系支持

如有问题，请联系技术支持团队。
