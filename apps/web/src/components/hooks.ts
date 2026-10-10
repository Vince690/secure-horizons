"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Polls a same-origin JSON endpoint; keeps the last good value while refreshing. */
export function usePolling<T>(url: string, intervalMs = 3000) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const alive = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(url, { cache: "no-store" });
      const json = await res.json();
      if (!alive.current) return;
      if (!res.ok) {
        setError(json?.error?.message ?? `HTTP ${res.status}`);
      } else {
        setData(json as T);
        setError(null);
      }
    } catch (err) {
      if (alive.current) setError(err instanceof Error ? err.message : String(err));
    } finally {
      if (alive.current) setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    alive.current = true;
    const first = setTimeout(() => void refresh(), 0);
    const id = setInterval(() => void refresh(), intervalMs);
    return () => {
      alive.current = false;
      clearTimeout(first);
      clearInterval(id);
    };
  }, [refresh, intervalMs]);

  return { data, error, loading, refresh };
}

export async function postJson<T>(url: string, body?: unknown, method: "POST" | "PUT" | "DELETE" = "POST"): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error?.message ?? `HTTP ${res.status}`);
  return json as T;
}
