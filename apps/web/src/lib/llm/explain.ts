import type { EvaluatePaymentRequest, Reason, Verdict } from "@payguard/shared";
import { env } from "@/lib/env";
import { templateExplanation } from "@/lib/guardian/explain";
import { cacheGet, cacheKey, cacheSet } from "./cache";
import { firstText, getLlmClient, handleLlmError } from "./client";

const SYSTEM = `Tu es PayGuard, le gardien qui contrôle les paiements qu'un agent IA veut faire pour le compte d'une entreprise.
On te donne une décision déjà prise par des règles déterministes (verdict, score, motifs). Tu n'as PAS à juger : tu expliques.
Rédige exactement deux phrases en français, pour un dirigeant non technique, sans jargon, sans liste, sans guillemets.
Première phrase : la décision et le fait marquant. Seconde phrase : pourquoi c'est important pour lui (risque évité ou confiance justifiée).
Ne mentionne jamais de montant ou de marchand absent des données. Pas de préambule.`;

export interface ExplainInput {
  verdict: Verdict;
  score: number;
  reasons: Reason[];
  request: EvaluatePaymentRequest;
}

/**
 * French explanation of a decision. Cached by what the explanation depends on
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
      messages: [{ role: "user", content: `Décision à expliquer (JSON) :\n${JSON.stringify(facts, null, 2)}` }],
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
