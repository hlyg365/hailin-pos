<template>
  <view class="order">
    <!-- 顶部Tab -->
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

    <!-- 订单列表 -->
    <view class="list">
      <view class="item" v-for="order in orderList" :key="order.id" @click="goToDetail(order.id)">
        <view class="header">
          <text class="shop">海邻到家便利店</text>
          <text :class="['status', `status-${order.status}`]">{{ getStatusText(order.status) }}</text>
        </view>

        <view class="goods">
          <view class="good-item" v-for="good in order.items" :key="good.id">
            <image :src="good.image" class="thumb" mode="aspectFill" />
            <view class="info">
              <text class="name">{{ good.name }}</text>
              <text class="spec">{{ good.spec }}</text>
              <view class="bottom">
                <text class="price">¥{{ good.price }}</text>
                <text class="count">x{{ good.quantity }}</text>
              </view>
            </view>
          </view>
        </view>

        <view class="footer">
          <text class="total">共{{ order.itemCount }}件</text>
          <text class="price">实付¥{{ order.totalAmount }}</text>
        </view>

        <!-- 操作按钮 -->
        <view class="actions" v-if="order.status === 'pending'">
          <button class="btn btn-default" @click.stop="cancelOrder(order.id)">取消订单</button>
          <button class="btn btn-primary" @click.stop="payOrder(order.id)">去支付</button>
        </view>
        <view class="actions" v-else-if="order.status === 'completed'">
          <button class="btn btn-default" @click.stop="viewLogistics(order.id)">查看物流</button>
          <button class="btn btn-primary" @click.stop="confirmReceipt(order.id)">确认收货</button>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty" v-if="orderList.length === 0">
      <image src="/static/empty-order.png" class="empty-img" mode="aspectFit" />
      <text class="empty-text">暂无订单</text>
      <button class="btn-goto" @click="goToHome">去逛逛</button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'

const currentTab = ref('all')
const tabs = [
  { label: '全部', value: 'all' },
  { label: '待支付', value: 'pending' },
  { label: '待发货', value: 'paid' },
  { label: '待收货', value: 'shipped' },
  { label: '已完成', value: 'completed' }
]

const orderList = ref([])

const switchTab = (value) => {
  currentTab.value = value
  loadOrders()
}

const getStatusText = (status) => {
  const map = {
    pending: '待支付',
    paid: '待发货',
    shipped: '待收货',
    completed: '已完成',
    cancelled: '已取消'
  }
  return map[status] || status
}

const cancelOrder = (id) => {
  uni.showModal({
    title: '提示',
    content: '确定取消订单吗？',
    success: (res) => {
      if (res.confirm) {
        const index = orderList.value.findIndex(item => item.id === id)
        if (index !== -1) {
          orderList.value[index].status = 'cancelled'
          uni.showToast({ title: '订单已取消', icon: 'success' })
        }
      }
    }
  })
}

const payOrder = (id) => {
  uni.showToast({ title: '调起微信支付', icon: 'loading' })
  // TODO: 调起微信支付
}

const confirmReceipt = (id) => {
  uni.showModal({
    title: '提示',
    content: '确定已收到商品吗？',
    success: (res) => {
      if (res.confirm) {
        const index = orderList.value.findIndex(item => item.id === id)
        if (index !== -1) {
          orderList.value[index].status = 'completed'
          uni.showToast({ title: '确认收货成功', icon: 'success' })
        }
      }
    }
  })
}

const viewLogistics = (id) => {
  uni.showToast({ title: '查看物流', icon: 'none' })
}

const goToDetail = (id) => {
  uni.navigateTo({ url: `/pages/order/detail?id=${id}` })
}

const goToHome = () => {
  uni.switchTab({ url: '/pages/index/index' })
}

const loadOrders = () => {
  // 模拟数据
  const allOrders = [
    {
      id: '1',
      status: 'pending',
      itemCount: 2,
      totalAmount: '298.00',
      items: [
        {
          id: '1',
          name: '商品1',
          spec: '默认规格',
          image: 'https://via.placeholder.com/200x200/FF6B35/FFFFFF?text=商品1',
          price: '99.00',
          quantity: 1
        },
        {
          id: '2',
          name: '商品2',
          spec: '默认规格',
          image: 'https://via.placeholder.com/200x200/FF6B35/FFFFFF?text=商品2',
          price: '199.00',
          quantity: 1
        }
      ]
    },
    {
      id: '2',
      status: 'shipped',
      itemCount: 1,
      totalAmount: '99.00',
      items: [
        {
          id: '3',
          name: '商品3',
          spec: '默认规格',
          image: 'https://via.placeholder.com/200x200/FF6B35/FFFFFF?text=商品3',
          price: '99.00',
          quantity: 1
        }
      ]
    },
    {
      id: '3',
      status: 'completed',
      itemCount: 3,
      totalAmount: '597.00',
      items: [
        {
          id: '4',
          name: '商品4',
          spec: '默认规格',
          image: 'https://via.placeholder.com/200x200/FF6B35/FFFFFF?text=商品4',
          price: '199.00',
          quantity: 3
        }
      ]
    }
  ]

  if (currentTab.value === 'all') {
    orderList.value = allOrders
  } else {
    orderList.value = allOrders.filter(order => order.status === currentTab.value)
  }
}

// 初始化加载
loadOrders()
</script>

<style lang="scss" scoped>
.order {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 20rpx;
}

.tabs {
  display: flex;
  background: #fff;
  padding: 20rpx;
  position: sticky;
  top: 0;
  z-index: 10;
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
  padding: 20rpx;
}

.item {
  background: #fff;
  border-radius: 16rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #eee;
}

.shop {
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
}

.status {
  font-size: 26rpx;
  color: #666;
}

.status-pending {
  color: #FF9800;
}

.status-paid {
  color: #2196F3;
}

.status-shipped {
  color: #4CAF50;
}

.status-completed {
  color: #999;
}

.goods {
  padding: 20rpx 0;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.good-item {
  display: flex;
  gap: 20rpx;
}

.thumb {
  width: 160rpx;
  height: 160rpx;
  border-radius: 8rpx;
  flex-shrink: 0;
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
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.spec {
  font-size: 24rpx;
  color: #999;
  background: #f5f5f5;
  padding: 4rpx 12rpx;
  border-radius: 4rpx;
  align-self: flex-start;
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

.footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #eee;
}

.total {
  font-size: 26rpx;
  color: #666;
}

.footer .price {
  font-size: 32rpx;
  color: #FF6B35;
  font-weight: bold;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 16rpx;
  margin-top: 20rpx;
}

.btn {
  padding: 0 32rpx;
  height: 64rpx;
  border-radius: 32rpx;
  font-size: 26rpx;
  line-height: 64rpx;
}

.btn-default {
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

.btn-goto {
  width: 200rpx;
  height: 70rpx;
  background: linear-gradient(135deg, #FF6B35 0%, #FF8C61 100%);
  color: #fff;
  border-radius: 35rpx;
  font-size: 28rpx;
  line-height: 70rpx;
}
</style>
