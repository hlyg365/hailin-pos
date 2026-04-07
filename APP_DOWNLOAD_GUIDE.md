# APP下载页面使用指南

## 📱 APP下载入口

### 店长助手APP下载页面

**地址**: `/store-admin/app-download`

**访问方式**:
1. 店长管理后台 → 右上角菜单 → APP下载
2. 直接访问：`https://你的域名/store-admin/app-download`

---

## 🔧 APK构建流程

### 前置条件

1. **Android SDK** 已安装
2. **Java JDK 11+** 已安装
3. **Gradle** 已安装

### 构建步骤

#### 1. 同步前端代码到Android项目

```bash
# 在项目根目录执行
cd /workspace/projects

# 同步到Android项目
npx cap sync android
```

#### 2. 构建Debug APK

```bash
cd /workspace/projects/android

# 构建Debug版本
./gradlew assembleDebug

# 或者构建Release版本（需要签名）
./gradlew assembleRelease
```

#### 3. APK文件位置

```
android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 🌐 部署APK

### 方式1：部署到对象存储（推荐）

```bash
# 1. 复制APK到公共目录
cp android/app/build/outputs/apk/debug/app-debug.apk public/assistant.apk

# 2. 或者上传到对象存储
aws s3 cp android/app/build/outputs/apk/debug/app-debug.apk s3://your-bucket/assistant.apk
```

### 方式2：配置下载链接

编辑 `src/app/store-admin/app-download/page.tsx`：

```tsx
// 设置APK就绪状态
const [apkReady, setApkReady] = useState(true);

// 设置下载链接
const downloadUrl = 'https://your-cdn.com/assistant.apk';
```

---

## 📲 二维码生成

### 自动生成二维码

在下载页面中，可以集成二维码生成功能：

```tsx
// 使用 qrcode.react 库
import { QRCodeSVG } from 'qrcode.react';

<QRCodeSVG 
  value={`${domain}/assistant.apk`}
  size={192}
  level="H"
/>
```

### 第三方工具生成

1. 访问草料二维码：https://cli.im
2. 输入APK下载链接
3. 生成并下载二维码图片

---

## 📋 完整部署清单

| 步骤 | 操作 | 状态 |
|------|------|------|
| 1 | 构建APK | ☐ |
| 2 | 上传到CDN/对象存储 | ☐ |
| 3 | 更新下载页面链接 | ☐ |
| 4 | 生成二维码 | ☐ |
| 5 | 测试下载 | ☐ |
| 6 | 测试安装 | ☐ |

---

## 🐛 常见问题

### Q1: APK无法安装
**A**: 检查手机是否开启了"允许未知来源应用安装"

### Q2: 构建失败
**A**: 检查Android SDK和Java环境配置

```bash
# 检查环境
echo $ANDROID_HOME
echo $JAVA_HOME
```

### Q3: 下载链接404
**A**: 确保APK文件已上传到正确位置

### Q4: 二维码无法扫描
**A**: 确保下载链接是完整的HTTPS链接

---

## 📞 技术支持

如有问题，请联系开发团队。

---

**文档版本**：v1.0
**更新时间**：2024-04-07
