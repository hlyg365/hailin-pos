import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePosAuth, useStoreInfo } from '@hailin/core';
import { useCart, useCartActions } from '@hailin/cart';
import { useScanner, usePrinter, useCashbox, useClearanceMode } from '@hailin/hardware';
import { useMemberDiscount } from '@hailin/member';
import { usePayment } from '@hailin/payment';
import { formatCurrency, formatTime } from '@hailin/core';
import { 
  ShoppingCart, User, Clock, Settings, Pause, CreditCard, 
  Banknote, QrCode, ChevronDown, Search, Plus, Minus,
  Trash2, Printer, LogOut, RefreshCw, X
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  barcode: string;
  price: number;
  imageUrl?: string;
  categoryId?: string;
  stock?: number;
}

interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
}

export default function CashierPage() {
  const navigate = useNavigate();
  const { operator, logout, isAuthenticated } = usePosAuth();
  const { store } = useStoreInfo();
  const { cartItems, subtotal, discount, finalAmount, itemCount } = useCart();
  const { addItem, removeItem, updateQuantity, clearCart } = useCartActions();
  const { currentMember, levelName, discountRate, isBirthday, calculatePoints } = useMemberDiscount();
  const { isClearanceMode, calculateClearancePrice } = useClearanceMode();
  const { status: scanStatus, startListening, stopListening } = useScanner();
  const { status: printerStatus, print } = usePrinter();
  const { open: openCashbox } = useCashbox();

  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [quickAmount, setQuickAmount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  // 模拟商品数据
  const [products] = useState<Product[]>([
    { id: '1', name: '农夫山泉550ml', barcode: '6921166466888', price: 2, categoryId: 'drink' },
    { id: '2', name: '可口可乐330ml', barcode: '6921234567890', price: 3, categoryId: 'drink' },
    { id: '3', name: '康师傅方便面', barcode: '6922345678901', price: 4.5, categoryId: 'food' },
    { id: '4', name: '双汇火腿肠', barcode: '6923456789012', price: 5, categoryId: 'food' },
    { id: '5', name: '绿箭口香糖', barcode: '6924567890123', price: 6, categoryId: 'snack' },
    { id: '6', name: '奥利奥饼干', barcode: '6925678901234', price: 8.5, categoryId: 'snack' },
    { id: '7', name: '伊利纯牛奶', barcode: '6926789012345', price: 12, categoryId: 'dairy' },
    { id: '8', name: '蒙牛酸奶', barcode: '6927890123456', price: 6.5, categoryId: 'dairy' },
  ]);

  const categories = [
    { id: 'drink', name: '饮料', icon: '🧃' },
    { id: 'food', name: '食品', icon: '🍜' },
    { id: 'snack', name: '零食', icon: '🍪' },
    { id: 'dairy', name: '奶制品', icon: '🥛' },
  ];

  // 过滤商品
  const filteredProducts = products.filter(p => {
    if (searchKeyword && !p.name.includes(searchKeyword) && !p.barcode.includes(searchKeyword)) {
      return false;
    }
    if (selectedCategory && p.categoryId !== selectedCategory) {
      return false;
    }
    return true;
  });

  // 扫码枪监听
  useEffect(() => {
    startListening((barcode, type) => {
      const product = products.find(p => p.barcode === barcode);
      if (product) {
        const price = isClearanceMode ? calculateClearancePrice(product.price) : product.price;
        addItem({ ...product, price });
      }
    });

    return () => stopListening();
  }, [startListening, stopListening, products, isClearanceMode, calculateClearancePrice, addItem]);

  // 处理数字键盘输入
  const handleKeypadInput = (value: string) => {
    if (value === 'clear') {
      setQuickAmount(0);
    } else if (value === 'backspace') {
      setQuickAmount(Math.floor(quickAmount / 10));
    } else {
      setQuickAmount(quickAmount * 10 + parseInt(value));
    }
  };

  // 添加商品到购物车
  const handleAddProduct = (product: Product) => {
    const price = isClearanceMode ? calculateClearancePrice(product.price) : product.price;
    addItem({ ...product, price });
  };

  // 会员折扣
  const memberDiscountAmount = subtotal * (1 - discountRate);
  const finalWithMember = isClearanceMode 
    ? calculateClearancePrice(finalAmount) 
    : finalAmount * discountRate;

  // 获得积分
  const earnedPoints = calculatePoints(finalWithMember);

  // 结算
  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    
    setLoading(true);
    try {
      // 打印小票
      await print({
        storeName: store?.name || '海邻到家',
        orderNo: `POS${Date.now()}`,
        items: cartItems.map(item => ({
          name: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
          subtotal: item.subtotal,
        })),
        subtotal,
        discount: memberDiscountAmount,
        finalAmount: finalWithMember,
        paymentMethod: '现金',
        memberName: currentMember?.name,
        points: earnedPoints,
        operatorName: operator?.name,
        timestamp: new Date().toISOString(),
      });

      // 打开钱箱
      await openCashbox();

      // 清空购物车
      clearCart();
      setShowPaymentModal(false);
    } catch (error) {
      console.error('Checkout failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // 现金收款
  const handleCashPayment = async () => {
    setShowPaymentModal(true);
  };

  // 数字支付
  const handleDigitalPayment = () => {
    setShowPaymentModal(true);
  };

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  return (
    <div className="h-screen flex bg-slate-100">
      {/* 左侧：商品区 */}
      <div className="flex-1 flex flex-col">
        {/* 顶部栏 */}
        <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">海</span>
              </div>
              <div>
                <div className="font-semibold">{store?.name || '海邻到家'}</div>
                <div className="text-xs text-gray-500">{operator?.name} | {formatTime(new Date())}</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* 晚8点清货标识 */}
            {isClearanceMode && (
              <span className="px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-bold rounded-full">
                清货价
              </span>
            )}

            {/* 会员信息 */}
            {currentMember ? (
              <button 
                onClick={() => navigate('/member')}
                className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg"
              >
                <User className="w-4 h-4" />
                <span className="font-medium">{currentMember.name}</span>
                <span className="text-sm">{levelName}</span>
              </button>
            ) : (
              <button 
                onClick={() => navigate('/member')}
                className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg"
              >
                <User className="w-4 h-4" />
                <span>识别会员</span>
              </button>
            )}

            {/* 挂单 */}
            <button 
              onClick={() => navigate('/suspended')}
              className="p-2 bg-amber-50 text-amber-700 rounded-lg"
              title="挂单"
            >
              <Pause className="w-5 h-5" />
            </button>

            {/* 设置 */}
            <button 
              onClick={() => navigate('/settings')}
              className="p-2 bg-gray-100 text-gray-600 rounded-lg"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* 退出 */}
            <button 
              onClick={() => { logout(); navigate('/login'); }}
              className="p-2 bg-red-50 text-red-600 rounded-lg"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 搜索和分类 */}
        <div className="bg-white border-b px-4 py-3">
          <div className="flex items-center gap-4">
            {/* 搜索框 */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜索商品名称或条码..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* 扫码枪状态 */}
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
              <div className={`w-2 h-2 rounded-full ${scanStatus === 'listening' ? 'bg-green-500' : 'bg-gray-400'}`} />
              <span className="text-sm text-gray-600">扫码枪{scanStatus === 'listening' ? '就绪' : '未连接'}</span>
            </div>

            {/* 打印机状态 */}
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
              <Printer className={`w-4 h-4 ${printerStatus === 'connected' ? 'text-green-600' : 'text-gray-400'}`} />
              <span className="text-sm text-gray-600">打印机{printerStatus === 'connected' ? '就绪' : '未连接'}</span>
            </div>
          </div>

          {/* 分类标签 */}
          <div className="flex items-center gap-2 mt-3 overflow-x-auto">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${
                selectedCategory === null ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              全部
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap flex items-center gap-1 ${
                  selectedCategory === cat.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 商品网格 */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filteredProducts.map(product => (
              <div
                key={product.id}
                onClick={() => handleAddProduct(product)}
                className="product-card bg-white"
              >
                <div className="aspect-square bg-gray-100 flex items-center justify-center">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl">
                      {categories.find(c => c.id === product.categoryId)?.icon || '📦'}
                    </span>
                  )}
                </div>
                <div className="p-2">
                  <div className="text-sm font-medium truncate">{product.name}</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-blue-600 font-bold">
                      {isClearanceMode ? (
                        <span>
                          <span className="line-through text-gray-400 text-xs mr-1">¥{product.price}</span>
                          <span>¥{calculateClearancePrice(product.price)}</span>
                        </span>
                      ) : (
                        `¥${product.price}`
                      )}
                    </span>
                    <button className="p-1 bg-blue-600 text-white rounded-full">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 右侧：购物车 */}
      <div className="w-96 bg-white border-l flex flex-col">
        {/* 购物车标题 */}
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
            <span className="font-semibold">购物车</span>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-sm rounded-full">
              {itemCount}
            </span>
          </div>
          <button 
            onClick={clearCart}
            className="text-gray-400 hover:text-red-500"
            disabled={cartItems.length === 0}
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        {/* 购物车列表 */}
        <div className="flex-1 overflow-y-auto">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <ShoppingCart className="w-16 h-16 mb-2" />
              <p>购物车为空</p>
              <p className="text-sm">点击商品或扫码添加</p>
            </div>
          ) : (
            <div className="divide-y">
              {cartItems.map((item, index) => (
                <div key={index} className="px-4 py-3 flex items-center gap-3">
                  <div className="flex-1">
                    <div className="font-medium">{item.product.name}</div>
                    <div className="text-sm text-gray-500">¥{item.product.price} × {item.quantity}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(index, item.quantity - 1)}
                      className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(index, item.quantity + 1)}
                      className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="w-20 text-right font-semibold">
                    ¥{item.subtotal.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 会员优惠 */}
        {currentMember && (
          <div className="px-4 py-2 bg-green-50 border-t flex items-center justify-between">
            <span className="text-green-700">
              {levelName} {discountRate === 1 ? '原价' : `享${(discountRate * 10).toFixed(1)}折`}
            </span>
            <span className="text-green-700 font-medium">-¥{memberDiscountAmount.toFixed(2)}</span>
          </div>
        )}

        {/* 生日双倍 */}
        {isBirthday && (
          <div className="px-4 py-2 bg-pink-50 border-t flex items-center justify-between">
            <span className="text-pink-700">🎂 生日快乐！双倍积分</span>
          </div>
        )}

        {/* 金额汇总 */}
        <div className="border-t p-4 space-y-2">
          <div className="flex justify-between text-gray-600">
            <span>商品总价</span>
            <span>¥{subtotal.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>优惠</span>
              <span>-¥{discount.toFixed(2)}</span>
            </div>
          )}
          {isClearanceMode && (
            <div className="flex justify-between text-orange-600">
              <span>清货折扣</span>
              <span>8折</span>
            </div>
          )}
          <div className="flex justify-between text-xl font-bold pt-2 border-t">
            <span>应付</span>
            <span className="text-blue-600">¥{finalWithMember.toFixed(2)}</span>
          </div>
          {currentMember && (
            <div className="flex justify-between text-amber-600 text-sm">
              <span>可获积分</span>
              <span>+{earnedPoints}</span>
            </div>
          )}
        </div>

        {/* 支付按钮 */}
        <div className="p-4 border-t space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleCashPayment}
              disabled={cartItems.length === 0 || loading}
              className="cashier-button py-4 bg-green-600 hover:bg-green-700"
            >
              <Banknote className="w-5 h-5 mr-2" />
              现金收款
            </button>
            <button
              onClick={handleDigitalPayment}
              disabled={cartItems.length === 0 || loading}
              className="cashier-button py-4 bg-blue-600 hover:bg-blue-700"
            >
              <QrCode className="w-5 h-5 mr-2" />
              扫码收款
            </button>
          </div>
          <button
            onClick={() => navigate('/suspended')}
            disabled={cartItems.length === 0}
            className="w-full py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            挂单
          </button>
        </div>
      </div>

      {/* 支付弹窗 */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">收款 ¥{finalWithMember.toFixed(2)}</h2>
              <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* 数字键盘 */}
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <button
                    key={num}
                    onClick={() => handleKeypadInput(num.toString())}
                    className="keypad-button py-4 text-2xl"
                  >
                    {num}
                  </button>
                ))}
                <button onClick={() => handleKeypadInput('clear')} className="keypad-button py-4 text-lg">
                  C
                </button>
                <button onClick={() => handleKeypadInput('0')} className="keypad-button py-4 text-2xl">
                  0
                </button>
                <button onClick={() => handleKeypadInput('backspace')} className="keypad-button py-4 text-lg">
                  ⌫
                </button>
              </div>

              {/* 收款金额 */}
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-800">
                  ¥{quickAmount.toFixed(2)}
                </div>
                <div className="text-gray-500 mt-2">
                  找零: ¥{Math.max(0, quickAmount - finalWithMember).toFixed(2)}
                </div>
              </div>

              {/* 快捷金额 */}
              <div className="flex gap-2 justify-center flex-wrap">
                {[Math.ceil(finalWithMember / 10) * 10, Math.ceil(finalWithMember / 50) * 50, 100, 200].map(amount => (
                  <button
                    key={amount}
                    onClick={() => setQuickAmount(amount)}
                    className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    ¥{amount}
                  </button>
                ))}
              </div>

              {/* 确认收款 */}
              <button
                onClick={handleCheckout}
                disabled={quickAmount < finalWithMember || loading}
                className="w-full py-4 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? '处理中...' : `确认收款 ¥${finalWithMember.toFixed(2)}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
