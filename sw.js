self.addEventListener('install', (e) => {
    console.log('[Service Worker] Install');
});

self.addEventListener('fetch', (e) => {
    // Basic offline support
    e.respondWith(
        fetch(e.request).catch(() => new Response("Offline"))
    );
});
