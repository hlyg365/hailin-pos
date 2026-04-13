import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * 路由代理 - Next.js 16 替代中间件
 * 
 * 主要处理路由保护和认证
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 静态资源路径前缀 - 不需要认证
  const staticPrefixes = [
    '/_next',
    '/icons',
    '/images',
    '/fonts',
    '/sw.js',
    '/manifest.json',
    '/favicon',
    '/android',
  ];
  
  // API 路由 - 不需要认证
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  // 静态资源 - 不需要认证
  if (staticPrefixes.some(prefix => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }
  
  // 对于文件扩展名的请求（如 .js, .css, .ico 等）直接放行
  if (pathname.match(/\.[a-zA-Z0-9]+$/)) {
    return NextResponse.next();
  }
  
  // 所有其他路由直接放行，认证由客户端 Context 处理
  // 这避免了 SSR 和 CSR 状态不一致的问题
  return NextResponse.next();
}

// 配置代理匹配的路由
export const proxyConfig = {
  matcher: [
    /*
     * 匹配所有路径，除了静态文件
     */
    '/((?!_next/static|_next/image|favicon.ico|public/|android/).*)',
  ],
};
