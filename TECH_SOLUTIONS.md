# 海邻到家 - 技术方案建议

## 📋 目录
1. [收银台APP生成方案](#1-收银台app生成方案)
2. [商城小程序开发方案](#2-商城小程序开发方案)
3. [接龙对接微信方案](#3-接龙对接微信方案)
4. [总体架构建议](#4-总体架构建议)

---

## 1. 收银台APP生成方案

### ✅ 当前状态
项目已集成 **Capacitor** 框架，具备生成原生APP的能力：
- `@capacitor/core` + `@capacitor/android` 已安装
- 支持扫码、蓝牙等硬件设备集成
- 已配置 PWA（Progressive Web App）

### 🎯 推荐方案

#### 方案A： Capacitor Android APP（推荐用于门店固定设备）

**优势：**
- ✅ 原生体验，性能好
- ✅ 支持硬件设备（扫码枪、打印机、钱箱）
- ✅ 离线运行支持（IndexedDB）
- ✅ 可后台运行，不会被系统杀死
- ✅ 可设置为默认启动APP

**适用场景：**
- 门店收银台固定电脑/平板
- 需要硬件设备支持
- 长时间运行不退出的场景

**构建步骤：**
```bash
# 1. 构建项目
pnpm run build

# 2. 同步到Android
npx cap sync android

# 3. 打开Android Studio
pnpm run android:open

# 4. 在Android Studio中构建APK
# - Debug版本：菜单 → Build → Build Bundle(s) / APK(s) → Build APK(s)
# - Release版本：菜单 → Build → Generate Signed Bundle / APK

# 或使用命令行
cd android && ./gradlew assembleDebug    # Debug版本
cd android && ./gradlew assembleRelease  # Release版本
```

**APK输出位置：**
- Debug: `android/app/build/outputs/apk/debug/app-debug.apk`
- Release: `android/app/build/outputs/apk/release/app-release.apk`

---

#### 方案B：PWA（推荐用于移动临时使用）

**优势：**
- ✅ 无需审核，跨平台
- ✅ 可安装到手机桌面
- ✅ 自动更新
- ✅ 体积小，不占存储空间

**适用场景：**
- 员工个人手机临时收银
- 快速试用场景
- 不想安装APP的情况

**安装方式：**
1. 在浏览器打开收银台页面
2. 点击浏览器"添加到主屏幕"
3. 创建桌面图标，像APP一样使用

---

#### 方案C：Electron桌面端（可选）

**优势：**
- ✅ 跨平台（Windows/Mac/Linux）
- ✅ 更好的桌面系统集成
- ✅ 可以访问更多系统API

**适用场景：**
- 需要在电脑端原生运行
- 需要更多系统权限

---

### 🎨 收银台APP配置

#### 当前配置（`capacitor.config.ts`）
```typescript
{
  appId: 'com.hailin.pos.cashier',
  appName: '海邻收银台',
  backgroundColor: '#FF6B35',
  plugins: {
    BarcodeScanner: { /* 扫码支持 */ },
    SplashScreen: { /* 启动屏 */ }
  }
}
```

#### 个性化配置建议
```typescript
// 修改APP名称和图标
{
  appName: '海邻收银台',  // 显示名称
  version: '1.0.0',      // 版本号
  versionCode: 1,        // Android版本号

  // 启动屏配置
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#FF6B35',
      androidSplashResourceName: 'splash',  // 启动屏图片
      showSpinner: false
    }
  }
}
```

---

## 2. 商城小程序开发方案

### 🎯 推荐方案：uni-app（Vue生态）

**为什么选择uni-app？**
- ✅ Vue语法，学习成本低
- ✅ 可同时发布到微信、支付宝、抖音等多平台
- ✅ 生态成熟，组件丰富
- ✅ 与现有Next.js后端API无缝对接
- ✅ 支持H5页面，一端开发多端复用

### 🏗️ 项目结构建议

```
hailin-ministore/          # 小程序项目（独立目录）
├── pages/                 # 页面
│   ├── index/            # 首页
│   ├── category/         # 分类页
│   ├── product/          # 商品详情
│   ├── cart/             # 购物车
│   ├── order/            # 订单页
│   ├── user/             # 用户中心
│   └── groupbuy/         # 团购专区
├── components/           # 组件
│   ├── product-card/     # 商品卡片
│   └── nav-bar/          # 导航栏
├── api/                  # API封装
│   ├── products.js       # 商品API
│   ├── orders.js         # 订单API
│   └── members.js        # 会员API
├── store/                # 状态管理
│   ├── cart.js           # 购物车
│   └── user.js           # 用户信息
├── static/               # 静态资源
├── utils/                # 工具函数
└── manifest.json         # 配置文件
```

### 🔌 API对接方案

#### 复用现有后端API
小程序通过HTTP请求调用现有的Next.js API：

```javascript
// api/products.js
const BASE_URL = 'https://hldj365.coze.site/api';

export function getProducts(params) {
  return uni.request({
    url: `${BASE_URL}/products`,
    method: 'GET',
    data: params
  });
}

export function getProductDetail(id) {
  return uni.request({
    url: `${BASE_URL}/products/${id}`,
    method: 'GET'
  });
}
```

#### 跨域解决方案
```javascript
// manifest.json
{
  "networkTimeout": {
    "request": 10000
  },
  "mp-weixin": {
    "permission": {
      "scope.userLocation": {
        "desc": "用于定位附近门店"
      }
    }
  }
}
```

### 📦 核心功能模块

#### 1. 商品展示
- 首页轮播、分类导航、商品列表
- 商品详情（主图、详情图、规格、评价）
- 搜索功能

#### 2. 购物车
- 商品添加、删除、数量修改
- 价格计算
- 优惠券使用

#### 3. 订单流程
- 提交订单
- 在线支付（微信支付）
- 订单状态跟踪
- 订单列表、详情

#### 4. 会员系统
- 微信授权登录
- 会员信息展示
- 积分、优惠券查询

#### 5. 团购功能
- 团购商品列表
- 团购活动详情
- 参与团购
- 团购订单

### 🚀 快速开始

```bash
# 1. 安装HBuilderX（推荐）
# 下载：https://www.dcloud.io/hbuilderx.html

# 2. 创建项目
# 使用HBuilderX创建uni-app项目，选择Vue3版本

# 3. 安装依赖
npm install

# 4. 运行到微信开发者工具
# 菜单 → 运行 → 运行到小程序模拟器 → 微信开发者工具

# 5. 发布小程序
# 菜单 → 发行 → 小程序-微信
```

---

## 3. 接龙对接微信方案

### 📊 方案对比

| 方案 | 优势 | 劣势 | 推荐度 |
|------|------|------|--------|
| **小程序** | 体验好、功能强、易传播 | 开发成本高 | ⭐⭐⭐⭐⭐ |
| **公众号链接** | 开发简单、无需审核 | 体验差、受限制多 | ⭐⭐ |
| **H5网页+JSSDK** | 兼容性好、开发灵活 | 功能受限 | ⭐⭐⭐ |
| **企业微信** | 企业场景、办公集成 | 不适合C端 | ⭐⭐ |

---

### 🎯 强烈推荐：小程序方案

#### 为什么选小程序？

**用户体验：**
- ✅ 原生级体验，流畅度高
- ✅ 界面统一，无适配问题
- ✅ 启动快，无需加载浏览器

**功能强大：**
- ✅ 支持微信支付
- ✅ 支持定位（附近门店）
- ✅ 支持扫码（商品扫码）
- ✅ 支持分享（一键分享接龙）
- ✅ 支持订阅消息（订单状态通知）
- ✅ 支持客服（在线客服）

**传播便利：**
- ✅ 微信内直接打开，无需跳转
- ✅ 分享给好友/群/朋友圈
- ✅ 公众号内嵌入（菜单/文章）
- ✅ 二维码扫描打开

#### 实现方案

**方案3.1：独立小程序（推荐）**
```
海邻接龙小程序
├── 接龙列表
├── 创建接龙
├── 参与接龙
├── 接龙详情
├── 我的接龙
└── 消息通知
```

**方案3.2：商城小程序内置（省钱方案）**
在商城小程序中添加接龙模块，避免重复开发。

#### 分享传播流程
```mermaid
用户A创建接龙
    ↓
生成分享海报/链接
    ↓
分享到微信群/好友
    ↓
用户B点击打开接龙
    ↓
参与接龙（填写信息+支付）
    ↓
接龙订单生成
    ↓
团长收到通知
```

#### 核心功能实现

**1. 创建接龙**
```javascript
// pages/create-chain/index.vue
export default {
  data() {
    return {
      title: '',
      description: '',
      endDate: '',
      items: [],  // 接龙商品
      limit: 0    // 参与人数限制
    }
  },
  methods: {
    async createChain() {
      const res = await this.$http.post('/api/groupbuy/create', this.data)
      if (res.success) {
        uni.showToast({ title: '创建成功' })
        uni.navigateTo({ url: `/pages/chain-detail?id=${res.data.id}` })
      }
    }
  }
}
```

**2. 参与接龙**
```javascript
// pages/chain-detail/index.vue
export default {
  methods: {
    async joinChain() {
      // 1. 检查登录
      if (!this.userInfo) {
        uni.navigateTo({ url: '/pages/login/index' })
        return
      }

      // 2. 选择商品
      // ...

      // 3. 提交订单
      const res = await this.$http.post('/api/groupbuy/join', {
        chainId: this.chainId,
        items: this.selectedItems,
        userInfo: this.userInfo
      })

      // 4. 微信支付
      if (res.needPay) {
        uni.requestPayment({
          provider: 'wxpay',
          timeStamp: res.timeStamp,
          nonceStr: res.nonceStr,
          package: res.package,
          signType: 'MD5',
          paySign: res.paySign,
          success: () => {
            uni.showToast({ title: '参与成功' })
          }
        })
      }
    },

    // 3. 分享接龙
    onShareAppMessage() {
      return {
        title: `${this.chain.title} - 快来参与吧！`,
        path: `/pages/chain-detail?id=${this.chainId}`,
        imageUrl: this.chain.coverImage
      }
    }
  }
}
```

**3. 生成分享海报**
```javascript
// 使用canvas绘制海报
import { createPoster } from '@/utils/poster.js'

export default {
  methods: {
    async generatePoster() {
      const canvas = uni.createCanvasContext('poster')
      // 绘制背景、商品图片、二维码等
      await createPoster(canvas, this.chain)
      uni.canvasToTempFilePath({
        canvasId: 'poster',
        success: (res) => {
          // 保存到相册或分享
        }
      })
    }
  }
}
```

---

### 🔗 公众号链接方案（不推荐）

如果预算有限，可以考虑H5网页+公众号跳转：

**实现方式：**
```javascript
// 在公众号菜单中配置链接
// 跳转到H5接龙页面
https://hldj365.coze.site/groupbuy/chain-detail?id=xxx

// H5页面使用微信JSSDK
wx.config({
  // 配置
})

wx.ready(() => {
  // 隐藏分享按钮，只允许复制链接
  wx.hideMenuItems({
    menuList: ['menuItem:share:appMessage']
  })
})
```

**缺点：**
- ❌ 无法使用微信支付
- ❌ 用户体验差，有浏览器头部
- ❌ 无法订阅消息通知
- ❌ 分享受限（只能复制链接）

---

## 4. 总体架构建议

### 🏢 系统架构图

```
┌─────────────────────────────────────────────────────────┐
│                    用户层                                │
├──────────────┬──────────────┬──────────────┬────────────┤
│  收银台APP   │   商城小程序  │  接龙小程序  │  公众号    │
│ (Capacitor)  │   (uni-app)  │   (uni-app)  │  (菜单)    │
└──────┬───────┴──────┬───────┴──────┬───────┴─────┬──────┘
       │              │              │              │
       └──────────────┼──────────────┼──────────────┘
                      │              │
┌─────────────────────┼──────────────┼─────────────────────┐
│                    Next.js API层                          │
│  /api/products  /api/orders  /api/members  /api/groupbuy  │
└─────────────────────┼──────────────┼─────────────────────┘
                      │              │
┌─────────────────────┴──────────────┴─────────────────────┐
│                     业务逻辑层                            │
│  商品服务  订单服务  会员服务  团购服务  供应链服务       │
└─────────────────────┬────────────────────────────────────┘
                      │
┌─────────────────────┴────────────────────────────────────┐
│                    数据存储层                             │
│      PostgreSQL (关系数据)    IndexedDB (离线数据)       │
└─────────────────────────────────────────────────────────┘
```

### 📱 前端应用对应关系

| 应用 | 技术 | 平台 | 用途 |
|------|------|------|------|
| **收银台APP** | Next.js + Capacitor | Android | 门店收银 |
| **店长助手APP** | Next.js + PWA | H5/移动端 | 移动管理 |
| **店长管理** | Next.js Web | PC端 | 门店管理 |
| **总部管理** | Next.js Web | PC端 | 总部后台 |
| **商城小程序** | uni-app | 微信小程序 | 线上商城 |
| **接龙小程序** | uni-app | 微信小程序 | 社区团购 |
| **公众号** | H5页面 | 微信公众号 | 营销推广 |

### 🔄 数据共享策略

**共享数据（PostgreSQL）：**
- 商品信息（多端共享）
- 订单数据（多端同步）
- 会员数据（统一体系）
- 库存数据（实时同步）

**独立数据：**
- 收银台离线数据（IndexedDB）
- 本地缓存数据（临时存储）

### 🔐 认证授权

**统一认证中心：**
- 门店员工：手机号+密码
- 会员：微信授权
- 管理员：账号+密码

**权限管理：**
- 总部：所有权限
- 店长：店铺权限
- 员工：收银权限

---

## 🚀 实施路线图

### 第一阶段（已完成）
- ✅ 收银台Web版
- ✅ 总部管理系统
- ✅ 店长助手移动端
- ✅ 店长管理PC端

### 第二阶段（进行中）
- 🔄 收银台APP（Capacitor打包）
- 🔄 商城小程序开发

### 第三阶段（规划中）
- ⬜ 接龙小程序开发
- ⬜ 公众号集成
- ⬜ 支付功能对接

### 第四阶段（优化）
- ⬜ 性能优化
- ⬜ 数据分析
- ⬜ AI智能推荐

---

## 📞 技术支持

### 开发文档
- Next.js: https://nextjs.org/docs
- Capacitor: https://capacitorjs.com/docs
- uni-app: https://uniapp.dcloud.net.cn/
- 微信小程序: https://developers.weixin.qq.com/miniprogram/dev/framework/

### 常见问题

**Q1: 收银台APP如何更新？**
A: 重新构建Next.js → 同步到Android → 生成新APK → 用户安装

**Q2: 小程序如何获取用户信息？**
A: 使用 `uni.getUserProfile()` 或 `wx.getUserProfile()` 获取用户授权

**Q3: 接龙如何实现支付？**
A: 后端调用微信统一下单API，返回支付参数，小程序调起支付

**Q4: 如何实现离线收银？**
A: 使用IndexedDB缓存商品数据，离线时使用缓存，联网后同步

---

## 📝 总结

### 推荐方案
1. **收银台APP**：使用Capacitor打包Android APK（已配置好）
2. **商城小程序**：使用uni-app开发（Vue生态，易上手）
3. **接龙对接**：使用小程序（体验好、功能强、易传播）

### 优势
- ✅ 技术栈统一（前后端分离）
- ✅ 后端API复用（减少重复开发）
- ✅ 用户体验优秀
- ✅ 传播效率高

### 下一步行动
1. 测试收银台APP构建流程
2. 搭建商城小程序项目框架
3. 设计接龙小程序原型
4. 对接微信支付功能

---

**文档版本**：v1.0
**更新时间**：2024-04-07
**维护者**：海邻到家技术团队
