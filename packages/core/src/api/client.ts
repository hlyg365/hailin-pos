// ============================================
// 海邻到家 - 统一API客户端
// 适配多端：小程序、H5、React Native
// ============================================

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import type { ApiResponse, LoginResult } from '../types';

// API配置
const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://api.hailin.com',
  timeout: 30000,
};

// Token存储键名
const TOKEN_KEYS = {
  pos: 'hailin_pos_token',
  dashboard: 'hailin_dashboard_token',
  assistant: 'hailin_assistant_token',
  storeAdmin: 'hailin_store_admin_token',
};

// 当前登录类型
let currentLoginType: keyof typeof TOKEN_KEYS = 'pos';

// 设置登录类型
export function setLoginType(type: keyof typeof TOKEN_KEYS) {
  currentLoginType = type;
}

// 获取Token
function getToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(TOKEN_KEYS[currentLoginType]) || '';
}

// 设置Token
function setToken(token: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEYS[currentLoginType], token);
}

// 清除Token
function clearToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEYS[currentLoginType]);
}

// 获取当前存储键
export function getTokenKey(): string {
  return TOKEN_KEYS[currentLoginType];
}

// ============ API客户端类 ============

class ApiClient {
  private client: AxiosInstance;
  private loginType: keyof typeof TOKEN_KEYS;

  constructor(baseURL: string = API_CONFIG.baseURL) {
    this.loginType = currentLoginType;
    
    this.client = axios.create({
      baseURL,
      timeout: API_CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 请求拦截器
    this.client.interceptors.request.use(
      (config) => {
        const token = getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        // 添加登录类型标识
        config.headers['X-Login-Type'] = this.loginType;
        return config;
      },
      (error) => Promise.reject(error)
    );

    // 响应拦截器
    this.client.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        const { data } = response;
        
        // 处理业务错误
        if (data.code && data.code >= 400) {
          const error = new Error(data.message || '请求失败');
          (error as any).code = data.code;
          return Promise.reject(error);
        }
        
        return response;
      },
      (error) => {
        // 处理HTTP错误
        if (error.response) {
          const { status, data } = error.response;
          
          // 401未授权
          if (status === 401) {
            clearToken();
            // 触发重新登录
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('unauthorized', { 
                detail: { loginType: this.loginType } 
              }));
            }
          }
          
          const errorMsg = data?.message || `请求失败: ${status}`;
          const apiError = new Error(errorMsg);
          (apiError as any).status = status;
          return Promise.reject(apiError);
        }
        
        // 网络错误
        if (error.code === 'ECONNABORTED') {
          return Promise.reject(new Error('请求超时，请稍后重试'));
        }
        
        return Promise.reject(new Error('网络请求失败'));
      }
    );
  }

  // 通用请求方法
  async request<T = any>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.request<ApiResponse<T>>(config);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
        code: response.data.code,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        code: error.code || error.status,
      };
    }
  }

  // GET请求
  async get<T = any>(
    url: string,
    params?: Record<string, any>,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'GET',
      url,
      params,
      ...config,
    });
  }

  // POST请求
  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'POST',
      url,
      data,
      ...config,
    });
  }

  // PUT请求
  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'PUT',
      url,
      data,
      ...config,
    });
  }

  // DELETE请求
  async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'DELETE',
      url,
      ...config,
    });
  }
}

// 创建客户端实例
export const apiClient = new ApiClient();

// ============ 认证相关 ============

export const authApi = {
  // 收银台登录
  async posLogin(phone: string, password: string, storeId?: string) {
    const result = await apiClient.post<LoginResult>('/auth/pos/login', {
      phone,
      password,
      storeId,
    });
    
    if (result.success && result.data) {
      setToken(result.data.token);
      setLoginType('pos');
      // 存储用户信息
      localStorage.setItem('hailin_pos_user', JSON.stringify(result.data.user));
      localStorage.setItem('hailin_pos_store', JSON.stringify(result.data.store));
    }
    
    return result;
  },

  // 总部后台登录
  async dashboardLogin(phone: string, password: string) {
    const result = await apiClient.post<LoginResult>('/auth/dashboard/login', {
      phone,
      password,
    });
    
    if (result.success && result.data) {
      setToken(result.data.token);
      setLoginType('dashboard');
      localStorage.setItem('hailin_dashboard_user', JSON.stringify(result.data.user));
    }
    
    return result;
  },

  // 店长助手登录
  async assistantLogin(phone: string, code: string) {
    const result = await apiClient.post<LoginResult>('/auth/assistant/login', {
      phone,
      code, // 验证码
    });
    
    if (result.success && result.data) {
      setToken(result.data.token);
      setLoginType('assistant');
      localStorage.setItem('hailin_assistant_user', JSON.stringify(result.data.user));
      localStorage.setItem('hailin_assistant_store', JSON.stringify(result.data.store));
    }
    
    return result;
  },

  // 登出
  logout() {
    clearToken();
    const loginType = getTokenKey().replace('hailin_', '').replace('_token', '');
    localStorage.removeItem(`hailin_${loginType}_user`);
    localStorage.removeItem(`hailin_${loginType}_store`);
  },

  // 获取当前用户
  getCurrentUser() {
    if (typeof window === 'undefined') return null;
    const loginType = getTokenKey().replace('hailin_', '').replace('_token', '');
    const userStr = localStorage.getItem(`hailin_${loginType}_user`);
    return userStr ? JSON.parse(userStr) : null;
  },

  // 获取当前门店
  getCurrentStore() {
    if (typeof window === 'undefined') return null;
    const loginType = getTokenKey().replace('hailin_', '').replace('_token', '');
    const storeStr = localStorage.getItem(`hailin_${loginType}_store`);
    return storeStr ? JSON.parse(storeStr) : null;
  },

  // 检查是否已登录
  isLoggedIn(): boolean {
    return !!getToken();
  },
};

// ============ 导出 ============

export default apiClient;
export { ApiClient };
