from __future__ import annotations

import json
import logging
import threading
from pathlib import Path
from typing import Any, Generator

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, PlainTextResponse, StreamingResponse

from backend.spidey.config import load_config
from backend.spidey.crawler import CrawlManager


REPO_ROOT = Path(__file__).resolve().parents[1]
CFG = load_config(REPO_ROOT)


def _configure_logging() -> logging.Logger:
    logging.basicConfig(
        level=getattr(logging, CFG.app.log_level, logging.INFO),
        format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
    )
    return logging.getLogger("spidey")


LOG = _configure_logging()
MANAGER = CrawlManager(CFG.crawler, CFG.index, logger=LOG)

app = FastAPI(title="Spidey Backend", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root() -> PlainTextResponse:
    return PlainTextResponse(
        "SPIDEY backend is running.\n\n"
        "Open the dashboard at: http://localhost:5173\n"
        "API health: /api/health\n"
        "API docs: /docs\n",
        status_code=200,
    )


@app.get("/favicon.ico")
def favicon() -> PlainTextResponse:
    return PlainTextResponse("", status_code=204)


@app.get("/api/health")
def health() -> dict[str, Any]:
    return {"ok": True, "service": "spidey", "stats": MANAGER.stats()}


@app.get("/api/config")
def get_config() -> dict[str, Any]:
    return {
        "app": CFG.app.__dict__,
        "crawler": {**CFG.crawler.__dict__, "allowed_schemes": list(CFG.crawler.allowed_schemes)},
        "index": {**CFG.index.__dict__, "stopwords": list(CFG.index.stopwords)},
    }


@app.get("/api/stats")
def stats() -> dict[str, Any]:
    return MANAGER.stats()


@app.post("/api/start")
async def start(payload: dict[str, Any]) -> dict[str, Any]:
    seeds = payload.get("seeds") or []
    if isinstance(seeds, str):
        seeds = [seeds]
    max_depth = payload.get("max_depth")
    max_pages = payload.get("max_pages")
    try:
        MANAGER.start(list(seeds), max_depth=max_depth, max_pages=max_pages)
        return {"ok": True, "stats": MANAGER.stats()}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/pause")
def pause() -> dict[str, Any]:
    MANAGER.pause()
    return {"ok": True, "stats": MANAGER.stats()}


@app.post("/api/resume")
def resume() -> dict[str, Any]:
    MANAGER.resume()
    return {"ok": True, "stats": MANAGER.stats()}


@app.post("/api/stop")
def stop() -> dict[str, Any]:
    MANAGER.stop()
    return {"ok": True, "stats": MANAGER.stats()}


@app.post("/api/add-seed")
async def add_seed(payload: dict[str, Any]) -> dict[str, Any]:
    url = (payload.get("url") or "").strip()
    depth = int(payload.get("depth") or 0)
    if not url:
        raise HTTPException(status_code=400, detail="Missing url")
    ok = MANAGER.add_seed(url, depth=depth)
    return {"ok": ok, "stats": MANAGER.stats()}


@app.get("/api/pages")
def pages(offset: int = 0, limit: int = 50) -> dict[str, Any]:
    limit = max(1, min(int(limit), 200))
    offset = max(0, int(offset))
    return {"items": MANAGER.pages(offset, limit), "offset": offset, "limit": limit}


@app.get("/api/top-keywords")
def top_keywords(k: int = 25) -> dict[str, Any]:
    k = max(1, min(int(k), 100))
    return {"items": MANAGER.top_keywords(k)}


@app.get("/api/search")
def search(q: str, k: int = 20) -> dict[str, Any]:
    k = max(1, min(int(k), 100))
    return {"items": MANAGER.search(q, k)}


@app.get("/api/stream")
async def stream(request: Request) -> StreamingResponse:
    """
    Server-Sent Events stream for realtime dashboard updates.
    Sends:
      - 'event: message' blocks with JSON in 'data:' lines.
    """

    queue: list[dict[str, Any]] = []
    lock = threading.Lock()  # lightweight mutex for this connection

    def on_event(evt: dict[str, Any]) -> None:
        with lock:
            queue.append(evt)

    MANAGER.register_listener(on_event)

    async def gen() -> Generator[bytes, None, None]:
        try:
            # Initial hello
            yield b"event: message\ndata: " + json.dumps({"type": "hello", "stats": MANAGER.stats()}).encode("utf-8") + b"\n\n"

            while True:
                if await request.is_disconnected():
                    break

                batch: list[dict[str, Any]] = []
                with lock:
                    if queue:
                        batch = queue[:]
                        queue.clear()

                if batch:
                    for evt in batch:
                        payload = json.dumps(evt, ensure_ascii=False).encode("utf-8")
                        yield b"event: message\ndata: " + payload + b"\n\n"
                else:
                    # Keepalive (prevents some proxies from buffering)
                    yield b": keepalive\n\n"
                await _sleep(0.35)
        finally:
            MANAGER.unregister_listener(on_event)

    return StreamingResponse(gen(), media_type="text/event-stream")


async def _sleep(seconds: float) -> None:
    import asyncio

    await asyncio.sleep(seconds)


@app.exception_handler(Exception)
async def unhandled(_: Request, exc: Exception) -> JSONResponse:
    LOG.exception("Unhandled error: %s", exc)
    return JSONResponse(status_code=500, content={"ok": False, "error": str(exc)})

