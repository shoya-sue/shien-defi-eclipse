const CACHE_NAME = 'eclipse-defi-v1';
const STATIC_CACHE_NAME = 'eclipse-defi-static-v1';
const DYNAMIC_CACHE_NAME = 'eclipse-defi-dynamic-v1';
const API_CACHE_NAME = 'eclipse-defi-api-v1';

// キャッシュするファイル
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// API キャッシュ設定
const API_CACHE_URLS = [
  'https://api.coingecko.com/api/v3/simple/price',
  'https://quote-api.eclipse.jup.ag',
  'https://api.orca.eclipse.so',
  'https://api.raydium.eclipse.io',
];

// キャッシュ時間設定 (秒)
const CACHE_DURATION = {
  static: 7 * 24 * 60 * 60, // 7日
  api: 30, // 30秒
  dynamic: 24 * 60 * 60, // 1日
};

// Service Worker インストール
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Static files cached');
        return self.skipWaiting();
      })
  );
});

// Service Worker アクティベーション
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE_NAME && 
              cacheName !== DYNAMIC_CACHE_NAME && 
              cacheName !== API_CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker activated');
      return self.clients.claim();
    })
  );
});

// フェッチイベントの処理
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // 静的ファイルの処理
  if (STATIC_FILES.includes(url.pathname) || url.pathname.startsWith('/assets/')) {
    event.respondWith(handleStaticRequest(request));
  }
  // API リクエストの処理
  else if (isAPIRequest(url)) {
    event.respondWith(handleAPIRequest(request));
  }
  // 動的コンテンツの処理
  else {
    event.respondWith(handleDynamicRequest(request));
  }
});

// 静的ファイルの処理
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // キャッシュの有効期限をチェック
    const cacheTime = cachedResponse.headers.get('sw-cache-time');
    if (cacheTime) {
      const age = (Date.now() - parseInt(cacheTime)) / 1000;
      if (age < CACHE_DURATION.static) {
        return cachedResponse;
      }
    }
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      const responseToCache = response.clone();
      responseToCache.headers.set('sw-cache-time', Date.now().toString());
      cache.put(request, responseToCache);
    }
    return response;
  } catch (error) {
    console.error('Static fetch failed:', error);
    return cachedResponse || new Response('Offline', { status: 503 });
  }
}

// API リクエストの処理
async function handleAPIRequest(request) {
  const cache = await caches.open(API_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  // キャッシュファーストで短時間のキャッシュ
  if (cachedResponse) {
    const cacheTime = cachedResponse.headers.get('sw-cache-time');
    if (cacheTime) {
      const age = (Date.now() - parseInt(cacheTime)) / 1000;
      if (age < CACHE_DURATION.api) {
        return cachedResponse;
      }
    }
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      const responseToCache = response.clone();
      responseToCache.headers.set('sw-cache-time', Date.now().toString());
      cache.put(request, responseToCache);
    }
    return response;
  } catch (error) {
    console.error('API fetch failed:', error);
    if (cachedResponse) {
      return cachedResponse;
    }
    return new Response(JSON.stringify({ error: 'API unavailable offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 動的コンテンツの処理
async function handleDynamicRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      const responseToCache = response.clone();
      responseToCache.headers.set('sw-cache-time', Date.now().toString());
      cache.put(request, responseToCache);
    }
    return response;
  } catch (error) {
    console.error('Dynamic fetch failed:', error);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // オフライン時のフォールバック
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>オフライン - Eclipse DeFi Tools</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            text-align: center;
            padding: 2rem;
            background: #1f2937;
            color: #f9fafb;
          }
          .container {
            max-width: 400px;
            margin: 0 auto;
            padding: 2rem;
            background: #374151;
            border-radius: 8px;
          }
          .icon {
            font-size: 4rem;
            margin-bottom: 1rem;
          }
          .title {
            font-size: 1.5rem;
            margin-bottom: 1rem;
            color: #3b82f6;
          }
          .message {
            margin-bottom: 2rem;
            color: #d1d5db;
          }
          .button {
            background: #3b82f6;
            color: white;
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 1rem;
          }
          .button:hover {
            background: #2563eb;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">🔌</div>
          <h1 class="title">オフライン</h1>
          <p class="message">
            インターネット接続が必要です。<br>
            接続を確認してから再試行してください。
          </p>
          <button class="button" onclick="window.location.reload()">
            再試行
          </button>
        </div>
      </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// API リクエストかどうかの判定
function isAPIRequest(url) {
  return API_CACHE_URLS.some(apiUrl => url.href.startsWith(apiUrl));
}

// プッシュ通知の処理
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'Eclipse DeFi Tools からの通知',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: data.tag || 'eclipse-defi-notification',
      data: data.data || {},
      actions: data.actions || [],
      requireInteraction: data.requireInteraction || false,
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Eclipse DeFi Tools', options)
    );
  }
});

// 通知クリックの処理
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// バックグラウンド同期
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // バックグラウンドでのデータ同期処理
    console.log('Background sync started');
    
    // 価格データの更新
    const priceCache = await caches.open(API_CACHE_NAME);
    const cachedPrices = await priceCache.keys();
    
    for (const request of cachedPrices) {
      try {
        const response = await fetch(request);
        if (response.ok) {
          const responseToCache = response.clone();
          responseToCache.headers.set('sw-cache-time', Date.now().toString());
          priceCache.put(request, responseToCache);
        }
      } catch (error) {
        console.error('Background sync failed for:', request.url, error);
      }
    }
    
    console.log('Background sync completed');
  } catch (error) {
    console.error('Background sync error:', error);
  }
}