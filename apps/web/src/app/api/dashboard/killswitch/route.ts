import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { setKillSwitch } from "@/lib/dashboard/service";
import { killSwitchSchema } from "@/lib/dashboard/validation";
import { loadKillSwitch } from "@/lib/guardian/service";
import { HttpError, withErrorHandling } from "@/lib/http";
import { readJson } from "@/lib/dashboard/http";

export const dynamic = "force-dynamic";

export const GET = withErrorHandling(async () => {
  const account = await requireSession();
  return NextResponse.json(await loadKillSwitch(account.id));
});

export const POST = withErrorHandling(async (request: Request) => {
  const account = await requireSession();
  const parsed = killSwitchSchema.safeParse(await readJson(request));
  if (!parsed.success) throw new HttpError("INVALID_REQUEST", "Invalid kill switch request", parsed.error.flatten());
  const reason = parsed.data.reason || (parsed.data.active ? "manual activation from dashboard" : "re-armed from dashboard");
  return NextResponse.json(await setKillSwitch(account.id, parsed.data.active, reason, "human"));
});
