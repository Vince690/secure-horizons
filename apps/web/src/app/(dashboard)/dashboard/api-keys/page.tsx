"use client";

import { useState } from "react";
import { postJson, usePolling } from "@/components/hooks";
import { formatDate } from "@/components/labels";
import { Button, Card, EmptyState, inputClass, PageHeader } from "@/components/ui";

interface ApiKeyRow { id: string; prefix: string; label: string; created_at: string; revoked_at: string | null }
interface Created { id: string; key: string; prefix: string; label: string }

export default function ApiKeysPage() {
  const { data, refresh } = usePolling<{ api_keys: ApiKeyRow[] }>("/api/dashboard/api-keys", 5000);
  const [label, setLabel] = useState("claude-desktop");
  const [created, setCreated] = useState<Created | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      setCreated(await postJson<Created>("/api/dashboard/api-keys", { label }));
      setCopied(false);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.key);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  async function revoke(id: string) {
    await postJson(`/api/dashboard/api-keys/${id}`, undefined, "DELETE");
    await refresh();
  }

  return (
    <>
      <PageHeader title="API Keys" subtitle="The key identifies your account when an agent calls PayGuard. Shown only once." />
      <div className="grid gap-6 md:grid-cols-2">
        <Card title="Create a key">
          <form onSubmit={create} className="flex gap-2">
            <input id="label" className={inputClass + " mt-0"} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Name (e.g. claude-desktop)" />
            <Button type="submit" disabled={busy}>Create</Button>
          </form>
          {created && (
            <div className="mt-4 rounded-lg border border-warn/50 bg-warn/10 p-4">
              <div className="text-sm font-semibold text-warn">Copy this key now — it will not be shown again.</div>
              <code className="mt-2 block break-all rounded bg-bg p-2 font-mono text-xs">{created.key}</code>
              <div className="mt-2 flex items-center gap-3">
                <Button variant="ghost" onClick={copy} type="button">{copied ? "Copied ✓" : "Copy"}</Button>
                <span className="text-xs text-muted">Set in <code>.env</code>: <code>PAYGUARD_API_KEY=…</code>, then restart Claude Desktop.</span>
              </div>
            </div>
          )}
        </Card>
        <Card title="Existing keys">
          {data && data.api_keys.length === 0 && <EmptyState>No API keys yet.</EmptyState>}
          <ul className="divide-y divide-line">
            {data?.api_keys.map((k) => (
              <li key={k.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="font-mono text-sm">{k.prefix}…</div>
                  <div className="text-xs text-muted">{k.label} · created {formatDate(k.created_at)}{k.revoked_at ? ` · revoked ${formatDate(k.revoked_at)}` : ""}</div>
                </div>
                {!k.revoked_at && <Button variant="ghost" onClick={() => revoke(k.id)}>Revoke</Button>}
                {k.revoked_at && <span className="text-xs text-muted">revoked</span>}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
