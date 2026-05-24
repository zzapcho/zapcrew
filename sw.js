const CACHE_NAME = "zapcrew-cache-v1";
const APP_ASSETS = [
  "./",
  "./index.html",
  "./src/styles/style.css",
  "./src/app/main.js",
  "./src/shared/storage/LocalStorageAdapter.js",
  "./src/shared/storage/IndexedDBAdapter.js",
  "./src/shared/storage/createStore.js",
  "./src/shared/utils/format.js",
  "./src/features/auth/storage/authStore.js",
  "./src/features/friends/storage/friendStore.js",
  "./src/features/chat/storage/chatStore.js",
  "./src/features/crews/storage/crewStore.js",
  "./src/features/presence/storage/presenceStore.js",
  "./src/features/games/storage/gameStore.js",
  "./src/features/drive/storage/fileStore.js",
  "./src/features/calendar/storage/eventStore.js",
  "./src/features/community/storage/postStore.js",
  "./src/features/notifications/storage/notificationStore.js",
  "./public/manifest.json",
  "./public/icons/zapcrew-icon.svg"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
      return response;
    }).catch(() => caches.match("./index.html")))
  );
});
