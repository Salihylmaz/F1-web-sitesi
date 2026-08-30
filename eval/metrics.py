"""
F1 LLM Eval Metrics
Basit ama etkili metrикler:
- Keyword Presence Score
- Fact Accuracy Score
- Combined Score
"""

import re
import json
from typing import Any


def normalize(text: str) -> str:
    """Lowercase + remove punctuation for fair comparison."""
    return re.sub(r"[^\w\s]", "", text.lower())


def keyword_presence_score(response: str, keywords: list[str]) -> float:
    """
    Modelin çıktısında beklenen anahtar kelimelerin kaçı var?
    Returns: 0.0 – 1.0
    """
    if not keywords:
        return 1.0

    normed = normalize(response)
    found = sum(1 for kw in keywords if normalize(kw) in normed)
    score = found / len(keywords)
    return round(score, 3)


def fact_accuracy_score(response: str, expected_facts: dict[str, Any]) -> float:
    """
    Beklenen gerçeklerin (dict) modelin çıktısında olup olmadığını kontrol eder.
    Returns: 0.0 – 1.0
    """
    if not expected_facts:
        return 1.0

    normed = normalize(response)
    correct = 0
    for key, value in expected_facts.items():
        if normalize(str(value)) in normed:
            correct += 1

    score = correct / len(expected_facts)
    return round(score, 3)


def hallucination_penalty(response: str, forbidden_terms: list[str] | None = None) -> float:
    """
    Modelin kesinlikle söylememesi gereken terimler var mı?
    Returns: 0.0 (hallucination) – 1.0 (clean)
    """
    if not forbidden_terms:
        return 1.0

    normed = normalize(response)
    violations = sum(1 for term in forbidden_terms if normalize(term) in normed)
    penalty = violations / len(forbidden_terms)
    return round(1.0 - penalty, 3)


def length_score(response: str, min_words: int = 20, max_words: int = 500) -> float:
    """
    Çok kısa (bilgisiz) veya çok uzun (verbosity) cevaplara ceza.
    Returns: 0.0 – 1.0
    """
    word_count = len(response.split())
    if word_count < min_words:
        return round(word_count / min_words, 3)
    if word_count > max_words:
        return round(max_words / word_count, 3)
    return 1.0


def combined_score(
    response: str,
    keywords: list[str],
    expected_facts: dict[str, Any] | None = None,
    forbidden_terms: list[str] | None = None,
    weights: dict[str, float] | None = None,
) -> dict[str, float]:
    """
    Tüm metrikleri birleştirip ağırlıklı final skor döner.
    """
    if weights is None:
        weights = {
            "keyword": 0.35,
            "fact": 0.40,
            "hallucination": 0.15,
            "length": 0.10,
        }

    kw_score = keyword_presence_score(response, keywords)
    fact_score = fact_accuracy_score(response, expected_facts or {})
    hall_score = hallucination_penalty(response, forbidden_terms)
    len_score = length_score(response)

    final = (
        kw_score * weights["keyword"]
        + fact_score * weights["fact"]
        + hall_score * weights["hallucination"]
        + len_score * weights["length"]
    )

    return {
        "keyword_score": kw_score,
        "fact_score": fact_score,
        "hallucination_score": hall_score,
        "length_score": len_score,
        "final_score": round(final, 3),
    }
