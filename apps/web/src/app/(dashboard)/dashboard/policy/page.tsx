"use client";

import { useEffect, useState } from "react";
import type { SpendingPolicy } from "@payguard/shared";
import { postJson } from "@/components/hooks";
import { Button, Card, Field, inputClass, PageHeader } from "@/components/ui";

const lines = (v: string) => v.split(/[\n,;\s]+/).map((s) => s.trim()).filter(Boolean);

export default function PolicyPage() {
  const [form, setForm] = useState<SpendingPolicy | null>(null);
  const [trusted, setTrusted] = useState("");
  const [blocked, setBlocked] = useState("");
  const [domains, setDomains] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/dashboard/policy", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: SpendingPolicy) => {
        if (cancelled) return;
        setForm(data);
        setTrusted(data.trusted_recipients.join("\n"));
        setBlocked(data.blocked_recipients.join("\n"));
        setDomains(data.trusted_domains.join("\n"));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!form) return <p className="text-muted">Loading…</p>;
  const set = (k: keyof SpendingPolicy, v: string | number) => setForm({ ...form, [k]: v });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setBusy(true);
    setMsg(null);
    try {
      await postJson("/api/dashboard/policy", { ...form, trusted_recipients: lines(trusted), blocked_recipients: lines(blocked), trusted_domains: lines(domains) }, "PUT");
      setMsg({ ok: true, text: "Policy saved. Takes effect on the next payment request." });
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : "Error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Policy" subtitle="The limits your agents cannot exceed. PayGuard enforces them before every payment." />
      <form onSubmit={save} className="grid gap-6 md:grid-cols-2">
        <Card title="Avalanche rail · amounts (AVAX)">
          <div className="space-y-4">
            <Field label="Per-purchase cap (AVAX)" hint="Exceeded: 40 points deducted.">
              <input id="max_per_tx" className={inputClass} value={form.max_per_tx} onChange={(e) => set("max_per_tx", e.target.value)} />
            </Field>
            <Field label="24 h cap (AVAX)" hint="Cumulative total of approved payments over a rolling 24-hour window.">
              <input id="max_daily" className={inputClass} value={form.max_daily} onChange={(e) => set("max_daily", e.target.value)} />
            </Field>
            <Field label="Minimum wallet balance to keep (AVAX)" hint="No payment can bring the wallet below this floor.">
              <input id="min_balance" className={inputClass} value={form.min_balance} onChange={(e) => set("min_balance", e.target.value)} />
            </Field>
            <Field label="Require human confirmation above (AVAX)" hint="Regardless of score, a human must approve.">
              <input id="require_confirmation_above" className={inputClass} value={form.require_confirmation_above} onChange={(e) => set("require_confirmation_above", e.target.value)} />
            </Field>
            <label className="flex items-start gap-3 rounded-lg border border-line p-3">
              <input id="confirm_new_recipients" type="checkbox" className="mt-1" checked={form.confirm_new_recipients} onChange={(e) => setForm({ ...form, confirm_new_recipients: e.target.checked })} />
              <span>
                <span className="text-sm font-medium">Require confirmation for the first payment to any new recipient</span>
                <span className="mt-0.5 block text-xs text-muted">Even with a good score, a never-paid merchant goes through you the first time. After that it enters the history.</span>
              </span>
            </label>
          </div>
        </Card>
        <Card title="Virtual card rail · amounts (EUR, connected bank)">
          <div className="space-y-4">
            <Field label="Per-purchase cap (€)" hint="The single-use card is capped at the exact approved amount, never above this cap.">
              <input id="card_max_per_tx" className={inputClass} value={form.card.max_per_tx} onChange={(e) => setForm({ ...form, card: { ...form.card, max_per_tx: e.target.value } })} />
            </Field>
            <Field label="24 h cap (€)">
              <input id="card_max_daily" className={inputClass} value={form.card.max_daily} onChange={(e) => setForm({ ...form, card: { ...form.card, max_daily: e.target.value } })} />
            </Field>
            <Field label="Minimum bank balance (€)" hint="No card is issued if the account would go below this.">
              <input id="card_min_balance" className={inputClass} value={form.card.min_balance} onChange={(e) => setForm({ ...form, card: { ...form.card, min_balance: e.target.value } })} />
            </Field>
            <Field label="Require human confirmation above (€)">
              <input id="card_require_confirmation_above" className={inputClass} value={form.card.require_confirmation_above} onChange={(e) => setForm({ ...form, card: { ...form.card, require_confirmation_above: e.target.value } })} />
            </Field>
            <p className="rounded-lg bg-surface-2 p-3 text-xs text-muted">Banking sandbox for the hackathon. In production: connected to your bank (Revolut Business, Qonto…); funds never leave your account, PayGuard never touches them.</p>
          </div>
        </Card>
        <Card title="Score thresholds">
          <div className="space-y-4">
            <Field label="Auto-approve at or above" hint="Score out of 100. Below this, the payment waits for a human.">
              <input id="auto_approve_score" type="number" min={0} max={100} className={inputClass} value={form.auto_approve_score} onChange={(e) => set("auto_approve_score", Number(e.target.value))} />
            </Field>
            <Field label="Block below" hint="Score out of 100. Below this, immediate refusal.">
              <input id="hold_score" type="number" min={0} max={100} className={inputClass} value={form.hold_score} onChange={(e) => set("hold_score", Number(e.target.value))} />
            </Field>
            <p className="rounded-lg bg-surface-2 p-3 text-xs text-muted">
              Some signals always block regardless of score: kill switch, blocked recipient, prompt injection, hidden instructions on the page.
            </p>
          </div>
        </Card>
        <Card title="Recipients">
          <div className="space-y-4">
            <Field label="Trusted merchants (0x addresses, one per line)" hint="No 'unknown recipient' or 'no on-chain history' penalty.">
              <textarea id="trusted_recipients" rows={4} className={`${inputClass} font-mono text-xs`} value={trusted} onChange={(e) => setTrusted(e.target.value)} />
            </Field>
            <Field label="Blocked addresses (one per line)" hint="Immediate block.">
              <textarea id="blocked_recipients" rows={3} className={`${inputClass} font-mono text-xs`} value={blocked} onChange={(e) => setBlocked(e.target.value)} />
            </Field>
          </div>
        </Card>
        <Card title="Trusted domains">
          <Field label="Domains (one per line)" hint="Used to detect impersonation: n0rdsound.shop, nordsound-deals.shop…">
            <textarea id="trusted_domains" rows={4} className={`${inputClass} font-mono text-xs`} value={domains} onChange={(e) => setDomains(e.target.value)} />
          </Field>
          <div className="mt-6 flex items-center gap-4">
            <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save policy"}</Button>
            {msg && <span className={`text-sm ${msg.ok ? "text-ok" : "text-crit"}`}>{msg.text}</span>}
          </div>
        </Card>
      </form>
    </>
  );
}
