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

const server = new McpServer({ name: "demo-shop", version: "0.1.0" });


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
