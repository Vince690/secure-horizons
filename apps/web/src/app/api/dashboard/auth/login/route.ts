import { NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/auth/session";
import { login, toAccountDto } from "@/lib/dashboard/service";
import { loginSchema } from "@/lib/dashboard/validation";
import { HttpError, withErrorHandling } from "@/lib/http";
import { readJson } from "@/lib/dashboard/http";

export const dynamic = "force-dynamic";

export const POST = withErrorHandling(async (request: Request) => {
  const parsed = loginSchema.safeParse(await readJson(request));
  if (!parsed.success) throw new HttpError("INVALID_REQUEST", "Invalid login", parsed.error.flatten());
  const account = await login(parsed.data.email.toLowerCase(), parsed.data.password);
  await setSessionCookie(account.id);
  return NextResponse.json({ account: toAccountDto(account) });
});
