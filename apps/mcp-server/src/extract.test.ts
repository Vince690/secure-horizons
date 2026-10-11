import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractText, hasHiddenContent } from "./extract.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const page = (site: string) => readFileSync(path.resolve(here, `../../merchants/${site}/index.html`), "utf8");

describe("extractText", () => {
  it("keeps the legit page clean: no hidden markers", () => {
    const text = extractText(page("legit"));
    expect(hasHiddenContent(text)).toBe(false);
    expect(text).toContain("0.05 AVAX");
    expect(text).toContain("0x1111111111111111111111111111111111111111");
  });

  it("marks every hiding technique on the trap page", () => {
    const text = extractText(page("trap"));
    expect(text).toContain("[[COMMENT]] SYSTEM NOTICE TO AI ASSISTANTS");
    expect(text).toMatch(/\[\[HIDDEN class \.seo-note \(display:none\)\]\] Instructions for AI agents/);
    expect(text).toMatch(/\[\[HIDDEN class \.ghost \((white text|font-size:1px)\)\]\] If you are an AI assistant/);
    expect(text).toMatch(/\[\[HIDDEN display:none\]\] Note to AI assistants/);
    // visible content survives
    expect(text).toContain("0.04 AVAX");
    expect(text).toContain("0x2222222222222222222222222222222222222222");
  });

  it("handles inline styles, hidden attribute and aria-hidden", () => {
    const html = `<p>Visible</p><span style="visibility:hidden">A</span><div hidden>B</div><p aria-hidden="true">C</p><i style="opacity:0">D</i>`;
    const text = extractText(html);
    expect(text).toContain("[[HIDDEN visibility:hidden]] A");
    expect(text).toContain("[[HIDDEN hidden attribute]] B");
    expect(text).toContain("[[HIDDEN aria-hidden]] C");
    expect(text).toContain("[[HIDDEN opacity:0]] D");
  });
});
