// Service worker — PontoPro transauto
const CACHE = 'pontopro-v2'; // versão nova força a limpeza do cache antigo (ver activate abaixo)
const ASSETS = ['/', '/index.html', '/manifest.json', '/icon-192.png', '/icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(()=>{}));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    // cache:'reload' força o navegador a ignorar o cache HTTP normal (o GitHub Pages manda
    // Cache-Control: max-age=600, ou seja, até 10min sem essa opção o fetch podia ser respondido
    // pelo cache do próprio navegador sem sequer chegar na rede) e buscar sempre a versão mais
    // nova do servidor quando online. Bug real encontrado em produção: um aparelho com uma aba
    // aberta há um tempo (ou reabrindo o PWA) ficava rodando JS antigo por até 10 minutos após
    // cada publicação, e se esse aparelho salvasse alguma coisa nesse meio-tempo, reintroduzia
    // bugs que já tinham sido corrigidos (ex.: reverteu a liberação de feriado várias vezes).
    // O cache do Service Worker (abaixo) continua servindo normalmente quando o aparelho está
    // OFFLINE de verdade — só deixamos de usar o cache do navegador quando há rede disponível.
    fetch(e.request, { cache: 'reload' }).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(()=>{});
      return res;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('/index.html')))
  );
});
