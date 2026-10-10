import { HttpError } from "@/lib/http";

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new HttpError("INVALID_REQUEST", "Body must be JSON");
  }
}
