'use client';

import { TrendingUp, Users, ShoppingCart, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const todayStats = [
  { label: '销售额', value: '¥12,580', change: '+12.5%', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100' },
  { label: '订单数', value: '356', change: '+8.3%', icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-100' },
  { label: '客流', value: '892', change: '+5.2%', icon: Users, color: 'text-purple-600', bg: 'bg-purple-100' },
];

const alerts = [
  { type: 'warning', title: '库存预警', desc: '农夫山泉库存不足20件', time: '10分钟前' },
  { type: 'info', title: '新订单', desc: '收到线上订单1笔，金额¥89.5', time: '15分钟前' },
  { type: 'success', title: '会员注册', desc: '新会员「李女士」注册成功', time: '30分钟前' },
];

const lowStock = [
  { name: '农夫山泉550ml', stock: 18, minStock: 50 },
  { name: '可口可乐330ml', stock: 25, minStock: 50 },
  { name: '双汇火腿肠', stock: 12, minStock: 30 },
  { name: '绿箭口香糖', stock: 8, minStock: 20 },
];

const quickActions = [
  { title: '日结', desc: '完成今日对账', icon: '📊' },
  { title: '补货', desc: '提交补货申请', icon: '🚚' },
  { title: '盘点', desc: '进行库存盘点', icon: '📋' },
];

export default function DashboardContent() {
  return (
    <div className="space-y-4">
      {/* 今日统计 */}
      <div className="grid grid-cols-3 gap-3">
        {todayStats.map((stat) => (
          <div key={stat.label} className="card text-center">
            <div className={`w-10 h-10 ${stat.bg} rounded-full flex items-center justify-center mx-auto mb-2`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p className="text-lg font-bold mt-1">{stat.value}</p>
            <p className="text-xs text-green-600 mt-1">{stat.change}</p>
          </div>
        ))}
      </div>

      {/* 提醒 */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4" />
            待处理提醒
          </h3>
          <span className="text-xs text-gray-400">更多</span>
        </div>
        <div className="space-y-3">
          {alerts.map((alert, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                alert.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                alert.type === 'success' ? 'bg-green-100 text-green-600' :
                'bg-blue-100 text-blue-600'
              }`}>
                {alert.type === 'warning' ? '⚠️' : alert.type === 'success' ? '✓' : '📱'}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{alert.title}</p>
                <p className="text-xs text-gray-500 mt-1">{alert.desc}</p>
              </div>
              <span className="text-xs text-gray-400">{alert.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 库存预警 */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            库存预警
          </h3>
          <Link href="/inventory" className="text-xs text-blue-600 flex items-center gap-1">
            查看全部 <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="space-y-2">
          {lowStock.map((item) => (
            <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium">{item.name}</p>
                <p className="text-xs text-gray-500">最低库存 {item.minStock} 件</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-red-500">{item.stock} 件</p>
                <Link href="/inventory" className="text-xs text-blue-600">
                  立即补货 →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 快捷操作 */}
      <div className="card">
        <h3 className="font-semibold mb-3">快捷操作</h3>
        <div className="grid grid-cols-3 gap-3">
          {quickActions.map((action) => (
            <div key={action.title} className="flex flex-col items-center p-4 bg-gray-50 rounded-xl">
              <span className="text-2xl mb-2">{action.icon}</span>
              <p className="text-sm font-medium">{action.title}</p>
              <p className="text-xs text-gray-500 mt-1">{action.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 营业时间 */}
      <div className="card flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">当前状态</p>
          <p className="text-lg font-bold text-green-600 mt-1">营业中</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">营业时间</p>
          <p className="text-sm font-medium mt-1">08:00 - 23:00</p>
        </div>
        <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm">
          修改
        </button>
      </div>
    </div>
  );
}
