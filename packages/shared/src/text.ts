/**
 * Text helpers shared by the guardian (apps/web) and the MCP tools
 * (apps/mcp-server): same lookalike logic, same hidden-block markers.
 */
export const EVM_ADDRESS_RE = /0x[a-fA-F0-9]{40}/g;

/** Markers written by the page reader (apps/mcp-server/src/extract.ts). */
export const HIDDEN_BLOCK_RE = /\[\[(HIDDEN[^\]]*|COMMENT)\]\]([\s\S]*?)\[\[\/(?:HIDDEN|COMMENT)\]\]/g;

export function normalizeAddress(address: string): string {
  return address.trim().toLowerCase();
}

/** Lowercase word tokens of 4+ letters/digits, accents stripped. */
export function tokens(text: string): string[] {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 4);
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let left = i;
    let diag = i - 1;
    for (let j = 1; j <= b.length; j++) {
      const up = prev[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const value = Math.min(up + 1, left + 1, diag + cost);
      diag = up;
      prev[j] = value;
      left = value;
    }
    prev[0] = i;
  }
  return prev[b.length];
}

/** Collapse the classic homoglyph swaps used in lookalike domains. */
export function homoglyphNormalize(domain: string): string {
  return domain
    .toLowerCase()
    .replace(/^www\./, "")
    .replace(/rn/g, "m")
    .replace(/0/g, "o")
    .replace(/1/g, "l")
    .replace(/3/g, "e")
    .replace(/5/g, "s")
    .replace(/[^a-z]/g, "");
}

/** Registrable label without TLD: "n0rdsound-deals.shop" -> "n0rdsound-deals". */
export function domainLabel(domain: string): string {
  const parts = domain.toLowerCase().replace(/^www\./, "").split(".");
  return parts.length > 1 ? parts.slice(0, -1).join(".") : parts[0];
}

/**
 * Does `domain` imitate one of `references`? Returns the imitated reference.
 * Exact matches are not lookalikes.
 */
export function findLookalike(domain: string, references: Iterable<string>): string | null {
  const d = domain.toLowerCase().replace(/^www\./, "");
  const label = domainLabel(d);
  const normalized = homoglyphNormalize(label);
  for (const raw of references) {
    const ref = raw.toLowerCase().replace(/^www\./, "");
    if (ref === d) return null;
    const refLabel = domainLabel(ref);
    const refNormalized = homoglyphNormalize(refLabel);
    if (!refNormalized) continue;
    const sameAfterHomoglyphs = normalized === refNormalized;
    const close = levenshtein(label, refLabel) <= 2;
    const prefixed = normalized.startsWith(refNormalized) && normalized.length <= refNormalized.length + 8;
    if (sameAfterHomoglyphs || close || prefixed) return ref;
  }
  return null;
}

/** Visible part of a page text: hidden blocks removed. */
export function visibleText(pageText: string): string {
  return pageText.replace(HIDDEN_BLOCK_RE, " ");
}

/** Hidden blocks of a page text with the reason they were invisible. */
export function hiddenBlocks(pageText: string): Array<{ why: string; text: string }> {
  return [...pageText.matchAll(HIDDEN_BLOCK_RE)].map((m) => ({ why: m[1], text: m[2].trim() }));
}

/** Well-known brands a scam site typically imitates (extend freely). */
export const KNOWN_BRANDS = [
  "amazon.fr", "amazon.com", "apple.com", "paypal.com", "fnac.com", "cdiscount.com", "darty.com", "boulanger.com",
  "leboncoin.fr", "zalando.fr", "nike.com", "samsung.com", "sony.fr", "bose.fr", "ldlc.com", "materiel.net",
  "rueducommerce.fr", "microsoft.com", "google.com", "revolut.com", "qonto.com", "nordsound.shop",
];
