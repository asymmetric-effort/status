import { useState, useEffect } from "@asymmetric-effort/specifyjs";
import type { StatusData } from "../types.ts";

interface UseStatusResult {
  data: StatusData | null;
  error: string | null;
  loading: boolean;
}

export function useStatus(): UseStatusResult {
  const [data, setData] = useState<StatusData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchStatus(): Promise<void> {
      try {
        const res = await fetch("status.json");
        if (!res.ok) {
          throw new Error(`Failed to fetch status: ${res.status}`);
        }
        const json: StatusData = await res.json();
        if (!cancelled) {
          setData(json);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchStatus();

    // Re-fetch every 60 seconds
    const interval = setInterval(fetchStatus, 60000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return { data, error, loading };
}
