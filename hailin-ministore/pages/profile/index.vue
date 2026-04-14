<template>
  <view class="profile">
    <!-- 用户信息卡片 -->
    <view class="user-card">
      <image 
        :src="userInfo.avatar || '/static/default-avatar.png'" 
        class="avatar" 
        mode="aspectFill"
      />
      <view class="info">
        <text class="name">{{ userInfo.nickname || '点击登录' }}</text>
        <text class="level">{{ userInfo.level || '普通会员' }}</text>
      </view>
      <view class="btn-login" v-if="!isLogin" @click="goToLogin">
        <uni-icons type="arrow-right" size="24" color="#999"></uni-icons>
      </view>
    </view>

    <!-- 会员权益 -->
    <view class="member-card">
      <view class="header">
        <text class="title">会员权益</text>
        <text class="desc">开通会员享更多优惠</text>
      </view>
      <view class="privileges">
        <view class="item">
          <uni-icons type="gift" size="32" color="#FF6B35"></uni-icons>
          <text class="label">专属折扣</text>
        </view>
        <view class="item">
          <uni-icons type="gift" size="32" color="#FF6B35"></uni-icons>
          <text class="label">积分翻倍</text>
        </view>
        <view class="item">
          <uni-icons type="gift" size="32" color="#FF6B35"></uni-icons>
          <text class="label">生日特权</text>
        </view>
        <view class="item">
          <uni-icons type="gift" size="32" color="#FF6B35"></uni-icons>
          <text class="label">专属客服</text>
        </view>
      </view>
    </view>

    <!-- 订单入口 -->
    <view class="order-section">
      <view class="section-header">
        <text class="title">我的订单</text>
        <view class="btn-more" @click="goToOrders">
          <text class="text">全部订单</text>
          <uni-icons type="arrow-right" size="24" color="#999"></uni-icons>
        </view>
      </view>
      <view class="order-types">
        <view class="type-item" @click="goToOrders('pending')">
          <view class="icon">
            <uni-icons type="wallet" size="40" color="#FF6B35"></uni-icons>
            <text class="badge" v-if="orderCounts.pending > 0">{{ orderCounts.pending }}</text>
          </view>
          <text class="label">待支付</text>
        </view>
        <view class="type-item" @click="goToOrders('paid')">
          <view class="icon">
            <uni-icons type="list" size="40" color="#FF6B35"></uni-icons>
            <text class="badge" v-if="orderCounts.paid > 0">{{ orderCounts.paid }}</text>
          </view>
          <text class="label">待发货</text>
        </view>
        <view class="type-item" @click="goToOrders('shipped')">
          <view class="icon">
            <uni-icons type="paperplane" size="40" color="#FF6B35"></uni-icons>
            <text class="badge" v-if="orderCounts.shipped > 0">{{ orderCounts.shipped }}</text>
          </view>
          <text class="label">待收货</text>
        </view>
        <view class="type-item" @click="goToOrders('completed')">
          <view class="icon">
            <uni-icons type="star" size="40" color="#FF6B35"></uni-icons>
          </view>
          <text class="label">已完成</text>
        </view>
      </view>
    </view>

    <!-- 功能列表 -->
    <view class="menu-list">
      <view class="menu-item" @click="goToAddress">
        <view class="left">
          <uni-icons type="location" size="40" color="#FF6B35"></uni-icons>
          <text class="label">收货地址</text>
        </view>
        <uni-icons type="arrow-right" size="24" color="#999"></uni-icons>
      </view>
      <view class="menu-item" @click="goToCoupons">
        <view class="left">
          <uni-icons type="gift" size="40" color="#FF6B35"></uni-icons>
          <text class="label">优惠券</text>
        </view>
        <view class="right">
          <text class="badge" v-if="couponCount > 0">{{ couponCount }}张可用</text>
          <uni-icons type="arrow-right" size="24" color="#999"></uni-icons>
        </view>
      </view>
      <view class="menu-item" @click="goToFavorites">
        <view class="left">
          <uni-icons type="heart" size="40" color="#FF6B35"></uni-icons>
          <text class="label">我的收藏</text>
        </view>
        <uni-icons type="arrow-right" size="24" color="#999"></uni-icons>
      </view>
      <view class="menu-item" @click="goToPoints">
        <view class="left">
          <uni-icons type="gift" size="40" color="#FF6B35"></uni-icons>
          <text class="label">我的积分</text>
        </view>
        <view class="right">
          <text class="points">{{ points }}积分</text>
          <uni-icons type="arrow-right" size="24" color="#999"></uni-icons>
        </view>
      </view>
      <view class="menu-item" @click="goToContact">
        <view class="left">
          <uni-icons type="chatbubble" size="40" color="#FF6B35"></uni-icons>
          <text class="label">联系客服</text>
        </view>
        <uni-icons type="arrow-right" size="24" color="#999"></uni-icons>
      </view>
      <view class="menu-item" @click="goToSettings">
        <view class="left">
          <uni-icons type="gear" size="40" color="#FF6B35"></uni-icons>
          <text class="label">设置</text>
        </view>
        <uni-icons type="arrow-right" size="24" color="#999"></uni-icons>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const isLogin = ref(false)
const userInfo = ref({})
const points = ref(0)
const couponCount = ref(3)
const orderCounts = ref({
  pending: 1,
  paid: 2,
  shipped: 0,
  completed: 5
})

const goToLogin = () => {
  uni.navigateTo({ url: '/pages/login/index' })
}

const goToOrders = (status = 'all') => {
  uni.switchTab({ url: '/pages/order/index' })
}

const goToAddress = () => {
  uni.showToast({ title: '收货地址', icon: 'none' })
}

const goToCoupons = () => {
  uni.showToast({ title: '优惠券', icon: 'none' })
}

const goToFavorites = () => {
  uni.showToast({ title: '我的收藏', icon: 'none' })
}

const goToPoints = () => {
  uni.showToast({ title: '我的积分', icon: 'none' })
}

const goToContact = () => {
  uni.showToast({ title: '联系客服', icon: 'none' })
}

const goToSettings = () => {
  uni.showToast({ title: '设置', icon: 'none' })
}

onMounted(() => {
  // 检查登录状态
  const token = uni.getStorageSync('token')
  isLogin.value = !!token

  if (isLogin.value) {
    // 获取用户信息
    userInfo.value = {
      nickname: '海邻到家用户',
      avatar: 'https://via.placeholder.com/200x200/FF6B35/FFFFFF?text=Avatar',
      level: '银卡会员'
    }
    points.value = 1280
  }
})
</script>

<style lang="scss" scoped>
.profile {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 40rpx;
}

.user-card {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #FF6B35 0%, #FF8C61 100%);
  padding: 60rpx 30rpx;
  color: #fff;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  border: 4rpx solid rgba(255, 255, 255, 0.3);
  margin-right: 24rpx;
}

.info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.name {
  font-size: 36rpx;
  font-weight: bold;
}

.level {
  font-size: 24rpx;
  background: rgba(255, 255, 255, 0.2);
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
  align-self: flex-start;
}

.btn-login {
  padding: 16rpx;
}

.member-card {
  background: linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%);
  margin: -30rpx 30rpx 30rpx;
  border-radius: 16rpx;
  padding: 30rpx;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30rpx;
}

.title {
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
}

.desc {
  font-size: 24rpx;
  color: #666;
}

.privileges {
  display: flex;
  justify-content: space-between;
}

.item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
}

.label {
  font-size: 24rpx;
  color: #666;
}

.order-section {
  background: #fff;
  margin: 0 30rpx 30rpx;
  border-radius: 16rpx;
  padding: 30rpx;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30rpx;
}

.section-header .title {
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
}

.btn-more {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.btn-more .text {
  font-size: 24rpx;
  color: #999;
}

.order-types {
  display: flex;
  justify-content: space-between;
}

.type-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
}

.icon {
  position: relative;
}

.badge {
  position: absolute;
  top: -8rpx;
  right: -12rpx;
  min-width: 32rpx;
  height: 32rpx;
  background: #FF3B30;
  color: #fff;
  border-radius: 16rpx;
  font-size: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8rpx;
}

.type-item .label {
  font-size: 24rpx;
  color: #666;
}

.menu-list {
  background: #fff;
  margin: 0 30rpx;
  border-radius: 16rpx;
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.menu-item:last-child {
  border-bottom: none;
}

.left {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.left .label {
  font-size: 28rpx;
  color: #333;
}

.right {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.badge {
  font-size: 24rpx;
  color: #FF6B35;
}

.points {
  font-size: 28rpx;
  color: #FF6B35;
  font-weight: bold;
}
</style>
