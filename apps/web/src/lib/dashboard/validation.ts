import { z } from "zod";

const decimal = z.string().regex(/^\d+(\.\d+)?$/, "decimal string expected");
const address = z.string().regex(/^0x[a-fA-F0-9]{40}$/, "0x address expected");

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
  company_name: z.string().min(1).max(200),
});

export const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

export const policySchema = z.object({
  max_per_tx: decimal,
  max_daily: decimal,
  min_balance: decimal,
  auto_approve_score: z.number().int().min(0).max(100),
  hold_score: z.number().int().min(0).max(100),
  require_confirmation_above: decimal,
  trusted_recipients: z.array(address).max(100),
  blocked_recipients: z.array(address).max(100),
  trusted_domains: z.array(z.string().min(1).max(253)).max(100),
}).refine((p) => p.hold_score <= p.auto_approve_score, { message: "hold_score must be <= auto_approve_score" });

export const apiKeySchema = z.object({ label: z.string().min(1).max(100).default("dashboard") });

export const killSwitchSchema = z.object({ active: z.boolean(), reason: z.string().max(300).default("") });
