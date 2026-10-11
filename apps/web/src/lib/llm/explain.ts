import type { EvaluatePaymentRequest, Reason, Verdict } from "@payguard/shared";
import { env } from "@/lib/env";
import { templateExplanation } from "@/lib/guardian/explain";
import { cacheGet, cacheKey, cacheSet } from "./cache";
import { firstText, getLlmClient, handleLlmError } from "./client";

const SYSTEM = `You are PayGuard, the guardian that controls the payments an AI agent wants to make on behalf of a company.
You are given a decision already made by deterministic rules (verdict, score, reasons). You do NOT judge: you explain.
Write exactly two sentences in English, for a non-technical executive, no jargon, no lists, no quotes.
First sentence: the decision and the key fact. Second sentence: why it matters to them (risk avoided or trust justified).
Never mention an amount or merchant absent from the data. No preamble.`;

export interface ExplainInput {
  verdict: Verdict;
  score: number;
  reasons: Reason[];
  request: EvaluatePaymentRequest;
}

/**
 * English explanation of a decision. Cached by what the explanation depends on
 * (verdict, score, reason codes, amount, recipient, purpose), NOT by the
 * decision hash: two identical demo runs must hit the cache, and the hash
 * changes every time (it contains the id and the timestamp).
 */
export async function explainDecision(input: ExplainInput): Promise<{ text: string; source: "llm" | "cache" | "template" }> {
  const fallback = templateExplanation(input.verdict, input.score, input.reasons, input.request);
  const key = cacheKey("explain", [
    env.llmModel,
    input.verdict,
    input.score,
    input.reasons.map((r) => r.code).sort(),
    input.request.amount,
    input.request.recipient.address.toLowerCase(),
    input.request.recipient.name ?? "",
    input.request.purpose,
  ]);
  const cached = await cacheGet(key);
  if (cached) return { text: cached, source: "cache" };

  const client = getLlmClient();
  if (!client) return { text: fallback, source: "template" };

  const facts = {
    verdict: input.verdict,
    score: input.score,
    amount_avax: input.request.amount,
    merchant: input.request.recipient.name ?? input.request.recipient.domain ?? input.request.recipient.address,
    purpose: input.request.purpose,
    signals: input.reasons.filter((r) => r.delta < 0).map((r) => ({ code: r.code, severity: r.severity, points: r.delta, detail: r.message })),
    positive_signals: input.reasons.filter((r) => r.delta >= 0).map((r) => r.message),
  };

  try {
    const response = await client.beta.messages.create({
      model: env.llmModel,
      max_tokens: 400, // two sentences, deliberately short
      system: SYSTEM,
      output_config: { effort: "low" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      messages: [{ role: "user", content: `Decision to explain (JSON):\n${JSON.stringify(facts, null, 2)}` }],
    });
    if (response.stop_reason === "refusal") return { text: fallback, source: "template" };
    const text = firstText(response.content as never).trim();
    if (text.length < 20) return { text: fallback, source: "template" };
    await cacheSet(key, text);
    return { text, source: "llm" };
  } catch (err) {
    handleLlmError("explain", err);
    return { text: fallback, source: "template" };
  }
}
