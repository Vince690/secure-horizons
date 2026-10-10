import type { Rule } from "../types";
import { killSwitch } from "./killSwitch";
import { recipientBlocklisted } from "./recipientBlocklisted";
import { minBalance } from "./minBalance";
import { amountOverTxLimit } from "./amountOverTxLimit";
import { dailyLimit } from "./dailyLimit";
import { promptInjection } from "./promptInjection";
import { purposeNotRequested } from "./purposeNotRequested";
import { recipientChanged } from "./recipientChanged";
import { domainLookalike } from "./domainLookalike";
import { recipientUnknown } from "./recipientUnknown";
import { velocity } from "./velocity";
import { priceAnomaly } from "./priceAnomaly";
import { urgency } from "./urgency";
import { recipientTrusted } from "./recipientTrusted";
import { hiddenInstructions } from "./hiddenInstructions";
import { pagePriceMismatch } from "./pagePriceMismatch";
import { pageAddressMismatch } from "./pageAddressMismatch";
import { pageProductMismatch } from "./pageProductMismatch";
import { recipientNoOnchainHistory } from "./recipientNoOnchainHistory";

/** Order = order of the table in docs/API.md §5. Order never changes the score. */
export const RULES: Rule[] = [
  killSwitch,
  recipientBlocklisted,
  minBalance,
  amountOverTxLimit,
  dailyLimit,
  promptInjection,
  hiddenInstructions,
  pagePriceMismatch,
  pageAddressMismatch,
  pageProductMismatch,
  purposeNotRequested,
  recipientChanged,
  domainLookalike,
  recipientUnknown,
  recipientNoOnchainHistory,
  velocity,
  priceAnomaly,
  urgency,
  recipientTrusted,
];
