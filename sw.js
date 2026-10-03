// SpendWise offline support: keeps the app and its libraries on the device.
const CACHE = "spendwise-v1";
const CORE = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];
const NEVER_CACHE = ["www.googleapis.com", "oauth2.googleapis.com", "openidconnect.googleapis.com", "accounts.google.com"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (NEVER_CACHE.includes(url.hostname)) return;          // Google sign-in and Drive always go to the network
  const put = res => { if (res && (res.ok || res.type === "opaque")) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; };
  if (url.origin === self.location.origin) {
    // the app itself: newest version when online, saved copy when offline
    e.respondWith(fetch(req).then(put).catch(() => caches.match(req, { ignoreSearch:true }).then(r => r || caches.match("./"))));
  } else {
    // fonts and libraries: saved copy first
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(put)));
  }
});
