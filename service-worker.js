/**
 * SliferJump 2.0 Service Worker
 * Enables offline play and PWA installation
 */
const CACHE_NAME = "sliferjump-v2";
const ASSETS_TO_CACHE = [
    "./",
    "./index.html",
    "./css/style.css",
    "./lib/p5.min.js",
    "./lib/p5.sound.min.js",
    "./js/config.js",
    "./js/storage.js",
    "./js/sound-manager.js",
    "./js/particles.js",
    "./js/slifer.js",
    "./js/platform.js",
    "./js/orichalcos.js",
    "./js/meteor.js",
    "./js/lava.js",
    "./js/monster.js",
    "./js/collectible.js",
    "./js/background.js",
    "./js/quest.js",
    "./js/achievement.js",
    "./js/challenge.js",
    "./js/ui.js",
    "./js/game.js",
    "./assets/img/slifer_left.png",
    "./assets/img/slifer_right.png",
    "./assets/img/spring.png",
    "./assets/img/hole.png",
    "./assets/img/background.png",
    "./assets/img/logo.png",
    "./assets/sound/blackhole.mp3",
    "./assets/sound/falling.mp3",
    "./assets/sound/fragile.mp3",
    "./assets/sound/jump.wav",
    "./assets/sound/spring.mp3",
];

// Install — cache all assets
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

// Fetch — serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(event.request).then((response) => {
                // Cache new resources dynamically
                if (response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            }).catch(() => {
                // Offline fallback
                return new Response("Offline — SliferJump needs to be cached first.", {
                    status: 503,
                    statusText: "Service Unavailable",
                });
            });
        })
    );
});
