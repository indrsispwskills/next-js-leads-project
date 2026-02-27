"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const data = await response.json();
      setError(data.error || "Login failed.");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <main className="container">
      <form className="card" onSubmit={handleSubmit}>
        <h2>Login</h2>
        <input placeholder="Email" type="email" onChange={(e) => setEmail(e.target.value)} required />
        <input placeholder="Password" type="password" minLength={6} onChange={(e) => setPassword(e.target.value)} required />
        {error ? <p>{error}</p> : null}
        <button type="submit">Sign In</button>
      </form>
    </main>
  );
}
