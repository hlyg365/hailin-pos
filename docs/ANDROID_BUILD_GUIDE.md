# Android原生APP构建指南

## 概述

本项目已配置为支持原生Android应用，可直接在Android双屏收银机上运行，支持：
- 串口电子秤（USB转串口）
- 蓝牙小票打印机
- 客显屏（双屏显示）
- 钱箱控制

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

## 前端API使用

### 导入硬件服务

```typescript
import { hardwareService } from '@/lib/native/hardware-service';

// 获取硬件状态
const status = await hardwareService.getStatus();
console.log(status);
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
