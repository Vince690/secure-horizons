"use client";

import { usePolling } from "@/components/hooks";
import { formatDate, formatMoney } from "@/components/labels";
import { Card, DecisionLink, EmptyState, ExplorerLink, PageHeader, RailBadge } from "@/components/ui";
import type { Order } from "@/lib/dashboard/orders";

const STATUS_LABEL: Record<Order["status"], string> = {
  confirmed: "Confirmed",
  preparing: "Being prepared",
  shipped: "Shipped",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
};

function etaLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" }) + " · " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export default function OrdersPage() {
  const { data } = usePolling<{ orders: Order[] }>("/api/dashboard/orders", 3000);
  const orders = data?.orders ?? [];
  return (
    <>
      <PageHeader title="Orders" subtitle="Every purchase your agents made through PayGuard, with the merchant's delivery promise and the on-chain proof." />
      {data && orders.length === 0 && <EmptyState>No orders yet. Ask your agent to buy something.</EmptyState>}
      <div className="grid gap-4 lg:grid-cols-2">
        {orders.map((o) => {
          const doneCount = o.steps.filter((s) => s.done).length;
          return (
            <Card key={o.order_id}>
              <div className="flex gap-5">
                <div className="h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-line bg-surface-2">
                  {o.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={o.image_url} alt={o.product} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-3xl">📦</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <DecisionLink id={o.decision_id}>
                        <div className="truncate text-lg font-semibold">{o.product}</div>
                      </DecisionLink>
                      <div className="text-sm text-muted">
                        {o.merchant}{o.merchant_domain ? ` · ${o.merchant_domain}` : ""} · {formatMoney(o.amount, o.currency)} <RailBadge rail={o.rail} />
                      </div>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${o.status === "delivered" ? "border-ok/40 bg-ok/10 text-ok" : "border-accent/40 bg-accent/10 text-accent"}`}>
                      {STATUS_LABEL[o.status]}
                    </span>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <dt className="text-muted">Ordered</dt><dd className="tabular">{formatDate(o.ordered_at)}</dd>
                    <dt className="text-muted">Estimated delivery</dt><dd className="tabular font-semibold">{etaLabel(o.eta)} <span className="font-normal text-muted">({o.delivery_hours} h promised)</span></dd>
                    <dt className="text-muted">Tracking</dt><dd className="font-mono text-xs">{o.tracking_number}</dd>
                    <dt className="text-muted">Proof</dt><dd><ExplorerLink url={o.proof_url} label="on-chain" /></dd>
                  </dl>
                </div>
              </div>
              <ol className="mt-5 grid grid-cols-5 gap-1">
                {o.steps.map((s, i) => (
                  <li key={s.key} className="text-center">
                    <div className={`mx-auto mb-1 h-2 rounded-full ${s.done ? "bg-ok" : i === doneCount ? "bg-warn/60" : "bg-line"}`} />
                    <div className={`text-[11px] leading-tight ${s.done ? "text-fg" : "text-muted"}`}>{s.label}</div>
                    <div className="tabular text-[10px] text-muted">{s.at ? new Date(s.at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : ""}</div>
                  </li>
                ))}
              </ol>
            </Card>
          );
        })}
      </div>
      <p className="mt-6 text-xs text-muted">Delivery estimates come from the merchant page the agent read (delivery promise). Tracking progress is simulated for the demo; a carrier integration would plug in here.</p>
    </>
  );
}
