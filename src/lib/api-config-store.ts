/**
 * API配置存储模块
 * 使用 Supabase 数据库存储API密钥配置，确保持久化
 * 
 * 表名: system_config
 * 字段: config_key (唯一键), config_value, description, created_at, updated_at
 */

import { getSupabaseClient } from '@/storage/database/supabase-client';

// 配置类型定义
interface ApiConfig {
  shanhaiyunApiKey?: string;
  rolltoolsAppId?: string;
  rolltoolsAppSecret?: string;
  tencentSecretId?: string;
  tencentSecretKey?: string;
  showapiAppKey?: string;
  showapiImageAppKey?: string; // 万维易源图像识别AppKey
}

// 配置键名常量
const CONFIG_KEYS = {
  SHANHAIYUN_API_KEY: 'shanhaiyun_api_key',
  ROLLTOOLS_APP_ID: 'rolltools_app_id',
  ROLLTOOLS_APP_SECRET: 'rolltools_app_secret',
  TENCENT_SECRET_ID: 'tencent_secret_id',
  TENCENT_SECRET_KEY: 'tencent_secret_key',
  SHOWAPI_APP_KEY: 'showapi_app_key',
  SHOWAPI_IMAGE_APP_KEY: 'showapi_image_app_key',
} as const;

// 获取 Supabase 客户端（服务端使用 service_role_key，绕过 RLS）
function getClient() {
  return getSupabaseClient();
}

// 从数据库读取配置值
async function getConfigValue(key: string): Promise<string | null> {
  const client = getClient();
  const { data, error } = await client
    .from('system_config')
    .select('config_value')
    .eq('config_key', key)
    .maybeSingle();
  
  if (error) {
    console.error(`[api-config] 读取配置 ${key} 失败:`, error.message);
    return null;
  }
  
  return data?.config_value || null;
}

// 保存配置值到数据库（使用 upsert）
async function setConfigValue(key: string, value: string, description?: string): Promise<boolean> {
  const client = getClient();
  const { error } = await client
    .from('system_config')
    .upsert(
      {
        config_key: key,
        config_value: value,
        description: description,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'config_key' }
    );
  
  if (error) {
    console.error(`[api-config] 保存配置 ${key} 失败:`, error.message);
    return false;
  }
  
  return true;
}

// 删除配置值
async function deleteConfigValue(key: string): Promise<boolean> {
  const client = getClient();
  const { error } = await client
    .from('system_config')
    .delete()
    .eq('config_key', key);
  
  if (error) {
    console.error(`[api-config] 删除配置 ${key} 失败:`, error.message);
    return false;
  }
  
  return true;
}

// 批量读取所有配置
async function getAllConfigValues(): Promise<Record<string, string>> {
  const client = getClient();
  const { data, error } = await client
    .from('system_config')
    .select('config_key, config_value')
    .in('config_key', Object.values(CONFIG_KEYS));
  
  if (error) {
    console.error('[api-config] 批量读取配置失败:', error.message);
    return {};
  }
  
  const result: Record<string, string> = {};
  for (const item of data || []) {
    result[item.config_key] = item.config_value;
  }
  
  return result;
}

// 获取完整配置（原始值）- 异步版本
export async function getApiConfig(): Promise<ApiConfig> {
  const values = await getAllConfigValues();
  return {
    shanhaiyunApiKey: values[CONFIG_KEYS.SHANHAIYUN_API_KEY] || undefined,
    rolltoolsAppId: values[CONFIG_KEYS.ROLLTOOLS_APP_ID] || undefined,
    rolltoolsAppSecret: values[CONFIG_KEYS.ROLLTOOLS_APP_SECRET] || undefined,
    tencentSecretId: values[CONFIG_KEYS.TENCENT_SECRET_ID] || undefined,
    tencentSecretKey: values[CONFIG_KEYS.TENCENT_SECRET_KEY] || undefined,
    showapiAppKey: values[CONFIG_KEYS.SHOWAPI_APP_KEY] || undefined,
    showapiImageAppKey: values[CONFIG_KEYS.SHOWAPI_IMAGE_APP_KEY] || undefined,
  };
}

// 保存山海云端API Key
export async function setShanhaiyunApiKey(key: string | undefined): Promise<boolean> {
  if (key) {
    return setConfigValue(
      CONFIG_KEYS.SHANHAIYUN_API_KEY,
      key,
      '山海云端条码识别API密钥'
    );
  } else {
    return deleteConfigValue(CONFIG_KEYS.SHANHAIYUN_API_KEY);
  }
}

// 获取山海云端API Key
export async function getShanhaiyunApiKey(): Promise<string | undefined> {
  const value = await getConfigValue(CONFIG_KEYS.SHANHAIYUN_API_KEY);
  return value || undefined;
}

// 检查山海云端API是否已配置
export async function hasShanhaiyunKey(): Promise<boolean> {
  const value = await getConfigValue(CONFIG_KEYS.SHANHAIYUN_API_KEY);
  return !!value;
}

// 保存RollTools配置（支持部分更新）
export async function setRollToolsConfig(appId: string | undefined, appSecret: string | undefined): Promise<boolean> {
  // 只有当两个值都提供且都非空时才保存
  if (appId && appSecret) {
    const result1 = await setConfigValue(
      CONFIG_KEYS.ROLLTOOLS_APP_ID,
      appId,
      'RollTools条码识别AppId'
    );
    const result2 = await setConfigValue(
      CONFIG_KEYS.ROLLTOOLS_APP_SECRET,
      appSecret,
      'RollTools条码识别AppSecret'
    );
    return result1 && result2;
  } else if (appId === '' && appSecret === '') {
    // 两个都为空字符串时，清除配置
    await deleteConfigValue(CONFIG_KEYS.ROLLTOOLS_APP_ID);
    await deleteConfigValue(CONFIG_KEYS.ROLLTOOLS_APP_SECRET);
    return true;
  }
  // 其他情况（部分提供）不做处理，保留原配置
  return true;
}

// 获取RollTools配置
export async function getRollToolsConfig(): Promise<{ appId?: string; appSecret?: string }> {
  const appId = await getConfigValue(CONFIG_KEYS.ROLLTOOLS_APP_ID);
  const appSecret = await getConfigValue(CONFIG_KEYS.ROLLTOOLS_APP_SECRET);
  return {
    appId: appId || undefined,
    appSecret: appSecret || undefined,
  };
}

// 检查RollTools是否已配置
export async function hasRollToolsKey(): Promise<boolean> {
  const appId = await getConfigValue(CONFIG_KEYS.ROLLTOOLS_APP_ID);
  const appSecret = await getConfigValue(CONFIG_KEYS.ROLLTOOLS_APP_SECRET);
  return !!(appId && appSecret);
}

// ========== 腾讯云配置 ==========

// 保存腾讯云配置（支持部分更新）
export async function setTencentConfig(secretId: string | undefined, secretKey: string | undefined): Promise<boolean> {
  // 只有当两个值都提供且都非空时才保存
  if (secretId && secretKey) {
    const result1 = await setConfigValue(
      CONFIG_KEYS.TENCENT_SECRET_ID,
      secretId,
      '腾讯云SecretId'
    );
    const result2 = await setConfigValue(
      CONFIG_KEYS.TENCENT_SECRET_KEY,
      secretKey,
      '腾讯云SecretKey'
    );
    return result1 && result2;
  } else if (secretId === '' && secretKey === '') {
    // 两个都为空字符串时，清除配置
    await deleteConfigValue(CONFIG_KEYS.TENCENT_SECRET_ID);
    await deleteConfigValue(CONFIG_KEYS.TENCENT_SECRET_KEY);
    return true;
  }
  // 其他情况（部分提供）不做处理，保留原配置
  return true;
}

// 获取腾讯云配置
export async function getTencentConfig(): Promise<{ secretId?: string; secretKey?: string }> {
  const secretId = await getConfigValue(CONFIG_KEYS.TENCENT_SECRET_ID);
  const secretKey = await getConfigValue(CONFIG_KEYS.TENCENT_SECRET_KEY);
  return {
    secretId: secretId || undefined,
    secretKey: secretKey || undefined,
  };
}

// 检查腾讯云是否已配置
export async function hasTencentKey(): Promise<boolean> {
  const secretId = await getConfigValue(CONFIG_KEYS.TENCENT_SECRET_ID);
  const secretKey = await getConfigValue(CONFIG_KEYS.TENCENT_SECRET_KEY);
  return !!(secretId && secretKey);
}

// ========== 万维易源配置 ==========

// 保存万维易源配置
export async function setShowapiConfig(appKey: string | undefined): Promise<boolean> {
  if (appKey) {
    return setConfigValue(
      CONFIG_KEYS.SHOWAPI_APP_KEY,
      appKey,
      '万维易源AppKey'
    );
  } else {
    return deleteConfigValue(CONFIG_KEYS.SHOWAPI_APP_KEY);
  }
}

// 获取万维易源配置
export async function getShowapiConfig(): Promise<{ appKey?: string }> {
  const appKey = await getConfigValue(CONFIG_KEYS.SHOWAPI_APP_KEY);
  return {
    appKey: appKey || undefined,
  };
}

// 检查万维易源是否已配置
export async function hasShowapiKey(): Promise<boolean> {
  const appKey = await getConfigValue(CONFIG_KEYS.SHOWAPI_APP_KEY);
  return !!appKey;
}

// ========== 万维易源图像识别配置 ==========

// 保存万维易源图像识别配置
export async function setShowapiImageConfig(appKey: string | undefined): Promise<boolean> {
  if (appKey) {
    return setConfigValue(
      CONFIG_KEYS.SHOWAPI_IMAGE_APP_KEY,
      appKey,
      '万维易源图像识别AppKey'
    );
  } else {
    return deleteConfigValue(CONFIG_KEYS.SHOWAPI_IMAGE_APP_KEY);
  }
}

// 获取万维易源图像识别配置
export async function getShowapiImageConfig(): Promise<{ appKey?: string }> {
  const appKey = await getConfigValue(CONFIG_KEYS.SHOWAPI_IMAGE_APP_KEY);
  return {
    appKey: appKey || undefined,
  };
}

// 检查万维易源图像识别是否已配置
export async function hasShowapiImageKey(): Promise<boolean> {
  const appKey = await getConfigValue(CONFIG_KEYS.SHOWAPI_IMAGE_APP_KEY);
  return !!appKey;
}

// 获取配置状态（用于前端显示）
export async function getConfigStatus() {
  const [hasShanhaiyun, hasRolltools, hasTencent, hasShowapi, hasShowapiImage] = await Promise.all([
    hasShanhaiyunKey(),
    hasRollToolsKey(),
    hasTencentKey(),
    hasShowapiKey(),
    hasShowapiImageKey(),
  ]);
  return {
    hasShanhaiyunKey: hasShanhaiyun,
    hasRolltoolsKey: hasRolltools,
    hasTencentKey: hasTencent,
    hasShowapiKey: hasShowapi,
    hasShowapiImageKey: hasShowapiImage,
  };
}

// 获取脱敏后的配置（用于前端显示）
export async function getMaskedConfig() {
  const [hasShanhaiyun, hasRolltools, hasTencent, hasShowapi, hasShowapiImage] = await Promise.all([
    hasShanhaiyunKey(),
    hasRollToolsKey(),
    hasTencentKey(),
    hasShowapiKey(),
    hasShowapiImageKey(),
  ]);
  return {
    shanhaiyunApiKey: hasShanhaiyun ? '******已配置' : '',
    rolltoolsAppId: hasRolltools ? '******已配置' : '',
    rolltoolsAppSecret: hasRolltools ? '******已配置' : '',
    tencentSecretId: hasTencent ? '******已配置' : '',
    tencentSecretKey: hasTencent ? '******已配置' : '',
    showapiAppKey: hasShowapi ? '******已配置' : '',
    showapiImageAppKey: hasShowapiImage ? '******已配置' : '',
    hasShanhaiyunKey: hasShanhaiyun,
    hasRolltoolsKey: hasRolltools,
    hasTencentKey: hasTencent,
    hasShowapiKey: hasShowapi,
    hasShowapiImageKey: hasShowapiImage,
  };
}

// 同步版本的兼容函数（用于向后兼容，但不推荐使用）
// 这些函数会立即返回默认值，实际操作需要使用异步版本
export const getApiConfigSync = (): ApiConfig => {
  console.warn('[api-config] getApiConfigSync 已弃用，请使用异步版本 getApiConfig');
  return {};
};

export const getShanhaiyunApiKeySync = (): string | undefined => {
  console.warn('[api-config] getShanhaiyunApiKeySync 已弃用，请使用异步版本');
  return undefined;
};

export const hasShanhaiyunKeySync = (): boolean => {
  console.warn('[api-config] hasShanhaiyunKeySync 已弃用，请使用异步版本');
  return false;
};

export const hasRollToolsKeySync = (): boolean => {
  console.warn('[api-config] hasRollToolsKeySync 已弃用，请使用异步版本');
  return false;
};
