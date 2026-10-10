/** Central place to read environment variables, with safe defaults for dev. */
export const env = {
  databaseUrl: process.env.DATABASE_URL ?? "file:./dev.db",
  sessionSecret: process.env.SESSION_SECRET ?? "dev-only-session-secret-change-me",
  chainMode: (process.env.CHAIN_MODE ?? (process.env.PAYGUARD_CONTRACT_ADDRESS ? "fuji" : "mock")) as "mock" | "fuji",
  mockBalance: process.env.MOCK_CHAIN_BALANCE ?? "2",
  snowtraceBaseUrl: process.env.SNOWTRACE_BASE_URL ?? "https://testnet.snowtrace.io",
  auditLogPath: process.env.AUDIT_LOG_PATH ?? "logs/audit.jsonl",
};
