// API基础配置
const BASE_URL = 'https://hldj365.coze.site/api'

// 请求拦截器
const request = (options) => {
  return new Promise((resolve, reject) => {
    // 显示加载提示
    if (options.loading !== false) {
      uni.showLoading({
        title: '加载中...',
        mask: true
      })
    }

    // 获取token
    const token = uni.getStorageSync('token') || ''

    uni.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      timeout: 10000,
      success: (res) => {
        uni.hideLoading()

        if (res.statusCode === 200) {
          if (res.data.success === false) {
            // 业务错误
            uni.showToast({
              title: res.data.message || '请求失败',
              icon: 'none'
            })
            reject(res.data)
          } else {
            resolve(res.data)
          }
        } else if (res.statusCode === 401) {
          // 未授权，跳转登录
          uni.showToast({
            title: '请先登录',
            icon: 'none'
          })
          uni.removeStorageSync('token')
          uni.removeStorageSync('userInfo')
          uni.navigateTo({
            url: '/pages/user/login'
          })
          reject(res)
        } else {
          uni.showToast({
            title: '网络错误',
            icon: 'none'
          })
          reject(res)
        }
      },
      fail: (err) => {
        uni.hideLoading()
        uni.showToast({
          title: '网络连接失败',
          icon: 'none'
        })
        reject(err)
      }
    })
  })
}

// GET请求
export const get = (url, data = {}) => {
  return request({
    url,
    method: 'GET',
    data
  })
}

// POST请求
export const post = (url, data = {}) => {
  return request({
    url,
    method: 'POST',
    data
  })
}

// PUT请求
export const put = (url, data = {}) => {
  return request({
    url,
    method: 'PUT',
    data
  })
}

// DELETE请求
export const del = (url, data = {}) => {
  return request({
    url,
    method: 'DELETE',
    data
  })
}

export default {
  get,
  post,
  put,
  del,
  request
}
