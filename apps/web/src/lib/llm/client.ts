import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

// One client per process. If the API key is missing or rejected, the LLM
// features switch themselves off for the process: every decision must still
// come back in a few seconds without it.
const globalForLlm = globalThis as unknown as { llmClient?: Anthropic | null; llmDisabledReason?: string };

export function getLlmClient(): Anthropic | null {
  if (globalForLlm.llmClient !== undefined) return globalForLlm.llmClient;
  if (!env.anthropicApiKey) {
    globalForLlm.llmDisabledReason = "ANTHROPIC_API_KEY missing in .env";
    globalForLlm.llmClient = null;
    logger.info("llm", "disabled: ANTHROPIC_API_KEY missing, template explanations only");
    return null;
  }
  globalForLlm.llmClient = new Anthropic({ apiKey: env.anthropicApiKey, timeout: env.llmTimeoutMs, maxRetries: 0 });
  logger.info("llm", `enabled: model=${env.llmModel} timeout=${env.llmTimeoutMs}ms`);
  return globalForLlm.llmClient;
}

export function disableLlm(reason: string) {
  globalForLlm.llmDisabledReason = reason;
  globalForLlm.llmClient = null;
  logger.warn("llm", `disabled for this process: ${reason}`);
}

export function llmStatus(): { enabled: boolean; reason: string | null; model: string } {
  const client = getLlmClient();
  return { enabled: client !== null, reason: client ? null : (globalForLlm.llmDisabledReason ?? null), model: env.llmModel };
}

/** Text of the first text block, or "". */
export function firstText(content: Anthropic.ContentBlock[]): string {
  const block = content.find((b): b is Anthropic.TextBlock => b.type === "text");
  return block?.text ?? "";
}

/** Shared error policy: auth errors disable the LLM, everything else is logged and swallowed. */
export function handleLlmError(label: string, err: unknown) {
  if (err instanceof Anthropic.AuthenticationError) {
    disableLlm(`authentication failed (${label})`);
  } else if (err instanceof Anthropic.RateLimitError) {
    logger.warn("llm", `${label}: rate limited, falling back`);
  } else if (err instanceof Anthropic.APIError) {
    logger.warn("llm", `${label}: API error ${err.status}: ${err.message}`);
  } else {
    logger.warn("llm", `${label}: ${err instanceof Error ? err.message : String(err)}`);
  }
}
