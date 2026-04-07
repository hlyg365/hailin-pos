<template>
  <view class="chain-data">
    <!-- 接龙信息 -->
    <view class="header">
      <view class="title-row">
        <text class="title">{{ chain.title }}</text>
        <text :class="['status', `status-${chain.status}`]">
          {{ getStatusText(chain.status) }}
        </text>
      </view>
      <view class="stats">
        <view class="stat-item">
          <text class="label">参与人数</text>
          <text class="value">{{ chain.participantCount }}人</text>
        </view>
        <view class="stat-item">
          <text class="label">总金额</text>
          <text class="value">¥{{ chain.totalAmount }}</text>
        </view>
        <view class="stat-item">
          <text class="label">总份数</text>
          <text class="value">{{ chain.totalQuantity }}份</text>
        </view>
      </view>
    </view>

    <!-- 操作栏 -->
    <view class="actions">
      <button class="btn-action" @click="exportData">
        <uni-icons type="download" size="32" color="#FF6B35" />
        <text>导出数据</text>
      </button>
      <button class="btn-action" @click="shareData">
        <uni-icons type="redo" size="32" color="#FF6B35" />
        <text>分享数据</text>
      </button>
      <button class="btn-action" @click="printData">
        <uni-icons type="printer" size="32" color="#FF6B35" />
        <text>打印数据</text>
      </button>
    </view>

    <!-- 参与者列表 -->
    <view class="section">
      <view class="section-header">
        <text class="title">参与者列表</text>
        <text class="count">共{{ participants.length }}人</text>
      </view>
      <view class="participant-list">
        <view class="participant-item" v-for="(item, index) in participants" :key="index">
          <view class="index">{{ index + 1 }}</view>
          <image :src="item.avatar" class="avatar" mode="aspectFill" />
          <view class="info">
            <text class="name">{{ item.name }}</text>
            <text class="phone">{{ item.phone }}</text>
          </view>
          <view class="right">
            <text class="quantity">{{ item.quantity }}份</text>
            <text class="amount">¥{{ item.amount }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 商品统计 -->
    <view class="section">
      <view class="section-header">
        <text class="title">商品统计</text>
      </view>
      <view class="product-stats">
        <view class="product-item" v-for="(item, index) in productStats" :key="index">
          <image :src="item.image" class="thumb" mode="aspectFill" />
          <view class="info">
            <text class="name">{{ item.name }}</text>
            <text class="price">单价¥{{ item.price }}</text>
          </view>
          <view class="right">
            <text class="count">{{ item.totalQuantity }}份</text>
            <text class="amount">¥{{ item.totalAmount }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 时间线 -->
    <view class="section">
      <view class="section-header">
        <text class="title">接龙记录</text>
      </view>
      <view class="timeline">
        <view class="timeline-item" v-for="(item, index) in timeline" :key="index">
          <view class="dot"></view>
          <view class="content">
            <text class="time">{{ item.time }}</text>
            <text class="event">{{ item.event }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const chainId = ref('')
const chain = ref({})
const participants = ref([])
const productStats = ref([])
const timeline = ref([])

const getStatusText = (status) => {
  const map = {
    active: '进行中',
    ended: '已结束',
    cancelled: '已取消'
  }
  return map[status] || status
}

const exportData = () => {
  uni.showLoading({ title: '导出中...' })
  
  setTimeout(() => {
    uni.hideLoading()
    uni.showToast({ title: '导出成功', icon: 'success' })
    // TODO: 实际导出逻辑
  }, 1500)
}

const shareData = () => {
  uni.showShareMenu({
    withShareTicket: true,
    success: () => {
      uni.showToast({ title: '请点击右上角分享', icon: 'none' })
    }
  })
}

const printData = () => {
  uni.showToast({ title: '打印功能开发中', icon: 'none' })
}

const loadData = () => {
  // 模拟数据
  chain.value = {
    id: chainId.value,
    title: '新鲜水果团购接龙',
    status: 'ended',
    participantCount: 15,
    totalAmount: '598.50',
    totalQuantity: 15
  }

  participants.value = [
    {
      name: '张三',
      avatar: 'https://via.placeholder.com/100x100/FF6B35/FFFFFF?text=张',
      phone: '138****1234',
      quantity: 1,
      amount: '39.90'
    },
    {
      name: '李四',
      avatar: 'https://via.placeholder.com/100x100/FF6B35/FFFFFF?text=李',
      phone: '139****5678',
      quantity: 2,
      amount: '79.80'
    },
    {
      name: '王五',
      avatar: 'https://via.placeholder.com/100x100/FF6B35/FFFFFF?text=王',
      phone: '137****9012',
      quantity: 1,
      amount: '39.90'
    }
  ]

  productStats.value = [
    {
      name: '苹果',
      image: 'https://via.placeholder.com/200x200/FF6B35/FFFFFF?text=苹果',
      price: '12.90',
      totalQuantity: 8,
      totalAmount: '103.20'
    },
    {
      name: '香蕉',
      image: 'https://via.placeholder.com/200x200/FF6B35/FFFFFF?text=香蕉',
      price: '8.90',
      totalQuantity: 5,
      totalAmount: '44.50'
    },
    {
      name: '橙子',
      image: 'https://via.placeholder.com/200x200/FF6B35/FFFFFF?text=橙子',
      price: '18.10',
      totalQuantity: 2,
      totalAmount: '36.20'
    }
  ]

  timeline.value = [
    { time: '2024-04-07 14:30', event: '张三 参与接龙' },
    { time: '2024-04-07 15:20', event: '李四 参与接龙' },
    { time: '2024-04-07 16:10', event: '王五 参与接龙' },
    { time: '2024-04-07 18:00', event: '接龙结束' }
  ]
}

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  chainId.value = currentPage.options.id
  loadData()
})
</script>

<style lang="scss" scoped>
.chain-data {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 20rpx;
}

.header {
  background: #fff;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.title-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 30rpx;
}

.title {
  flex: 1;
  font-size: 32rpx;
  color: #333;
  font-weight: bold;
  margin-right: 20rpx;
}

.status {
  font-size: 24rpx;
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
  flex-shrink: 0;
}

.status-active {
  background: #E3F2FD;
  color: #2196F3;
}

.status-ended {
  background: #E0E0E0;
  color: #999;
}

.stats {
  display: flex;
  gap: 20rpx;
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  padding: 20rpx;
}

.stat-item .label {
  font-size: 24rpx;
  color: #666;
}

.stat-item .value {
  font-size: 32rpx;
  color: #FF6B35;
  font-weight: bold;
}

.actions {
  display: flex;
  gap: 20rpx;
  background: #fff;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.btn-action {
  flex: 1;
  height: 80rpx;
  background: #FFF3E0;
  border-radius: 12rpx;
  font-size: 26rpx;
  color: #FF6B35;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
}

.section {
  background: #fff;
  padding: 30rpx;
  margin-bottom: 20rpx;
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

.section-header .count {
  font-size: 24rpx;
  color: #666;
}

.participant-list, .product-stats {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.participant-item, .product-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.index {
  width: 50rpx;
  height: 50rpx;
  background: #FF6B35;
  color: #fff;
  border-radius: 25rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  flex-shrink: 0;
}

.avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 40rpx;
  flex-shrink: 0;
}

.info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.name {
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
}

.phone {
  font-size: 24rpx;
  color: #999;
}

.right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8rpx;
}

.quantity {
  font-size: 24rpx;
  color: #666;
}

.amount {
  font-size: 32rpx;
  color: #FF6B35;
  font-weight: bold;
}

.thumb {
  width: 100rpx;
  height: 100rpx;
  border-radius: 8rpx;
  flex-shrink: 0;
}

.price {
  font-size: 24rpx;
  color: #999;
}

.count {
  font-size: 24rpx;
  color: #666;
}

.timeline {
  position: relative;
  padding-left: 40rpx;
}

.timeline-item {
  position: relative;
  padding-bottom: 40rpx;
}

.timeline-item:last-child {
  padding-bottom: 0;
}

.timeline-item::before {
  content: '';
  position: absolute;
  left: -40rpx;
  top: 12rpx;
  width: 2rpx;
  height: 100%;
  background: #e0e0e0;
}

.timeline-item:last-child::before {
  height: 12rpx;
}

.dot {
  position: absolute;
  left: -48rpx;
  top: 0;
  width: 16rpx;
  height: 16rpx;
  background: #FF6B35;
  border-radius: 8rpx;
  border: 4rpx solid #fff;
  box-shadow: 0 0 0 2rpx #FF6B35;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.time {
  font-size: 24rpx;
  color: #999;
}

.event {
  font-size: 26rpx;
  color: #333;
}
</style>
