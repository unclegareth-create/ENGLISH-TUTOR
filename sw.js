/* ==========================================================
   Grammar Crypt – Service Worker
   Enables 100% offline play and PWA installation without
   caching unrelated tutoring pages across the root domain.
   ========================================================== */
'use strict';

const CACHE_NAME = 'grammar-crypt-v6';
const PRECACHE_ASSETS = [
    './grammar-crypt.html',
    './crypt.css',
    './crypt-levels.js',
    './crypt.js',
    './audio.js',
    './course-bridge.js',
    './analytics-funnel.js',
    './analytics.js',
    './dossier.js',
    './manifest.json',
    './icon-192.png',
    './icon-512.png',
    './icon-512-maskable.png',
    './assets/vendor/confetti.browser.min.js',
    './assets/arcade/grammar_crypt.svg',
    './assets/fonts/fonts.css',
    './assets/audio/crypt/boss-act1-goblin.mp3',
    './assets/audio/crypt/boss-act2-wraith.mp3',
    './assets/audio/crypt/boss-act3-lich.mp3',
    './assets/audio/crypt/boss-act4-golem.mp3',
    './assets/audio/crypt/boss-act5-archdemon.mp3'
];

const CRYPT_ASSET_PATTERN = /(\/(grammar-crypt(-3d)?\.html|crypt\.(css|js)|crypt-levels\.js|audio\.js|course-bridge\.js|analytics-funnel\.js|analytics\.js|dossier\.js|teacher-white-label\.js|wasm-webgl-engine\.js|arcade_physics\.wasm|manifest\.json|icon-(192|512)(-maskable)?\.png|confetti\.browser\.min\.js)|\/assets\/fonts\/(fonts\.css|fontawesome-local\.css|.*\.woff2)|\/assets\/audio\/crypt\/.*\.mp3|\/assets\/arcade\/grammar_crypt(_3d)?\.svg)$/;
const NETWORK_FIRST_PATTERN = /\/(grammar-crypt(-3d)?\.html|crypt\.(css|js)|crypt-levels\.js|audio\.js|course-bridge\.js|analytics-funnel\.js|analytics\.js|dossier\.js|teacher-white-label\.js)$/;

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return Promise.all(
                PRECACHE_ASSETS.map((assetUrl) =>
                    cache.add(assetUrl).catch((err) => {
                        console.warn('[SW] Precache partial skip:', assetUrl, err);
                    })
                )
            );
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
    if (url.origin !== self.location.origin) return;

    // Only intercept Grammar Crypt PWA assets; let all other site pages use standard HTTP caching.
    if (!CRYPT_ASSET_PATTERN.test(url.pathname)) return;

    // Network-first for HTML and mutable JS/CSS so deployments never suffer version skew.
    if (event.request.mode === 'navigate' || url.pathname.endsWith('.html') || NETWORK_FIRST_PATTERN.test(url.pathname)) {
        event.respondWith(
            fetch(event.request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseClone = networkResponse.clone();
                        const cacheKey = url.pathname.endsWith('.html') && url.search ? url.pathname : event.request;
                        caches.open(CACHE_NAME).then((cache) => cache.put(cacheKey, responseClone));
                    }
                    return networkResponse;
                })
                .catch(() =>
                    caches.match(event.request).then((res) => res || caches.match(event.request, { ignoreSearch: true }))
                )
        );
        return;
    }

    // Stale-while-revalidate for audio, fonts, icons, and vendor bundles for instant offline load.
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
