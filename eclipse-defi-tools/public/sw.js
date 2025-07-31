// Service Worker for Eclipse DeFi Tools
const CACHE_NAME = 'eclipse-defi-v1';
const STATIC_CACHE_NAME = 'eclipse-defi-static-v1';
const API_CACHE_NAME = 'eclipse-defi-api-v1';

// キャッシュするファイルのリスト
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// API エンドポイントのパターン
const API_PATTERNS = [
  /api\.coingecko\.com/,
  /api\.eclipse/,
  /jupiter-api/,
  /orca-api/,
];

// キャッシュの有効期限（秒）
const CACHE_DURATION = {
  static: 86400, // 24時間
  api: 300, // 5分
};

// Service Worker のインストール
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Service Worker のアクティベート
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME, STATIC_CACHE_NAME, API_CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// フェッチイベントの処理
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 同一オリジンのリクエストのみ処理
  if (url.origin !== location.origin) {
    return;
  }

  // APIリクエストの判定
  const isAPI = API_PATTERNS.some(pattern => pattern.test(url.href));

  if (isAPI) {
    event.respondWith(handleAPIRequest(request));
  } else if (request.destination === 'document' || 
             request.destination === 'script' || 
             request.destination === 'style' || 
             request.destination === 'image') {
    event.respondWith(handleStaticRequest(request));
  } else {
    event.respondWith(handleDynamicRequest(request));
  }
});

// 静的リソースの処理
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
      // 新しいResponseオブジェクトを作成してヘッダーを追加
      const headers = new Headers(response.headers);
      headers.set('sw-cache-time', Date.now().toString());
      
      const responseToCache = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: headers
      });
      
      cache.put(request, responseToCache.clone());
      return response;
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
      // 新しいResponseオブジェクトを作成してヘッダーを追加
      const headers = new Headers(response.headers);
      headers.set('sw-cache-time', Date.now().toString());
      
      const responseToCache = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: headers
      });
      
      cache.put(request, responseToCache.clone());
      return response;
    }
    return response;
  } catch (error) {
    console.error('API fetch failed:', error);
    return cachedResponse || new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 動的リソースの処理
async function handleDynamicRequest(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      // 新しいResponseオブジェクトを作成してヘッダーを追加
      const headers = new Headers(response.headers);
      headers.set('sw-cache-time', Date.now().toString());
      
      const responseToCache = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: headers
      });
      
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, responseToCache.clone());
      return response;
    }
    return response;
  } catch (error) {
    console.error('Dynamic fetch failed:', error);
    const cache = await caches.open(CACHE_NAME);
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
          h1 { color: #3b82f6; }
          p { margin: 1rem 0; }
          button {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            cursor: pointer;
            font-size: 1rem;
          }
          button:hover { background: #2563eb; }
        </style>
      </head>
      <body>
        <h1>オフライン</h1>
        <p>インターネット接続がありません。</p>
        <p>接続が回復したら、ページを再読み込みしてください。</p>
        <button onclick="window.location.reload()">再読み込み</button>
      </body>
      </html>
    `, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
}

// バックグラウンド同期
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-transactions') {
    event.waitUntil(syncTransactions());
  }
});

async function syncTransactions() {
  // トランザクションの同期処理
  console.log('Syncing transactions...');
}

// プッシュ通知
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Eclipse DeFi Tools からの通知',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [200, 100, 200],
  };

  event.waitUntil(
    self.registration.showNotification('Eclipse DeFi Tools', options)
  );
});

// 通知クリック
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});