from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass(frozen=True)
class Posting:
    url: str
    tf: float
    snippet: str


@dataclass
class PageRecord:
    url: str
    depth: int
    title: str = ""
    fetched_at_iso: str = ""
    content_type: str = ""
    status_code: int | None = None
    error: str | None = None
    out_links: list[str] = field(default_factory=list)
    top_terms: list[tuple[str, float]] = field(default_factory=list)


@dataclass
class CrawlStats:
    status: str = "idle"  # idle|running|paused|stopped|complete|error
    started_at_iso: str | None = None
    ended_at_iso: str | None = None

    active_workers: int = 0
    max_workers: int = 0
    fetch_semaphore_limit: int = 0

    queue_size: int = 0
    visited_count: int = 0
    indexed_pages: int = 0

    pages_fetched_ok: int = 0
    pages_failed: int = 0
    bytes_downloaded: int = 0

    max_depth: int = 0
    max_pages: int = 0

    last_url: str = ""
    last_error: str = ""

    def as_dict(self) -> dict[str, Any]:
        return {
            "status": self.status,
            "started_at": self.started_at_iso,
            "ended_at": self.ended_at_iso,
            "active_workers": self.active_workers,
            "max_workers": self.max_workers,
            "fetch_semaphore_limit": self.fetch_semaphore_limit,
            "queue_size": self.queue_size,
            "visited_count": self.visited_count,
            "indexed_pages": self.indexed_pages,
            "pages_fetched_ok": self.pages_fetched_ok,
            "pages_failed": self.pages_failed,
            "bytes_downloaded": self.bytes_downloaded,
            "max_depth": self.max_depth,
            "max_pages": self.max_pages,
            "last_url": self.last_url,
            "last_error": self.last_error,
        }

