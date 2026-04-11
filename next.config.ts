import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ['*.dev.coze.site'],
  // 使用 standalone 输出模式加快生产启动速度
  output: 'standalone',
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lf-coze-web-cdn.coze.cn',
        pathname: '/**',
      },
    ],
  },
  trailingSlash: true,
  distDir: '.next',
  
  // Webpack 配置 - 处理 langchain 模块解析问题
  webpack: (config, { isServer }) => {
    // 处理 @langchain/core 模块解析问题
    config.resolve.alias = {
      ...config.resolve.alias,
      '@langchain/core/utils/env': path.resolve(__dirname, 'src/lib/utils/env-shim.ts'),
    };
    
    // 如果是服务端构建，添加 external 处理大型 SDK
    if (isServer) {
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push('coze-coding-dev-sdk');
      }
    }
    
    return config;
  },
  
  // 安全响应头配置
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Permissions-Policy', value: 'camera=*, microphone=*' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://lf-coze-web-cdn.coze.cn",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https: http:",
              "font-src 'self' data:",
              "connect-src 'self' https://lf-coze-web-cdn.coze.cn https://*.coze.site wss://*.coze.site",
              "media-src 'self' blob:",
              "worker-src 'self' blob:",
              "frame-src 'self'",
              "form-action 'self'",
              "base-uri 'self'",
            ].join('; ')
          },
        ],
      },
    ];
  },
  
  // 重定向配置
  async redirects() {
    return [
      // 将 /index.html 重定向到根路径
      {
        source: '/index.html',
        destination: '/',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;