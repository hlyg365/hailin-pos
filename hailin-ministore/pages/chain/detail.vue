<template>
  <view class="chain-detail">
    <!-- 接龙信息 -->
    <view class="header">
      <view class="title-row">
        <text class="title">{{ chain.title }}</text>
        <text :class="['status', `status-${chain.status}`]">
          {{ getStatusText(chain.status) }}
        </text>
      </view>
      <text class="desc">{{ chain.description }}</text>
      <view class="meta">
        <view class="meta-item">
          <uni-icons type="wallet" size="32" color="#FF6B35" />
          <text class="label">价格</text>
          <text class="value">¥{{ chain.price }}</text>
        </view>
        <view class="meta-item">
          <uni-icons type="person" size="32" color="#FF6B35" />
          <text class="label">参与人数</text>
          <text class="value">{{ chain.participantCount }}人</text>
        </view>
        <view class="meta-item">
          <uni-icons type="calendar" size="32" color="#FF6B35" />
          <text class="label">截止时间</text>
          <text class="value">{{ chain.endTime }}</text>
        </view>
      </view>
    </view>

    <!-- 商品列表 -->
    <view class="products" v-if="chain.products && chain.products.length > 0">
      <text class="section-title">商品清单</text>
      <view class="product-list">
        <view class="product-item" v-for="product in chain.products" :key="product.id">
          <image :src="product.image" class="thumb" mode="aspectFill" />
          <view class="info">
            <text class="name">{{ product.name }}</text>
            <view class="bottom">
              <text class="price">¥{{ product.price }}</text>
              <text class="count">x{{ product.quantity }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 参与者列表 -->
    <view class="participants">
      <text class="section-title">参与者</text>
      <view class="participant-list">
        <view class="participant-item" v-for="(item, index) in participants" :key="index">
          <image :src="item.avatar" class="avatar" mode="aspectFill" />
          <view class="info">
            <text class="name">{{ item.name }}</text>
            <text class="time">{{ item.joinTime }}参与</text>
          </view>
          <view class="right">
            <text class="quantity">{{ item.quantity }}份</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 操作栏 -->
    <view class="footer">
      <button class="btn-share" @click="share">
        <uni-icons type="redo" size="32" color="#666" />
        <text>分享</text>
      </button>
      <button class="btn-join" @click="joinChain" v-if="chain.status === 'active'">
        我要参与
      </button>
      <button class="btn-disabled" v-else>
        接龙已结束
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const chainId = ref('')
const chain = ref({})
const participants = ref([])

const getStatusText = (status) => {
  const map = {
    active: '进行中',
    ended: '已结束',
    cancelled: '已取消'
  }
  return map[status] || status
}

const share = () => {
  uni.showShareMenu({
    withShareTicket: true,
    success: () => {
      uni.showToast({ title: '请点击右上角分享', icon: 'none' })
    }
  })
}

const joinChain = () => {
  uni.showModal({
    title: '确认参与',
    content: `您将参与接龙，金额 ¥${chain.value.price}`,
    success: (res) => {
      if (res.confirm) {
        // TODO: 参与接龙逻辑
        uni.showLoading({ title: '处理中...' })
        setTimeout(() => {
          uni.hideLoading()
          uni.showToast({ title: '参与成功', icon: 'success' })
          loadChainDetail()
        }, 1500)
      }
    }
  })
}

const loadChainDetail = () => {
  // 模拟数据
  chain.value = {
    id: chainId.value,
    title: '新鲜水果团购接龙',
    description: '新鲜水果，产地直发，今日特价',
    price: '39.90',
    participantCount: 15,
    status: 'active',
    endTime: '2024-04-10 18:00',
    products: [
      {
        id: '1',
        name: '苹果',
        image: 'https://via.placeholder.com/200x200/FF6B35/FFFFFF?text=苹果',
        price: '12.90',
        quantity: 1
      },
      {
        id: '2',
        name: '香蕉',
        image: 'https://via.placeholder.com/200x200/FF6B35/FFFFFF?text=香蕉',
        price: '8.90',
        quantity: 1
      },
      {
        id: '3',
        name: '橙子',
        image: 'https://via.placeholder.com/200x200/FF6B35/FFFFFF?text=橙子',
        price: '18.10',
        quantity: 1
      }
    ]
  }

  participants.value = [
    {
      name: '张三',
      avatar: 'https://via.placeholder.com/100x100/FF6B35/FFFFFF?text=张',
      joinTime: '04-07 14:30',
      quantity: 1
    },
    {
      name: '李四',
      avatar: 'https://via.placeholder.com/100x100/FF6B35/FFFFFF?text=李',
      joinTime: '04-07 15:20',
      quantity: 2
    },
    {
      name: '王五',
      avatar: 'https://via.placeholder.com/100x100/FF6B35/FFFFFF?text=王',
      joinTime: '04-07 16:10',
      quantity: 1
    }
  ]
}

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  chainId.value = currentPage.options.id
  loadChainDetail()
})
</script>

<style lang="scss" scoped>
.chain-detail {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 120rpx;
}

.header {
  background: #fff;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.title-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 20rpx;
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

.desc {
  display: block;
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
  margin-bottom: 30rpx;
}

.meta {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.label {
  font-size: 26rpx;
  color: #666;
}

.value {
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
}

.products, .participants {
  background: #fff;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.section-title {
  display: block;
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
  margin-bottom: 20rpx;
}

.product-list, .participant-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.product-item, .participant-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.thumb {
  width: 160rpx;
  height: 160rpx;
  border-radius: 8rpx;
}

.info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.name {
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
}

.bottom {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.price {
  font-size: 28rpx;
  color: #FF6B35;
  font-weight: bold;
}

.count {
  font-size: 24rpx;
  color: #999;
}

.avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 40rpx;
}

.time {
  font-size: 24rpx;
  color: #999;
}

.right {
  display: flex;
  align-items: center;
}

.quantity {
  font-size: 28rpx;
  color: #FF6B35;
  font-weight: bold;
}

.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  gap: 20rpx;
  background: #fff;
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.btn-share {
  width: 120rpx;
  height: 80rpx;
  background: #f5f5f5;
  border-radius: 40rpx;
  font-size: 24rpx;
  color: #666;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
  padding: 0;
}

.btn-join {
  flex: 1;
  height: 80rpx;
  background: linear-gradient(135deg, #FF6B35 0%, #FF8C61 100%);
  color: #fff;
  border-radius: 40rpx;
  font-size: 28rpx;
  font-weight: bold;
  line-height: 80rpx;
}

.btn-disabled {
  flex: 1;
  height: 80rpx;
  background: #ddd;
  color: #999;
  border-radius: 40rpx;
  font-size: 28rpx;
  line-height: 80rpx;
}
</style>
