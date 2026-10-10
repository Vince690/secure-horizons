/** Central place to read environment variables, with safe defaults for dev. */
const contractAddress = process.env.PAYGUARD_CONTRACT_ADDRESS?.trim() ?? "";
const explicitMode = process.env.CHAIN_MODE?.trim();

export const env = {
  databaseUrl: process.env.DATABASE_URL ?? "file:./dev.db",
  sessionSecret: process.env.SESSION_SECRET ?? "dev-only-session-secret-change-me",
  /** "fuji" only when asked for (or when a contract address is set and no explicit mode). */
  chainMode: (explicitMode === "fuji" || (!explicitMode && contractAddress) ? "fuji" : "mock") as "mock" | "fuji",
  fujiRpcUrl: process.env.FUJI_RPC_URL ?? "https://api.avax-test.network/ext/bc/C/rpc",
  guardianPrivateKey: process.env.GUARDIAN_PRIVATE_KEY?.trim() ?? "",
  contractAddress,
  mockBalance: process.env.MOCK_CHAIN_BALANCE ?? "2",
  merchantLegitAddress: process.env.MERCHANT_LEGIT_ADDRESS ?? "0x1111111111111111111111111111111111111111",
  snowtraceBaseUrl: process.env.SNOWTRACE_BASE_URL ?? "https://testnet.snowtrace.io",
  auditLogPath: process.env.AUDIT_LOG_PATH ?? "logs/audit.jsonl",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY?.trim() ?? "",
  llmModel: process.env.LLM_MODEL?.trim() || "claude-opus-5-5",
  llmTimeoutMs: Number(process.env.LLM_TIMEOUT_MS ?? 4000) || 4000,
};
