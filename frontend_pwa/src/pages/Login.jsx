import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginWithJWT } from "../api";
import { useAuth } from "./AuthContext";

function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);

  const navigate = useNavigate();
  const { login } = useAuth();   // vient de AuthContext

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await loginWithJWT(form.username, form.password);

      // data renvoyé par l'API :
      // { user_id, customer_id, full_name, email }

      const userData = {
        userId: data.user_id,
        customerId: data.customer_id,
        fullName: data.full_name,
        email: data.email,
      };

      // on enregistre dans le contexte + localStorage
      login(userData);

      // Redirection vers la Home
      navigate("/");
    } catch (err) {
      console.error("Erreur login:", err);
      setError(err.message || "Email ou mot de passe invalide.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <p className="auth-badge">Connexion</p>
          <h1 className="auth-title">Se connecter</h1>
          <p className="auth-subtitle">
            Accède à ton compte client, ton panier et tes commandes.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nom d'utilisateur</label>
            <input
                type="text"
                name="username"
                placeholder="Nom d'utilisateur"
                value={form.username}
                onChange={handleChange}
                required
            />
          </div>

          <div className="form-group">
            <label>Mot de passe</label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          {error && <p className="auth-message error">{error}</p>}

          <button className="btn btn-primary auth-submit" type="submit" disabled={loading}>
            {loading ? "Connexion..." : "Se connecter"}
          </button>

          <p className="auth-footer-text">
            Pas encore de compte ? <a href="/signup">Créer un compte</a>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;
