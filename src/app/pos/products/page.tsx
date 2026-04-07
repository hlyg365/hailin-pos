'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  Package,
  Scale,
  Package2,
  AlertTriangle,
  Sparkles,
  Loader2,
  ScanLine,
  X,
  ArrowLeft,
  Barcode,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePosAuth } from '@/contexts/PosAuthContext';

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
];

// ============== 规格表单组件 ==============

interface SpecFormProps {
  spec: ProductSpec;
  onChange: (spec: ProductSpec) => void;
  isWeighted: boolean;
}

function SpecForm({ spec, onChange, isWeighted }: SpecFormProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-2">
        <Label>规格名称</Label>
        <Input
          value={spec.name}
          onChange={(e) => onChange({ ...spec, name: e.target.value })}
          placeholder="如：500ml"
        />
      </div>
      <div className="space-y-2">
        <Label>条码 {!isWeighted && <span className="text-red-500">*</span>}</Label>
        <Input
          value={spec.barcode}
          onChange={(e) => onChange({ ...spec, barcode: e.target.value })}
          placeholder="商品条码"
        />
      </div>
      <div className="space-y-2">
        <Label>售价</Label>
        <Input
          type="number"
          step="0.01"
          value={spec.price}
          onChange={(e) => onChange({ ...spec, price: parseFloat(e.target.value) || 0 })}
        />
      </div>
      <div className="space-y-2">
        <Label>库存</Label>
        <Input
          type="number"
          value={spec.stock}
          onChange={(e) => onChange({ ...spec, stock: parseInt(e.target.value) || 0 })}
        />
      </div>
      <div className="space-y-2">
        <Label>单位</Label>
        <Select value={spec.unit} onValueChange={(v) => onChange({ ...spec, unit: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="个">个</SelectItem>
            <SelectItem value="瓶">瓶</SelectItem>
            <SelectItem value="罐">罐</SelectItem>
            <SelectItem value="包">包</SelectItem>
            <SelectItem value="袋">袋</SelectItem>
            <SelectItem value="盒">盒</SelectItem>
            <SelectItem value="斤">斤</SelectItem>
            <SelectItem value="kg">kg</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>成本价</Label>
        <Input
          type="number"
          step="0.01"
          value={spec.costPrice || ''}
          onChange={(e) => onChange({ ...spec, costPrice: parseFloat(e.target.value) || undefined })}
          placeholder="选填"
        />
      </div>
    </div>
  );
}

// ============== 商品表单组件 ==============

interface ProductFormProps {
  product: Partial<Product> | null;
  onSave: (data: Partial<Product>) => void;
  onCancel: () => void;
  onScanBarcode: () => void;
}

function ProductForm({ product, onSave, onCancel, onScanBarcode }: ProductFormProps) {
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    category: '饮品',
    type: 'standard',
    status: 'active',
    costPrice: 0,
    minStock: 10,
    maxStock: 100,
    description: '',
    specs: [],
    ...product,
  });

  const [currentSpec, setCurrentSpec] = useState<ProductSpec>({
    id: '',
    name: '标准装',
    barcode: '',
    price: 0,
    stock: 0,
    unit: '个',
  });

  // 监听product变化，更新formData（用于扫码识别后填充表单）
  useEffect(() => {
    if (product && product.name) {
      setFormData({
        name: '',
        category: '饮品',
        type: 'standard',
        status: 'active',
        costPrice: 0,
        minStock: 10,
        maxStock: 100,
        description: '',
        specs: [],
        ...product,
      });
      // 如果有规格信息，设置到currentSpec
      if (product.specs && product.specs.length > 0) {
        setCurrentSpec(product.specs[0]);
      }
    }
  }, [product]);

  const handleAddSpec = () => {
    if (!currentSpec.name) return;
    const newSpec = { ...currentSpec, id: generateId() };
    setFormData({
      ...formData,
      specs: [...(formData.specs || []), newSpec],
    });
    setCurrentSpec({ id: '', name: '', barcode: '', price: 0, stock: 0, unit: '个' });
  };

  const handleRemoveSpec = (index: number) => {
    setFormData({
      ...formData,
      specs: formData.specs?.filter((_, i) => i !== index) || [],
    });
  };

  const handleTypeChange = (type: ProductType) => {
    setFormData({
      ...formData,
      type,
      isWeighted: type === 'weighted',
      isCounted: type === 'counted',
      hasBarcode: type !== 'weighted',
    });
  };

  return (
    <div className="space-y-4">
      {/* 条码扫描区域 */}
      <div className="bg-blue-50 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-blue-700">条码扫描自动识别</span>
          <Button
            variant="outline"
            size="sm"
            onClick={onScanBarcode}
            className="bg-white"
          >
            <ScanLine className="h-4 w-4 mr-1" />
            扫描条码
          </Button>
        </div>
        <p className="text-xs text-blue-600">
          支持扫码枪扫描或手动输入条码，AI自动识别商品信息
        </p>
      </div>

      <Separator />

      {/* 基本信息 */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>商品名称 <span className="text-red-500">*</span></Label>
            <Input
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="输入商品名称"
            />
          </div>
          <div className="space-y-2">
            <Label>商品分类 <span className="text-red-500">*</span></Label>
            <Select
              value={formData.category}
              onValueChange={(v) => setFormData({ ...formData, category: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {mockCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label>商品类型</Label>
            <Select
              value={formData.type}
              onValueChange={(v) => handleTypeChange(v as ProductType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">标品</SelectItem>
                <SelectItem value="weighted">称重</SelectItem>
                <SelectItem value="counted">计件</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>状态</Label>
            <Select
              value={formData.status}
              onValueChange={(v) => setFormData({ ...formData, status: v as 'active' | 'inactive' })}
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
          <div className="space-y-2">
            <Label>成本价</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.costPrice || ''}
              onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label>最低库存</Label>
            <Input
              type="number"
              value={formData.minStock || ''}
              onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-2">
            <Label>最高库存</Label>
            <Input
              type="number"
              value={formData.maxStock || ''}
              onChange={(e) => setFormData({ ...formData, maxStock: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-2">
            <Label>限购数量</Label>
            <Input
              type="number"
              value={formData.limitQuantity || ''}
              onChange={(e) => setFormData({ ...formData, limitQuantity: parseInt(e.target.value) || undefined })}
              placeholder="不限"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>商品描述</Label>
          <Textarea
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="商品描述（选填）"
            rows={2}
          />
        </div>
      </div>

      <Separator />

      {/* 规格管理 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>商品规格</Label>
          <span className="text-xs text-gray-500">支持多规格管理</span>
        </div>

        {/* 已有规格列表 */}
        {formData.specs && formData.specs.length > 0 && (
          <div className="space-y-2">
            {formData.specs.map((spec, index) => (
              <div key={spec.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{spec.name}</span>
                    {spec.barcode && (
                      <Badge variant="outline" className="text-xs">{spec.barcode}</Badge>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    ¥{spec.price.toFixed(2)} · 库存 {spec.stock} {spec.unit}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600"
                  onClick={() => handleRemoveSpec(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* 添加新规格 */}
        <div className="border rounded-lg p-3 space-y-3 bg-gray-50">
          <div className="text-sm font-medium">添加规格</div>
          <SpecForm
            spec={currentSpec}
            onChange={setCurrentSpec}
            isWeighted={formData.type === 'weighted'}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddSpec}
            disabled={!currentSpec.name || (formData.type !== 'weighted' && !currentSpec.barcode)}
          >
            <Plus className="h-4 w-4 mr-1" />
            添加规格
          </Button>
        </div>
      </div>

      <Separator />

      {/* 操作按钮 */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button
          onClick={() => onSave(formData)}
          disabled={!formData.name || !formData.specs?.length}
        >
          保存
        </Button>
      </div>
    </div>
  );
}

// ============== 主页面组件 ==============

export default function PosProductsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = usePosAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  // 对话框状态
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [scanDialogOpen, setScanDialogOpen] = useState(false);

  // 当前操作的商品
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // 条码扫描状态
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
    confidence: number;
  } | null>(null);
  const [aiError, setAiError] = useState('');

  // 获取当前店铺ID
  const storeId = user?.shopId?.toString() || 'default';

  // 从数据库加载商品列表
  useEffect(() => {
    loadProducts();
  }, [storeId]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      // 不传storeId参数，查询所有商品（包括总部新增的商品）
      const response = await fetch('/api/store-products/');
      const result = await response.json();
      
      if (result.success && result.data) {
        // 转换数据格式
        const loadedProducts: Product[] = result.data.map((p: any) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          type: p.type,
          hasBarcode: p.hasBarcode || p.has_barcode,
          isWeighted: p.isWeighted || p.is_weighted,
          isCounted: p.isCounted || p.is_counted,
          status: p.status,
          costPrice: p.costPrice || p.cost_price,
          minStock: p.minStock || p.min_stock,
          maxStock: p.maxStock || p.max_stock,
          limitQuantity: p.limitQuantity || p.limit_quantity,
          description: p.description,
          specs: p.specs || [],
          createTime: p.createTime || p.create_time,
          updateTime: p.updateTime || p.update_time,
        }));
        setProducts(loadedProducts);
      }
    } catch (error) {
      console.error('加载商品失败:', error);
      // 加载失败时使用初始数据
      setProducts(initialProducts);
    } finally {
      setLoading(false);
    }
  };

  // 筛选商品
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.includes(searchTerm) ||
        product.specs.some(s => s.barcode && s.barcode.includes(searchTerm));
      const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, filterCategory]);

  // 统计数据
  const stats = useMemo(() => ({
    total: products.length,
    active: products.filter(p => p.status === 'active').length,
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

    // 判断是否是编辑模式（真实存在的商品，不是扫码识别的临时商品）
    const isEditMode = selectedProduct && 
                       selectedProduct.id && 
                       !selectedProduct.id.startsWith('scan-') &&
                       products.some(p => p.id === selectedProduct.id);

    try {
      if (isEditMode && selectedProduct) {
        // 编辑模式 - 调用API更新
        const response = await fetch('/api/store-products/', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: selectedProduct.id,
            storeId: storeId,
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
        // 新增模式（包括扫码识别的临时商品）- 调用API创建
        const response = await fetch('/api/store-products/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            storeId: storeId,
            ...productData,
          }),
        });
        
        const result = await response.json();
        
        if (result.success && result.data) {
          // 将API返回的商品添加到本地状态
          const newProduct: Product = {
            id: result.data.id,
            name: result.data.name,
            category: result.data.category,
            type: result.data.type,
            hasBarcode: result.data.hasBarcode || result.data.has_barcode,
            isWeighted: result.data.isWeighted || result.data.is_weighted,
            isCounted: result.data.isCounted || result.data.is_counted,
            status: result.data.status,
            costPrice: result.data.costPrice || result.data.cost_price,
            minStock: result.data.minStock || result.data.min_stock,
            maxStock: result.data.maxStock || result.data.max_stock,
            limitQuantity: result.data.limitQuantity || result.data.limit_quantity,
            description: result.data.description,
            specs: result.data.specs || [],
            createTime: result.data.createTime || result.data.create_time,
            updateTime: result.data.updateTime || result.data.update_time,
          };
          setProducts([...products, newProduct]);
          alert('商品保存成功！');
        } else {
          console.error('保存失败:', result.error);
          alert('保存失败: ' + result.error);
          return;
        }
      }
      setProductDialogOpen(false);
      setSelectedProduct(null);
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
        // 从本地状态移除
        setProducts(products.filter(p => p.id !== productToDelete.id));
        setDeleteDialogOpen(false);
        setProductToDelete(null);
        alert('商品删除成功！');
      } else {
        console.error('删除失败:', result.error);
        alert('删除失败: ' + result.error);
      }
    } catch (error) {
      console.error('删除商品失败:', error);
      alert('删除失败，请稍后重试');
    }
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

    try {
      const response = await fetch('/api/products/scan-barcode/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode: barcodeInput.trim() }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        // 检查是否有有效的商品信息（名称不为空）
        if (data.data.name && data.data.name.trim() !== '') {
          setAiProductInfo(data.data);
        } else {
          // 识别成功但没有找到商品信息
          setAiError(`未找到条码 ${barcodeInput.trim()} 的商品信息，请手动输入商品信息`);
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

    // 生成临时ID，用于触发组件重新挂载
    const tempId = `scan-${Date.now()}`;

    setSelectedProduct({
      id: tempId,  // 临时ID，保存时会被忽略
      name: aiProductInfo.name || '',
      category: aiProductInfo.category || '饮品',
      type: 'standard',
      hasBarcode: true,
      isWeighted: false,
      isCounted: false,
      status: 'active',
      costPrice: 0,
      minStock: 10,
      maxStock: 100,
      description: aiProductInfo.description,
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
    setScanDialogOpen(false);
    setProductDialogOpen(true);
    setBarcodeInput('');
    setAiProductInfo(null);
  };

  // 处理扫描条码按钮点击
  const handleOpenScanDialog = () => {
    setProductDialogOpen(false);
    setScanDialogOpen(true);
  };

  // 监听扫码枪输入
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (scanDialogOpen && e.key === 'Enter' && barcodeInput) {
        handleAIScan();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scanDialogOpen, barcodeInput]);

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

  // 加载状态
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto mb-2" />
          <p className="text-gray-500">加载商品列表...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部栏 */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
              onClick={() => router.push('/pos')}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              返回
            </Button>
            <h1 className="text-lg font-bold">商品管理</h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-white/20">
              {user?.shopName || '海邻便利店'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 space-y-4">
        {/* 统计卡片 */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-xs text-gray-500">商品总数</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Package2 className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.active}</div>
                  <div className="text-xs text-gray-500">在售商品</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.lowStock}</div>
                  <div className="text-xs text-gray-500">库存预警</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 搜索和筛选 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="搜索商品名称或条码..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部分类</SelectItem>
                  {mockCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleAddProduct}>
                <Plus className="h-4 w-4 mr-2" />
                新增商品
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 商品列表 */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>商品信息</TableHead>
                  <TableHead>分类</TableHead>
                  <TableHead>规格</TableHead>
                  <TableHead>库存</TableHead>
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
                        <div className="flex items-center gap-2">
                          <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            {product.isWeighted ? (
                              <Scale className="h-5 w-5 text-orange-500" />
                            ) : product.isCounted ? (
                              <Package2 className="h-5 w-5 text-blue-500" />
                            ) : (
                              <Package className="h-5 w-5 text-gray-500" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="flex items-center gap-1 mt-1">
                              {getTypeBadge(product)}
                              {product.status === 'inactive' && (
                                <Badge variant="outline" className="text-gray-500">已下架</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {product.specs.length} 种规格
                        </div>
                        <div className="text-xs text-gray-500">
                          ¥{Math.min(...product.specs.map(s => s.price)).toFixed(2)} - ¥{Math.max(...product.specs.map(s => s.price)).toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{totalStock}</div>
                        <div className="mt-1">
                          {getStockStatus(totalStock, product.minStock)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {product.status === 'active' ? (
                          <Badge className="bg-green-500">在售</Badge>
                        ) : (
                          <Badge variant="secondary">已下架</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditProduct(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600"
                            onClick={() => {
                              setProductToDelete(product);
                              setDeleteDialogOpen(true);
                            }}
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
                <p className="text-gray-500">暂无商品数据</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 新增/编辑商品对话框 */}
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedProduct ? '编辑商品' : '新增商品'}
            </DialogTitle>
            <DialogDescription>
              {selectedProduct ? '修改商品信息' : '添加新商品到店铺'}
            </DialogDescription>
          </DialogHeader>

          <ProductForm
            key={selectedProduct?.id || 'new'}
            product={selectedProduct}
            onSave={handleSaveProduct}
            onCancel={() => setProductDialogOpen(false)}
            onScanBarcode={handleOpenScanDialog}
          />
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除商品</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除商品 "{productToDelete?.name}" 吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDeleteProduct}
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 条码扫描对话框 */}
      <Dialog open={scanDialogOpen} onOpenChange={setScanDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Barcode className="h-5 w-5" />
              条码扫描识别
            </DialogTitle>
            <DialogDescription>
              使用扫码枪扫描或手动输入条码，AI将自动识别商品信息
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="relative">
              <Input
                placeholder="扫描或输入商品条码..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                className="text-center text-lg h-12"
                autoFocus
              />
            </div>

            <Button
              className="w-full"
              onClick={handleAIScan}
              disabled={!barcodeInput.trim() || aiLoading}
            >
              {aiLoading ? (
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

            {aiError && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
                {aiError}
              </div>
            )}

            {aiProductInfo && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 text-green-700 font-medium">
                  <Sparkles className="h-4 w-4" />
                  识别成功
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">商品名称</span>
                    <span className="font-medium">{aiProductInfo.name}</span>
                  </div>
                  {aiProductInfo.brand && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">品牌</span>
                      <span>{aiProductInfo.brand}</span>
                    </div>
                  )}
                  {aiProductInfo.category && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">分类</span>
                      <span>{aiProductInfo.category}</span>
                    </div>
                  )}
                  {aiProductInfo.specification && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">规格</span>
                      <span>{aiProductInfo.specification}</span>
                    </div>
                  )}
                  {aiProductInfo.price && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">建议售价</span>
                      <span className="text-green-600 font-medium">¥{aiProductInfo.price.toFixed(2)}</span>
                    </div>
                  )}
                </div>
                <Button
                  className="w-full"
                  onClick={handleUseAIResult}
                >
                  使用此信息创建商品
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
