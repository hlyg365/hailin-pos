# 🛍️ 商城小程序开发指南

## 技术选型

### 推荐方案：uni-app (Vue 3)

**优势：**
- ✅ Vue语法，学习成本低
- ✅ 一端开发，多端发布（微信、支付宝、抖音等）
- ✅ 生态成熟，组件丰富
- ✅ 与现有Next.js后端无缝对接
- ✅ 支持H5，可复用代码

---

## 快速开始

### 步骤1：安装开发工具

#### HBuilderX（推荐）
```bash
# 下载HBuilderX
https://www.dcloud.io/hbuilderx.html

# 选择"App开发版"（包含小程序开发功能）
```

#### VS Code（可选）
```bash
# 安装uni-app插件
code --install-extension uni-helper.uni-app-vscode
code --install-extension uni-helper.uni-app-snippets
```

### 步骤2：创建项目

#### 使用HBuilderX创建
```
1. 打开HBuilderX
2. 文件 → 新建 → 项目
3. 选择uni-app → Vue3版本
4. 项目名称：hailin-ministore
5. 选择模板：uni-ui项目
6. 点击创建
```

#### 使用命令行创建
```bash
# 使用vue-cli
npm install -g @vue/cli
vue create -p dcloudio/uni-preset-vue hailin-ministore

# 或使用Vite
npm init vite@latest hailin-ministore -- --template uniapp
```

### 步骤3：项目结构

```
hailin-ministore/
├── pages/                  # 页面
│   ├── index/             # 首页
│   ├── category/          # 分类页
│   ├── product/           # 商品详情
│   ├── cart/              # 购物车
│   ├── order/             # 订单
│   └── user/              # 用户中心
├── components/            # 组件
├── api/                   # API封装
├── store/                 # 状态管理（Pinia）
├── utils/                 # 工具函数
├── static/                # 静态资源
├── uni_modules/           # uni-app插件
├── pages.json             # 页面配置
├── manifest.json          # 应用配置
└── App.vue                # 应用入口
```

---

## 核心功能开发

### 1. API封装

```javascript
// api/request.js
const BASE_URL = 'https://hldj365.coze.site/api'

export function request(options) {
  return new Promise((resolve, reject) => {
    uni.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        'Authorization': uni.getStorageSync('token') || ''
      },
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data)
        } else {
          reject(res)
        }
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

// api/products.js
import { request } from './request.js'

export function getProducts(params) {
  return request({
    url: '/products',
    method: 'GET',
    data: params
  })
}

export function getProductDetail(id) {
  return request({
    url: `/products/${id}`,
    method: 'GET'
  })
}
```

### 2. 首页开发

```vue
<!-- pages/index/index.vue -->
<template>
  <view class="home">
    <!-- 搜索栏 -->
    <view class="search-bar">
      <input type="text" placeholder="搜索商品" @confirm="onSearch" />
    </view>

    <!-- 轮播图 -->
    <swiper class="banner" :indicator-dots="true" :autoplay="true">
      <swiper-item v-for="(item, index) in banners" :key="index">
        <image :src="item.image" mode="aspectFill" />
      </swiper-item>
    </swiper>

    <!-- 分类导航 -->
    <view class="categories">
      <view
        v-for="cat in categories"
        :key="cat.id"
        class="category-item"
        @click="goToCategory(cat.id)"
      >
        <image :src="cat.icon" />
        <text>{{ cat.name }}</text>
      </view>
    </view>

    <!-- 商品列表 -->
    <view class="products">
      <view
        v-for="product in products"
        :key="product.id"
        class="product-card"
        @click="goToProduct(product.id)"
      >
        <image :src="product.image" />
        <view class="product-info">
          <text class="name">{{ product.name }}</text>
          <text class="price">¥{{ product.price }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { getProducts } from '@/api/products.js'

export default {
  data() {
    return {
      banners: [],
      categories: [],
      products: []
    }
  },
  onLoad() {
    this.loadData()
  },
  methods: {
    async loadData() {
      try {
        const res = await getProducts()
        this.products = res.data
      } catch (err) {
        uni.showToast({ title: '加载失败', icon: 'none' })
      }
    },
    goToProduct(id) {
      uni.navigateTo({ url: `/pages/product/detail?id=${id}` })
    },
    goToCategory(id) {
      uni.navigateTo({ url: `/pages/category/index?id=${id}` })
    },
    onSearch(e) {
      const keyword = e.detail.value
      uni.navigateTo({ url: `/pages/search/index?keyword=${keyword}` })
    }
  }
}
</script>

<style>
.home {
  padding-bottom: 100rpx;
}

.search-bar {
  padding: 20rpx;
  background: #fff;
}

.search-bar input {
  width: 100%;
  height: 70rpx;
  background: #f5f5f5;
  border-radius: 35rpx;
  padding: 0 30rpx;
}

.banner {
  height: 300rpx;
}

.banner image {
  width: 100%;
  height: 100%;
}

.categories {
  display: flex;
  flex-wrap: wrap;
  padding: 20rpx;
  background: #fff;
  margin: 20rpx;
  border-radius: 16rpx;
}

.category-item {
  width: 25%;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20rpx;
}

.category-item image {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  margin-bottom: 10rpx;
}

.products {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
  padding: 20rpx;
}

.product-card {
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
}

.product-card image {
  width: 100%;
  height: 300rpx;
}

.product-info {
  padding: 20rpx;
}

.name {
  font-size: 28rpx;
  color: #333;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.price {
  font-size: 32rpx;
  color: #ff6b35;
  font-weight: bold;
  display: block;
  margin-top: 10rpx;
}
</style>
```

### 3. 商品详情页

```vue
<!-- pages/product/detail.vue -->
<template>
  <view class="product-detail">
    <!-- 商品图片 -->
    <swiper class="images" :indicator-dots="true">
      <swiper-item v-for="(img, index) in product.images" :key="index">
        <image :src="img" mode="aspectFill" />
      </swiper-item>
    </swiper>

    <!-- 商品信息 -->
    <view class="info">
      <view class="name">{{ product.name }}</view>
      <view class="price">¥{{ product.price }}</view>
      <view class="sales">已售{{ product.sales }}件</view>
    </view>

    <!-- 规格选择 -->
    <view class="specs">
      <view class="title">规格</view>
      <view class="spec-list">
        <view
          v-for="(spec, index) in specs"
          :key="index"
          :class="['spec-item', { active: selectedSpec === index }]"
          @click="selectedSpec = index"
        >
          {{ spec }}
        </view>
      </view>
    </view>

    <!-- 底部操作栏 -->
    <view class="footer">
      <button class="btn-cart" @click="addToCart">加入购物车</button>
      <button class="btn-buy" @click="buyNow">立即购买</button>
    </view>
  </view>
</template>

<script>
import { getProductDetail } from '@/api/products.js'
import { useCartStore } from '@/store/cart.js'

export default {
  data() {
    return {
      product: {},
      specs: ['标准版', '升级版', '豪华版'],
      selectedSpec: 0
    }
  },
  onLoad(options) {
    this.loadProduct(options.id)
  },
  methods: {
    async loadProduct(id) {
      try {
        const res = await getProductDetail(id)
        this.product = res.data
      } catch (err) {
        uni.showToast({ title: '加载失败', icon: 'none' })
      }
    },
    addToCart() {
      const cart = useCartStore()
      cart.add({
        id: this.product.id,
        name: this.product.name,
        price: this.product.price,
        image: this.product.images[0],
        spec: this.specs[this.selectedSpec],
        quantity: 1
      })
      uni.showToast({ title: '已加入购物车' })
    },
    buyNow() {
      // 跳转到订单确认页
      uni.navigateTo({
        url: `/pages/order/confirm?id=${this.product.id}&spec=${this.selectedSpec}`
      })
    }
  }
}
</script>
```

### 4. 购物车

```javascript
// store/cart.js (Pinia)
import { defineStore } from 'pinia'

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: []
  }),
  getters: {
    totalCount: (state) => state.items.reduce((sum, item) => sum + item.quantity, 0),
    totalPrice: (state) => state.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  },
  actions: {
    add(product) {
      const existingItem = this.items.find(item => item.id === product.id && item.spec === product.spec)
      if (existingItem) {
        existingItem.quantity++
      } else {
        this.items.push(product)
      }
      this.saveToStorage()
    },
    remove(id, spec) {
      const index = this.items.findIndex(item => item.id === id && item.spec === spec)
      if (index > -1) {
        this.items.splice(index, 1)
        this.saveToStorage()
      }
    },
    updateQuantity(id, spec, quantity) {
      const item = this.items.find(item => item.id === id && item.spec === spec)
      if (item) {
        item.quantity = quantity
        this.saveToStorage()
      }
    },
    clear() {
      this.items = []
      this.saveToStorage()
    },
    saveToStorage() {
      uni.setStorageSync('cart', this.items)
    },
    loadFromStorage() {
      const cart = uni.getStorageSync('cart')
      if (cart) {
        this.items = cart
      }
    }
  }
})
```

### 5. 微信授权登录

```javascript
// api/auth.js
export function wxLogin() {
  return new Promise((resolve, reject) => {
    uni.login({
      provider: 'weixin',
      success: (loginRes) => {
        // 获取用户信息
        uni.getUserProfile({
          desc: '用于完善会员资料',
          success: (userRes) => {
            // 提交到后端
            uni.request({
              url: 'https://hldj365.coze.site/api/auth/wechat',
              method: 'POST',
              data: {
                code: loginRes.code,
                userInfo: userRes.userInfo
              },
              success: (res) => {
                // 保存token
                uni.setStorageSync('token', res.data.token)
                uni.setStorageSync('userInfo', res.data.userInfo)
                resolve(res.data)
              },
              fail: reject
            })
          },
          fail: reject
        })
      },
      fail: reject
    })
  })
}
```

---

## 微信支付集成

### 1. 后端统一下单

```javascript
// api/payment.js
export function createOrder(orderData) {
  return request({
    url: '/orders/create',
    method: 'POST',
    data: orderData
  })
}

export function wxPay(orderId) {
  return request({
    url: '/payment/wechat',
    method: 'POST',
    data: { orderId }
  })
}
```

### 2. 调起支付

```javascript
// 支付流程
async function payOrder(orderId) {
  try {
    // 1. 获取支付参数
    const payRes = await wxPay(orderId)

    // 2. 调起微信支付
    await new Promise((resolve, reject) => {
      uni.requestPayment({
        provider: 'wxpay',
        timeStamp: payRes.timeStamp,
        nonceStr: payRes.nonceStr,
        package: payRes.package,
        signType: payRes.signType,
        paySign: payRes.paySign,
        success: resolve,
        fail: reject
      })
    })

    // 3. 支付成功
    uni.showToast({ title: '支付成功' })
    uni.navigateTo({ url: '/pages/order/detail?id=' + orderId })

  } catch (err) {
    uni.showToast({ title: '支付失败', icon: 'none' })
  }
}
```

---

## 发布小程序

### 步骤1：配置小程序信息

编辑 `manifest.json`：
```json
{
  "mp-weixin": {
    "appid": "你的小程序AppID",
    "setting": {
      "urlCheck": true,
      "es6": true,
      "postcss": true
    },
    "permission": {
      "scope.userLocation": {
        "desc": "用于定位附近门店"
      }
    }
  }
}
```

### 步骤2：上传代码

在HBuilderX中：
```
发行 → 小程序-微信
```

### 步骤3：微信开发者工具提交

1. 打开微信开发者工具
2. 导入项目
3. 预览测试
4. 上传代码
5. 微信公众平台提交审核

---

## 常见问题

### Q1: 跨域问题
```javascript
// manifest.json中配置
"mp-weixin": {
  "networkTimeout": {
    "request": 10000
  }
}
```

### Q2: 图片加载失败
- 检查图片URL是否支持HTTPS
- 使用CDN加速
- 图片尺寸适中（建议< 500KB）

### Q3: 支付失败
- 检查AppID和AppSecret配置
- 确保后端统一下单接口正常
- 检查支付参数签名

### Q4: 性能优化
- 使用图片懒加载
- 合理使用缓存
- 减少网络请求

---

## 下一步

1. ✅ 搭建项目框架
2. ✅ 开发核心页面（首页、商品、购物车、订单）
3. ✅ 集成微信登录和支付
4. ✅ 测试和优化
5. ✅ 提交审核发布

---

**文档版本**：v1.0
**更新时间**：2024-04-07
