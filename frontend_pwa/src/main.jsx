import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import { AuthProvider } from "./pages/AuthContext";
import { CartProvider } from "./pages/CartContext";
import { registerSW } from 'virtual:pwa-register';

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// ====== WORKBOX SERVICE WORKER REGISTRATION ======

if ("serviceWorker" in navigator) {
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      console.log("[PWA] Nouvelle version disponible");
    },
    onOfflineReady() {
      console.log("[PWA] Application prête pour le mode hors ligne");
    },
    onRegistered(registration) {
      console.log("[PWA] Service Worker enregistré:", registration);

      // Fonction pour envoyer le message de synchronisation
      const syncOrders = () => {
        const sw = registration?.active || registration?.waiting || registration?.installing;
        if (sw) {
          console.log("[Main] Envoi SYNC_ORDERS_NOW au service worker");
          sw.postMessage({ type: "SYNC_ORDERS_NOW" });
        } else {
          console.warn("[Main] Service worker non disponible pour la synchronisation");
          // Réessayer après un court délai
          setTimeout(() => {
            const swRetry = registration?.active || registration?.waiting || registration?.installing;
            if (swRetry) {
              console.log("[Main] Réessai d'envoi SYNC_ORDERS_NOW");
              swRetry.postMessage({ type: "SYNC_ORDERS_NOW" });
            }
          }, 2000);
        }
      };

      // Vérifier immédiatement si on est en ligne et synchroniser
      if (navigator.onLine) {
        console.log("[Main] Déjà en ligne au chargement, synchronisation immédiate...");
        // Plusieurs tentatives pour s'assurer que le SW est prêt
        setTimeout(syncOrders, 500);
        setTimeout(syncOrders, 2000);
        setTimeout(syncOrders, 5000);
      }

      // Quand on revient en ligne, demander au SW de rejouer les commandes
      window.addEventListener("online", () => {
        console.log("[Main] Connexion rétablie, synchronisation des commandes...");
        syncOrders();
        // Réessayer après quelques secondes au cas où
        setTimeout(syncOrders, 3000);
      });

      // Vérification périodique toutes les 30 secondes si on est en ligne
      setInterval(() => {
        if (navigator.onLine) {
          syncOrders();
        }
      }, 30000);

      // Écouter les changements d'état du service worker
      registration?.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "activated" && navigator.onLine) {
              console.log("[Main] Nouveau service worker activé, synchronisation...");
              syncOrders();
            }
          });
        }
      });
    },
    onRegisterError(error) {
      console.error("[PWA] Erreur lors de l'enregistrement du Service Worker:", error);
    },
  });
}
