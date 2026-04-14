// 海邻收银台 Service Worker v31
// 修复PWA内容重复问题，严格缓存策略

const CACHE_NAME = 'hailin-pos-v31';
const OFFLINE_URL = '/pos/offline';

// 需要缓存的静态资源
const STATIC_ASSETS = [
  '/pos',
  '/manifest.json',
  '/offline.html',
];

// 安装事件 - 预缓存静态资源
self.addEventListener('install', (event) => {
  console.log('[SW v31] 安装中...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW v31] 预缓存静态资源');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      // 立即激活新版本
      return self.skipWaiting();
    })
  );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
  console.log('[SW v31] 激活中...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW v31] 删除旧缓存:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      // 立即控制所有客户端
      return self.clients.claim();
    })
  );
});

// 网络优先策略 - 用于API请求
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW v31] 网络请求失败，尝试缓存:', request.url);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// 缓存优先策略 - 用于静态资源
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW v31] 静态资源加载失败:', request.url);
    throw error;
  }
}

// 仅网络策略 - 用于页面导航，避免缓存导致的内容重复
async function networkOnly(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    console.log('[SW v31] 网络请求失败:', request.url);
    // 网络失败时返回离线页面
    return caches.match(OFFLINE_URL) || caches.match('/pos');
  }
}

// 请求拦截
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 只处理同源请求
  if (url.origin !== location.origin) {
    return;
  }

  // API请求使用网络优先
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // 静态资源使用缓存优先
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image' ||
    request.destination === 'font'
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // 页面请求使用仅网络策略，避免内容重复
  if (request.mode === 'navigate') {
    event.respondWith(networkOnly(request));
    return;
  }
});

// 后台同步
self.addEventListener('sync', (event) => {
  console.log('[SW v31] 后台同步:', event.tag);
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncOrders());
  }
});

// 监听 SKIP_WAITING 消息，强制激活新版本
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW v31] 收到SKIP_WAITING消息，强制更新');
    self.skipWaiting();
  }
  // 添加清除缓存命令
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('[SW v31] 清除所有缓存');
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => caches.delete(name))
        );
      }).then(() => {
        // 重新打开当前缓存
        return caches.open(CACHE_NAME);
      })
    );
  }
});

// 同步订单数据
async function syncOrders() {
  console.log('[SW v31] 同步订单数据...');
  // 这里可以从IndexedDB读取待同步的订单并上传
}

console.log('[SW v31] Service Worker 已加载，版本31');
