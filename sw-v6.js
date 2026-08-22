const CACHE_NAME="japan-2026-v6";
const ASSETS=["./","./index.html","./style-final.css","./script-final.js","./schedule-fix.js","./theme-sync.js","./places.js","./planning_places.js","./planning_places_more.js","./data.json","./manifest.json","./icon.png"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{if(e.request.method!=="GET")return;if(e.request.url.includes("api.frankfurter.dev"))return;e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request).then(r=>{if(r&&r.status===200&&new URL(e.request.url).origin===location.origin)caches.open(CACHE_NAME).then(x=>x.put(e.request,r.clone()));return r}))) });
