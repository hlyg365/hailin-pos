// ============================================
// 海邻到家 - 核心API客户端
// 统一封装所有HTTP请求
// ============================================

import Taro from '@tarojs/taro';

// 配置
export const API_CONFIG = {
  baseURL: process.env.API_BASE_URL || 'https://api.hailin.com',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
};

// Token管理
export function getToken(): string {
  try {
    return Taro.getStorageSync('token') || '';
  } catch {
    return '';
  }
}

export function setToken(token: string): void {
  Taro.setStorageSync('token', token);
}

export function clearToken(): void {
  Taro.removeStorageSync('token');
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  code?: number;
}

// 请求配置
interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  params?: Record<string, string>;
  header?: Record<string, string>;
  showLoading?: boolean;
  loadingText?: string;
}

// 错误处理
class ApiError extends Error {
  code?: number;
  
  constructor(message: string, code?: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

// API客户端类
class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  
  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.defaultHeaders = { ...API_CONFIG.headers };
  }
  
  // 通用请求方法
  async request<T = any>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      data,
      params,
      header = {},
      showLoading = false,
      loadingText = '加载中...',
    } = options;
    
    // 添加Token
    const token = getToken();
    const headers = {
      ...this.defaultHeaders,
      ...header,
      ...(token && { Authorization: `Bearer ${token}` }),
    };
    
    // 构建URL
    let url = `${this.baseURL}${endpoint}`;
    if (params) {
      const queryString = Object.entries(params)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');
      url += `?${queryString}`;
    }
    
    // 显示加载状态
    if (showLoading) {
      Taro.showLoading({ title: loadingText });
    }
    
    try {
      const response = await Taro.request({
        url,
        method,
        data,
        header: headers,
        timeout: API_CONFIG.timeout,
      });
      
      if (showLoading) {
        Taro.hideLoading();
      }
      
      return this.handleResponse<T>(response);
    } catch (error: any) {
      if (showLoading) {
        Taro.hideLoading();
      }
      
      return this.handleError(error);
    }
  }
  
  // 处理响应
  private handleResponse<T>(response: Taro.request.SuccessCallbackResult): ApiResponse<T> {
    const { statusCode, data } = response;
    
    if (statusCode >= 200 && statusCode < 300) {
      return {
        success: true,
        data: data?.data ?? data,
        message: data?.message,
        code: data?.code ?? statusCode,
      };
    }
    
    // 处理401未授权
    if (statusCode === 401) {
      clearToken();
      Taro.navigateTo({ url: '/pages/auth/login' });
      return {
        success: false,
        message: '登录已过期，请重新登录',
        code: 401,
      };
    }
    
    return {
      success: false,
      message: data?.message || `请求失败: ${statusCode}`,
      code: statusCode,
    };
  }
  
  // 处理错误
  private handleError<T>(error: any): ApiResponse<T> {
    console.error('API Error:', error);
    
    let message = '网络请求失败';
    
    if (error.errMsg) {
      if (error.errMsg.includes('timeout')) {
        message = '请求超时，请稍后重试';
      } else if (error.errMsg.includes('abort')) {
        message = '请求已取消';
      } else {
        message = error.errMsg;
      }
    }
    
    return {
      success: false,
      message,
      code: error.statusCode || 0,
    };
  }
  
  // 快捷方法
  get<T = any>(endpoint: string, params?: Record<string, string>, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'GET', params });
  }
  
  post<T = any>(endpoint: string, data?: any, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'POST', data });
  }
  
  put<T = any>(endpoint: string, data?: any, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'PUT', data });
  }
  
  delete<T = any>(endpoint: string, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// 导出单例
export const apiClient = new ApiClient(API_CONFIG.baseURL);

// 导出默认实例
export default apiClient;
