from __future__ import annotations

import math
import re
from collections import Counter, defaultdict
from dataclasses import dataclass

from .config import IndexConfig
from .models import Posting


_TOKEN_RE = re.compile(r"[a-zA-Z0-9]+(?:'[a-zA-Z0-9]+)?")


def tokenize(text: str, cfg: IndexConfig) -> list[str]:
    if not text:
        return []
    out: list[str] = []
    stop = set(w.lower() for w in cfg.stopwords)
    for m in _TOKEN_RE.finditer(text.lower()):
        t = m.group(0)
        if len(t) < cfg.min_token_len:
            continue
        if t in stop:
            continue
        out.append(t)
    return out


def build_snippet(text: str, query_terms: list[str], max_len: int) -> str:
    if not text:
        return ""
    if not query_terms:
        s = " ".join(text.split())
        return s[:max_len] + ("…" if len(s) > max_len else "")

    lowered = text.lower()
    idxs = [lowered.find(t) for t in query_terms if t and lowered.find(t) != -1]
    if not idxs:
        s = " ".join(text.split())
        return s[:max_len] + ("…" if len(s) > max_len else "")

    i = min(idxs)
    start = max(0, i - max_len // 3)
    end = min(len(text), start + max_len)
    snippet = " ".join(text[start:end].split())
    if start > 0:
        snippet = "…" + snippet
    if end < len(text):
        snippet = snippet + "…"
    return snippet


@dataclass
class IndexSnapshot:
    terms: int
    postings: int


class InvertedIndex:
    """
    Thread-safe inverted index: term -> list[Posting(url, tf, snippet)].
    """

    def __init__(self, cfg: IndexConfig):
        self._cfg = cfg
        self._index: dict[str, list[Posting]] = defaultdict(list)
        self._doc_term_counts: dict[str, Counter[str]] = {}

    def index_document(self, url: str, text: str, title: str = "") -> list[tuple[str, float]]:
        tokens = tokenize(f"{title}\n{text}", self._cfg)
        if not tokens:
            self._doc_term_counts[url] = Counter()
            return []

        counts = Counter(tokens)
        total = sum(counts.values())
        self._doc_term_counts[url] = counts

        top_terms = counts.most_common(10)
        top_terms_tf = [(t, c / total) for t, c in top_terms]

        # Store postings; snippet is filled at query-time for relevance.
        for term, c in counts.items():
            tf = c / total
            self._index[term].append(Posting(url=url, tf=tf, snippet=""))

        return top_terms_tf

    def search(self, query: str, k: int, page_text_lookup: callable) -> list[dict]:
        q_terms = tokenize(query, self._cfg)
        if not q_terms:
            return []

        scores: dict[str, float] = defaultdict(float)
        for t in q_terms:
            for p in self._index.get(t, []):
                scores[p.url] += p.tf

        ranked = sorted(scores.items(), key=lambda kv: kv[1], reverse=True)[:k]
        results: list[dict] = []
        for url, score in ranked:
            text = page_text_lookup(url) or ""
            results.append(
                {
                    "url": url,
                    "score": float(score),
                    "snippet": build_snippet(text, q_terms, self._cfg.max_snippet_len),
                }
            )
        return results

    def top_keywords(self, k: int) -> list[dict]:
        # Simple global weight: sum(tf) over postings.
        weights: dict[str, float] = {}
        for term, posts in self._index.items():
            weights[term] = sum(p.tf for p in posts)
        ranked = sorted(weights.items(), key=lambda kv: kv[1], reverse=True)[:k]
        return [{"term": t, "weight": float(w)} for t, w in ranked]

    def snapshot(self) -> IndexSnapshot:
        terms = len(self._index)
        postings = sum(len(v) for v in self._index.values())
        return IndexSnapshot(terms=terms, postings=postings)

