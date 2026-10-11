import { config } from "dotenv";
import path from "node:path";

// Load environment variables from project root
const envPath = path.resolve(__dirname, "../../.env");
config({ path: envPath });
