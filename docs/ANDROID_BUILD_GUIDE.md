# Android原生APP构建指南

## 概述

本项目已配置为支持原生Android应用，可直接在Android双屏收银机上运行，支持：
- 串口电子秤（USB转串口）
- 蓝牙小票打印机
- 客显屏（双屏显示）
- 钱箱控制
- **自动更新（App后台自动更新）**

---

## GitHub Actions 自动构建

项目已配置GitHub Actions，每次推送到main分支或打标签时会自动构建APK。

### 触发条件

| 事件 | 触发条件 | 生成产物 |
|------|----------|----------|
| Push到main | 代码推送到main分支 | Debug APK |
| 打标签 | `git tag v*` | Debug + Release APK |
| 手动触发 | workflow_dispatch | Debug APK |

### 查看构建结果

1. 进入 GitHub 仓库页面
2. 点击 **Actions** 标签
3. 选择对应的 workflow 运行记录
4. 在 Artifacts 中下载 APK

### 设置 Secrets（可选）

如需自动部署到更新服务器，设置以下 Secrets：

| Secret名称 | 说明 | 示例值 |
|------------|------|--------|
| `DEPLOY_URL` | 更新服务器地址 | `https://your-server.com` |
| `DEPLOY_TOKEN` | 部署认证令牌 | `your-token-here` |

---

## 版本管理

### 版本号规范

遵循语义化版本 `主版本.次版本.修订号`：
- `3.0.0` - 正式版
- `3.0.0-beta.1` - 测试版

### 发布新版本

```bash
# 1. 更新版本号
# 编辑 android/app/build.gradle
versionCode 31
versionName "3.0.1"

# 2. 提交代码
git add .
git commit -m "feat: 添加新功能"

# 3. 创建标签
git tag v3.0.1

# 4. 推送到GitHub
git push origin main
git push origin v3.0.1
```

GitHub Actions 会自动：
1. 构建APK
2. 生成Release
3. 上传到Release

---

## 自动更新功能

### 功能说明

- **后台检查更新**：App启动时自动检查更新
- **WiFi下载**：默认仅在WiFi环境下下载
- **断点续传**：支持大文件下载
- **强制更新**：可配置最低支持版本

### 更新流程

```
App启动 → 检查更新API → 有新版本?
                              ↓
                      显示更新弹窗
                              ↓
              ┌───────────────┼───────────────┐
              ↓               ↓               ↓
           立即下载        稍后提醒         强制更新
              ↓               ↓               ↓
         后台下载      下次检查        无法跳过
              ↓               
         下载完成
              ↓
         显示安装提示
              ↓
         用户点击安装
              ↓
         系统安装界面
```

### API端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/update` | GET | 检查更新 |
| `/api/update?platform=android` | GET | 获取版本信息 |
| `/api/update/download` | GET | 下载APK |
| `/api/update/download?v=3.0.1` | GET | 下载指定版本 |
| `/api/update` | POST | 上传新版本(管理员) |

### 更新检查响应

```json
{
  "success": true,
  "update": true,
  "latestVersion": "3.0.1",
  "versionCode": 31,
  "releaseNotes": "支持双屏收银机，优化电子秤连接",
  "forceUpdate": false,
  "downloadUrl": "/api/update/download?v=3.0.1"
}
```

---

## 前端API使用

## 文件结构

```
android/
├── app/src/main/java/com/hailin/pos/
│   ├── MainActivity.java           # 主入口，注册插件
│   ├── ScalePlugin.java            # 电子秤插件（USB串口）
│   ├── PrinterPlugin.java          # 打印机插件（蓝牙）
│   ├── DualScreenPlugin.java       # 双屏插件（客显屏）
│   ├── CustomerDisplayActivity.java # 客显屏Activity
│   ├── UsbPermissionReceiver.java  # USB权限接收器
│   └── UsbDeviceService.java       # USB设备服务
```

## 硬件支持

### 1. 电子秤（串口秤）
- **协议**：顶尖OS2协议
- **连接方式**：USB转串口（CH340/CP2102/FT232）
- **参数**：9600bps, 8N1

### 2. 蓝牙打印机
- **协议**：蓝牙串口（SPP）
- **UUID**：00001101-0000-1000-8000-00805F9B34FB
- **支持品牌**：佳博、芯烨、商祺等

### 3. 客显屏
- **方式**：Android Presentation API
- **要求**：支持多屏幕显示的Android设备

## 构建APK

### 方式1：在本地构建（推荐）

```bash
# 1. 克隆项目
git clone <项目地址>
cd hailin-pos

# 2. 安装依赖
pnpm install

# 3. 同步到Android
npx cap sync android

# 4. 打开Android Studio
npx cap open android

# 5. 在Android Studio中点击 Build > Build Bundle(s) / APK(s) > Build APK
```

### 方式2：命令行构建

```bash
# 确保已安装JDK 17
export JAVA_HOME=/path/to/jdk17

# 构建Debug APK
cd android
./gradlew assembleDebug

# 构建Release APK
./gradlew assembleRelease
```

### 方式3：使用Docker构建

```dockerfile
FROM node:20-bullseye AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install -g pnpm
RUN pnpm install
COPY . .
RUN pnpm build
RUN npx cap sync android

FROM adoptopenjdk:17-jdk
WORKDIR /app
COPY --from=builder /app/android ./android
RUN apt-get update && apt-get install -y wget unzip
RUN wget -q https://services.gradle.org/distributions/gradle-8.6-bin.zip -O /tmp/gradle.zip
RUN unzip -q /tmp/gradle.zip -d /opt && rm /tmp/gradle.zip
ENV PATH="/opt/gradle-8.6/bin:$PATH"
WORKDIR /app/android
RUN ./gradlew assembleDebug
```

---

## 前端API使用

### 导入更新服务

```typescript
import { appUpdateService } from '@/lib/native/app-update-service';
import { useAppUpdate } from '@/hooks/useAppUpdate';

// 检查更新
const result = await appUpdateService.checkUpdate();
if (result.hasUpdate) {
  console.log('有新版本:', result.latestVersion);
}

// 下载更新
await appUpdateService.downloadUpdate();

// 安装更新
await appUpdateService.installUpdate();

// 使用Hook（推荐）
function MyApp() {
  const {
    updateInfo,
    isDownloading,
    downloadProgress,
    downloadUpdate,
    installUpdate,
  } = useAppUpdate();
  
  // ...
}
```

### 电子秤使用

```typescript
import { scaleService } from '@/lib/native/scale-service';

// 连接电子秤
await scaleService.connect({
  port: 'COM1',
  baudRate: 9600,
  protocol: 'OS2'
});

// 监听重量变化
scaleService.onWeightChange((data) => {
  console.log(`重量: ${data.weight} ${data.unit}`);
});

// 获取当前重量
const weight = await scaleService.getWeight();
```

### 蓝牙打印机使用

```typescript
import { printerService } from '@/lib/native/printer-service';

// 列出已配对的设备
const devices = await printerService.listDevices();

// 连接打印机
await printerService.connect('XX:XX:XX:XX:XX:XX', '打印机名称');

// 打印小票
await printerService.printReceipt({
  shopName: '海邻到家便利店',
  orderNo: '202401010001',
  items: [
    { name: '农夫山泉', quantity: '2', price: '4.00' },
    { name: '方便面', quantity: '1', price: '5.00' }
  ],
  total: 13.00,
  discount: 0,
  payment: 20.00,
  change: 7.00
});

// 打开钱箱
await printerService.openCashbox();
```

### 客显屏使用

```typescript
import { dualScreenService } from '@/lib/native/dual-screen-service';

// 获取显示器列表
const displays = await dualScreenService.getDisplays();
console.log(displays);

// 打开客显屏
await dualScreenService.open({
  url: '/pos/customer-display',
  displayId: 1
});

// 发送数据到客显屏
await dualScreenService.sendData({
  cart: [...],
  total: 100,
  payment: 100,
  change: 0
});

// 关闭客显屏
await dualScreenService.close();
```

## Android权限说明

以下权限已在AndroidManifest.xml中配置：

```xml
<!-- 蓝牙权限 -->
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />

<!-- USB权限 -->
<uses-permission android:name="android.permission.USB_HOST" />

<!-- 相机权限（扫码枪） -->
<uses-permission android:name="android.permission.CAMERA" />
```

## 常见问题

### Q: 打印连接失败？
A: 请确保打印机已配对，并在手机蓝牙设置中允许配对。

### Q: 电子秤无法连接？
A: 请确保使用USB转串口线，并检查串口号和波特率设置。

### Q: 客显屏不显示？
A: 确保设备支持多屏幕显示，副屏需要在系统设置中启用。

### Q: 钱箱不弹开？
A: 钱箱通过打印机接口控制，确保打印机连接正常。

## 技术支持

如有问题，请联系开发团队。
