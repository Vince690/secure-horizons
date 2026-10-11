"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { postJson } from "@/components/hooks";
import { Button, Field, inputClass } from "@/components/ui";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await postJson("/api/dashboard/auth/signup", { email, password, company_name: company });
      router.push("/dashboard/policy");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create account");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-sm space-y-5 rounded-2xl border border-line bg-surface p-8">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-accent">PayGuard</div>
          <h1 className="mt-1 text-2xl font-semibold">Create an account</h1>
          <p className="mt-1 text-sm text-muted">You will then set the policy for your agents.</p>
        </div>
        <Field label="Company">
          <input id="company" className={inputClass} value={company} onChange={(e) => setCompany(e.target.value)} required />
        </Field>
        <Field label="Email">
          <input id="email" className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field label="Password" hint="8 characters minimum">
          <input id="password" className={inputClass} type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
        </Field>
        {error && <p className="text-sm text-crit">{error}</p>}
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? "Creating…" : "Create account"}
        </Button>
        <p className="text-center text-sm text-muted">
          Already have an account? <Link href="/login" className="text-accent hover:underline">Sign in</Link>
        </p>
      </form>
    </main>
  );
}
