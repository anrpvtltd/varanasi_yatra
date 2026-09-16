"""
RAG Retriever Module
Varanasi Yatra Platform — Prompt 6
Retrieves verified context chunks matching user queries without external vector DB dependencies.
"""

from typing import List, Dict, Any
from .sources import get_all_sources

class SimpleKnowledgeRetriever:
    """Lightweight deterministic knowledge retriever for customer assistant."""

    def __init__(self):
        self.sources = get_all_sources()

    def search(self, query: str, limit: int = 3) -> List[Dict[str, Any]]:
        query_lower = query.lower()
        results = []

        for source in self.sources:
            score = 0
            words = query_lower.split()
            for word in words:
                if len(word) > 2 and word in source["content"].lower():
                    score += 1
                if word in source["title"].lower():
                    score += 2
            
            if score > 0:
                results.append((score, source))

        results.sort(key=lambda x: x[0], reverse=True)
        return [doc for _, doc in results[:limit]]
