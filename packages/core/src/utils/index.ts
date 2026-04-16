// ============================================
// 海邻到家 - 工具函数
// ============================================

// 价格格式化
export function formatPrice(price: number, showUnit = true): string {
  const formatted = price.toFixed(2);
  return showUnit ? `¥${formatted}` : formatted;
}

// 日期格式化
export function formatDate(
  date: string | Date, 
  format: 'full' | 'date' | 'time' | 'short' = 'full'
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  switch (format) {
    case 'full':
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    case 'date':
      return `${year}-${month}-${day}`;
    case 'time':
      return `${hours}:${minutes}:${seconds}`;
    case 'short':
      return `${month}-${day} ${hours}:${minutes}`;
    default:
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }
}

// 手机号格式化
export function formatPhone(phone: string): string {
  if (!phone) return '';
  return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1****$3');
}

// 防抖
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

// 节流
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastTime = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastTime >= delay) {
      lastTime = now;
      fn(...args);
    }
  };
}

// 生成唯一ID
export function generateId(prefix?: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`;
}

// 生成订单号
export function generateOrderNo(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `HL${year}${month}${day}${random}`;
}

// 深拷贝
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as any;
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as any;
  }
  
  if (obj instanceof Object) {
    const clonedObj = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  
  return obj;
}

// 判断是否在晚8点后
export function isAfter8PM(): boolean {
  const hour = new Date().getHours();
  return hour >= 20;
}

// 计算会员折扣
export function calculateMemberDiscount(
  amount: number, 
  discount: number
): { discountAmount: number; finalAmount: number } {
  const discountAmount = amount * (1 - discount);
  const finalAmount = amount - discountAmount;
  return {
    discountAmount,
    finalAmount,
  };
}

// 计算积分
export function calculatePoints(
  amount: number,
  multiplier: number = 1,
  isBirthday: boolean = false
): number {
  const basePoints = Math.floor(amount);
  let points = basePoints * multiplier;
  
  if (isBirthday) {
    points *= 2;
  }
  
  return Math.floor(points);
}

// 验证手机号
export function validatePhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone);
}

// 验证密码强度
export function validatePassword(password: string): { 
  valid: boolean; 
  message: string 
} {
  if (password.length < 6) {
    return { valid: false, message: '密码至少6位' };
  }
  
  if (!/[A-Za-z]/.test(password)) {
    return { valid: false, message: '密码需包含字母' };
  }
  
  return { valid: true, message: '' };
}

// 金额补零
export function padPrice(price: number, width: number = 8): string {
  return price.toFixed(2).padStart(width, ' ');
}

// 数组求和
export function sum(arr: number[]): number {
  return arr.reduce((acc, val) => acc + val, 0);
}

// 数组分组
export function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}
