# 收银台APK生成指南

## 📱 快速开始

### 方式一：使用快速构建脚本（推荐）

```bash
# 进入项目目录
cd /workspace/projects

# 执行快速构建脚本
bash scripts/pos-app-quick-build.sh
```

### 方式二：手动构建

```bash
# 1. 安装依赖
pnpm install

# 2. 构建Next.js
pnpm run build

# 3. 同步到Capacitor
npx cap sync android

# 4. 构建APK (Debug版本)
cd android
./gradlew assembleDebug

# 5. APK文件位置
# android/app/build/outputs/apk/debug/app-debug.apk

# 6. 返回项目根目录
cd ..
```

### 方式三：构建Release版本

```bash
# 1. 构建Next.js
pnpm run build

# 2. 同步到Capacitor
npx cap sync android

# 3. 构建APK (Release版本)
cd android
./gradlew assembleRelease

# 4. APK文件位置
# android/app/build/outputs/apk/release/app-release.apk

# 5. 返回项目根目录
cd ..
```

---

## 🔧 环境要求

### 必需工具
- **Node.js**: v18.0.0+
- **pnpm**: v8.0.0+
- **Java**: JDK 11+
- **Gradle**: 7.0+
- **Android SDK**: API Level 30+

### 可选工具
- **Android Studio**: 用于调试和签名
- **ADB**: 用于安装APK到设备

---

## 📦 APK文件说明

### Debug版本
- **文件名**: `app-debug.apk`
- **用途**: 开发测试
- **特点**: 未签名，无需密钥
- **安装方式**: 直接安装

### Release版本
- **文件名**: `app-release.apk`
- **用途**: 正式发布
- **特点**: 已签名，需要密钥
- **安装方式**: 正式发布

---

## 🚀 安装APK

### 方式一：使用ADB安装

```bash
# 1. 连接Android设备（USB调试已开启）
adb devices

# 2. 安装APK
adb install android/app/build/outputs/apk/debug/app-debug.apk

# 3. 卸载APK
adb uninstall com.hailin.pos.cashier
```

### 方式二：手动安装

1. 将APK文件复制到手机
2. 在手机上找到APK文件
3. 点击安装
4. 允许安装未知来源应用
5. 完成安装

### 方式三：使用二维码安装

1. 将APK上传到服务器
2. 生成下载链接
3. 生成二维码
4. 扫描二维码下载安装

---

## 🔐 签名APK（Release版本）

### 生成签名密钥

```bash
# 1. 生成密钥
keytool -genkey -v -keystore hailin-pos.keystore -alias hailin-pos -keyalg RSA -keysize 2048 -validity 10000

# 2. 输入密钥库密码
# 3. 输入密钥密码
# 4. 填写其他信息
```

### 配置签名

创建 `android/keystore.properties`:

```properties
storePassword=你的密钥库密码
keyPassword=你的密钥密码
keyAlias=hailin-pos
storeFile=../hailin-pos.keystore
```

修改 `android/app/build.gradle`:

```gradle
android {
    signingConfigs {
        release {
            def keystoreProperties = new Properties()
            def keystorePropertiesFile = rootProject.file("keystore.properties")
            if (keystorePropertiesFile.exists()) {
                keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
            }
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
            storePassword keystoreProperties['storePassword']
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 构建签名APK

```bash
cd android
./gradlew assembleRelease
```

---

## 🧪 测试APK

### 功能测试清单

- [ ] 应用启动
- [ ] 登录功能
- [ ] 商品扫码
- [ ] 购物车管理
- [ ] 支付功能
- [ ] 小票打印
- [ ] 钱箱控制
- [ ] 会员识别

### 兼容性测试

- [ ] Android 10
- [ ] Android 11
- [ ] Android 12
- [ ] Android 13
- [ ] 不同屏幕尺寸

### 性能测试

- [ ] 启动时间 < 3秒
- [ ] 页面切换流畅
- [ ] 内存占用正常
- [ ] 无内存泄漏

---

## 📝 常见问题

### Q1: 构建失败，提示"Gradle sync failed"

**A**: 检查网络连接，可能需要配置Gradle镜像：
编辑 `android/build.gradle`:
```gradle
allprojects {
    repositories {
        maven { url 'https://maven.aliyun.com/repository/google' }
        maven { url 'https://maven.aliyun.com/repository/gradle-plugin' }
        maven { url 'https://maven.aliyun.com/repository/public' }
        google()
        mavenCentral()
    }
}
```

### Q2: APK安装失败，提示"应用未安装"

**A**: 可能原因：
1. APK签名不一致，卸载旧版本后重新安装
2. Android版本过低，检查最低SDK版本
3. 存储空间不足，清理存储空间

### Q3: 应用启动后白屏

**A**: 检查Next.js构建是否成功，查看日志：
```bash
adb logcat | grep "hailin"
```

### Q4: 扫码功能不工作

**A**: 检查权限配置，确保已添加相机权限：
```xml
<uses-permission android:name="android.permission.CAMERA" />
```

### Q5: 打印功能不工作

**A**: 检查蓝牙打印机连接和权限配置：
```xml
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
```

---

## 🔍 调试技巧

### 查看日志

```bash
# 查看所有日志
adb logcat

# 过滤应用日志
adb logcat | grep "hailin"

# 查看错误日志
adb logcat | grep -E "ERROR|FATAL"

# 清除日志
adb logcat -c
```

### 调试模式

```bash
# 启动调试
adb shell am start -D com.hailin.pos.cashier/.MainActivity

# 连接调试器
adb forward tcp:5000 tcp:5000
```

### 查看应用信息

```bash
# 查看应用版本
adb shell dumpsys package com.hailin.pos.cashier | grep version

# 查看应用权限
adb shell dumpsys package com.hailin.pos.cashier | grep permission

# 查看应用存储
adb shell df | grep /data/data/com.hailin.pos.cashier
```

---

## 📊 性能优化

### 减小APK体积

1. **启用代码混淆**
2. **移除未使用的资源**
3. **使用WebP格式图片**
4. **启用APK分包**

### 提升启动速度

1. **优化首屏加载**
2. **懒加载非关键资源**
3. **预加载关键资源**
4. **使用缓存**

---

## 🚀 发布准备

### 发布前检查

- [ ] 所有功能测试通过
- [ ] 性能测试通过
- [ ] 兼容性测试通过
- [ ] 无已知Bug
- [ ] 用户手册完整
- [ ] 版本号更新
- [ ] 应用签名完成

### 发布渠道

1. **应用内分发**: 提供APK下载链接
2. **应用商店**: 提交到各大应用商店
3. **企业分发**: 使用企业签名包
4. **二维码分发**: 生成下载二维码

---

**文档版本：v1.0**
**创建时间：2024-04-07**
**维护者：海邻到家技术团队**
