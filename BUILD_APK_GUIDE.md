# 📱 收银台APP快速构建指南

## 前置条件

1. ✅ Node.js (v20+) 已安装
2. ✅ pnpm 包管理器已安装
3. ✅ Android Studio 已安装（用于构建APK）
4. ✅ JDK (Java Development Kit) 已安装

---

## 快速构建流程

### 方法一：使用Android Studio构建（推荐）

#### 步骤1：准备项目
```bash
# 进入项目目录
cd /workspace/projects

# 安装依赖
pnpm install

# 构建Next.js项目
pnpm run build

# 同步到Android项目
npx cap sync android
```

#### 步骤2：打开Android Studio
```bash
# 方法1：使用命令行
pnpm run android:open

# 方法2：手动打开
# 打开Android Studio → Open → 选择 /workspace/projects/android 目录
```

#### 步骤3：配置签名（仅Release版本需要）

**创建签名文件：**
```bash
# 在Android Studio中
# Build → Generate Signed Bundle / APK → APK → Next

# 或使用命令行
keytool -genkey -v -keystore hailin-key.keystore -alias hailin -keyalg RSA -keysize 2048 -validity 10000
```

**配置签名信息：**
```
密钥库路径: hailin-key.keystore
密钥库密码: [设置密码]
密钥别名: hailin
密钥密码: [设置密码]
```

#### 步骤4：构建APK

**Debug版本（测试用）：**
```
菜单 → Build → Build Bundle(s) / APK(s) → Build APK(s)
```

**Release版本（发布用）：**
```
菜单 → Build → Generate Signed Bundle / APK → APK → 选择签名 → finish
```

#### 步骤5：查找APK文件
```
Debug版本: android/app/build/outputs/apk/debug/app-debug.apk
Release版本: android/app/build/outputs/apk/release/app-release.apk
```

---

### 方法二：使用命令行构建

#### Debug版本
```bash
# 1. 构建
pnpm run build

# 2. 同步
npx cap sync android

# 3. 构建APK
cd android && ./gradlew assembleDebug && cd ..

# 4. APK位置
# android/app/build/outputs/apk/debug/app-debug.apk
```

#### Release版本
```bash
# 1. 构建
pnpm run build

# 2. 同步
npx cap sync android

# 3. 配置签名（需先创建keystore文件）
# 编辑 android/app/build.gradle，添加签名配置

# 4. 构建APK
cd android && ./gradlew assembleRelease && cd ..

# 5. APK位置
# android/app/build/outputs/apk/release/app-release.apk
```

---

## 配置APP信息

### 修改APP名称和图标

#### 1. 修改APP名称
编辑 `android/app/src/main/res/values/strings.xml`：
```xml
<resources>
    <string name="app_name">海邻收银台</string>
</resources>
```

#### 2. 替换APP图标
```bash
# 准备图标文件
# 生成不同尺寸的图标：72x72, 96x96, 144x144, 192x192

# 替换图标
cp your-icon-72x72.png android/app/src/main/res/mipmap-hdpi/ic_launcher.png
cp your-icon-96x96.png android/app/src/main/res/mipmap-xhdpi/ic_launcher.png
cp your-icon-144x144.png android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png
cp your-icon-192x192.png android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png
```

### 修改APP包名
编辑 `android/app/build.gradle`：
```gradle
android {
    defaultConfig {
        applicationId "com.hailin.pos.cashier"
        versionCode 1
        versionName "1.0.0"
    }
}
```

---

## 安装和测试

### 方法1：USB安装
```bash
# 连接手机到电脑（开启USB调试）

# 安装APK
adb install android/app/build/outputs/apk/debug/app-debug.apk

# 卸载APP
adb uninstall com.hailin.pos.cashier
```

### 方法2：扫码安装
1. 将APK上传到服务器
2. 生成下载二维码
3. 使用手机扫码下载安装

### 方法3：应用商店发布
1. 注册开发者账号
2. 提交APK到应用商店
3. 等待审核通过

---

## 常见问题

### Q1: 构建失败，提示gradle错误
```bash
# 清理gradle缓存
cd android && ./gradlew clean && cd ..

# 重新构建
pnpm run build && npx cap sync android
```

### Q2: 无法打开Android Studio
```bash
# 检查Android Studio是否安装
which android-studio

# 如果未安装，下载安装
# https://developer.android.com/studio
```

### Q3: APK安装失败
- 确保手机开启"允许安装未知来源应用"
- 检查Android版本兼容性（建议Android 7.0+）
- Debug版本不需要签名，Release版本必须签名

### Q4: 应用启动黑屏
- 检查 `capacitor.config.ts` 中的启动屏配置
- 确保Next.js构建成功
- 查看日志：`adb logcat | grep Capacitor`

---

## 环境变量配置

### 开发环境
编辑 `capacitor.config.ts`：
```typescript
server: {
  url: 'http://192.168.1.100:5000',  // 开发时使用本地服务器
  cleartext: true
}
```

### 生产环境
编辑 `capacitor.config.ts`：
```typescript
server: {
  // 不设置url，使用打包的静态文件
  cleartext: true
}
```

---

## 发布流程

### 1. 测试阶段
- 构建Debug APK
- 内部测试
- 收集反馈

### 2. 灰度发布
- 构建Release APK
- 小范围测试
- 监控问题

### 3. 正式发布
- 提交到应用商店
- 等待审核
- 上架发布

---

## 快速命令参考

```bash
# 完整构建流程
pnpm run build && npx cap sync android && pnpm run android:open

# 快速构建Debug APK
pnpm run build && npx cap sync android && cd android && ./gradlew assembleDebug && cd ..

# 打开Android Studio
pnpm run android:open

# 查看APK文件
ls -lh android/app/build/outputs/apk/

# 清理构建
cd android && ./gradlew clean && cd ..
```

---

## 下一步

1. ✅ 测试收银台APP功能
2. ✅ 集成扫码、蓝牙等硬件
3. ✅ 测试离线功能
4. ✅ 准备APP图标和启动屏
5. ✅ 配置签名文件
6. ✅ 构建Release版本
7. ✅ 提交应用商店

---

**文档版本**：v1.0
**更新时间**：2024-04-07
