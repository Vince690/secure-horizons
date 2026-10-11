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
export function findLookalike(domain: string, references: Iterable<string>, options: { sameLabelOtherTldIsLookalike?: boolean } = {}): string | null {
  // Same name under another TLD: suspicious for an account's trusted merchant
  // (phishers register the .store of your .shop), normal for a global brand (amazon.de vs amazon.fr).
  const otherTld = options.sameLabelOtherTldIsLookalike ?? true;
  const d = domain.toLowerCase().replace(/^www\./, "");
  const refs = [...references].map((r) => r.toLowerCase().replace(/^www\./, ""));
  if (refs.includes(d)) return null; // it IS one of the references
  const label = domainLabel(d);
  const normalized = homoglyphNormalize(label);
  for (const raw of refs) {
    const ref = raw.toLowerCase().replace(/^www\./, "");
    if (ref === d) return null;
    const refLabel = domainLabel(ref);
    const refNormalized = homoglyphNormalize(refLabel);
    if (!refNormalized) continue;
    if (label === refLabel && !otherTld) continue;
    const sameAfterHomoglyphs = normalized === refNormalized;
    // "etsy" vs "ebay" or "ikea" vs "nike" are 2 edits apart: short names need an exact-ish match.
    const maxEdits = refLabel.length >= 7 ? 2 : refLabel.length >= 5 ? 1 : 0;
    const close = maxEdits > 0 && levenshtein(label, refLabel) <= maxEdits;
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

/** Well-known brands a scam site typically imitates (retail, banks, wallets, logins, carriers). */
export const KNOWN_BRANDS = [
  "amazon.fr", "amazon.com", "apple.com", "paypal.com", "fnac.com", "cdiscount.com", "darty.com", "boulanger.com",
  "leboncoin.fr", "zalando.fr", "nike.com", "samsung.com", "sony.fr", "bose.fr", "ldlc.com", "materiel.net",
  "rueducommerce.fr", "microsoft.com", "google.com", "revolut.com", "qonto.com", "nordsound.shop",
  "facebook.com", "instagram.com", "whatsapp.com", "tiktok.com", "telegram.org", "netflix.com", "spotify.com",
  "roblox.com", "steampowered.com", "adobe.com", "dropbox.com", "docusign.com", "linkedin.com",
  "binance.com", "coinbase.com", "metamask.io", "exodus.com", "trustwallet.com", "blockfi.com", "ledger.com",
  "chase.com", "wellsfargo.com", "bankofamerica.com", "suntrust.com", "hsbc.com", "barclays.co.uk",
  "bnpparibas.com", "credit-agricole.fr", "societegenerale.fr", "labanquepostale.fr", "boursorama.com", "caisse-epargne.fr",
  "usps.com", "dhl.com", "fedex.com", "ups.com", "laposte.fr", "chronopost.fr", "colissimo.fr", "mondialrelay.fr",
  "ameli.fr", "impots.gouv.fr", "orange.fr", "sfr.fr", "free.fr", "bouyguestelecom.fr", "ebay.com", "shopee.com",
  "mercadolibre.com", "ikea.com", "walmart.com", "bestbuy.com", "target.com", "aliexpress.com", "etsy.com", "vinted.fr",
];

/** Suffixes of free hosting / dynamic DNS services where anyone can publish in minutes. */
export const FREE_HOSTING_SUFFIXES = [
  "github.io", "vercel.app", "pages.dev", "netlify.app", "web.app", "firebaseapp.com", "webflow.io", "blogspot.com",
  "wordpress.com", "weebly.com", "wixsite.com", "glitch.me", "repl.co", "surge.sh", "000webhostapp.com", "craftum.io",
  "freepage.cc", "my.canva.site", "carrd.co", "r2.dev", "workers.dev", "herokuapp.com", "onrender.com", "fly.dev",
  "ddns.net", "ddnsking.com", "zapto.org", "serveirc.com", "redirectme.net", "webhop.me", "hopto.org", "no-ip.org",
  "servemp3.com", "sytes.net", "myftp.org", "duckdns.org", "ngrok.io", "ngrok-free.app", "trycloudflare.com",
  "amazonaws.com", "storage.googleapis.com", "blob.core.windows.net", "web.core.windows.net", "cloudfront.net",
  "jotform.com", "forms.gle", "typeform.com", "formstack.com", "yolasite.com", "weeblysite.com", "godaddysites.com",
  "mystrikingly.com", "square.site", "webnode.page", "webador.com", "site123.me", "simdif.com", "blogger.com",
  "wixstudio.io", "framer.app", "framer.website", "lovable.app", "bolt.host", "base44.app",
];

const MULTI_PART_TLDS = new Set(["co.uk", "org.uk", "ac.uk", "com.br", "com.au", "com.mx", "com.ar", "co.jp", "co.kr", "com.tr", "com.ua", "com.pe", "com.bi", "com.gr", "com.mu", "com.bn", "co.za", "com.sg", "com.my", "gouv.fr", "asso.fr"]);

/** "a.b.example.co.uk" -> "example.co.uk" (heuristic, good enough for scoring). */
export function registrableDomain(host: string): string {
  const parts = host.toLowerCase().replace(/^www\./, "").split(".");
  if (parts.length <= 2) return parts.join(".");
  const last2 = parts.slice(-2).join(".");
  return MULTI_PART_TLDS.has(last2) ? parts.slice(-3).join(".") : last2;
}

export function freeHostingSuffix(host: string): string | null {
  const h = host.toLowerCase();
  return FREE_HOSTING_SUFFIXES.find((suf) => h === suf || h.endsWith("." + suf)) ?? null;
}

/**
 * A known brand's name used as a label inside a hostname that is NOT the
 * brand's own domain: "roblox.com.bi", "binance-account-login.vercel.app",
 * "faecbook.vn" (homoglyph / 1 edit). Returns the impersonated brand.
 */
export function brandInHostname(host: string, brands: Iterable<string> = KNOWN_BRANDS): string | null {
  const h = host.toLowerCase().replace(/^www\./, "");
  const reg = registrableDomain(h);
  const labels = h.split(".").slice(0, -1).flatMap((l) => l.split("-")).filter((l) => l.length >= 4);
  for (const brand of brands) {
    const b = brand.toLowerCase();
    if (reg === b || h === b || h.endsWith("." + b)) return null; // the brand's own domain
    const bl = domainLabel(b).split(".")[0];
    if (bl.length < 4) continue;
    if (domainLabel(reg).split(".")[0] === bl) return null; // amazon.de is Amazon, not an impersonation
    for (const l of labels) {
      if (l === bl || homoglyphNormalize(l) === homoglyphNormalize(bl) || (bl.length >= 6 && levenshtein(l, bl) <= 1)) return b;
    }
  }
  return null;
}
