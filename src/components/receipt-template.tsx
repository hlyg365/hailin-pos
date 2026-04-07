'use client';

import { cn } from '@/lib/utils';

/**
 * 小票打印配置
 */
export interface ReceiptConfig {
  // 店铺信息
  shopName: string;
  shopAddress: string;
  shopPhone: string;
  
  // 客气语
  thanksText: string;
  
  // 打印选项
  showReceiptNumber: boolean;
  showStandardUnit: boolean;
  showNonStandardUnit: boolean;
  showMemberBalance: boolean;
  showMemberPoints: boolean;
  showThanksText: boolean;
  showShopInfo: boolean;
  
  // 打印份数
  printCopies: number;
}

/**
 * 商品明细
 */
export interface ReceiptItem {
  name: string;
  price: number;
  quantity: number | string; // 数字或带单位的字符串，如 "5kg"
  unit?: string;
  subtotal: number;
}

/**
 * 支付信息
 */
export interface ReceiptPayment {
  method: string;
  amount: number;
}

/**
 * 会员信息
 */
export interface ReceiptMember {
  phone: string; // 脱敏后的手机号
  balanceChange?: number;
  currentBalance?: number;
  pointsChange?: number;
  currentPoints?: number;
}

/**
 * 小票数据
 */
export interface ReceiptData {
  orderNo: string;
  orderTime: string;
  printTime: string;
  items: ReceiptItem[];
  totalQuantity: number;
  totalAmount: number;
  payments: ReceiptPayment[];
  change: number;
  roundOff: number;
  member?: ReceiptMember;
  receiptNumber?: number;
}

/**
 * 默认配置
 */
export const defaultReceiptConfig: ReceiptConfig = {
  shopName: '海邻到家便利店',
  shopAddress: '北京市朝阳区社区街1号',
  shopPhone: '400-123-4567',
  thanksText: '多谢惠顾，欢迎下次再来！',
  showReceiptNumber: false,
  showStandardUnit: true,
  showNonStandardUnit: true,
  showMemberBalance: true,
  showMemberPoints: true,
  showThanksText: true,
  showShopInfo: true,
  printCopies: 1,
};

interface ReceiptTemplateProps {
  config: ReceiptConfig;
  data: ReceiptData;
  className?: string;
  preview?: boolean; // 是否为预览模式
}

/**
 * 小票打印模板组件
 */
export function ReceiptTemplate({ config, data, className, preview = false }: ReceiptTemplateProps) {
  const formatTime = (time: string) => {
    return time || new Date().toLocaleString('zh-CN');
  };

  const formatAmount = (amount: number) => {
    return amount.toFixed(2);
  };

  return (
    <div className={cn(
      "bg-white font-mono text-xs leading-relaxed",
      preview ? "p-4 rounded-lg shadow-sm" : "p-2",
      className
    )}>
      {/* 店铺名称 */}
      <div className="text-center font-bold text-sm mb-1">
        {config.shopName}
      </div>
      
      {/* 小票序号 */}
      {config.showReceiptNumber && data.receiptNumber && (
        <div className="text-center text-gray-500 text-[10px] mb-1">
          小票序号：{data.receiptNumber}
        </div>
      )}
      
      {/* 单号和时间 */}
      <div className="text-gray-600 space-y-0.5">
        <div>单号：{data.orderNo}</div>
        <div>下单时间：{formatTime(data.orderTime)}</div>
        <div>打印时间：{formatTime(data.printTime)}</div>
      </div>
      
      {/* 分隔线 */}
      <div className="border-t border-dashed border-gray-300 my-2"></div>
      
      {/* 商品明细表头 */}
      <div className="flex justify-between text-gray-500">
        <span className="w-24 truncate">商品</span>
        <span className="w-12 text-right">单价</span>
        <span className="w-16 text-right">数量</span>
        <span className="w-14 text-right">小计</span>
      </div>
      
      {/* 商品明细列表 */}
      <div className="space-y-0.5">
        {data.items.map((item, index) => (
          <div key={index} className="flex justify-between text-gray-600">
            <span className="w-24 truncate">{item.name}</span>
            <span className="w-12 text-right">{formatAmount(item.price)}</span>
            <span className="w-16 text-right">
              {typeof item.quantity === 'number' 
                ? (config.showStandardUnit && item.unit ? `${item.quantity}${item.unit}` : item.quantity)
                : item.quantity
              }
            </span>
            <span className="w-14 text-right">{formatAmount(item.subtotal)}</span>
          </div>
        ))}
      </div>
      
      {/* 分隔线 */}
      <div className="border-t border-dashed border-gray-300 my-2"></div>
      
      {/* 合计信息 */}
      <div className="space-y-0.5">
        <div className="flex justify-between">
          <span>购买合计</span>
          <span>{data.totalQuantity}</span>
          <span className="font-bold">{formatAmount(data.totalAmount)}</span>
        </div>
        
        {/* 支付明细 */}
        {data.payments.map((payment, index) => (
          <div key={index} className="flex justify-between text-gray-600">
            <span>{payment.method}</span>
            <span></span>
            <span>{formatAmount(payment.amount)}</span>
          </div>
        ))}
        
        {data.change > 0 && (
          <div className="flex justify-between text-gray-600">
            <span>找零</span>
            <span></span>
            <span>{formatAmount(data.change)}</span>
          </div>
        )}
        
        {data.roundOff > 0 && (
          <div className="flex justify-between text-gray-600">
            <span>抹零</span>
            <span></span>
            <span>{formatAmount(data.roundOff)}</span>
          </div>
        )}
      </div>
      
      {/* 会员信息 */}
      {data.member && (
        <>
          <div className="border-t border-dashed border-gray-300 my-2"></div>
          <div className="text-gray-600 space-y-0.5">
            <div>会员手机号：{data.member.phone}</div>
            {config.showMemberBalance && data.member.balanceChange !== undefined && (
              <div>本次消费会员储值余额：{formatAmount(data.member.balanceChange)}</div>
            )}
            {config.showMemberBalance && data.member.currentBalance !== undefined && (
              <div>当前会员储值余额：{formatAmount(data.member.currentBalance)}</div>
            )}
            {config.showMemberPoints && data.member.pointsChange !== undefined && (
              <div>本次消费获得积分：{data.member.pointsChange}</div>
            )}
            {config.showMemberPoints && data.member.currentPoints !== undefined && (
              <div>当前积分账户剩余：{data.member.currentPoints}</div>
            )}
          </div>
        </>
      )}
      
      {/* 底部信息 */}
      {(config.showThanksText || config.showShopInfo) && (
        <>
          <div className="border-t border-dashed border-gray-300 my-2"></div>
          <div className="text-center text-gray-600">
            {config.showThanksText && (
              <div className="mb-1">{config.thanksText}</div>
            )}
            {config.showShopInfo && (
              <>
                <div className="text-[10px]">{config.shopAddress}</div>
                <div className="text-[10px]">电话：{config.shopPhone}</div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * 生成小票打印文本（用于实际打印）
 */
export function generateReceiptText(config: ReceiptConfig, data: ReceiptData): string {
  const lines: string[] = [];
  const divider = '-'.repeat(32);
  const equalDivider = '='.repeat(32);
  
  // 店铺名称
  lines.push(centerText(config.shopName, 32));
  
  // 小票序号
  if (config.showReceiptNumber && data.receiptNumber) {
    lines.push(centerText(`小票序号：${data.receiptNumber}`, 32));
  }
  
  // 单号和时间
  lines.push(`单号：${data.orderNo}`);
  lines.push(`下单时间：${data.orderTime}`);
  lines.push(`打印时间：${data.printTime}`);
  lines.push(equalDivider);
  
  // 商品明细表头
  lines.push(paddedLine('商品', '单价', '数量', '小计'));
  lines.push(divider);
  
  // 商品明细
  data.items.forEach(item => {
    const quantityStr = typeof item.quantity === 'number'
      ? (config.showStandardUnit && item.unit ? `${item.quantity}${item.unit}` : String(item.quantity))
      : item.quantity;
    lines.push(paddedLine(
      item.name.slice(0, 8),
      item.price.toFixed(2),
      quantityStr,
      item.subtotal.toFixed(2)
    ));
  });
  
  lines.push(divider);
  
  // 合计
  lines.push(paddedLine('购买合计', String(data.totalQuantity), '', data.totalAmount.toFixed(2)));
  
  // 支付明细
  data.payments.forEach(payment => {
    lines.push(paddedLine(payment.method, '', '', payment.amount.toFixed(2)));
  });
  
  if (data.change > 0) {
    lines.push(paddedLine('找零', '', '', data.change.toFixed(2)));
  }
  
  if (data.roundOff > 0) {
    lines.push(paddedLine('抹零', '', '', data.roundOff.toFixed(2)));
  }
  
  // 会员信息
  if (data.member) {
    lines.push(divider);
    lines.push(`会员手机号：${data.member.phone}`);
    if (config.showMemberBalance && data.member.balanceChange !== undefined) {
      lines.push(`本次消费会员储值余额：${data.member.balanceChange.toFixed(2)}`);
    }
    if (config.showMemberBalance && data.member.currentBalance !== undefined) {
      lines.push(`当前会员储值余额：${data.member.currentBalance.toFixed(2)}`);
    }
    if (config.showMemberPoints && data.member.pointsChange !== undefined) {
      lines.push(`本次消费获得积分：${data.member.pointsChange}`);
    }
    if (config.showMemberPoints && data.member.currentPoints !== undefined) {
      lines.push(`当前积分账户剩余：${data.member.currentPoints}`);
    }
  }
  
  // 底部信息
  if (config.showThanksText || config.showShopInfo) {
    lines.push(divider);
    if (config.showThanksText) {
      lines.push(centerText(config.thanksText, 32));
    }
    if (config.showShopInfo) {
      lines.push(centerText(config.shopAddress, 32));
      lines.push(centerText(`电话：${config.shopPhone}`, 32));
    }
  }
  
  // 尾部空行
  lines.push('');
  lines.push('');
  lines.push('');
  
  return lines.join('\n');
}

/**
 * 文本居中
 */
function centerText(text: string, width: number): string {
  const padding = Math.max(0, width - text.length);
  const leftPad = Math.floor(padding / 2);
  const rightPad = padding - leftPad;
  return ' '.repeat(leftPad) + text + ' '.repeat(rightPad);
}

/**
 * 生成填充行
 */
function paddedLine(col1: string, col2: string, col3: string, col4: string): string {
  const w1 = 10, w2 = 8, w3 = 8, w4 = 8;
  return [
    col1.padEnd(w1).slice(0, w1),
    col2.padStart(w2).slice(-w2),
    col3.padStart(w3).slice(-w3),
    col4.padStart(w4).slice(-w4),
  ].join('');
}

export default ReceiptTemplate;
