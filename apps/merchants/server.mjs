// Serves the two demo merchant pages: legit on :4001, trap on :4002. No dependencies.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const sites = [
  { name: "legit (NordSound)", dir: "legit", port: Number(process.env.MERCHANT_LEGIT_PORT ?? 4001) },
  { name: "trap (N0rdSound)", dir: "trap", port: Number(process.env.MERCHANT_TRAP_PORT ?? 4002) },
];

for (const site of sites) {
  createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    const file = url.pathname === "/" || url.pathname === "/index.html" ? "index.html" : url.pathname.slice(1);
    try {
      const body = await readFile(path.join(here, site.dir, file));
      const type = file.endsWith(".css") ? "text/css" : file.endsWith(".svg") ? "image/svg+xml" : "text/html; charset=utf-8";
      res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store" });
      res.end(body);
    } catch {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found");
    }
  }).listen(site.port, () => console.log(`[merchants] ${site.name} -> http://localhost:${site.port}/`));
}
