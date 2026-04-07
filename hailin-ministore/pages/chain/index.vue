<template>
  <view class="chain-list">
    <!-- 搜索栏 -->
    <view class="search-bar">
      <view class="input">
        <uni-icons type="search" size="32" color="#999"></uni-icons>
        <input type="text" placeholder="搜索接龙" class="input-inner" />
      </view>
      <button class="btn-create" @click="goToCreate">
        <uni-icons type="plus" size="32" color="#fff"></uni-icons>
        <text>创建</text>
      </button>
    </view>

    <!-- 筛选标签 -->
    <view class="tabs">
      <view
        v-for="tab in tabs"
        :key="tab.value"
        :class="['tab-item', { active: currentTab === tab.value }]"
        @click="switchTab(tab.value)"
      >
        {{ tab.label }}
      </view>
    </view>

    <!-- 接龙列表 -->
    <view class="list">
      <view class="item" v-for="chain in chainList" :key="chain.id" @click="goToDetail(chain.id)">
        <view class="header">
          <text class="title">{{ chain.title }}</text>
          <text :class="['status', `status-${chain.status}`]">
            {{ getStatusText(chain.status) }}
          </text>
        </view>

        <view class="info">
          <text class="desc">{{ chain.description }}</text>
          <view class="meta">
            <text class="price">¥{{ chain.price }}</text>
            <text class="count">{{ chain.participantCount }}人参与</text>
          </view>
        </view>

        <view class="footer">
          <text class="time">{{ chain.endTime }}截止</text>
          <text class="creator">发起人：{{ chain.creator }}</text>
        </view>
      </view>
    </view>

    <!-- 加载更多 -->
    <view class="load-more" v-if="hasMore">
      <uni-icons type="spinner-cycle" size="40" color="#FF6B35" class="icon-loading"></uni-icons>
      <text>加载中...</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const currentTab = ref('all')
const tabs = [
  { label: '全部', value: 'all' },
  { label: '进行中', value: 'active' },
  { label: '已结束', value: 'ended' }
]

const chainList = ref([])
const hasMore = ref(true)

const switchTab = (value) => {
  currentTab.value = value
  loadChains()
}

const getStatusText = (status) => {
  const map = {
    active: '进行中',
    ended: '已结束',
    cancelled: '已取消'
  }
  return map[status] || status
}

const goToCreate = () => {
  uni.navigateTo({ url: '/pages/chain/create' })
}

const goToDetail = (id) => {
  uni.navigateTo({ url: `/pages/chain/detail?id=${id}` })
}

const loadChains = () => {
  // 模拟数据
  chainList.value = [
    {
      id: '1',
      title: '新鲜水果团购接龙',
      description: '新鲜水果，产地直发，今日特价',
      price: '39.90',
      participantCount: 15,
      status: 'active',
      endTime: '2024-04-10 18:00',
      creator: '店长'
    },
    {
      id: '2',
      title: '日用品拼团接龙',
      description: '洗衣液、牙膏等日用品团购',
      price: '29.90',
      participantCount: 28,
      status: 'active',
      endTime: '2024-04-10 20:00',
      creator: '店长'
    },
    {
      id: '3',
      title: '零食大礼包接龙',
      description: '多种零食组合，超值优惠',
      price: '59.90',
      participantCount: 42,
      status: 'ended',
      endTime: '2024-04-07 18:00',
      creator: '店长'
    }
  ]

  if (currentTab.value === 'all') {
    hasMore.value = chainList.value.length < 10
  } else {
    chainList.value = chainList.value.filter(chain => chain.status === currentTab.value)
    hasMore.value = chainList.value.length < 10
  }
}

onMounted(() => {
  loadChains()
})
</script>

<style lang="scss" scoped>
.chain-list {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 20rpx;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 20rpx;
  background: #fff;
  padding: 20rpx 30rpx;
  position: sticky;
  top: 0;
  z-index: 10;
}

.input {
  flex: 1;
  display: flex;
  align-items: center;
  background: #f5f5f5;
  border-radius: 50rpx;
  padding: 16rpx 30rpx;
  height: 70rpx;
}

.input-inner {
  flex: 1;
  font-size: 28rpx;
  color: #333;
  margin-left: 16rpx;
}

.btn-create {
  display: flex;
  align-items: center;
  gap: 8rpx;
  background: linear-gradient(135deg, #FF6B35 0%, #FF8C61 100%);
  color: #fff;
  padding: 16rpx 32rpx;
  border-radius: 50rpx;
  font-size: 28rpx;
  height: 70rpx;
  line-height: 38rpx;
}

.tabs {
  display: flex;
  background: #fff;
  padding: 20rpx;
  margin-bottom: 20rpx;
}

.tab-item {
  flex: 1;
  text-align: center;
  font-size: 28rpx;
  color: #666;
  padding: 10rpx 0;
  position: relative;
}

.tab-item.active {
  color: #FF6B35;
  font-weight: bold;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 40rpx;
  height: 4rpx;
  background: #FF6B35;
  border-radius: 2rpx;
}

.list {
  padding: 0 30rpx;
}

.item {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.title {
  font-size: 32rpx;
  color: #333;
  font-weight: bold;
  flex: 1;
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

.info {
  margin-bottom: 20rpx;
}

.desc {
  display: block;
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
  margin-bottom: 16rpx;
}

.meta {
  display: flex;
  align-items: center;
  gap: 30rpx;
}

.price {
  font-size: 36rpx;
  color: #FF6B35;
  font-weight: bold;
}

.count {
  font-size: 26rpx;
  color: #666;
}

.footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 20rpx;
  border-top: 1rpx solid #f5f5f5;
}

.time {
  font-size: 24rpx;
  color: #999;
}

.creator {
  font-size: 24rpx;
  color: #666;
}

.load-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  padding: 40rpx;
  font-size: 26rpx;
  color: #999;
}

.icon-loading {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
