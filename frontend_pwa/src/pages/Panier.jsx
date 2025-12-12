// src/pages/Panier.jsx
import { useMemo } from "react";
import { useCart } from "../pages/CartContext";
import { createOrderFromCart } from "../api";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
function Panier() {
  const { cartItems,updateQty, removeFromCart, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();


  const handleCheckout = async () => {
    if (!cartItems.length) {
      alert("Votre panier est vide.");
      return;
    }
  
    // Sécurité : vérifier qu'on a bien un token
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("Veuillez vous connecter pour valider la commande.");
      return;
    }
  
    setLoading(true);
    setError(null);
  
    try {
      // On transforme les items du panier pour le backend
      const itemsPayload = cartItems.map((item) => ({
        product_id: item.id,
        quantity: item.qty,
      }));
  
      // 🔹 Appel API (via service worker si offline)
      const orderResponse = await createOrderFromCart(itemsPayload);
  
      // 🔹 Cas OFFLINE : la commande est mise en file d’attente par le SW
      if (orderResponse.queued) {
        alert(
          "Tu es hors connexion. Ta commande a été enregistrée et sera envoyée automatiquement dès que tu seras reconnecté ✅"
        );
  
        // 👉 si tu veux vider le panier quand même, dé-commente :
        // clearCart();
  
        return;
      }
  
      // 🔹 Cas normal : le backend renvoie la commande créée
      const order = orderResponse;
  
      // ✅ commande créée : on vide le panier local
      clearCart();
  
      alert(`Commande validée ! Numéro ${order.id ?? ""}. mabrouk 3lik 🎉`);
  
      // Navigation vers la page facture
      navigate(`/facture/${order.id}`, {
        state: {
          order,
          items: cartItems, // optionnel si tu veux réutiliser les lignes
        },
      });
  
      // 👉 La notif push est envoyée côté backend par notify_order_validated(order)
  
    } catch (err) {
      console.error("Erreur création commande :", err);
      
      // Vérifier si c'est une erreur réseau (offline)
      if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
        setError("Vous êtes hors ligne. Votre commande sera enregistrée et envoyée automatiquement dès que vous serez reconnecté.");
      } else {
        setError(err.message || "Impossible de valider la commande pour le moment.");
      }
    } finally {
      setLoading(false);
    }
  };
  




  const items = cartItems || [];

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + Number(item.price || 0) * (item.qty || 0),
        0
      ),
    [items]
  );

  const shipping = subtotal > 0 ? 19 : 0;
  const total = subtotal + shipping;

  if (!items.length) {
    return (
      <div className="cart-page">
        <div className="cart-grid">
          <section className="card cart-empty-card">
            <h2 className="section-title">Votre panier est vide</h2>
            <p className="muted">
              Ajoutez des produits depuis la page <strong>Produits</strong> pour
              les retrouver ici.
            </p>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-grid">
        {/* Liste des articles */}
        <section className="card cart-list-card">
          <h2 className="section-title">Votre panier</h2>
          <p className="section-subtitle">
            Vérifiez vos composants avant de valider la commande.
          </p>

          <table className="cart-table">
            <thead>
              <tr>
                <th>Produit</th>
                <th className="right">Prix</th>
                <th className="center">Qté</th>
                <th className="right">Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 12,
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 12,
                            background:
                              "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(15,23,42,0.9))",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 22,
                          }}
                        >
                          📦
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 600 }}>{item.name}</div>
                      </div>
                    </div>
                  </td>

                  <td className="right">
                    {Number(item.price).toFixed(2)}{" "}
                    <span className="muted small-label">TND</span>
                  </td>

                  <td className="center">
                    <div className="qty-control">
                      <button
                        type="button"
                        onClick={() => updateQty(item.id, -1)}
                      >
                        −
                      </button>
                      <span>{item.qty}</span>
                      <button
                        type="button"
                        onClick={() => updateQty(item.id, 1)}
                        disabled={item.stock && item.qty >= item.stock}
                      >
                        +
                      </button>
                    </div>
                  </td>

                  <td className="right">
                    {(Number(item.price) * item.qty).toFixed(2)}{" "}
                    <span className="muted small-label">TND</span>
                  </td>

                  <td className="right">
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => removeFromCart(item.id)}
                    >
                      Retirer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Résumé commande */}
        <section className="card cart-summary-card">
          <h2 className="section-title">Résumé</h2>

          <div className="summary-row">
            <span>Sous-total</span>
            <span>{subtotal.toFixed(2)} TND</span>
          </div>
          <div className="summary-row">
            <span>TVA</span>
            <span>{shipping ? `${shipping.toFixed(2)} TND` : "—"}</span>
          </div>

          <div className="summary-row summary-total">
            <span>Total</span>
            <span>{total.toFixed(2)} TND</span>
          </div>

          
          <button
              className="btn btn-primary"
              style={{ marginTop: "16px", width: "100%" }}
              disabled={loading || !cartItems.length}
              onClick={handleCheckout}
          >
            {loading ? "Validation de la commande..." : "Valider ma commande"}
            
          </button>

          <button
            className="btn-ghost"
            style={{ marginTop: "12px", width: "100%" }}
            onClick={clearCart}
          >
            Vider le panier
          </button>

          
        </section>
      </div>
    </div>
  );
}

export default Panier;
