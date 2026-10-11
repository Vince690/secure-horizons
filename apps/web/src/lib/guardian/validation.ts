import { z } from "zod";
import type { EvaluatePaymentRequest } from "@payguard/shared";

const address = z.string().regex(/^0x[a-fA-F0-9]{40}$/, "recipient.address must be a 0x-prefixed EVM address");
const amount = z.string().regex(/^\d+(\.\d+)?$/, "amount must be a decimal string like \"0.05\"");

export const evaluatePaymentSchema = z.object({
  agent_id: z.string().min(1).max(100),
  request_id: z.string().min(8).max(128),
  amount,
  currency: z.enum(["AVAX", "EUR"]),
  rail: z.enum(["avalanche", "virtual_card"]).optional(),
  recipient: z.object({
    address,
    name: z.string().max(200).optional(),
    domain: z.string().max(253).optional(),
  }),
  purpose: z.string().min(1).max(500),
  context: z
    .object({
      page_url: z.string().max(2000).optional(),
      page_excerpt: z.string().max(4000).optional(),
      conversation: z
        .array(z.object({ role: z.enum(["user", "assistant", "tool"]), content: z.string().max(4000) }))
        .max(50)
        .optional(),
    })
    .optional(),
}) satisfies z.ZodType<EvaluatePaymentRequest>;
