// Service worker Meja Tulis: precache app shell, cache-first.
// PENTING: naikkan VERSION setiap kali ada berkas aplikasi yang diubah, supaya pengguna menerima versi baru.
const VERSION='v2';
const CACHE='meja-tulis-'+VERSION;
const SHELL=[
  './','index.html','manifest.webmanifest','css/app.css',
  'js/main.js','js/util.js','js/config.js','js/db.js','js/state.js','js/migrate.js','js/history.js','js/router.js',
  'js/views.js','js/data-view.js','js/backup.js','js/guide.js','js/docx.js','js/pwa.js',
  'icons/icon.svg','icons/icon-192.png','icons/icon-512.png','icons/icon-maskable-512.png','icons/apple-touch-icon.png'
];

self.addEventListener('install',e=>{
  // Tidak memanggil skipWaiting di sini: versi baru menunggu sampai pengguna menekan "Muat ulang".
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)));
});
self.addEventListener('message',e=>{if(e.data&&e.data.type==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('meja-tulis-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;
  e.respondWith(caches.match(req,{ignoreSearch:true}).then(hit=>{
    if(hit)return hit;
    return fetch(req).then(res=>{
      if(res.ok&&res.type==='basic'){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy))}
      return res;
    }).catch(()=>req.mode==='navigate'?caches.match('index.html'):Response.error());
  }));
});
