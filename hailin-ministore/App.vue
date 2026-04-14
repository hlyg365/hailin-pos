<script>
export default {
  onLaunch: function() {
    console.log('App Launch')

    // 检查登录状态
    const token = uni.getStorageSync('token')
    if (token) {
      // 已登录，加载用户信息
      this.loadUserInfo()
    }

    // 初始化购物车
    this.initCart()
  },
  onShow: function() {
    console.log('App Show')
  },
  onHide: function() {
    console.log('App Hide')
  },
  methods: {
    loadUserInfo() {
      // TODO: 加载用户信息
      console.log('加载用户信息')
    },
    initCart() {
      // TODO: 初始化购物车
      console.log('初始化购物车')
    }
  }
}
</script>

<style lang="scss">
/* 全局样式 */
@import '@/uni_modules/uni-scss/uni.scss';

page {
  background: #f5f5f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* 隐藏滚动条 */
::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
  color: transparent;
}

/* 全局工具类 */
.text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.text-ellipsis-2 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* 主题色变量 */
:root {
  --primary-color: #FF6B35;
  --primary-light: #FF8C61;
  --primary-dark: #E55A2B;
}
</style>
