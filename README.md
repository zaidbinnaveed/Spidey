# Spidey

A parallel, depth-limited web crawler and lightweight search engine with a real-time operations dashboard.

## System overview

Spidey combines a bounded concurrent crawler with a thread-safe inverted index. Operators can start, pause, resume, stop, and extend a crawl while monitoring workers, the frontier, visited URLs, indexed pages, and top terms.

## Core behavior

- Thread-pool crawling with semaphore-bounded fetch concurrency
- Shared, thread-safe URL frontier carrying URL and depth
- URL normalization and duplicate detection
- Configurable depth, page-count, timeout, and same-host limits
- Content-type and HTTP error handling
- Thread-safe inverted index
- Term-frequency ranking with result snippets
- Server-Sent Events for live dashboard updates
- Runtime controls for pause, resume, stop, and additional seeds

## Architecture

```text
backend/
├── app.py                 # FastAPI routes and event stream
└── spidey/
    ├── crawler.py         # workers and crawl lifecycle
    ├── text_index.py      # inverted index and ranking
    ├── url_utils.py       # normalization and link handling
    ├── config.py          # validated runtime configuration
    └── models.py
src/                       # React and TypeScript dashboard
config.json                # crawler defaults and safety limits
Spidey_Project_Proposal.tex
```

## Run locally

### Backend

```bash
python -m pip install -r backend/requirements.txt
python -m uvicorn backend.app:app --host 127.0.0.1 --port 8001
```

Health check:

```bash
curl http://127.0.0.1:8001/api/health
```

### Dashboard

In a second terminal:

```bash
npm ci
npm run dev
```

Open the local URL printed by Vite, normally [http://localhost:5173](http://localhost:5173). API requests are proxied to the backend on port 8001.

## Configuration

Edit `config.json` to control:

- maximum workers and concurrent fetches;
- crawl depth and page limit;
- request timeout;
- whether navigation remains on the seed host.

## Responsible crawling

Use Spidey only on sites you are authorized to crawl. Respect robots policies, terms of service, rate limits, privacy obligations, and server capacity. Default limits are safety controls, not permission to collect data.
