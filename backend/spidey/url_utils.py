from __future__ import annotations

import posixpath
from urllib.parse import parse_qsl, urlencode, urljoin, urlsplit, urlunsplit


def normalize_url(url: str) -> str:
    """
    Canonicalize URLs for duplicate detection.

    - lowercases scheme and hostname
    - strips fragments
    - removes default ports (:80/:443)
    - normalizes path (resolves ../ and //)
    - sorts query parameters
    """
    url = (url or "").strip()
    if not url:
        return ""

    parts = urlsplit(url)
    scheme = (parts.scheme or "").lower()
    netloc = (parts.netloc or "").strip()

    if "@" in netloc:
        # Drop userinfo for canonicalization (rare for web crawling).
        netloc = netloc.split("@", 1)[1]

    host = netloc
    port = ""
    if ":" in netloc:
        host, port = netloc.rsplit(":", 1)

    host = host.lower()
    if (scheme == "http" and port == "80") or (scheme == "https" and port == "443"):
        port = ""

    netloc = host if not port else f"{host}:{port}"

    path = parts.path or "/"
    # Normalize path segments.
    path = posixpath.normpath(path)
    if not path.startswith("/"):
        path = "/" + path
    if parts.path.endswith("/") and not path.endswith("/"):
        path += "/"

    query = ""
    if parts.query:
        query = urlencode(sorted(parse_qsl(parts.query, keep_blank_values=True)))

    return urlunsplit((scheme, netloc, path, query, ""))  # drop fragment


def safe_join(base_url: str, maybe_relative: str) -> str:
    try:
        return urljoin(base_url, maybe_relative)
    except Exception:
        return ""

