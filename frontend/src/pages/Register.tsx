import { useState, type SyntheticEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../services/authService";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e: SyntheticEvent) {
    e.preventDefault();
    setError("");
    try {
      await register({ email, password });
      navigate("/login");
    } catch {
      setError("Cet email est déjà utilisé");
    }
  }

  return (
    <div className="matin dark">
      <div className="mt-auth">
        {/* Panneau gauche : pitch (caché en mobile via media query 880px) */}
        <div className="mt-auth-left">
          <div className="mt-auth-blob a"></div>
          <div className="mt-auth-blob b"></div>
          <div className="mt-auth-brand">
            <div className="mt-logo"></div>
            <span className="mt-brandname">Bonmatin</span>
          </div>
          <div className="mt-auth-pitch">
            <div className="mt-auth-eyebrow">TON ORGANISEUR DU MATIN</div>
            <h1 className="mt-auth-h">
              Commence ta journée
              <br />
              l'esprit <span>clair.</span>
            </h1>
            <p className="mt-auth-sub">
              Note tes tâches, fixe une deadline, et laisse Bonmatin t'envoyer
              le bon rappel au bon moment.
            </p>
            <div className="mt-auth-feats">
              <div className="mt-auth-feat">
                <span className="ic">📧</span> Un récap par email chaque matin à 8h.
              </div>
              <div className="mt-auth-feat">
                <span className="ic">🚩</span> Tes tâches en retard, toujours en évidence.
              </div>
              <div className="mt-auth-feat">
                <span className="ic">🏷️</span> Organisé par catégorie et priorité.
              </div>
            </div>
          </div>
        </div>

        {/* Panneau droit : la carte d'inscription */}
        <div className="mt-auth-right">
          <div className="mt-auth-card">
            <div className="mt-auth-tt">Crée ton compte</div>
            <div className="mt-auth-ts">
              Déjà inscrit ? <Link to="/login">Connecte-toi</Link>
            </div>

            <form className="mt-form" onSubmit={handleSubmit}>
              <div className="mt-field">
                <label>Adresse email</label>
                <input
                  className="mt-input"
                  type="email"
                  placeholder="toi@mail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="mt-field">
                <label>Mot de passe</label>
                <input
                  className="mt-input"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {error && <p className="mt-error">{error}</p>}

              <button type="submit" className="mt-btn-primary">
                Créer mon compte
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
