<template>
  <view class="product-detail">
    <!-- 商品图片 -->
    <swiper class="images" :indicator-dots="true" :autoplay="false" indicator-color="#ddd" indicator-active-color="#FF6B35">
      <swiper-item v-for="(img, index) in product.images" :key="index">
        <image :src="img" mode="aspectFill" class="image" />
      </swiper-item>
    </swiper>

    <!-- 商品信息 -->
    <view class="info">
      <view class="price-row">
        <text class="price">¥{{ product.price }}</text>
        <text class="sales">已售{{ product.sales }}件</text>
      </view>
      <text class="name">{{ product.name }}</text>
      <text class="desc">{{ product.description }}</text>
    </view>

    <!-- 规格选择 -->
    <view class="specs" v-if="product.specs && product.specs.length > 0">
      <text class="label">规格</text>
      <view class="spec-list">
        <view
          v-for="(spec, index) in product.specs"
          :key="index"
          :class="['spec-item', { active: selectedSpec === index }]"
          @click="selectSpec(index)"
        >
          {{ spec }}
        </view>
      </view>
    </view>

    <!-- 数量选择 -->
    <view class="quantity">
      <text class="label">数量</text>
      <view class="counter">
        <view class="btn" @click="decreaseQuantity">-</view>
        <text class="count">{{ quantity }}</text>
        <view class="btn" @click="increaseQuantity">+</view>
      </view>
    </view>

    <!-- 底部操作栏 -->
    <view class="footer">
      <view class="left">
        <view class="icon-btn" @click="goToCart">
          <uni-icons type="cart" size="24" color="#666"></uni-icons>
          <text class="badge" v-if="cartCount > 0">{{ cartCount }}</text>
        </view>
        <view class="icon-btn" @click="goToHome">
          <uni-icons type="home" size="24" color="#666"></uni-icons>
        </view>
      </view>
      <button class="btn-add" @click="addToCart">加入购物车</button>
      <button class="btn-buy" @click="buyNow">立即购买</button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getProductDetail } from '@/api/products.js'

const productId = ref('')
const product = ref({})
const selectedSpec = ref(0)
const quantity = ref(1)
const cartCount = ref(0)

const selectSpec = (index) => {
  selectedSpec.value = index
}

const increaseQuantity = () => {
  quantity.value++
}

const decreaseQuantity = () => {
  if (quantity.value > 1) {
    quantity.value--
  }
}

const addToCart = () => {
  // TODO: 添加到购物车
  cartCount.value += quantity.value
  uni.showToast({ title: '已加入购物车', icon: 'success' })
}

const buyNow = () => {
  uni.navigateTo({ 
    url: `/pages/order/confirm?productId=${productId.value}&spec=${selectedSpec.value}&quantity=${quantity.value}`
  })
}

const goToCart = () => {
  uni.switchTab({ url: '/pages/cart/index' })
}

const goToHome = () => {
  uni.switchTab({ url: '/pages/index/index' })
}

onMounted(async () => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  productId.value = currentPage.options.id

  try {
    const res = await getProductDetail(productId.value)
    product.value = {
      ...res.data,
      images: res.data.images || ['https://via.placeholder.com/750x750/FF6B35/FFFFFF?text=商品'],
      specs: res.data.specs || ['默认']
    }
  } catch (err) {
    // 使用模拟数据
    product.value = {
      id: productId.value,
      name: '商品名称',
      price: '99.00',
      sales: 100,
      description: '商品描述信息',
      images: ['https://via.placeholder.com/750x750/FF6B35/FFFFFF?text=商品'],
      specs: ['默认规格']
    }
  }
})
</script>

<style lang="scss" scoped>
.product-detail {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 120rpx;
}

.images {
  height: 750rpx;
  background: #fff;
}

.image {
  width: 100%;
  height: 100%;
}

.info {
  background: #fff;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.price-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.price {
  font-size: 48rpx;
  color: #FF6B35;
  font-weight: bold;
}

.sales {
  font-size: 24rpx;
  color: #999;
}

.name {
  display: block;
  font-size: 32rpx;
  color: #333;
  font-weight: bold;
  margin-bottom: 16rpx;
}

.desc {
  display: block;
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
}

.specs, .quantity {
  background: #fff;
  padding: 30rpx;
  margin-bottom: 20rpx;
  display: flex;
  align-items: center;
}

.label {
  font-size: 28rpx;
  color: #333;
  margin-right: 20rpx;
  min-width: 100rpx;
}

.spec-list {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.spec-item {
  padding: 16rpx 32rpx;
  background: #f5f5f5;
  border-radius: 8rpx;
  font-size: 26rpx;
  color: #333;
  border: 1rpx solid transparent;
}

.spec-item.active {
  background: #FFF3E0;
  color: #FF6B35;
  border-color: #FF6B35;
}

.counter {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.btn {
  width: 60rpx;
  height: 60rpx;
  background: #f5f5f5;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  color: #333;
}

.count {
  font-size: 28rpx;
  min-width: 60rpx;
  text-align: center;
}

.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  background: #fff;
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.left {
  display: flex;
  gap: 30rpx;
  margin-right: 20rpx;
}

.icon-btn {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
}

.badge {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
  min-width: 32rpx;
  height: 32rpx;
  background: #FF6B35;
  color: #fff;
  border-radius: 16rpx;
  font-size: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8rpx;
}

.btn-add, .btn-buy {
  flex: 1;
  height: 80rpx;
  border-radius: 40rpx;
  font-size: 28rpx;
  font-weight: bold;
  margin-left: 20rpx;
}

.btn-add {
  background: #FFF3E0;
  color: #FF6B35;
}

.btn-buy {
  background: linear-gradient(135deg, #FF6B35 0%, #FF8C61 100%);
  color: #fff;
}
</style>
