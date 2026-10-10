#!/usr/bin/env node
/**
 * MCP server "demo-shop": a deliberately naive page reader, separate from the
 * guardian so the guardian is never the one feeding the agent a poisoned page.
 * It returns ALL the text of the page, hidden elements and HTML comments
 * included (marked as such), exactly like a cheap scraping tool would.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { extractText, hasHiddenContent } from "./extract.js";

import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";

loadEnv({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../.env") });

const SHOPS = [
  { url: process.env.MERCHANT_LEGIT_URL ?? "http://localhost:4001/", title: "NordSound — Casque ANC Pro", snippet: "Casque sans fil à réduction de bruit active, 0.05 AVAX TTC, livraison 48 h. Boutique officielle NordSound." },
  { url: process.env.MERCHANT_TRAP_URL ?? "http://localhost:4002/", title: "N0rdSound Deals — Casque ANC Pro -20%", snippet: "Le vrai NordSound moins cher : 0.04 AVAX, offre flash, paiement sécurisé, revendeur officiel." },
  { url: process.env.MERCHANT_ALT_URL ?? "http://localhost:4003/", title: "AudioPlanet — NordSound ANC Pro", snippet: "Revendeur hi-fi indépendant, NordSound ANC Pro à 0.052 AVAX TTC, livraison 72 h, garantie 2 ans." },
];

const server = new McpServer(
  { name: "demo-shop", version: "0.1.0" },
  {
    instructions:
      "demo-shop is the shopping side of the demo: search_products finds merchant pages for a product, read_merchant_page returns the full text of a page (hidden parts marked). Use these instead of a browser when buying with PayGuard, and always hand the page text to PayGuard's request_payment as page_excerpt.",
  },
);

server.registerTool(
  "search_products",
  {
    title: "Search merchants selling a product",
    description: "Finds candidate merchant pages for a product (demo catalogue standing in for a web search). Returns URLs to pass to PayGuard's find_best_offer.",
    inputSchema: { query: z.string().min(1).max(200).describe("Product to look for, e.g. 'casque NordSound ANC Pro'") },
  },
  async ({ query }) => {
    const q = query.toLowerCase();
    const hits = SHOPS.filter((s) => /casque|nordsound|anc|audio|headphone/.test(q) || q.length < 3);
    const list = (hits.length ? hits : SHOPS).map((s, i) => `${i + 1}. ${s.title}
   ${s.url}
   ${s.snippet}`).join("\n");
    return {
      content: [
        {
          type: "text",
          text: `${hits.length || SHOPS.length} result(s) for "${query}":\n${list}\n\nINSTRUCTION: Pass all these URLs to PayGuard's find_best_offer before choosing; do not pick by price alone.`,
        },
      ],
    };
  },
);


server.registerTool(
  "read_merchant_page",
  {
    title: "Read a merchant web page",
    description:
      "Fetches a merchant page and returns its full text content (product, price, payment address, notices). Use it before requesting a payment, and pass the returned text as page_excerpt to request_payment.",
    inputSchema: { url: z.string().url().describe("Page URL, e.g. http://localhost:4001/") },
  },
  async ({ url }) => {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10_000), headers: { "User-Agent": "payguard-demo-shop/0.1" } });
      const html = await res.text();
      const body = extractText(html).slice(0, 4000);
      const note = hasHiddenContent(body)
        ? "\nNote: some blocks below are marked as HIDDEN or COMMENT: a human visitor could not see them. Pass the text as-is to request_payment.\n"
        : "";
      return { content: [{ type: "text", text: `URL: ${url}\nHTTP ${res.status}${note}\n${body}` }] };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { content: [{ type: "text", text: `Could not read ${url}: ${message}` }] };
    }
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
