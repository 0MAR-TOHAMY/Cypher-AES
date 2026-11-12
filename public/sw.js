// Service worker: يخلي التطبيق يفتح ويشتغل من غير إنترنت بعد أول زيارة.
// التشفير كله محلي، فمفيش أي طلبات API محتاجة شبكة.
const CACHE = "aes-image-v1";
const PRECACHE = [
  "/",
  "/about",
  "/manifest.webmanifest",
  "/icons/icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
  "/samples/sample1.png",
  "/samples/sample2.png",
  "/fonts/IBMPlexSansArabic-Regular.woff2",
  "/fonts/IBMPlexSansArabic-Medium.woff2",
  "/fonts/IBMPlexSansArabic-SemiBold.woff2",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      // كل ملف لوحده: لو واحد فشل ما يوقفش الباقي.
      Promise.all(PRECACHE.map((url) => cache.add(url).catch(() => {}))),
    ),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // بيانات التنقل بين الصفحات في Next (_rsc): الشبكة أولًا، والكاش لو مفيش إنترنت.
  if (url.searchParams.has("_rsc")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches.match(request).then((hit) => hit || Response.error()),
        ),
    );
    return;
  }

  // الصفحات: الشبكة أولًا عشان التحديثات، والكاش لو مفيش إنترنت.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches
            .match(request, { ignoreSearch: true })
            .then((hit) => hit || caches.match("/")),
        ),
    );
    return;
  }

  // ملفات الـbuild والخطوط والأيقونات ثابتة: الكاش أولًا.
  event.respondWith(
    caches.match(request).then(
      (hit) =>
        hit ||
        fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        }),
    ),
  );
});
