"""
F1 LLM Eval Runner
==================
Ergast API'ından gerçek veri çeker, LLM'e sorar,
golden_dataset.json ile karşılaştırıp puanlar.

Kullanım:
    pip install -r requirements.txt
    export OPENAI_API_KEY=sk-...   # veya GEMINI_API_KEY
    python eval_runner.py

    # Sadece belirli bir eval ID:
    python eval_runner.py --id eval_001

    # Sonuçları dosyaya yaz:
    python eval_runner.py --output results.json
"""

import json
import os
import sys
import argparse
import requests
from datetime import datetime
from metrics import combined_score

# ── Renk kodları (terminal çıktısı için) ──────────────────────────────────────
GREEN  = "\033[92m"
YELLOW = "\033[93m"
RED    = "\033[91m"
CYAN   = "\033[96m"
RESET  = "\033[0m"
BOLD   = "\033[1m"

PASS_THRESHOLD = 0.60  # Bu altı = FAIL

# ── Ergast API'ından gerçek F1 verisi çek ─────────────────────────────────────
def fetch_f1_context() -> str:
    """2024 sezonu pilot puan durumunu çekip LLM'e context olarak ver."""
    try:
        url = "https://api.jolpi.ca/ergast/f1/current/driverStandings.json"
        resp = requests.get(url, timeout=10)
        data = resp.json()
        standings = (
            data["MRData"]["StandingsTable"]["StandingsLists"][0]["DriverStandings"]
        )
        lines = []
        for s in standings[:10]:  # Top 10 yeterli
            driver = s["Driver"]
            team   = s["Constructors"][0]["name"]
            name   = f"{driver['givenName']} {driver['familyName']}"
            lines.append(
                f"P{s['position']}: {name} ({team}) — {s['points']} pts, {s['wins']} wins"
            )
        return "F1 2024 Driver Standings (Top 10):\n" + "\n".join(lines)
    except Exception as e:
        return f"[Context fetch failed: {e}]"


# ── LLM Çağrısı ───────────────────────────────────────────────────────────────
def call_llm(query: str, context: str) -> str:
    """
    OpenAI veya Gemini API'ını çağırır.
    Ortam değişkeniyle hangi provider kullanılacağını seçer.
    """
    prompt = f"""You are an F1 expert assistant. Answer based on the provided data.

DATA:
{context}

QUESTION: {query}

Answer concisely and factually (2-4 sentences)."""

    # ── Gemini ────────────────────────────────────────────────────────────────
    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=gemini_key)
            model = genai.GenerativeModel("gemini-1.5-flash")
            resp = model.generate_content(prompt)
            return resp.text
        except Exception as e:
            return f"[Gemini Error: {e}]"

    # ── OpenAI ────────────────────────────────────────────────────────────────
    openai_key = os.getenv("OPENAI_API_KEY")
    if openai_key:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=openai_key)
            resp = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=200,
            )
            return resp.choices[0].message.content
        except Exception as e:
            return f"[OpenAI Error: {e}]"

    # ── Mock (API key yok) ─────────────────────────────────────────────────────
    print(f"{YELLOW}⚠ No API key found. Using mock response for testing.{RESET}")
    return (
        "Max Verstappen is leading the 2024 F1 championship with Red Bull Racing. "
        "He has accumulated significant points and wins throughout the season, "
        "followed by Lewis Hamilton with Mercedes in the standings."
    )


# ── Ana Eval Döngüsü ──────────────────────────────────────────────────────────
def run_eval(filter_id: str | None = None) -> list[dict]:
    dataset_path = os.path.join(os.path.dirname(__file__), "golden_dataset.json")
    with open(dataset_path, "r", encoding="utf-8") as f:
        dataset = json.load(f)

    if filter_id:
        dataset = [d for d in dataset if d["id"] == filter_id]
        if not dataset:
            print(f"{RED}Eval ID '{filter_id}' not found.{RESET}")
            sys.exit(1)

    print(f"\n{BOLD}{CYAN}═══════════════════════════════════════════════{RESET}")
    print(f"{BOLD}{CYAN}   F1 LLM EVAL RUNNER  —  {datetime.now().strftime('%Y-%m-%d %H:%M')}{RESET}")
    print(f"{BOLD}{CYAN}═══════════════════════════════════════════════{RESET}\n")

    # Bir kez context çek (API'a gereksiz istek atmamak için)
    print(f"{CYAN}⬇ Fetching live F1 data from Ergast API...{RESET}")
    context = fetch_f1_context()
    print(f"{GREEN}✓ Context ready ({len(context.split())} words){RESET}\n")

    results = []
    passed = 0
    failed = 0

    for item in dataset:
        eval_id  = item["id"]
        query    = item["query"]
        keywords = item.get("expected_keywords", [])
        facts    = item.get("expected_facts", {})
        min_sc   = item.get("min_score", PASS_THRESHOLD)

        print(f"{BOLD}[{eval_id}]{RESET} {query}")
        print(f"  {CYAN}→ Calling LLM...{RESET}", end=" ", flush=True)

        response = call_llm(query, context)
        scores   = combined_score(response, keywords, facts)

        print(f"done")
        print(f"  Response: \"{response[:120]}{'...' if len(response) > 120 else ''}\"")
        print(f"  Scores  : keyword={scores['keyword_score']} | fact={scores['fact_score']} | "
              f"hallucination={scores['hallucination_score']} | length={scores['length_score']}")

        final = scores["final_score"]
        status = "PASS" if final >= min_sc else "FAIL"
        color  = GREEN if status == "PASS" else RED

        print(f"  Result  : {color}{BOLD}{status}{RESET} (score={final}, threshold={min_sc})\n")

        if status == "PASS":
            passed += 1
        else:
            failed += 1

        results.append({
            "id": eval_id,
            "query": query,
            "response": response,
            "scores": scores,
            "status": status,
            "threshold": min_sc,
            "timestamp": datetime.utcnow().isoformat(),
        })

    # ── Özet ──────────────────────────────────────────────────────────────────
    total = passed + failed
    avg   = round(sum(r["scores"]["final_score"] for r in results) / total, 3) if total else 0

    print(f"{BOLD}{'═' * 47}{RESET}")
    print(f"{BOLD}SUMMARY:{RESET} {GREEN}{passed} PASSED{RESET} | {RED}{failed} FAILED{RESET} | "
          f"Avg Score: {BOLD}{avg}{RESET} | Total: {total}")
    print(f"{'═' * 47}\n")

    return results


# ── Entry Point ───────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="F1 LLM Eval Runner")
    parser.add_argument("--id",     help="Run a specific eval case by ID")
    parser.add_argument("--output", help="Save results to JSON file (e.g. results.json)")
    args = parser.parse_args()

    results = run_eval(filter_id=args.id)

    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        print(f"{GREEN}✓ Results saved to {args.output}{RESET}")

    # CI/CD için: herhangi bir FAIL varsa exit code 1 döner
    if any(r["status"] == "FAIL" for r in results):
        sys.exit(1)


if __name__ == "__main__":
    main()
