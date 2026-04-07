import { get, post, put } from './request.js'

/**
 * 会员相关API
 */

// 微信登录
export const wxLogin = (loginData) => {
  return post('/auth/wechat', loginData)
}

// 获取会员信息
export const getMemberInfo = () => {
  return get('/members/me')
}

// 更新会员信息
export const updateMemberInfo = (data) => {
  return put('/members/me', data)
}

// 获取会员优惠券列表
export const getMemberCoupons = (params = {}) => {
  return get('/members/coupons', params)
}

// 获取会员积分
export const getMemberPoints = () => {
  return get('/members/points')
}

// 获取会员订单统计
export const getMemberStats = () => {
  return get('/members/stats')
}

// 绑定手机号
export const bindPhone = (phoneData) => {
  return post('/members/bind-phone', phoneData)
}

// 解绑手机号
export const unbindPhone = () => {
  return post('/members/unbind-phone')
}

// 获取收货地址列表
export const getAddresses = () => {
  return get('/members/addresses')
}

// 添加收货地址
export const addAddress = (addressData) => {
  return post('/members/addresses', addressData)
}

// 更新收货地址
export const updateAddress = (addressId, addressData) => {
  return put(`/members/addresses/${addressId}`, addressData)
}

// 删除收货地址
export const deleteAddress = (addressId) => {
  return del(`/members/addresses/${addressId}`)
}

// 设置默认地址
export const setDefaultAddress = (addressId) => {
  return post(`/members/addresses/${addressId}/default`)
}
