// src/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // Au chargement, on récupère l'utilisateur depuis localStorage (si déjà connecté)
  useEffect(() => {
    const stored = localStorage.getItem("customer_info");
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  // Quand on se connecte
  function login(userData) {
    setUser(userData);
    localStorage.setItem("customer_info", JSON.stringify(userData));
  }

  // Quand on se déconnecte (plus tard)
  function logout() {
    setUser(null);
    localStorage.removeItem("customer_info");
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Petit hook pratique
export function useAuth() {
  return useContext(AuthContext);
}
