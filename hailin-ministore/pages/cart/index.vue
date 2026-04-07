<template>
  <view class="cart">
    <!-- 顶部栏 -->
    <view class="header">
      <text class="title">购物车({{ cartItems.length }})</text>
      <text class="btn-edit" @click="toggleEdit">{{ isEditing ? '完成' : '编辑' }}</text>
    </view>

    <!-- 空状态 -->
    <view class="empty" v-if="cartItems.length === 0">
      <image src="/static/empty-cart.png" class="empty-img" mode="aspectFit" />
      <text class="empty-text">购物车是空的</text>
      <button class="btn-goto" @click="goToHome">去逛逛</button>
    </view>

    <!-- 购物车列表 -->
    <view class="list" v-else>
      <view class="item" v-for="(item, index) in cartItems" :key="item.id">
        <!-- 选择框 -->
        <view class="checkbox" @click="toggleSelect(index)">
          <uni-icons 
            :type="item.selected ? 'checkbox-filled' : 'checkbox'" 
            size="40" 
            :color="item.selected ? '#FF6B35' : '#ddd'"
          />
        </view>

        <!-- 商品信息 -->
        <image :src="item.image" class="thumb" mode="aspectFill" />
        <view class="info">
          <text class="name">{{ item.name }}</text>
          <text class="spec">{{ item.spec }}</text>
          <view class="bottom">
            <text class="price">¥{{ item.price }}</text>
            <view class="counter">
              <view class="btn" @click="decrease(index)">-</view>
              <text class="count">{{ item.quantity }}</text>
              <view class="btn" @click="increase(index)">+</view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部结算栏 -->
    <view class="footer" v-if="cartItems.length > 0">
      <view class="select-all" @click="toggleSelectAll">
        <uni-icons 
          :type="allSelected ? 'checkbox-filled' : 'checkbox'" 
          size="40" 
          :color="allSelected ? '#FF6B35' : '#ddd'"
        />
        <text class="text">全选</text>
      </view>
      <view class="right" v-if="!isEditing">
        <view class="total">
          <text class="label">合计：</text>
          <text class="price">¥{{ totalPrice }}</text>
        </view>
        <button class="btn-checkout" @click="checkout">去结算({{ selectedCount }})</button>
      </view>
      <view class="right" v-else>
        <button class="btn-delete" @click="deleteSelected">删除({{ selectedCount }})</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'

const isEditing = ref(false)
const cartItems = ref([])

const toggleEdit = () => {
  isEditing.value = !isEditing.value
}

const toggleSelect = (index) => {
  cartItems.value[index].selected = !cartItems.value[index].selected
}

const toggleSelectAll = () => {
  const allSelected = cartItems.value.every(item => item.selected)
  cartItems.value.forEach(item => {
    item.selected = !allSelected
  })
}

const increase = (index) => {
  cartItems.value[index].quantity++
}

const decrease = (index) => {
  if (cartItems.value[index].quantity > 1) {
    cartItems.value[index].quantity--
  }
}

const deleteSelected = () => {
  uni.showModal({
    title: '提示',
    content: '确定删除选中的商品吗？',
    success: (res) => {
      if (res.confirm) {
        cartItems.value = cartItems.value.filter(item => !item.selected)
        uni.showToast({ title: '删除成功', icon: 'success' })
      }
    }
  })
}

const checkout = () => {
  const selectedItems = cartItems.value.filter(item => item.selected)
  if (selectedItems.length === 0) {
    uni.showToast({ title: '请选择商品', icon: 'none' })
    return
  }
  uni.navigateTo({ url: '/pages/order/confirm' })
}

const goToHome = () => {
  uni.switchTab({ url: '/pages/index/index' })
}

// 计算属性
const allSelected = computed(() => {
  return cartItems.value.length > 0 && cartItems.value.every(item => item.selected)
})

const selectedCount = computed(() => {
  return cartItems.value.filter(item => item.selected).length
})

const totalPrice = computed(() => {
  return cartItems.value
    .filter(item => item.selected)
    .reduce((sum, item) => sum + item.price * item.quantity, 0)
    .toFixed(2)
})

// 初始化模拟数据
cartItems.value = [
  {
    id: '1',
    name: '商品1',
    spec: '默认规格',
    image: 'https://via.placeholder.com/200x200/FF6B35/FFFFFF?text=商品1',
    price: 99.00,
    quantity: 1,
    selected: true
  },
  {
    id: '2',
    name: '商品2',
    spec: '默认规格',
    image: 'https://via.placeholder.com/200x200/FF6B35/FFFFFF?text=商品2',
    price: 199.00,
    quantity: 2,
    selected: false
  }
]
</script>

<style lang="scss" scoped>
.cart {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 120rpx;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  padding: 30rpx;
  position: sticky;
  top: 0;
  z-index: 10;
}

.title {
  font-size: 32rpx;
  color: #333;
  font-weight: bold;
}

.btn-edit {
  font-size: 28rpx;
  color: #FF6B35;
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

.list {
  padding: 20rpx;
}

.item {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 16rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
}

.checkbox {
  margin-right: 20rpx;
}

.thumb {
  width: 180rpx;
  height: 180rpx;
  border-radius: 8rpx;
  margin-right: 20rpx;
}

.info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
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
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
}

.price {
  font-size: 32rpx;
  color: #FF6B35;
  font-weight: bold;
}

.counter {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.btn {
  width: 56rpx;
  height: 56rpx;
  background: #f5f5f5;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: #333;
}

.count {
  font-size: 26rpx;
  min-width: 56rpx;
  text-align: center;
}

.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.select-all {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.text {
  font-size: 28rpx;
  color: #333;
}

.right {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.total {
  display: flex;
  align-items: baseline;
  gap: 8rpx;
}

.label {
  font-size: 28rpx;
  color: #333;
}

.total .price {
  font-size: 36rpx;
  color: #FF6B35;
}

.btn-checkout {
  width: 240rpx;
  height: 80rpx;
  background: linear-gradient(135deg, #FF6B35 0%, #FF8C61 100%);
  color: #fff;
  border-radius: 40rpx;
  font-size: 28rpx;
  font-weight: bold;
  line-height: 80rpx;
}

.btn-delete {
  width: 160rpx;
  height: 70rpx;
  background: #FF3B30;
  color: #fff;
  border-radius: 35rpx;
  font-size: 28rpx;
  line-height: 70rpx;
}
</style>
