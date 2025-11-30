// ====== BACKGROUND SYNC – CONFIG ======
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





// ====== BACKGROUND SYNC – CONFIG ======










// =====================
// 1) OFFLINE / CACHING
// =====================

const STATIC_CACHE = "gmstore-static-v3";
const DATA_CACHE = "gmstore-data-v3";

// 🔗 Backend Django
const API_ORIGIN = "http://127.0.0.1:8000";
const API_PREFIX = "/api/";

// ------------ INSTALL : pré-cache du shell de l'app ------------
self.addEventListener("install", (event) => {
  console.log("[SW] Install");
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll([
        "/",                     // SPA
        "/index.html",
        "/manifest.webmanifest",
        "/icone/icone_192x192.png", 
        "/icone/icone_512x512.png",
      ]);
    })
  );
  self.skipWaiting();
});

// ------------ ACTIVATE : nettoyage des anciens caches ------------
self.addEventListener("activate", (event) => {
  console.log("[SW] Activate");
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (![STATIC_CACHE, DATA_CACHE].includes(key)) {
            console.log("[SW] Delete old cache", key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// ------------ Helpers cache ------------

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) {
    return cached;
  }
  const response = await fetch(request);
  cache.put(request, response.clone());
  return response;
}

async function networkWithCacheFallback(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    cache.put(request, response.clone());
    return response;
  } catch (err) {
    console.warn("[SW] Network failed, using cache for", request.url);
    const cached = await cache.match(request);
    if (cached) return cached;
    throw err;
  }
}

// ------------ FETCH : logique offline ------------

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method === "POST" && url.pathname === "/api/orders/create/") {
    event.respondWith(handleOrderCreateRequest(event));
    return;
  }

  if (request.method !== "GET") return;


  // 1) Ressources statiques (localhost:5173)
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // 2) API Django (http://127.0.0.1:8000/api/...)
  if (url.origin === API_ORIGIN && url.pathname.startsWith(API_PREFIX)) {
    event.respondWith(networkWithCacheFallback(request, DATA_CACHE));
    return;
  }

  
});



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
    icon: "/icon-192.png", // adapte selon tes icônes
    badge: "/icon-192.png",
    data: {
      url: data.url || "/", // pour que notificationclick puisse ouvrir une page
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






async function handleOrderCreateRequest(event) {
  const originalReq = event.request;

  try {
    // 🔹 On tente d'envoyer normalement au backend
    const networkResponse = await fetch(originalReq.clone());
    if (!networkResponse.ok) {
      // réponse HTTP 4xx / 5xx => on laisse l'erreur remonter
      return networkResponse;
    }
    return networkResponse;
  } catch (err) {
    // 🔹 Echec réseau (offline) => on met en file d'attente
    console.log("[SW] Impossible d'envoyer la commande, mise en file d'attente (offline).", err);

    let body = {};
    try {
      body = await originalReq.clone().json();
    } catch (e) {
      console.warn("[SW] Impossible de lire le body JSON de la commande", e);
    }

    const authHeader = originalReq.headers.get("Authorization") || null;

    await queueOrderForSync({
      url: originalReq.url,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body, // payload JSON
    });

    // On demande un background sync
    if ("sync" in self.registration) {
      try {
        await self.registration.sync.register("sync-orders");
        console.log("[SW] Background Sync 'sync-orders' enregistré");
      } catch (e) {
        console.warn("[SW] Echec enregistrement Background Sync", e);
      }
    }

    // Réponse fake 202 pour le front
    return new Response(
      JSON.stringify({
        queued: true,
        message:
          "Commande enregistrée hors ligne. Elle sera envoyée automatiquement à la reconnexion.",
      }),
      {
        status: 202,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}



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

  const origin = self.location.origin;
  let sentCount = 0;

  for (const order of orders) {
    const { request } = order;
    try {
      const res = await fetch(request.url || `${origin}/api/orders/create/`, {
        method: request.method || "POST",
        headers: request.headers || { "Content-Type": "application/json" },
        body: JSON.stringify(request.body || {}),
      });

      if (!res.ok) {
        throw new Error("HTTP " + res.status);
      }

      sentCount += 1;
    } catch (err) {
      console.error("[SW] Echec renvoi commande, remise en file", err);
      // On remet dans la file pour la prochaine sync
      await queueOrderForSync(request);
    }
  }

  if (sentCount > 0 && self.registration && self.registration.showNotification) {
    // 🔔 Notification locale de confirmation après resync
    await self.registration.showNotification("Commande synchronisée ✅", {
      body: `${sentCount} commande(s) hors ligne ont bien été envoyées au serveur.`,
      icon: "/icone/icone_192x192.png",
      badge: "/icone/icone_192x192.png",
    });
  }
}
