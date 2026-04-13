import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export const dynamic = 'force-dynamic';

// 子支付方式接口
interface SubPaymentMethod {
  id: string;
  payment_config_id: string;
  method_id: string;
  name: string;
  icon: string;
  enabled: boolean;
  merchant_id?: string;
  api_key?: string;
  callback_url?: string;
  is_headquarters_account: boolean;
  account_info?: any;
}

// 支付配置接口
interface PaymentConfig {
  id: string;
  category: string;
  name: string;
  icon: string;
  enabled: boolean;
  priority: number;
  is_headquarters_account: boolean;
  account_info?: any;
  subMethods: SubPaymentMethod[];
}

// 获取Supabase客户端
function tryGetSupabaseClient() {
  try {
    return getSupabaseClient();
  } catch {
    return null;
  }
}

// 默认支付配置（数据库不可用时使用）
const defaultPaymentConfigs: PaymentConfig[] = [
  {
    id: 'scan',
    category: 'scan',
    name: '扫码支付',
    icon: 'QrCode',
    enabled: true,
    priority: 1,
    is_headquarters_account: true,
    subMethods: [
      { id: 'wechat', payment_config_id: 'scan', method_id: 'wechat', name: '微信支付', icon: '💚', enabled: true, is_headquarters_account: true },
      { id: 'alipay', payment_config_id: 'scan', method_id: 'alipay', name: '支付宝', icon: '💙', enabled: true, is_headquarters_account: true },
      { id: 'jd', payment_config_id: 'scan', method_id: 'jd', name: '京东支付', icon: '🔴', enabled: true, is_headquarters_account: true },
      { id: 'unionpay', payment_config_id: 'scan', method_id: 'unionpay', name: '云闪付', icon: '🔴', enabled: true, is_headquarters_account: true },
    ],
  },
  {
    id: 'cash',
    category: 'cash',
    name: '现金支付',
    icon: 'Banknote',
    enabled: true,
    priority: 2,
    is_headquarters_account: false, // 现金不归集到总部
    subMethods: [
      { id: 'cash_direct', payment_config_id: 'cash', method_id: 'cash_direct', name: '现金收款', icon: '💵', enabled: true, is_headquarters_account: false },
    ],
  },
  {
    id: 'record',
    category: 'record',
    name: '收款记账',
    icon: 'FileText',
    enabled: true,
    priority: 3,
    is_headquarters_account: true,
    subMethods: [
      { id: 'member_balance', payment_config_id: 'record', method_id: 'member_balance', name: '会员余额', icon: '🎫', enabled: true, is_headquarters_account: true },
      { id: 'credit', payment_config_id: 'record', method_id: 'credit', name: '记账挂账', icon: '📝', enabled: true, is_headquarters_account: true },
      { id: 'monthly', payment_config_id: 'record', method_id: 'monthly', name: '月结', icon: '📅', enabled: false, is_headquarters_account: true },
    ],
  },
  {
    id: 'other',
    category: 'other',
    name: '其他支付',
    icon: 'MoreHorizontal',
    enabled: true,
    priority: 4,
    is_headquarters_account: true,
    subMethods: [
      { id: 'bank_card', payment_config_id: 'other', method_id: 'bank_card', name: '银行卡', icon: '💳', enabled: true, is_headquarters_account: true },
      { id: 'voucher', payment_config_id: 'other', method_id: 'voucher', name: '购物券', icon: '🎫', enabled: true, is_headquarters_account: true },
      { id: 'points', payment_config_id: 'other', method_id: 'points', name: '积分抵扣', icon: '⭐', enabled: true, is_headquarters_account: true },
    ],
  },
];

// GET - 获取支付配置列表
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const supabase = tryGetSupabaseClient();

  if (!supabase) {
    // 数据库不可用，返回默认配置
    console.log('[支付配置API] 数据库不可用，返回默认配置');
    if (type === 'enabled') {
      const enabledMethods = defaultPaymentConfigs
        .filter((config) => config.enabled)
        .sort((a, b) => a.priority - b.priority)
        .map((config) => ({
          ...config,
          subMethods: config.subMethods.filter((sub) => sub.enabled),
        }));
      return NextResponse.json({ success: true, data: enabledMethods });
    }
    return NextResponse.json({ success: true, data: defaultPaymentConfigs });
  }

  try {
    // 从数据库获取支付配置
    const { data: configs, error: configError } = await supabase
      .from('payment_configs')
      .select('*')
      .order('priority', { ascending: true });

    if (configError) {
      console.error('[支付配置API] 查询失败:', configError);
      return NextResponse.json({ success: true, data: defaultPaymentConfigs });
    }

    // 获取子支付方式
    const { data: subMethods, error: subError } = await supabase
      .from('payment_sub_methods')
      .select('*')
      .order('created_at', { ascending: true });

    if (subError) {
      console.error('[支付配置API] 查询子方式失败:', subError);
    }

    // 组装数据
    const paymentConfigs: PaymentConfig[] = (configs || []).map((config: any) => ({
      id: config.id,
      category: config.category,
      name: config.name,
      icon: config.icon,
      enabled: config.enabled,
      priority: config.priority,
      is_headquarters_account: config.is_headquarters_account,
      account_info: config.account_info,
      subMethods: (subMethods || [])
        .filter((sub: any) => sub.payment_config_id === config.id)
        .map((sub: any) => ({
          id: sub.id,
          payment_config_id: sub.payment_config_id,
          method_id: sub.method_id,
          name: sub.name,
          icon: sub.icon,
          enabled: sub.enabled,
          merchant_id: sub.merchant_id,
          callback_url: sub.callback_url,
          is_headquarters_account: sub.is_headquarters_account,
          account_info: sub.account_info,
        })),
    }));

    if (type === 'enabled') {
      // 只返回已启用的支付方式（供收银台使用）
      const enabledMethods = paymentConfigs
        .filter((config) => config.enabled)
        .map((config) => ({
          ...config,
          subMethods: config.subMethods.filter((sub) => sub.enabled),
        }));
      return NextResponse.json({ success: true, data: enabledMethods });
    }

    return NextResponse.json({ success: true, data: paymentConfigs });
  } catch (error) {
    console.error('[支付配置API] 获取失败:', error);
    return NextResponse.json({ success: true, data: defaultPaymentConfigs });
  }
}

// POST - 更新支付配置
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, configId, subMethodId, data } = body;
    const supabase = tryGetSupabaseClient();

    // 数据库不可用时的处理
    if (!supabase) {
      console.log('[支付配置API] 数据库不可用，返回默认配置');
      return NextResponse.json({ success: true, data: defaultPaymentConfigs });
    }

    switch (action) {
      case 'toggleMain':
        // 切换主支付方式的启用状态
        await supabase
          .from('payment_configs')
          .update({ enabled: data?.enabled, updated_at: new Date().toISOString() })
          .eq('id', configId);
        break;

      case 'toggleSub':
        // 切换子支付方式的启用状态
        await supabase
          .from('payment_sub_methods')
          .update({ enabled: data?.enabled, updated_at: new Date().toISOString() })
          .eq('id', subMethodId);
        break;

      case 'updateMain':
        // 更新主支付方式信息
        await supabase
          .from('payment_configs')
          .update({
            ...data,
            updated_at: new Date().toISOString()
          })
          .eq('id', configId);
        break;

      case 'updateSub':
        // 更新子支付方式信息（包括账户配置）
        const updateData: any = {
          updated_at: new Date().toISOString()
        };
        if (data?.name) updateData.name = data.name;
        if (data?.icon) updateData.icon = data.icon;
        if (data?.enabled !== undefined) updateData.enabled = data.enabled;
        if (data?.merchant_id !== undefined) updateData.merchant_id = data.merchant_id;
        if (data?.api_key !== undefined) updateData.api_key = data.api_key;
        if (data?.callback_url !== undefined) updateData.callback_url = data.callback_url;
        if (data?.is_headquarters_account !== undefined) updateData.is_headquarters_account = data.is_headquarters_account;
        if (data?.account_info !== undefined) updateData.account_info = data.account_info;

        await supabase
          .from('payment_sub_methods')
          .update(updateData)
          .eq('id', subMethodId);
        break;

      case 'updateSubAccount':
        // 更新子支付方式的账户配置
        await supabase
          .from('payment_sub_methods')
          .update({
            merchant_id: data?.merchant_id,
            api_key: data?.api_key,
            callback_url: data?.callback_url,
            is_headquarters_account: data?.is_headquarters_account ?? true,
            account_info: data?.account_info,
            updated_at: new Date().toISOString()
          })
          .eq('id', subMethodId);
        break;

      case 'addSub':
        // 添加新的子支付方式
        const configData = await supabase
          .from('payment_configs')
          .select('id')
          .eq('id', configId)
          .single();

        if (configData.data) {
          await supabase
            .from('payment_sub_methods')
            .insert({
              payment_config_id: configId,
              method_id: `custom_${Date.now()}`,
              name: data?.name || '新支付方式',
              icon: data?.icon || '💳',
              enabled: true,
              is_headquarters_account: true
            });
        }
        break;

      case 'deleteSub':
        // 删除子支付方式
        await supabase
          .from('payment_sub_methods')
          .delete()
          .eq('id', subMethodId);
        break;

      case 'updatePriority':
        // 更新支付方式排序
        const { orderedIds } = data as { orderedIds: string[] };
        for (let i = 0; i < orderedIds.length; i++) {
          await supabase
            .from('payment_configs')
            .update({ priority: i + 1, updated_at: new Date().toISOString() })
            .eq('id', orderedIds[i]);
        }
        break;

      default:
        return NextResponse.json({ success: false, error: '未知操作' }, { status: 400 });
    }

    // 重新获取更新后的数据
    const { data: configs } = await supabase
      .from('payment_configs')
      .select('*')
      .order('priority', { ascending: true });

    const { data: subMethods } = await supabase
      .from('payment_sub_methods')
      .select('*');

    const paymentConfigs: PaymentConfig[] = (configs || []).map((config: any) => ({
      id: config.id,
      category: config.category,
      name: config.name,
      icon: config.icon,
      enabled: config.enabled,
      priority: config.priority,
      is_headquarters_account: config.is_headquarters_account,
      account_info: config.account_info,
      subMethods: (subMethods || [])
        .filter((sub: any) => sub.payment_config_id === config.id)
        .map((sub: any) => ({
          id: sub.id,
          payment_config_id: sub.payment_config_id,
          method_id: sub.method_id,
          name: sub.name,
          icon: sub.icon,
          enabled: sub.enabled,
          merchant_id: sub.merchant_id,
          callback_url: sub.callback_url,
          is_headquarters_account: sub.is_headquarters_account,
          account_info: sub.account_info,
        })),
    }));

    return NextResponse.json({ success: true, data: paymentConfigs });
  } catch (error) {
    console.error('[支付配置API] 更新失败:', error);
    return NextResponse.json(
      { success: false, error: '更新失败' },
      { status: 500 }
    );
  }
}
