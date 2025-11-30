// src/components/NotificationsMenu.jsx
import { useEffect, useState, useRef } from "react";
import { getNotifications, markNotificationRead } from "../api";
import { subscribeUserToPush } from "../pages/pushSubscription";
import { useAuth } from "./AuthContext";

function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const menuRef = useRef(null);

    // 🔁 Quand l'utilisateur connecté change,
  // si la permission est déjà "granted", on renvoie la subscription automatiquement
  useEffect(() => {
    if (!user) {
      return; // rien si pas de user (déconnecté)
    }

    if (Notification.permission === "granted") {
      // Auto ré-abonnement pour lier cette machine au nouveau user + son token JWT
      subscribeUserToPush().catch((err) => {
        console.error("Erreur lors du resubscribe automatique:", err);
      });
    } else {
      console.log(
        "Permission notifications pas encore accordée. L'utilisateur doit cliquer sur le bouton 'Activer les notifications'."
      );
    }
  }, [user]);


  // Charger les notifications au montage
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Fermer le menu quand on clique en dehors
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function fetchNotifications() {
    try {
      setLoading(true);
      setError(null);
      const data = await getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error(err);
      setError("Impossible de charger les notifications.");
    } finally {
      setLoading(false);
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  async function handleMarkRead(id) {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, is_read: true } : n
        )
      );
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la mise à jour de la notification.");
    }
  }

  function formatDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleString();
  }
  //fonction hedi hiya eli t5ali fentre activier notifiction tatla3 
  const handleClick = async () => {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      await subscribeUserToPush();
      alert("Abonné aux notifications push !");
    } else {
      alert("Permission refusée.");
    }
  };

  return (
    <div className="notif-wrapper" ref={menuRef}>
      
      {/* Icône cloche */}
      <button
        type="button"
        className="notif-bell-btn"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="notif-bell-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="notif-badge">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Menu déroulant */}
      {open && (
        <div className="notif-dropdown">
          <div className="notif-dropdown-header">
            <button  className="notif-bell-btn"  onClick={handleClick}>Activer les notifications </button>
            <span>Notifications</span>
            <button
              type="button"
              className="notif-refresh-btn"
              onClick={fetchNotifications}
            >
              ⟳
            </button>
          </div>

          {loading ? (
            <div className="notif-empty">Chargement…</div>
          ) : error ? (
            <div className="notif-error">{error}</div>
          ) : notifications.length === 0 ? (
            <div className="notif-empty">Aucune notification.</div>
          ) : (
            <ul className="notif-list">
              {notifications.map((notif) => (
                <li
                  key={notif.id}
                  className={`notif-item ${
                    notif.is_read ? "notif-read" : "notif-unread"
                  }`}
                >
                  <div className="notif-main">
                    <div className="notif-title-row">
                      <span className="notif-title">{notif.title}</span>
                      {!notif.is_read && (
                        <span className="notif-dot" />
                      )}
                    </div>
                    <p className="notif-message">{notif.message}</p>
                    <span className="notif-date">
                      {formatDate(notif.created_at)}
                    </span>
                  </div>

                  <div className="notif-actions">
                    {notif.url && (
                      <a
                        href={notif.url}
                        className="notif-link"
                      >
                        Ouvrir
                      </a>
                    )}
                    {!notif.is_read && (
                      <button
                        type="button"
                        className="notif-mark-btn"
                        onClick={() => handleMarkRead(notif.id)}
                      >
                        Marquer comme lue
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationsMenu;
