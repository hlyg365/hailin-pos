# 海邻到家收银台 - 部署指南

## 代码状态

✅ 所有代码更新已完成并提交

## 推送代码到 GitHub

由于沙箱环境限制，需要手动推送代码。请在本地执行以下命令：

```bash
# 克隆仓库
git clone https://github.com/hlyg365/hailin-pos.git
cd hailin-pos/apps/pos-app

# 或者添加远程仓库（如果已有本地代码）
git remote add origin https://github.com/hlyg365/hailin-pos.git
git remote set-url origin https://github.com/hlyg365/hailin-pos.git

# 拉取最新代码
git pull origin main --rebase

# 推送代码
git push origin main
```

## GitHub Actions 自动构建

推送代码后，GitHub Actions 会自动：
1. 检出代码
2. 安装 Node.js 和 Java
3. 安装 pnpm 依赖
4. 构建 Web 应用
5. 同步到 Android
6. **构建 Debug APK**
7. 上传 APK 到 Artifacts

### 查看构建状态

1. 访问 https://github.com/hlyg365/hailin-pos/actions
2. 点击最新的 workflow 运行
3. 查看构建日志

### 下载 APK

构建成功后：
1. 进入 Actions 页面
2. 点击构建任务
3. 点击 Artifacts
4. 下载 `app-debug.apk`

## 本地构建 APK

如果在本地构建：

```bash
cd apps/pos-app

# 安装依赖
pnpm install

# 构建 Web
pnpm build

# 同步到 Android
npx cap sync android

# 构建 APK
cd android
./gradlew assembleDebug

# APK 输出位置
# android/app/build/outputs/apk/debug/app-debug.apk
```

## 硬件配置

### 电子秤配置

| 配置项 | 值 | 说明 |
|--------|-----|------|
| 端口 | `/dev/ttyS1` | Android 常用串口 |
| 波特率 | `9600` | 不要修改 |
| 协议 | `soki` | 顶尖 OS2 协议 |

### 打印机配置

| 配置项 | 值 |
|--------|-----|
| IP 地址 | `192.168.1.101` |
| 端口 | `9100` |

## 最新功能

### V6.0 更新

- ✅ 顶尖电子秤 OS2 协议支持
- ✅ ACLaS 协议支持
- ✅ 自动协议握手检测
- ✅ 多种波特率自动试探
- ✅ tp.xmaihh:serialport 库集成
- ✅ 设备调试页面 (`/device-debug`)

### 设备调试

访问 `/device-debug` 页面：
1. 选择连接类型（串口/网络/USB）
2. 配置参数
3. 点击"自动检测电子秤"
4. 观察检测结果

## 权限说明

串口设备需要系统级权限：
- 联系厂商获取系统签名
- 或使用 Root 权限
- 或使用网络模式（推荐）

## 技术支持

- 硬件文档：`docs/HARDWARE_CONFIG.md`
- 调试页面：`/device-debug`
- 构建日志：GitHub Actions
