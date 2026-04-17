# 海邻到家 APK 构建指南

## 环境要求

1. **Android SDK** (已部署)
2. **Node.js** (已部署)
3. **pnpm** (已部署)

## 构建步骤

### 方法一：一键构建（推荐）

在项目目录下执行：

```bash
cd apps/pos-app
pnpm build               # 构建 Web 应用
pnpm exec cap sync android  # 同步到 Android 项目
pnpm exec cap copy android  # 复制资源
```

然后使用 Android Studio 打开 `android` 目录，构建 APK：

```bash
cd android
./gradlew assembleDebug   # 调试版 APK
./gradlew assembleRelease # 正式版 APK（需要签名）
```

### 方法二：使用打包脚本

项目已配置自动打包脚本，可以一键完成所有步骤。

### APK 输出位置

- **调试版**: `android/app/build/outputs/apk/debug/app-debug.apk`
- **正式版**: `android/app/build/outputs/apk/release/app-release.apk`

## 安装测试

### 方式1：ADB 安装
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### 方式2：传输到手机
将 APK 文件复制到手机，通过文件管理器安装。

## 签名配置（正式版）

### 1. 生成签名
```bash
keytool -genkey -v -keystore hailin-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias hailin
```

### 2. 配置签名
在 `android/app/build.gradle` 中添加：
```groovy
android {
    ...
    signingConfigs {
        release {
            storeFile file('hailin-release.jks')
            storePassword '密码'
            keyAlias 'hailin'
            keyPassword '密码'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            ...
        }
    }
}
```

## 功能权限说明

构建的 APK 已包含以下权限：

| 权限 | 用途 |
|------|------|
| INTERNET | 网络连接 |
| ACCESS_NETWORK_STATE | 检测网络状态 |
| BLUETOOTH | 连接蓝牙打印机 |
| CAMERA | 扫码识别 |
| READ/WRITE_EXTERNAL_STORAGE | 保存小票 |
| VIBRATE | 支付成功震动提示 |

## 横屏配置

APP 已配置为横屏模式，适合收银场景使用。

## 离线支持

APP 支持离线使用，数据会在网络恢复后自动同步。
