"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!response.ok) {
      const data = await response.json();
      setError(data.error || "Registration failed.");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <main className="container">
      <form className="card" onSubmit={handleSubmit}>
        <h2>Register</h2>
        <input placeholder="Name" onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input placeholder="Email" type="email" onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input placeholder="Password" type="password" minLength={6} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        {error ? <p>{error}</p> : null}
        <button type="submit">Create Account</button>
      </form>
    </main>
  );
}
