import { useState } from "react";
import { signupCustomer } from "../api";

function Signup() {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);      // success
  const [error, setError] = useState(null);          // erreur

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try{
      const data = await signupCustomer(form);

      // tu peux stocker le client dans le localStorage si tu veux
      localStorage.setItem("customer_id", data.id);
      localStorage.setItem("customer_name", data.full_name);
      localStorage.setItem("customer_email", data.email);

      setMessage(`Bienvenue ${data.full_name} ! Ton compte a été créé.`);
      setForm({
        full_name: "",
        email: "",
        password: "",
        phone: "",
        address: "",
      });
    } catch (err) {
      console.error(err);
      setError(err.message || "Impossible de créer le compte.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <p className="auth-badge">Compte client</p>
          <h1 className="auth-title">Créer un compte</h1>
          <p className="auth-subtitle">
            Accède à ton panier, ton historique de commandes et à des offres
            gaming personnalisées.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-grid">
            <div className="form-group">
              <label>Nom complet</label>
              <input
                type="text"
                name="full_name"
                placeholder="Ex : Ghassen Gamer"
                value={form.full_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                placeholder="tu@mail.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="auth-grid">
            <div className="form-group">
              <label>Mot de passe</label>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label>Téléphone (optionnel)</label>
              <input
                type="text"
                name="phone"
                placeholder="+216..."
                value={form.phone}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Adresse (optionnel)</label>
            <input
              type="text"
              name="address"
              placeholder="Rue, ville, pays..."
              value={form.address}
              onChange={handleChange}
            />
          </div>

          {message && <p className="auth-message success">{message}</p>}
          {error && <p className="auth-message error">{error}</p>}

          <button className="btn btn-primary auth-submit" type="submit" disabled={loading}>
            {loading ? "Création en cours..." : "Créer mon compte"}
          </button>

          <p className="auth-footer-text">
            Tu as déjà un compte ? <a href="/login">Se connecter</a>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Signup;
