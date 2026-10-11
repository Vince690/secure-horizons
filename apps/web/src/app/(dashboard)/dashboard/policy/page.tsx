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

  if (!form) return <p className="text-muted">Chargement…</p>;
  const set = (k: keyof SpendingPolicy, v: string | number) => setForm({ ...form, [k]: v });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setBusy(true);
    setMsg(null);
    try {
      await postJson("/api/dashboard/policy", { ...form, trusted_recipients: lines(trusted), blocked_recipients: lines(blocked), trusted_domains: lines(domains) }, "PUT");
      setMsg({ ok: true, text: "Mandat enregistré. Il s'applique à la prochaine demande de paiement." });
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : "Erreur" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Mandat" subtitle="Les limites que vos agents ne peuvent pas franchir. PayGuard les applique avant chaque paiement." />
      <form onSubmit={save} className="grid gap-6 md:grid-cols-2">
        <Card title="Rail Avalanche · montants (AVAX)">
          <div className="space-y-4">
            <Field label="Plafond par achat (AVAX)" hint="Au-dessus : 40 points retirés.">
              <input id="max_per_tx" className={inputClass} value={form.max_per_tx} onChange={(e) => set("max_per_tx", e.target.value)} />
            </Field>
            <Field label="Plafond sur 24 h (AVAX)" hint="Cumul des paiements approuvés sur une journée glissante.">
              <input id="max_daily" className={inputClass} value={form.max_daily} onChange={(e) => set("max_daily", e.target.value)} />
            </Field>
            <Field label="Solde plancher à conserver (AVAX)" hint="Aucun paiement ne peut faire passer le wallet en dessous.">
              <input id="min_balance" className={inputClass} value={form.min_balance} onChange={(e) => set("min_balance", e.target.value)} />
            </Field>
            <Field label="Confirmation humaine obligatoire au-dessus de (AVAX)" hint="Quel que soit le score, un humain tranche.">
              <input id="require_confirmation_above" className={inputClass} value={form.require_confirmation_above} onChange={(e) => set("require_confirmation_above", e.target.value)} />
            </Field>
            <label className="flex items-start gap-3 rounded-lg border border-line p-3">
              <input id="confirm_new_recipients" type="checkbox" className="mt-1" checked={form.confirm_new_recipients} onChange={(e) => setForm({ ...form, confirm_new_recipients: e.target.checked })} />
              <span>
                <span className="text-sm font-medium">Confirmer le premier paiement à tout nouveau bénéficiaire</span>
                <span className="mt-0.5 block text-xs text-muted">Même avec un bon score, un marchand jamais payé passe par vous la première fois. Ensuite il entre dans l'historique.</span>
              </span>
            </label>
          </div>
        </Card>
        <Card title="Rail carte virtuelle · montants (EUR, compte bancaire connecté)">
          <div className="space-y-4">
            <Field label="Plafond par achat (€)" hint="La carte à usage unique est plafonnée au montant exact approuvé, jamais au-dessus de ce plafond.">
              <input id="card_max_per_tx" className={inputClass} value={form.card.max_per_tx} onChange={(e) => setForm({ ...form, card: { ...form.card, max_per_tx: e.target.value } })} />
            </Field>
            <Field label="Plafond sur 24 h (€)">
              <input id="card_max_daily" className={inputClass} value={form.card.max_daily} onChange={(e) => setForm({ ...form, card: { ...form.card, max_daily: e.target.value } })} />
            </Field>
            <Field label="Solde bancaire plancher (€)" hint="Aucune carte n'est émise si le compte passerait en dessous.">
              <input id="card_min_balance" className={inputClass} value={form.card.min_balance} onChange={(e) => setForm({ ...form, card: { ...form.card, min_balance: e.target.value } })} />
            </Field>
            <Field label="Confirmation humaine obligatoire au-dessus de (€)">
              <input id="card_require_confirmation_above" className={inputClass} value={form.card.require_confirmation_above} onChange={(e) => setForm({ ...form, card: { ...form.card, require_confirmation_above: e.target.value } })} />
            </Field>
            <p className="rounded-lg bg-surface-2 p-3 text-xs text-muted">Bac à sable bancaire pour le hackathon. En production : connexion à votre banque (Revolut Business, Qonto…) ; l'argent ne quitte jamais votre compte, PayGuard n'y touche jamais.</p>
          </div>
        </Card>
        <Card title="Seuils de score">
          <div className="space-y-4">
            <Field label="Approbation automatique à partir de" hint="Score sur 100. En dessous, le paiement attend un humain.">
              <input id="auto_approve_score" type="number" min={0} max={100} className={inputClass} value={form.auto_approve_score} onChange={(e) => set("auto_approve_score", Number(e.target.value))} />
            </Field>
            <Field label="Blocage en dessous de" hint="Score sur 100. En dessous, refus immédiat.">
              <input id="hold_score" type="number" min={0} max={100} className={inputClass} value={form.hold_score} onChange={(e) => set("hold_score", Number(e.target.value))} />
            </Field>
            <p className="rounded-lg bg-surface-2 p-3 text-xs text-muted">
              Certains signaux bloquent quoi qu'il arrive : kill switch, bénéficiaire interdit, injection de prompt, instructions invisibles sur la page.
            </p>
          </div>
        </Card>
        <Card title="Bénéficiaires">
          <div className="space-y-4">
            <Field label="Marchands de confiance (adresses 0x, une par ligne)" hint="Pas de pénalité « bénéficiaire inconnu » ni « sans historique ».">
              <textarea id="trusted_recipients" rows={4} className={`${inputClass} font-mono text-xs`} value={trusted} onChange={(e) => setTrusted(e.target.value)} />
            </Field>
            <Field label="Adresses interdites (une par ligne)" hint="Blocage immédiat.">
              <textarea id="blocked_recipients" rows={3} className={`${inputClass} font-mono text-xs`} value={blocked} onChange={(e) => setBlocked(e.target.value)} />
            </Field>
          </div>
        </Card>
        <Card title="Domaines de confiance">
          <Field label="Domaines (un par ligne)" hint="Sert à repérer les imitations : n0rdsound.shop, nordsound-deals.shop…">
            <textarea id="trusted_domains" rows={4} className={`${inputClass} font-mono text-xs`} value={domains} onChange={(e) => setDomains(e.target.value)} />
          </Field>
          <div className="mt-6 flex items-center gap-4">
            <Button type="submit" disabled={busy}>{busy ? "Enregistrement…" : "Enregistrer le mandat"}</Button>
            {msg && <span className={`text-sm ${msg.ok ? "text-ok" : "text-crit"}`}>{msg.text}</span>}
          </div>
        </Card>
      </form>
    </>
  );
}
