import { NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/auth/session";
import { signup, toAccountDto } from "@/lib/dashboard/service";
import { signupSchema } from "@/lib/dashboard/validation";
import { HttpError, withErrorHandling } from "@/lib/http";
import { readJson } from "@/lib/dashboard/http";

export const dynamic = "force-dynamic";

export const POST = withErrorHandling(async (request: Request) => {
  const parsed = signupSchema.safeParse(await readJson(request));
  if (!parsed.success) throw new HttpError("INVALID_REQUEST", "Invalid signup", parsed.error.flatten());
  const account = await signup(parsed.data.email.toLowerCase(), parsed.data.password, parsed.data.company_name);
  await setSessionCookie(account.id);
  return NextResponse.json({ account: toAccountDto(account) }, { status: 201 });
});
