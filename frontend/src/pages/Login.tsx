import { useState } from "react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const doLogin = async () => {
    try {
      const res = await fetch("http://localhost:3010/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }

      localStorage.setItem("userId", data.userId);
      localStorage.setItem("role", data.role);

      window.location.href = "/rounds";
    } catch {
      setError("Network error");
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>Войти</h2>
      <input
        placeholder="Имя пользователя"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      /><br/><br/>
      <input
        placeholder="Пароль"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      /><br/><br/>
      <button onClick={doLogin}>Войти</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
