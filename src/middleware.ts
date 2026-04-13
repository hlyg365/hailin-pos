import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * 路由保护中间件
 * 
 * 注意：此中间件已在 Next.js 16 中弃用，将被 proxy 替代
 * 目前保持简单逻辑，主要认证在客户端进行
 */
export function middleware(request: NextRequest) {
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

// 配置中间件匹配的路由
export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了静态文件
     */
    '/((?!_next/static|_next/image|favicon.ico|public/|android/).*)',
  ],
};
