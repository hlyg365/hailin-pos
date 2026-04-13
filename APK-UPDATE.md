# 海邻到家 收银台APP 更新日志

## 当前版本

| 版本号 | 日期 | APK文件名 | 状态 |
|--------|------|-----------|------|
| v3.0 | 2026-04-13 | hailin-pos-v3.0.apk | ✅ 最新 |

## 历史版本

| 版本号 | 日期 | 变更说明 |
|--------|------|----------|
| v3.0 | 2026-04-13 | 初始版本 |

---

## 如何更新APP版本

每次构建新版本APK后，需要修改以下文件：

### 1. 更新首页配置
文件：`src/app/page.tsx`

找到 `APK_CONFIG` 配置，修改版本信息：

```typescript
const APK_CONFIG = {
  fileName: 'hailin-pos-v3.0.apk',  // ← 修改APK文件名
  version: '3.0',                     // ← 修改版本号
  buildDate: '2026-04-13',            // ← 修改构建日期
};
```

### 2. 更新收银台下载页面（可选）
文件：`src/app/pos/index/page.tsx`

在底部APK信息区域更新版本：

```typescript
const apkInfo = {
  version: 'v3.0',
  buildDate: '2026-04-13',
};
```

### 3. APK文件位置
- 开发版：`public/hailin-pos-v3.0.apk`
- 最新稳定版：复制到 `public/hailin-pos-latest.apk`

### 4. 下载地址
- 正式地址：`https://hldj365.coze.site/hailin-pos-v3.0.apk`
- 稳定地址：`https://hldj365.coze.site/hailin-pos-latest.apk`

---

## 自动化构建

使用构建脚本自动完成：

```bash
# 方式1：完整构建
bash scripts/build-pos-app.sh

# 方式2：分步构建
pnpm run build
pnpm run export
npx cap sync android
cd android && ./gradlew assembleDebug && cd ..
cp android/app/build/outputs/apk/debug/app-debug.apk public/hailin-pos-v3.0.apk
```

构建完成后，记得更新版本配置！
