# 三端应用快速启动指南

## 🚀 快速开始

### 前置条件
- Node.js 18+
- pnpm 8+
- Java JDK 11+
- Android SDK (仅收银台APP需要)
- 微信开发者工具 (仅小程序需要)

---

## 📱 1. 收银台APP

### 快速构建APK

```bash
# 进入项目目录
cd /workspace/projects

# 执行快速构建脚本
bash scripts/pos-app-quick-build.sh

# APK文件位置
android/app/build/outputs/apk/debug/app-debug.apk
```

### 安装到设备

```bash
# 连接设备（USB调试已开启）
adb devices

# 安装APK
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### 启动应用
```bash
# 启动应用
adb shell am start -n com.hailin.pos.cashier/.MainActivity
```

### 功能测试
- ✅ 扫码收银
- ✅ 购物车管理
- ✅ 支付功能
- ✅ 小票打印

---

## 🛒 2. 商城小程序

### 打开项目
1. 打开HBuilderX
2. 文件 > 打开目录
3. 选择 `hailin-ministore` 目录

### 运行小程序
1. 运行 > 运行到小程序模拟器 > 微信开发者工具
2. 或按 Ctrl+R

### 配置AppID
1. 在微信开发者工具中，点击"详情"
2. 点击"基本信息"
3. 点击"AppID"
4. 输入你的小程序AppID

### 核心功能
- ✅ 首页浏览
- ✅ 商品搜索
- ✅ 购物车
- ✅ 订单管理
- ✅ 个人中心

---

## 🔗 3. 接龙小程序

### 打开项目
1. 打开HBuilderX
2. 文件 > 打开目录
3. 选择 `hailin-ministore` 目录

### 运行小程序
1. 运行 > 运行到小程序模拟器 > 微信开发者工具
2. 或按 Ctrl+R

### 配置AppID
1. 在微信开发者工具中，点击"详情"
2. 点击"基本信息"
3. 点击"AppID"
4. 输入你的小程序AppID

### 核心功能
- ✅ 接龙列表
- ✅ 创建接龙
- ✅ 参与接龙
- ✅ 接龙管理
- ✅ 数据统计

---

## 🔧 4. 后端服务

### 启动开发服务器
```bash
cd /workspace/projects
pnpm dev
```

服务地址：http://localhost:5000

### API端点
- 商品API: `http://localhost:5000/api/products`
- 订单API: `http://localhost:5000/api/orders`
- 支付API: `http://localhost:5000/api/pay`
- 接龙API: `http://localhost:5000/api/chain`

### 测试API
```bash
# 测试健康检查
curl http://localhost:5000/api/health

# 测试商品API
curl http://localhost:5000/api/products
```

---

## 📖 详细文档

### 收银台APP
- [收银台APK构建指南](./POS_APK_BUILD_GUIDE.md)
- [Capacitor配置说明](./capacitor.config.ts)

### 商城小程序
- [商城小程序开发文档](./hailin-ministore/README.md)
- [API接口文档](./hailin-ministore/api/README.md)

### 接龙小程序
- [接龙小程序使用指南](./hailin-ministore/CHAIN_MINIPROGRAM_GUIDE.md)
- [接龙API文档](./hailin-ministore/api/chain.js)

### 上线相关
- [三端上线计划](./THREE_APP_LAUNCH_PLAN.md)
- [三端应用总览](./THREE_APP_OVERVIEW.md)

---

## 🎯 常用命令

### 项目管理
```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 启动生产服务器
pnpm start

# 类型检查
pnpm ts-check

# 代码检查
pnpm lint
```

### 收银台APP
```bash
# 同步Android
pnpm run android:sync

# 打开Android Studio
pnpm run android:open

# 构建APK (Debug)
pnpm run build:apk

# 构建APK (Release)
pnpm run build:apk:release
```

### 小程序
```bash
# 进入小程序目录
cd hailin-ministore

# 安装依赖
pnpm install

# 运行小程序
pnpm dev:mp-weixin

# 构建小程序
pnpm build:mp-weixin
```

---

## 🔍 调试技巧

### 收银台APP调试
```bash
# 查看日志
adb logcat | grep "hailin"

# 查看实时日志
adb logcat -c && adb logcat | grep "hailin"

# 连接调试器
adb forward tcp:5000 tcp:5000
```

### 小程序调试
1. 在微信开发者工具中，点击"调试器"
2. 打开Console标签
3. 查看日志和错误信息

### 后端调试
1. 查看 `/app/work/logs/bypass/app.log`
2. 查看 `/app/work/logs/bypass/console.log`
3. 使用Postman测试API

---

## ⚠️ 常见问题

### Q1: 收银台APK构建失败
**A**: 检查Java和Android SDK是否正确安装

### Q2: 小程序无法运行
**A**: 检查AppID是否正确配置

### Q3: 后端API无法访问
**A**: 检查服务是否启动，端口是否正确

### Q4: 支付功能无法使用
**A**: 检查微信支付配置是否正确

---

## 📞 技术支持

如有问题，请联系技术团队。

---

## 🎓 学习资源

### 官方文档
- [Next.js文档](https://nextjs.org/docs)
- [Vue 3文档](https://cn.vuejs.org/)
- [uni-app文档](https://uniapp.dcloud.io/)
- [Capacitor文档](https://capacitorjs.com/docs)

### 社区资源
- [Capacitor中文网](https://capacitorjs.com/zh-cn)
- [uni-app官网](https://uniapp.dcloud.io/)
- [微信小程序文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)

---

**文档版本：v1.0**
**创建时间：2024-04-07**
**维护者：海邻到家技术团队**
