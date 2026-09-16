"""
RAG Context Builder
Varanasi Yatra Platform — Prompt 6
Formats retrieved knowledge into safe system prompts for conversational reasoning.
"""

from typing import List, Dict, Any

def build_retrieved_context(documents: List[Dict[str, Any]]) -> str:
    """Formats verified knowledge documents into safe grounded context."""
    if not documents:
        return "No specific verified knowledge snippets found for this query."

    lines = ["VERIFIED BUSINESS INFORMATION:"]
    for idx, doc in enumerate(documents, start=1):
        lines.append(f"{idx}. [{doc.get('title', 'Info')}] {doc.get('content', '')}")
    
    lines.append("\nNOTE: Exact pricing, live hotel rooms, and puja slots require manual team confirmation.")
    return "\n".join(lines)
