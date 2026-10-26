/* IngredIA — guarda la app en el teléfono para que abra rápido y funcione sin internet (el recetario). */
const VERSION = 'ingredia-v1';
const ARCHIVOS = ['./', 'index.html', 'styles.css', 'config.js', 'datos.js', 'motor.js', 'app.js', 'manifest.webmanifest',
  'iconos/icono-180.png', 'iconos/icono-192.png', 'iconos/icono-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return; // la IA y Google van directo
  // Primero la red (para recibir cambios), si no hay conexión, lo guardado.
  e.respondWith(
    fetch(e.request)
      .then(res => { const copia = res.clone(); caches.open(VERSION).then(c => c.put(e.request, copia)); return res; })
      .catch(() => caches.match(e.request))
  );
});
