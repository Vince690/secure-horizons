"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { Decision } from "@payguard/shared";
import { postJson, usePolling } from "./hooks";

const ITEMS = [
  { href: "/dashboard", label: "Vue d'ensemble" },
  { href: "/dashboard/approvals", label: "À confirmer", badge: true },
  { href: "/dashboard/decisions", label: "Décisions" },
  { href: "/dashboard/policy", label: "Mandat" },
  { href: "/dashboard/api-keys", label: "Clés API" },
  { href: "/dashboard/audit", label: "Journal d'audit" },
];

export function Nav({ companyName, email }: { companyName: string; email: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data } = usePolling<{ decisions: Decision[] }>("/api/dashboard/decisions?status=PENDING_CONFIRMATION&limit=50", 3000);
  const pending = data?.decisions.length ?? 0;

  async function logout() {
    await postJson("/api/dashboard/auth/logout");
    router.push("/login");
  }

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-line bg-surface p-4">
      <div className="mb-6 px-2">
        <div className="text-xs font-semibold uppercase tracking-widest text-accent">PayGuard</div>
        <div className="mt-1 truncate text-lg font-semibold">{companyName}</div>
        <div className="truncate text-xs text-muted">{email}</div>
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {ITEMS.map((item) => {
          const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition ${
                active ? "bg-accent/15 text-accent" : "text-fg/80 hover:bg-surface-2"
              }`}
            >
              {item.label}
              {item.badge && pending > 0 && <span className="rounded-full bg-warn px-2 py-0.5 text-xs font-bold text-black">{pending}</span>}
            </Link>
          );
        })}
      </nav>
      <button onClick={logout} className="mt-4 rounded-lg px-3 py-2 text-left text-sm text-muted hover:bg-surface-2">
        Se déconnecter
      </button>
    </aside>
  );
}
