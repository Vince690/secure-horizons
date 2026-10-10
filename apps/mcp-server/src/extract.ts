/**
 * Naive HTML → text extractor that KEEPS hidden content but MARKS it, so the
 * guardian can tell "what a human saw" from "what only the agent saw".
 *
 * Marker syntax (stable contract, mirrored in apps/web/src/lib/guardian/text.ts):
 *   [[HIDDEN <why>]] ... [[/HIDDEN]]     text a human could not see
 *   [[COMMENT]] ... [[/COMMENT]]          HTML comment
 */
const HIDDEN_STYLE_RULES: Array<[RegExp, string]> = [
  [/display\s*:\s*none/i, "display:none"],
  [/visibility\s*:\s*hidden/i, "visibility:hidden"],
  [/opacity\s*:\s*0(?![.\d])/i, "opacity:0"],
  [/font-size\s*:\s*0(?:\.0+)?(?:px|em|rem|%)?\s*(?:;|!|$)/i, "font-size:0"],
  [/font-size\s*:\s*[01](?:\.\d+)?px\s*(?:;|!|$)/i, "font-size:1px"],
  [/(left|top)\s*:\s*-\d{3,}px/i, "off-screen"],
  [/(height|width)\s*:\s*0(px)?(?![.\d])/i, "zero size"],
];

const WHITE_RE = /(^|[^-\w])color\s*:\s*(#fff(?:fff)?\b|#f[ef]f[c-f][ef][0-9a-f]\b|white\b|rgba?\(\s*25[0-5]\s*,\s*25[0-5]\s*,\s*25[0-5])/i;
const BACKGROUND_RE = /background(?:-color)?\s*:\s*([^;]+)/i;

/** White text is only invisible when nothing dark is painted behind it. */
function whiteOnWhite(style: string): boolean {
  if (!WHITE_RE.test(style)) return false;
  const bg = style.match(BACKGROUND_RE)?.[1]?.trim().toLowerCase();
  if (!bg) return true;
  return /^(#fff(fff)?|white|transparent|none|rgba?\(\s*255\s*,\s*255\s*,\s*255)/.test(bg);
}

function hiddenReason(style: string): string | null {
  for (const [re, why] of HIDDEN_STYLE_RULES) if (re.test(style)) return why;
  if (whiteOnWhite(style)) return "white text";
  return null;
}

/** Class names whose <style> rules hide content. */
function hiddenClasses(html: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const m of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) {
    for (const rule of m[1].matchAll(/([^{}]+)\{([^}]*)\}/g)) {
      const why = hiddenReason(rule[2]);
      if (!why) continue;
      for (const cls of rule[1].matchAll(/\.([A-Za-z0-9_-]+)/g)) map.set(cls[1], why);
    }
  }
  return map;
}

function decode(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
}

function tagsToText(fragment: string): string {
  return decode(
    fragment
      .replace(/<br\s*\/?>|<\/p>|<\/div>|<\/li>|<\/h[1-6]>|<\/tr>|<\/section>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  );
}

const TAGS = "div|span|p|section|aside|footer|small|li|b|i|em|strong|a|td|th|h[1-6]";

function hiddenWhyFor(attrs: string, classes: Map<string, string>): string | null {
  const style = attrs.match(/style\s*=\s*"([^"]*)"/i)?.[1] ?? attrs.match(/style\s*=\s*'([^']*)'/i)?.[1] ?? "";
  const why = hiddenReason(style);
  if (why) return why;
  if (/(^|\s)hidden(\s|$|=)/i.test(attrs) && !/aria-hidden/i.test(attrs)) return "hidden attribute";
  if (/aria-hidden\s*=\s*"?true/i.test(attrs)) return "aria-hidden";
  const cls = attrs.match(/class\s*=\s*"([^"]*)"/i)?.[1] ?? "";
  for (const c of cls.split(/\s+/)) if (c && classes.has(c)) return `class .${c} (${classes.get(c)})`;
  return null;
}

/** Depth-aware scan: nested elements are inspected too, unlike a lazy regex. */
function markHiddenElements(html: string, classes: Map<string, string>): string {
  const openRe = new RegExp(`<(${TAGS})\\b([^>]*)>`, "gi");
  let result = "";
  let pos = 0;
  let m: RegExpExecArray | null;
  while ((m = openRe.exec(html))) {
    if (m.index < pos) continue;
    const why = hiddenWhyFor(m[2], classes);
    if (!why) continue;
    const tag = m[1].toLowerCase();
    const pairRe = new RegExp(`<(/?)${tag}\\b[^>]*>`, "gi");
    pairRe.lastIndex = m.index + m[0].length;
    let depth = 1;
    let innerEnd = -1;
    let end = -1;
    let p: RegExpExecArray | null;
    while ((p = pairRe.exec(html))) {
      if (p[1] === "/") {
        depth -= 1;
        if (depth === 0) {
          innerEnd = p.index;
          end = p.index + p[0].length;
          break;
        }
      } else {
        depth += 1;
      }
    }
    if (end < 0) continue;
    const text = tagsToText(html.slice(m.index + m[0].length, innerEnd)).replace(/\s+/g, " ").trim();
    result += html.slice(pos, m.index) + (text ? `\n[[HIDDEN ${why}]] ${text} [[/HIDDEN]]\n` : "");
    pos = end;
    openRe.lastIndex = end;
  }
  return result + html.slice(pos);
}

export function extractText(html: string): string {
  const classes = hiddenClasses(html);
  let out = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ");

  // 1. HTML comments
  out = out.replace(/<!--([\s\S]*?)-->/g, (_, c: string) => `\n[[COMMENT]] ${c.trim()} [[/COMMENT]]\n`);

  // 2. Elements hidden by inline style, hidden attribute, aria-hidden, or a hiding class.
  out = markHiddenElements(out, classes);

  return tagsToText(out)
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}

export function hasHiddenContent(text: string): boolean {
  return /\[\[(HIDDEN|COMMENT)/.test(text);
}
