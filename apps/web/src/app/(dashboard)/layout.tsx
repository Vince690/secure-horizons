import { redirect } from "next/navigation";
import { getSessionAccount } from "@/lib/auth/session";
import { DashboardShell } from "@/components/DashboardShell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const account = await getSessionAccount();
  if (!account) redirect("/login");
  return <DashboardShell companyName={account.companyName}>{children}</DashboardShell>;
}
