"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { postJson } from "@/components/hooks";
import { Button, Field, inputClass } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("demo@payguard.dev");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await postJson("/api/dashboard/auth/login", { email, password });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion impossible");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-sm space-y-5 rounded-2xl border border-line bg-surface p-8">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-accent">PayGuard</div>
          <h1 className="mt-1 text-2xl font-semibold">Connexion</h1>
          <p className="mt-1 text-sm text-muted">Le gardien entre vos agents IA et votre argent.</p>
        </div>
        <Field label="E-mail">
          <input id="email" className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field label="Mot de passe">
          <input id="password" className={inputClass} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </Field>
        {error && <p className="text-sm text-crit">{error}</p>}
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? "Connexion…" : "Se connecter"}
        </Button>
        <p className="text-center text-sm text-muted">
          Pas de compte ? <Link href="/signup" className="text-accent hover:underline">Créer un compte</Link>
        </p>
      </form>
    </main>
  );
}
