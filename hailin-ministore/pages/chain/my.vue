<template>
  <view class="my-chains">
    <!-- 顶部统计 -->
    <view class="stats">
      <view class="stat-item">
        <text class="count">{{ stats.active }}</text>
        <text class="label">进行中</text>
      </view>
      <view class="stat-item">
        <text class="count">{{ stats.ended }}</text>
        <text class="label">已结束</text>
      </view>
      <view class="stat-item">
        <text class="count">{{ stats.total }}</text>
        <text class="label">总接龙</text>
      </view>
    </view>

    <!-- Tab切换 -->
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
          <text class="amount">订单金额¥{{ chain.totalAmount }}</text>
        </view>

        <!-- 操作按钮 -->
        <view class="actions" v-if="chain.status === 'active'">
          <button class="btn btn-small" @click.stop="shareChain(chain.id)">
            <uni-icons type="redo" size="32" color="#666" />
            分享
          </button>
          <button class="btn btn-small btn-primary" @click.stop="manageChain(chain.id)">
            管理
          </button>
          <button class="btn btn-small" @click.stop="endChain(chain.id)">
            结束
          </button>
        </view>
        <view class="actions" v-else>
          <button class="btn btn-small" @click.stop="viewData(chain.id)">
            查看数据
          </button>
          <button class="btn btn-small" @click.stop="copyChain(chain.id)">
            复制接龙
          </button>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty" v-if="chainList.length === 0">
      <image src="/static/empty-chain.png" class="empty-img" mode="aspectFit" />
      <text class="empty-text">暂无接龙</text>
      <button class="btn-create" @click="goToCreate">创建接龙</button>
    </view>

    <!-- 创建按钮 -->
    <view class="fab" @click="goToCreate">
      <uni-icons type="plus" size="48" color="#fff" />
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'

const currentTab = ref('active')
const tabs = [
  { label: '进行中', value: 'active' },
  { label: '已结束', value: 'ended' }
]

const stats = ref({
  active: 3,
  ended: 5,
  total: 8
})

const chainList = ref([])

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

const goToDetail = (id) => {
  uni.navigateTo({ url: `/pages/chain/detail?id=${id}` })
}

const goToCreate = () => {
  uni.navigateTo({ url: '/pages/chain/create' })
}

const shareChain = (id) => {
  uni.showShareMenu({
    withShareTicket: true,
    success: () => {
      uni.showToast({ title: '请点击右上角分享', icon: 'none' })
    }
  })
}

const manageChain = (id) => {
  uni.navigateTo({ url: `/pages/chain/manage?id=${id}` })
}

const endChain = (id) => {
  uni.showModal({
    title: '提示',
    content: '确定结束此接龙吗？结束后将无法继续参与',
    success: (res) => {
      if (res.confirm) {
        const index = chainList.value.findIndex(item => item.id === id)
        if (index !== -1) {
          chainList.value[index].status = 'ended'
          stats.value.active--
          stats.value.ended++
          uni.showToast({ title: '接龙已结束', icon: 'success' })
        }
      }
    }
  })
}

const viewData = (id) => {
  uni.navigateTo({ url: `/pages/chain/data?id=${id}` })
}

const copyChain = (id) => {
  uni.showModal({
    title: '复制接龙',
    content: '确定复制此接龙吗？',
    success: (res) => {
      if (res.confirm) {
        const chain = chainList.value.find(item => item.id === id)
        uni.navigateTo({ 
          url: `/pages/chain/create?copyFrom=${id}` 
        })
      }
    }
  })
}

const loadChains = () => {
  // 模拟数据
  const allChains = [
    {
      id: '1',
      title: '新鲜水果团购接龙',
      description: '新鲜水果，产地直发，今日特价',
      price: '39.90',
      participantCount: 15,
      totalAmount: '598.50',
      status: 'active',
      endTime: '2024-04-10 18:00'
    },
    {
      id: '2',
      title: '日用品拼团接龙',
      description: '洗衣液、牙膏等日用品团购',
      price: '29.90',
      participantCount: 28,
      totalAmount: '837.20',
      status: 'active',
      endTime: '2024-04-10 20:00'
    },
    {
      id: '3',
      title: '零食大礼包接龙',
      description: '多种零食组合，超值优惠',
      price: '59.90',
      participantCount: 42,
      totalAmount: '2515.80',
      status: 'ended',
      endTime: '2024-04-07 18:00'
    },
    {
      id: '4',
      title: '生鲜蔬菜接龙',
      description: '当日新鲜蔬菜，当天配送',
      price: '49.90',
      participantCount: 20,
      totalAmount: '998.00',
      status: 'ended',
      endTime: '2024-04-06 18:00'
    }
  ]

  if (currentTab.value === 'active') {
    chainList.value = allChains.filter(chain => chain.status === 'active')
  } else {
    chainList.value = allChains.filter(chain => chain.status === 'ended')
  }
}

loadChains()
</script>

<style lang="scss" scoped>
.my-chains {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 20rpx;
}

.stats {
  display: flex;
  background: linear-gradient(135deg, #FF6B35 0%, #FF8C61 100%);
  padding: 40rpx 30rpx;
  gap: 30rpx;
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.count {
  font-size: 48rpx;
  color: #fff;
  font-weight: bold;
}

.label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.9);
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
  margin-bottom: 20rpx;
}

.time {
  font-size: 24rpx;
  color: #999;
}

.amount {
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
}

.actions {
  display: flex;
  align-items: center;
  gap: 16rpx;
  flex-wrap: wrap;
}

.btn {
  padding: 0 24rpx;
  height: 60rpx;
  border-radius: 30rpx;
  font-size: 24rpx;
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.btn-small {
  background: #f5f5f5;
  color: #333;
}

.btn-primary {
  background: linear-gradient(135deg, #FF6B35 0%, #FF8C61 100%);
  color: #fff;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 200rpx;
}

.empty-img {
  width: 300rpx;
  height: 300rpx;
  margin-bottom: 40rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
  margin-bottom: 60rpx;
}

.btn-create {
  width: 200rpx;
  height: 70rpx;
  background: linear-gradient(135deg, #FF6B35 0%, #FF8C61 100%);
  color: #fff;
  border-radius: 35rpx;
  font-size: 28rpx;
  line-height: 70rpx;
}

.fab {
  position: fixed;
  bottom: 120rpx;
  right: 40rpx;
  width: 100rpx;
  height: 100rpx;
  background: linear-gradient(135deg, #FF6B35 0%, #FF8C61 100%);
  border-radius: 50rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 16rpx rgba(255, 107, 53, 0.4);
  z-index: 100;
}
</style>
