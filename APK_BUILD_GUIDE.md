# 海邻到家收银台APP构建说明

## 方式一：本地构建APK（推荐）

### 前置要求

1. **Node.js 18+**
   - macOS: `brew install node@18`
   - Ubuntu/Debian: `curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs`
   - Windows: https://nodejs.org/

2. **Java JDK 11+**
   - macOS: `brew install openjdk@11`
   - Ubuntu/Debian: `sudo apt install openjdk-11-jdk`
   - Windows: https://adoptium.net/

3. **Android SDK**
   - 下载: https://developer.android.com/studio
   - 配置环境变量:
     ```bash
     export ANDROID_HOME=~/Library/Android/sdk  # macOS
     export ANDROID_HOME=/usr/lib/android-sdk  # Ubuntu
     export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools
     ```

### 构建步骤

```bash
# 1. 进入项目目录
cd /path/to/hailin-pos-cashier

# 2. 安装依赖
pnpm install

# 3. 构建Web应用并同步到Android
pnpm build
npx cap sync android

# 4. 构建APK
cd android
chmod +x gradlew
./gradlew assembleDebug

# 5. APK输出位置
# android/app/build/outputs/apk/debug/app-debug.apk
```

### 安装到手机

```bash
# 连接手机后（需开启USB调试）
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 方式二：使用Android Studio

1. 打开Android Studio
2. 选择 File > Open > 选择项目的 `android` 文件夹
3. 等待Gradle同步完成
4. 点击 Build > Build Bundle(s) / APK(s) > Build APK(s)
5. APK生成后点击locate查看文件位置

---

## 方式三：云构建（无需本地环境）

可以使用GitHub Actions或其他CI/CD服务构建APK。

---

## APK信息

- **包名**: `com.hailin.pos.cashier`
- **应用名**: `海邻收银台`
- **最低Android版本**: Android 5.1 (API 22)
- **目标Android版本**: Android 14 (API 34)

---

## 常见问题

### Q: ./gradlew: Permission denied
**A**: 运行 `chmod +x gradlew`

### Q: Could not find tools.jar
**A**: 确保JAVA_HOME指向JDK而非JRE

### Q: SDK location not found
**A**: 设置ANDROID_HOME环境变量

### Q: 构建失败，检查哪些日志？
**A**: 查看 `android/build/outputs/` 目录下的日志文件
