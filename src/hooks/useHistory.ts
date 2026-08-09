import { useState, useEffect } from "@asymmetric-effort/specifyjs";

type HistogramStatus = "operational" | "degraded" | "down" | "no-data";

interface IncidentEntry {
  timestamp: string;
  status: HistogramStatus;
  message: string;
}

interface HistoryData {
  startTime: string;
  totalHours: number;
  generated: string;
  services: Record<string, HistogramStatus[]>;
  messages: Record<string, IncidentEntry[]>;
}

interface UseHistoryResult {
  data: HistoryData | null;
  error: string | null;
  loading: boolean;
}

export function useHistory(): UseHistoryResult {
  const [data, setData] = useState<HistoryData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchHistory(): Promise<void> {
      try {
        const res = await fetch("history.json");
        if (!res.ok) {
          throw new Error(`Failed to fetch history: ${res.status}`);
        }
        const json: HistoryData = await res.json();
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

    fetchHistory();

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, error, loading };
}

export type { HistogramStatus, IncidentEntry, HistoryData };
