import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore, useProductStore, useMemberStore, useOrderStore, useFinanceStore, useOfflineStore, useStoreStore, useAiConfigStore, useDeviceConfigStore } from '../store';
import { deviceManager, deviceEvents, type DeviceStatus } from '../services/hardwareService';
import { cashTTS } from '../services/ttsService';
import type { Product } from '../types';

// 检查清货模式
const isClearanceMode = (): boolean => {
  const hour = new Date().getHours();
  return hour >= 20 && hour < 23;
};

// 门店模块配置
const storeModules = [
  { id: 'cashier', label: '收银', icon: '💰' },
  { id: 'inventory', label: '库存', icon: '📦' },
  { id: 'products', label: '商品', icon: '🏷️' },
  { id: 'promotion', label: '促销', icon: '🎁' },
  { id: 'orders', label: '订单', icon: '📋' },
  { id: 'delivery', label: '配送', icon: '🚚' },
  { id: 'reports', label: '报表', icon: '📊' },
  { id: 'member', label: '会员', icon: '👥' },
];

export default function CashierPage() {
  const navigate = useNavigate();
  const [activeModule, setActiveModule] = useState('cashier');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [memberPhone, setMemberPhone] = useState('');
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedPay, setSelectedPay] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showSuspendedModal, setShowSuspendedModal] = useState(false);
  const [showDevicePanel, setShowDevicePanel] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [editingDeviceConfig, setEditingDeviceConfig] = useState<string | null>(null);
  const [tempDeviceConfig, setTempDeviceConfig] = useState<{ address: string; port: number }>({ address: '', port: 9100 });
  const [aiScanResult, setAiScanResult] = useState<{
    barcode?: string;
    loading?: boolean;
    candidates?: Product[];
    aiRecognized?: boolean;
    aiProduct?: Product;
  } | null>(null);
  const [aiVisionResult, setAiVisionResult] = useState<{ loading?: boolean; candidates?: { name: string; confidence: number; estimatedWeight?: number }[] } | null>(null);
  const [ai识别中, setAi识别中] = useState(false);

  // 新商品表单
  const [newProduct, setNewProduct] = useState({ name: '', barcode: '', category: '食品', retailPrice: 0, costPrice: 0, isStandard: true, supplier: '' });

  // 基于条码AI识别商品信息
  const handleBarcodeAi识别 = async (barcode: string) => {
    setAi识别中(true);
    setNewProduct(prev => ({ ...prev, barcode })); // 先填充条码
    
    // 调用真实AI识别接口
    const aiConfig = useAiConfigStore.getState();
    const result = await aiConfig.aiScanByBarcode(barcode);
    
    if (result.success) {
      setNewProduct(prev => ({
        ...prev,
        barcode,
        name: result.name || '',
        category: result.category || '食品',
        retailPrice: result.retailPrice || 0,
        costPrice: result.costPrice || 0,
      }));
    } else {
      // 识别失败时填充基本信息
      setNewProduct(prev => ({
        ...prev,
        barcode,
        name: '',
        category: '食品',
        retailPrice: 0,
        costPrice: 0,
        supplier: '',
      }));
      console.warn('AI识别失败:', result.message);
    }
    
    setAi识别中(false);
  };

  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const barcodeBufferRef = useRef<string>('');
  const barcodeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isOnline = useOfflineStore(state => state.isOnline);
  const clearanceMode = isClearanceMode();

  // 扫码枪输入检测：扫码枪通常在100ms内输入完成
  const handleBarcodeInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    barcodeBufferRef.current = value;
    
    // 清除之前的超时
    if (barcodeTimeoutRef.current) {
      clearTimeout(barcodeTimeoutRef.current);
    }
    
    // 扫码枪输入：如果输入完整（包含回车或长度>=8）立即处理
    if (value.includes('\n') || value.length >= 13) {
      const barcode = value.replace('\n', '').trim();
      if (barcode) {
        handleBarcodeScan(barcode);
        e.target.value = '';
        barcodeBufferRef.current = '';
      }
    } else {
      // 普通键盘输入：等待300ms确认输入完成
      barcodeTimeoutRef.current = setTimeout(() => {
        const barcode = barcodeBufferRef.current.trim();
        if (barcode && barcode.length >= 4) {
          handleBarcodeScan(barcode);
          e.target.value = '';
          barcodeBufferRef.current = '';
        }
      }, 300);
    }
  }, []);

  // 自动聚焦扫码框并保持焦点
  useEffect(() => {
    const focusInput = () => {
      if (barcodeInputRef.current && document.activeElement !== barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
    };
    
    // 初始聚焦
    focusInput();
    
    // 点击任意位置时重新聚焦扫码框（除了输入框和按钮）
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('input') && !target.closest('button') && !target.closest('[contenteditable]')) {
        focusInput();
      }
    };
    
    // 全局键盘事件监听
    const handleGlobalKeydown = (e: KeyboardEvent) => {
      // 如果焦点不在扫码框，且按下了可打印字符，立即聚焦
      if (document.activeElement !== barcodeInputRef.current) {
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          focusInput();
        }
      }
    };
    
    document.addEventListener('click', handleGlobalClick);
    document.addEventListener('keydown', handleGlobalKeydown);
    
    // 定时保持焦点
    const focusInterval = setInterval(focusInput, 2000);
    
    return () => {
      document.removeEventListener('click', handleGlobalClick);
      document.removeEventListener('keydown', handleGlobalKeydown);
      clearInterval(focusInterval);
      if (barcodeTimeoutRef.current) clearTimeout(barcodeTimeoutRef.current);
    };
  }, []);

  const { items, addItem, removeItem, updateQuantity, clearCart } = useCartStore();
  const products = useProductStore(state => state.products);
  const currentMember = useMemberStore(state => state.currentMember);
  const { orders, createOrder, suspendOrder, resumeOrder } = useOrderStore();
  const currentStore = useStoreStore(state => state.currentStore);
  const deviceConfig = useDeviceConfigStore();
  
  // 设备状态
  const [deviceStatuses, setDeviceStatuses] = useState<DeviceStatus>({
    scaleConnected: false,
    printerConnected: false,
    labelPrinterConnected: false,
    scannerEnabled: true,
  });
  const [isConnectingDevices, setIsConnectingDevices] = useState(false);
  // 秤数据状态 - 用于触发重渲染显示实时重量
  const [scaleWeight, setScaleWeight] = useState<{ weight: number; unit: string; stable: boolean } | null>(null);

  // 计算购物车金额
  // 购物车状态订阅（响应式）
  const cartItems = useCartStore(state => state.items);
  
  // 计算购物车总金额（响应式）
  const totals = useMemo(() => {
    const subtotal = cartItems.reduce((sum, item) => sum + item.product.retailPrice * item.quantity, 0);
    const clearanceDiscount = clearanceMode ? subtotal * 0.2 : 0;
    const memberDiscount = currentMember ? (currentMember.level === 'diamond' ? subtotal * 0.1 : currentMember.level === 'gold' ? subtotal * 0.05 : currentMember.level === 'silver' ? subtotal * 0.02 : 0) : 0;
    const total = subtotal - clearanceDiscount - memberDiscount;
    return { subtotal, clearanceDiscount, memberDiscount, total, hasItems: cartItems.length > 0 };
  }, [cartItems, currentMember, clearanceMode]);

  const hasItems = cartItems.length > 0;

  const categories = useMemo(() => {
    return ['all', ...new Set(products.map(p => p.category))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCategory = activeCategory === 'all' || p.category === activeCategory;
      const matchSearch = p.name.includes(searchQuery) || p.barcode.includes(searchQuery);
      return matchCategory && matchSearch && p.status === 'active';
    });
  }, [products, activeCategory, searchQuery]);

  const suspendedOrders = useMemo(() => {
    return orders.filter(o => o.status === 'suspended');
  }, [orders]);

  // 设备自动连接
  const connectDevices = useCallback(async () => {
    if (isConnectingDevices) return;
    setIsConnectingDevices(true);
    
    console.log('[收银台] 开始连接设备...');
    console.log('[收银台] 当前设备配置:', JSON.stringify({
      scale: { enabled: deviceConfig.scale.enabled, address: deviceConfig.scale.address, port: deviceConfig.scale.tcpPort || deviceConfig.scale.port, type: deviceConfig.scale.type },
      printer: { enabled: deviceConfig.receiptPrinter.enabled, address: deviceConfig.receiptPrinter.address, port: deviceConfig.receiptPrinter.port },
      label: { enabled: deviceConfig.labelPrinter?.enabled, address: deviceConfig.labelPrinter?.address, port: deviceConfig.labelPrinter?.port }
    }));
    
    try {
      // 检查是否有可用的设备配置（有IP地址就尝试连接）
      const hasScaleConfig = deviceConfig.scale.address && deviceConfig.scale.type === 'network';
      const hasPrinterConfig = deviceConfig.receiptPrinter.address;
      const hasLabelConfig = deviceConfig.labelPrinter?.address;
      
      if (!hasScaleConfig && !hasPrinterConfig && !hasLabelConfig) {
        console.warn('[收银台] 未配置任何设备，请先在设置中配置设备IP地址');
        // 仍然尝试初始化（使用模拟模式）
      }
      
      // 使用新的硬件服务初始化设备
      const status = await deviceManager.init({
        scale: hasScaleConfig ? {
          host: deviceConfig.scale.address,
          port: deviceConfig.scale.tcpPort || deviceConfig.scale.port || 8080,
        } : undefined,
        receiptPrinter: hasPrinterConfig ? {
          host: deviceConfig.receiptPrinter.address,
          port: deviceConfig.receiptPrinter.port || 9100,
        } : undefined,
        labelPrinter: hasLabelConfig ? {
          host: deviceConfig.labelPrinter.address,
          port: deviceConfig.labelPrinter.port || 9100,
        } : undefined,
      });
      
      setDeviceStatuses(status);
      console.log('[收银台] 设备连接完成:', status);
    } catch (error: any) {
      console.error('[收银台] 设备连接失败:', error);
      // 不抛出异常，允许应用继续运行在模拟模式
    } finally {
      setIsConnectingDevices(false);
    }
  }, [deviceConfig, isConnectingDevices]);

  // 页面加载时自动连接设备
  useEffect(() => {
    if (deviceConfig.autoConnect) {
      connectDevices();
      
      // 显示欢迎界面到客显屏
      deviceManager.customerDisplay.showWelcome();
    }
    
    // 定时刷新设备状态
    const statusInterval = setInterval(async () => {
      try {
        const status = await deviceManager.getStatus();
        setDeviceStatuses(status);
      } catch (e) {
        console.warn('[收银台] 获取设备状态失败:', e);
      }
    }, 5000);
    
    // 监听扫码事件
    deviceEvents.on('scan', (data) => {
      console.log('[收银台] 扫码事件:', data.barcode);
      handleBarcodeScan(data.barcode);
    });
    
    // 监听秤数据事件，触发UI更新
    deviceEvents.on('weightChanged', (data: { weight: number; unit: string; stable: boolean; raw?: string; timestamp: number }) => {
      console.log('[收银台] 秤数据:', data);
      // 更新秤数据状态以触发重渲染
      setScaleWeight({ weight: data.weight, unit: data.unit, stable: data.stable });
      // 开发模式下显示原始十六进制数据
      if (data.raw) {
        console.log('[秤原始数据]', data.raw);
      }
    });
    
    // 保存事件引用用于cleanup
    const handleScan = (data: any) => handleBarcodeScan(data.barcode);
    const handleWeight = (data: any) => {
      setScaleWeight({ weight: data.weight, unit: data.unit, stable: data.stable });
    };
    
    return () => {
      clearInterval(statusInterval);
      clearInterval(scaleWeightIntervalRef.current);
      deviceEvents.off('scan', handleScan);
      deviceEvents.off('weightChanged', handleWeight);
    };
  }, [connectDevices, deviceConfig.autoConnect]);

  // 主动轮询秤重量（50ms间隔，极速响应）
  const scaleWeightIntervalRef = useRef<number | null>(null);
  
  useEffect(() => {
    // 监听秤连接状态
    const handleScaleData = (data: any) => {
      if (data && typeof data.weight === 'number') {
        setScaleWeight({ weight: data.weight, unit: data.unit || 'kg', stable: data.stable ?? true });
      }
    };
    hardwareService.on('scaleData', handleScaleData);
    
    // 启动主动轮询（原生事件可能不稳定，用轮询作为备份）
    const startWeightPolling = () => {
      if (scaleWeightIntervalRef.current) return;
      
      scaleWeightIntervalRef.current = window.setInterval(async () => {
        try {
          // 直接调用原生插件读取重量
          const plugin = (window as any).Capacitor?.Plugins?.HailinHardware || (window as any).HailinHardware;
          if (plugin && plugin.scaleReadWeight) {
            const result = await plugin.scaleReadWeight({});
            if (result && typeof result.weight === 'number') {
              setScaleWeight({ weight: result.weight, unit: result.unit || 'kg', stable: result.stable ?? true });
            }
          }
        } catch (e) {
          // 忽略错误，静默重试
        }
      }, 50); // 50ms = 20次/秒，极速响应
    };
    
    // 延迟启动，等待插件就绪
    setTimeout(startWeightPolling, 1000);
    
    return () => {
      hardwareService.off('scaleData', handleScaleData);
      if (scaleWeightIntervalRef.current) {
        clearInterval(scaleWeightIntervalRef.current);
        scaleWeightIntervalRef.current = null;
      }
    };
  }, []);

  useEffect(() => { barcodeInputRef.current?.focus(); }, []);

  const handleBarcodeScan = useCallback(async (barcode: string) => {
    setAiScanResult({ barcode, loading: true });
    
    // 1. 先查找商品库
    const exact = products.find(p => p.barcode === barcode);
    if (exact) {
      addItem(exact, 1);
      setAiScanResult(null);
      // 更新客显屏显示商品信息
      deviceManager.customerDisplay.showAmount(exact.retailPrice, exact.name);
      return;
    }
    
    // 2. 商品库没有，调用AI识别
    const aiConfig = useAiConfigStore.getState();
    const result = await aiConfig.aiScanByBarcode(barcode);
    
    if (result.success && result.name && result.retailPrice) {
      // AI识别成功，显示识别结果
      const aiProduct: Product = {
        id: `ai_${Date.now()}`,
        name: result.name || `商品(${barcode})`,
        barcode: barcode,
        category: result.category || '食品',
        retailPrice: result.retailPrice || 0,
        costPrice: result.costPrice || 0,
        isStandard: true,
        status: 'active',
        stock: 100,
      };
      setAiScanResult({ 
        barcode, 
        candidates: [aiProduct],
        aiRecognized: true,
        aiProduct: aiProduct
      });
    } else {
      // AI识别失败，显示扫码结果让用户手动输入
      console.log('[AI识别失败]', result);
      setAiScanResult({ 
        barcode, 
        candidates: [],
        aiRecognized: false
      });
      // 打开新增商品弹窗
      setNewProduct(prev => ({ ...prev, barcode }));
      setShowAddProductModal(true);
    }
  }, [products, addItem]);

  const handleAiVision = useCallback(async () => {
    setAiVisionResult({ loading: true });
    
    // 调用真实AI视觉识别
    const aiConfig = useAiConfigStore.getState();
    const result = await aiConfig.aiScanByBarcode('VISION_SCAN');
    
    // 如果AI识别成功，返回识别结果
    if (result.success && result.name) {
      setAiVisionResult({
        candidates: [
          { name: result.name, confidence: 0.95, estimatedWeight: result.retailPrice || 0.5 },
        ]
      });
    } else {
      // AI识别失败，返回空结果提示用户手动输入
      setAiVisionResult({
        candidates: []
      });
    }
  }, []);

  const handleSelectAiCandidate = (product: Product, weight?: number) => {
    addItem(product, weight || 1);
    setAiVisionResult(null);
    setAiScanResult(null);
  };

  // 添加新商品到商品库
  const handleAddNewProduct = () => {
    if (!newProduct.name || !newProduct.barcode || newProduct.retailPrice <= 0) {
      alert('请填写商品名称、条码和售价');
      return;
    }
    const productStore = useProductStore.getState();
    const newProd: Product = {
      id: `prod_${Date.now()}`,
      name: newProduct.name,
      barcode: newProduct.barcode,
      category: newProduct.category,
      retailPrice: newProduct.retailPrice,
      costPrice: newProduct.costPrice,
      isStandard: newProduct.isStandard,
      status: 'active',
      stock: 100,
      supplier: newProduct.supplier,
    };
    productStore.addProduct(newProd);
    // 直接添加到购物车
    addItem(newProd, newProduct.isStandard ? 1 : 0.5);
    setShowAddProductModal(false);
    setAiScanResult(null);
    setNewProduct({ name: '', barcode: '', category: '食品', retailPrice: 0, costPrice: 0, isStandard: true, supplier: '' });
    alert(`商品 "${newProduct.name}" 已添加到商品库并加入购物车`);
  };

  // 支付完成处理
  const handlePay = async () => {
    if (!selectedPay || isProcessing) return;
    setIsProcessing(true);
    
    try {
      // 生成订单数据
      const order = {
        id: `order_${Date.now()}`,
        orderNo: `POS${Date.now()}`,
        type: 'pos' as const,
        storeId: currentStore?.id || 'store001',
        memberId: currentMember?.id,
        items: items.map(i => ({
          productId: i.product.id,
          productName: i.product.name,
          barcode: i.product.barcode,
          quantity: i.quantity,
          unitPrice: i.product.retailPrice,
          discount: 0,
          subtotal: i.product.retailPrice * i.quantity,
        })),
        totalAmount: totals.subtotal,
        discountAmount: totals.clearanceDiscount + totals.memberDiscount,
        finalAmount: totals.total,
        payMethod: selectedPay as 'cash' | 'wechat' | 'alipay' | 'unionpay' | 'member',
        payStatus: 'paid' as const,
        status: 'paid' as const,
        cashierId: 'emp001',
        createdAt: new Date().toISOString(),
        paidAt: new Date().toISOString(),
      };
      
      // 1. 保存订单
      createOrder(order);
      
      // 2. 现金支付时打开钱箱
      if (selectedPay === 'cash') {
        const drawerOpened = await deviceManager.openCashDrawer();
        if (!drawerOpened) {
          console.warn('[Cashier] 钱箱未能打开，请检查硬件连接');
        }
      }
      
      // 3. 打印小票（如果打印机已连接）
      if (deviceStatuses.printerConnected) {
        await deviceManager.printReceipt({
          title: currentStore?.name || '海邻到家',
          time: new Date(order.paidAt).toLocaleString('zh-CN'),
          orderId: order.orderNo,
          items: order.items.map(i => `${i.productName} x${i.quantity} ¥${i.subtotal.toFixed(2)}`).join('\n'),
          total: order.totalAmount.toFixed(2),
          discount: (order.totalAmount - order.finalAmount).toFixed(2),
          paid: order.finalAmount.toFixed(2),
        });
      } else {
        console.log('[Cashier] 小票打印机未连接，跳过打印');
      }
      
      // 4. 更新客显屏 - 显示收款成功
      deviceManager.customerDisplay.showAmount(order.finalAmount, '支付成功');
      
      // 5. 语音播报 - 收款成功
      cashTTS.paymentSuccess(order.finalAmount, selectedPay);
      
      // 完成
      setShowPayModal(false);
      setShowSuccess(true);
      clearCart();
      setTimeout(() => {
        setShowSuccess(false);
        deviceManager.customerDisplay.showWelcome();
      }, 3000);
    } catch (error) {
      console.error('[Cashier] 支付处理失败:', error);
      alert('支付处理失败，请重试');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // 获取支付方式名称
  const getPayMethodName = (method: string): string => {
    const names: Record<string, string> = {
      cash: '现金',
      wechat: '微信支付',
      alipay: '支付宝',
      unionpay: '云闪付',
      member: '会员卡',
    };
    return names[method] || method;
  };

  const handleSuspend = () => {
    if (items.length === 0) return;
    const order = {
      id: `order_${Date.now()}`, orderNo: `POS${Date.now()}`, type: 'pos' as const,
      storeId: currentStore?.id || 'store001', memberId: currentMember?.id,
      items: items.map(i => ({ productId: i.product.id, productName: i.product.name, barcode: i.product.barcode, quantity: i.quantity, unitPrice: i.product.retailPrice, discount: 0, subtotal: i.product.retailPrice * i.quantity })),
      totalAmount: totals.subtotal, discountAmount: totals.clearanceDiscount + totals.memberDiscount, finalAmount: totals.total,
      payMethod: 'suspended' as const, payStatus: 'unpaid' as const, status: 'suspended' as const, cashierId: 'emp001',
      createdAt: new Date().toISOString(),
    };
    createOrder(order);
    clearCart();
  };

  const handleResumeOrder = (orderId: string) => {
    const order = resumeOrder(orderId);
    if (order) { clearCart(); order.items.forEach(item => { const product = products.find(p => p.id === item.productId); if (product) addItem(product, item.quantity); }); setShowSuspendedModal(false); }
  };

  const handleMemberSearch = () => {
    const member = useMemberStore.getState().members.find(m => m.phone === memberPhone || m.cardNumber === memberPhone);
    if (member) { useMemberStore.getState().setCurrentMember(member); setShowMemberModal(false); setMemberPhone(''); } else { alert('未找到该会员'); }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* 顶部状态栏 - 响应式 */}
      <div className="bg-white border-b px-2 sm:px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-4">
          <Link to="/" className="text-blue-600 hover:text-blue-700"><svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></Link>
          <h1 className="text-sm sm:text-lg font-semibold">{storeModules.find(m => m.id === activeModule)?.label || '收银台'}</h1>
          {clearanceMode && <span className="bg-red-500 text-white text-xs px-2 py-0.5 sm:py-1 rounded-full animate-pulse hidden sm:inline">清货模式 8折</span>}
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {!isOnline && <span className="bg-yellow-500 text-white text-xs px-2 py-0.5 sm:py-1 rounded flex items-center gap-1"><span className="w-2 h-2 bg-white rounded-full"></span>离线</span>}
          <button onClick={() => setShowMemberModal(true)} className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600 hover:text-blue-600">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            <span className="hidden sm:inline">{currentMember ? currentMember.name : '会员'}</span>
          </button>
          <button onClick={() => navigate('/settings')} className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600 hover:text-blue-600">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span className="hidden sm:inline">设置</span>
          </button>
        </div>
      </div>

      {/* 主体区域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧侧边栏 - 响应式 */}
        <aside className="w-14 sm:w-20 bg-gray-800 text-white flex flex-col">
          <div className="p-1 sm:p-2 border-b border-gray-700">
            <div className="flex flex-col items-center">
              <img src="/logo.png" alt="海邻到家" className="h-8 sm:h-10 w-auto rounded" style={{ background: 'rgba(255,255,255,0.1)', padding: '2px' }} />
              <p className="text-xs mt-1 truncate max-w-full text-center leading-tight hidden sm:block">{currentStore?.name || '门店'}</p>
            </div>
          </div>
          <nav className="flex-1 py-1 sm:py-2 overflow-y-auto">
            {storeModules.map(mod => (
              <button key={mod.id} onClick={() => setActiveModule(mod.id)} className={`w-full flex flex-col items-center py-1 sm:py-2 px-0.5 sm:px-1 mb-1 transition-colors ${activeModule === mod.id ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}>
                <span className="text-lg sm:text-xl">{mod.icon}</span>
                <span className="text-xs mt-0.5 sm:mt-1">{mod.label}</span>
              </button>
            ))}
          </nav>
          <div className="p-1 sm:p-2 border-t border-gray-700 text-center"><p className="text-xs text-gray-500">V6.0</p></div>
        </aside>

        {/* 右侧主内容区 */}
        <main className="flex-1 flex overflow-hidden">
          {/* ========== 收银台 ========== */}
          {activeModule === 'cashier' && (
            <>
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* 称重商品面板 - 响应式 */}
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-2 sm:p-4 mb-2 sm:mb-4 rounded-lg sm:rounded-xl shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-4">
                      <div className="w-10 sm:w-16 h-10 sm:h-16 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center animate-pulse">
                        <span className="text-xl sm:text-3xl">⚖️</span>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm opacity-80">等待称重</p>
                        <p className="text-sm sm:text-xl font-bold">请放置商品到电子秤</p>
                        <p className="text-xs sm:text-sm opacity-80 mt-1">放置商品后自动加入购物车</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-6">
                      <div className="text-right">
                        <p className="text-xs sm:text-sm opacity-80">当前重量</p>
                        <p className={`text-2xl sm:text-4xl font-bold ${deviceStatuses.scaleConnected ? 'text-yellow-200' : 'text-red-200'}`}>
                          {deviceStatuses.scaleConnected 
                            ? (scaleWeight ? scaleWeight.weight.toFixed(3) : (deviceManager.scale.currentWeight?.weight?.toFixed(3) || '0.000'))
                            : '---'}
                        </p>
                        <p className="text-xs sm:text-sm opacity-80">
                          {deviceStatuses.scaleConnected 
                            ? (scaleWeight ? (scaleWeight.stable ? 'kg ✓' : 'kg (不稳定)') : (deviceManager.scale.currentWeight?.stable ? 'kg ✓' : 'kg (不稳定)'))
                            : '未连接'}
                        </p>
                      </div>
                      <div className="text-right border-l border-white/30 pl-3 sm:pl-6 hidden sm:block">
                        <p className="text-sm opacity-80">商品金额</p>
                        <p className="text-lg sm:text-2xl font-bold text-yellow-200">¥0.00</p>
                      </div>
                    </div>
                  </div>
                </div>
                {aiScanResult && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg sm:rounded-xl p-2 sm:p-4 mb-2 sm:mb-4">
                    <p className="text-blue-700 font-medium mb-2 text-sm">{aiScanResult.loading ? '正在查询商品...' : `未找到商品: ${aiScanResult.barcode}`}</p>
                    {aiScanResult.candidates && aiScanResult.candidates.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">您是否在找：</p>
                        {aiScanResult.candidates.map((p, i) => (
                          <button key={i} onClick={() => handleSelectAiCandidate(p)} className="w-full flex items-center justify-between bg-white rounded-lg p-2 sm:p-3 border hover:border-blue-400">
                            <div><p className="font-medium text-sm sm:text-base">{p.name}</p><p className="text-xs text-gray-500">{p.barcode}</p></div>
                            <p className="text-red-600 font-semibold">¥{p.retailPrice.toFixed(2)}</p>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between bg-white rounded-lg p-4 border border-blue-200">
                        <div>
                          <p className="font-medium text-gray-700">商品库中未找到此商品</p>
                          <p className="text-sm text-gray-500">条码: {aiScanResult.barcode}</p>
                        </div>
                        <button onClick={() => { 
                          setShowAddProductModal(true); 
                          handleBarcodeAi识别(aiScanResult.barcode || ''); 
                        }} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
                          <span>🤖</span> AI添加商品
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {aiVisionResult && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg sm:rounded-xl p-2 sm:p-4 mb-2 sm:mb-4">
                    <p className="text-purple-700 font-medium mb-2 text-sm">{aiVisionResult.loading ? '正在识别商品...' : '识别到以下商品：'}</p>
                    {aiVisionResult.candidates && aiVisionResult.candidates.length > 0 && (
                      <div className="space-y-2">
                        {aiVisionResult.candidates.map((c, i) => {
                          const product = products.find(p => p.name === c.name);
                          return (
                            <button key={i} onClick={() => product && handleSelectAiCandidate(product, c.estimatedWeight)} className="w-full flex items-center justify-between bg-white rounded-lg p-2 sm:p-3 border hover:border-purple-400">
                              <div><p className="font-medium text-sm sm:text-base">{c.name}</p><p className="text-xs text-gray-500">置信度: {(c.confidence * 100).toFixed(0)}%{c.estimatedWeight && ` | 预估: ${c.estimatedWeight}kg`}</p></div>
                              {c.estimatedWeight && <p className="text-purple-600 font-semibold">约 ¥{((product?.retailPrice || 0) * c.estimatedWeight).toFixed(2)}</p>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
                <div className="bg-white rounded-lg sm:rounded-xl p-2 sm:p-4 mb-2 sm:mb-4 flex gap-2 sm:gap-3 items-center">
                  <div className="relative flex-1">
                    <input 
                      ref={barcodeInputRef} 
                      type="text" 
                      placeholder="📷 扫描/输入条码" 
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-base sm:text-lg font-mono bg-blue-50"
                      onChange={handleBarcodeInput}
                      autoComplete="off"
                      autoCapitalize="off"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hidden sm:block">扫码枪自动识别</div>
                  </div>
                  <button onClick={handleAiVision} className="px-3 sm:px-4 py-2 sm:py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-1 sm:gap-2 text-sm font-medium"><span>👁️</span> <span className="hidden sm:inline">AI视觉</span></button>
                </div>
                <div className="flex gap-1 sm:gap-2 mb-2 sm:mb-4 overflow-x-auto pb-2">
                  {categories.map(cat => (
                    <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-2 sm:px-4 py-1 sm:py-2 rounded-full whitespace-nowrap text-xs sm:text-sm ${activeCategory === cat ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>{cat === 'all' ? '全部' : cat}</button>
                  ))}
                  <input type="text" placeholder="搜索" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="px-2 sm:px-4 py-1 sm:py-2 border rounded-full bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm w-24 sm:w-auto" />
                </div>
                {/* 商品网格 - 响应式列数 */}
                <div className="flex-1 overflow-y-auto grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3 p-1">
                  {filteredProducts.map(product => (
                    <button key={product.id} onClick={() => {
                      if (!product.isStandard) {
                        // 非标品（称重商品）使用秤数据或默认1kg
                        const currentWeight = scaleWeight?.weight || deviceManager.scale.currentWeight?.weight || 1;
                        addItem(product, currentWeight);
                        // 添加后直接使用 totals.total（已自动更新）
                        deviceManager.customerDisplay.showAmount(totals.total + product.retailPrice * currentWeight, product.name);
                      } else {
                        addItem(product, 1);
                        // 添加后直接使用 totals.total（已自动更新）
                        deviceManager.customerDisplay.showAmount(totals.total + product.retailPrice);
                      }
                    }} className="bg-white rounded-lg sm:rounded-xl p-2 sm:p-3 text-left hover:shadow-md transition-shadow relative">
                      {!product.isStandard && <div className="absolute top-1 sm:top-2 right-1 sm:right-2 w-5 sm:w-6 h-5 sm:h-6 bg-orange-500 text-white rounded-full flex items-center justify-center"><span className="text-xs">⚖️</span></div>}
                      <div className="aspect-square bg-gray-100 rounded-lg mb-1 sm:mb-2 flex items-center justify-center">
                        {!product.isStandard && <span className="text-lg sm:text-2xl">🍎</span>}
                        {product.isStandard && <span className="text-xs text-gray-400">{product.name.slice(0, 2)}</span>}
                      </div>
                      <p className="text-xs sm:text-sm font-medium truncate">{product.name}</p>
                      <div className="flex items-center justify-between mt-0.5 sm:mt-1">
                        <span className="text-red-600 font-semibold text-xs sm:text-base">¥{product.retailPrice.toFixed(2)}</span>
                        <span className={`text-xs px-1 rounded ${product.isStandard ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>{product.isStandard ? '标' : '称'}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              {/* 购物车 - 响应式宽度 */}
              <div className="w-72 sm:w-80 md:w-96 bg-white border-l flex flex-col">
                {currentMember && (
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-2 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1"><p className="font-medium text-sm sm:text-base">{currentMember.name}</p><p className="text-xs opacity-80 hidden sm:block">{currentMember.level === 'diamond' ? '💎钻石' : currentMember.level === 'gold' ? '🥇金卡' : currentMember.level === 'silver' ? '🥈银卡' : '普通'}</p></div>
                      <div className="text-right"><p className="text-xs sm:text-sm">积分</p><p className="font-bold text-sm sm:text-base">{currentMember.points.toLocaleString()}</p></div>
                    </div>
                  </div>
                )}
                <div className="bg-gray-50 px-2 sm:px-4 py-1.5 sm:py-2 flex items-center gap-2 sm:gap-3 text-xs border-b">
                  <span className="flex items-center gap-1"><span className={`w-2 h-2 rounded-full ${deviceStatuses.printerConnected ? 'bg-green-500' : 'bg-gray-400'}`}></span><span className="hidden sm:inline">打印机</span></span>
                  <span className="flex items-center gap-1"><span className={`w-2 h-2 rounded-full ${deviceStatuses.scaleConnected ? 'bg-green-500' : 'bg-gray-400'}`}></span><span className="hidden sm:inline">电子秤</span></span>
                  <span className="flex items-center gap-1"><span className={`w-2 h-2 rounded-full ${deviceStatuses.scannerEnabled ? 'bg-green-500' : 'bg-gray-400'}`}></span><span className="hidden sm:inline">扫码枪</span></span>
                </div>
                <div className="flex-1 overflow-y-auto p-2 sm:p-4">
                  {items.length === 0 ? (
                    <div className="text-center text-gray-400 py-8 sm:py-12"><p className="text-3xl sm:text-4xl mb-2 sm:mb-4">🛒</p><p className="text-sm">购物车是空的</p><p className="text-xs sm:text-sm mt-1">扫描条码添加商品</p></div>
                  ) : (
                    <div className="space-y-2 sm:space-y-3">
                      {items.map(item => (
                        <div key={item.product.id} className={`flex gap-2 sm:gap-3 rounded-lg p-2 sm:p-3 ${!item.product.isStandard ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'}`}>
                          <div className="flex-1">
                            <div className="flex items-center gap-1 sm:gap-2"><p className="font-medium text-xs sm:text-sm truncate">{item.product.name}</p>{!item.product.isStandard && <span className="text-xs bg-orange-500 text-white px-1 rounded shrink-0">称</span>}</div>
                            <p className="text-xs text-gray-500">¥{item.product.retailPrice.toFixed(2)} × {item.product.isStandard ? item.quantity : `${item.quantity.toFixed(3)}kg`}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-semibold text-red-600 text-xs sm:text-base">¥{(item.product.retailPrice * item.quantity).toFixed(2)}</p>
                            <div className="flex gap-0.5 sm:gap-1 mt-0.5 sm:mt-1">
                              <button onClick={() => updateQuantity(item.product.id, item.quantity - (item.product.isStandard ? 1 : 0.1))} className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-gray-200 hover:bg-gray-300 text-xs flex items-center justify-center">-</button>
                              <button onClick={() => updateQuantity(item.product.id, item.quantity + (item.product.isStandard ? 1 : 0.1))} className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-gray-200 hover:bg-gray-300 text-xs flex items-center justify-center">+</button>
                              <button onClick={() => removeItem(item.product.id)} className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-red-100 hover:bg-red-200 text-red-600 text-xs flex items-center justify-center">×</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {(totals.clearanceDiscount > 0 || totals.memberDiscount > 0) && (
                  <div className="px-2 sm:px-4 py-1.5 sm:py-2 bg-green-50 text-xs sm:text-sm">
                    {totals.clearanceDiscount > 0 && <div className="flex justify-between text-green-600"><span>清货8折</span><span>-¥{totals.clearanceDiscount.toFixed(2)}</span></div>}
                    {totals.memberDiscount > 0 && <div className="flex justify-between text-blue-600"><span>会员折扣</span><span>-¥{totals.memberDiscount.toFixed(2)}</span></div>}
                  </div>
                )}
                <div className="p-2 sm:p-4 border-t">
                  {/* 设备状态指示 */}
                  <div className="flex gap-1 mb-2">
                    {[
                      { icon: '📺', status: deviceStatuses.scannerEnabled, label: '扫码' },
                      { icon: '🖨️', status: deviceStatuses.printerConnected, label: '打印' },
                      { icon: '⚖️', status: deviceStatuses.scaleConnected, label: '秤' },
                      { icon: '🏷️', status: deviceStatuses.labelPrinterConnected, label: '标签' },
                    ].map((d, i) => (
                      <button 
                        key={i}
                        onClick={() => navigate('/settings')}
                        className={`flex-1 py-1 px-2 rounded text-xs flex items-center justify-center gap-1 ${d.status ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}
                      >
                        {d.icon} {d.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between items-center mb-2 sm:mb-4"><span className="text-gray-600 text-sm">应付金额</span><span className="text-lg sm:text-2xl font-bold text-red-600">¥{totals.total.toFixed(2)}</span></div>
                  <div className="grid grid-cols-3 gap-1 sm:gap-2">
                    <button onClick={handleSuspend} disabled={items.length === 0} className="py-2 sm:py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm">挂单</button>
                    <button onClick={() => setShowSuspendedModal(true)} className="py-2 sm:py-3 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 relative text-xs sm:text-sm">
                      取单
                      {suspendedOrders.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{suspendedOrders.length}</span>}
                    </button>
                    <button onClick={() => setShowPayModal(true)} disabled={items.length === 0} className="py-2 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm font-medium">收款</button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ========== 库存管理 ========== */}
          {activeModule === 'inventory' && (
            <div className="flex-1 bg-white p-4 sm:p-6 overflow-auto">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-lg sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3"><span className="text-2xl sm:text-3xl">📦</span> 库存管理</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
                  {[
                    { label: '商品总数', value: products.length, icon: '📦', color: 'bg-blue-500' },
                    { label: '库存预警', value: products.filter(p => (p as any).stock < 10).length, icon: '⚠️', color: 'bg-yellow-500' },
                    { label: '待补货', value: products.filter(p => (p as any).stock === 0).length, icon: '📝', color: 'bg-red-500' },
                    { label: '今日入库', value: 0, icon: '📥', color: 'bg-green-500' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-xl p-4 shadow-sm border">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center text-2xl`}>{stat.icon}</div>
                        <div><p className="text-gray-500 text-sm">{stat.label}</p><p className="text-2xl font-bold">{stat.value}</p></div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-xl shadow-sm border">
                  <div className="p-4 border-b flex items-center justify-between">
                    <h3 className="font-semibold">商品库存列表</h3>
                    <div className="flex gap-2">
                      <input type="text" placeholder="搜索商品..." className="px-3 py-2 border rounded-lg text-sm" />
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">查询</button>
                    </div>
                  </div>
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">商品名称</th><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">条码</th><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">分类</th><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">库存</th><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">单价</th><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">状态</th><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">操作</th></tr>
                    </thead>
                    <tbody className="divide-y">
                      {products.map(product => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">{product.name}</td>
                          <td className="px-4 py-3 text-gray-500 font-mono text-sm">{product.barcode}</td>
                          <td className="px-4 py-3 text-gray-500">{product.category}</td>
                          <td className="px-4 py-3">{(product as any).stock || 100}</td>
                          <td className="px-4 py-3 text-red-600">¥{product.retailPrice.toFixed(2)}</td>
                          <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs ${product.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>{product.status === 'active' ? '正常' : '停售'}</span></td>
                          <td className="px-4 py-3"><button className="text-blue-600 hover:text-blue-800 text-sm">调整</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-6 bg-white rounded-xl shadow-sm border p-4">
                  <h3 className="font-semibold mb-4">快速入库</h3>
                  <div className="grid grid-cols-4 gap-4">
                    <div><label className="block text-sm text-gray-600 mb-1">商品</label><select className="w-full px-3 py-2 border rounded-lg"><option value="">选择商品</option>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                    <div><label className="block text-sm text-gray-600 mb-1">数量</label><input type="number" placeholder="入库数量" className="w-full px-3 py-2 border rounded-lg" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">备注</label><input type="text" placeholder="备注信息" className="w-full px-3 py-2 border rounded-lg" /></div>
                    <div className="flex items-end"><button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">确认入库</button></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========== 商品管理 ========== */}
          {activeModule === 'products' && (
            <div className="flex-1 bg-white p-4 sm:p-6 overflow-auto">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-lg sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3"><span className="text-2xl sm:text-3xl">🏷️</span> 商品管理</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
                  {[
                    { label: '商品总数', value: products.length, icon: '📦', color: 'bg-blue-500' },
                    { label: '正常销售', value: products.filter(p => p.status === 'active').length, icon: '✅', color: 'bg-green-500' },
                    { label: '已停售', value: products.filter(p => p.status !== 'active').length, icon: '⏸️', color: 'bg-gray-500' },
                    { label: '待审核', value: 0, icon: '⏳', color: 'bg-yellow-500' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-xl p-4 shadow-sm border">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center text-2xl`}>{stat.icon}</div>
                        <div><p className="text-gray-500 text-sm">{stat.label}</p><p className="text-2xl font-bold">{stat.value}</p></div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-xl shadow-sm border">
                  <div className="p-4 border-b flex items-center justify-between">
                    <h3 className="font-semibold">商品列表</h3>
                    <div className="flex gap-2">
                      <select className="px-3 py-2 border rounded-lg text-sm">
                        <option value="">全部分类</option>
                        {categories.filter(c => c !== 'all').map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <input type="text" placeholder="搜索商品名称/条码..." className="px-3 py-2 border rounded-lg text-sm" />
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">搜索</button>
                      <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">+ 新增商品</button>
                    </div>
                  </div>
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">商品</th><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">条码</th><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">分类</th><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">进价</th><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">售价</th><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">类型</th><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">状态</th><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">操作</th></tr>
                    </thead>
                    <tbody className="divide-y">
                      {products.map(product => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 flex items-center gap-2"><div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">🏷️</div><span className="font-medium">{product.name}</span></td>
                          <td className="px-4 py-3 text-gray-500 font-mono text-sm">{product.barcode}</td>
                          <td className="px-4 py-3 text-gray-500">{product.category}</td>
                          <td className="px-4 py-3">¥{((product as any).costPrice || product.retailPrice * 0.6).toFixed(2)}</td>
                          <td className="px-4 py-3 text-red-600 font-semibold">¥{product.retailPrice.toFixed(2)}</td>
                          <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs ${product.isStandard ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>{product.isStandard ? '标准品' : '称重品'}</span></td>
                          <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs ${product.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>{product.status === 'active' ? '正常' : '停售'}</span></td>
                          <td className="px-4 py-3"><button className="text-blue-600 hover:text-blue-800 text-sm mr-2">编辑</button><button className="text-red-600 hover:text-red-800 text-sm">删除</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========== 促销管理 ========== */}
          {activeModule === 'promotion' && (
            <div className="flex-1 bg-white p-4 sm:p-6 overflow-auto">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-lg sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3"><span className="text-2xl sm:text-3xl">🎁</span> 促销管理</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
                  {[
                    { label: '进行中', value: 2, icon: '🔥', color: 'bg-red-500' },
                    { label: '即将开始', value: 1, icon: '⏰', color: 'bg-yellow-500' },
                    { label: '已结束', value: 3, icon: '✅', color: 'bg-gray-500' },
                    { label: '优惠劵', value: 5, icon: '🎟️', color: 'bg-purple-500' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-xl p-4 shadow-sm border">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center text-2xl`}>{stat.icon}</div>
                        <div><p className="text-gray-500 text-sm">{stat.label}</p><p className="text-2xl font-bold">{stat.value}</p></div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-xl shadow-sm border mb-6">
                  <div className="p-4 border-b flex items-center justify-between">
                    <h3 className="font-semibold">进行中的促销活动</h3>
                    <button className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">+ 创建促销</button>
                  </div>
                  <div className="divide-y">
                    {[
                      { name: '晚8点清货', type: '时段折扣', discount: '8折', time: '20:00-23:00', status: '进行中' },
                      { name: '会员专享', type: '会员折扣', discount: '9-98折', time: '全天', status: '进行中' },
                    ].map((promo, i) => (
                      <div key={i} className="p-4 flex items-center justify-between hover:bg-gray-50">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center text-2xl">🔥</div>
                          <div>
                            <p className="font-medium">{promo.name}</p>
                            <p className="text-sm text-gray-500">{promo.type} | {promo.time}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-2xl font-bold text-red-600">{promo.discount}</span>
                          <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm">{promo.status}</span>
                          <button className="text-blue-600 hover:text-blue-800 text-sm">编辑</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl shadow-sm border p-4">
                    <h3 className="font-semibold mb-4">满减活动</h3>
                    <div className="space-y-3">
                      {[{ threshold: 50, discount: 5, name: '满50减5' }, { threshold: 100, discount: 10, name: '满100减10' }].map((m, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium">{m.name}</span>
                          <span className="text-green-600">满{m.threshold}减{m.discount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border p-4">
                    <h3 className="font-semibold mb-4">优惠券</h3>
                    <div className="space-y-3">
                      {[{ name: '新人券', value: 10, type: '满100可用' }, { name: '生日券', value: 20, type: '满200可用' }].map((c, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                          <div><span className="font-medium text-purple-600">{c.name}</span><p className="text-xs text-gray-500">{c.type}</p></div>
                          <span className="text-xl font-bold text-purple-600">¥{c.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========== 订单管理 ========== */}
          {activeModule === 'orders' && (
            <div className="flex-1 bg-white p-4 sm:p-6 overflow-auto">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-lg sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3"><span className="text-2xl sm:text-3xl">📋</span> 订单管理</h2>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4 mb-4 sm:mb-6">
                  {[
                    { label: '今日订单', value: orders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString()).length, icon: '📝', color: 'bg-blue-500' },
                    { label: '待支付', value: orders.filter(o => o.status === 'pending').length, icon: '⏳', color: 'bg-yellow-500' },
                    { label: '已完成', value: orders.filter(o => o.status === 'paid').length, icon: '✅', color: 'bg-green-500' },
                    { label: '已取消', value: orders.filter(o => o.status === 'cancelled').length, icon: '❌', color: 'bg-red-500' },
                    { label: '今日营收', value: `¥${orders.filter(o => o.status === 'paid' && new Date(o.createdAt).toDateString() === new Date().toDateString()).reduce((sum, o) => sum + o.finalAmount, 0).toFixed(2)}`, icon: '💰', color: 'bg-purple-500' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-xl p-4 shadow-sm border">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center text-xl`}>{stat.icon}</div>
                        <div><p className="text-gray-500 text-xs">{stat.label}</p><p className="text-xl font-bold">{stat.value}</p></div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-xl shadow-sm border">
                  <div className="p-4 border-b flex gap-2 flex-wrap">
                    {['全部', '待支付', '已完成', '已取消', '已挂单'].map((tab, i) => (
                      <button key={i} className={`px-4 py-2 rounded-lg text-sm ${i === 0 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{tab}</button>
                    ))}
                    <div className="flex-1"></div>
                    <input type="date" className="px-3 py-2 border rounded-lg text-sm" />
                    <input type="text" placeholder="搜索订单号..." className="px-3 py-2 border rounded-lg text-sm" />
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">搜索</button>
                  </div>
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">订单号</th><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">时间</th><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">商品数</th><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">金额</th><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">支付方式</th><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">状态</th><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">操作</th></tr>
                    </thead>
                    <tbody className="divide-y">
                      {orders.map(order => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-mono text-sm">{order.orderNo}</td>
                          <td className="px-4 py-3 text-gray-500 text-sm">{new Date(order.createdAt).toLocaleString()}</td>
                          <td className="px-4 py-3">{order.items.length}</td>
                          <td className="px-4 py-3 text-red-600 font-semibold">¥{order.finalAmount.toFixed(2)}</td>
                          <td className="px-4 py-3 text-gray-500">{order.payMethod === 'wechat' ? '微信' : order.payMethod === 'alipay' ? '支付宝' : order.payMethod === 'cash' ? '现金' : order.payMethod === 'unionpay' ? '云闪付' : order.payMethod === 'member' ? '会员' : '-'}</td>
                          <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs ${order.status === 'paid' ? 'bg-green-100 text-green-600' : order.status === 'pending' ? 'bg-yellow-100 text-yellow-600' : order.status === 'suspended' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'}`}>{order.status === 'paid' ? '已完成' : order.status === 'pending' ? '待支付' : order.status === 'suspended' ? '已挂单' : '已取消'}</span></td>
                          <td className="px-4 py-3"><button className="text-blue-600 hover:text-blue-800 text-sm mr-2">详情</button><button className="text-gray-500 hover:text-gray-700 text-sm">打印</button></td>
                        </tr>
                      ))}
                      {orders.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">暂无订单记录</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========== 配送管理 ========== */}
          {activeModule === 'delivery' && (
            <div className="flex-1 bg-gray-50 p-4 sm:p-6 overflow-auto">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-lg sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3"><span className="text-2xl sm:text-3xl">🚚</span> 配送管理</h2>
                
                {/* 统计卡片 */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4 mb-4 sm:mb-6">
                  {[
                    { label: '待处理', value: 8, icon: '📋', color: 'bg-yellow-500' },
                    { label: '配送中', value: 5, icon: '🚛', color: 'bg-blue-500' },
                    { label: '已完成', value: 42, icon: '✅', color: 'bg-green-500' },
                    { label: '异常', value: 2, icon: '⚠️', color: 'bg-red-500' },
                    { label: '今日营收', value: '¥3,580', icon: '💰', color: 'bg-purple-500' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-xl p-4 shadow-sm border">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center text-xl`}>{stat.icon}</div>
                        <div><p className="text-gray-500 text-xs">{stat.label}</p><p className="text-xl font-bold">{stat.value}</p></div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 订单类型标签 */}
                <div className="bg-white rounded-xl shadow-sm border mb-6">
                  <div className="border-b">
                    <div className="flex">
                      {[
                        { id: 'store', name: '门店调拨', icon: '🏪', count: 3 },
                        { id: 'mini', name: '小程序订单', icon: '📱', count: 5 },
                        { id: 'group', name: '社团接龙', icon: '👥', count: 2 },
                        { id: 'meituan', name: '美团', icon: '🟠', count: 4 },
                        { id: 'elem', name: '饿了么', icon: '🔵', count: 3 },
                        { id: 'all', name: '全部', icon: '📦', count: 17 },
                      ].map((tab, i) => (
                        <button key={tab.id} className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${i === 0 ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}>
                          <span className="mr-2">{tab.icon}</span>{tab.name}
                          <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${tab.count > 0 ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-500'}`}>{tab.count}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* 订单列表 */}
                  <div className="divide-y">
                    {/* 小程序订单 */}
                    <div className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-xl">📱</span>
                          <div>
                            <p className="font-medium">小程序订单</p>
                            <p className="text-xs text-gray-500">订单号: M20240117001 | 张江店</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm text-gray-500">商品数: 5件</p>
                            <p className="font-bold text-red-600">¥89.50</p>
                          </div>
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">待配送</span>
                          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">接单</button>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 text-sm">
                        <p><span className="text-gray-500">收货人:</span> 李小明 | <span className="text-gray-500">电话:</span> 138****8888</p>
                        <p><span className="text-gray-500">地址:</span> 上海市浦东新区张江镇科苑路88号</p>
                        <p><span className="text-gray-500">备注:</span> 请尽快送达</p>
                      </div>
                    </div>

                    {/* 社团接龙订单 */}
                    <div className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-xl">👥</span>
                          <div>
                            <p className="font-medium">社团接龙 - 新鲜水果团购</p>
                            <p className="text-xs text-gray-500">接龙号: GR20240117001 | 团长: 王阿姨 | 已接龙: 23人</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm text-gray-500">商品数: 1件</p>
                            <p className="font-bold text-red-600">¥460.00</p>
                          </div>
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">备货中</span>
                          <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">查看详情</button>
                        </div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3 text-sm">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-green-700 font-medium">🍎 红富士苹果 10斤装</span>
                          <span className="text-green-600">x23 份</span>
                        </div>
                        <p><span className="text-gray-500">提货时间:</span> 今日 18:00-20:00 | <span className="text-gray-500">提货点:</span> 张江店</p>
                      </div>
                    </div>

                    {/* 美团订单 */}
                    <div className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-xl">🟠</span>
                          <div>
                            <p className="font-medium">美团外卖</p>
                            <p className="text-xs text-gray-500">订单号: MT20240117001 | 骑手: 待分配</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm text-gray-500">商品数: 3件</p>
                            <p className="font-bold text-red-600">¥56.80</p>
                          </div>
                          <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">新订单</span>
                          <button className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600">接单</button>
                        </div>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-3 text-sm">
                        <p><span className="text-gray-500">商品:</span> 农夫山泉x2 + 康师傅方便面x1</p>
                        <p><span className="text-gray-500">地址:</span> 上海市浦东新区张江镇碧波路690号</p>
                        <p><span className="text-orange-600 font-medium">预计送达: 30分钟内</span></p>
                      </div>
                    </div>

                    {/* 饿了么订单 */}
                    <div className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-xl">🔵</span>
                          <div>
                            <p className="font-medium">饿了么</p>
                            <p className="text-xs text-gray-500">订单号: ELM20240117001 | 骑手: 李师傅</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm text-gray-500">商品数: 2件</p>
                            <p className="font-bold text-red-600">¥38.50</p>
                          </div>
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">配送中</span>
                          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">跟踪</button>
                        </div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3 text-sm">
                        <p><span className="text-gray-500">商品:</span> 可口可乐x1 + 薯片x1</p>
                        <p><span className="text-gray-500">地址:</span> 上海市浦东新区张江镇祖冲之路230号</p>
                        <p><span className="text-blue-600 font-medium">骑手位置: 距离您500米</span></p>
                      </div>
                    </div>

                    {/* 门店调拨 */}
                    <div className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-xl">🏪</span>
                          <div>
                            <p className="font-medium">门店调拨 - 总仓→张江店</p>
                            <p className="text-xs text-gray-500">调拨单号: TR20240117001 | 配送司机: 张师傅</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm text-gray-500">商品数: 15种</p>
                            <p className="font-bold text-purple-600">¥2,580.00</p>
                          </div>
                          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">配送中</span>
                          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700">查看</button>
                        </div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3 text-sm">
                        <p><span className="text-gray-500">出发时间:</span> 09:30 | <span className="text-gray-500">预计到达:</span> 10:30</p>
                        <p><span className="text-gray-500">商品:</span> 饮料、零食、日用品等15种商品</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 快捷操作 */}
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { name: '创建小程序订单', icon: '📱', color: 'bg-blue-500', desc: '手动创建小程序配送订单' },
                    { name: '发起社团接龙', icon: '👥', color: 'bg-green-500', desc: '创建新的社区团购活动' },
                    { name: '对接外卖平台', icon: '🟠', color: 'bg-orange-500', desc: '连接美团/饿了么自动接单' },
                    { name: '配送调度', icon: '📍', color: 'bg-purple-500', desc: '调度配送员和骑手' },
                  ].map((action, i) => (
                    <button key={i} className="bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition text-left">
                      <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center text-2xl mb-3`}>{action.icon}</div>
                      <p className="font-bold mb-1">{action.name}</p>
                      <p className="text-sm text-gray-500">{action.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========== 报表中心 ========== */}
          {activeModule === 'reports' && (
            <div className="flex-1 bg-gray-50 p-4 sm:p-6 overflow-auto">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-lg sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3"><span className="text-2xl sm:text-3xl">📊</span> 报表中心</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
                  {[
                    { label: '今日营收', value: '¥12,580', icon: '💰', color: 'bg-green-500', change: '+15%' },
                    { label: '今日订单', value: '186', icon: '📝', color: 'bg-blue-500', change: '+8%' },
                    { label: '客单价', value: '¥67.63', icon: '🛒', color: 'bg-purple-500', change: '+3%' },
                    { label: '毛利率', value: '23.5%', icon: '📈', color: 'bg-orange-500', change: '+1.2%' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-xl p-4 shadow-sm border">
                      <div className="flex items-center justify-between mb-3">
                        <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center text-xl`}>{stat.icon}</div>
                        <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">{stat.change}</span>
                      </div>
                      <p className="text-gray-500 text-sm">{stat.label}</p>
                      <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div className="bg-white rounded-xl shadow-sm border p-4">
                    <h3 className="font-semibold mb-4">销售趋势</h3>
                    <div className="h-48 flex items-end justify-around gap-2">
                      {['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map((day, i) => {
                        const heights = [60, 75, 45, 80, 65, 90, 70];
                        return (
                          <div key={i} className="flex flex-col items-center gap-2">
                            <div className="w-10 bg-gradient-to-t from-blue-500 to-blue-300 rounded-t" style={{ height: `${heights[i]}%` }}></div>
                            <span className="text-xs text-gray-500">{day}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border p-4">
                    <h3 className="font-semibold mb-4">商品销售排行</h3>
                    <div className="space-y-3">
                      {[{ name: '农夫山泉', sales: 156, icon: '💧' }, { name: '红南京', sales: 98, icon: '🚬' }, { name: '康师傅方便面', sales: 87, icon: '🍜' }, { name: '可比克薯片', sales: 76, icon: '🍿' }, { name: '奥利奥', sales: 65, icon: '🍪' }].map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i < 3 ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-600'}`}>{i + 1}</span>
                          <span className="text-lg">{item.icon}</span>
                          <span className="flex-1 font-medium">{item.name}</span>
                          <span className="text-gray-500 text-sm">{item.sales}件</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-6 mb-6">
                  <div className="bg-white rounded-xl shadow-sm border p-4">
                    <h3 className="font-semibold mb-4">时段分析</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-500">早高峰 7-9点</span><span className="font-medium">18%</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">午间 11-13点</span><span className="font-medium">25%</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">下午 14-17点</span><span className="font-medium">15%</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">晚高峰 17-20点</span><span className="font-medium">30%</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">夜间 20-23点</span><span className="font-medium">12%</span></div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border p-4">
                    <h3 className="font-semibold mb-4">支付方式</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center"><span className="text-gray-500">微信支付</span><span className="font-medium">45%</span><div className="w-24 h-2 bg-gray-100 rounded"><div className="w-[45%] h-full bg-green-500 rounded"></div></div></div>
                      <div className="flex justify-between items-center"><span className="text-gray-500">支付宝</span><span className="font-medium">35%</span><div className="w-24 h-2 bg-gray-100 rounded"><div className="w-[35%] h-full bg-blue-500 rounded"></div></div></div>
                      <div className="flex justify-between items-center"><span className="text-gray-500">现金</span><span className="font-medium">12%</span><div className="w-24 h-2 bg-gray-100 rounded"><div className="w-[12%] h-full bg-yellow-500 rounded"></div></div></div>
                      <div className="flex justify-between items-center"><span className="text-gray-500">云闪付</span><span className="font-medium">8%</span><div className="w-24 h-2 bg-gray-100 rounded"><div className="w-[8%] h-full bg-red-500 rounded"></div></div></div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border p-4">
                    <h3 className="font-semibold mb-4">毛利分析</h3>
                    <div className="space-y-3">
                      <div><p className="text-sm text-gray-500 mb-1">综合毛利率</p><p className="text-2xl font-bold text-green-600">23.5%</p></div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-blue-50 rounded p-2"><p className="text-gray-500 text-xs">食品类</p><p className="font-semibold">25.8%</p></div>
                        <div className="bg-orange-50 rounded p-2"><p className="text-gray-500 text-xs">饮料类</p><p className="font-semibold">32.1%</p></div>
                        <div className="bg-purple-50 rounded p-2"><p className="text-gray-500 text-xs">烟草类</p><p className="font-semibold">18.5%</p></div>
                        <div className="bg-gray-50 rounded p-2"><p className="text-gray-500 text-xs">日用品</p><p className="font-semibold">28.3%</p></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border">
                  <div className="p-4 border-b flex items-center justify-between">
                    <h3 className="font-semibold">财务报表</h3>
                    <div className="flex gap-2">
                      <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">导出Excel</button>
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">打印</button>
                    </div>
                  </div>
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">日期</th><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">销售额</th><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">成本</th><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">毛利</th><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">毛利率</th></tr>
                    </thead>
                    <tbody className="divide-y">
                      {[{ date: '2024-01-17', sales: 12580, cost: 9629, profit: 2951 }, { date: '2024-01-16', sales: 11250, cost: 8615, profit: 2635 }, { date: '2024-01-15', sales: 10890, cost: 8335, profit: 2555 }].map((row, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-3">{row.date}</td>
                          <td className="px-4 py-3 text-red-600 font-medium">¥{row.sales.toLocaleString()}</td>
                          <td className="px-4 py-3">¥{row.cost.toLocaleString()}</td>
                          <td className="px-4 py-3 text-green-600 font-medium">¥{row.profit.toLocaleString()}</td>
                          <td className="px-4 py-3 text-blue-600">{(row.profit / row.sales * 100).toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========== 会员管理 ========== */}
          {activeModule === 'member' && (
            <div className="flex-1 bg-gray-50 p-4 sm:p-6 overflow-auto">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-lg sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3"><span className="text-2xl sm:text-3xl">👥</span> 会员管理</h2>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4 mb-4 sm:mb-6">
                  {[
                    { label: '会员总数', value: '1,286', icon: '👥', color: 'bg-blue-500' },
                    { label: '新增会员', value: '+23', icon: '🆕', color: 'bg-green-500' },
                    { label: '活跃会员', value: '856', icon: '🔥', color: 'bg-orange-500' },
                    { label: '沉睡会员', value: '430', icon: '💤', color: 'bg-gray-500' },
                    { label: '本月积分', value: '58,920', icon: '⭐', color: 'bg-yellow-500' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-xl p-4 shadow-sm border">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center text-xl`}>{stat.icon}</div>
                        <div><p className="text-gray-500 text-xs">{stat.label}</p><p className="text-xl font-bold">{stat.value}</p></div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {[
                    { level: 'diamond', name: '钻石会员', count: 45, color: 'bg-gradient-to-br from-purple-500 to-pink-500', icon: '💎', discount: '9折', rights: ['全品类9折', '2倍积分', '专属客服'] },
                    { level: 'gold', name: '金卡会员', count: 156, color: 'bg-gradient-to-br from-yellow-500 to-orange-500', icon: '🥇', discount: '95折', rights: ['全品类95折', '1.5倍积分', '生日礼券'] },
                    { level: 'silver', name: '银卡会员', count: 389, color: 'bg-gradient-to-br from-gray-400 to-gray-500', icon: '🥈', discount: '98折', rights: ['全品类98折', '1.2倍积分'] },
                    { level: 'normal', name: '普通会员', count: 696, color: 'bg-gradient-to-br from-blue-400 to-blue-500', icon: '🎫', discount: '原价', rights: ['1倍积分', '参与活动'] },
                  ].map((tier, i) => (
                    <div key={i} className={`${tier.color} text-white rounded-xl p-4`}>
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-3xl">{tier.icon}</span>
                        <div><p className="font-bold">{tier.name}</p><p className="text-sm opacity-80">{tier.count}人</p></div>
                      </div>
                      <div className="bg-white/20 rounded-lg p-3 space-y-1">
                        <p className="text-sm font-medium">{tier.discount}</p>
                        {tier.rights.map((r, j) => <p key={j} className="text-xs opacity-90">• {r}</p>)}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-xl shadow-sm border mb-6">
                  <div className="p-4 border-b flex items-center justify-between">
                    <h3 className="font-semibold">会员列表</h3>
                    <div className="flex gap-2">
                      <select className="px-3 py-2 border rounded-lg text-sm">
                        <option value="">全部等级</option>
                        <option value="diamond">钻石会员</option>
                        <option value="gold">金卡会员</option>
                        <option value="silver">银卡会员</option>
                        <option value="normal">普通会员</option>
                      </select>
                      <input type="text" placeholder="搜索手机号/姓名..." className="px-3 py-2 border rounded-lg text-sm" />
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">搜索</button>
                      <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">+ 新增会员</button>
                    </div>
                  </div>
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">会员信息</th><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">手机号</th><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">等级</th><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">积分</th><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">余额</th><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">消费金额</th><th className="px-4 py-3 text-left text-sm font-medium text-gray-500">操作</th></tr>
                    </thead>
                    <tbody className="divide-y">
                      {useMemberStore.getState().members.map((m, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-3 flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">{m.name.slice(0, 1)}</div>
                            <span className="font-medium">{m.name}</span>
                          </td>
                          <td className="px-4 py-3 text-gray-500 font-mono">{m.phone}</td>
                          <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs ${m.level === 'diamond' ? 'bg-purple-100 text-purple-600' : m.level === 'gold' ? 'bg-yellow-100 text-yellow-600' : m.level === 'silver' ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-600'}`}>{m.level === 'diamond' ? '💎钻石' : m.level === 'gold' ? '🥇金卡' : m.level === 'silver' ? '🥈银卡' : '普通'}</span></td>
                          <td className="px-4 py-3 text-orange-600">{m.points.toLocaleString()}</td>
                          <td className="px-4 py-3 text-green-600">¥{m.balance.toFixed(2)}</td>
                          <td className="px-4 py-3">¥{m.totalSpent.toLocaleString()}</td>
                          <td className="px-4 py-3"><button className="text-blue-600 hover:text-blue-800 text-sm mr-2">详情</button><button className="text-gray-500 hover:text-gray-700 text-sm">充值</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl shadow-sm border p-4">
                    <h3 className="font-semibold mb-4">积分规则</h3>
                    <div className="space-y-3">
                      {[{ action: '消费1元', points: '1分', level: '普通' }, { action: '消费1元', points: '1.2分', level: '银卡' }, { action: '消费1元', points: '1.5分', level: '金卡' }, { action: '消费1元', points: '2分', level: '钻石' }].map((rule, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span>{rule.action}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-orange-600 font-semibold">{rule.points}</span>
                            <span className="text-xs text-gray-500">({rule.level})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border p-4">
                    <h3 className="font-semibold mb-4">会员活动</h3>
                    <div className="space-y-3">
                      {[{ name: '生日双倍积分', status: '进行中', icon: '🎂' }, { name: '新会员首充送积分', status: '进行中', icon: '🎁' }, { name: '周末积分翻倍', status: '未开始', icon: '📅' }].map((act, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{act.icon}</span>
                            <span className="font-medium">{act.name}</span>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs ${act.status === '进行中' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>{act.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* 底部 */}
      <div className="bg-black/30 text-center py-1.5 sm:py-3"><p className="text-blue-200/60 text-xs sm:text-sm">{hasItems ? '收银完成请出示付款码' : '如有疑问请联系店员'}</p></div>

      {/* 设备与设置面板 */}
      {showDevicePanel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-[500px] max-h-[85vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">设备与设置</h3>
              <button onClick={() => setShowDevicePanel(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              
              {/* 常用设置 */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4">
                <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                  <span>⚙️</span> 常用设置
                </h4>
                <div className="space-y-3">
                  {/* 设备自动连接 */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">设备自动连接</p>
                      <p className="text-xs text-gray-500">开启后自动连接已配置设备</p>
                    </div>
                    <button 
                      onClick={() => deviceConfig.setAutoConnect(!deviceConfig.autoConnect)}
                      className={`w-12 h-6 rounded-full transition ${deviceConfig.autoConnect ? 'bg-blue-500' : 'bg-gray-300'}`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full shadow transition ${deviceConfig.autoConnect ? 'translate-x-6' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                  
                  {/* 打印小票 */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">打印小票</p>
                      <p className="text-xs text-gray-500">交易完成后自动打印</p>
                    </div>
                    <button 
                      onClick={() => deviceConfig.setPrintReceipt(!deviceConfig.printReceipt)}
                      className={`w-12 h-6 rounded-full transition ${deviceConfig.printReceipt ? 'bg-blue-500' : 'bg-gray-300'}`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full shadow transition ${deviceConfig.printReceipt ? 'translate-x-6' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                  
                  {/* AI条码识别 */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">AI条码识别</p>
                      <p className="text-xs text-gray-500">未知条码联网查询商品库</p>
                    </div>
                    <button 
                      onClick={() => deviceConfig.setAIBarcode(!deviceConfig.aiBarcode)}
                      className={`w-12 h-6 rounded-full transition ${deviceConfig.aiBarcode ? 'bg-blue-500' : 'bg-gray-300'}`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full shadow transition ${deviceConfig.aiBarcode ? 'translate-x-6' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                  
                  {/* AI视觉称重 */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">AI视觉称重</p>
                      <p className="text-xs text-gray-500">非标品摄像头识别重量</p>
                    </div>
                    <button 
                      onClick={() => deviceConfig.setAIVision(!deviceConfig.aiVision)}
                      className={`w-12 h-6 rounded-full transition ${deviceConfig.aiVision ? 'bg-blue-500' : 'bg-gray-300'}`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full shadow transition ${deviceConfig.aiVision ? 'translate-x-6' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                  
                  {/* 晚8点清货 */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">晚8点清货</p>
                      <p className="text-xs text-gray-500">20:00-23:00自动8折</p>
                    </div>
                    <button 
                      onClick={() => deviceConfig.setClearanceMode(!deviceConfig.clearanceMode)}
                      className={`w-12 h-6 rounded-full transition ${deviceConfig.clearanceMode ? 'bg-green-500' : 'bg-gray-300'}`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full shadow transition ${deviceConfig.clearanceMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* 设备管理 */}
              <div>
                <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                  <span>📱</span> 收银设备
                </h4>
                
                {/* 手动连接按钮 */}
                <button 
                  onClick={connectDevices}
                  disabled={isConnectingDevices}
                  className="w-full py-2.5 mb-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                >
                  {isConnectingDevices ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>连接中...</>
                  ) : (
                    <>🔄 刷新连接</>
                  )}
                </button>
                
                {/* 设备列表 */}
                {[
                  { name: '扫码枪', icon: '📷', status: deviceStatuses.scannerEnabled, key: 'scanner' },
                  { name: '小票打印机', icon: '🖨️', status: deviceStatuses.printerConnected, key: 'printer' },
                  { name: '标签打印机', icon: '🏷️', status: deviceStatuses.labelPrinterConnected, key: 'labelPrinter' },
                  { name: '电子秤', icon: '⚖️', status: deviceStatuses.scaleConnected, key: 'scale' },
                ].map((device, i) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-lg mb-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{device.icon}</span>
                        <div>
                          <p className="font-medium">{device.name}</p>
                          <p className="text-xs text-gray-500">
                            {device.status ? '🟢 已连接' : '⚪ 未连接'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {device.key === 'printer' && deviceConfig.receiptPrinter.enabled ? (
                          <button 
                            onClick={() => {
                              setEditingDeviceConfig(editingDeviceConfig === device.key ? null : device.key);
                              setTempDeviceConfig({ 
                                address: deviceConfig.receiptPrinter.address, 
                                port: deviceConfig.receiptPrinter.port 
                              });
                            }}
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                          >
                            {editingDeviceConfig === device.key ? '收起' : '配置'}
                          </button>
                        ) : device.key === 'scale' && deviceConfig.scale.enabled ? (
                          <button 
                            onClick={() => {
                              setEditingDeviceConfig(editingDeviceConfig === device.key ? null : device.key);
                              setTempDeviceConfig({ 
                                address: deviceConfig.scale.address, 
                                port: deviceConfig.scale.tcpPort || deviceConfig.scale.port 
                              });
                            }}
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                          >
                            {editingDeviceConfig === device.key ? '收起' : '配置'}
                          </button>
                        ) : null}
                        <span className={`px-3 py-1 rounded-full text-sm ${device.status ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                          {device.status ? '已连接' : '未连接'}
                        </span>
                      </div>
                    </div>
                    
                    {/* 设备配置输入 */}
                    {editingDeviceConfig === device.key && (
                      <div className="mt-2 pt-2 border-t border-gray-200 space-y-2">
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="IP地址 (如 192.168.1.100)"
                            value={tempDeviceConfig.address}
                            onChange={(e) => setTempDeviceConfig({ ...tempDeviceConfig, address: e.target.value })}
                            className="flex-1 px-2 py-1 text-sm border rounded"
                          />
                          <input 
                            type="number" 
                            placeholder="端口"
                            value={tempDeviceConfig.port}
                            onChange={(e) => setTempDeviceConfig({ ...tempDeviceConfig, port: parseInt(e.target.value) || 9100 })}
                            className="w-20 px-2 py-1 text-sm border rounded"
                          />
                        </div>
                        <button 
                          onClick={() => {
                            if (device.key === 'printer') {
                              deviceConfig.updateConfig('receiptPrinter', tempDeviceConfig);
                            } else if (device.key === 'scale') {
                              deviceConfig.updateConfig('scale', { ...tempDeviceConfig, tcpPort: tempDeviceConfig.port });
                            }
                            setEditingDeviceConfig(null);
                            connectDevices();
                          }}
                          className="w-full py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                        >
                          保存并重连
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="text-center text-xs text-gray-400 pt-2">
                💡 提示：小票打印机和电子秤需要配置IP地址
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 挂单取单弹窗 */}
      {showSuspendedModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-[500px] max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">挂单/取单</h3>
              <button onClick={() => setShowSuspendedModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
            <div className="p-4">
              {suspendedOrders.length === 0 ? (
                <div className="text-center text-gray-400 py-8"><p className="text-4xl mb-4">📋</p><p>暂无挂单</p></div>
              ) : (
                <div className="space-y-2">
                  {suspendedOrders.map(order => (
                    <button key={order.id} onClick={() => handleResumeOrder(order.id)} className="w-full p-3 bg-gray-50 rounded-lg text-left hover:bg-gray-100">
                      <div className="flex justify-between"><span className="font-medium">{order.orderNo}</span><span className="text-red-600">¥{order.finalAmount.toFixed(2)}</span></div>
                      <p className="text-xs text-gray-500 mt-1">{order.items.length}件商品 | {new Date(order.createdAt).toLocaleString()}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 会员识别弹窗 */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-96 p-6">
            <h3 className="text-lg font-semibold mb-4">会员识别</h3>
            <input type="text" placeholder="输入手机号或会员卡号" value={memberPhone} onChange={(e) => setMemberPhone(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleMemberSearch()} className="w-full px-4 py-3 border rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500" autoFocus />
            <div className="flex gap-3">
              <button onClick={() => setShowMemberModal(false)} className="flex-1 py-2 bg-gray-100 rounded-xl">取消</button>
              <button onClick={handleMemberSearch} className="flex-1 py-2 bg-blue-500 text-white rounded-xl">确认</button>
            </div>
          </div>
        </div>
      )}

      {/* 支付弹窗 */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-96 p-6">
            <h3 className="text-lg font-semibold mb-4">选择支付方式</h3>
            <div className="space-y-3">
              {[
                { id: 'wechat', name: '微信支付', icon: '💳', color: 'bg-green-500' },
                { id: 'alipay', name: '支付宝', icon: '💰', color: 'bg-blue-500' },
                { id: 'unionpay', name: '云闪付', icon: '🏦', color: 'bg-red-500' },
                { id: 'cash', name: '现金', icon: '💵', color: 'bg-yellow-500' },
                ...(currentMember && currentMember.balance > 0 ? [{ id: 'member', name: `会员卡 (余额¥${currentMember.balance})`, icon: '👤', color: 'bg-purple-500' }] : []),
              ].map(pay => (
                <button key={pay.id} onClick={() => setSelectedPay(pay.id)} className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition ${selectedPay === pay.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <span className={`w-10 h-10 ${pay.color} rounded-lg flex items-center justify-center text-xl`}>{pay.icon}</span>
                  <span className="font-medium">{pay.name}</span>
                  {selectedPay === pay.id && <svg className="w-6 h-6 text-blue-500 ml-auto" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowPayModal(false)} className="flex-1 py-3 border rounded-lg">取消</button>
              <button onClick={handlePay} disabled={!selectedPay || isProcessing} className="flex-1 py-3 bg-green-600 text-white rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
                {isProcessing ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>处理中...</> : <>确认收款 ¥{totals.total.toFixed(2)}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 添加商品弹窗 */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-[500px] max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-green-600 to-emerald-600 text-white">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🤖</span>
                <div>
                  <h3 className="font-semibold text-lg">AI智能添加商品</h3>
                  <p className="text-sm opacity-80">条码已自动识别，AI正在匹配商品信息</p>
                </div>
              </div>
              <button onClick={() => { setShowAddProductModal(false); setAiScanResult(null); }} className="text-white/80 hover:text-white text-2xl">×</button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-80px)]">
              {/* AI识别状态 */}
              {ai识别中 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-center gap-3">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-blue-700 font-medium">AI正在识别商品信息...</span>
                </div>
              )}
              
              {/* 条码自动填充 */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">条码 (已自动填充)</label>
                  <button onClick={() => handleBarcodeAi识别(newProduct.barcode)} className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1">
                    <span>🔄</span> 重新识别
                  </button>
                </div>
                <input type="text" value={newProduct.barcode} onChange={(e) => setNewProduct({...newProduct, barcode: e.target.value})} placeholder="扫描或输入条码" className="w-full px-3 py-2 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white font-mono text-lg" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">商品名称 * <span className="text-green-600 text-xs">(AI已识别)</span></label>
                  <input type="text" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} placeholder="请输入商品名称" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">商品分类</label>
                  <select value={newProduct.category} onChange={(e) => setNewProduct({...newProduct, category: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                    <option value="食品">食品</option>
                    <option value="饮料">饮料</option>
                    <option value="日用品">日用品</option>
                    <option value="烟草">烟草</option>
                    <option value="酒类">酒类</option>
                    <option value="生鲜">生鲜</option>
                    <option value="其他">其他</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">供应商</label>
                  <input type="text" value={newProduct.supplier} onChange={(e) => setNewProduct({...newProduct, supplier: e.target.value})} placeholder="请输入供应商" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">零售价(元) *</label>
                  <input type="number" value={newProduct.retailPrice || ''} onChange={(e) => setNewProduct({...newProduct, retailPrice: parseFloat(e.target.value) || 0})} placeholder="0.00" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">进价(元)</label>
                  <input type="number" value={newProduct.costPrice || ''} onChange={(e) => setNewProduct({...newProduct, costPrice: parseFloat(e.target.value) || 0})} placeholder="0.00" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">商品类型</label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={newProduct.isStandard} onChange={() => setNewProduct({...newProduct, isStandard: true})} className="w-4 h-4 text-green-600" />
                      <span className="text-sm">标准品</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={!newProduct.isStandard} onChange={() => setNewProduct({...newProduct, isStandard: false})} className="w-4 h-4 text-green-600" />
                      <span className="text-sm">称重商品</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700">
                <p className="font-medium mb-1 flex items-center gap-2"><span>💡</span> 提示：</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>条码已自动填充，AI正在识别商品信息</li>
                  <li>商品将同步到总部商品库</li>
                  <li>添加后自动加入当前购物车</li>
                </ul>
              </div>
              <div className="flex gap-3 pt-4 border-t">
                <button onClick={() => { setShowAddProductModal(false); setAiScanResult(null); setNewProduct({ name: '', barcode: '', category: '食品', retailPrice: 0, costPrice: 0, isStandard: true, supplier: '' }); }} className="flex-1 py-3 border rounded-lg hover:bg-gray-50">取消</button>
                <button onClick={handleAddNewProduct} disabled={!newProduct.name || !newProduct.barcode || newProduct.retailPrice <= 0} className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed">确认添加</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 支付成功 */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-80 p-8 text-center">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h3 className="text-xl font-semibold text-green-600">支付成功</h3>
            <p className="text-gray-500 mt-2 text-2xl font-bold">¥{totals.total.toFixed(2)}</p>
            <p className="text-sm text-gray-400 mt-1">{selectedPay === 'cash' ? '现金' : selectedPay === 'wechat' ? '微信' : selectedPay === 'alipay' ? '支付宝' : selectedPay === 'unionpay' ? '云闪付' : selectedPay === 'member' ? '会员卡' : ''}</p>
            <button onClick={() => setShowSuccess(false)} className="mt-6 w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">完成</button>
          </div>
        </div>
      )}
    </div>
  );
}
