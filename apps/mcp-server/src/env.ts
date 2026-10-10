import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";

// Claude Desktop launches us with an arbitrary cwd: resolve the root .env from this file.
const here = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.resolve(here, "../../../.env") });

export const env = {
  apiUrl: (process.env.PAYGUARD_API_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  apiKey: process.env.PAYGUARD_API_KEY ?? "",
  agentId: process.env.PAYGUARD_AGENT_ID ?? "claude-desktop",
};
