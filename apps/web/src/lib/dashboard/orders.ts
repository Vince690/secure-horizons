import { prisma } from "@/lib/db";
import type { Currency, Rail } from "@payguard/shared";

/**
 * Order tracking derived from approved payments: no extra data source. The
 * merchant page the agent read tells us the delivery promise ("delivery in
 * 48 h", "72 h", "3 days"); the decision gives the product, merchant, amount,
 * rail and order time. Progress is time-based so the demo moves on its own.
 */
export type OrderStatus = "confirmed" | "preparing" | "shipped" | "out_for_delivery" | "delivered";

export interface Order {
  order_id: string;
  decision_id: string;
  product: string;
  merchant: string;
  merchant_domain: string | null;
  image_url: string | null;
  amount: string;
  currency: Currency;
  rail: Rail;
  ordered_at: string;
  delivery_hours: number;
  eta: string;
  tracking_number: string;
  status: OrderStatus;
  steps: Array<{ key: OrderStatus; label: string; at: string | null; done: boolean }>;
  proof_url: string | null;
}

const DEFAULT_DELIVERY_HOURS = 72;
/** Demo pacing: minutes after the order at which each step happens (delivery = ETA). */
const STEP_MINUTES: Record<Exclude<OrderStatus, "confirmed" | "delivered">, number> = { preparing: 1, shipped: 3, out_for_delivery: 6 };

export function deliveryHoursFrom(pageExcerpt: string | undefined): number {
  if (!pageExcerpt) return DEFAULT_DELIVERY_HOURS;
  const hours = pageExcerpt.match(/(?:delivery|livraison|shipping|ships?)[^.\n]{0,40}?(\d{1,3})\s?h\b/i) ?? pageExcerpt.match(/(\d{1,3})\s?h\s(?:delivery|livraison)/i);
  if (hours) return Number(hours[1]);
  const days = pageExcerpt.match(/(?:delivery|livraison|shipping|ships?)[^.\n]{0,40}?(\d{1,2})\s?(?:days?|jours?)\b/i);
  if (days) return Number(days[1]) * 24;
  return DEFAULT_DELIVERY_HOURS;
}

function trackingNumber(decisionId: string): string {
  const digits = decisionId.replace(/\D/g, "").padEnd(10, "7").slice(0, 10);
  return `PG${digits}FR`;
}

export async function listOrders(accountId: string, now = new Date()): Promise<Order[]> {
  const rows = await prisma.decision.findMany({ where: { accountId, status: "APPROVED" }, orderBy: { createdAt: "desc" }, take: 50 });
  return rows.map((row) => {
    const context = row.contextJson ? (JSON.parse(row.contextJson) as { page_url?: string; page_excerpt?: string }) : {};
    const deliveryHours = deliveryHoursFrom(context.page_excerpt);
    const orderedAt = row.resolvedAt ?? row.createdAt;
    const eta = new Date(orderedAt.getTime() + deliveryHours * 3_600_000);
    const elapsedMin = (now.getTime() - orderedAt.getTime()) / 60_000;
    const at = (minutes: number) => new Date(orderedAt.getTime() + minutes * 60_000);
    const delivered = now >= eta;
    const steps: Order["steps"] = [
      { key: "confirmed", label: "Order confirmed", at: orderedAt.toISOString(), done: true },
      { key: "preparing", label: "Being prepared", at: at(STEP_MINUTES.preparing).toISOString(), done: elapsedMin >= STEP_MINUTES.preparing },
      { key: "shipped", label: "Shipped", at: at(STEP_MINUTES.shipped).toISOString(), done: elapsedMin >= STEP_MINUTES.shipped },
      { key: "out_for_delivery", label: "Out for delivery", at: at(STEP_MINUTES.out_for_delivery).toISOString(), done: elapsedMin >= STEP_MINUTES.out_for_delivery },
      { key: "delivered", label: "Delivered", at: eta.toISOString(), done: delivered },
    ];
    const status = [...steps].reverse().find((s) => s.done)?.key ?? "confirmed";
    const pageUrl = context.page_url?.replace(/\/?$/, "/");
    const payment = row.paymentTxJson ? (JSON.parse(row.paymentTxJson) as { explorer_url?: string }) : null;
    const ledger = row.ledgerTxJson ? (JSON.parse(row.ledgerTxJson) as { explorer_url?: string }) : null;
    return {
      order_id: `ord_${row.id.replace(/^dec_/, "")}`,
      decision_id: row.id,
      product: row.purpose,
      merchant: row.recipientName ?? row.recipientDomain ?? "Merchant",
      merchant_domain: row.recipientDomain,
      image_url: pageUrl ? `${pageUrl}headset.jpg` : null,
      amount: row.amount,
      currency: row.currency as Currency,
      rail: row.rail as Rail,
      ordered_at: orderedAt.toISOString(),
      delivery_hours: deliveryHours,
      eta: eta.toISOString(),
      tracking_number: trackingNumber(row.id),
      status,
      steps,
      proof_url: payment?.explorer_url ?? ledger?.explorer_url ?? null,
    };
  });
}
