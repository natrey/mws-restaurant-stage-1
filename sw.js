var CONTENT_STATIC_CACHE = 'cache-static-1';
var CONTENT_IMGS_CACHE = 'cache-imgs-1';

var ALL_CACHES = [
  CONTENT_STATIC_CACHE,
  CONTENT_IMGS_CACHE
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CONTENT_STATIC_CACHE).then(cache => {
      return cache.addAll([
        '/',
        '/restaurant.html',
        'dist/css/styles.css',
        'dist/js/main.bundle.js',
        'dist/js/restaurant.bundle.js',
        'https://fonts.googleapis.com/css?family=Roboto:300,400,500,700',
      ]);
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          return cacheName.startsWith('cache-') &&
            !ALL_CACHES.includes(cacheName);
        }).map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  if (requestUrl.pathname.match('/img/')) {
    event.respondWith(servePhoto(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  )
});

function servePhoto(request) {
  const storageUrl = request.url.replace(/_\d+w\.jpg$/, '');

  return caches.open(CONTENT_IMGS_CACHE).then(function(cache) {
    return cache.match(storageUrl).then(function(response) {
      if (response) return response;

      return fetch(request).then(function(networkResponse) {
        cache.put(storageUrl, networkResponse.clone());
        return networkResponse;
      });
    });
  });
}