const CACHE_NAME = "one-million-cat-v1";

const APP_SHELL = [
    "/",
    "/index.html",
    "/style.css",
    "/app.js",
    "/manifest.json",
    "/icons/icon-192.png",
    "/icons/icon-512.png"
];


// INSTALL
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});


// ACTIVATE
self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys()
            .then(keys => {
                return Promise.all(
                    keys
                        .filter(key => key !== CACHE_NAME)
                        .map(key => caches.delete(key))
                );
            })
            .then(() => self.clients.claim())
    );
});


// FETCH
self.addEventListener("fetch", event => {

    const request = event.request;
    const url = new URL(request.url);

    // Sadece GET isteklerini ele al
    if (request.method !== "GET") {
        return;
    }


    // Supabase verilerini CACHE'LEME
    if (
        url.hostname.endsWith("supabase.co") ||
        url.pathname.startsWith("/rest/") ||
        url.pathname.startsWith("/auth/")
    ) {
        return;
    }


    // HTML → önce internet, olmazsa cache
    if (
        url.origin === self.location.origin &&
        (
            request.mode === "navigate" ||
            url.pathname.endsWith(".html")
        )
    ) {
        event.respondWith(
            fetch(request)
                .then(response => {

                    const copy = response.clone();

                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(request, copy);
                        });

                    return response;
                })
                .catch(() => {
                    return caches.match("/index.html");
                })
        );

        return;
    }


    // Local static files → önce cache
    if (url.origin === self.location.origin) {

        event.respondWith(
            caches.match(request)
                .then(cachedResponse => {

                    if (cachedResponse) {
                        return cachedResponse;
                    }

                    return fetch(request)
                        .then(response => {

                            if (response.ok) {

                                const copy = response.clone();

                                caches.open(CACHE_NAME)
                                    .then(cache => {
                                        cache.put(request, copy);
                                    });
                            }

                            return response;
                        });
                })
        );
    }
});
