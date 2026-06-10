import { useState, type SyntheticEvent } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/authService";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e: SyntheticEvent) {
    e.preventDefault(); // no loading page
    setError(""); // reset the State
    try {
      await login({ email, password });
      navigate("/dashboard");
    } catch {
      setError("Identifiants incorrects");
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

      <button type="submit">Se connecter</button>
    </form>
  );
}
