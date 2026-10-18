/* ==========================================================
   Grammar Crypt – Service Worker
   Enables 100% offline play and PWA installation without
   caching unrelated tutoring pages across the root domain.
   ========================================================== */
'use strict';

const CACHE_NAME = 'grammar-crypt-v3';
const PRECACHE_ASSETS = [
    './grammar-crypt.html',
    './crypt.css',
    './crypt.js',
    './audio.js',
    './wasm-webgl-engine.js',
    './manifest.json',
    './icon-192.png',
    './icon-512.png',
    './icon-512-maskable.png',
    'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js'
];

const CRYPT_ASSET_PATTERN = /\/(grammar-crypt(-3d)?\.html|crypt\.(css|js)|audio\.js|wasm-webgl-engine\.js|arcade_physics\.wasm|manifest\.json|icon-(192|512)(-maskable)?\.png|confetti\.browser\.min\.js)$/;

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_ASSETS).catch((err) => {
                console.warn('[SW] Precache partial error (will still install):', err);
            });
        }).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);

    // Only intercept Grammar Crypt PWA assets; let all other site pages & assets use standard HTTP caching
    if (!CRYPT_ASSET_PATTERN.test(url.pathname)) return;

    // Network-first for the game HTML so updates are live immediately when online
    if (event.request.mode === 'navigate' || url.pathname.endsWith('.html')) {
        event.respondWith(
            fetch(event.request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
                    }
                    return networkResponse;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // Stale-while-revalidate for Grammar Crypt static assets
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return networkResponse;
                })
                .catch(() => cachedResponse);

            return cachedResponse || fetchPromise;
        })
    );
});

