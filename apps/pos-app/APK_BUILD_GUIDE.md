# 海邻到家收银台 APK 构建指南

## 方式一：本地构建（推荐）

### 前置条件
- 安装 JDK 17+ (https://adoptium.net/)
- 安装 Android Studio (https://developer.android.com/studio)
- 安装 Node.js 18+

### 构建步骤

```bash
# 1. 进入项目目录
cd /workspace/projects/apps/pos-app

# 2. 安装依赖
pnpm install

# 3. 构建 Web 应用
pnpm build

# 4. 同步到 Android
pnpm exec cap sync android

# 5. 进入 Android 目录
cd android

# 6. 构建 Debug APK
./gradlew assembleDebug

# 7. APK 输出位置
# android/app/build/outputs/apk/debug/app-debug.apk
```

### 构建 Release APK

```bash
# 1. 生成签名密钥
keytool -genkey -v -keystore my-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias

# 2. 配置签名 (在 android/app/build.gradle 中添加)
android {
    signingConfigs {
        release {
            storeFile file('my-release-key.jks')
            storePassword 'your-password'
            keyAlias 'my-key-alias'
            keyPassword 'your-password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}

# 3. 构建 Release APK
./gradlew assembleRelease
```

## 方式二：使用 CI/CD 自动构建

### GitHub Actions
在 `.github/workflows/android.yml` 添加：

```yaml
name: Android Build

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-java@v3
        with:
          distribution: 'temurin'
          java-version: '17'
      - uses: android-actions/setup-android@v2
      
      - name: Build APK
        run: |
          cd android
          ./gradlew assembleDebug
          
      - name: Upload APK
        uses: actions/upload-artifact@v3
        with:
          name: app-debug
          path: android/app/build/outputs/apk/debug/app-debug.apk
```

## APK 安装

```bash
# 通过 ADB 安装
adb install app-debug.apk

# 或者直接传输到手机安装
```

## 已配置内容

- ✅ Capacitor 8.3.1
- ✅ Android 项目结构
- ✅ Web 资源已同步
- ✅ 状态栏插件 (@capacitor/status-bar)

## 注意事项

1. **首次构建**需要下载 Gradle 和 Android SDK，确保网络畅通
2. **Debug APK** 可直接安装测试
3. **Release APK** 需要签名才能上架应用市场
4. 应用包名：`com.hailin.posapp`
