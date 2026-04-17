/**
 * 海邻到家 V6.0 - 测试账号配置
 * 
 * 使用说明：
 * 1. 本文件包含所有测试账号信息
 * 2. 可直接使用下方账号登录系统
 * 3. 密码均为：123456
 */

export interface TestAccount {
  /** 角色类型 */
  role: 'admin' | 'manager' | 'supervisor' | 'cashier';
  /** 角色名称 */
  roleName: string;
  /** 门店编号 */
  storeId: string;
  /** 门店名称 */
  storeName: string;
  /** 操作员编号 */
  operatorId: string;
  /** 姓名 */
  name: string;
  /** 手机号 */
  phone: string;
  /** 密码 */
  password: string;
  /** 权限说明 */
  permissions: string[];
  /** 登录路径 */
  loginPath: string;
}

/**
 * 测试账号列表
 */
export const TEST_ACCOUNTS: TestAccount[] = [
  {
    role: 'admin',
    roleName: '超级管理员',
    storeId: 'HQ001',
    storeName: '总部',
    operatorId: 'admin',
    name: '系统管理员',
    phone: '13800000001',
    password: '123456',
    permissions: [
      '全系统所有权限',
      '门店管理',
      '供应链管理',
      '财务管理',
      '会员管理',
      '人员管理',
      '促销管理',
      'BI数据分析',
      '权限配置',
      '系统设置',
    ],
    loginPath: '/dashboard',
  },
  {
    role: 'manager',
    roleName: '门店店长',
    storeId: 'WJ001',
    storeName: '望京店',
    operatorId: 'zhangsan',
    name: '张三',
    phone: '13800000002',
    password: '123456',
    permissions: [
      '本店收银操作',
      '本店库存查看',
      '本店要货申请',
      '本店缴款操作',
      '本店会员查看',
      '本店数据报表',
    ],
    loginPath: '/assistant',
  },
  {
    role: 'manager',
    roleName: '门店店长',
    storeId: 'GJ001',
    storeName: '国贸店',
    operatorId: 'lisi',
    name: '李四',
    phone: '13800000003',
    password: '123456',
    permissions: [
      '本店收银操作',
      '本店库存查看',
      '本店要货申请',
      '本店缴款操作',
      '本店会员查看',
      '本店数据报表',
    ],
    loginPath: '/assistant',
  },
  {
    role: 'supervisor',
    roleName: '区域督导',
    storeId: 'REGION-CY',
    storeName: '北京朝阳区域',
    operatorId: 'zhangsp',
    name: '张督导',
    phone: '13800000004',
    password: '123456',
    permissions: [
      '区域门店数据查看',
      '区域巡店任务',
      '区域价格审批',
      '区域财务报表',
      '区域会员查看',
      '区域BI分析',
    ],
    loginPath: '/dashboard',
  },
  {
    role: 'cashier',
    roleName: '收银员',
    storeId: 'WJ001',
    storeName: '望京店',
    operatorId: 'xiaowang',
    name: '小王',
    phone: '13800000005',
    password: '123456',
    permissions: [
      '收银操作',
      '会员扫码',
      '挂单/取单',
      '交接班',
    ],
    loginPath: '/pos/cashier',
  },
  {
    role: 'cashier',
    roleName: '收银员',
    storeId: 'WJ001',
    storeName: '望京店',
    operatorId: 'xiaoli',
    name: '小李',
    phone: '13800000006',
    password: '123456',
    permissions: [
      '收银操作',
      '会员扫码',
      '挂单/取单',
      '交接班',
    ],
    loginPath: '/pos/cashier',
  },
];

/**
 * 会员测试账号
 */
export const TEST_MEMBERS = [
  { phone: '13900139001', name: '钻石会员', level: 'diamond', points: 25000, balance: 500 },
  { phone: '13900139002', name: '金卡会员', level: 'gold', points: 5680, balance: 120 },
  { phone: '13900139003', name: '银卡会员', level: 'silver', points: 1200, balance: 50 },
  { phone: '13900139004', name: '普通会员', level: 'normal', points: 380, balance: 0 },
];

/**
 * 获取角色颜色
 */
export const getRoleColor = (role: TestAccount['role']): string => {
  const colors = {
    admin: 'bg-red-100 text-red-600',
    manager: 'bg-blue-100 text-blue-600',
    supervisor: 'bg-purple-100 text-purple-600',
    cashier: 'bg-green-100 text-green-600',
  };
  return colors[role];
};

/**
 * 快速登录快捷键映射
 * 可用于快捷登录演示
 */
export const QUICK_LOGIN_MAP: Record<string, TestAccount> = {
  'admin': TEST_ACCOUNTS[0],
  'manager': TEST_ACCOUNTS[1],
  'supervisor': TEST_ACCOUNTS[2],
  'cashier': TEST_ACCOUNTS[3],
};
