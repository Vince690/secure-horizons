"use client";

import type { Decision } from "@payguard/shared";
import { usePolling } from "@/components/hooks";
import { EmptyState, PageHeader } from "@/components/ui";
import { PendingApprovals } from "@/components/PendingApprovals";

export default function ApprovalsPage() {
  const { data, refresh } = usePolling<{ decisions: Decision[] }>("/api/dashboard/decisions?status=PENDING_CONFIRMATION&limit=50", 2000);
  const pending = data?.decisions ?? [];
  return (
    <>
      <PageHeader title="Pending Approvals" subtitle="Payments PayGuard has placed on hold: a human decides, the decision is anchored on Avalanche." />
      {data && pending.length === 0 && <EmptyState>Nothing to confirm. Payments above the confirmation threshold or with an intermediate score appear here.</EmptyState>}
      <PendingApprovals decisions={pending} refresh={refresh} />
    </>
  );
}
