# 海邻到家社区便利店智能收银系统

## 项目简介

海邻到家是一个面向社区便利店的智能收银与营销管理系统，采用原生Android + Capacitor跨平台架构，支持收银台独立APP + 后台管理系统 + 店长助手移动端三端分离设计。

## 核心功能

- **收银台独立APP**：支持离线收银、PWA安装、扫码枪/打印机/钱箱集成
- **双屏收银机支持**：主屏收银 + 客显屏显示
- **电子秤集成**：串口秤/网络秤自动识别
- **蓝牙打印**：小票打印、钱箱控制
- **会员体系**：四级会员等级、积分规则、会员权益
- **优惠券系统**：满减券、折扣券、代金券
- **供应链协同**：要货申请、集中采购、配送签收
- **自动更新**：App后台自动更新、静默下载

## 技术架构

- **框架**: Next.js 16 (App Router)
- **移动端**: Capacitor 7
- **原生插件**: 
  - ScalePlugin (电子秤)
  - PrinterPlugin (蓝牙打印)
  - DualScreenPlugin (双屏客显)
  - AppUpdatePlugin (自动更新)
- **状态管理**: React Context + useState
- **UI组件**: shadcn/ui (基于 Radix UI)

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 开发预览

```bash
pnpm dev
```

访问 http://localhost:5000/pos

### 构建Web应用

```bash
pnpm build
```

### 同步到Android

```bash
npx cap sync android
```

### 打开Android Studio

```bash
npx cap open android
```

## 构建APK

### 方式1：Android Studio

1. 打开Android Studio
2. 打开 `android` 目录
3. 点击 **Build > Build Bundle(s) / APK(s) > Build APK**
4. APK输出位置：`android/app/build/outputs/apk/debug/app-debug.apk`

### 方式2：命令行

```bash
cd android
./gradlew assembleDebug
```

### 方式3：GitHub Actions（推荐）

1. 推送代码到 main 分支
2. 或创建标签 `git tag v3.0.0`
3. 在 GitHub Actions 查看构建进度
4. 下载构建产物

## 目录结构

```
.
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── pos/                # 收银台APP
│   │   ├── (dashboard)/        # 后台管理系统
│   │   └── api/                # API路由
│   │       ├── update/         # 更新API
│   │       └── scale/          # 电子秤API
│   ├── components/             # React组件
│   ├── hooks/                  # 自定义Hooks
│   │   └── useAppUpdate.ts     # 更新检查Hook
│   └── lib/                    # 工具库
│       └── native/             # 原生插件服务
│           ├── app-update-service.ts
│           ├── scale-service.ts
│           ├── printer-service.ts
│           └── dual-screen-service.ts
├── android/                    # Android原生项目
│   └── app/src/main/java/com/hailin/pos/
│       ├── MainActivity.java
│       ├── ScalePlugin.java
│       ├── PrinterPlugin.java
│       ├── DualScreenPlugin.java
│       └── AppUpdatePlugin.java
├── .github/workflows/          # GitHub Actions
│   └── android-build.yml
└── docs/                       # 文档
    └── ANDROID_BUILD_GUIDE.md
```

## 配置说明

### 更新服务器

编辑 `src/app/api/update/route.ts` 中的 `LATEST_VERSION`：

```typescript
const LATEST_VERSION = {
  version: '3.0.0',
  versionCode: 30,
  downloadUrl: 'https://your-server.com/api/update/download',
  releaseNotes: '更新说明',
  minVersion: '2.0.0',
  forceUpdate: false,
};
```

### API服务器地址

编辑 `src/lib/native/app-update-service.ts`：

```typescript
private static final String UPDATE_SERVER = "https://your-server.com";
```

## 自动更新流程

1. **检查更新**：App启动时调用 `/api/update` 检查版本
2. **下载APK**：用户确认后下载到本地
3. **安装更新**：调用系统安装器完成安装

## License

MIT License
