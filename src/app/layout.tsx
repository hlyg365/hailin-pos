import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '海邻到家 - 智能收银系统',
  description: '社区便利店智能收银管理系统',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '海邻收银台',
  },
  formatDetection: {
    telephone: true,
  },
};

export const viewport: Viewport = {
  themeColor: '#FF6B35',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="海邻收银台" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="font-sans antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-white px-4 py-2 rounded shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          跳转到主要内容
        </a>
        <div id="main-content" role="main" tabIndex={0}>
          {children}
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js?v=15').then(
                    function(registration) {
                      console.log('SW registered: ', registration.scope);
                      // 强制更新 service worker
                      if (registration.waiting) {
                        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                      }
                      // 检查新版本
                      registration.addEventListener('updatefound', function() {
                        console.log('New SW version found');
                        const newWorker = registration.installing;
                        if (newWorker) {
                          newWorker.addEventListener('statechange', function() {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                              console.log('New SW installed, reloading...');
                              window.location.reload();
                            }
                          });
                        }
                      });
                    },
                    function(err) {
                      console.log('SW registration failed: ', err);
                    }
                  );
                  // 监听新版本
                  navigator.serviceWorker.addEventListener('controllerchange', function() {
                    console.log('SW controller changed, reloading...');
                    window.location.reload();
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
