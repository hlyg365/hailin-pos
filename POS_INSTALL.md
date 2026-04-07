# 海邻收银台 - 一键安装

## 🚀 超级简单！一键安装到手机

### 方法 1: 命令行安装（最快）

```bash
# 连接手机到电脑（开启 USB 调试）
pnpm run pos:install
```

**就这么简单！** 脚本会自动：
- ✅ 安装依赖
- ✅ 构建项目
- ✅ 打包 APK
- ✅ 安装到手机
- ✅ 可选：立即启动应用

**整个过程约 2-3 分钟**

---

### 方法 2: 手动安装

如果自动安装失败，可以手动操作：

```bash
# 1. 构建 APK
pnpm run pos:build

# 2. 安装到手机
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 📱 手机准备

### 步骤 1: 开启开发者模式

```
设置 → 关于手机 → 连续点击"版本号" 7 次
```

### 步骤 2: 开启 USB 调试

```
设置 → 开发者选项 → 开启"USB 调试"
```

### 步骤 3: 连接手机

使用 USB 数据线连接手机到电脑，手机上选择"允许 USB 调试"。

---

## 🎯 完整命令列表

```bash
# 一键安装（推荐）
pnpm run pos:install

# 仅构建 APK
pnpm run pos:build

# 打开 Android Studio
pnpm run android:open

# 同步 Web 代码
pnpm run android:sync

# 安装到设备
pnpm run android:run
```

---

## ⚡ 快速故障排除

### 问题 1: "未检测到设备"

**解决方案**:
```bash
# 检查设备连接
adb devices

# 如果为空:
# 1. 检查 USB 线
# 2. 检查 USB 调试是否开启
# 3. 在手机上允许 USB 调试授权
```

### 问题 2: "安装失败"

**解决方案**:
```bash
# 卸载旧版本
adb uninstall com.hailin.pos.cashier

# 重新安装
pnpm run pos:install
```

### 问题 3: "应用白屏"

**解决方案**:
```bash
# 清除应用数据
adb shell pm clear com.hailin.pos.cashier

# 重新打开应用
```

---

## 📦 APK 文件位置

构建完成后，APK 文件位于：

```
android/app/build/outputs/apk/debug/app-debug.apk
```

你可以：
- 直接传输到手机安装
- 上传到服务器生成二维码下载
- 分享给其他人安装

---

## 🎨 应用信息

- **应用名称**: 海邻收银台
- **应用包名**: com.hailin.pos.cashier
- **支持系统**: Android 5.0 及以上

---

## 🔥 功能特性

收银台 APP 支持以下功能：

- ✅ 商品扫码（扫码枪 + 摄像头）
- ✅ 购物车管理
- ✅ 多种支付方式
- ✅ 会员识别
- ✅ 优惠券核销
- ✅ 小票打印（蓝牙打印机）
- ✅ 交接班管理
- ✅ 挂单/取单
- ✅ 离线模式

---

## 📞 技术支持

遇到问题？查看详细日志：

```bash
# 查看构建日志
tail -n 50 /tmp/pos-build.log

# 查看应用日志
adb logcat | grep "HailinPOS"
```

或查看完整文档：
- [ANDROID_QUICK_START.md](./ANDROID_QUICK_START.md)
- [ANDROID_INSTALL_GUIDE.md](./ANDROID_INSTALL_GUIDE.md)

---

**现在就试试吧！**

```bash
pnpm run pos:install
```

只需一条命令，收银台 APP 就会在你的手机上运行！
