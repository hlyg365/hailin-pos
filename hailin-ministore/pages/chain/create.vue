<template>
  <view class="chain-create">
    <!-- 表单 -->
    <view class="form">
      <!-- 接龙标题 -->
      <view class="form-item">
        <text class="label required">接龙标题</text>
        <input type="text" v-model="formData.title" placeholder="请输入接龙标题" class="input" />
      </view>

      <!-- 接龙描述 -->
      <view class="form-item">
        <text class="label">接龙描述</text>
        <textarea 
          v-model="formData.description" 
          placeholder="请输入接龙描述" 
          class="textarea"
          maxlength="200"
        />
        <text class="count">{{ formData.description.length }}/200</text>
      </view>

      <!-- 价格 -->
      <view class="form-item">
        <text class="label required">价格</text>
        <view class="input-wrapper">
          <text class="prefix">¥</text>
          <input 
            type="digit" 
            v-model="formData.price" 
            placeholder="请输入价格" 
            class="input"
          />
        </view>
      </view>

      <!-- 截止时间 -->
      <view class="form-item">
        <text class="label required">截止时间</text>
        <picker mode="date" :value="formData.endTime" @change="onDateChange">
          <view class="picker-input">
            <text class="text">{{ formData.endDate || '选择日期' }}</text>
            <uni-icons type="arrow-right" size="24" color="#999" />
          </view>
        </picker>
        <picker mode="time" :value="formData.endTime" @change="onTimeChange">
          <view class="picker-input">
            <text class="text">{{ formData.endTime || '选择时间' }}</text>
            <uni-icons type="arrow-right" size="24" color="#999" />
          </view>
        </picker>
      </view>

      <!-- 商品列表 -->
      <view class="form-item">
        <text class="label">商品清单</text>
        <view class="product-list">
          <view class="product-item" v-for="(product, index) in formData.products" :key="index">
            <view class="product-info">
              <text class="name">{{ product.name }}</text>
              <text class="price">¥{{ product.price }}</text>
            </view>
            <view class="product-actions">
              <view class="counter">
                <view class="btn" @click="decreaseQuantity(index)">-</view>
                <text class="count">{{ product.quantity }}</text>
                <view class="btn" @click="increaseQuantity(index)">+</view>
              </view>
              <uni-icons type="trash" size="32" color="#FF3B30" @click="removeProduct(index)" />
            </view>
          </view>
        </view>
        <button class="btn-add-product" @click="addProduct">
          <uni-icons type="plus" size="24" color="#FF6B35" />
          <text>添加商品</text>
        </button>
      </view>
    </view>

    <!-- 提交按钮 -->
    <view class="footer">
      <button class="btn-submit" @click="submit">发布接龙</button>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

const formData = ref({
  title: '',
  description: '',
  price: '',
  endDate: '',
  endTime: '',
  products: []
})

const onDateChange = (e) => {
  formData.value.endDate = e.detail.value
}

const onTimeChange = (e) => {
  formData.value.endTime = e.detail.value
}

const addProduct = () => {
  uni.showModal({
    title: '添加商品',
    editable: true,
    placeholderText: '商品名称,价格',
    success: (res) => {
      if (res.confirm && res.content) {
        const parts = res.content.split(',')
        const name = parts[0] || '商品'
        const price = parts[1] || '0.00'
        formData.value.products.push({
          name,
          price: parseFloat(price).toFixed(2),
          quantity: 1,
          image: 'https://via.placeholder.com/200x200/FF6B35/FFFFFF?text=' + name
        })
      }
    }
  })
}

const removeProduct = (index) => {
  formData.value.products.splice(index, 1)
}

const increaseQuantity = (index) => {
  formData.value.products[index].quantity++
}

const decreaseQuantity = (index) => {
  if (formData.value.products[index].quantity > 1) {
    formData.value.products[index].quantity--
  }
}

const submit = () => {
  // 验证
  if (!formData.value.title) {
    uni.showToast({ title: '请输入接龙标题', icon: 'none' })
    return
  }

  if (!formData.value.price) {
    uni.showToast({ title: '请输入价格', icon: 'none' })
    return
  }

  if (!formData.value.endDate || !formData.value.endTime) {
    uni.showToast({ title: '请选择截止时间', icon: 'none' })
    return
  }

  uni.showLoading({ title: '发布中...' })

  setTimeout(() => {
    uni.hideLoading()
    uni.showToast({ title: '发布成功', icon: 'success' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  }, 1500)
}
</script>

<style lang="scss" scoped>
.chain-create {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 120rpx;
}

.form {
  padding: 20rpx;
}

.form-item {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.label {
  display: block;
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
  margin-bottom: 20rpx;
}

.label.required::before {
  content: '*';
  color: #FF3B30;
  margin-right: 4rpx;
}

.input {
  width: 100%;
  height: 80rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  color: #333;
}

.textarea {
  width: 100%;
  min-height: 200rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  padding: 24rpx;
  font-size: 28rpx;
  color: #333;
}

.count {
  display: block;
  text-align: right;
  font-size: 24rpx;
  color: #999;
  margin-top: 10rpx;
}

.input-wrapper {
  display: flex;
  align-items: center;
  background: #f5f5f5;
  border-radius: 12rpx;
  padding: 0 24rpx;
  height: 80rpx;
}

.prefix {
  font-size: 32rpx;
  color: #333;
  font-weight: bold;
  margin-right: 12rpx;
}

.input-wrapper .input {
  flex: 1;
  background: transparent;
  padding: 0;
  height: auto;
}

.picker-input {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f5f5f5;
  border-radius: 12rpx;
  padding: 0 24rpx;
  height: 80rpx;
  margin-bottom: 20rpx;
}

.text {
  font-size: 28rpx;
  color: #333;
}

.product-list {
  margin-bottom: 20rpx;
}

.product-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f5f5f5;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 16rpx;
}

.product-info {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.name {
  font-size: 28rpx;
  color: #333;
}

.price {
  font-size: 26rpx;
  color: #FF6B35;
}

.product-actions {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.counter {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.counter .btn {
  width: 56rpx;
  height: 56rpx;
  background: #fff;
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

.btn-add-product {
  width: 100%;
  height: 80rpx;
  background: #f5f5f5;
  color: #FF6B35;
  border-radius: 12rpx;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
}

.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.btn-submit {
  width: 100%;
  height: 90rpx;
  background: linear-gradient(135deg, #FF6B35 0%, #FF8C61 100%);
  color: #fff;
  border-radius: 45rpx;
  font-size: 32rpx;
  font-weight: bold;
  line-height: 90rpx;
}
</style>
