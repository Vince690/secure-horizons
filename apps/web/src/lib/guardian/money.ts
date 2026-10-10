/**
 * Amounts travel as decimal strings ("0.05") to avoid float drift.
 * Internally we compare them as bigint wei (18 decimals), like the chain does.
 */
const DECIMALS = 18n;
const ONE = 10n ** DECIMALS;

export function parseAvax(value: string): bigint {
  const trimmed = value.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    throw new Error(`Invalid AVAX amount: "${value}"`);
  }
  const [whole, fraction = ""] = trimmed.split(".");
  const paddedFraction = (fraction + "0".repeat(18)).slice(0, 18);
  return BigInt(whole) * ONE + BigInt(paddedFraction);
}

export function formatAvax(wei: bigint): string {
  const whole = wei / ONE;
  const fraction = (wei % ONE).toString().padStart(18, "0").replace(/0+$/, "");
  return fraction.length > 0 ? `${whole}.${fraction}` : whole.toString();
}

export function sumAvax(values: string[]): bigint {
  return values.reduce((acc, v) => acc + parseAvax(v), 0n);
}

/** Median of a list of wei amounts, 0n when empty. */
export function medianWei(values: bigint[]): bigint {
  if (values.length === 0) return 0n;
  const sorted = [...values].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2n;
}
