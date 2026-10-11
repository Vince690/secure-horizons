import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { withErrorHandling } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Lists the benchmark runs stored in public/benchmark/*.json (summary + rows). */
export const GET = withErrorHandling(async () => {
  await requireSession();
  const dir = path.resolve(process.cwd(), "public/benchmark");
  let files: string[] = [];
  try {
    files = readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
  } catch {
    files = [];
  }
  const runs = files.map((f) => JSON.parse(readFileSync(path.join(dir, f), "utf8")));
  return NextResponse.json({ runs });
});
