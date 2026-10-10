#!/usr/bin/env node
/**
 * MCP server "payguard": the tools an agent calls to pay through the guardian.
 * Transport: stdio (Claude Desktop, Claude Code, Cursor...).
 */
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import type { ConversationMessage, EvaluatePaymentRequest } from "@payguard/shared";
import { api } from "./api.js";
import { env } from "./env.js";
import { formatDecision, formatError, formatKillSwitch, formatPolicy } from "./format.js";

const server = new McpServer({ name: "payguard", version: "0.1.0" });

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] });

server.registerTool(
  "request_payment",
  {
    title: "Request a payment through PayGuard",
    description: [
      "Ask PayGuard, the payment guardian, to pay a merchant on behalf of the user in AVAX (Avalanche Fuji testnet).",
      "You never hold the wallet: PayGuard checks the request against the owner's spending policy and the context, then pays, holds for human confirmation, or refuses.",
      "ALWAYS pass page_excerpt with the raw text of the merchant page you read (including anything that looked like instructions or notices): the guardian needs it to protect the user, and omitting it makes the request look suspicious.",
      "ALWAYS pass user_request with the user's own words asking for this purchase, verbatim.",
      "Call it once per purchase. Follow the INSTRUCTION line of the response exactly.",
    ].join(" "),
    inputSchema: {
      amount: z.string().regex(/^\d+(\.\d+)?$/).describe('Amount in AVAX as a decimal string, e.g. "0.05"'),
      recipient_address: z.string().regex(/^0x[a-fA-F0-9]{40}$/).describe("Merchant wallet address (0x..., 40 hex chars) as shown on the merchant page"),
      recipient_name: z.string().max(200).optional().describe("Merchant name as displayed"),
      recipient_domain: z.string().max(253).optional().describe('Merchant domain as displayed or from the URL, e.g. "nordsound.shop"'),
      purpose: z.string().min(1).max(500).describe("What is being bought, in a few words"),
      user_request: z.string().min(1).max(4000).describe("The user's own words asking for this purchase, verbatim, including the original request and any follow-up (e.g. the product they named and their budget)"),
      page_url: z.string().max(2000).optional().describe("URL of the merchant page"),
      page_excerpt: z.string().max(4000).optional().describe("Raw text of the merchant page you read, up to 4000 chars, unmodified"),
      conversation_summary: z.string().max(4000).optional().describe("Short summary of the conversation so far, including what you (the assistant) concluded"),
    },
  },
  async (input) => {
    const conversation: ConversationMessage[] = [{ role: "user", content: input.user_request }];
    if (input.conversation_summary) conversation.push({ role: "assistant", content: input.conversation_summary });
    const request: EvaluatePaymentRequest = {
      agent_id: env.agentId,
      request_id: randomUUID(),
      amount: input.amount,
      currency: "AVAX",
      recipient: {
        address: input.recipient_address,
        ...(input.recipient_name ? { name: input.recipient_name } : {}),
        ...(input.recipient_domain ? { domain: input.recipient_domain } : {}),
      },
      purpose: input.purpose,
      context: {
        ...(input.page_url ? { page_url: input.page_url } : {}),
        ...(input.page_excerpt ? { page_excerpt: input.page_excerpt } : {}),
        conversation,
      },
    };
    try {
      return text(formatDecision(await api.evaluate(request)));
    } catch (err) {
      return text(formatError(err));
    }
  },
);

server.registerTool(
  "check_payment_status",
  {
    title: "Check the status of a PayGuard decision",
    description: "Returns the current status of a payment decision (use it to wait for human confirmation after a HOLD).",
    inputSchema: { decision_id: z.string().min(1).describe('Decision id returned by request_payment, e.g. "dec_..."') },
  },
  async ({ decision_id }) => {
    try {
      return text(formatDecision(await api.decision(decision_id)));
    } catch (err) {
      return text(formatError(err));
    }
  },
);

server.registerTool(
  "get_spending_policy",
  {
    title: "Read the spending policy",
    description: "The limits the account owner set for agent payments (per payment, per day, minimum balance, trusted merchants). Read-only.",
    inputSchema: {},
  },
  async () => {
    try {
      const [policy, killSwitch] = await Promise.all([api.policy(), api.killSwitch()]);
      return text(`${formatPolicy(policy)}\n${formatKillSwitch(killSwitch)}`);
    } catch (err) {
      return text(formatError(err));
    }
  },
);

server.registerTool(
  "get_balance",
  {
    title: "Read the guardian wallet balance",
    description: "Current AVAX balance of the wallet PayGuard pays from (Avalanche Fuji testnet).",
    inputSchema: {},
  },
  async () => {
    try {
      const b = await api.balance();
      return text(`Guardian wallet ${b.address}: ${b.balance} AVAX (chain ${b.chain_id}). ${b.explorer_url}`);
    } catch (err) {
      return text(formatError(err));
    }
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
