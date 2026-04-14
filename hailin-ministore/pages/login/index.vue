<template>
  <view class="login">
    <!-- Logo -->
    <view class="logo">
      <image src="/static/logo.png" class="logo-img" mode="aspectFit" />
      <text class="logo-text">海邻到家</text>
    </view>

    <!-- 登录表单 -->
    <view class="form">
      <!-- 手机号登录 -->
      <view class="input-group">
        <view class="input">
          <text class="prefix">+86</text>
          <input
            type="number"
            v-model="phone"
            placeholder="请输入手机号"
            maxlength="11"
            class="input-inner"
          />
        </view>
      </view>

      <view class="input-group">
        <view class="input">
          <input
            type="number"
            v-model="code"
            placeholder="请输入验证码"
            maxlength="6"
            class="input-inner"
          />
          <button 
            class="btn-code" 
            @click="sendCode"
            :disabled="countdown > 0"
          >
            {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
          </button>
        </view>
      </view>

      <!-- 微信登录 -->
      <view class="divider">
        <view class="line"></view>
        <text class="text">或</text>
        <view class="line"></view>
      </view>

      <button class="btn-wechat" open-type="getUserInfo" @getuserinfo="onWechatLogin">
        <uni-icons type="weixin" size="40" color="#fff" />
        <text>微信一键登录</text>
      </button>

      <button class="btn-login" @click="handleLogin" :disabled="!canLogin">
        登录
      </button>
    </view>

    <!-- 协议 -->
    <view class="agreement">
      <view class="checkbox" @click="toggleAgree">
        <uni-icons 
          :type="isAgreed ? 'checkbox-filled' : 'checkbox'" 
          size="40" 
          :color="isAgreed ? '#FF6B35' : '#ddd'"
        />
      </view>
      <text class="text">
        我已阅读并同意
        <text class="link" @click="goToAgreement('user')">《用户协议》</text>
        和
        <text class="link" @click="goToAgreement('privacy')">《隐私政策》</text>
      </text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'

const phone = ref('')
const code = ref('')
const countdown = ref(0)
const isAgreed = ref(false)

const canLogin = computed(() => {
  return phone.value.length === 11 && code.value.length === 6 && isAgreed.value
})

const toggleAgree = () => {
  isAgreed.value = !isAgreed.value
}

const sendCode = () => {
  if (!phone.value || phone.value.length !== 11) {
    uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
    return
  }

  // 发送验证码
  uni.showLoading({ title: '发送中...' })
  
  setTimeout(() => {
    uni.hideLoading()
    uni.showToast({ title: '验证码已发送', icon: 'success' })
    
    // 开始倒计时
    countdown.value = 60
    const timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)
  }, 1000)
}

const onWechatLogin = (e) => {
  if (!isAgreed.value) {
    uni.showToast({ title: '请先同意协议', icon: 'none' })
    return
  }

  uni.showLoading({ title: '登录中...' })

  setTimeout(() => {
    uni.hideLoading()
    // TODO: 微信登录逻辑
    uni.setStorageSync('token', 'mock-token')
    uni.showToast({ title: '登录成功', icon: 'success' })
    
    setTimeout(() => {
      uni.switchTab({ url: '/pages/index/index' })
    }, 1500)
  }, 1500)
}

const handleLogin = () => {
  if (!isAgreed.value) {
    uni.showToast({ title: '请先同意协议', icon: 'none' })
    return
  }

  uni.showLoading({ title: '登录中...' })

  setTimeout(() => {
    uni.hideLoading()
    // TODO: 手机号验证码登录逻辑
    uni.setStorageSync('token', 'mock-token')
    uni.showToast({ title: '登录成功', icon: 'success' })
    
    setTimeout(() => {
      uni.switchTab({ url: '/pages/index/index' })
    }, 1500)
  }, 1500)
}

const goToAgreement = (type) => {
  uni.showToast({ title: type === 'user' ? '用户协议' : '隐私政策', icon: 'none' })
}
</script>

<style lang="scss" scoped>
.login {
  min-height: 100vh;
  background: #fff;
  padding: 0 60rpx;
  display: flex;
  flex-direction: column;
}

.logo {
  padding-top: 120rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
}

.logo-img {
  width: 160rpx;
  height: 160rpx;
}

.logo-text {
  font-size: 40rpx;
  color: #FF6B35;
  font-weight: bold;
}

.form {
  margin-top: 100rpx;
}

.input-group {
  margin-bottom: 30rpx;
}

.input {
  display: flex;
  align-items: center;
  background: #f5f5f5;
  border-radius: 16rpx;
  padding: 0 30rpx;
  height: 100rpx;
}

.prefix {
  font-size: 32rpx;
  color: #333;
  margin-right: 20rpx;
}

.input-inner {
  flex: 1;
  font-size: 28rpx;
  color: #333;
}

.btn-code {
  font-size: 24rpx;
  color: #FF6B35;
  padding: 0 20rpx;
  background: transparent;
  border-left: 1rpx solid #ddd;
  height: 60rpx;
  line-height: 60rpx;
  margin-left: 20rpx;
}

.btn-code[disabled] {
  color: #999;
}

.divider {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 30rpx;
  margin: 40rpx 0;
}

.line {
  flex: 1;
  height: 1rpx;
  background: #ddd;
}

.text {
  font-size: 24rpx;
  color: #999;
}

.btn-wechat {
  width: 100%;
  height: 100rpx;
  background: #07C160;
  color: #fff;
  border-radius: 50rpx;
  font-size: 32rpx;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  margin-bottom: 30rpx;
}

.btn-login {
  width: 100%;
  height: 100rpx;
  background: linear-gradient(135deg, #FF6B35 0%, #FF8C61 100%);
  color: #fff;
  border-radius: 50rpx;
  font-size: 32rpx;
  font-weight: bold;
  line-height: 100rpx;
}

.btn-login[disabled] {
  background: #ddd;
  color: #999;
}

.agreement {
  display: flex;
  align-items: flex-start;
  margin-top: auto;
  padding-bottom: 40rpx;
}

.checkbox {
  margin-right: 12rpx;
}

.text {
  flex: 1;
  font-size: 24rpx;
  color: #666;
  line-height: 1.6;
}

.link {
  color: #FF6B35;
}
</style>
