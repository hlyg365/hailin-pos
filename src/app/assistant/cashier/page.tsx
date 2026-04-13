'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Delete,
  CreditCard,
  QrCode,
  User,
  Banknote,
  Package,
  Search,
  X,
  CheckCircle,
  Wifi,
  WifiOff,
  History,
  ScanLine,
  Percent,
  Gift,
  ArrowLeft,
  Clock,
  TrendingUp,
  Tag,
  RefreshCw,
  Keyboard,
  Sparkles,
  Trash2
} from 'lucide-react';

interface CartItem {
  id: string;
  productId: string;
  barcode: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  pinyin?: string;
}

interface Product {
  id: string;
  barcode: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  unit: string;
  pinyin?: string;
  pinyinInitial?: string;
}

interface PendingOrder {
  id: string;
  items: CartItem[];
  total: number;
  createdAt: number;
  note?: string;
}

interface Member {
  name: string;
  phone: string;
  level: string;
  points: number;
  discount: number;
}

// 拼音首字母转换映射
const pinyinMap: Record<string, string> = {
  'a': 'a', 'ā': 'a', 'á': 'a', 'ǎ': 'a', 'à': 'a',
  'b': 'b', 'c': 'c', 'd': 'd', 'e': 'e', 'ē': 'e', 'é': 'e', 'ě': 'e', 'è': 'e',
  'f': 'f', 'g': 'g', 'h': 'h', 'i': 'i', 'ī': 'i', 'í': 'i', 'ǐ': 'i', 'ì': 'i',
  'j': 'j', 'k': 'k', 'l': 'l', 'm': 'm', 'n': 'n', 'o': 'o', 'ō': 'o', 'ó': 'o', 'ǒ': 'o', 'ò': 'o',
  'p': 'p', 'q': 'q', 'r': 'r', 's': 's', 't': 't', 'u': 'u', 'ū': 'u', 'ú': 'u', 'ǔ': 'u', 'ù': 'u',
  'v': 'v', 'w': 'w', 'x': 'x', 'y': 'y', 'z': 'z'
};

// 简单的中文转拼音首字母
function getPinyinInitial(str: string): string {
  if (!str) return '';
  let result = '';
  for (const char of str) {
    const code = char.charCodeAt(0);
    // 汉字范围：4E00-9FFF
    if (code >= 0x4E00 && code <= 0x9FFF) {
      // 简化处理：使用拼音映射表或其他方法
      // 这里使用一个简化的映射
      const pinyin = chineseToPinyin(char);
      result += pinyin ? pinyin[0]?.toLowerCase() || '' : '';
    } else {
      // 非汉字字符保留
      result += char.toLowerCase();
    }
  }
  return result;
}

// 汉字转拼音（简化版）
const chinesePinyinData: Record<string, string> = {
  '农': 'nong', '夫': 'fu', '山': 'shan', '泉': 'quan',
  '可': 'ke', '口': 'kou', '乐': 'le', '统': 'tong', '一': 'yi', '致': 'zhi', '冰': 'bing', '红': 'hong', '茶': 'cha',
  '康': 'kang', '师': 'shi', '傅': 'fu', '娃': 'wa', '哈': 'ha', '纯': 'chun', '净': 'jing', '水': 'shui',
  '蒙': 'meng', '牛': 'niu', '奶': 'nai', '伊': 'yi', '利': 'li', '酸': 'suan', '汤': 'tang',
  '奥': 'ao', '利': 'li', '奥': 'ao', '饼': 'bing', '干': 'gan', '夹': 'jia', '心': 'xin',
  '旺': 'wang', '雪': 'xue', '德': 'de', '芙': 'fu', '巧': 'qiao', '克': 'ke', '力': 'li', '巧': 'qiao',
  '双': 'shuang', '汇': 'hui', '王': 'wang', '中': 'zhong', '火': 'huo', '腿': 'tui', '肠': 'chang',
  '雨': 'yu', '润': 'run', '清': 'qing', '风': 'feng', '抽': 'chou', '纸': 'zhi', '层': 'ceng',
  '雕': 'diao', '牌': 'pai', '洗': 'xi', '衣': 'yi', '皂': 'zao',
  '红': 'hong', '烧': 'shao', '牛': 'niu', '肉': 'rou', '面': 'mian', '老': 'lao', '坛': 'tan', '酸': 'suan', '菜': 'cai',
  '统': 'tong', '牌': 'pai'
};

function chineseToPinyin(char: string): string {
  return chinesePinyinData[char] || '';
}

// 默认商品数据（带拼音）
const defaultProducts: Product[] = [
  { id: '1', barcode: '6901234567890', name: '农夫山泉 550ml', price: 2.00, stock: 100, category: '饮料', unit: '瓶', pinyin: 'nongfushanquan', pinyinInitial: 'nfsq' },
  { id: '2', barcode: '6901234567891', name: '可口可乐 330ml', price: 3.00, stock: 80, category: '饮料', unit: '罐', pinyin: 'kekoukele', pinyinInitial: 'kkkl' },
  { id: '3', barcode: '6901234567892', name: '统一冰红茶', price: 3.00, stock: 70, category: '饮料', unit: '瓶', pinyin: 'tongyibinghongcha', pinyinInitial: 'tybhc' },
  { id: '4', barcode: '6901234567893', name: '康师傅冰红茶', price: 3.50, stock: 55, category: '饮料', unit: '瓶', pinyin: 'kangshifubinghongcha', pinyinInitial: 'ksfbhc' },
  { id: '5', barcode: '6901234567894', name: '娃哈哈纯净水', price: 1.50, stock: 120, category: '饮料', unit: '瓶', pinyin: 'wahahachunjingshui', pinyinInitial: 'whhcjs' },
  { id: '6', barcode: '6901234567895', name: '蒙牛纯牛奶 250ml', price: 3.50, stock: 60, category: '乳品', unit: '盒', pinyin: 'mengniuchunniunai', pinyinInitial: 'mncnn' },
  { id: '7', barcode: '6901234567896', name: '伊利酸奶', price: 4.00, stock: 35, category: '乳品', unit: '杯', pinyin: 'yilisuannai', pinyinInitial: 'ylsn' },
  { id: '8', barcode: '6901234567897', name: '康师傅红烧牛肉面', price: 4.50, stock: 50, category: '方便食品', unit: '袋', pinyin: 'kangshifuhongshuoniuroumain', pinyinInitial: 'ksfhsnrm' },
  { id: '9', barcode: '6901234567898', name: '统一老坛酸菜面', price: 4.00, stock: 40, category: '方便食品', unit: '袋', pinyin: 'tongyilaotansuancaimian', pinyinInitial: 'tyltscm' },
  { id: '10', barcode: '6901234567899', name: '奥利奥夹心饼干', price: 8.50, stock: 30, category: '零食', unit: '盒', pinyin: 'aoliaojiaxinbinggan', pinyinInitial: 'aljxbg' },
  { id: '11', barcode: '6901234567900', name: '旺旺雪饼', price: 5.00, stock: 45, category: '零食', unit: '袋', pinyin: 'wangwangxuebing', pinyinInitial: 'wwxb' },
  { id: '12', barcode: '6901234567901', name: '德芙巧克力 52g', price: 12.00, stock: 25, category: '零食', unit: '块', pinyin: 'defuqiakelili', pinyinInitial: 'dfqkl' },
  { id: '13', barcode: '6901234567902', name: '双汇王中王火腿肠', price: 6.00, stock: 40, category: '肉类', unit: '根', pinyin: 'shuanghuiwangzhongwanghuotuichang', pinyinInitial: 'shwzwhyhtc' },
  { id: '14', barcode: '6901234567903', name: '雨润火腿肠', price: 5.00, stock: 35, category: '肉类', unit: '根', pinyin: 'yurunhuotuichang', pinyinInitial: 'yrhtc' },
  { id: '15', barcode: '6901234567904', name: '清风抽纸 3层', price: 5.00, stock: 50, category: '日用品', unit: '包', pinyin: 'qingfengchouzhi', pinyinInitial: 'qfcz' },
  { id: '16', barcode: '6901234567905', name: '雕牌洗衣皂', price: 4.50, stock: 40, category: '日用品', unit: '块', pinyin: 'diaopaixiyizao', pinyinInitial: 'dpxyz' },
  { id: '17', barcode: '6901234567906', name: '农夫山泉 1.5L', price: 3.00, stock: 60, category: '饮料', unit: '瓶', pinyin: 'nongfushanquan', pinyinInitial: 'nfsq' },
  { id: '18', barcode: '6901234567907', name: '百岁山矿泉水', price: 3.50, stock: 40, category: '饮料', unit: '瓶', pinyin: 'baisuishanquan', pinyinInitial: 'bssq' },
  { id: '19', barcode: '6901234567908', name: '脉动维生素饮料', price: 4.00, stock: 35, category: '饮料', unit: '瓶', pinyin: 'maidongweishengsu', pinyinInitial: 'mdwss' },
  { id: '20', barcode: '6901234567909', name: '王老吉凉茶', price: 4.50, stock: 30, category: '饮料', unit: '罐', pinyin: 'wanglaojiliangcha', pinyinInitial: 'wljlc' },
];

const categories = ['全部', '饮料', '乳品', '方便食品', '零食', '肉类', '日用品'];

export default function MobileCashierPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>(defaultProducts);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [isOnline, setIsOnline] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [showMember, setShowMember] = useState(false);
  const [showPending, setShowPending] = useState(false);
  const [showBarcode, setShowBarcode] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [member, setMember] = useState<Member | null>(null);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [paidAmount, setPaidAmount] = useState(0);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [showDiscount, setShowDiscount] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showQuickAmount, setShowQuickAmount] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 加载挂单数据和自定义商品
  useEffect(() => {
    const saved = localStorage.getItem('assistant_pending_orders');
    if (saved) setPendingOrders(JSON.parse(saved));
    
    const savedProducts = localStorage.getItem('pos_products');
    if (savedProducts) {
      try {
        const parsed = JSON.parse(savedProducts);
        // 为自定义商品添加拼音
        const productsWithPinyin = parsed.map((p: Product) => ({
          ...p,
          pinyin: getPinyinFromName(p.name),
          pinyinInitial: getPinyinInitial(p.name)
        }));
        setProducts([...defaultProducts, ...productsWithPinyin]);
      } catch {}
    }
  }, []);

  // 获取名称的拼音
  function getPinyinFromName(name: string): string {
    let pinyin = '';
    for (const char of name) {
      pinyin += chineseToPinyin(char);
    }
    return pinyin;
  }

  // 网络状态检测
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 计算金额
  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const discount = member ? subtotal * member.discount : 0;
  const couponDiscount = 0;
  const finalTotal = Math.max(0, subtotal - discount - couponDiscount);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // 模糊搜索商品
  const filteredProducts = useMemo(() => {
    let filtered = products;
    
    // 分类过滤
    if (selectedCategory !== '全部') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    
    // 搜索过滤
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase().trim();
      filtered = filtered.filter(p => {
        const nameMatch = p.name.toLowerCase().includes(keyword);
        const barcodeMatch = p.barcode.includes(keyword);
        const pinyinMatch = p.pinyin?.toLowerCase().includes(keyword);
        const pinyinInitialMatch = p.pinyinInitial?.toLowerCase().includes(keyword);
        // 支持拼音首字母模糊匹配（如输入"nfs"匹配"农夫山泉"）
        const initialMatch = p.pinyinInitial?.toLowerCase().split('').join('').includes(keyword);
        return nameMatch || barcodeMatch || pinyinMatch || pinyinInitialMatch || initialMatch;
      });
    }
    
    return filtered;
  }, [products, selectedCategory, searchKeyword]);

  // 添加商品到购物车
  const addToCart = useCallback((product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.price } 
            : item
        );
      }
      return [...prev, { 
        id: product.id, 
        productId: product.id, 
        barcode: product.barcode, 
        name: product.name, 
        price: product.price, 
        quantity: 1, 
        subtotal: product.price,
        pinyin: product.pinyin
      }];
    });
  }, []);

  // 快速添加到购物车（指定数量）
  const quickAddToCart = useCallback((product: Product, quantity: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id 
            ? { ...item, quantity: item.quantity + quantity, subtotal: (item.quantity + quantity) * item.price } 
            : item
        );
      }
      return [...prev, { 
        id: product.id, 
        productId: product.id, 
        barcode: product.barcode, 
        name: product.name, 
        price: product.price, 
        quantity: quantity, 
        subtotal: quantity * product.price,
        pinyin: product.pinyin
      }];
    });
    setShowQuickAmount(null);
  }, []);

  // 修改数量
  const updateQuantity = useCallback((id: string, delta: number) => {
    setCart(prev =>
      prev.map(item => {
        if (item.id === id) {
          const newQty = item.quantity + delta;
          return newQty > 0 
            ? { ...item, quantity: newQty, subtotal: newQty * item.price } 
            : item;
        }
        return item;
      }).filter(item => item.quantity > 0)
    );
  }, []);

  // 设置商品数量
  const setQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(item => item.id !== id));
    } else {
      setCart(prev =>
        prev.map(item =>
          item.id === id 
            ? { ...item, quantity: quantity, subtotal: quantity * item.price } 
            : item
        )
      );
    }
  }, []);

  // 删除商品
  const removeFromCart = useCallback((id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  }, []);

  // 清空购物车
  const clearCart = useCallback(() => {
    setCart([]);
    setMember(null);
  }, []);

  // 挂单
  const suspendOrder = useCallback(() => {
    if (cart.length === 0) return;
    const order: PendingOrder = {
      id: 'PO_' + Date.now(),
      items: [...cart],
      total: finalTotal,
      createdAt: Date.now(),
    };
    const updated = [order, ...pendingOrders].slice(0, 10);
    setPendingOrders(updated);
    localStorage.setItem('assistant_pending_orders', JSON.stringify(updated));
    clearCart();
    alert('已挂单');
  }, [cart, finalTotal, pendingOrders, clearCart]);

  // 取单
  const resumeOrder = useCallback((order: PendingOrder) => {
    setCart(order.items);
    const updated = pendingOrders.filter(o => o.id !== order.id);
    setPendingOrders(updated);
    localStorage.setItem('assistant_pending_orders', JSON.stringify(updated));
    setShowPending(false);
    setShowCart(false);
  }, [pendingOrders]);

  // 完成支付
  const completePayment = useCallback((method: string, amount?: number) => {
    let paymentAmount = finalTotal;
    if (method === 'cash' && amount) {
      paymentAmount = amount;
    }
    
    const orderNo = 'M' + Date.now().toString().slice(-8);
    setOrderNumber(orderNo);
    setPaidAmount(paymentAmount);
    setOrderSuccess(true);
    
    // 保存订单记录
    const orderRecord = {
      id: orderNo,
      items: cart,
      subtotal,
      discount,
      finalTotal,
      paymentMethod: method,
      paidAmount: paymentAmount,
      change: paymentAmount - finalTotal,
      member: member,
      createdAt: Date.now(),
      syncStatus: isOnline ? 'synced' : 'pending',
    };
    const savedOrders = JSON.parse(localStorage.getItem('assistant_orders') || '[]');
    savedOrders.unshift(orderRecord);
    localStorage.setItem('assistant_orders', JSON.stringify(savedOrders.slice(0, 100)));
    
    setTimeout(() => {
      setOrderSuccess(false);
      clearCart();
      setShowPayment(false);
    }, 3000);
  }, [finalTotal, cart, subtotal, discount, member, isOnline, clearCart]);

  // 扫码输入处理
  const handleBarcodeScan = useCallback((code: string) => {
    const product = products.find(p => p.barcode === code);
    if (product) {
      addToCart(product);
      setShowCart(true);
    } else {
      alert('未找到商品: ' + code);
    }
    setBarcodeInput('');
    setShowBarcode(false);
  }, [products, addToCart]);

  // 会员折扣显示
  const getMemberDiscountText = () => {
    if (!member) return '';
    switch (member.level) {
      case 'diamond': return '钻石会员 9折';
      case 'gold': return '金卡会员 95折';
      case 'silver': return '银卡会员 98折';
      default: return '普通会员 无折扣';
    }
  };

  // 支付成功页面
  if (orderSuccess) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-green-500 to-green-600 flex flex-col items-center justify-center p-6 z-50">
        <div className="bg-white rounded-3xl p-8 text-center shadow-2xl max-w-sm w-full">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">收款成功</h2>
          <p className="text-4xl font-bold text-green-500 mb-4">¥{finalTotal.toFixed(2)}</p>
          <div className="text-sm text-slate-500 space-y-1">
            <p>订单号：{orderNumber}</p>
            {paidAmount > finalTotal && (
              <p className="text-orange-500">找零：¥{(paidAmount - finalTotal).toFixed(2)}</p>
            )}
            {member && (
              <p className="text-blue-500">{member.name} - {getMemberDiscountText()}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* 顶部状态栏 */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-3">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push('/assistant')} className="p-2 -ml-2">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-lg flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            移动收银
          </h1>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="w-5 h-5 text-green-300" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-300" />
            )}
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 搜索栏 */}
        <div className="p-3 bg-white shadow-sm">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                ref={searchInputRef}
                type="text"
                placeholder="商品名称/条码/拼音首字母..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
              {searchKeyword && (
                <button 
                  onClick={() => setSearchKeyword('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              )}
            </div>
            <button 
              onClick={() => setShowBarcode(true)}
              className="p-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
            >
              <ScanLine className="w-5 h-5" />
            </button>
          </div>
          
          {/* 分类标签 */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                  selectedCategory === cat 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          
          {/* 搜索提示 */}
          {searchKeyword && (
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              支持：名称 / 条码 / 拼音首字母（如"nfs"搜农夫山泉）
            </p>
          )}
        </div>

        {/* 商品列表 */}
        <div className="flex-1 overflow-y-auto p-3">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>未找到相关商品</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {filteredProducts.map(product => (
                <div key={product.id} className="relative">
                  <button
                    onClick={() => addToCart(product)}
                    onLongPress={() => setShowQuickAmount(product.id)}
                    className="w-full bg-white rounded-xl p-2 text-left shadow-sm active:bg-slate-50 transition-colors"
                  >
                    <div className="w-full h-14 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg mb-2 flex items-center justify-center">
                      <Package className="w-7 h-7 text-slate-400" />
                    </div>
                    <p className="text-xs font-medium text-slate-800 truncate leading-tight">
                      {product.name}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-orange-500 font-bold text-sm">¥{product.price.toFixed(2)}</p>
                      {product.stock < 20 && (
                        <span className="text-[10px] text-red-500">{product.stock}件</span>
                      )}
                    </div>
                  </button>
                  
                  {/* 快捷数量弹窗 */}
                  {showQuickAmount === product.id && (
                    <div 
                      className="absolute top-full left-0 right-0 bg-white rounded-xl shadow-lg z-20 p-2 mt-1"
                      onClick={() => setShowQuickAmount(null)}
                    >
                      <div className="grid grid-cols-4 gap-1">
                        {[1, 2, 3, 5, 10].map(num => (
                          <button
                            key={num}
                            onClick={(e) => {
                              e.stopPropagation();
                              quickAddToCart(product, num);
                            }}
                            className="py-2 bg-orange-100 text-orange-600 rounded-lg text-sm font-medium hover:bg-orange-200"
                          >
                            +{num}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 底部购物车栏 */}
      <div className="bg-white border-t shadow-lg safe-area-bottom">
        {/* 会员信息 */}
        {member && (
          <div className="px-4 py-2 bg-gradient-to-r from-blue-50 to-blue-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {member.name.charAt(0)}
              </div>
              <div>
                <span className="text-sm font-medium text-blue-700">{member.name}</span>
                <span className="text-xs text-blue-500 ml-1">{getMemberDiscountText()}</span>
              </div>
            </div>
            <button onClick={() => setMember(null)} className="p-1">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        )}

        {/* 金额汇总 */}
        <div className="px-4 py-2 border-b flex items-center justify-between">
          <button 
            onClick={() => setShowCart(true)}
            className="flex items-center gap-2"
          >
            <div className="relative">
              <ShoppingCart className="w-6 h-6 text-orange-500" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </div>
            <span className="text-sm text-slate-500">购物车</span>
          </button>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-slate-400">合计</p>
              <p className="text-xl font-bold text-orange-500">¥{finalTotal.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="px-4 py-3 flex gap-2">
          <button 
            onClick={() => setShowPending(true)}
            className="py-3 px-4 bg-slate-100 text-slate-700 rounded-xl font-medium flex items-center justify-center gap-1"
          >
            <History className="w-4 h-4" />
            <span className="text-sm">挂单</span>
          </button>
          <button 
            onClick={() => setShowMember(true)}
            className="py-3 px-4 bg-blue-100 text-blue-700 rounded-xl font-medium flex items-center justify-center gap-1"
          >
            <User className="w-4 h-4" />
            <span className="text-sm">会员</span>
          </button>
          <button 
            onClick={() => cart.length > 0 && setShowPayment(true)}
            disabled={cart.length === 0}
            className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 ${
              cart.length > 0 
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg' 
                : 'bg-slate-200 text-slate-400'
            }`}
          >
            <QrCode className="w-5 h-5" />
            结算 ¥{finalTotal.toFixed(2)}
          </button>
        </div>
      </div>

      {/* 购物车详情弹窗 */}
      {showCart && (
        <div className="fixed inset-0 bg-black/50 z-50 flex">
          <div className="flex-1" onClick={() => setShowCart(false)} />
          <div className="w-full max-w-md bg-white flex flex-col max-h-[80vh]">
            <div className="px-4 py-3 border-b flex items-center justify-between sticky top-0 bg-white">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-orange-500" />
                购物车 ({totalItems}件)
              </h2>
              <button onClick={() => setShowCart(false)}>
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <ShoppingCart className="w-16 h-16 mx-auto mb-2 opacity-30" />
                  <p>购物车是空的</p>
                  <p className="text-sm">点击商品添加</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map(item => (
                    <div key={item.id} className="bg-slate-50 rounded-xl p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-slate-800">{item.name}</p>
                          <p className="text-sm text-slate-500">¥{item.price.toFixed(2)} × {item.quantity}</p>
                        </div>
                        <p className="font-bold text-orange-500">¥{item.subtotal.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-8 h-8 bg-white rounded-full flex items-center justify-center border shadow-sm"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => setQuantity(item.id, parseInt(e.target.value) || 0)}
                            className="w-12 text-center border rounded-lg py-1"
                          />
                          <button 
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center shadow-sm"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="p-2 text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {cart.length > 0 && (
              <div className="p-4 border-t space-y-2 bg-white">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">商品金额</span>
                  <span>¥{subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-orange-500">
                    <span>会员折扣</span>
                    <span>-¥{discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg">
                  <span>应付金额</span>
                  <span className="text-orange-500">¥{finalTotal.toFixed(2)}</span>
                </div>
                <button 
                  onClick={() => { setShowCart(false); setShowPayment(true); }}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-bold"
                >
                  去结算
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 支付弹窗 */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl max-h-[85vh] overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center justify-between sticky top-0 bg-white">
              <h2 className="font-bold text-lg">选择支付方式</h2>
              <button onClick={() => setShowPayment(false)}>
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            
            <div className="p-4 space-y-4 overflow-y-auto max-h-[70vh]">
              {/* 金额显示 */}
              <div className="text-center py-6 bg-gradient-to-r from-orange-50 to-orange-100 rounded-2xl">
                <p className="text-slate-500 text-sm">应收金额</p>
                <p className="text-5xl font-bold text-orange-500">¥{finalTotal.toFixed(2)}</p>
                {member && (
                  <p className="text-sm text-blue-500 mt-1">
                    {member.name} - {getMemberDiscountText()}
                  </p>
                )}
              </div>

              {/* 快速收款 */}
              <div>
                <p className="text-sm text-slate-500 mb-2">快速收款</p>
                <div className="grid grid-cols-3 gap-3">
                  <button 
                    onClick={() => completePayment('wechat')}
                    className="flex flex-col items-center p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
                  >
                    <div className="w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center mb-2 shadow-lg">
                      <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89a5.718 5.718 0 0 0-.406-.032z"/>
                      </svg>
                    </div>
                    <span className="font-medium text-green-700">微信</span>
                  </button>
                  
                  <button 
                    onClick={() => completePayment('alipay')}
                    className="flex flex-col items-center p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
                  >
                    <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center mb-2 shadow-lg">
                      <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M21.046 8.773a3.72 3.72 0 0 0-2.39-1.21c-.44-.06-.89-.06-1.33-.01-2.61.03-4.83 1.2-6.38 2.93-.21.23-.4.48-.57.73-.21.31-.39.65-.56 1-.19.4-.34.83-.46 1.27-.07.27-.12.54-.16.81-.03.2-.04.4-.04.6 0 .2.01.4.04.6.04.27.09.54.16.81.12.44.27.87.46 1.27.17.35.35.69.56 1 .17.25.36.5.57.73 1.55 1.73 3.77 2.9 6.38 2.93.44.05.89.05 1.33-.01.84-.11 1.65-.38 2.39-.8.28-.17.54-.35.78-.56.19-.17.36-.35.52-.54.13-.15.24-.31.34-.48.08-.13.14-.27.2-.41.04-.11.07-.22.1-.33.02-.08.03-.17.04-.25.01-.05.01-.11.01-.16 0-.16-.02-.32-.04-.47-.02-.12-.05-.23-.09-.34-.03-.09-.07-.18-.12-.26-.04-.08-.09-.15-.14-.22-.05-.06-.1-.12-.16-.18-.06-.06-.12-.11-.19-.16-.07-.05-.14-.1-.22-.14-.08-.04-.16-.08-.25-.11-.09-.03-.18-.06-.28-.08-.1-.02-.2-.04-.31-.05h-.05c-.09 0-.17-.01-.26-.01H8.074c-.11.01-.21.03-.32.05-.1.02-.2.05-.29.08-.09.03-.18.07-.26.11-.08.04-.16.09-.23.14-.07.05-.14.1-.2.16-.06.06-.11.12-.16.18-.05.07-.1.14-.14.22-.05.08-.09.17-.12.26-.04.11-.07.22-.09.34-.02.15-.04.31-.04.47 0 .05.01.11.01.16.01.08.02.17.04.25.03.11.06.22.1.33.06.14.13.28.2.41.1.17.21.33.34.48.16.19.33.37.52.54.24.21.5.39.78.56.74.42 1.55.69 2.39.8.44.05.89.05 1.33.01 2.61-.03 4.83-1.2 6.38-2.93.21-.23.4-.48.57-.73.21-.31.39-.65.56-1 .19-.4.34-.83.46-1.27.07-.27.12-.54.16-.81.03-.2.04-.4.04-.6 0-.2-.01-.4-.04-.6-.04-.27-.09-.54-.16-.81-.12-.44-.27-.87-.46-1.27-.17-.35-.35-.69-.56-1-.17-.25-.36-.5-.57-.73-1.55-1.73-3.77-2.9-6.38-2.93-.44-.05-.89-.05-1.33.01-.84.11-1.65.38-2.39.8-.28.17-.54.35-.78.56-.19.17-.36.35-.52.54-.13.15-.24.31-.34.48-.08.13-.14.27-.2.41-.04.11-.07.22-.1.33-.02.08-.03.17-.04.25-.01.05-.01.11-.01.16 0 .16.02.32.04.47.02.12.05.23.09.34.03.09.07.18.12.26.04.08.09.15.14.22.05.06.1.12.16.18.06.06.12.11.19.16.07.05.14.1.22.14.08.04.16.08.25.11.09.03.18.06.28.08.1.02.2.04.31.05h.05c.09 0 .17.01.26.01h6.072c.11-.01.21-.03.32-.05.1-.02.2-.05.29-.08.09-.03.18-.07.26-.11.08-.04.16-.09.23-.14.07-.05.14-.1.2-.16.06-.06.11-.12.16-.18.05-.07.1-.14.14-.22.05-.08.09-.17.12-.26.04-.11.07-.22.09-.34.02-.15.04-.31.04-.47 0-.05-.01-.11-.01-.16-.01-.08-.02-.17-.04-.25-.03-.11-.06-.22-.1-.33-.06-.14-.13-.28-.2-.41-.1-.17-.21-.33-.34-.48-.16-.19-.33-.37-.52-.54-.24-.21-.5-.39-.78-.56-.74-.42-1.55-.69-2.39-.8z"/>
                      </svg>
                    </div>
                    <span className="font-medium text-blue-700">支付宝</span>
                  </button>
                  
                  <button 
                    onClick={() => completePayment('cash')}
                    className="flex flex-col items-center p-4 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors"
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-500 rounded-2xl flex items-center justify-center mb-2 shadow-lg">
                      <Banknote className="w-8 h-8 text-white" />
                    </div>
                    <span className="font-medium text-orange-700">现金</span>
                  </button>
                </div>
              </div>

              {/* 其他支付方式 */}
              <div>
                <p className="text-sm text-slate-500 mb-2">其他方式</p>
                <div className="grid grid-cols-3 gap-3">
                  <button 
                    onClick={() => completePayment('card')}
                    className="flex flex-col items-center p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <div className="w-12 h-12 bg-slate-500 rounded-xl flex items-center justify-center mb-2">
                      <CreditCard className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-sm text-slate-600">银行卡</span>
                  </button>

                  <button 
                    onClick={() => setShowDiscount(true)}
                    className="flex flex-col items-center p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <div className="w-12 h-12 bg-pink-500 rounded-xl flex items-center justify-center mb-2">
                      <Percent className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-sm text-slate-600">优惠券</span>
                  </button>

                  <button 
                    onClick={() => {
                      if (confirm('确定使用组合支付？')) {
                        completePayment('combo', finalTotal);
                      }
                    }}
                    className="flex flex-col items-center p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-2">
                      <QrCode className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-sm text-slate-600">组合支付</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 会员弹窗 */}
      {showMember && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl max-h-[70vh] overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center justify-between sticky top-0 bg-white">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-blue-500" />
                会员识别
              </h2>
              <button onClick={() => setShowMember(false)}>
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            
            <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="tel" 
                  placeholder="输入手机号查询"
                  className="w-full pl-10 p-3 border border-slate-200 rounded-xl"
                />
              </div>

              {/* 快速选择模拟会员 */}
              <div>
                <p className="text-xs text-slate-400 mb-2">最近使用</p>
                <div className="space-y-2">
                  {[
                    { name: '张伟', phone: '138****8001', level: 'diamond', discount: 0.1 },
                    { name: '李娜', phone: '139****8002', level: 'gold', discount: 0.05 },
                    { name: '王芳', phone: '137****8003', level: 'silver', discount: 0.02 },
                    { name: '赵雷', phone: '136****8004', level: 'silver', discount: 0.02 },
                  ].map((m, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setMember({ ...m, points: 1000 });
                        setShowMember(false);
                      }}
                      className="w-full p-3 bg-slate-50 rounded-xl flex items-center justify-between hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                          m.level === 'diamond' ? 'bg-gradient-to-br from-purple-400 to-purple-600' :
                          m.level === 'gold' ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                          'bg-gradient-to-br from-slate-400 to-slate-500'
                        }`}>
                          {m.name.charAt(0)}
                        </div>
                        <div className="text-left">
                          <p className="font-medium">{m.name}</p>
                          <p className="text-sm text-slate-500">{m.phone}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          m.level === 'diamond' ? 'bg-purple-100 text-purple-600' :
                          m.level === 'gold' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {m.level === 'diamond' ? '钻石' : m.level === 'gold' ? '金卡' : '银卡'}
                        </span>
                        <p className="text-xs text-slate-400 mt-1">{1000}积分</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {member && (
                <button
                  onClick={() => { setMember(null); setShowMember(false); }}
                  className="w-full py-3 border border-red-200 text-red-500 rounded-xl"
                >
                  清除会员
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 挂单列表弹窗 */}
      {showPending && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl max-h-[70vh] overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center justify-between sticky top-0 bg-white">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <History className="w-5 h-5 text-slate-500" />
                挂单列表
              </h2>
              <button onClick={() => setShowPending(false)}>
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[50vh]">
              {pendingOrders.length === 0 ? (
                <div className="text-center text-slate-400 py-12">
                  <History className="w-16 h-16 mx-auto mb-2 opacity-30" />
                  <p>暂无挂单</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingOrders.map(order => (
                    <div 
                      key={order.id}
                      className="p-4 bg-slate-50 rounded-xl"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Clock className="w-4 h-4" />
                          {new Date(order.createdAt).toLocaleString('zh-CN', { 
                            month: '2-digit', 
                            day: '2-digit',
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                        <span className="font-bold text-orange-500">¥{order.total.toFixed(2)}</span>
                      </div>
                      <p className="text-sm text-slate-600 mb-3">
                        {order.items.length}件商品
                      </p>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => resumeOrder(order)}
                          className="flex-1 py-2 bg-orange-500 text-white rounded-lg font-medium"
                        >
                          取单
                        </button>
                        <button 
                          onClick={() => {
                            const updated = pendingOrders.filter(o => o.id !== order.id);
                            setPendingOrders(updated);
                            localStorage.setItem('assistant_pending_orders', JSON.stringify(updated));
                          }}
                          className="py-2 px-4 bg-red-50 text-red-500 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 扫码弹窗 */}
      {showBarcode && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <ScanLine className="w-5 h-5 text-blue-500" />
                条码输入
              </h2>
              <button onClick={() => setShowBarcode(false)}>
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1">扫描或输入条码</label>
                <input 
                  type="text" 
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && barcodeInput.length > 0) {
                      handleBarcodeScan(barcodeInput);
                    }
                  }}
                  placeholder="扫描或输入条码后按回车"
                  className="w-full p-4 border border-slate-200 rounded-xl text-lg tracking-widest font-mono"
                  autoFocus
                />
              </div>
              
              <button 
                onClick={() => barcodeInput && handleBarcodeScan(barcodeInput)}
                disabled={!barcodeInput}
                className={`w-full py-4 rounded-xl font-bold text-lg ${
                  barcodeInput ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white' : 'bg-slate-200 text-slate-400'
                }`}
              >
                添加商品
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 优惠券弹窗 */}
      {showDiscount && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <Gift className="w-5 h-5 text-pink-500" />
                优惠券
              </h2>
              <button onClick={() => setShowDiscount(false)}>
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            
            <div className="p-8 text-center text-slate-400">
              <Gift className="w-16 h-16 mx-auto mb-2 opacity-30" />
              <p>暂无可用优惠券</p>
              <p className="text-sm mt-1">可在总部系统领取优惠券</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
