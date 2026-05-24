# SPIDEY — Parallel Web Search Crawler

**SPIDEY** is a professional, parallel, depth-limited web crawler + lightweight search engine with a real-time monitoring dashboard (Spider-Man inspired cinematic UI).

## Features

- **Parallel crawling**: Thread pool + semaphore-throttled HTTP fetches.
- **Shared URL frontier**: Thread-safe queue of `(url, depth)` jobs.
- **Duplicate detection**: URL normalization + thread-safe visited set.
- **Depth-limited** crawling with **max-pages** safety limit.
- **Robust fetching**: timeouts, HTTP errors, invalid content-type handling.
- **Thread-safe inverted index**: `keyword -> [(url, tf_score, snippet)]`.
- **Keyword ranking**: Term Frequency (TF).
- **Real-time dashboard**: active workers, queue size, visited count, indexed pages, top keywords, indexed pages monitor, search.
- **Controls**: Start / Pause / Resume / Stop / Add Seed.
- **Configurable** via `config.json`.

## Project Layout

- `backend/`: FastAPI backend + crawler engine
  - `backend/app.py`: API + Server-Sent Events stream
  - `backend/spidey/`: crawler, URL normalization, inverted index, config loader
- `src/`: Vite/React dashboard UI (Tailwind + shadcn)
- `config.json`: crawler/index settings (concurrency, depth, limits, etc.)
- `Spidey_Project_Proposal.tex`: full LaTeX project proposal

## Quick Start (Windows)

### 1) Backend (FastAPI)

From the `Spidey/` folder:

```bash
py -m pip install -r backend\requirements.txt
py -m uvicorn backend.app:app --host 127.0.0.1 --port 8001
```

Backend health:

```bash
curl http://127.0.0.1:8001/api/health
```

### 2) Frontend (Vite)

In a second terminal (still from `Spidey/`):

```bash
npm install
npm run dev
```

Open the dashboard at `http://localhost:8080`.

Open the dashboard at `http://localhost:5173` (or the next free port if 5173 is busy).

> Vite proxies `/api/*` to `http://127.0.0.1:8001` (configured in `vite.config.ts`).

## Using the Dashboard

- **Seed URL**: enter a starting URL.
- **Limits**: set `maxDepth` and `maxPages`.
- Click **Start**.
- Use **Pause/Resume/Stop** at any time.
- Use **Add Seed** to inject new starting points into the frontier.
- Use **Search** to query the live index.

## Configuration

Edit `config.json`:

- `crawler.max_workers`: number of worker threads in the pool
- `crawler.max_concurrent_fetches`: semaphore limit for HTTP fetches
- `crawler.max_depth`: depth limit
- `crawler.max_pages`: maximum pages to index before stopping
- `crawler.same_host_only`: keep crawling within the seed host

## Notes

- This project intentionally uses an **original “Amazing Spider-Man inspired”** UI style (colors, skewed title treatment, HUD panels), without shipping copyrighted fonts/assets.

