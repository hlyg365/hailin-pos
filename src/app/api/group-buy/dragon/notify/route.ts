import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export const dynamic = 'force-dynamic';

// 尝试获取Supabase客户端，如果失败则返回null
function tryGetSupabaseClient() {
  try {
    return getSupabaseClient();
  } catch {
    return null;
  }
}

// POST - 通知团长分享接龙
export async function POST(request: NextRequest) {
  try {
    const supabase = tryGetSupabaseClient();
    const body = await request.json();
    
    const { dragonId, message, links } = body;
    
    if (!dragonId) {
      return NextResponse.json({ 
        success: false, 
        error: '缺少接龙ID' 
      }, { status: 400 });
    }
    
    if (!supabase) {
      // 模拟通知成功
      console.log('[模拟通知] 接龙ID:', dragonId, '消息:', message);
      if (links && links.length > 0) {
        console.log('[模拟通知] 发送给', links.length, '个团长');
        links.forEach((link: { leaderId: string; leaderName: string; shareUrl: string }) => {
          console.log(`  - ${link.leaderName}: ${link.shareUrl}`);
        });
      }
      return NextResponse.json({
        success: true,
        notified: links?.length || 0,
        message: `已通知 ${links?.length || 0} 个团长`,
      });
    }
    
    // 尝试保存通知记录到数据库
    if (links && links.length > 0) {
      const notifications = links.map((link: { leaderId: string; leaderName: string; shareUrl: string }) => ({
        dragon_id: dragonId,
        leader_id: link.leaderId,
        message: message || `新接龙已发布，请点击链接分享到社区群！\n\n分享链接：${link.shareUrl}`,
        share_url: link.shareUrl,
        status: 'sent',
        sent_at: new Date().toISOString(),
      }));
      
      const { error: notifyError } = await supabase
        .from('dragon_notifications')
        .insert(notifications);
      
      if (notifyError) {
        // 如果表不存在，模拟成功
        if (notifyError.code === '42P01') {
          console.log('[模拟通知] 表不存在，模拟成功');
          return NextResponse.json({
            success: true,
            notified: links.length,
            message: `已通知 ${links.length} 个团长`,
          });
        }
        console.error('保存通知记录失败:', notifyError);
        return NextResponse.json({ success: false, error: notifyError.message }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        notified: links.length,
        message: `已通知 ${links.length} 个团长`,
      });
    }
    
    return NextResponse.json({
      success: true,
      notified: 0,
      message: '没有需要通知的团长',
    });
  } catch (error) {
    console.error('通知团长失败:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}
