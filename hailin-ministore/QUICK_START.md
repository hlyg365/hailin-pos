# 快速开发指南

## 🚀 加速开发技巧

### 1. 使用快捷命令

```bash
# 快速创建新页面
mkdir -p pages/xxx
touch pages/xxx/index.vue

# 快速复制页面模板
cp pages/product/detail.vue pages/xxx/index.vue

# 批量创建文件
mkdir -p pages/xxx/components
touch pages/xxx/components/item.vue
```

### 2. 使用代码模板

#### 页面模板
```vue
<template>
  <view class="page-name">
    <!-- 页面内容 -->
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// 响应式数据
const list = ref([])

// 生命周期
onMounted(() => {
  loadData()
})

// 方法
const loadData = () => {
  // 加载数据
}
</script>

<style lang="scss" scoped>
.page-name {
  min-height: 100vh;
  background: #f5f5f5;
}
</style>
```

#### 组件模板
```vue
<template>
  <view class="component-name">
    <slot />
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  title: String,
  value: Number
})

const emit = defineEmits(['click'])
</script>

<style lang="scss" scoped>
.component-name {
  // 样式
}
</style>
```

### 3. 使用uni-ui组件库

```vue
<template>
  <!-- 卡片 -->
  <uni-card title="标题" extra="额外信息">
    内容
  </uni-card>

  <!-- 列表 -->
  <uni-list>
    <uni-list-item title="标题" note="备注" />
  </uni-list>

  <!-- 按钮 -->
  <uni-button type="primary">按钮</uni-button>

  <!-- 图标 -->
  <uni-icons type="home" size="24" color="#FF6B35" />
</template>
```

### 4. 使用Mock数据快速开发

```javascript
// 创建mock-data.js文件
export const mockProducts = [
  {
    id: '1',
    name: '商品1',
    image: 'https://via.placeholder.com/200x200/FF6B35/FFFFFF?text=商品1',
    price: '99.00',
    stock: 100,
    sales: 1000
  }
]

// 使用
import { mockProducts } from '@/utils/mock-data.js'

const products = ref(mockProducts)
```

### 5. 使用工具函数

```javascript
// 创建utils.js
export const formatDate = (date) => {
  return date.replace(/(\d{4})-(\d{2})-(\d{2})/, '$1/$2/$3')
}

export const formatPrice = (price) => {
  return '¥' + parseFloat(price).toFixed(2)
}

export const showToast = (title, icon = 'none') => {
  uni.showToast({ title, icon })
}

export const showLoading = (title = '加载中...') => {
  uni.showLoading({ title })
}

export const hideLoading = () => {
  uni.hideLoading()
}
```

### 6. 使用Pinia状态管理

```javascript
// 创建store/user.js
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: {},
    token: ''
  }),
  actions: {
    setUserInfo(userInfo) {
      this.userInfo = userInfo
    },
    setToken(token) {
      this.token = token
      uni.setStorageSync('token', token)
    }
  }
})

// 使用
import { useUserStore } from '@/store/user.js'

const userStore = useUserStore()
userStore.setToken('xxx')
```

### 7. 使用API封装

```javascript
// 创建api/request.js
const BASE_URL = 'https://your-api.com'

export const request = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    uni.request({
      url: BASE_URL + url,
      ...options,
      header: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + uni.getStorageSync('token')
      },
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data)
        } else {
          reject(res)
        }
      },
      fail: reject
    })
  })
}

// 创建api/products.js
import { request } from './request.js'

export const getProducts = () => {
  return request('/api/products')
}

export const getProductDetail = (id) => {
  return request(`/api/products/${id}`)
}
```

### 8. 使用Vite优化构建速度

```javascript
// vite.config.js
export default {
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true
      }
    }
  },
  server: {
    hmr: true // 热更新
  }
}
```

---

## 📦 组件复用

### 1. 创建通用组件

```vue
<!-- components/product-card.vue -->
<template>
  <view class="product-card" @click="onClick">
    <image :src="product.image" class="image" mode="aspectFill" />
    <view class="info">
      <text class="name">{{ product.name }}</text>
      <view class="bottom">
        <text class="price">¥{{ product.price }}</text>
        <text class="sales">已售{{ product.sales }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
const props = defineProps({
  product: Object
})

const emit = defineEmits(['click'])

const onClick = () => {
  emit('click', props.product)
}
</script>
```

### 2. 在多个页面复用

```vue
<!-- pages/index/index.vue -->
<template>
  <view class="home">
    <product-card
      v-for="product in products"
      :key="product.id"
      :product="product"
      @click="goToDetail"
    />
  </view>
</template>

<script setup>
import ProductCard from '@/components/product-card.vue'
</script>
```

---

## 🎨 快速UI开发

### 1. 使用Tailwind CSS

```vue
<template>
  <view class="p-4 bg-white rounded-lg shadow-md">
    <text class="text-xl font-bold text-gray-800">标题</text>
  </view>
</template>
```

### 2. 使用uni-ui主题

```javascript
// uni.scss
$uni-color-primary: #FF6B35;
$uni-color-success: #4CAF50;
$uni-color-warning: #FF9800;
$uni-color-error: #FF3B30;
```

---

## 🔧 调试技巧

### 1. 使用控制台

```javascript
console.log('数据:', data)
console.table(tableData)
console.time('timer')
// 代码
console.timeEnd('timer')
```

### 2. 使用微信开发者工具

- **调试面板**: 查看日志
- **性能分析**: 分析页面性能
- **网络面板**: 查看网络请求

### 3. 使用真机调试

```bash
# 微信开发者工具
1. 点击"真机调试"
2. 扫码连接手机
3. 查看真机效果
```

---

## 📚 常用资源

### 官方文档
- [uni-app官网](https://uniapp.dcloud.io/)
- [Vue 3文档](https://cn.vuejs.org/)
- [Pinia文档](https://pinia.vuejs.org/)

### 组件库
- [uni-ui](https://ext.dcloud.net.cn/plugin?id=55)
- [uView](https://www.uviewui.com/)
- [Vant Weapp](https://vant-contrib.gitee.io/vant-weapp/)

### 工具
- [HBuilderX](https://www.dcloud.io/hbuilderx.html)
- [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
- [VS Code](https://code.visualstudio.com/)

---

## ⚡ 性能优化

### 1. 图片优化

```javascript
// 使用CDN图片
const imageUrl = 'https://cdn.example.com/image.jpg?w=200&h=200'

// 使用WebP格式
const webpImage = 'https://cdn.example.com/image.webp'

// 懒加载
<image :src="product.image" lazy-load mode="aspectFill" />
```

### 2. 代码分包

```javascript
// pages.json
{
  "subPackages": [
    {
      "root": "pages/sub",
      "pages": [
        {
          "path": "detail/index"
        }
      ]
    }
  ]
}
```

### 3. 减少包大小

```javascript
// 按需引入
import { Button } from 'vant-weapp'

// 压缩图片
// 使用tinyPNG压缩图片
```

---

## 🎯 开发检查清单

### 页面开发
- [ ] 创建页面文件
- [ ] 配置pages.json
- [ ] 实现页面布局
- [ ] 添加数据请求
- [ ] 处理页面交互
- [ ] 优化页面性能
- [ ] 测试页面功能

### 组件开发
- [ ] 创建组件文件
- [ ] 定义组件Props
- [ ] 实现组件逻辑
- [ ] 添加组件样式
- [ ] 编写组件文档
- [ ] 测试组件功能

### API开发
- [ ] 定义API接口
- [ ] 封装请求方法
- [ ] 处理错误响应
- [ ] 添加请求拦截
- [ ] 测试API功能

---

**文档版本：v1.0**
**更新时间：2024-04-07**
**维护者：海邻到家技术团队**
