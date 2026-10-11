import { redirect } from "next/navigation";
import { getSessionAccount } from "@/lib/auth/session";
import { KillSwitchButton } from "@/components/KillSwitchButton";
import { Nav } from "@/components/Nav";
import { PageTransition } from "@/components/PageTransition";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const account = await getSessionAccount();
  if (!account) redirect("/login");
  return (
    <div className="flex min-h-screen">
      <Nav companyName={account.companyName} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-line bg-surface/60 px-8 py-3">
          <div className="text-sm text-muted">Avalanche Fuji · test network · no real funds</div>
          <KillSwitchButton />
        </header>
        <main className="flex-1 p-8">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
