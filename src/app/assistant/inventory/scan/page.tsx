'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ScanLine,
  Package,
  AlertTriangle,
  Edit3,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// 模拟商品数据
const mockProducts: Record<string, {
  name: string;
  barcode: string;
  price: number;
  stock: number;
  unit: string;
  minStock: number;
  category: string;
  supplier: string;
  lastInbound: string;
  sales30d: number;
}> = {
  '6901234567890': {
    name: '可口可乐500ml',
    barcode: '6901234567890',
    price: 3.00,
    stock: 24,
    unit: '瓶',
    minStock: 20,
    category: '饮料',
    supplier: '可口可乐公司',
    lastInbound: '2024-01-10',
    sales30d: 156,
  },
  '6901234567891': {
    name: '农夫山泉550ml',
    barcode: '6901234567891',
    price: 2.00,
    stock: 48,
    unit: '瓶',
    minStock: 30,
    category: '饮料',
    supplier: '农夫山泉公司',
    lastInbound: '2024-01-12',
    sales30d: 189,
  },
};

export default function ScanQueryPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [barcode, setBarcode] = useState('');
  const [product, setProduct] = useState<typeof mockProducts[string] | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleScan = () => {
    if (!barcode.trim()) return;

    setScanning(true);
    setNotFound(false);
    setProduct(null);

    // 模拟扫描延迟
    setTimeout(() => {
      const found = mockProducts[barcode.trim()];
      if (found) {
        setProduct(found);
      } else {
        setNotFound(true);
      }
      setScanning(false);
    }, 500);
  };

  const handleClear = () => {
    setBarcode('');
    setProduct(null);
    setNotFound(false);
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 顶部栏 */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="flex items-center gap-3 p-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-medium flex-1">扫码查询</h1>
        </div>

        {/* 扫码输入 */}
        <div className="px-3 pb-3">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              placeholder="扫描或输入商品条码"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleScan()}
              className="flex-1"
            />
            <Button onClick={handleScan} disabled={scanning}>
              {scanning ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  查询中
                </span>
              ) : (
                <>
                  <ScanLine className="h-4 w-4 mr-1" />
                  查询
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* 内容区域 */}
      <div className="flex-1 p-4">
        {/* 初始状态 */}
        {!product && !notFound && (
          <div className="text-center py-16 text-gray-400">
            <ScanLine className="h-16 w-16 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">扫描商品条码</p>
            <p className="text-sm mt-1">快速查询商品信息和库存</p>
          </div>
        )}

        {/* 未找到 */}
        {notFound && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-8 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-red-400" />
              <p className="font-medium text-red-600">未找到该商品</p>
              <p className="text-sm text-red-400 mt-1">条码: {barcode}</p>
              <Button variant="outline" className="mt-4" onClick={handleClear}>
                重新扫描
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 商品信息 */}
        {product && (
          <div className="space-y-4">
            {/* 基本信息 */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 shrink-0">
                    <Package className="h-8 w-8" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-lg">{product.name}</h3>
                        <p className="text-sm text-gray-400">{product.barcode}</p>
                      </div>
                      <Badge>{product.category}</Badge>
                    </div>
                    <div className="mt-2">
                      <span className="text-2xl font-bold text-red-500">¥{product.price.toFixed(2)}</span>
                      <span className="text-sm text-gray-400 ml-2">/{product.unit}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 库存信息 */}
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-500" />
                  库存信息
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-blue-500">{product.stock}</p>
                    <p className="text-xs text-gray-500">当前库存</p>
                  </div>
                  <div className={cn(
                    "rounded-lg p-3 text-center",
                    product.stock <= product.minStock ? "bg-red-50" : "bg-green-50"
                  )}>
                    <p className={cn(
                      "text-2xl font-bold",
                      product.stock <= product.minStock ? "text-red-500" : "text-green-500"
                    )}>
                      {product.minStock}
                    </p>
                    <p className="text-xs text-gray-500">安全库存</p>
                  </div>
                </div>
                {product.stock <= product.minStock && (
                  <div className="mt-3 flex items-center gap-2 text-orange-500 text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    <span>库存不足，建议及时补货</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 销售数据 */}
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  销售数据
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-500">{product.sales30d}</p>
                    <p className="text-xs text-gray-500">近30天销量</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-purple-500">
                      {(product.sales30d / 30).toFixed(1)}
                    </p>
                    <p className="text-xs text-gray-500">日均销量</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 供应商信息 */}
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-3">供应商信息</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">供应商</span>
                    <span>{product.supplier}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">最后入库</span>
                    <span>{product.lastInbound}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 操作按钮 */}
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={handleClear}>
                继续扫描
              </Button>
              <Button onClick={() => router.push(`/assistant/inventory/stocktake`)}>
                <Edit3 className="h-4 w-4 mr-2" />
                去盘点
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
