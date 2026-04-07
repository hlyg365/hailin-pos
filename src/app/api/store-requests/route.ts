import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export const dynamic = 'force-dynamic';

// 获取Supabase客户端
function getDb() {
  try {
    return getSupabaseClient();
  } catch {
    return null;
  }
}

// 要货申请接口
interface StoreRequestItem {
  productId: string;
  productName: string;
  productIcon?: string;
  quantity: number;
  unit: string;
  approvedQuantity?: number;
}

interface StoreRequest {
  id: string;
  requestNo: string;
  storeId: string;
  storeName: string;
  items: StoreRequestItem[];
  totalQuantity: number;
  status: 'pending' | 'approved' | 'processing' | 'shipped' | 'received' | 'rejected' | 'purchase_pending';
  remark?: string;
  createTime: string;
  approveTime?: string;
  shipTime?: string;
  receiveTime?: string;
  relatedPurchaseOrderId?: string;
}

// GET - 获取要货申请列表
export async function GET(request: NextRequest) {
  try {
    const supabase = getDb();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const storeId = searchParams.get('storeId');
    const needsPurchase = searchParams.get('needsPurchase');
    
    if (!supabase) {
      // 返回模拟数据
      const mockRequests: StoreRequest[] = [
        {
          id: 'REQ001',
          requestNo: 'REQ202503170001',
          storeId: 'store_001',
          storeName: '南山店',
          items: [
            { productId: 'P001', productName: '矿泉水 500ml', productIcon: '💧', quantity: 50, unit: '瓶' },
            { productId: 'P002', productName: '可乐 330ml', productIcon: '🥤', quantity: 30, unit: '罐' },
          ],
          totalQuantity: 80,
          status: 'pending',
          createTime: '2025-03-17 09:00',
        },
        {
          id: 'REQ002',
          requestNo: 'REQ202503170002',
          storeId: 'store_002',
          storeName: '福田店',
          items: [
            { productId: 'P003', productName: '雪碧 330ml', productIcon: '🧃', quantity: 40, unit: '罐' },
            { productId: 'P004', productName: '牛奶 250ml', productIcon: '🥛', quantity: 20, unit: '盒' },
          ],
          totalQuantity: 60,
          status: 'purchase_pending', // 需要采购
          remark: '总仓库存不足，需要向供应商采购',
          createTime: '2025-03-17 10:00',
          approveTime: '2025-03-17 10:30',
        },
        {
          id: 'REQ003',
          requestNo: 'REQ202503170003',
          storeId: 'store_003',
          storeName: '罗湖店',
          items: [
            { productId: 'P005', productName: '酸奶 200ml', productIcon: '🥛', quantity: 30, unit: '盒' },
          ],
          totalQuantity: 30,
          status: 'approved',
          createTime: '2025-03-16 14:00',
          approveTime: '2025-03-16 14:30',
        },
      ];
      
      // 根据条件筛选
      let filtered = mockRequests;
      if (status && status !== 'all') {
        filtered = filtered.filter(r => r.status === status);
      }
      if (storeId) {
        filtered = filtered.filter(r => r.storeId === storeId);
      }
      if (needsPurchase === 'true') {
        filtered = filtered.filter(r => r.status === 'purchase_pending');
      }
      
      return NextResponse.json({ success: true, data: filtered });
    }
    
    // 从数据库获取
    let query = supabase
      .from('store_requests')
      .select('*')
      .order('create_time', { ascending: false });
    
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (storeId) {
      query = query.eq('store_id', storeId);
    }
    if (needsPurchase === 'true') {
      query = query.eq('status', 'purchase_pending');
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('获取要货申请失败:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('获取要货申请失败:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}

// POST - 创建要货申请
export async function POST(request: NextRequest) {
  try {
    const supabase = getDb();
    const body = await request.json();
    
    const { storeId, storeName, items, remark } = body;
    
    if (!storeId || !items || items.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: '缺少必要参数' 
      }, { status: 400 });
    }
    
    const requestNo = `REQ${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${Date.now().toString().slice(-4)}`;
    const requestId = `REQ${Date.now()}`;
    
    if (!supabase) {
      // 返回模拟数据
      return NextResponse.json({
        success: true,
        data: {
          id: requestId,
          requestNo,
          storeId,
          storeName,
          items,
          totalQuantity: items.reduce((sum: number, item: StoreRequestItem) => sum + item.quantity, 0),
          status: 'pending',
          remark,
          createTime: new Date().toISOString(),
        },
      });
    }
    
    // 保存到数据库
    const { error } = await supabase
      .from('store_requests')
      .insert({
        id: requestId,
        request_no: requestNo,
        store_id: storeId,
        store_name: storeName,
        items,
        total_quantity: items.reduce((sum: number, item: StoreRequestItem) => sum + item.quantity, 0),
        status: 'pending',
        remark,
        create_time: new Date().toISOString(),
      });
    
    if (error) {
      console.error('创建要货申请失败:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        id: requestId,
        requestNo,
        storeId,
        storeName,
        items,
        totalQuantity: items.reduce((sum: number, item: StoreRequestItem) => sum + item.quantity, 0),
        status: 'pending',
        remark,
        createTime: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('创建要货申请失败:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}

// PUT - 更新要货申请状态
export async function PUT(request: NextRequest) {
  try {
    const supabase = getDb();
    const body = await request.json();
    
    const { requestId, status, approvedItems, relatedPurchaseOrderId } = body;
    
    if (!requestId || !status) {
      return NextResponse.json({ 
        success: false, 
        error: '缺少必要参数' 
      }, { status: 400 });
    }
    
    if (!supabase) {
      return NextResponse.json({ success: true });
    }
    
    const updateData: Record<string, unknown> = {
      status,
      approve_time: new Date().toISOString(),
    };
    
    if (approvedItems) {
      updateData.items = approvedItems;
    }
    if (relatedPurchaseOrderId) {
      updateData.related_purchase_order_id = relatedPurchaseOrderId;
    }
    
    const { error } = await supabase
      .from('store_requests')
      .update(updateData)
      .eq('id', requestId);
    
    if (error) {
      console.error('更新要货申请失败:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('更新要货申请失败:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}
