from __future__ import annotations

import logging
import threading
import time
from concurrent.futures import Future, ThreadPoolExecutor, wait
from dataclasses import dataclass
from datetime import datetime, timezone
from queue import Empty, Queue
from typing import Callable
from urllib.parse import urlsplit

import requests
from bs4 import BeautifulSoup

from .config import CrawlerConfig, IndexConfig
from .models import CrawlStats, PageRecord
from .text_index import InvertedIndex
from .url_utils import normalize_url, safe_join


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _host(url: str) -> str:
    try:
        return (urlsplit(url).hostname or "").lower()
    except Exception:
        return ""


@dataclass(frozen=True)
class CrawlJob:
    url: str
    depth: int


class CrawlManager:
    """
    Parallel, depth-limited web crawler with:
    - shared URL frontier (Queue)
    - URL normalization + thread-safe visited set
    - semaphore to throttle concurrent fetch operations
    - locks protecting index and page stores
    - pause/resume/stop controls
    """

    def __init__(
        self,
        crawler_cfg: CrawlerConfig,
        index_cfg: IndexConfig,
        logger: logging.Logger | None = None,
    ):
        self.cfg = crawler_cfg
        self.index_cfg = index_cfg
        self.log = logger or logging.getLogger("spidey")

        self._frontier: Queue[CrawlJob] = Queue()
        self._visited: set[str] = set()
        self._visited_lock = threading.Lock()

        self._index = InvertedIndex(index_cfg)
        self._index_lock = threading.Lock()

        self._pages: dict[str, PageRecord] = {}
        self._page_text: dict[str, str] = {}
        self._pages_lock = threading.Lock()

        self._stats = CrawlStats(
            status="idle",
            active_workers=0,
            max_workers=self.cfg.max_workers,
            fetch_semaphore_limit=self.cfg.max_concurrent_fetches,
            max_depth=self.cfg.max_depth,
            max_pages=self.cfg.max_pages,
        )
        self._stats_lock = threading.Lock()

        self._fetch_sem = threading.Semaphore(self.cfg.max_concurrent_fetches)
        self._pause_event = threading.Event()
        self._stop_event = threading.Event()

        self._runner_thread: threading.Thread | None = None
        self._executor: ThreadPoolExecutor | None = None

        self._seed_host: str | None = None

        self._listeners: set[Callable[[dict], None]] = set()
        self._listeners_lock = threading.Lock()

    # ----------------- public API -----------------

    def start(self, seeds: list[str], max_depth: int | None = None, max_pages: int | None = None) -> None:
        seeds = [s for s in (seeds or []) if s]
        if not seeds:
            raise ValueError("No seeds provided.")

        if self.is_running():
            return

        self._reset_state()

        self._stop_event.clear()
        self._pause_event.clear()
        self._seed_host = _host(seeds[0]) if self.cfg.same_host_only else None

        with self._stats_lock:
            self._stats.status = "running"
            self._stats.started_at_iso = _now_iso()
            self._stats.ended_at_iso = None
            self._stats.last_error = ""
            self._stats.last_url = ""
            self._stats.pages_fetched_ok = 0
            self._stats.pages_failed = 0
            self._stats.bytes_downloaded = 0
            self._stats.max_depth = int(max_depth if max_depth is not None else self.cfg.max_depth)
            self._stats.max_pages = int(max_pages if max_pages is not None else self.cfg.max_pages)
            self._stats.max_workers = self.cfg.max_workers
            self._stats.fetch_semaphore_limit = self.cfg.max_concurrent_fetches

        for s in seeds:
            self.add_seed(s, depth=0)

        self._executor = ThreadPoolExecutor(max_workers=self.cfg.max_workers, thread_name_prefix="spidey")
        self._runner_thread = threading.Thread(target=self._run_loop, name="spidey-runner", daemon=True)
        self._runner_thread.start()
        self._emit({"type": "status", "status": "running"})

    def pause(self) -> None:
        if not self.is_running():
            return
        self._pause_event.set()
        with self._stats_lock:
            self._stats.status = "paused"
        self._emit({"type": "status", "status": "paused"})

    def resume(self) -> None:
        if not self.is_running():
            return
        self._pause_event.clear()
        with self._stats_lock:
            self._stats.status = "running"
        self._emit({"type": "status", "status": "running"})

    def stop(self) -> None:
        self._stop_event.set()
        self._pause_event.clear()
        with self._stats_lock:
            if self._stats.status not in ("idle", "complete"):
                self._stats.status = "stopped"
                self._stats.ended_at_iso = _now_iso()
        self._emit({"type": "status", "status": "stopped"})

        ex = self._executor
        if ex:
            ex.shutdown(wait=False, cancel_futures=True)
        self._executor = None

    def add_seed(self, url: str, depth: int = 0) -> bool:
        norm = normalize_url(url)
        if not norm:
            return False

        if urlsplit(norm).scheme not in self.cfg.allowed_schemes:
            return False

        if self.cfg.same_host_only and self._seed_host:
            if _host(norm) != self._seed_host:
                return False

        with self._visited_lock:
            if norm in self._visited:
                return False
            self._visited.add(norm)

        self._frontier.put(CrawlJob(url=norm, depth=int(depth)))
        self._touch_stats()
        self._emit({"type": "frontier", "queued": norm, "depth": depth})
        return True

    def stats(self) -> dict:
        with self._stats_lock:
            return self._stats.as_dict()

    def pages(self, offset: int, limit: int) -> list[dict]:
        with self._pages_lock:
            items = list(self._pages.values())
        items.sort(key=lambda p: (p.depth, p.url))
        sliced = items[int(offset) : int(offset) + int(limit)]
        return [p.__dict__ for p in sliced]

    def search(self, query: str, k: int) -> list[dict]:
        with self._index_lock:
            return self._index.search(query, int(k), lambda u: self._page_text.get(u, ""))

    def top_keywords(self, k: int) -> list[dict]:
        with self._index_lock:
            return self._index.top_keywords(int(k))

    def is_running(self) -> bool:
        t = self._runner_thread
        return t is not None and t.is_alive()

    def register_listener(self, cb: Callable[[dict], None]) -> None:
        with self._listeners_lock:
            self._listeners.add(cb)

    def unregister_listener(self, cb: Callable[[dict], None]) -> None:
        with self._listeners_lock:
            self._listeners.discard(cb)

    # ----------------- internal -----------------

    def _reset_state(self) -> None:
        while True:
            try:
                self._frontier.get_nowait()
            except Empty:
                break

        with self._visited_lock:
            self._visited.clear()

        with self._pages_lock:
            self._pages.clear()
            self._page_text.clear()

        with self._index_lock:
            self._index = InvertedIndex(self.index_cfg)

    def _touch_stats(self) -> None:
        with self._stats_lock:
            self._stats.queue_size = self._frontier.qsize()
            self._stats.visited_count = len(self._visited)
            self._stats.indexed_pages = len(self._pages)

    def _emit(self, event: dict) -> None:
        event = dict(event)
        event["ts"] = _now_iso()
        event["stats"] = self.stats()
        with self._listeners_lock:
            listeners = list(self._listeners)
        for cb in listeners:
            try:
                cb(event)
            except Exception:
                continue

    def _run_loop(self) -> None:
        assert self._executor is not None

        in_flight: set[Future] = set()
        last_emit = 0.0

        try:
            while not self._stop_event.is_set():
                if self._pause_event.is_set():
                    time.sleep(0.2)
                    continue

                max_pages = self.stats().get("max_pages", self.cfg.max_pages)
                indexed_pages = self.stats().get("indexed_pages", 0)
                if indexed_pages >= max_pages:
                    break

                # Refill work up to max_workers; fetch semaphore limits actual HTTP concurrency.
                while len(in_flight) < self.cfg.max_workers and not self._frontier.empty():
                    job = self._frontier.get()
                    fut = self._executor.submit(self._crawl_one, job)
                    in_flight.add(fut)

                if not in_flight:
                    # nothing queued and nothing running
                    break

                done, in_flight = wait(in_flight, timeout=0.25)

                # Update active worker count.
                with self._stats_lock:
                    self._stats.active_workers = len(in_flight)

                now = time.time()
                if now - last_emit > 0.5:
                    self._touch_stats()
                    self._emit({"type": "tick"})
                    last_emit = now

            with self._stats_lock:
                if self._stats.status not in ("stopped", "error"):
                    self._stats.status = "complete"
                    self._stats.ended_at_iso = _now_iso()
            self._touch_stats()
            self._emit({"type": "status", "status": "complete"})
        except Exception as e:
            self.log.exception("Crawler runner crashed")
            with self._stats_lock:
                self._stats.status = "error"
                self._stats.last_error = str(e)
                self._stats.ended_at_iso = _now_iso()
            self._emit({"type": "status", "status": "error", "error": str(e)})

    def _crawl_one(self, job: CrawlJob) -> None:
        if self._stop_event.is_set():
            return

        max_depth = self.stats().get("max_depth", self.cfg.max_depth)
        if job.depth > int(max_depth):
            return

        url = job.url
        with self._stats_lock:
            self._stats.last_url = url

        rec = PageRecord(url=url, depth=job.depth, fetched_at_iso=_now_iso())
        try:
            self._fetch_sem.acquire()
            try:
                resp = requests.get(
                    url,
                    headers={"User-Agent": self.cfg.user_agent},
                    timeout=self.cfg.request_timeout_sec,
                    allow_redirects=True,
                )
            finally:
                self._fetch_sem.release()

            rec.status_code = resp.status_code
            rec.content_type = (resp.headers.get("content-type") or "").split(";", 1)[0].strip()
            content_bytes = resp.content or b""

            with self._stats_lock:
                self._stats.bytes_downloaded += len(content_bytes)

            if resp.status_code >= 400:
                raise RuntimeError(f"HTTP {resp.status_code}")
            if "text/html" not in rec.content_type:
                raise RuntimeError(f"Unsupported content-type: {rec.content_type or 'unknown'}")

            soup = BeautifulSoup(resp.text, "lxml")
            title = (soup.title.get_text(strip=True) if soup.title else "")[:200]
            rec.title = title

            # Extract readable text.
            for tag in soup(["script", "style", "noscript"]):
                tag.decompose()
            text = soup.get_text(" ", strip=True)

            # Extract links.
            out_links: list[str] = []
            for a in soup.select("a[href]"):
                href = a.get("href")
                if not href:
                    continue
                abs_url = safe_join(url, href)
                norm = normalize_url(abs_url)
                if not norm:
                    continue
                if urlsplit(norm).scheme not in self.cfg.allowed_schemes:
                    continue
                if self.cfg.same_host_only and self._seed_host and _host(norm) != self._seed_host:
                    continue
                out_links.append(norm)
            rec.out_links = out_links[:5000]

            # Index text.
            with self._index_lock:
                top_terms = self._index.index_document(url, text, title=title)
            rec.top_terms = [(t, float(tf)) for t, tf in top_terms]

            with self._pages_lock:
                self._pages[url] = rec
                self._page_text[url] = text

            with self._stats_lock:
                self._stats.pages_fetched_ok += 1

            # Enqueue discovered links (depth+1).
            if job.depth < int(max_depth):
                for link in rec.out_links:
                    self.add_seed(link, depth=job.depth + 1)

            self._touch_stats()
            self._emit({"type": "page", "url": url, "depth": job.depth, "title": title, "ok": True})
        except Exception as e:
            rec.error = str(e)
            with self._pages_lock:
                self._pages[url] = rec
            with self._stats_lock:
                self._stats.pages_failed += 1
                self._stats.last_error = str(e)
            self._touch_stats()
            self._emit({"type": "page", "url": url, "depth": job.depth, "ok": False, "error": str(e)})

