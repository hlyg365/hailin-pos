# 海邻到家商城小程序

> 基于uni-app + Vue 3开发的社区便利店商城小程序

## 📦 项目简介

海邻到家商城小程序是一个完整的社区便利店电商解决方案，支持商品展示、购物车、订单管理、会员体系等核心功能。

## 🛠️ 技术栈

- **框架**: uni-app
- **语言**: Vue 3 (Composition API)
- **状态管理**: Pinia
- **UI组件**: uni-ui
- **API**: RESTful API

## 📁 项目结构

```
hailin-ministore/
├── api/                    # API接口封装
│   ├── request.js         # 请求封装
│   ├── products.js        # 商品API
│   ├── orders.js          # 订单API
│   └── members.js         # 会员API
├── pages/                  # 页面
│   ├── index/             # 首页 ✅
│   ├── category/          # 分类页
│   ├── product/           # 商品详情
│   ├── cart/              # 购物车
│   ├── order/             # 订单
│   └── user/              # 个人中心
├── components/            # 组件
├── store/                 # 状态管理
├── utils/                 # 工具函数
├── static/                # 静态资源
│   ├── images/            # 图片
│   └── icons/             # 图标
├── App.vue                # 应用入口
├── main.js                # 主文件
├── pages.json             # 页面配置
├── manifest.json          # 应用配置
└── package.json           # 依赖配置
```

## ✅ 已完成功能

### 1. 项目框架
- ✅ 项目结构搭建
- ✅ 配置文件（pages.json, manifest.json）
- ✅ 依赖配置（package.json）
- ✅ 应用入口（App.vue, main.js）

### 2. API封装
- ✅ 请求拦截器（request.js）
- ✅ 商品API（products.js）
- ✅ 订单API（orders.js）
- ✅ 会员API（members.js）

### 3. 首页
- ✅ 搜索栏
- ✅ 轮播图
- ✅ 分类导航
- ✅ 限时秒杀
- ✅ 热门推荐
- ✅ 新品上市
- ✅ 返回顶部按钮
- ✅ 下拉刷新

## 🚀 快速开始

### 环境准备

1. **下载HBuilderX**
   - 官网：https://www.dcloud.io/hbuilderx.html
   - 选择"App开发版"（包含小程序开发功能）

2. **安装微信开发者工具**
   - 官网：https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html

### 运行项目

1. **使用HBuilderX打开项目**
   ```
   文件 → 打开目录 → 选择 hailin-ministore 文件夹
   ```

2. **运行到微信小程序**
   ```
   菜单 → 运行 → 运行到小程序模拟器 → 微信开发者工具
   ```

3. **微信开发者工具中预览**
   - 自动打开微信开发者工具
   - 查看小程序运行效果

### 开发调试

1. **开启调试模式**
   - 微信开发者工具 → 详情 → 本地设置 → 勾选"不校验合法域名"

2. **查看控制台**
   - 微信开发者工具 → 调试器 → Console

3. **修改代码后**
   - HBuilderX会自动编译
   - 微信开发者工具会自动刷新

## 📱 页面说明

### 首页 (`/pages/index/index`)
- 轮播图展示
- 分类导航（横向滚动）
- 限时秒杀（倒计时、进度条）
- 热门推荐（两列布局）
- 新品上市
- 返回顶部按钮

### 待开发页面

#### 分类页 (`/pages/category/index`)
- 左侧分类列表
- 右侧商品列表
- 商品筛选（价格、销量等）

#### 商品详情页 (`/pages/product/detail`)
- 商品图片轮播
- 商品信息（价格、库存、销量）
- 规格选择
- 加入购物车
- 立即购买

#### 购物车 (`/pages/cart/index`)
- 商品列表
- 数量修改
- 选中/取消选中
- 价格计算
- 结算按钮

#### 订单页 (`/pages/order/index`)
- 订单状态筛选（全部、待付款、待发货、待收货、已完成）
- 订单列表
- 订单详情

#### 个人中心 (`/pages/user/index`)
- 用户信息
- 订单入口
- 优惠券
- 收货地址
- 设置

## 🔧 配置说明

### API地址配置

编辑 `api/request.js`：
```javascript
const BASE_URL = 'https://hldj365.coze.site/api'
```

### 微信小程序AppID配置

编辑 `manifest.json`：
```json
{
  "mp-weixin": {
    "appid": "你的小程序AppID"
  }
}
```

### 导航栏配置

编辑 `pages.json`：
```json
{
  "globalStyle": {
    "navigationBarBackgroundColor": "#FF6B35",
    "navigationBarTextStyle": "white"
  }
}
```

## 🎨 UI组件

项目使用uni-ui组件库，常用的有：
- `uni-icons`: 图标组件
- `uni-card`: 卡片组件
- `uni-list`: 列表组件
- `uni-load-more`: 加载更多组件

## 📊 数据流向

```
用户操作
    ↓
页面组件
    ↓
API调用 (api/*.js)
    ↓
请求拦截器 (api/request.js)
    ↓
后端API (https://hldj365.coze.site/api)
    ↓
返回数据
    ↓
页面更新
```

## 🔐 认证流程

1. **微信授权登录**
   ```javascript
   uni.login({
     provider: 'weixin',
     success: (res) => {
       // 获取code
       // 调用后端登录接口
     }
   })
   ```

2. **Token存储**
   ```javascript
   uni.setStorageSync('token', token)
   ```

3. **请求携带Token**
   ```javascript
   header: {
     'Authorization': token
   }
   ```

## 🛒 购物车功能

### 状态管理（Pinia）
```javascript
// store/cart.js
export const useCartStore = defineStore('cart', {
  state: () => ({
    items: []
  }),
  actions: {
    add(product) { /* 添加商品 */ },
    remove(id) { /* 删除商品 */ },
    updateQuantity(id, quantity) { /* 更新数量 */ },
    clear() { /* 清空购物车 */ }
  }
})
```

### 使用示例
```javascript
import { useCartStore } from '@/store/cart.js'

const cart = useCartStore()
cart.add(product)
```

## 💳 支付流程

1. **创建订单**
   ```javascript
   const order = await createOrder(orderData)
   ```

2. **获取支付参数**
   ```javascript
   const payParams = await getPaymentParams(orderId)
   ```

3. **调起微信支付**
   ```javascript
   uni.requestPayment({
     provider: 'wxpay',
     timeStamp: payParams.timeStamp,
     nonceStr: payParams.nonceStr,
     package: payParams.package,
     signType: payParams.signType,
     paySign: payParams.paySign,
     success: () => {
       // 支付成功
     }
   })
   ```

## 📦 发布小程序

1. **配置小程序信息**
   - 在微信公众平台注册小程序
   - 获取AppID
   - 配置服务器域名

2. **上传代码**
   ```
   菜单 → 发行 → 小程序-微信
   ```

3. **微信开发者工具提交**
   - 打开微信开发者工具
   - 预览测试
   - 上传代码
   - 提交审核

## 🐛 常见问题

### 1. 跨域问题
```javascript
// manifest.json中配置
"mp-weixin": {
  "setting": {
    "urlCheck": false  // 开发环境关闭
  }
}
```

### 2. 图片加载失败
- 检查图片URL是否支持HTTPS
- 使用CDN加速
- 图片尺寸适中（建议< 500KB）

### 3. 支付失败
- 检查AppID和AppSecret配置
- 确保后端统一下单接口正常
- 检查支付参数签名

## 📝 后续开发计划

### 第一阶段（核心功能）
- [ ] 商品详情页
- [ ] 购物车页面
- [ ] 订单页面
- [ ] 个人中心

### 第二阶段（功能完善）
- [ ] 微信登录
- [ ] 微信支付
- [ ] 收货地址管理
- [ ] 优惠券功能

### 第三阶段（优化提升）
- [ ] 商品搜索
- [ ] 商品筛选
- [ ] 订单状态跟踪
- [ ] 性能优化

## 🤝 贡献指南

1. Fork本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交Pull Request

## 📄 许可证

本项目采用 MIT 许可证。

## 👥 联系我们

如有问题，请联系开发团队。

---

**项目状态**: 🚧 开发中

**最后更新**: 2024-04-07
