import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "../pages/AuthContext"; // ⬅️ adapte le chemin si besoin

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth(); // user connecté ou null
  const [cartItems, setCartItems] = useState([]);

  // 🔑 Clé de stockage dépendante de l'utilisateur
  const storageKey = user
    ? `cart_items_user_${user.user_id || user.id}` // selon ton objet user (loginWithJWT renvoie user_id)
    : "cart_items_guest";

  // Charger le panier lorsque l'utilisateur change (ou au premier rendu)
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        setCartItems(JSON.parse(stored));
      } catch {
        setCartItems([]);
      }
    } else {
      setCartItems([]);
    }
  }, [storageKey]);

  // Sauvegarder à chaque changement dans la bonne clé
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(cartItems));
  }, [cartItems, storageKey]);

  // Vider le panier de CE user
  const clearCart = useCallback(() => {
    setCartItems([]);
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  // Écouter les messages du service worker pour vider le panier après synchronisation
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const handleMessage = (event) => {
      if (event.data && event.data.type === "ORDERS_SYNCED") {
        console.log(`[Cart] ${event.data.count} commande(s) synchronisée(s), vidage du panier...`);
        clearCart();
      }
    };

    navigator.serviceWorker.addEventListener("message", handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener("message", handleMessage);
    };
  }, [clearCart]);

  // Ajouter un produit au panier
  function addToCart(product) {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, qty: item.qty + 1 }
            : item
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
  }

  // Modifier la quantité
  function updateQty(productId, delta) {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.id === productId
            ? { ...item, qty: Math.max(1, item.qty + delta) }
            : item
        )
        .filter((item) => item.qty > 0)
    );
  }

  // Supprimer un produit
  function removeFromCart(productId) {
    setCartItems((prev) => prev.filter((item) => item.id !== productId));
  }

  const value = {
    cartItems,
    addToCart,
    updateQty,
    removeFromCart,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
