import { useLocation, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getOrderById } from "../api";

function FacturePage() {
  const { orderId } = useParams();
  const location = useLocation();

  // On essaie d'abord de récupérer les données passées par navigate(...)
  const [order, setOrder] = useState(location.state?.order || null);
  const [items, setItems] = useState(location.state?.items || []);
  const [loading, setLoading] = useState(!location.state?.order);
  const [error, setError] = useState(null);

  // Si on n’a pas l’order complet, on va le chercher à l’API
  useEffect(() => {
    if (order) return;

    async function fetchOrder() {
      try {
        setLoading(true);
        setError(null);
        const data = await getOrderById(orderId);
        setOrder(data);
        // adapte selon la structure de ta réponse
        setItems(data.items || []);
      } catch (err) {
        console.error(err);
        setError("Impossible de charger la facture.");
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [order, orderId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="main-content" style={{ padding: 40 }}>
        Chargement de la facture...
      </div>
    );
  }

  if (error) {
    return (
      <div className="main-content" style={{ padding: 40 }}>
        <p style={{ color: "#fca5a5" }}>{error}</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="main-content" style={{ padding: 40 }}>
        Facture introuvable.
      </div>
    );
  }

  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.unit_price || item.price) * item.qty,
    0
  );
  const shipping = 19; // exemple
  const total = subtotal + shipping;

  return (
    <div
      className="main-content"
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "40px 16px",
        background: "radial-gradient(circle at top, #1e293b, #020617)",
      }}
    >
      <div
        className="invoice-card"
        style={{
          width: "100%",
          maxWidth: "800px",
          background: "rgba(15,23,42,0.95)",
          borderRadius: "24px",
          padding: "32px 40px",
          boxShadow: "0 24px 80px rgba(15,23,42,0.9)",
          color: "white",
        }}
      >
        {/* HEADER */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "24px",
          }}
        >
          <div>
            <h1 style={{ fontSize: "1.6rem", marginBottom: 4 }}>
              Facture #{order.id}
            </h1>
            <p className="muted">
              Date :{" "}
              {new Date(order.created_at || Date.now()).toLocaleString("fr-FR")}
            </p>
            <p className="muted">Statut : {order.status}</p>
          </div>

          <div style={{ textAlign: "right" }}>
            <h2 style={{ fontSize: "1.2rem" }}>Ma Boutique Gaming</h2>
            <p className="muted">Adresse, ville, Tunisie</p>
            <p className="muted">Tél : +216 xx xxx xxx</p>
          </div>
        </header>

        {/* CLIENT */}
        <section
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "24px",
          }}
        >
          <div>
            <h3 style={{ marginBottom: 8 }}>Client</h3>
            <p>{order.user_full_name || order.user?.username}</p>
            <p className="muted">{order.user_email}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <h3 style={{ marginBottom: 8 }}>Livraison</h3>
            <p>{order.shipping_address || "Adresse communiquée ultérieurement"}</p>
          </div>
        </section>

        {/* LIGNES DE COMMANDE */}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "16px",
            marginBottom: "24px",
          }}
        >
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(148,163,184,0.3)" }}>
              <th style={{ textAlign: "left", padding: "8px 0" }}>Produit</th>
              <th style={{ textAlign: "center" }}>Qté</th>
              <th style={{ textAlign: "right" }}>Prix unitaire</th>
              <th style={{ textAlign: "right" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const unit = Number(item.unit_price || item.price);
              const lineTotal = unit * item.qty;
              return (
                <tr key={item.id}>
                  <td style={{ padding: "6px 0" }}>{item.name || item.product_name}</td>
                  <td style={{ textAlign: "center" }}>{item.qty}</td>
                  <td style={{ textAlign: "right" }}>
                    {unit.toFixed(2)} TND
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {lineTotal.toFixed(2)} TND
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* RÉSUMÉ */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <div style={{ minWidth: "220px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <span>Sous-total</span>
              <span>{subtotal.toFixed(2)} TND</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <span>Livraison</span>
              <span>{shipping.toFixed(2)} TND</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 8,
                fontWeight: 700,
                fontSize: "1.1rem",
              }}
            >
              <span>Total</span>
              <span>{total.toFixed(2)} TND</span>
            </div>
          </div>
        </div>

        {/* BOUTONS */}
        <div
          style={{
            marginTop: "32px",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <button
            onClick={() => window.history.back()}
            className="btn btn-secondary"
          >
            Retour à la boutique
          </button>

          <button
            onClick={handlePrint}
            className="btn btn-primary"
            style={{ minWidth: "220px" }}
          >
            Imprimer la facture 🖨️
          </button>
        </div>
      </div>
    </div>
  );
}

export default FacturePage;
