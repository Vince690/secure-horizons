"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Decision } from "@payguard/shared";
import { postJson, usePolling } from "./hooks";

const TOP_ITEMS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/decisions", label: "History" },
];

const SETTINGS_ITEMS = [
  { href: "/dashboard/policy", label: "Policy" },
  { href: "/dashboard/api-keys", label: "API Keys" },
];

const BOTTOM_ITEMS = [{ href: "/dashboard/audit", label: "Audit Log" }];

export function Nav({ companyName, email }: { companyName: string; email: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data } = usePolling<{ decisions: Decision[] }>("/api/dashboard/decisions?status=PENDING_CONFIRMATION&limit=50", 3000);
  const pending = data?.decisions.length ?? 0;

  const settingsActive = SETTINGS_ITEMS.some((item) => pathname.startsWith(item.href));
  const [settingsOpen, setSettingsOpen] = useState(settingsActive);

  async function logout() {
    await postJson("/api/dashboard/auth/logout");
    router.push("/login");
  }

  const linkClass = (href: string, exact = false) => {
    const active = exact ? pathname === href : pathname.startsWith(href);
    return `flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition ${
      active ? "bg-accent/15 text-accent" : "text-fg/80 hover:bg-surface-2"
    }`;
  };

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-line bg-surface p-4">
      <div className="mb-6 px-2">
        <div className="text-xs font-semibold uppercase tracking-widest text-accent">PayGuard</div>
        <div className="mt-1 truncate text-lg font-semibold">{companyName}</div>
        <div className="truncate text-xs text-muted">{email}</div>
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {TOP_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={linkClass(item.href, item.href === "/dashboard")}
          >
            {item.label}
            {item.href === "/dashboard" && pending > 0 && (
              <span className="rounded-full bg-warn px-2 py-0.5 text-xs font-bold text-black">{pending}</span>
            )}
          </Link>
        ))}

        {/* Settings collapsible group */}
        <button
          onClick={() => setSettingsOpen((o) => !o)}
          className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition ${
            settingsActive ? "bg-accent/15 text-accent" : "text-fg/80 hover:bg-surface-2"
          }`}
        >
          Settings
          <span
            className={`inline-block text-xs transition-transform duration-200 ${settingsOpen ? "rotate-180" : ""}`}
            aria-hidden="true"
          >
            ▾
          </span>
        </button>
        {settingsOpen && (
          <div className="ml-3 flex flex-col gap-1 border-l border-line pl-2">
            {SETTINGS_ITEMS.map((item) => (
              <Link key={item.href} href={item.href} className={linkClass(item.href)}>
                {item.label}
              </Link>
            ))}
          </div>
        )}

        {BOTTOM_ITEMS.map((item) => (
          <Link key={item.href} href={item.href} className={linkClass(item.href)}>
            {item.label}
          </Link>
        ))}
      </nav>
      <button onClick={logout} className="mt-4 rounded-lg px-3 py-2 text-left text-sm text-muted hover:bg-surface-2">
        Sign out
      </button>
    </aside>
  );
}
