'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  QrCode,
  Package,
  Scale,
  Package2,
  BarChart,
  AlertTriangle,
  Sparkles,
  Loader2,
  ScanLine,
  X,
  Save,
  Copy,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProductImageManager } from '@/components/product-image-manager';

// ============== 类型定义 ==============

type ProductType = 'standard' | 'weighted' | 'counted';

interface ProductSpec {
  id: string;
  name: string;
  barcode: string;
  price: number;
  stock: number;
  unit: string;
  costPrice?: number;
}

interface Product {
  id: string;
  name: string;
  category: string;
  type: ProductType;
  hasBarcode: boolean;
  isWeighted: boolean;
  isCounted: boolean;
  status: 'active' | 'inactive';
  costPrice: number;
  minStock: number;
  maxStock: number;
  limitQuantity?: number;
  description?: string;
  imageUrl?: string;       // 商品图片URL
  imageKey?: string;       // 商品图片存储key
  specs: ProductSpec[];
  createTime: string;
  updateTime: string;
}

// ============== 模拟数据 ==============

const mockCategories = [
  { id: 'cat-1', name: '饮品' },
  { id: 'cat-2', name: '零食' },
  { id: 'cat-3', name: '水果' },
  { id: 'cat-4', name: '日用品' },
  { id: 'cat-5', name: '方便食品' },
  { id: 'cat-6', name: '乳制品' },
  { id: 'cat-7', name: '蔬菜' },
  { id: 'cat-8', name: '肉类' },
  { id: 'cat-9', name: '冷冻食品' },
  { id: 'cat-10', name: '酒水' },
  { id: 'cat-11', name: '烟草' },
  { id: 'cat-12', name: '其他' },
];

// 常用单位列表
const commonUnits = [
  '个', '瓶', '袋', '盒', '包', '罐', '斤', '克', 'kg', '升', 'ml', '支', '件', '箱', '份', '组', '套', '张', '本', '条'
];

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const initialProducts: Product[] = [
  {
    id: 'prod-1',
    name: '可口可乐',
    category: '饮品',
    type: 'standard',
    hasBarcode: true,
    isWeighted: false,
    isCounted: false,
    status: 'active',
    costPrice: 1.50,
    minStock: 30,
    maxStock: 150,
    limitQuantity: 10,
    description: '可口可乐碳酸饮料，多种规格可选',
    specs: [
      { id: 'spec-1-1', name: '330ml 罐装', barcode: '6901234567891', price: 3.50, stock: 80, unit: '罐', costPrice: 1.50 },
      { id: 'spec-1-2', name: '500ml 瓶装', barcode: '6901234567892', price: 4.50, stock: 120, unit: '瓶', costPrice: 2.00 },
      { id: 'spec-1-3', name: '1.25L 瓶装', barcode: '6901234567893', price: 8.00, stock: 45, unit: '瓶', costPrice: 3.50 },
    ],
    createTime: '2024-01-15 10:00:00',
    updateTime: '2024-03-10 14:30:00',
  },
  {
    id: 'prod-2',
    name: '薯片',
    category: '零食',
    type: 'standard',
    hasBarcode: true,
    isWeighted: false,
    isCounted: false,
    status: 'active',
    costPrice: 3.50,
    minStock: 20,
    maxStock: 80,
    limitQuantity: 5,
    description: '乐事薯片，多种口味可选',
    specs: [
      { id: 'spec-2-1', name: '原味 70g', barcode: '6901234567894', price: 8.00, stock: 25, unit: '包', costPrice: 3.50 },
      { id: 'spec-2-2', name: '番茄味 70g', barcode: '6901234567895', price: 8.00, stock: 30, unit: '包', costPrice: 3.50 },
      { id: 'spec-2-3', name: '黄瓜味 70g', barcode: '6901234567896', price: 8.00, stock: 20, unit: '包', costPrice: 3.50 },
    ],
    createTime: '2024-02-20 09:00:00',
    updateTime: '2024-03-08 16:00:00',
  },
  {
    id: 'prod-3',
    name: '矿泉水 550ml',
    category: '饮品',
    type: 'standard',
    hasBarcode: true,
    isWeighted: false,
    isCounted: false,
    status: 'active',
    costPrice: 0.80,
    minStock: 30,
    maxStock: 300,
    limitQuantity: 20,
    description: '农夫山泉纯天然矿泉水',
    specs: [
      { id: 'spec-3-1', name: '标准装', barcode: '6901234567890', price: 2.00, stock: 150, unit: '瓶', costPrice: 0.80 },
    ],
    createTime: '2024-01-10 08:00:00',
    updateTime: '2024-03-14 11:00:00',
  },
  {
    id: 'prod-4',
    name: '香蕉',
    category: '水果',
    type: 'weighted',
    hasBarcode: false,
    isWeighted: true,
    isCounted: false,
    status: 'active',
    costPrice: 4.00,
    minStock: 20,
    maxStock: 100,
    description: '新鲜香蕉，按斤称重',
    specs: [
      { id: 'spec-4-1', name: '散装', barcode: '', price: 6.00, stock: 50, unit: '斤', costPrice: 4.00 },
    ],
    createTime: '2024-03-01 07:00:00',
    updateTime: '2024-03-15 06:00:00',
  },
  {
    id: 'prod-5',
    name: '纸巾',
    category: '日用品',
    type: 'counted',
    hasBarcode: true,
    isWeighted: false,
    isCounted: true,
    status: 'active',
    costPrice: 5.00,
    minStock: 10,
    maxStock: 50,
    description: '维达抽纸，100抽/包',
    specs: [
      { id: 'spec-5-1', name: '单包', barcode: '6902367288888', price: 12.90, stock: 30, unit: '包', costPrice: 5.00 },
      { id: 'spec-5-2', name: '3包装', barcode: '6902367288889', price: 35.00, stock: 15, unit: '组', costPrice: 14.00 },
    ],
    createTime: '2024-02-01 10:00:00',
    updateTime: '2024-03-12 15:00:00',
  },
];

// ============== 主页面组件 ==============

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'standard' | 'weighted' | 'counted'>('all');
  const [activeTab, setActiveTab] = useState('list');
  
  // 从API加载商品数据
  useEffect(() => {
    loadProducts();
  }, []);
  
  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/store-products/');
      const result = await response.json();
      
      if (result.success && result.data) {
        // 转换数据格式
        const loadedProducts = result.data.map((p: Record<string, unknown>) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          type: p.type,
          hasBarcode: p.has_barcode ?? p.hasBarcode ?? true,
          isWeighted: p.is_weighted ?? p.isWeighted ?? false,
          isCounted: p.is_counted ?? p.isCounted ?? false,
          status: p.status,
          costPrice: p.cost_price ?? p.costPrice ?? 0,
          minStock: p.min_stock ?? p.minStock ?? 10,
          maxStock: p.max_stock ?? p.maxStock ?? 100,
          limitQuantity: p.limit_quantity ?? p.limitQuantity,
          description: p.description,
          specs: p.specs || [],
          createTime: p.create_time || p.createTime,
          updateTime: p.update_time || p.updateTime,
        }));
        setProducts(loadedProducts);
      } else {
        // 如果API失败，使用初始数据
        setProducts(initialProducts);
      }
    } catch (error) {
      console.error('加载商品失败:', error);
      // 出错时使用初始数据
      setProducts(initialProducts);
    } finally {
      setLoading(false);
    }
  };

  // 对话框状态
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [specDialogOpen, setSpecDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteSpecDialogOpen, setDeleteSpecDialogOpen] = useState(false);

  // 当前操作的商品/规格
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSpec, setSelectedSpec] = useState<{ productId: string; spec: ProductSpec } | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [specToDelete, setSpecToDelete] = useState<{ productId: string; specId: string } | null>(null);

  // AI条码搜索状态
  const [aiScanDialogOpen, setAiScanDialogOpen] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiProductInfo, setAiProductInfo] = useState<{
    barcode: string;
    name: string;
    brand?: string;
    category?: string;
    specification?: string;
    unit?: string;
    price?: number;
    description?: string;
    manufacturer?: string;
    imageUrl?: string;
    confidence: number;
    source?: 'local' | 'headquarters' | 'web_search';
  } | null>(null);
  const [aiError, setAiError] = useState('');
  const [existingProductWarning, setExistingProductWarning] = useState<Product | null>(null);

  // 导入导出状态
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: number;
    failed: number;
    skipped: number;
    errors: string[];
  } | null>(null);
  const [updateExisting, setUpdateExisting] = useState(false);

  // 筛选商品
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.includes(searchTerm) ||
        product.specs.some(s => s.barcode && s.barcode.includes(searchTerm));
      const matchesType = filterType === 'all' || product.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [products, searchTerm, filterType]);

  // 统计数据
  const stats = useMemo(() => ({
    total: products.length,
    multiSpec: products.filter(p => p.specs.length > 1).length,
    standard: products.filter(p => p.type === 'standard').length,
    weighted: products.filter(p => p.type === 'weighted').length,
    counted: products.filter(p => p.type === 'counted').length,
    lowStock: products.filter(p => {
      const totalStock = p.specs.reduce((sum, s) => sum + s.stock, 0);
      return totalStock < p.minStock;
    }).length,
  }), [products]);

  // 打开新增商品对话框
  const handleAddProduct = () => {
    setSelectedProduct(null);
    setProductDialogOpen(true);
  };

  // 打开编辑商品对话框
  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setProductDialogOpen(true);
  };

  // 保存商品
  const handleSaveProduct = async (productData: Partial<Product>) => {
    const now = new Date().toLocaleString();

    try {
      if (selectedProduct) {
        // 编辑模式 - 调用API更新
        const response = await fetch('/api/store-products/', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: selectedProduct.id,
            ...productData,
          }),
        });
        
        const result = await response.json();
        
        if (result.success) {
          // 更新本地状态
          setProducts(products.map(p =>
            p.id === selectedProduct.id
              ? { ...p, ...productData, updateTime: now }
              : p
          ));
        } else {
          console.error('保存失败:', result.error);
          alert('保存失败: ' + result.error);
          return;
        }
      } else {
        // 新增模式 - 调用API创建
        const response = await fetch('/api/store-products/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData),
        });
        
        const result = await response.json();
        
        if (result.success && result.data) {
          // 将API返回的商品添加到本地状态
          const newProduct: Product = {
            id: result.data.id,
            name: result.data.name,
            category: result.data.category,
            type: result.data.type,
            hasBarcode: result.data.hasBarcode,
            isWeighted: result.data.isWeighted,
            isCounted: result.data.isCounted,
            status: result.data.status,
            costPrice: result.data.costPrice,
            minStock: result.data.minStock,
            maxStock: result.data.maxStock,
            limitQuantity: result.data.limitQuantity,
            description: result.data.description,
            imageUrl: result.data.imageUrl,
            imageKey: result.data.imageKey,
            specs: result.data.specs || [],
            createTime: result.data.createTime,
            updateTime: result.data.updateTime,
          };
          setProducts([...products, newProduct]);
        } else {
          console.error('保存失败:', result.error);
          alert('保存失败: ' + result.error);
          return;
        }
      }
      setProductDialogOpen(false);
    } catch (error) {
      console.error('保存商品失败:', error);
      alert('保存失败，请稍后重试');
    }
  };

  // 确认删除商品
  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    
    try {
      // 调用API删除
      const response = await fetch(`/api/store-products/?id=${productToDelete.id}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (result.success) {
        setProducts(products.filter(p => p.id !== productToDelete.id));
      } else {
        console.error('删除失败:', result.error);
        alert('删除失败: ' + result.error);
      }
      
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    } catch (error) {
      console.error('删除商品失败:', error);
      alert('删除失败，请稍后重试');
    }
  };

  // 打开添加规格对话框
  const handleAddSpec = (productId: string) => {
    setSelectedSpec({ productId, spec: { id: '', name: '', barcode: '', price: 0, stock: 0, unit: '个' } });
    setSpecDialogOpen(true);
  };

  // 打开编辑规格对话框
  const handleEditSpec = (productId: string, spec: ProductSpec) => {
    setSelectedSpec({ productId, spec });
    setSpecDialogOpen(true);
  };

  // 保存规格
  const handleSaveSpec = (specData: ProductSpec) => {
    if (!selectedSpec) return;

    setProducts(products.map(p => {
      if (p.id !== selectedSpec.productId) return p;

      const now = new Date().toLocaleString();
      const existingIndex = p.specs.findIndex(s => s.id === selectedSpec.spec.id);

      let newSpecs: ProductSpec[];
      if (existingIndex >= 0) {
        // 编辑规格
        newSpecs = p.specs.map((s, i) => i === existingIndex ? { ...s, ...specData } : s);
      } else {
        // 新增规格
        newSpecs = [...p.specs, { ...specData, id: generateId() }];
      }

      return { ...p, specs: newSpecs, updateTime: now };
    }));

    setSpecDialogOpen(false);
    setSelectedSpec(null);
  };

  // 确认删除规格
  const handleDeleteSpec = () => {
    if (!specToDelete) return;

    setProducts(products.map(p => {
      if (p.id !== specToDelete.productId) return p;

      const now = new Date().toLocaleString();
      return {
        ...p,
        specs: p.specs.filter(s => s.id !== specToDelete.specId),
        updateTime: now,
      };
    }));

    setDeleteSpecDialogOpen(false);
    setSpecToDelete(null);
  };

  // AI条码搜索
  const handleAIScan = async () => {
    if (!barcodeInput.trim()) {
      setAiError('请输入商品条码');
      return;
    }

    setAiLoading(true);
    setAiError('');
    setAiProductInfo(null);
    setExistingProductWarning(null);

    const barcode = barcodeInput.trim();

    // 1. 首先检查本地商品库是否已存在该条码
    const existingProduct = products.find(p => 
      p.specs.some(s => s.barcode === barcode)
    );
    
    if (existingProduct) {
      setExistingProductWarning(existingProduct);
      setAiLoading(false);
      return;
    }

    // 2. 调用API搜索（总部库 → Web搜索）
    try {
      const response = await fetch('/api/products/scan-barcode/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        // 检查是否有有效的商品信息（名称不为空）
        if (data.data.name && data.data.name.trim() !== '') {
          // 根据confidence判断数据来源
          let source: 'local' | 'headquarters' | 'web_search' = 'web_search';
          if (data.data.confidence >= 0.95) {
            source = 'local';
          } else if (data.data.confidence >= 0.9 || data.data.source === 'headquarters') {
            source = 'headquarters';
          }
          
          setAiProductInfo({
            ...data.data,
            source,
          });
        } else {
          // 识别成功但没有找到商品信息
          setAiError(`未找到条码 ${barcode} 的商品信息，请手动输入商品信息或配置第三方条码识别API`);
        }
      } else {
        setAiError(data.error || '识别失败，请稍后重试');
      }
    } catch (error) {
      setAiError('网络错误，请稍后重试');
    } finally {
      setAiLoading(false);
    }
  };

  // 使用AI识别结果创建商品
  const handleUseAIResult = () => {
    if (!aiProductInfo) return;

    // 构建商品名称（包含品牌）
    const productName = aiProductInfo.brand 
      ? `${aiProductInfo.brand} ${aiProductInfo.name}` 
      : aiProductInfo.name || '';

    // 构建商品描述（包含厂家信息）
    const descriptionParts: string[] = [];
    if (aiProductInfo.brand) descriptionParts.push(`品牌：${aiProductInfo.brand}`);
    if (aiProductInfo.manufacturer) descriptionParts.push(`厂家：${aiProductInfo.manufacturer}`);
    if (aiProductInfo.description) descriptionParts.push(aiProductInfo.description);

    setSelectedProduct({
      id: '',
      name: productName,
      category: aiProductInfo.category || '饮品',
      type: 'standard',
      hasBarcode: true,
      isWeighted: false,
      isCounted: false,
      status: 'active',
      costPrice: 0,
      minStock: 10,
      maxStock: 100,
      description: descriptionParts.join(' | '),
      specs: [{
        id: '',
        name: aiProductInfo.specification || '标准装',
        barcode: aiProductInfo.barcode,
        price: aiProductInfo.price || 0,
        stock: 0,
        unit: aiProductInfo.unit || '个',
      }],
      createTime: '',
      updateTime: '',
    });
    setAiScanDialogOpen(false);
    setProductDialogOpen(true);
  };

  // 导出商品 - 默认Excel格式
  const handleExport = async () => {
    try {
      // 添加时间戳避免缓存
      const timestamp = Date.now();
      const response = await fetch(`/api/products/export?storeId=default&t=${timestamp}`);
      
      if (!response.ok) {
        const error = await response.json();
        alert(error.error || '导出失败');
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `商品列表_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请稍后重试');
    }
  };

  // 导入商品
  const handleImport = async () => {
    if (!importFile) {
      alert('请选择要导入的文件');
      return;
    }

    setImportLoading(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('storeId', 'default');
      formData.append('updateExisting', updateExisting.toString());

      const response = await fetch('/api/products/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setImportResult(result.data);
        // 刷新商品列表
        await loadProducts();
      } else {
        alert(result.error || '导入失败');
      }
    } catch (error) {
      console.error('导入失败:', error);
      alert('导入失败，请稍后重试');
    } finally {
      setImportLoading(false);
    }
  };

  // 下载导入模板 - Excel格式
  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/products/export?storeId=template');
      
      if (!response.ok) {
        // 如果没有模板数据，创建一个示例Excel
        const templateData = [
          {
            '商品名称': '示例商品A',
            '分类': '饮品',
            '商品类型': '标品',
            '状态': '上架',
            '规格名称': '500ml',
            '条码': '6901234567890',
            '单位': '瓶',
            '进货价': 2.5,
            '售价': 3.5,
            '库存': 100,
            '最低库存': 20,
            '最高库存': 200,
            '限购数量': '',
            '描述': '示例描述',
          },
          {
            '商品名称': '示例商品B',
            '分类': '零食',
            '商品类型': '标品',
            '状态': '上架',
            '规格名称': '大包',
            '条码': '6901234567891',
            '单位': '包',
            '进货价': 5,
            '售价': 8,
            '库存': 50,
            '最低库存': 10,
            '最高库存': 100,
            '限购数量': 5,
            '描述': '',
          },
        ];

        // 动态导入xlsx库
        const XLSX = await import('xlsx');
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(templateData);
        XLSX.utils.book_append_sheet(workbook, worksheet, '商品导入模板');
        const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '商品导入模板.xlsx';
        a.click();
        URL.revokeObjectURL(url);
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = '商品导入模板.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('下载模板失败:', error);
      alert('下载模板失败，请稍后重试');
    }
  };

  // 获取商品类型标签
  const getTypeBadge = (product: Product) => {
    if (product.isWeighted) {
      return <Badge className="bg-orange-500">称重</Badge>;
    }
    if (product.isCounted) {
      return <Badge className="bg-blue-500">计件</Badge>;
    }
    return <Badge>标品</Badge>;
  };

  // 获取商品类型图标
  const getTypeIcon = (product: Product) => {
    if (product.isWeighted) {
      return <Scale className="h-4 w-4 text-orange-500" />;
    }
    if (product.isCounted) {
      return <Package2 className="h-4 w-4 text-blue-500" />;
    }
    return <Package className="h-4 w-4 text-gray-500" />;
  };

  // 获取库存状态
  const getStockStatus = (stock: number, minStock: number) => {
    if (stock === 0) {
      return <Badge variant="destructive">缺货</Badge>;
    } else if (stock < minStock) {
      return <Badge className="bg-yellow-500">库存不足</Badge>;
    }
    return <Badge className="bg-green-500">充足</Badge>;
  };

  // 计算总库存
  const getTotalStock = (product: Product) => {
    return product.specs.reduce((sum, spec) => sum + spec.stock, 0);
  };

  return (
    <div className="flex-1 flex flex-col">
      <PageHeader title="商品管理" description="管理店铺所有商品信息，支持多规格、批量导入导出" />

      <div className="flex-1 overflow-auto p-6">
        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <Package className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-xs text-muted-foreground">商品总数</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                  <Package2 className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.multiSpec}</div>
                  <div className="text-xs text-muted-foreground">多规格商品</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                  <BarChart className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.standard}</div>
                  <div className="text-xs text-muted-foreground">标品</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                  <Scale className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.weighted}</div>
                  <div className="text-xs text-muted-foreground">称重</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-100">
                  <Package2 className="h-5 w-5 text-cyan-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.counted}</div>
                  <div className="text-xs text-muted-foreground">计件</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.lowStock}</div>
                  <div className="text-xs text-muted-foreground">库存不足</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 操作栏 */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 w-full md:w-auto">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索商品名称或条码"
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant={filterType === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('all')}
                >
                  全部
                </Button>
                <Button
                  variant={filterType === 'standard' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('standard')}
                >
                  标品
                </Button>
                <Button
                  variant={filterType === 'weighted' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('weighted')}
                >
                  称重
                </Button>
                <Button
                  variant={filterType === 'counted' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('counted')}
                >
                  计件
                </Button>
              </div>

              <div className="flex items-center gap-2">
                {/* 导入按钮 */}
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setImportFile(null);
                    setImportResult(null);
                    setImportDialogOpen(true);
                  }}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  导入
                </Button>

                {/* 导出Excel */}
                <Button variant="outline" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  导出Excel
                </Button>

                <Button
                  variant="outline"
                  className="bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100"
                  onClick={() => setAiScanDialogOpen(true)}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  AI条码搜索
                </Button>

                <Button onClick={handleAddProduct}>
                  <Plus className="h-4 w-4 mr-2" />
                  新增商品
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 商品列表 */}
        <Card>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b px-4 pt-4">
              <TabsList>
                <TabsTrigger value="list">商品列表</TabsTrigger>
                <TabsTrigger value="specs">多规格管理</TabsTrigger>
              </TabsList>
            </div>

            <CardContent className="p-4">
              <TabsContent value="list" className="mt-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">图标</TableHead>
                        <TableHead>商品信息</TableHead>
                        <TableHead>分类</TableHead>
                        <TableHead>类型</TableHead>
                        <TableHead>库存</TableHead>
                        <TableHead>限购</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((product) => {
                        const totalStock = getTotalStock(product);
                        return (
                          <TableRow key={product.id}>
                            <TableCell>
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted overflow-hidden">
                                {product.imageUrl ? (
                                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                  getTypeIcon(product)
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{product.name}</div>
                                {product.specs.length > 1 && (
                                  <Badge variant="outline" className="text-xs mt-1">
                                    {product.specs.length} 个规格
                                  </Badge>
                                )}
                                {product.description && (
                                  <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                    {product.description}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{product.category}</Badge>
                            </TableCell>
                            <TableCell>
                              {getTypeBadge(product)}
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{totalStock}</div>
                              <div className="text-xs mt-1">
                                {getStockStatus(totalStock, product.minStock)}
                              </div>
                            </TableCell>
                            <TableCell>
                              {product.limitQuantity ? (
                                <Badge className="bg-yellow-500">
                                  限购 {product.limitQuantity}
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">不限</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                                {product.status === 'active' ? '上架' : '下架'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditProduct(product)}
                                  title="编辑"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive"
                                  onClick={() => {
                                    setProductToDelete(product);
                                    setDeleteDialogOpen(true);
                                  }}
                                  title="删除"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>

                  {filteredProducts.length === 0 && (
                    <div className="text-center py-12">
                      <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500">暂无商品</p>
                      <Button className="mt-4" onClick={handleAddProduct}>
                        <Plus className="h-4 w-4 mr-2" />
                        新增商品
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="specs" className="mt-0">
                <div className="space-y-4">
                  {products.filter(p => p.specs.length > 0).map((product) => (
                    <Card key={product.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-semibold">{product.name}</h4>
                            <p className="text-sm text-muted-foreground">{product.description}</p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleAddSpec(product.id)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            添加规格
                          </Button>
                        </div>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>规格名称</TableHead>
                                <TableHead>条码</TableHead>
                                <TableHead>成本价</TableHead>
                                <TableHead>售价</TableHead>
                                <TableHead>库存</TableHead>
                                <TableHead>单位</TableHead>
                                <TableHead className="text-right">操作</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {product.specs.map((spec) => (
                                <TableRow key={spec.id}>
                                  <TableCell className="font-medium">{spec.name}</TableCell>
                                  <TableCell>
                                    {spec.barcode ? (
                                      <code className="text-xs bg-muted px-2 py-1 rounded">
                                        {spec.barcode}
                                      </code>
                                    ) : (
                                      <span className="text-xs text-muted-foreground">无条码</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    ¥{(spec.costPrice || product.costPrice).toFixed(2)}
                                  </TableCell>
                                  <TableCell className="text-green-600 font-medium">
                                    ¥{spec.price.toFixed(2)}
                                  </TableCell>
                                  <TableCell>
                                    <div className="font-medium">{spec.stock}</div>
                                    {spec.stock < product.minStock && (
                                      <Badge className="bg-yellow-500 text-xs mt-1">
                                        库存不足
                                      </Badge>
                                    )}
                                  </TableCell>
                                  <TableCell>{spec.unit}</TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEditSpec(product.id, spec)}
                                        title="编辑"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive"
                                        onClick={() => {
                                          setSpecToDelete({ productId: product.id, specId: spec.id });
                                          setDeleteSpecDialogOpen(true);
                                        }}
                                        title="删除"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {products.length === 0 && (
                    <div className="text-center py-12">
                      <Package2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500">暂无商品</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>

      {/* 商品表单对话框 */}
      <ProductFormDialog
        open={productDialogOpen}
        onOpenChange={setProductDialogOpen}
        product={selectedProduct}
        categories={mockCategories}
        onSave={handleSaveProduct}
      />

      {/* 规格表单对话框 */}
      <SpecFormDialog
        open={specDialogOpen}
        onOpenChange={setSpecDialogOpen}
        spec={selectedSpec?.spec}
        onSave={handleSaveSpec}
      />

      {/* AI条码搜索对话框 */}
      <Dialog open={aiScanDialogOpen} onOpenChange={setAiScanDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              AI条码识别商品
            </DialogTitle>
            <DialogDescription>
              输入商品条码，系统将优先搜索商品库，如无则AI搜索外部网络
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="请输入商品条码"
                  className="pl-9"
                  value={barcodeInput}
                  onChange={(e) => {
                    setBarcodeInput(e.target.value);
                    setExistingProductWarning(null);
                    setAiProductInfo(null);
                    setAiError('');
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleAIScan()}
                />
              </div>
              <Button onClick={handleAIScan} disabled={aiLoading}>
                {aiLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>

            {aiError && (
              <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
                {aiError}
              </div>
            )}

            {/* 商品库已存在提示 */}
            {existingProductWarning && (
              <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium text-yellow-800">商品库已存在此条码</div>
                    <div className="mt-2 text-sm text-yellow-700">
                      <div className="font-medium">{existingProductWarning.name}</div>
                      <div className="text-yellow-600 mt-1">
                        分类：{existingProductWarning.category} | 
                        规格：{existingProductWarning.specs.find(s => s.barcode === barcodeInput)?.name || '-'}
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="mt-3"
                      onClick={() => {
                        handleEditProduct(existingProductWarning);
                        setAiScanDialogOpen(false);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      编辑现有商品
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {aiProductInfo && (
              <div className="space-y-3">
                {/* 数据来源提示 */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-green-600">识别成功</span>
                    {aiProductInfo.source === 'local' && (
                      <Badge className="bg-blue-500">本地商品库</Badge>
                    )}
                    {aiProductInfo.source === 'headquarters' && (
                      <Badge className="bg-purple-500">总部商品库</Badge>
                    )}
                    {aiProductInfo.source === 'web_search' && (
                      <Badge className="bg-orange-500">AI网络搜索</Badge>
                    )}
                  </div>
                  <Badge className="bg-green-500">
                    置信度 {Math.round(aiProductInfo.confidence * 100)}%
                  </Badge>
                </div>

                {/* 商品图片展示 */}
                {aiProductInfo.imageUrl && (
                  <div className="p-3 rounded-lg bg-muted/50 flex justify-center">
                    <img 
                      src={aiProductInfo.imageUrl} 
                      alt={aiProductInfo.name}
                      className="h-32 w-auto object-contain rounded border"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-muted-foreground mb-1">商品名称</div>
                    <div className="font-medium">{aiProductInfo.name || '-'}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-muted-foreground mb-1">品牌</div>
                    <div className="font-medium">{aiProductInfo.brand || '-'}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-muted-foreground mb-1">分类</div>
                    <div className="font-medium">{aiProductInfo.category || '-'}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-muted-foreground mb-1">规格</div>
                    <div className="font-medium">{aiProductInfo.specification || '-'}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-muted-foreground mb-1">单位</div>
                    <div className="font-medium">{aiProductInfo.unit || '-'}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-muted-foreground mb-1">建议售价</div>
                    <div className="font-medium text-green-600">
                      {aiProductInfo.price ? `¥${aiProductInfo.price.toFixed(2)}` : '-'}
                    </div>
                  </div>
                  {/* 新增：生产厂家信息 */}
                  {aiProductInfo.manufacturer && (
                    <div className="p-3 rounded-lg bg-muted/50 col-span-2">
                      <div className="text-muted-foreground mb-1">生产厂家</div>
                      <div className="font-medium">{aiProductInfo.manufacturer}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAiScanDialogOpen(false)}>
              取消
            </Button>
            {aiProductInfo && (
              <Button onClick={handleUseAIResult}>
                <Plus className="h-4 w-4 mr-1" />
                使用此信息创建商品
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除商品确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除商品「{productToDelete?.name}」吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProductToDelete(null)}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProduct}
              className="bg-red-600 hover:bg-red-700"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 删除规格确认对话框 */}
      <AlertDialog open={deleteSpecDialogOpen} onOpenChange={setDeleteSpecDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除规格</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除此规格吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSpecToDelete(null)}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSpec}
              className="bg-red-600 hover:bg-red-700"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 商品导入对话框 */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              批量导入商品
            </DialogTitle>
            <DialogDescription>
              支持Excel(.xlsx/.xls)和CSV格式文件，推荐使用Excel格式
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* 下载模板 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 mb-2">第一步：下载导入模板</p>
              <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                下载CSV模板
              </Button>
            </div>

            {/* 上传文件 */}
            <div className="space-y-2">
              <p className="text-sm font-medium">第二步：选择要导入的文件</p>
              <div className="border-2 border-dashed rounded-lg p-4">
                <Input
                  type="file"
                  accept=".csv,.xls,.xlsx,.json"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImportFile(file);
                      setImportResult(null);
                    }
                  }}
                />
                {importFile && (
                  <p className="text-sm text-green-600 mt-2">
                    已选择: {importFile.name}
                  </p>
                )}
              </div>
            </div>

            {/* 导入选项 */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="update-existing"
                checked={updateExisting}
                onCheckedChange={(checked) => setUpdateExisting(checked as boolean)}
              />
              <Label htmlFor="update-existing" className="text-sm">
                更新已存在的商品（同名商品将被覆盖）
              </Label>
            </div>

            {/* 导入结果 */}
            {importResult && (
              <div className={`border rounded-lg p-4 ${importResult.failed > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {importResult.failed > 0 ? (
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                  <span className="font-medium">导入完成</span>
                </div>
                <div className="text-sm space-y-1">
                  <p className="text-green-600">✓ 成功导入: {importResult.success} 条</p>
                  {importResult.skipped > 0 && (
                    <p className="text-gray-600">○ 跳过: {importResult.skipped} 条（已存在）</p>
                  )}
                  {importResult.failed > 0 && (
                    <p className="text-red-600">✗ 失败: {importResult.failed} 条</p>
                  )}
                </div>
                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="mt-2 text-xs text-red-600 max-h-24 overflow-y-auto">
                    {importResult.errors.slice(0, 5).map((err, i) => (
                      <p key={i}>• {err}</p>
                    ))}
                    {importResult.errors.length > 5 && (
                      <p>...还有 {importResult.errors.length - 5} 条错误</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              关闭
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={!importFile || importLoading}
            >
              {importLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  导入中...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  开始导入
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============== 商品表单对话框组件 ==============

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  categories: { id: string; name: string }[];
  onSave: (product: Partial<Product>) => void;
}

function ProductFormDialog({ open, onOpenChange, product, categories, onSave }: ProductFormDialogProps) {
  const [formData, setFormData] = useState<Partial<Product>>({});
  const [specs, setSpecs] = useState<ProductSpec[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 条码扫描相关状态
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState('');
  const [scanSuccess, setScanSuccess] = useState(false);
  const [autoScanEnabled, setAutoScanEnabled] = useState(true);

  // 初始化表单数据
  const initForm = useCallback(() => {
    if (product) {
      setFormData({
        name: product.name,
        category: product.category,
        type: product.type,
        status: product.status,
        costPrice: product.costPrice,
        minStock: product.minStock,
        maxStock: product.maxStock,
        limitQuantity: product.limitQuantity,
        description: product.description,
        imageUrl: product.imageUrl,
        imageKey: product.imageKey,
      });
      setSpecs(product.specs.length > 0 ? [...product.specs] : [{ id: generateId(), name: '标准装', barcode: '', price: 0, stock: 0, unit: '个' }]);
    } else {
      setFormData({
        name: '',
        category: '饮品',
        type: 'standard',
        status: 'active',
        costPrice: 0,
        minStock: 10,
        maxStock: 100,
        imageUrl: '',
        imageKey: '',
      });
      setSpecs([{ id: generateId(), name: '标准装', barcode: '', price: 0, stock: 0, unit: '个' }]);
    }
    setErrors({});
    setBarcodeInput('');
    setScanError('');
    setScanSuccess(false);
  }, [product]);

  // 条码扫描处理
  const handleScanBarcode = async (barcode?: string) => {
    const code = barcode || barcodeInput.trim();
    if (!code) {
      setScanError('请输入商品条码');
      return;
    }

    setScanLoading(true);
    setScanError('');
    setScanSuccess(false);

    try {
      const response = await fetch('/api/products/scan-barcode/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode: code }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        const info = data.data;
        
        // 自动填充表单
        setFormData(prev => ({
          ...prev,
          name: info.name || prev.name,
          category: info.category || prev.category,
          description: info.description || prev.description,
        }));

        // 自动填充第一个规格（无论是否已有条码，都更新识别到的信息）
        if (specs.length > 0) {
          const newSpecs = [...specs];
          newSpecs[0] = {
            ...newSpecs[0],
            barcode: code,
            name: info.specification || newSpecs[0].name || '标准装',
            price: info.price || newSpecs[0].price,
            unit: info.unit || newSpecs[0].unit || '个',
          };
          setSpecs(newSpecs);
        }

        setScanSuccess(true);
        setBarcodeInput(code);
        
        // 3秒后清除成功提示
        setTimeout(() => setScanSuccess(false), 3000);
      } else {
        setScanError(data.error || '识别失败，请手动填写商品信息');
      }
    } catch (error) {
      setScanError('网络错误，请稍后重试');
    } finally {
      setScanLoading(false);
    }
  };

  // 扫码枪自动扫描支持（监听键盘输入）
  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleScanBarcode();
    }
  };

  // 自动扫描模式：监听全局键盘输入（扫码枪通常快速输入条码后按回车）
  const handleAutoScan = useCallback((e: KeyboardEvent) => {
    if (!open || !autoScanEnabled) return;
    
    // 忽略在输入框中的输入
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

    // 扫码枪通常在短时间内输入完整条码然后按回车
    // 这里我们收集输入并检测回车
  }, [open, autoScanEnabled]);

  // 对话框打开时初始化
  useEffect(() => {
    if (open) {
      initForm();
    }
  }, [open, product?.id]); // 只在对话框打开或商品ID变化时重新初始化

  // 更新表单字段
  const updateField = (field: keyof Product, value: unknown) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  // 添加规格
  const addSpec = () => {
    setSpecs([...specs, { id: generateId(), name: '', barcode: '', price: 0, stock: 0, unit: '个' }]);
  };

  // 删除规格
  const removeSpec = (index: number) => {
    if (specs.length > 1) {
      setSpecs(specs.filter((_, i) => i !== index));
    }
  };

  // 更新规格
  const updateSpec = (index: number, field: keyof ProductSpec, value: string | number) => {
    const newSpecs = [...specs];
    newSpecs[index] = { ...newSpecs[index], [field]: value };
    setSpecs(newSpecs);
  };

  // 验证表单
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = '请输入商品名称';
    }
    if (!formData.category) {
      newErrors.category = '请选择商品分类';
    }
    if ((formData.costPrice ?? 0) < 0) {
      newErrors.costPrice = '成本价不能为负数';
    }
    if ((formData.minStock ?? 0) < 0) {
      newErrors.minStock = '最低库存不能为负数';
    }
    if ((formData.maxStock ?? 0) < (formData.minStock ?? 0)) {
      newErrors.maxStock = '最高库存不能小于最低库存';
    }

    // 验证规格
    specs.forEach((spec, index) => {
      if (!spec.name.trim()) {
        newErrors[`spec-${index}-name`] = '请输入规格名称';
      }
      if (spec.price <= 0) {
        newErrors[`spec-${index}-price`] = '售价必须大于0';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 提交表单
  const handleSubmit = () => {
    if (!validateForm()) return;

    onSave({
      ...formData,
      specs,
      hasBarcode: formData.type !== 'weighted',
      isWeighted: formData.type === 'weighted',
      isCounted: formData.type === 'counted',
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onOpenChange(false); }}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{product ? '编辑商品' : '新增商品'}</DialogTitle>
          <DialogDescription>
            填写商品基本信息和规格详情
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[60vh] pr-4">
          <div className="space-y-6 py-4">
            {/* 条码扫描区域 */}
            {!product && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                    <ScanLine className="h-4 w-4" />
                    扫描条码自动填充
                  </h4>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="autoScan"
                      checked={autoScanEnabled}
                      onCheckedChange={(checked) => setAutoScanEnabled(checked as boolean)}
                    />
                    <Label htmlFor="autoScan" className="text-xs text-muted-foreground cursor-pointer">
                      自动扫描模式
                    </Label>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      placeholder="请输入或扫描商品条码..."
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      onKeyDown={handleBarcodeKeyDown}
                      className="pr-10"
                    />
                    {barcodeInput && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                        onClick={() => setBarcodeInput('')}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <Button 
                    onClick={() => handleScanBarcode()} 
                    disabled={scanLoading || !barcodeInput.trim()}
                    className="min-w-[100px]"
                  >
                    {scanLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        识别中...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        AI识别
                      </>
                    )}
                  </Button>
                </div>

                {scanError && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{scanError}</span>
                  </div>
                )}

                {scanSuccess && (
                  <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-600 text-sm flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    条码识别成功！商品信息已自动填充，请检查并补充完整信息。
                  </div>
                )}

                <div className="text-xs text-muted-foreground flex items-center gap-4">
                  <span>支持USB扫码枪，扫描后自动识别</span>
                  <span>•</span>
                  <span>可手动输入条码后点击识别</span>
                </div>

                <Separator />
              </div>
            )}

            {/* 基本信息 */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">基本信息</h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>商品名称 *</Label>
                  <Input
                    value={formData.name || ''}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="请输入商品名称"
                  />
                  {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label>商品分类 *</Label>
                  <Select
                    value={formData.category || ''}
                    onValueChange={(v) => updateField('category', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择分类" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && <p className="text-xs text-red-500">{errors.category}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>商品类型</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v) => updateField('type', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">标品（有条码）</SelectItem>
                      <SelectItem value="weighted">称重（无条码）</SelectItem>
                      <SelectItem value="counted">计件（按件计）</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>商品状态</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(v) => updateField('status', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">上架</SelectItem>
                      <SelectItem value="inactive">下架</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>商品描述</Label>
                <Textarea
                  value={formData.description || ''}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="请输入商品描述（可选）"
                  rows={2}
                />
              </div>

              {/* 商品图片管理 */}
              <div className="space-y-2">
                <Label>商品图片</Label>
                <ProductImageManager
                  productId={product?.id || 'new'}
                  productName={product?.name}
                  onImagesChange={(mainImage) => {
                    updateField('imageUrl', mainImage || '');
                  }}
                  compact
                />
              </div>
            </div>

            <Separator />

            {/* 价格与库存 */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">价格与库存设置</h4>

              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>成本价</Label>
                  <Input
                    type="number"
                    value={formData.costPrice || ''}
                    onChange={(e) => updateField('costPrice', Number(e.target.value))}
                    placeholder="0.00"
                  />
                  {errors.costPrice && <p className="text-xs text-red-500">{errors.costPrice}</p>}
                </div>

                <div className="space-y-2">
                  <Label>最低库存</Label>
                  <Input
                    type="number"
                    value={formData.minStock || ''}
                    onChange={(e) => updateField('minStock', Number(e.target.value))}
                    placeholder="10"
                  />
                  {errors.minStock && <p className="text-xs text-red-500">{errors.minStock}</p>}
                </div>

                <div className="space-y-2">
                  <Label>最高库存</Label>
                  <Input
                    type="number"
                    value={formData.maxStock || ''}
                    onChange={(e) => updateField('maxStock', Number(e.target.value))}
                    placeholder="100"
                  />
                  {errors.maxStock && <p className="text-xs text-red-500">{errors.maxStock}</p>}
                </div>

                <div className="space-y-2">
                  <Label>限购数量</Label>
                  <Input
                    type="number"
                    value={formData.limitQuantity || ''}
                    onChange={(e) => updateField('limitQuantity', Number(e.target.value) || undefined)}
                    placeholder="不限"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* 规格管理 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm text-muted-foreground">
                  规格管理 ({specs.length} 个规格)
                </h4>
                <Button variant="outline" size="sm" onClick={addSpec}>
                  <Plus className="h-4 w-4 mr-1" />
                  添加规格
                </Button>
              </div>

              <div className="space-y-3">
                {specs.map((spec, index) => (
                  <Card key={spec.id} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium">规格 {index + 1}</span>
                      {specs.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive h-6 w-6 p-0"
                          onClick={() => removeSpec(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-6 gap-3">
                      <div className="col-span-2 space-y-1">
                        <Label className="text-xs">规格名称 *</Label>
                        <Input
                          value={spec.name}
                          onChange={(e) => updateSpec(index, 'name', e.target.value)}
                          placeholder="如：500ml"
                        />
                        {errors[`spec-${index}-name`] && (
                          <p className="text-xs text-red-500">{errors[`spec-${index}-name`]}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">条码</Label>
                        <Input
                          value={spec.barcode}
                          onChange={(e) => updateSpec(index, 'barcode', e.target.value)}
                          placeholder="商品条码"
                          disabled={formData.type === 'weighted'}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">售价 *</Label>
                        <Input
                          type="number"
                          value={spec.price || ''}
                          onChange={(e) => updateSpec(index, 'price', Number(e.target.value))}
                          placeholder="0.00"
                        />
                        {errors[`spec-${index}-price`] && (
                          <p className="text-xs text-red-500">{errors[`spec-${index}-price`]}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">库存</Label>
                        <Input
                          type="number"
                          value={spec.stock || ''}
                          onChange={(e) => updateSpec(index, 'stock', Number(e.target.value))}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">单位</Label>
                        <Select
                          value={spec.unit}
                          onValueChange={(v) => updateSpec(index, 'unit', v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="选择或输入单位" />
                          </SelectTrigger>
                          <SelectContent>
                            {commonUnits.map((unit) => (
                              <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          value={spec.unit}
                          onChange={(e) => updateSpec(index, 'unit', e.target.value)}
                          placeholder="或自定义输入"
                          className="mt-1 h-8 text-xs"
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit}>
            <Save className="h-4 w-4 mr-2" />
            {product ? '保存修改' : '创建商品'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============== 规格表单对话框组件 ==============

interface SpecFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spec: ProductSpec | undefined;
  onSave: (spec: ProductSpec) => void;
}

function SpecFormDialog({ open, onOpenChange, spec, onSave }: SpecFormDialogProps) {
  const [formData, setFormData] = useState<ProductSpec>({
    id: '',
    name: '',
    barcode: '',
    price: 0,
    stock: 0,
    unit: '个',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 初始化
  useState(() => {
    if (open && spec) {
      setFormData({ ...spec });
    } else if (open) {
      setFormData({ id: generateId(), name: '', barcode: '', price: 0, stock: 0, unit: '个' });
    }
    setErrors({});
  });

  // 监听 open 和 spec 变化
  if (open && spec && formData.id !== spec.id) {
    setFormData({ ...spec });
    setErrors({});
  } else if (open && !spec && formData.id !== '') {
    setFormData({ id: generateId(), name: '', barcode: '', price: 0, stock: 0, unit: '个' });
    setErrors({});
  }

  // 更新字段
  const updateField = (field: keyof ProductSpec, value: string | number) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  // 验证
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = '请输入规格名称';
    }
    if (formData.price <= 0) {
      newErrors.price = '售价必须大于0';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 提交
  const handleSubmit = () => {
    if (!validate()) return;
    onSave(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onOpenChange(false); }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{spec?.id ? '编辑规格' : '添加规格'}</DialogTitle>
          <DialogDescription>
            设置规格的名称、条码、价格和库存
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>规格名称 *</Label>
              <Input
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="如：500ml 瓶装"
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label>条码</Label>
              <Input
                value={formData.barcode}
                onChange={(e) => updateField('barcode', e.target.value)}
                placeholder="商品条码（可选）"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>成本价</Label>
              <Input
                type="number"
                value={formData.costPrice || ''}
                onChange={(e) => updateField('costPrice', Number(e.target.value))}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>售价 *</Label>
              <Input
                type="number"
                value={formData.price || ''}
                onChange={(e) => updateField('price', Number(e.target.value))}
                placeholder="0.00"
              />
              {errors.price && <p className="text-xs text-red-500">{errors.price}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>库存</Label>
              <Input
                type="number"
                value={formData.stock || ''}
                onChange={(e) => updateField('stock', Number(e.target.value))}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>单位</Label>
              <Select
                value={formData.unit}
                onValueChange={(v) => updateField('unit', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="个">个</SelectItem>
                  <SelectItem value="件">件</SelectItem>
                  <SelectItem value="瓶">瓶</SelectItem>
                  <SelectItem value="罐">罐</SelectItem>
                  <SelectItem value="包">包</SelectItem>
                  <SelectItem value="盒">盒</SelectItem>
                  <SelectItem value="袋">袋</SelectItem>
                  <SelectItem value="斤">斤</SelectItem>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="组">组</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit}>
            <Save className="h-4 w-4 mr-2" />
            {spec?.id ? '保存修改' : '添加规格'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
