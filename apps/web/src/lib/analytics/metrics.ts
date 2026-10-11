import { prisma } from "@/lib/db";

export interface DailyBucket {
  date: string; // "YYYY-MM-DD"
  approved: number;
  blocked: number;
  held: number;
  total: number;
}

export interface DailySpend {
  date: string;
  avax: number;
  eur: number;
}

export interface DashboardMetrics {
  // Totals — over the selected period
  totalRequests: number;
  approved: number;
  blocked: number;
  held: number;
  approvalRate: number; // 0–100
  totalSpentAvax: number;
  totalSpentEur: number;
  avgTrustScore: number;

  // Tables
  topMerchants: Array<{ name: string; count: number; totalAvax: number }>;
  topRules: Array<{ code: string; count: number }>;

  // Charts
  dailyVolume: DailyBucket[]; // over the selected period, oldest first
  dailySpend: DailySpend[]; // over the selected period, oldest first
}

export async function getMetrics(accountId: string, days: number): Promise<DashboardMetrics> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const rows = await prisma.decision.findMany({
    where: { accountId, createdAt: { gte: since } },
    orderBy: { createdAt: "asc" },
    select: {
      status: true,
      verdict: true,
      score: true,
      amount: true,
      currency: true,
      rail: true,
      recipientName: true,
      recipientDomain: true,
      reasonsJson: true,
      createdAt: true,
    },
  });

  // bucket by date
  const buckets = new Map<string, DailyBucket>();
  const spendBuckets = new Map<string, DailySpend>();
  let totalSpentAvax = 0;
  let totalSpentEur = 0;
  let scoreSum = 0;
  let approved = 0;
  let blocked = 0;
  let held = 0;
  const merchantCounts = new Map<string, { count: number; totalAvax: number }>();
  const ruleCounts = new Map<string, number>();

  for (const row of rows) {
    const d = row.createdAt.toISOString().slice(0, 10);
    if (!buckets.has(d)) buckets.set(d, { date: d, approved: 0, blocked: 0, held: 0, total: 0 });
    if (!spendBuckets.has(d)) spendBuckets.set(d, { date: d, avax: 0, eur: 0 });
    const b = buckets.get(d)!;
    const s = spendBuckets.get(d)!;

    b.total += 1;
    if (row.status === "APPROVED") {
      b.approved += 1;
      approved += 1;
      const amount = Number(row.amount);
      if (row.currency === "AVAX") {
        totalSpentAvax += amount;
        s.avax += amount;
      } else {
        totalSpentEur += amount;
        s.eur += amount;
      }
    } else if (row.status === "BLOCKED" || row.status === "REJECTED") {
      b.blocked += 1;
      blocked += 1;
    } else if (row.status === "PENDING_CONFIRMATION") {
      b.held += 1;
      held += 1;
    }
    scoreSum += row.score;

    // merchants
    const key = row.recipientName ?? row.recipientDomain ?? "unknown";
    const m = merchantCounts.get(key) ?? { count: 0, totalAvax: 0 };
    m.count += 1;
    if (row.status === "APPROVED" && row.currency === "AVAX") m.totalAvax += Number(row.amount);
    merchantCounts.set(key, m);

    // rules
    const reasons: Array<{ code: string; delta: number }> = JSON.parse(row.reasonsJson ?? "[]");
    for (const r of reasons) {
      if (r.delta < 0) ruleCounts.set(r.code, (ruleCounts.get(r.code) ?? 0) + 1);
    }
  }

  // fill missing days
  const allDates: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    allDates.push(d);
  }

  return {
    totalRequests: rows.length,
    approved,
    blocked,
    held,
    approvalRate: rows.length ? Math.round((approved / rows.length) * 100) : 0,
    totalSpentAvax: Math.round(totalSpentAvax * 10000) / 10000,
    totalSpentEur: Math.round(totalSpentEur * 100) / 100,
    avgTrustScore: rows.length ? Math.round(scoreSum / rows.length) : 0,
    topMerchants: [...merchantCounts.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([name, v]) => ({ name, count: v.count, totalAvax: Math.round(v.totalAvax * 10000) / 10000 })),
    topRules: [...ruleCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([code, count]) => ({ code, count })),
    dailyVolume: allDates.map((d) => buckets.get(d) ?? { date: d, approved: 0, blocked: 0, held: 0, total: 0 }),
    dailySpend: allDates.map((d) => spendBuckets.get(d) ?? { date: d, avax: 0, eur: 0 }),
  };
}
