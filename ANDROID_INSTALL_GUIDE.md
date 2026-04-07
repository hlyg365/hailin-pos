# 海邻到家收银台 - Android 安装指南

## 📱 项目概述

海邻到家收银台已通过 Capacitor 封装为 Android 应用，支持：
- 📦 商品扫码（支持扫码枪和摄像头扫码）
- 🖨️ 蓝牙打印机连接
- 💳 收银结算
- 📊 订单管理
- 👥 会员管理

---

## 🚀 快速开始

### 方式一：使用构建脚本（推荐）

```bash
# 运行 Android 构建脚本
pnpm run build:android

# 或直接执行
./scripts/build-android.sh
```

脚本会自动完成：
1. 安装依赖
2. 构建 Next.js 项目
3. 同步到 Android 项目
4. 提供 4 种构建选项

### 方式二：手动构建

```bash
# 1. 安装依赖
pnpm install

# 2. 构建 Next.js 项目
pnpm run build

# 3. 同步到 Android 项目
npx cap sync android

# 4. 打开 Android Studio 或构建 APK
npx cap open android  # 打开 Android Studio
# 或
cd android && ./gradlew assembleDebug  # 构建 Debug APK
```

---

## 📦 APK 构建方式

### 1️⃣ Debug 版本（开发测试）

**适用场景**：开发、测试、调试

**构建命令**：
```bash
cd android
./gradlew assembleDebug
```

**APK 位置**：
```
android/app/build/outputs/apk/debug/app-debug.apk
```

**特点**：
- ✅ 无需签名
- ✅ 构建快速
- ❌ 性能较低
- ❌ 不能上架应用商店

### 2️⃣ Release 版本（正式发布）

**适用场景**：正式发布、上架应用商店

**构建步骤**：

#### 步骤 1：生成签名密钥

```bash
# 在 android 目录下执行
cd android

# 生成密钥
keytool -genkey -v -keystore release.keystore \
    -alias hailin-pos \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -storepass YOUR_STORE_PASSWORD \
    -keypass YOUR_KEY_PASSWORD

# 回到项目根目录
cd ..
```

**参数说明**：
- `keystore`: 密钥库文件名
- `alias`: 密钥别名
- `validity`: 有效期（天）
- `storepass`: 密钥库密码
- `keypass`: 密钥密码

#### 步骤 2：配置签名信息

在 `android/app/build.gradle` 中添加：

```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file('../release.keystore')
            storePassword 'YOUR_STORE_PASSWORD'
            keyAlias 'hailin-pos'
            keyPassword 'YOUR_KEY_PASSWORD'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

#### 步骤 3：构建 Release APK

```bash
cd android
./gradlew assembleRelease
```

**APK 位置**：
```
android/app/build/outputs/apk/release/app-release.apk
```

---

## 📲 安装到 Android 设备

### 方式一：USB 数据线安装

1. **开启开发者模式**
   - 设置 → 关于手机
   - 连续点击"版本号" 7 次
   - 提示"您已处于开发者模式"

2. **开启 USB 调试**
   - 设置 → 开发者选项
   - 开启"USB 调试"

3. **连接设备并安装**
   ```bash
   # 方法 1: 使用 adb 命令
   adb install android/app/build/outputs/apk/debug/app-debug.apk
   
   # 方法 2: 使用 Gradle 直接安装
   cd android
   ./gradlew installDebug
   
   # 方法 3: 直接拖拽 APK 到手机
   ```

### 方式二：扫码下载安装

1. **上传 APK 到服务器**
   ```bash
   # 上传到你的服务器或对象存储
   # 例如：https://your-domain.com/downloads/hailin-pos.apk
   ```

2. **生成二维码**
   - 使用在线二维码生成工具
   - 输入 APK 下载链接
   - 生成二维码图片

3. **手机扫码安装**
   - 手机浏览器扫码
   - 下载 APK 文件
   - 点击安装

### 方式三：应用商店分发

**适用场景**：大规模分发

- 上传到企业内部应用商店
- 上传到第三方应用市场（腾讯应用宝、华为应用市场等）
- 使用蒲公英、fir.im 等内测分发平台

---

## 🔧 Android Studio 构建指南

### 打开项目

```bash
npx cap open android
```

这会自动打开 Android Studio 并加载项目。

### 构建步骤

1. **等待 Gradle 同步完成**
   - 首次打开会下载依赖，可能需要几分钟

2. **选择构建变体**
   - 点击左侧 "Build Variants" 标签
   - 选择 `debug` 或 `release`

3. **构建 APK**
   - 菜单：Build → Build Bundle(s) / APK(s) → Build APK(s)
   - 等待构建完成

4. **定位 APK**
   - 点击右下角提示 `locate`
   - 或手动导航到 `android/app/build/outputs/apk/`

### 调试技巧

1. **查看日志**
   ```bash
   # 实时查看日志
   adb logcat
   
   # 过滤特定标签
   adb logcat | grep "HailinPOS"
   
   # 清空日志
   adb logcat -c
   ```

2. **连接 Chrome DevTools**
   - 手机连接电脑
   - 打开 `chrome://inspect`
   - 找到你的 WebView 应用
   - 点击 "inspect"

---

## ⚙️ 配置说明

### Capacitor 配置 (`capacitor.config.ts`)

```typescript
{
  appId: 'com.hailin.pos',          // 应用包名
  appName: '海邻到家收银台',          // 应用名称
  webDir: '.next',                  // Web 构建目录
  server: {
    androidScheme: 'https',         // 协议
    cleartext: true,                // 允许 HTTP
    url: 'http://localhost:5000',   // 开发服务器地址
  },
  android: {
    allowMixedContent: true,        // 允许混合内容
    captureInput: true,             // 捕获输入
    webContentsDebuggingEnabled: true, // 调试模式
  }
}
```

### 应用图标

替换以下文件自定义应用图标：

```
android/app/src/main/res/
├── mipmap-mdpi/ic_launcher.png        (48x48)
├── mipmap-hdpi/ic_launcher.png        (72x72)
├── mipmap-xhdpi/ic_launcher.png       (96x96)
├── mipmap-xxhdpi/ic_launcher.png      (144x144)
└── mipmap-xxxhdpi/ic_launcher.png     (192x192)
```

**生成图标**：
```bash
# 使用 capacitor-assets 自动生成
npx capacitor-assets generate --android
```

### 应用名称

修改 `android/app/src/main/res/values/strings.xml`：

```xml
<resources>
    <string name="app_name">海邻到家收银台</string>
    <string name="title_activity_main">海邻到家收银台</string>
</resources>
```

---

## 🔐 权限说明

应用需要以下权限（已在 `AndroidManifest.xml` 中配置）：

### 必需权限
- `INTERNET` - 网络访问
- `CAMERA` - 摄像头扫码

### 可选权限
- `BLUETOOTH` / `BLUETOOTH_CONNECT` - 蓝牙打印机连接
- `USB_HOST` - USB 扫码枪
- `WRITE_EXTERNAL_STORAGE` - 保存小票图片

---

## 🐛 常见问题

### 1. 安装失败："未签名应用"

**原因**：Android 设备阻止安装未签名应用

**解决方案**：
```bash
# 构建已签名的 Release 版本
cd android
./gradlew assembleRelease

# 或在手机设置中允许未知来源
设置 → 安全 → 允许安装未知来源应用
```

### 2. 构建失败："SDK location not found"

**原因**：未配置 Android SDK 路径

**解决方案**：
```bash
# 创建 local.properties 文件
echo "sdk.dir=/path/to/android/sdk" > android/local.properties

# 或设置环境变量
export ANDROID_HOME=/path/to/android/sdk
```

### 3. 白屏或加载失败

**原因**：Web 资源未正确同步

**解决方案**：
```bash
# 重新构建并同步
pnpm run build
npx cap sync android
```

### 4. 摄像头扫码不工作

**原因**：未授予摄像头权限

**解决方案**：
- 首次使用时允许摄像头权限
- 或在应用设置中手动授予权限

### 5. 蓝牙打印机连接失败

**原因**：未授予蓝牙权限或定位权限（Android 要求）

**解决方案**：
- 授予蓝牙权限
- 授予定位权限（Android 12+ 必需）

---

## 📚 更多资源

- [Capacitor 官方文档](https://capacitorjs.com/docs)
- [Android 开发者文档](https://developer.android.com/)
- [Next.js 官方文档](https://nextjs.org/docs)

---

## 🎯 下一步

1. ✅ 构建 Debug APK 测试功能
2. ✅ 在真实设备上测试硬件功能
3. ✅ 生成签名密钥
4. ✅ 构建 Release APK
5. ✅ 分发给用户或上架应用商店

---

**构建遇到问题？**

查看构建日志：
```bash
tail -n 100 /app/work/logs/bypass/android-build.log
```

联系技术支持获取帮助。
