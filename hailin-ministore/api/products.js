import { get, post } from './request.js'

/**
 * 商品相关API
 */

// 获取商品列表
export const getProducts = (params) => {
  return get('/products', params)
}

// 获取商品详情
export const getProductDetail = (id) => {
  return get(`/products/${id}`)
}

// 搜索商品
export const searchProducts = (keyword) => {
  return get('/products/search', { keyword })
}

// 获取分类列表
export const getCategories = () => {
  return get('/products/categories')
}

// 获取分类商品
export const getCategoryProducts = (categoryId, params = {}) => {
  return get(`/products/categories/${categoryId}`, params)
}

// 获取热门商品
export const getHotProducts = (limit = 10) => {
  return get('/products/hot', { limit })
}

// 获取新品
export const getNewProducts = (limit = 10) => {
  return get('/products/new', { limit })
}

// 获取推荐商品
export const getRecommendProducts = (limit = 10) => {
  return get('/products/recommend', { limit })
}
