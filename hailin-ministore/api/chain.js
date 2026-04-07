// 接龙API封装
import { request } from './request.js'

const BASE_URL = '/api/chain'

/**
 * 获取接龙列表
 * @param {Object} params - 查询参数
 * @returns {Promise}
 */
export const getChainList = (params = {}) => {
  return request(BASE_URL, {
    method: 'GET',
    data: params
  })
}

/**
 * 获取接龙详情
 * @param {String} id - 接龙ID
 * @returns {Promise}
 */
export const getChainDetail = (id) => {
  return request(`${BASE_URL}/${id}`, {
    method: 'GET'
  })
}

/**
 * 创建接龙
 * @param {Object} data - 接龙数据
 * @returns {Promise}
 */
export const createChain = (data) => {
  return request(BASE_URL, {
    method: 'POST',
    data
  })
}

/**
 * 更新接龙
 * @param {String} id - 接龙ID
 * @param {Object} data - 接龙数据
 * @returns {Promise}
 */
export const updateChain = (id, data) => {
  return request(`${BASE_URL}/${id}`, {
    method: 'PUT',
    data
  })
}

/**
 * 删除接龙
 * @param {String} id - 接龙ID
 * @returns {Promise}
 */
export const deleteChain = (id) => {
  return request(`${BASE_URL}/${id}`, {
    method: 'DELETE'
  })
}

/**
 * 参与接龙
 * @param {String} id - 接龙ID
 * @param {Object} data - 参与数据
 * @returns {Promise}
 */
export const joinChain = (id, data) => {
  return request(`${BASE_URL}/${id}/join`, {
    method: 'POST',
    data
  })
}

/**
 * 获取参与者列表
 * @param {String} id - 接龙ID
 * @returns {Promise}
 */
export const getParticipants = (id) => {
  return request(`${BASE_URL}/${id}/participants`, {
    method: 'GET'
  })
}

/**
 * 获取接龙统计数据
 * @param {String} id - 接龙ID
 * @returns {Promise}
 */
export const getChainStats = (id) => {
  return request(`${BASE_URL}/${id}/stats`, {
    method: 'GET'
  })
}

/**
 * 获取我的接龙列表
 * @param {Object} params - 查询参数
 * @returns {Promise}
 */
export const getMyChains = (params = {}) => {
  return request(`${BASE_URL}/my`, {
    method: 'GET',
    data: params
  })
}

/**
 * 结束接龙
 * @param {String} id - 接龙ID
 * @returns {Promise}
 */
export const endChain = (id) => {
  return request(`${BASE_URL}/${id}/end`, {
    method: 'POST'
  })
}

/**
 * 暂停接龙
 * @param {String} id - 接龙ID
 * @returns {Promise}
 */
export const pauseChain = (id) => {
  return request(`${BASE_URL}/${id}/pause`, {
    method: 'POST'
  })
}

/**
 * 恢复接龙
 * @param {String} id - 接龙ID
 * @returns {Promise}
 */
export const resumeChain = (id) => {
  return request(`${BASE_URL}/${id}/resume`, {
    method: 'POST'
  })
}

/**
 * 导出接龙数据
 * @param {String} id - 接龙ID
 * @returns {Promise}
 */
export const exportChainData = (id) => {
  return request(`${BASE_URL}/${id}/export`, {
    method: 'GET',
    responseType: 'blob'
  })
}

/**
 * 通知参与者
 * @param {String} id - 接龙ID
 * @param {Object} data - 通知内容
 * @returns {Promise}
 */
export const notifyParticipants = (id, data) => {
  return request(`${BASE_URL}/${id}/notify`, {
    method: 'POST',
    data
  })
}

/**
 * 复制接龙
 * @param {String} id - 接龙ID
 * @returns {Promise}
 */
export const copyChain = (id) => {
  return request(`${BASE_URL}/${id}/copy`, {
    method: 'POST'
  })
}

/**
 * 更新接龙设置
 * @param {String} id - 接龙ID
 * @param {Object} data - 设置数据
 * @returns {Promise}
 */
export const updateChainSettings = (id, data) => {
  return request(`${BASE_URL}/${id}/settings`, {
    method: 'PUT',
    data
  })
}

// Mock数据（开发阶段使用）
export const mockChainList = [
  {
    id: '1',
    title: '新鲜水果团购接龙',
    description: '新鲜水果，产地直发，今日特价',
    price: '39.90',
    participantCount: 15,
    status: 'active',
    endTime: '2024-04-10 18:00',
    creator: '店长',
    type: 'public',
    totalAmount: '598.50'
  },
  {
    id: '2',
    title: '日用品拼团接龙',
    description: '洗衣液、牙膏等日用品团购',
    price: '29.90',
    participantCount: 28,
    status: 'active',
    endTime: '2024-04-10 20:00',
    creator: '店长',
    type: 'public',
    totalAmount: '837.20'
  },
  {
    id: '3',
    title: '零食大礼包接龙',
    description: '多种零食组合，超值优惠',
    price: '59.90',
    participantCount: 42,
    status: 'ended',
    endTime: '2024-04-07 18:00',
    creator: '店长',
    type: 'public',
    totalAmount: '2515.80'
  }
]

export const mockChainDetail = {
  id: '1',
  title: '新鲜水果团购接龙',
  description: '新鲜水果，产地直发，今日特价',
  price: '39.90',
  participantCount: 15,
  status: 'active',
  endTime: '2024-04-10 18:00',
  creator: '店长',
  type: 'public',
  totalAmount: '598.50',
  totalQuantity: 15,
  products: [
    {
      id: '1',
      name: '苹果',
      image: 'https://via.placeholder.com/200x200/FF6B35/FFFFFF?text=苹果',
      price: '12.90',
      quantity: 1
    },
    {
      id: '2',
      name: '香蕉',
      image: 'https://via.placeholder.com/200x200/FF6B35/FFFFFF?text=香蕉',
      price: '8.90',
      quantity: 1
    },
    {
      id: '3',
      name: '橙子',
      image: 'https://via.placeholder.com/200x200/FF6B35/FFFFFF?text=橙子',
      price: '18.10',
      quantity: 1
    }
  ],
  settings: {
    autoEnd: true,
    realtimeNotify: true,
    allowModify: false,
    showParticipants: true,
    maxParticipants: null
  }
}

export const mockParticipants = [
  {
    id: '1',
    name: '张三',
    avatar: 'https://via.placeholder.com/100x100/FF6B35/FFFFFF?text=张',
    phone: '138****1234',
    quantity: 1,
    amount: '39.90',
    joinTime: '04-07 14:30'
  },
  {
    id: '2',
    name: '李四',
    avatar: 'https://via.placeholder.com/100x100/FF6B35/FFFFFF?text=李',
    phone: '139****5678',
    quantity: 2,
    amount: '79.80',
    joinTime: '04-07 15:20'
  },
  {
    id: '3',
    name: '王五',
    avatar: 'https://via.placeholder.com/100x100/FF6B35/FFFFFF?text=王',
    phone: '137****9012',
    quantity: 1,
    amount: '39.90',
    joinTime: '04-07 16:10'
  }
]

// 获取Mock数据（开发阶段使用）
export const getMockChainList = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        code: 200,
        data: mockChainList
      })
    }, 300)
  })
}

export const getMockChainDetail = (id) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        code: 200,
        data: mockChainDetail
      })
    }, 300)
  })
}

export const getMockParticipants = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        code: 200,
        data: mockParticipants
      })
    }, 300)
  })
}
