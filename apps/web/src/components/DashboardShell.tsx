"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useState } from "react";
import { KillSwitchButton } from "@/components/KillSwitchButton";
import { Nav } from "@/components/Nav";
import { PageTransition } from "@/components/PageTransition";

/**
 * Full-width header (logo + network banner + kill switch) above everything, sidebar + main
 * content below it — the sidebar never extends above the header's logo row.
 */
export function DashboardShell({ companyName, children }: { companyName: string; children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center gap-4 border-b border-line bg-surface px-4 py-2">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex items-center rounded-lg px-2 py-1 transition hover:bg-surface-2"
          title={collapsed ? "Show sidebar" : "Hide sidebar"}
          aria-label={collapsed ? "Show sidebar" : "Hide sidebar"}
        >
          <Image src="/logo.png" alt={`PayGuard — ${companyName}`} width={34} height={44} className="h-10 w-auto opacity-80" priority />
        </button>
        <div className="flex-1 text-sm text-muted">Avalanche Fuji · test network · no real funds</div>
        <KillSwitchButton />
      </header>
      <div className="flex min-h-0 flex-1">
        <Nav collapsed={collapsed} />
        <main className="flex-1 overflow-auto p-8">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
