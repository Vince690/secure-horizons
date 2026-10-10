import type { ApiError, BalanceResponse, Decision, EvaluatePaymentRequest, KillSwitchState, SpendingPolicy } from "@payguard/shared";
import { env } from "./env.js";

export class PayGuardApiError extends Error {
  constructor(readonly status: number, readonly body: ApiError["error"]) {
    super(body.message);
    this.name = "PayGuardApiError";
  }
}

async function call<T>(method: "GET" | "POST", route: string, body?: unknown): Promise<T> {
  if (!env.apiKey) {
    throw new PayGuardApiError(401, { code: "UNAUTHORIZED", message: "PAYGUARD_API_KEY is not set in the root .env" });
  }
  const res = await fetch(`${env.apiUrl}${route}`, {
    method,
    headers: { Authorization: `Bearer ${env.apiKey}`, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });
  const json = (await res.json().catch(() => null)) as T | ApiError | null;
  if (!res.ok) {
    const err = (json as ApiError | null)?.error ?? { code: "INTERNAL" as const, message: `HTTP ${res.status}` };
    throw new PayGuardApiError(res.status, err);
  }
  return json as T;
}

export const api = {
  evaluate: (req: EvaluatePaymentRequest) => call<Decision>("POST", "/api/v1/payments/evaluate", req),
  decision: (id: string) => call<Decision>("GET", `/api/v1/payments/${encodeURIComponent(id)}`),
  policy: () => call<SpendingPolicy>("GET", "/api/v1/policy"),
  balance: () => call<BalanceResponse>("GET", "/api/v1/account/balance"),
  killSwitch: () => call<KillSwitchState>("GET", "/api/v1/killswitch"),
};
