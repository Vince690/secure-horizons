"use client";

import { useState } from "react";
import type { KillSwitchState } from "@payguard/shared";
import { postJson, usePolling } from "./hooks";
import { Button, ExplorerLink } from "./ui";

/** Big red button with inline confirmation (no browser dialogs). */
export function KillSwitchButton() {
  const { data, refresh } = usePolling<KillSwitchState>("/api/dashboard/killswitch", 3000);
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const active = data?.active ?? false;

  async function toggle() {
    setBusy(true);
    setError(null);
    try {
      const res = await postJson<KillSwitchState & { onchain_error: string | null }>("/api/dashboard/killswitch", {
        active: !active,
        reason: reason || (active ? "re-armed from dashboard" : "manual activation from dashboard"),
      });
      if (res.onchain_error) setError(`Base à jour, mais la chaîne n'a pas répondu : ${res.onchain_error}`);
      setConfirming(false);
      setReason("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          title={active ? "Tous les paiements sont suspendus. Cliquer pour réarmer." : "Arrêt d'urgence : suspend tous les paiements des agents, en base et sur le contrat."}
          className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-semibold transition ${
            active ? "border-crit bg-crit/15 text-crit hover:bg-crit/25" : "border-line text-fg/80 hover:border-crit hover:text-crit"
          }`}
        >
          <span className={`h-2.5 w-2.5 rounded-full ${active ? "animate-pulse bg-crit" : "bg-ok"}`} />
          {active ? "Paiements suspendus · réarmer" : "Kill switch"}
        </button>
      ) : (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface-2 p-3">
          <span className="text-sm font-semibold">{active ? "Réautoriser tous les paiements ?" : "Suspendre TOUS les paiements des agents ?"}</span>
          {!active && (
            <input
              id="killswitch-reason"
              className="rounded-lg border border-line bg-bg px-2 py-1 text-sm"
              placeholder="Motif (optionnel)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          )}
          <Button variant={active ? "ok" : "danger"} onClick={toggle} disabled={busy}>
            {busy ? "Transaction en cours…" : active ? "Oui, réarmer" : "Oui, couper"}
          </Button>
          <Button variant="ghost" onClick={() => setConfirming(false)} disabled={busy}>
            Annuler
          </Button>
        </div>
      )}
      {active && (
        <div className="text-right text-xs text-crit">
          Actif depuis {data?.activated_at ? new Date(data.activated_at).toLocaleTimeString("fr-FR") : "—"}
          {data?.reason ? ` · ${data.reason}` : ""} · <ExplorerLink url={data?.onchain_tx?.explorer_url} label="pause() on-chain" />
        </div>
      )}
      {error && <div className="text-right text-xs text-warn">{error}</div>}
    </div>
  );
}
