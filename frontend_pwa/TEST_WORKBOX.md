# Guide de Test - Intégration Workbox

## ✅ Tests à effectuer

### 1. **Démarrer le serveur de développement**
```bash
cd frontend_pwa
npm run dev
```

### 2. **Vérifier l'enregistrement du Service Worker**

1. Ouvre `http://localhost:5173` dans Chrome
2. Ouvre les DevTools (F12)
3. Va dans l'onglet **Application** → **Service Workers**
4. Tu devrais voir :
   - ✅ Service Worker enregistré
   - ✅ État : **activated**
   - ✅ Source : `sw.js`

### 3. **Vérifier les logs dans la console**

Dans la console du navigateur, tu devrais voir :
```
[PWA] Service Worker enregistré: ServiceWorkerRegistration
[PWA] Application prête pour le mode hors ligne
```

### 4. **Tester le Precaching (Cache des assets)**

1. Va dans **Application** → **Cache Storage**
2. Tu devrais voir des caches Workbox :
   - `workbox-precache-v2-...` (assets pré-cachés)
   - `static-assets-v1` (JS, CSS, images)
   - `api-cache-v1` (réponses API)
   - `pages-cache-v1` (pages HTML)

### 5. **Tester le mode hors ligne**

1. Dans DevTools → **Network** → coche **Offline**
2. Recharge la page → l'application devrait fonctionner
3. Navigue entre les pages → tout devrait être accessible depuis le cache

### 6. **Tester les commandes hors ligne**

1. Passe en mode **Offline**
2. Connecte-toi (si nécessaire)
3. Ajoute des produits au panier
4. Valide une commande
5. Tu devrais voir dans la console :
   ```
   [SW] Impossible d'envoyer la commande, mise en file d'attente (offline).
   [SW] Background Sync 'sync-orders' enregistré
   ```
6. Vérifie dans **Application** → **IndexedDB** → `gm-store-sync` → `pending_orders`
   - Tu devrais voir ta commande stockée

### 7. **Tester la synchronisation automatique**

1. Reviens **en ligne** (décoche Offline)
2. Dans la console, tu devrais voir :
   ```
   [Main] Connexion rétablie, synchronisation des commandes...
   [SW] Message reçu: SYNC_ORDERS_NOW - Synchronisation des commandes...
   [SW] Envoi de X commande(s) en attente...
   [SW] Commande envoyée avec succès
   ```
3. Le panier devrait se vider automatiquement
4. Tu devrais recevoir une notification : "Commande synchronisée ✅"

### 8. **Tester le Manifest PWA**

1. Va dans **Application** → **Manifest**
2. Vérifie que toutes les informations sont correctes :
   - Name: GASTON Gaming Store
   - Short name: G Store
   - Icons: 192x192 et 512x512
   - Theme color: #0f172a

### 9. **Tester le build de production**

```bash
npm run build
npm run preview
```

1. Ouvre `http://localhost:4173` (ou le port indiqué)
2. Vérifie que le service worker fonctionne en production
3. Teste le mode hors ligne

## 🔍 Points de vérification

- [ ] Service Worker enregistré et activé
- [ ] Caches Workbox créés
- [ ] Application fonctionne en mode hors ligne
- [ ] Commandes stockées dans IndexedDB quand offline
- [ ] Synchronisation automatique à la reconnexion
- [ ] Panier vidé après synchronisation
- [ ] Notifications push fonctionnent
- [ ] Manifest PWA correct

## 🐛 En cas de problème

1. **Service Worker non enregistré** :
   - Vérifie la console pour les erreurs
   - Va dans **Application** → **Service Workers** → **Unregister** tous les SW
   - Recharge la page

2. **Erreur de compilation** :
   - Vérifie que `vite-plugin-pwa` est bien installé
   - Vérifie que `src/sw.js` existe

3. **Cache ne fonctionne pas** :
   - Vérifie dans **Application** → **Cache Storage**
   - Nettoie les caches et recharge

4. **Synchronisation ne fonctionne pas** :
   - Vérifie les logs dans la console
   - Vérifie dans IndexedDB que les commandes sont bien stockées
   - Vérifie que le backend Django est démarré sur `http://127.0.0.1:8000`

