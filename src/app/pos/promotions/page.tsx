'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Package, 
  Percent,
  Clock,
  CheckCircle,
  XCircle,
  Gift,
  Tag,
  Calendar
} from 'lucide-react';

interface Promotion {
  id: string;
  name: string;
  type: 'discount' | 'fullreduce' | 'gift' | 'flash';
  discountValue?: number;
  minAmount?: number;
  reduceAmount?: number;
  giftProductId?: string;
  giftProductName?: string;
  products: string[];
  startDate: number;
  endDate: number;
  status: 'active' | 'pending' | 'expired';
}

export default function PromotionsPage() {
  const router = useRouter();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'pending' | 'expired'>('active');

  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = () => {
    // 模拟促销数据
    const mockPromotions: Promotion[] = [
      {
        id: 'p1',
        name: '会员日85折',
        type: 'discount',
        discountValue: 15,
        products: [],
        startDate: Date.now() - 86400000,
        endDate: Date.now() + 86400000 * 7,
        status: 'active'
      },
      {
        id: 'p2',
        name: '满50减10',
        type: 'fullreduce',
        minAmount: 50,
        reduceAmount: 10,
        products: [],
        startDate: Date.now(),
        endDate: Date.now() + 86400000 * 3,
        status: 'active'
      },
      {
        id: 'p3',
        name: '饮料买二送一',
        type: 'gift',
        giftProductId: 'drink1',
        giftProductName: '可口可乐',
        products: ['drink1', 'drink2'],
        startDate: Date.now() - 86400000 * 2,
        endDate: Date.now() + 86400000 * 5,
        status: 'active'
      },
      {
        id: 'p4',
        name: '限时特惠9.9元',
        type: 'flash',
        discountValue: 9.9,
        products: ['item1'],
        startDate: Date.now() + 86400000,
        endDate: Date.now() + 86400000 * 2,
        status: 'pending'
      }
    ];
    
    localStorage.setItem('promotions', JSON.stringify(mockPromotions));
    setPromotions(mockPromotions);
  };

  const filteredPromotions = promotions.filter(p => {
    if (activeTab === 'active') return p.status === 'active';
    if (activeTab === 'pending') return p.status === 'pending';
    return p.status === 'expired';
  });

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPromotionDesc = (promo: Promotion) => {
    switch (promo.type) {
      case 'discount':
        return `全场${100 - (promo.discountValue || 0)}折`;
      case 'fullreduce':
        return `满${promo.minAmount}减${promo.reduceAmount}`;
      case 'gift':
        return `买指定商品送${promo.giftProductName}`;
      case 'flash':
        return `限时特惠¥${promo.discountValue?.toFixed(2)}`;
      default:
        return '';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'discount': return '折扣';
      case 'fullreduce': return '满减';
      case 'gift': return '买赠';
      case 'flash': return '限时';
      default: return type;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'discount': return Percent;
      case 'fullreduce': return Tag;
      case 'gift': return Gift;
      case 'flash': return Clock;
      default: return Tag;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* 头部 */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/pos')} className="p-2 hover:bg-slate-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-slate-800">促销管理</h1>
          </div>
          <button 
            onClick={() => setShowCreate(true)}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-orange-600"
          >
            <Plus className="w-5 h-5" />
            新建促销
          </button>
        </div>
        
        {/* 标签页 */}
        <div className="flex px-4 border-t border-slate-100">
          {(['active', 'pending', 'expired'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-center font-medium border-b-2 transition-colors ${
                activeTab === tab 
                  ? 'border-orange-500 text-orange-500' 
                  : 'border-transparent text-slate-500'
              }`}
            >
              {tab === 'active' ? '进行中' : tab === 'pending' ? '待开始' : '已结束'}
            </button>
          ))}
        </div>
      </header>

      <main className="p-4">
        {/* 促销列表 */}
        <div className="space-y-4">
          {filteredPromotions.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center text-slate-500">
              <Percent className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">暂无{activeTab === 'active' ? '进行中' : activeTab === 'pending' ? '待开始' : '已结束'}的促销</p>
            </div>
          ) : (
            filteredPromotions.map(promo => {
              const TypeIcon = getTypeIcon(promo.type);
              return (
                <div key={promo.id} className="bg-white rounded-xl overflow-hidden shadow-sm">
                  <div className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        promo.type === 'discount' ? 'bg-red-100' :
                        promo.type === 'fullreduce' ? 'bg-orange-100' :
                        promo.type === 'gift' ? 'bg-green-100' : 'bg-purple-100'
                      }`}>
                        <TypeIcon className={`w-6 h-6 ${
                          promo.type === 'discount' ? 'text-red-500' :
                          promo.type === 'fullreduce' ? 'text-orange-500' :
                          promo.type === 'gift' ? 'text-green-500' : 'text-purple-500'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-800">{promo.name}</h3>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            promo.type === 'discount' ? 'bg-red-100 text-red-600' :
                            promo.type === 'fullreduce' ? 'bg-orange-100 text-orange-600' :
                            promo.type === 'gift' ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-600'
                          }`}>
                            {getTypeLabel(promo.type)}
                          </span>
                        </div>
                        <p className="text-orange-500 font-bold mt-1">{getPromotionDesc(promo)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(promo.startDate)}</span>
                      </div>
                      <span>至</span>
                      <span>{formatDate(promo.endDate)}</span>
                    </div>
                  </div>
                  
                  {/* 状态条 */}
                  <div className={`px-4 py-2 text-sm font-medium text-center ${
                    promo.status === 'active' ? 'bg-green-500 text-white' :
                    promo.status === 'pending' ? 'bg-yellow-500 text-white' : 'bg-slate-300 text-slate-600'
                  }`}>
                    {promo.status === 'active' ? '进行中' : promo.status === 'pending' ? '即将开始' : '已结束'}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 促销统计 */}
        <div className="mt-6 bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4">促销效果</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{promotions.filter(p => p.status === 'active').length}</p>
              <p className="text-sm text-slate-600">进行中</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-orange-600">{promotions.length}</p>
              <p className="text-sm text-slate-600">总促销数</p>
            </div>
          </div>
        </div>
      </main>

      {/* 新建促销弹窗 */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-hidden rounded-t-3xl sm:rounded-2xl">
            <div className="bg-orange-500 text-white px-4 py-3 flex items-center justify-between">
              <h2 className="font-bold text-lg">新建促销</h2>
              <button onClick={() => setShowCreate(false)}><XCircle className="w-6 h-6" /></button>
            </div>
            
            <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">促销名称</label>
                <input type="text" placeholder="例如：会员日85折" className="w-full p-3 border border-slate-200 rounded-xl" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">促销类型</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { type: 'discount', label: '折扣', icon: Percent },
                    { type: 'fullreduce', label: '满减', icon: Tag },
                    { type: 'gift', label: '买赠', icon: Gift },
                    { type: 'flash', label: '限时', icon: Clock },
                  ].map(item => (
                    <button key={item.type} className="p-3 border-2 border-slate-200 rounded-xl flex items-center gap-2 hover:border-orange-500">
                      <item.icon className="w-5 h-5 text-slate-400" />
                      <span className="text-sm">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">开始时间</label>
                <input type="datetime-local" className="w-full p-3 border border-slate-200 rounded-xl" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">结束时间</label>
                <input type="datetime-local" className="w-full p-3 border border-slate-200 rounded-xl" />
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-200">
              <button className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold hover:bg-orange-600">
                创建促销
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
