// Serves the two demo merchant pages: legit on :4001, trap on :4002. No dependencies.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

// Read the root .env without any dependency: the legit merchant's payment address
// is a real wallet (see packages/contracts/scripts/merchant-wallet.ts), so demo
// funds can be swept back to the guardian instead of being burnt.
function readEnv(key) {
  try {
    const env = readFileSync(path.resolve(here, "../../.env"), "utf8");
    return env.match(new RegExp(`^${key}=(.*)$`, "m"))?.[1]?.trim() || "";
  } catch {
    return "";
  }
}
const LEGIT_PLACEHOLDER = "0x1111111111111111111111111111111111111111";
const ALT_PLACEHOLDER = "0x3333333333333333333333333333333333333333";
const legitAddress = readEnv("MERCHANT_LEGIT_ADDRESS") || LEGIT_PLACEHOLDER;
const altAddress = readEnv("MERCHANT_ALT_ADDRESS") || ALT_PLACEHOLDER;
const sites = [
  { name: "legit (NordSound)", dir: "legit", port: Number(process.env.MERCHANT_LEGIT_PORT ?? 4001) },
  { name: "trap (N0rdSound)", dir: "trap", port: Number(process.env.MERCHANT_TRAP_PORT ?? 4002) },
  { name: "alt (AudioPlanet, legit but pricier)", dir: "alt", port: Number(process.env.MERCHANT_ALT_PORT ?? 4003) },
];

for (const site of sites) {
  createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    const file = url.pathname === "/" || url.pathname === "/index.html" ? "index.html" : url.pathname.slice(1);
    try {
      let body = await readFile(path.join(here, site.dir, file));
      const type = file.endsWith(".css") ? "text/css" : file.endsWith(".svg") ? "image/svg+xml" : "text/html; charset=utf-8";
      if (site.dir === "legit" && file === "index.html") body = Buffer.from(body.toString("utf8").replaceAll(LEGIT_PLACEHOLDER, legitAddress));
      if (site.dir === "alt" && file === "index.html") body = Buffer.from(body.toString("utf8").replaceAll(ALT_PLACEHOLDER, altAddress));
      res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store" });
      res.end(body);
    } catch {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found");
    }
  }).listen(site.port, () => console.log(`[merchants] ${site.name} -> http://localhost:${site.port}/${site.dir === "legit" ? ` (pays to ${legitAddress})` : site.dir === "alt" ? ` (pays to ${altAddress})` : ""}`));
}
