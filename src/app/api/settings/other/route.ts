import { NextRequest, NextResponse } from 'next/server';

// 其他功能设置默认值
const defaultOtherSettings = {
  // 交接班模式
  shiftModeEnabled: false,
  
  // 外卖接单
  takeawayEnabled: true,
  takeawayPlatforms: ['meituan', 'eleme'] as string[],
  
  // 生鲜模式
  freshModeEnabled: true,
  
  // 支付渠道设置
  paymentChannels: {
    wechat: {
      enabled: true,
      name: '微信支付',
      merchantId: '',
    },
    alipay: {
      enabled: true,
      name: '支付宝',
      merchantId: '',
    },
    cash: {
      enabled: true,
      name: '现金支付',
    },
    card: {
      enabled: false,
      name: '银行卡',
    },
  },
  
  // 钱箱设置
  cashDrawer: {
    enabled: true,
    password: '',
    autoOpen: true, // 收款时自动打开
  },
  
  // 会员设置
  memberSettings: {
    autoIdentify: true, // 自动识别会员
    pointsRate: 1, // 积分比例
    defaultDiscount: 0.95, // 默认折扣
  },
  
  // 促销设置
  promotionSettings: {
    autoApply: true, // 自动应用促销
    showSuggestions: true, // 显示促销建议
  },
};

// 内存中的设置存储
let otherSettings = { ...defaultOtherSettings };

// GET - 获取其他功能设置
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: otherSettings,
    });
  } catch (error) {
    console.error('获取其他功能设置失败:', error);
    return NextResponse.json(
      { success: false, error: '获取其他功能设置失败' },
      { status: 500 }
    );
  }
}

// POST - 更新其他功能设置
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 处理特定操作
    if (body.action === 'toggleShiftMode') {
      otherSettings = {
        ...otherSettings,
        shiftModeEnabled: !otherSettings.shiftModeEnabled,
      };
      
      return NextResponse.json({
        success: true,
        message: otherSettings.shiftModeEnabled ? '交接班模式已开启' : '交接班模式已关闭',
        data: otherSettings,
      });
    }
    
    if (body.action === 'toggleTakeaway') {
      otherSettings = {
        ...otherSettings,
        takeawayEnabled: !otherSettings.takeawayEnabled,
      };
      
      return NextResponse.json({
        success: true,
        message: otherSettings.takeawayEnabled ? '外卖接单已开启' : '外卖接单已关闭',
        data: otherSettings,
      });
    }
    
    if (body.action === 'toggleFreshMode') {
      otherSettings = {
        ...otherSettings,
        freshModeEnabled: !otherSettings.freshModeEnabled,
      };
      
      return NextResponse.json({
        success: true,
        message: otherSettings.freshModeEnabled ? '生鲜模式已开启' : '生鲜模式已关闭',
        data: otherSettings,
      });
    }
    
    // 深度合并设置
    const deepMerge = (target: any, source: any) => {
      const result = { ...target };
      for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          result[key] = deepMerge(target[key] || {}, source[key]);
        } else {
          result[key] = source[key];
        }
      }
      return result;
    };
    
    otherSettings = deepMerge(otherSettings, body);

    return NextResponse.json({
      success: true,
      message: '设置已保存',
      data: otherSettings,
    });
  } catch (error) {
    console.error('保存其他功能设置失败:', error);
    return NextResponse.json(
      { success: false, error: '保存其他功能设置失败' },
      { status: 500 }
    );
  }
}

// DELETE - 重置设置
export async function DELETE() {
  try {
    otherSettings = { ...defaultOtherSettings };
    
    return NextResponse.json({
      success: true,
      message: '设置已重置',
      data: otherSettings,
    });
  } catch (error) {
    console.error('重置设置失败:', error);
    return NextResponse.json(
      { success: false, error: '重置设置失败' },
      { status: 500 }
    );
  }
}
