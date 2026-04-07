<template>
  <view class="home-container">
    <!-- 搜索栏 -->
    <view class="search-bar">
      <view class="search-box" @click="goToSearch">
        <uni-icons type="search" size="18" color="#999"></uni-icons>
        <text class="search-placeholder">搜索商品</text>
      </view>
    </view>

    <!-- 轮播图 -->
    <view class="banner-section">
      <swiper
        class="banner-swiper"
        :indicator-dots="true"
        :autoplay="true"
        :interval="3000"
        :duration="500"
        indicator-color="rgba(255,255,255,0.5)"
        indicator-active-color="#FF6B35"
      >
        <swiper-item v-for="(banner, index) in banners" :key="index">
          <image :src="banner.image" mode="aspectFill" class="banner-image" @click="onBannerClick(banner)"></image>
        </swiper-item>
      </swiper>
    </view>

    <!-- 分类导航 -->
    <view class="category-section">
      <scroll-view scroll-x class="category-scroll" show-scrollbar="false">
        <view
          v-for="category in categories"
          :key="category.id"
          class="category-item"
          @click="goToCategory(category)"
        >
          <image :src="category.icon" mode="aspectFill" class="category-icon"></image>
          <text class="category-name">{{ category.name }}</text>
        </view>
      </scroll-view>
    </view>

    <!-- 限时秒杀 -->
    <view class="section flash-sale" v-if="flashProducts.length > 0">
      <view class="section-header">
        <view class="section-title">
          <uni-icons type="fire" color="#FF6B35" size="20"></uni-icons>
          <text class="title-text">限时秒杀</text>
        </view>
        <view class="countdown">
          <text class="countdown-text">{{ countdownText }}</text>
        </view>
        <view class="more-link" @click="goToFlashSale">
          <text>更多</text>
          <uni-icons type="right" size="14" color="#999"></uni-icons>
        </view>
      </view>
      <scroll-view scroll-x class="product-scroll" show-scrollbar="false">
        <view class="flash-products">
          <view
            v-for="product in flashProducts"
            :key="product.id"
            class="flash-product-item"
            @click="goToProduct(product.id)"
          >
            <image :src="product.image" mode="aspectFill" class="product-image"></image>
            <view class="product-info">
              <text class="product-name">{{ product.name }}</text>
              <view class="price-box">
                <text class="current-price">¥{{ product.flashPrice }}</text>
                <text class="original-price">¥{{ product.price }}</text>
              </view>
              <view class="progress-bar">
                <view class="progress" :style="{ width: product.progress + '%' }"></view>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 热门推荐 -->
    <view class="section hot-products" v-if="hotProducts.length > 0">
      <view class="section-header">
        <view class="section-title">
          <uni-icons type="star" color="#FF6B35" size="20"></uni-icons>
          <text class="title-text">热门推荐</text>
        </view>
        <view class="more-link" @click="loadMoreHot">
          <text>更多</text>
          <uni-icons type="right" size="14" color="#999"></uni-icons>
        </view>
      </view>
      <view class="product-grid">
        <view
          v-for="product in hotProducts"
          :key="product.id"
          class="product-card"
          @click="goToProduct(product.id)"
        >
          <image :src="product.image" mode="aspectFill" class="product-image"></image>
          <view class="product-info">
            <text class="product-name">{{ product.name }}</text>
            <view class="product-tags">
              <text class="tag" v-if="product.isHot">热销</text>
              <text class="tag" v-if="product.isNew">新品</text>
            </view>
            <view class="price-box">
              <text class="current-price">¥{{ product.price }}</text>
              <text class="sales">已售{{ product.sales }}件</text>
            </view>
          </view>
          <view class="add-cart-btn" @click.stop="addToCart(product)">
            <uni-icons type="plus" size="20" color="#fff"></uni-icons>
          </view>
        </view>
      </view>
    </view>

    <!-- 新品上市 -->
    <view class="section new-products" v-if="newProducts.length > 0">
      <view class="section-header">
        <view class="section-title">
          <uni-icons type="gift" color="#FF6B35" size="20"></uni-icons>
          <text class="title-text">新品上市</text>
        </view>
        <view class="more-link" @click="loadMoreNew">
          <text>更多</text>
          <uni-icons type="right" size="14" color="#999"></uni-icons>
        </view>
      </view>
      <view class="product-grid">
        <view
          v-for="product in newProducts"
          :key="product.id"
          class="product-card"
          @click="goToProduct(product.id)"
        >
          <image :src="product.image" mode="aspectFill" class="product-image"></image>
          <view class="product-info">
            <text class="product-name">{{ product.name }}</text>
            <view class="product-tags">
              <text class="tag new-tag">新品</text>
            </view>
            <view class="price-box">
              <text class="current-price">¥{{ product.price }}</text>
              <text class="sales">已售{{ product.sales }}件</text>
            </view>
          </view>
          <view class="add-cart-btn" @click.stop="addToCart(product)">
            <uni-icons type="plus" size="20" color="#fff"></uni-icons>
          </view>
        </view>
      </view>
    </view>

    <!-- 加载更多 -->
    <view class="load-more" v-if="hasMore">
      <uni-load-more :status="loadStatus"></uni-load-more>
    </view>

    <!-- 返回顶部按钮 -->
    <view class="back-top" v-if="showBackTop" @click="scrollToTop">
      <uni-icons type="top" size="20" color="#fff"></uni-icons>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { getHotProducts, getNewProducts } from '@/api/products.js'

// 数据
const banners = ref([
  {
    id: 1,
    image: 'https://via.placeholder.com/750x350/FF6B35/FFFFFF?text=Banner+1',
    link: '/pages/category/index'
  },
  {
    id: 2,
    image: 'https://via.placeholder.com/750x350/FF8C61/FFFFFF?text=Banner+2',
    link: '/pages/category/index'
  },
  {
    id: 3,
    image: 'https://via.placeholder.com/750x350/FFA07A/FFFFFF?text=Banner+3',
    link: '/pages/category/index'
  }
])

const categories = ref([
  { id: 1, name: '零食饮料', icon: 'https://via.placeholder.com/100x100/FF6B35/FFFFFF?text=零食' },
  { id: 2, name: '日用百货', icon: 'https://via.placeholder.com/100x100/FF8C61/FFFFFF?text=日用' },
  { id: 3, name: '生鲜果蔬', icon: 'https://via.placeholder.com/100x100/FFA07A/FFFFFF?text=生鲜' },
  { id: 4, name: '粮油调味', icon: 'https://via.placeholder.com/100x100/FFB347/FFFFFF?text=粮油' },
  { id: 5, name: '个护化妆', icon: 'https://via.placeholder.com/100x100/FFCC80/FFFFFF?text=个护' },
  { id: 6, name: '母婴用品', icon: 'https://via.placeholder.com/100x100/FFD966/FFFFFF?text=母婴' }
])

const flashProducts = ref([])
const hotProducts = ref([])
const newProducts = ref([])
const countdown = ref(3600)
const showBackTop = ref(false)
const hasMore = ref(true)
const loadStatus = ref('more')

// 计算倒计时文本
const countdownText = ref('')

// 更新倒计时
const updateCountdown = () => {
  if (countdown.value <= 0) {
    countdownText.value = '秒杀已结束'
    return
  }

  const hours = Math.floor(countdown.value / 3600)
  const minutes = Math.floor((countdown.value % 3600) / 60)
  const seconds = countdown.value % 60

  countdownText.value = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  countdown.value--
}

// 加载限时秒杀商品
const loadFlashProducts = async () => {
  try {
    // 模拟数据
    flashProducts.value = [
      {
        id: 1,
        name: '可口可乐330ml*24罐',
        image: 'https://via.placeholder.com/200x200/FF6B35/FFFFFF?text=可乐',
        price: 68,
        flashPrice: 39.9,
        sales: 234,
        progress: 78
      },
      {
        id: 2,
        name: '乐事薯片原味70g',
        image: 'https://via.placeholder.com/200x200/FF8C61/FFFFFF?text=薯片',
        price: 8.5,
        flashPrice: 4.9,
        sales: 567,
        progress: 95
      }
    ]
  } catch (err) {
    console.error('加载秒杀商品失败', err)
  }
}

// 加载热门商品
const loadHotProducts = async () => {
  try {
    const res = await getHotProducts(10)
    hotProducts.value = res.data.map(item => ({
      ...item,
      isHot: true
    }))
  } catch (err) {
    console.error('加载热门商品失败', err)
    // 使用模拟数据
    hotProducts.value = Array(10).fill(null).map((_, i) => ({
      id: i + 1,
      name: `热门商品 ${i + 1}`,
      image: `https://via.placeholder.com/200x200/FF6B35/FFFFFF?text=商品${i + 1}`,
      price: (Math.random() * 100 + 10).toFixed(2),
      sales: Math.floor(Math.random() * 1000),
      isHot: true,
      isNew: i < 3
    }))
  }
}

// 加载新品
const loadNewProducts = async () => {
  try {
    const res = await getNewProducts(10)
    newProducts.value = res.data
  } catch (err) {
    console.error('加载新品失败', err)
    // 使用模拟数据
    newProducts.value = Array(10).fill(null).map((_, i) => ({
      id: i + 100,
      name: `新品商品 ${i + 1}`,
      image: `https://via.placeholder.com/200x200/FFA07A/FFFFFF?text=新品${i + 1}`,
      price: (Math.random() * 100 + 10).toFixed(2),
      sales: Math.floor(Math.random() * 100),
      isNew: true
    }))
  }
}

// 页面事件
const onBannerClick = (banner) => {
  if (banner.link) {
    uni.navigateTo({ url: banner.link })
  }
}

const goToSearch = () => {
  uni.navigateTo({ url: '/pages/search/index' })
}

const goToCategory = (category) => {
  uni.navigateTo({ url: `/pages/category/index?id=${category.id}` })
}

const goToProduct = (id) => {
  uni.navigateTo({ url: `/pages/product/detail?id=${id}` })
}

const goToFlashSale = () => {
  uni.navigateTo({ url: '/pages/activity/flash-sale' })
}

const addToCart = (product) => {
  uni.showToast({
    title: '已加入购物车',
    icon: 'success'
  })
  // TODO: 调用购物车API
}

const loadMoreHot = () => {
  uni.navigateTo({ url: '/pages/category/index?type=hot' })
}

const loadMoreNew = () => {
  uni.navigateTo({ url: '/pages/category/index?type=new' })
}

const scrollToTop = () => {
  uni.pageScrollTo({
    scrollTop: 0,
    duration: 300
  })
}

// 页面滚动监听
const onPageScroll = (e) => {
  showBackTop.value = e.scrollTop > 500
}

// 下拉刷新
const onPullDownRefresh = async () => {
  try {
    await Promise.all([
      loadFlashProducts(),
      loadHotProducts(),
      loadNewProducts()
    ])
    uni.stopPullDownRefresh()
    uni.showToast({
      title: '刷新成功',
      icon: 'success'
    })
  } catch (err) {
    uni.stopPullDownRefresh()
    uni.showToast({
      title: '刷新失败',
      icon: 'none'
    })
  }
}

// 生命周期
onMounted(() => {
  loadFlashProducts()
  loadHotProducts()
  loadNewProducts()

  // 启动倒计时
  const timer = setInterval(updateCountdown, 1000)
  updateCountdown()

  onUnmounted(() => {
    clearInterval(timer)
  })
})
</script>

<style lang="scss" scoped>
.home-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 20rpx;
}

.search-bar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: linear-gradient(135deg, #FF6B35 0%, #FF8C61 100%);
  padding: 20rpx 30rpx;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 10rpx;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 50rpx;
  padding: 16rpx 30rpx;
}

.search-placeholder {
  font-size: 28rpx;
  color: #999;
}

.banner-section {
  margin: 20rpx;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
}

.banner-swiper {
  height: 350rpx;
}

.banner-image {
  width: 100%;
  height: 100%;
}

.category-section {
  background: #fff;
  margin: 20rpx;
  padding: 30rpx 0;
  border-radius: 16rpx;
}

.category-scroll {
  white-space: nowrap;
}

.category-item {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  width: 150rpx;
  margin: 0 10rpx;
}

.category-icon {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  margin-bottom: 10rpx;
}

.category-name {
  font-size: 24rpx;
  color: #333;
}

.section {
  margin: 20rpx;
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.title-text {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.countdown {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-left: 20rpx;
}

.countdown-text {
  font-size: 24rpx;
  color: #FF6B35;
  font-weight: bold;
}

.more-link {
  display: flex;
  align-items: center;
  gap: 4rpx;
  font-size: 24rpx;
  color: #999;
}

.product-scroll {
  white-space: nowrap;
}

.flash-products {
  display: inline-flex;
  gap: 20rpx;
}

.flash-product-item {
  display: inline-block;
  width: 240rpx;
  white-space: normal;
}

.flash-product-item .product-image {
  width: 240rpx;
  height: 240rpx;
  border-radius: 12rpx;
  margin-bottom: 16rpx;
}

.product-info {
  padding: 0 8rpx;
}

.product-name {
  font-size: 26rpx;
  color: #333;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  line-height: 1.4;
}

.price-box {
  display: flex;
  align-items: baseline;
  gap: 10rpx;
  margin-top: 10rpx;
}

.current-price {
  font-size: 32rpx;
  color: #FF6B35;
  font-weight: bold;
}

.original-price {
  font-size: 24rpx;
  color: #999;
  text-decoration: line-through;
}

.sales {
  font-size: 22rpx;
  color: #999;
  margin-left: auto;
}

.progress-bar {
  height: 8rpx;
  background: #f5f5f5;
  border-radius: 4rpx;
  margin-top: 10rpx;
  overflow: hidden;
}

.progress {
  height: 100%;
  background: linear-gradient(90deg, #FF6B35 0%, #FF8C61 100%);
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}

.product-card {
  position: relative;
  background: #fff;
  border-radius: 12rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
}

.product-image {
  width: 100%;
  height: 300rpx;
}

.product-info {
  padding: 16rpx;
}

.product-tags {
  display: flex;
  gap: 8rpx;
  margin-top: 8rpx;
}

.tag {
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 4rpx;
  background: #FFF3E0;
  color: #FF6B35;
}

.new-tag {
  background: #E3F2FD;
  color: #2196F3;
}

.add-cart-btn {
  position: absolute;
  bottom: 16rpx;
  right: 16rpx;
  width: 56rpx;
  height: 56rpx;
  background: linear-gradient(135deg, #FF6B35 0%, #FF8C61 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 12rpx rgba(255, 107, 53, 0.3);
}

.load-more {
  padding: 40rpx 0;
}

.back-top {
  position: fixed;
  bottom: 100rpx;
  right: 30rpx;
  width: 80rpx;
  height: 80rpx;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
</style>
