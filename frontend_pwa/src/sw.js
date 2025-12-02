// Service Worker personnalisé avec Workbox
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, setCatchHandler, setDefaultHandler } from 'workbox-routing';
import { NetworkFirst, CacheFirst, NetworkOnly } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';

// ====== BACKGROUND SYNC – CONFIG (IndexedDB) ======
const ORDER_DB_NAME = "gm-store-sync";
const ORDER_DB_VERSION = 1;
const ORDER_STORE = "pending_orders";

function openOrderDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(ORDER_DB_NAME, ORDER_DB_VERSION);

    req.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(ORDER_STORE)) {
        db.createObjectStore(ORDER_STORE, { keyPath: "id", autoIncrement: true });
      }
    };

    req.onsuccess = (event) => resolve(event.target.result);
    req.onerror = (event) => reject(event.target.error);
  });
}

async function queueOrderForSync(orderRequest) {
  const db = await openOrderDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ORDER_STORE, "readwrite");
    tx.objectStore(ORDER_STORE).add({
      createdAt: Date.now(),
      request: orderRequest, // { url, method, headers, body }
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getAllQueuedOrdersAndClear() {
  const db = await openOrderDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ORDER_STORE, "readwrite");
    const store = tx.objectStore(ORDER_STORE);
    const orders = [];

    store.openCursor().onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        orders.push({ id: cursor.key, ...cursor.value });
        cursor.delete(); // on efface pendant la lecture
        cursor.continue();
      }
    };

    tx.oncomplete = () => resolve(orders);
    tx.onerror = () => reject(tx.error);
  });
}

// ====== WORKBOX CONFIGURATION ======

// Nettoyer les anciens caches
cleanupOutdatedCaches();

// Pré-cache des assets statiques (injecté automatiquement par Workbox)
precacheAndRoute(self.__WB_MANIFEST);

// Configuration des stratégies de cache
const API_ORIGIN = "http://127.0.0.1:8000";
const API_PREFIX = "/api/";

// 1) Assets statiques (JS, CSS, images) - Cache First
registerRoute(
  ({ request }) => request.destination === 'script' || 
                   request.destination === 'style' || 
                   request.destination === 'image',
  new CacheFirst({
    cacheName: 'static-assets-v1',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 jours
      }),
    ],
  })
);

// 2) API GET - Network First avec fallback cache
registerRoute(
  ({ url }) => url.origin === API_ORIGIN && url.pathname.startsWith(API_PREFIX) && url.pathname !== `${API_PREFIX}orders/create/`,
  new NetworkFirst({
    cacheName: 'api-cache-v1',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 5, // 5 minutes
      }),
    ],
  })
);

// 3) Pages HTML - Network First
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'pages-cache-v1',
  })
);

// ====== GESTION DES COMMANDES HORS LIGNE ======

// Intercepter les requêtes POST pour les commandes
registerRoute(
  ({ url, request }) => 
    url.pathname === `${API_PREFIX}orders/create/` && 
    request.method === 'POST',
  async ({ request, event }) => {
    try {
      // Tenter d'envoyer normalement
      const networkResponse = await fetch(request.clone());
      if (!networkResponse.ok) {
        return networkResponse;
      }
      return networkResponse;
    } catch (err) {
      // Hors ligne : mettre en file d'attente
      console.log("[SW] Impossible d'envoyer la commande, mise en file d'attente (offline).", err);

      let body = {};
      try {
        body = await request.clone().json();
      } catch (e) {
        console.warn("[SW] Impossible de lire le body JSON de la commande", e);
      }

      const authHeader = request.headers.get("Authorization") || null;

      await queueOrderForSync({
        url: request.url,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body,
      });

      // Demander un background sync
      if ("sync" in self.registration) {
        try {
          await self.registration.sync.register("sync-orders");
          console.log("[SW] Background Sync 'sync-orders' enregistré");
        } catch (e) {
          console.warn("[SW] Echec enregistrement Background Sync", e);
        }
      }

      // Réponse 202 pour le front
      return new Response(
        JSON.stringify({
          queued: true,
          message: "Commande enregistrée hors ligne. Elle sera envoyée automatiquement à la reconnexion.",
        }),
        {
          status: 202,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }
);

// ====== BACKGROUND SYNC ======

self.addEventListener("sync", (event) => {
  if (event.tag === "sync-orders") {
    console.log("[SW] Sync event reçu: sync-orders");
    event.waitUntil(processQueuedOrders());
  }
});

async function processQueuedOrders() {
  const orders = await getAllQueuedOrdersAndClear();
  if (!orders.length) {
    console.log("[SW] Aucune commande en attente.");
    return;
  }

  console.log(`[SW] Envoi de ${orders.length} commande(s) en attente...`);

  let sentCount = 0;
  const failedOrders = [];

  for (const order of orders) {
    const { request } = order;
    try {
      const url = request.url || `${API_ORIGIN}${API_PREFIX}orders/create/`;
      console.log(`[SW] Envoi commande vers: ${url}`);
      
      const res = await fetch(url, {
        method: request.method || "POST",
        headers: request.headers || { "Content-Type": "application/json" },
        body: JSON.stringify(request.body || {}),
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        console.error(`[SW] Erreur HTTP ${res.status} pour la commande:`, errorText);
        throw new Error("HTTP " + res.status);
      }

      const responseData = await res.json().catch(() => ({}));
      console.log(`[SW] Commande envoyée avec succès:`, responseData);
      sentCount += 1;
    } catch (err) {
      console.error("[SW] Echec renvoi commande:", err);
      failedOrders.push(request);
    }
  }

  // Remettre les commandes échouées dans la file
  for (const failedRequest of failedOrders) {
    await queueOrderForSync(failedRequest);
  }

  if (sentCount > 0) {
    // Informer toutes les fenêtres pour vider le panier
    const clientList = await self.clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    });
    clientList.forEach((client) => {
      client.postMessage({ type: "ORDERS_SYNCED", count: sentCount });
    });

    if (self.registration && self.registration.showNotification) {
      await self.registration.showNotification("Commande synchronisée ✅", {
        body: `${sentCount} commande(s) hors ligne ont bien été envoyées au serveur.`,
        icon: "/icone/icone_192x192.png",
        badge: "/icone/icone_192x192.png",
      });
    }
  }
}

// ====== MESSAGES ======

self.addEventListener("message", (event) => {
  if (!event.data || !event.data.type) return;

  if (event.data.type === "SKIP_WAITING") {
    console.log("[SW] Forçage de l'activation de la nouvelle version");
    self.skipWaiting();
  } else if (event.data.type === "SYNC_ORDERS_NOW") {
    console.log("[SW] Message reçu: SYNC_ORDERS_NOW - Synchronisation des commandes...");
    event.waitUntil(processQueuedOrders());
  }
});

// ====== ACTIVATE - Vérification automatique des commandes ======

self.addEventListener("activate", (event) => {
  console.log("[SW] Activate - Vérification des commandes en attente...");
  event.waitUntil(
    (async () => {
      // Vérifier s'il y a des commandes en attente
      try {
        const db = await openOrderDB();
        const tx = db.transaction(ORDER_STORE, "readonly");
        const store = tx.objectStore(ORDER_STORE);
        const count = await new Promise((resolve) => {
          const req = store.count();
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => resolve(0);
        });
        
        if (count > 0) {
          console.log(`[SW] ${count} commande(s) trouvée(s) en attente dans IndexedDB`);
          if (navigator.onLine) {
            console.log("[SW] En ligne, synchronisation automatique des commandes...");
            await processQueuedOrders();
          } else {
            console.log("[SW] Hors ligne, les commandes seront synchronisées à la reconnexion");
          }
        }
      } catch (err) {
        console.error("[SW] Erreur lors de la vérification des commandes:", err);
      }
    })()
  );
  self.clients.claim();
});

// ====== PUSH NOTIFICATIONS ======

self.addEventListener("push", (event) => {
  console.log("[Service Worker] Push reçu:", event);

  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: "Notification", body: event.data?.text() || "" };
  }

  const title = data.title || "Nouvelle notification";
  const options = {
    body: data.body || "Vous avez un nouveau message.",
    icon: "/icone/icone_192x192.png",
    badge: "/icone/icone_192x192.png",
    data: {
      url: data.url || "/",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(urlToOpen) && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

