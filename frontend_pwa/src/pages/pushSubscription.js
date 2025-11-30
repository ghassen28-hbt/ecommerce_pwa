// src/pages/pushSubscription.js
const VAPID_PUBLIC_KEY = "BNmCOsyn3kiuZHb5_asnlgmghm2Vbf5TWtzFROJzW2Ti3RYh4Yaf901QIF1BX-Lhzt2OmNb1R5lTmwwA2rxFVcs"; // même que dans settings.py

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeUserToPush() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.log("Push non supporté.");
    return;
  }

  console.log("⏳ Attente du service worker prêt…");
  const registration = await navigator.serviceWorker.ready;
  console.log("✅ Service worker prêt:", registration);

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  console.log("🎯 Abonnement push:", subscription);

  // 🔐 Récupérer le token JWT de ton login
  const token = localStorage.getItem("accessToken");

  const res = await fetch("http://127.0.0.1:8000/api/save-subscription/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}), // <— ICI on ajoute le Bearer
    },
    body: JSON.stringify(subscription),
  });

  console.log("📡 Réponse backend save-subscription:", res.status);
  if (!res.ok) {
    const txt = await res.text();
    console.error("Erreur save-subscription:", txt);
  }

  alert("Abonné aux notifications push !");
}
