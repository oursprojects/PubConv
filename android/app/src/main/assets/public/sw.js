self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', () => {
    return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // Simple pass-through strategy
    event.respondWith(fetch(event.request));
});
