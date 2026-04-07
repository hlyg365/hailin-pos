<template>
  <view class="chain-manage">
    <!-- 接龙信息 -->
    <view class="header">
      <view class="title">{{ chain.title }}</view>
      <view class="tags">
        <text :class="['tag', `tag-${chain.status}`]">
          {{ getStatusText(chain.status) }}
        </text>
        <text class="tag tag-type">{{ chain.type === 'public' ? '公开' : '私密' }}</text>
      </view>
    </view>

    <!-- 快捷操作 -->
    <view class="quick-actions">
      <view class="action-item" @click="goToData">
        <uni-icons type="list" size="48" color="#FF6B35" />
        <text class="label">数据统计</text>
      </view>
      <view class="action-item" @click="shareChain">
        <uni-icons type="redo" size="48" color="#FF6B35" />
        <text class="label">分享接龙</text>
      </view>
      <view class="action-item" @click="notifyUsers">
        <uni-icons type="chatbubble" size="48" color="#FF6B35" />
        <text class="label">通知用户</text>
      </view>
      <view class="action-item" @click="editChain">
        <uni-icons type="compose" size="48" color="#FF6B35" />
        <text class="label">编辑接龙</text>
      </view>
    </view>

    <!-- 设置选项 -->
    <view class="settings">
      <text class="section-title">接龙设置</text>
      
      <view class="setting-item">
        <text class="label">接龙标题</text>
        <text class="value">{{ chain.title }}</text>
        <uni-icons type="arrow-right" size="24" color="#999" />
      </view>

      <view class="setting-item">
        <text class="label">截止时间</text>
        <text class="value">{{ chain.endTime }}</text>
        <uni-icons type="arrow-right" size="24" color="#999" />
      </view>

      <view class="setting-item">
        <text class="label">参与人数限制</text>
        <text class="value">{{ chain.maxParticipants ? chain.maxParticipants + '人' : '无限制' }}</text>
        <uni-icons type="arrow-right" size="24" color="#999" />
      </view>

      <view class="setting-item">
        <text class="label">接龙价格</text>
        <text class="value">¥{{ chain.price }}</text>
        <uni-icons type="arrow-right" size="24" color="#999" />
      </view>

      <view class="setting-item">
        <text class="label">接龙描述</text>
        <text class="value desc">{{ chain.description }}</text>
        <uni-icons type="arrow-right" size="24" color="#999" />
      </view>
    </view>

    <!-- 商品管理 -->
    <view class="settings">
      <view class="section-header">
        <text class="section-title">商品管理</text>
        <button class="btn-add" @click="addProduct">
          <uni-icons type="plus" size="24" color="#FF6B35" />
          <text>添加</text>
        </button>
      </view>

      <view class="product-list">
        <view class="product-item" v-for="(product, index) in chain.products" :key="index">
          <image :src="product.image" class="thumb" mode="aspectFill" />
          <view class="info">
            <text class="name">{{ product.name }}</text>
            <text class="price">¥{{ product.price }}</text>
          </view>
          <view class="actions">
            <button class="btn-small" @click="editProduct(index)">
              <uni-icons type="compose" size="28" color="#666" />
            </button>
            <button class="btn-small" @click="deleteProduct(index)">
              <uni-icons type="trash" size="28" color="#FF3B30" />
            </button>
          </view>
        </view>
      </view>
    </view>

    <!-- 高级设置 -->
    <view class="settings">
      <text class="section-title">高级设置</text>

      <view class="setting-item">
        <text class="label">自动结束</text>
        <switch :checked="settings.autoEnd" @change="toggleSetting('autoEnd')" color="#FF6B35" />
      </view>

      <view class="setting-item">
        <text class="label">实时通知</text>
        <switch :checked="settings.realtimeNotify" @change="toggleSetting('realtimeNotify')" color="#FF6B35" />
      </view>

      <view class="setting-item">
        <text class="label">允许修改</text>
        <switch :checked="settings.allowModify" @change="toggleSetting('allowModify')" color="#FF6B35" />
      </view>

      <view class="setting-item">
        <text class="label">显示参与者</text>
        <switch :checked="settings.showParticipants" @change="toggleSetting('showParticipants')" color="#FF6B35" />
      </view>
    </view>

    <!-- 危险操作 -->
    <view class="settings danger">
      <text class="section-title">危险操作</text>

      <view class="setting-item" @click="pauseChain" v-if="chain.status === 'active'">
        <text class="label">暂停接龙</text>
        <uni-icons type="pause-circle" size="32" color="#FF9800" />
      </view>

      <view class="setting-item" @click="resumeChain" v-else-if="chain.status === 'paused'">
        <text class="label">恢复接龙</text>
        <uni-icons type="play-circle" size="32" color="#4CAF50" />
      </view>

      <view class="setting-item" @click="endChain">
        <text class="label">结束接龙</text>
        <uni-icons type="close-circle" size="32" color="#FF3B30" />
      </view>

      <view class="setting-item" @click="deleteChain">
        <text class="label">删除接龙</text>
        <uni-icons type="trash" size="32" color="#FF3B30" />
      </view>
    </view>

    <!-- 底部按钮 -->
    <view class="footer">
      <button class="btn-save" @click="saveSettings">保存设置</button>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const chainId = ref('')
const chain = ref({})
const settings = ref({
  autoEnd: true,
  realtimeNotify: true,
  allowModify: false,
  showParticipants: true
})

const getStatusText = (status) => {
  const map = {
    active: '进行中',
    ended: '已结束',
    paused: '已暂停',
    cancelled: '已取消'
  }
  return map[status] || status
}

const goToData = () => {
  uni.navigateTo({ url: `/pages/chain/data?id=${chainId.value}` })
}

const shareChain = () => {
  uni.showShareMenu({
    withShareTicket: true,
    success: () => {
      uni.showToast({ title: '请点击右上角分享', icon: 'none' })
    }
  })
}

const notifyUsers = () => {
  uni.showModal({
    title: '通知用户',
    editable: true,
    placeholderText: '输入通知内容',
    success: (res) => {
      if (res.confirm && res.content) {
        uni.showLoading({ title: '发送中...' })
        setTimeout(() => {
          uni.hideLoading()
          uni.showToast({ title: '通知已发送', icon: 'success' })
        }, 1500)
      }
    }
  })
}

const editChain = () => {
  uni.navigateTo({ url: `/pages/chain/create?edit=${chainId.value}` })
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
        chain.value.products.push({
          name,
          price: parseFloat(price).toFixed(2),
          image: 'https://via.placeholder.com/200x200/FF6B35/FFFFFF?text=' + name
        })
      }
    }
  })
}

const editProduct = (index) => {
  uni.showToast({ title: '编辑功能开发中', icon: 'none' })
}

const deleteProduct = (index) => {
  uni.showModal({
    title: '提示',
    content: '确定删除此商品吗？',
    success: (res) => {
      if (res.confirm) {
        chain.value.products.splice(index, 1)
        uni.showToast({ title: '删除成功', icon: 'success' })
      }
    }
  })
}

const toggleSetting = (key) => {
  settings.value[key] = !settings.value[key]
}

const pauseChain = () => {
  uni.showModal({
    title: '提示',
    content: '确定暂停接龙吗？',
    success: (res) => {
      if (res.confirm) {
        chain.value.status = 'paused'
        uni.showToast({ title: '接龙已暂停', icon: 'success' })
      }
    }
  })
}

const resumeChain = () => {
  uni.showModal({
    title: '提示',
    content: '确定恢复接龙吗？',
    success: (res) => {
      if (res.confirm) {
        chain.value.status = 'active'
        uni.showToast({ title: '接龙已恢复', icon: 'success' })
      }
    }
  })
}

const endChain = () => {
  uni.showModal({
    title: '提示',
    content: '确定结束接龙吗？结束后将无法继续参与',
    success: (res) => {
      if (res.confirm) {
        chain.value.status = 'ended'
        uni.showToast({ title: '接龙已结束', icon: 'success' })
      }
    }
  })
}

const deleteChain = () => {
  uni.showModal({
    title: '警告',
    content: '确定删除此接龙吗？此操作不可恢复',
    confirmColor: '#FF3B30',
    success: (res) => {
      if (res.confirm) {
        uni.showToast({ title: '接龙已删除', icon: 'success' })
        setTimeout(() => {
          uni.navigateBack()
        }, 1500)
      }
    }
  })
}

const saveSettings = () => {
  uni.showLoading({ title: '保存中...' })
  setTimeout(() => {
    uni.hideLoading()
    uni.showToast({ title: '保存成功', icon: 'success' })
  }, 1500)
}

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  chainId.value = currentPage.options.id

  // 模拟数据
  chain.value = {
    id: chainId.value,
    title: '新鲜水果团购接龙',
    description: '新鲜水果，产地直发，今日特价',
    price: '39.90',
    status: 'active',
    type: 'public',
    endTime: '2024-04-10 18:00',
    products: [
      {
        name: '苹果',
        image: 'https://via.placeholder.com/200x200/FF6B35/FFFFFF?text=苹果',
        price: '12.90'
      },
      {
        name: '香蕉',
        image: 'https://via.placeholder.com/200x200/FF6B35/FFFFFF?text=香蕉',
        price: '8.90'
      }
    ]
  }
})
</script>

<style lang="scss" scoped>
.chain-manage {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 120rpx;
}

.header {
  background: linear-gradient(135deg, #FF6B35 0%, #FF8C61 100%);
  padding: 40rpx 30rpx;
  color: #fff;
}

.title {
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 20rpx;
}

.tags {
  display: flex;
  gap: 12rpx;
}

.tag {
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
}

.tag-active {
  background: rgba(255, 255, 255, 0.2);
}

.tag-ended {
  background: rgba(0, 0, 0, 0.2);
}

.tag-paused {
  background: rgba(255, 152, 0, 0.3);
}

.tag-type {
  background: rgba(255, 255, 255, 0.2);
}

.quick-actions {
  display: flex;
  gap: 20rpx;
  background: #fff;
  padding: 30rpx;
  margin: -30rpx 30rpx 20rpx;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.action-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
}

.label {
  font-size: 24rpx;
  color: #333;
}

.settings {
  background: #fff;
  padding: 30rpx;
  margin: 0 30rpx 20rpx;
  border-radius: 16rpx;
}

.section-title {
  display: block;
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
  margin-bottom: 20rpx;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.btn-add {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 8rpx 16rpx;
  background: #FFF3E0;
  color: #FF6B35;
  border-radius: 20rpx;
  font-size: 24rpx;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-item .label {
  font-size: 28rpx;
  color: #333;
}

.value {
  font-size: 26rpx;
  color: #666;
  margin-right: 20rpx;
}

.value.desc {
  max-width: 400rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.product-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  padding: 16rpx;
}

.thumb {
  width: 80rpx;
  height: 80rpx;
  border-radius: 8rpx;
}

.info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.name {
  font-size: 26rpx;
  color: #333;
  font-weight: bold;
}

.price {
  font-size: 24rpx;
  color: #FF6B35;
}

.actions {
  display: flex;
  gap: 12rpx;
}

.btn-small {
  width: 60rpx;
  height: 60rpx;
  background: #fff;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.danger .setting-item .label {
  color: #FF3B30;
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

.btn-save {
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
