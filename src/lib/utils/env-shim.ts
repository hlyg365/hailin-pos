/**
 * LangChain Core Env Shim
 * 
 * 用于解决 @langchain/core/utils/env 模块在 Next.js 构建时的解析问题
 */

export function getEnvironmentVariable(name: string): string | undefined {
  return process.env[name];
}

export function getBooleanEnvironmentVariable(name: string): boolean {
  const value = process.env[name];
  return value === 'true' || value === '1';
}

export function getIntegerEnvironmentVariable(name: string): number | undefined {
  const value = process.env[name];
  if (value) {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}
