import { useState, type SyntheticEvent } from "react";
import { useNavigate } from "react-router-dom";
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
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Mot de passe"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {error && <p>{error}</p>}

      <button type="submit">Inscrivez vous</button>
    </form>
  );
}
