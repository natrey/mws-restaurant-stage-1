self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('cache-static-1').then(cache => {
      return cache.addAll([
        '/',
        'img/1.jpg',
        'https://fonts.googleapis.com/css?family=Roboto:300,400,500,700',
      ]);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  )
});