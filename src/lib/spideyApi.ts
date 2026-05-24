export type SpideyStats = {
  status: "idle" | "running" | "paused" | "stopped" | "complete" | "error";
  started_at?: string | null;
  ended_at?: string | null;
  active_workers: number;
  max_workers: number;
  fetch_semaphore_limit: number;
  queue_size: number;
  visited_count: number;
  indexed_pages: number;
  pages_fetched_ok: number;
  pages_failed: number;
  bytes_downloaded: number;
  max_depth: number;
  max_pages: number;
  last_url: string;
  last_error: string;
};

export type StreamEvent = {
  type: string;
  ts?: string;
  stats?: SpideyStats;
  [k: string]: unknown;
};

async function j<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return (await res.json()) as T;
}

export const spideyApi = {
  health: () => j<{ ok: boolean; stats: SpideyStats }>("/api/health"),
  stats: () => j<SpideyStats>("/api/stats"),
  start: (seeds: string[], maxDepth?: number, maxPages?: number) =>
    j<{ ok: boolean; stats: SpideyStats }>("/api/start", {
      method: "POST",
      body: JSON.stringify({ seeds, max_depth: maxDepth, max_pages: maxPages }),
    }),
  pause: () => j<{ ok: boolean; stats: SpideyStats }>("/api/pause", { method: "POST" }),
  resume: () => j<{ ok: boolean; stats: SpideyStats }>("/api/resume", { method: "POST" }),
  stop: () => j<{ ok: boolean; stats: SpideyStats }>("/api/stop", { method: "POST" }),
  addSeed: (url: string, depth?: number) =>
    j<{ ok: boolean; stats: SpideyStats }>("/api/add-seed", {
      method: "POST",
      body: JSON.stringify({ url, depth }),
    }),
  topKeywords: (k = 25) => j<{ items: { term: string; weight: number }[] }>(`/api/top-keywords?k=${k}`),
  search: (q: string, k = 20) =>
    j<{ items: { url: string; score: number; snippet: string }[] }>(
      `/api/search?q=${encodeURIComponent(q)}&k=${k}`,
    ),
  pages: (offset = 0, limit = 50) => j<{ items: any[]; offset: number; limit: number }>(`/api/pages?offset=${offset}&limit=${limit}`),
  stream: (onEvent: (e: StreamEvent) => void, onError?: (e: Event) => void) => {
    const es = new EventSource("/api/stream");
    es.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data) as StreamEvent;
        onEvent(data);
      } catch {
        // ignore
      }
    };
    es.onerror = (e) => {
      onError?.(e);
    };
    return () => es.close();
  },
};

