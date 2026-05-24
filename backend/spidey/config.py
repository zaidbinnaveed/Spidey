from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable


@dataclass(frozen=True)
class AppConfig:
    host: str = "127.0.0.1"
    port: int = 8000
    log_level: str = "INFO"


@dataclass(frozen=True)
class CrawlerConfig:
    user_agent: str = "Spidey/1.0 (+Parallel Web Search Crawler)"
    request_timeout_sec: float = 12.0
    max_concurrent_fetches: int = 12
    max_workers: int = 12
    max_depth: int = 2
    max_pages: int = 500
    respect_robots_txt: bool = False
    same_host_only: bool = True
    allowed_schemes: tuple[str, ...] = ("http", "https")


@dataclass(frozen=True)
class IndexConfig:
    min_token_len: int = 2
    max_snippet_len: int = 220
    stopwords: tuple[str, ...] = ()


@dataclass(frozen=True)
class SpideyConfig:
    app: AppConfig
    crawler: CrawlerConfig
    index: IndexConfig


def _tuple_str(values: Iterable[Any]) -> tuple[str, ...]:
    return tuple(str(v) for v in values)


def load_config(repo_root: Path) -> SpideyConfig:
    cfg_path = repo_root / "config.json"
    if not cfg_path.exists():
        return SpideyConfig(app=AppConfig(), crawler=CrawlerConfig(), index=IndexConfig())

    raw = json.loads(cfg_path.read_text(encoding="utf-8"))
    app_raw = raw.get("app", {})
    crawler_raw = raw.get("crawler", {})
    index_raw = raw.get("index", {})

    return SpideyConfig(
        app=AppConfig(
            host=str(app_raw.get("host", "127.0.0.1")),
            port=int(app_raw.get("port", 8000)),
            log_level=str(app_raw.get("log_level", "INFO")).upper(),
        ),
        crawler=CrawlerConfig(
            user_agent=str(crawler_raw.get("user_agent", CrawlerConfig.user_agent)),
            request_timeout_sec=float(crawler_raw.get("request_timeout_sec", 12.0)),
            max_concurrent_fetches=int(crawler_raw.get("max_concurrent_fetches", 12)),
            max_workers=int(crawler_raw.get("max_workers", 12)),
            max_depth=int(crawler_raw.get("max_depth", 2)),
            max_pages=int(crawler_raw.get("max_pages", 500)),
            respect_robots_txt=bool(crawler_raw.get("respect_robots_txt", False)),
            same_host_only=bool(crawler_raw.get("same_host_only", True)),
            allowed_schemes=_tuple_str(crawler_raw.get("allowed_schemes", ["http", "https"])),
        ),
        index=IndexConfig(
            min_token_len=int(index_raw.get("min_token_len", 2)),
            max_snippet_len=int(index_raw.get("max_snippet_len", 220)),
            stopwords=_tuple_str(index_raw.get("stopwords", [])),
        ),
    )

