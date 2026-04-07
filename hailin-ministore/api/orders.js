import { get, post, put } from './request.js'

/**
 * 订单相关API
 */

// 创建订单
export const createOrder = (orderData) => {
  return post('/orders', orderData)
}

// 获取订单列表
export const getOrders = (params = {}) => {
  return get('/orders', params)
}

// 获取订单详情
export const getOrderDetail = (orderId) => {
  return get(`/orders/${orderId}`)
}

// 取消订单
export const cancelOrder = (orderId) => {
  return post(`/orders/${orderId}/cancel`)
}

// 确认收货
export const confirmOrder = (orderId) => {
  return post(`/orders/${orderId}/confirm`)
}

// 删除订单
export const deleteOrder = (orderId) => {
  return del(`/orders/${orderId}`)
}

// 获取订单数量统计
export const getOrderStats = () => {
  return get('/orders/stats')
}

// 重新下单
export const reorder = (orderId) => {
  return post(`/orders/${orderId}/reorder`)
}
