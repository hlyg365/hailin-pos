# 海邻到家收银台 - Android 快速开始

## 🚀 三步快速安装

### 方式一：命令行快速构建（推荐）

```bash
# 步骤 1: 一键构建并安装
pnpm run dev:android

# 选择选项 1: 快速构建并安装到设备
```

**就这么简单！** 脚本会自动完成：
- ✅ 构建 Next.js 项目
- ✅ 同步到 Android 项目
- ✅ 构建 APK 并安装到设备

---

### 方式二：手动构建

```bash
# 步骤 1: 构建 Web 项目
pnpm run build

# 步骤 2: 同步到 Android
npx cap sync android

# 步骤 3: 构建 APK
cd android
./gradlew assembleDebug

# 步骤 4: 安装到设备
adb install app/build/outputs/apk/debug/app-debug.apk
```

---

## 📱 安装到手机

### 方法 1: USB 数据线（最快）

1. **开启开发者模式**
   ```
   设置 → 关于手机 → 连续点击"版本号" 7次
   ```

2. **开启 USB 调试**
   ```
   设置 → 开发者选项 → 开启"USB 调试"
   ```

3. **连接并安装**
   ```bash
   # 方式 A: 使用脚本
   pnpm run android:run
   
   # 方式 B: 手动安装
   adb install android/app/build/outputs/apk/debug/app-debug.apk
   ```

### 方法 2: 扫码下载

1. **上传 APK 到服务器**
2. **生成下载二维码**
3. **手机扫码下载安装**

---

## 🎯 常用命令速查

```bash
# 开发模式
pnpm run dev              # 启动 Web 开发服务器
pnpm run dev:android      # Android 快速开发（推荐）

# 构建 APK
pnpm run build:apk        # 构建 Debug APK
pnpm run build:apk:release # 构建 Release APK

# Android 操作
pnpm run android:open     # 打开 Android Studio
pnpm run android:sync     # 同步 Web 代码
pnpm run android:run      # 安装到设备

# 调试
adb logcat | grep "HailinPOS"  # 查看日志
```

---

## ⚡ 快速故障排除

### 问题 1: 未检测到设备

```bash
# 检查设备连接
adb devices

# 如果为空，检查:
# 1. USB 线是否连接
# 2. 是否开启 USB 调试
# 3. 是否授权电脑调试
```

### 问题 2: 安装失败

```bash
# 卸载旧版本
adb uninstall com.hailin.pos

# 重新安装
pnpm run android:run
```

### 问题 3: 白屏

```bash
# 清除应用数据
adb shell pm clear com.hailin.pos

# 重新构建
pnpm run build
npx cap sync android
```

---

## 📦 APK 输出位置

```
Debug APK:
android/app/build/outputs/apk/debug/app-debug.apk

Release APK:
android/app/build/outputs/apk/release/app-release.apk
```

---

## 🎨 自定义应用信息

### 修改应用名称

编辑 `android/app/src/main/res/values/strings.xml`:
```xml
<string name="app_name">你的应用名</string>
```

### 修改应用图标

替换以下目录中的图标文件:
```
android/app/src/main/res/mipmap-*/
```

### 修改包名

编辑 `capacitor.config.ts`:
```typescript
{
  appId: 'com.yourcompany.yourapp',
  appName: '你的应用名',
}
```

然后同步:
```bash
npx cap sync android
```

---

## 📚 更多文档

- [详细安装指南](./ANDROID_INSTALL_GUIDE.md)
- [Capacitor 文档](https://capacitorjs.com/docs)
- [Android 开发文档](https://developer.android.com/)

---

**遇到问题？** 查看日志:
```bash
tail -n 50 /app/work/logs/bypass/android-build.log
```
