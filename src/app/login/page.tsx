"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/login", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ token: token.trim() }) });
      let result: { error?: string } = {};
      try {
        result = await response.json();
      } catch {
        // Keep failed login messages generic if the server did not return JSON.
      }
      if (!response.ok) {
        setError(result.error ?? "Unable to sign in. Check the workspace token and try again.");
        return;
      }
      router.replace("/import");
    } catch {
      setError("Unable to sign in right now. Check the server and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return <main className="auth-shell"><form className="auth-card" onSubmit={submit}><p className="eyebrow accent">Private workspace</p><h1>Sign in</h1><p>Enter the single-user workspace token configured by the administrator.</p><label htmlFor="token">Workspace token</label><input id="token" type="password" value={token} onChange={(event) => setToken(event.target.value)} required autoComplete="current-password" /><button className="primary-button" type="submit" disabled={submitting}>{submitting ? "Signing in…" : "Continue"} <span>→</span></button>{error && <p className="error-text" role="alert">{error}</p>}</form></main>;
}
