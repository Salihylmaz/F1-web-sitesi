"""
F1 Multi-Agent System — CLI Runner
=====================================
Kullanım:
    pip install -r requirements.txt
    export GEMINI_API_KEY=...   # veya OPENAI_API_KEY
    
    # İnteraktif mod:
    python run_agents.py
    
    # Tek soru:
    python run_agents.py --query "Who is leading the 2024 F1 championship?"
    
    # Sonucu JSON'a kaydet:
    python run_agents.py --query "Analyze the top 5 drivers" --output result.json
"""

import argparse
import json
import os
import sys
from datetime import datetime

# Renk kodları
GREEN  = "\033[92m"
YELLOW = "\033[93m"
RED    = "\033[91m"
CYAN   = "\033[96m"
BLUE   = "\033[94m"
RESET  = "\033[0m"
BOLD   = "\033[1m"


def print_banner():
    banner = f"""
{CYAN}{BOLD}
╔══════════════════════════════════════════════════════╗
║          F1 MULTI-AGENT ANALYSIS SYSTEM              ║
║    Research → Analyze → Write → Critique             ║
║    Powered by LangGraph + Ergast F1 API              ║
╚══════════════════════════════════════════════════════╝
{RESET}"""
    print(banner)


def print_divider(title: str = ""):
    width = 54
    if title:
        pad = (width - len(title) - 2) // 2
        print(f"\n{CYAN}{'─' * pad} {title} {'─' * pad}{RESET}")
    else:
        print(f"{CYAN}{'─' * width}{RESET}")


def run_query(query: str) -> dict:
    """LangGraph pipeline'ını çalıştır ve sonuçları döndür."""
    from graph import f1_graph, F1AgentState

    initial_state: F1AgentState = {
        "user_query":    query,
        "raw_data":      "",
        "analysis":      "",
        "draft_report":  "",
        "final_report":  "",
        "critique":      "",
        "quality_score": 0.0,
        "messages":      [],
    }

    print_divider("PIPELINE STARTING")
    start_time = datetime.now()

    result = f1_graph.invoke(initial_state)

    elapsed = (datetime.now() - start_time).seconds

    return {**result, "_elapsed_seconds": elapsed}


def display_results(result: dict):
    """Sonuçları terminal'e güzel formatla."""
    score = result.get("quality_score", 0)
    score_color = GREEN if score >= 7 else (YELLOW if score >= 5 else RED)

    print_divider("FINAL REPORT")
    print(f"\n{result.get('final_report', 'No report generated.')}\n")

    print_divider("QUALITY ASSESSMENT")
    print(f"  Score    : {score_color}{BOLD}{score}/10{RESET}")
    print(f"  Critique : {result.get('critique', 'N/A')[:200]}")

    elapsed = result.get("_elapsed_seconds", 0)
    print_divider()
    print(f"  {GREEN}✓ Pipeline completed in {elapsed}s{RESET}")
    print(f"  Agents ran: ResearchAgent → AnalysisAgent → WriterAgent → CriticAgent\n")


def interactive_mode():
    """Kullanıcıdan sürekli sorgu alır."""
    print(f"\n{YELLOW}Interactive mode. Type 'quit' or 'exit' to stop.{RESET}\n")

    while True:
        try:
            query = input(f"{BOLD}{CYAN}Your F1 question:{RESET} ").strip()

            if not query:
                continue
            if query.lower() in ("quit", "exit", "q"):
                print(f"{GREEN}Goodbye! 🏁{RESET}")
                break

            result = run_query(query)
            display_results(result)

        except KeyboardInterrupt:
            print(f"\n{GREEN}Goodbye! 🏁{RESET}")
            break


def main():
    print_banner()

    parser = argparse.ArgumentParser(
        description="F1 Multi-Agent System — LangGraph powered analysis"
    )
    parser.add_argument("--query",  "-q", help="F1 question to analyze")
    parser.add_argument("--output", "-o", help="Save result to JSON file")
    args = parser.parse_args()

    # API key kontrolü
    if not os.getenv("GEMINI_API_KEY") and not os.getenv("OPENAI_API_KEY"):
        print(f"{RED}⚠ No API key found!{RESET}")
        print(f"  Set {BOLD}GEMINI_API_KEY{RESET} or {BOLD}OPENAI_API_KEY{RESET} environment variable.")
        print(f"  Example: export GEMINI_API_KEY=your_key_here\n")
        sys.exit(1)

    if args.query:
        # Single query mode
        result = run_query(args.query)
        display_results(result)

        if args.output:
            output_data = {
                "query":        args.query,
                "final_report": result.get("final_report"),
                "quality_score": result.get("quality_score"),
                "critique":     result.get("critique"),
                "timestamp":    datetime.utcnow().isoformat(),
            }
            with open(args.output, "w", encoding="utf-8") as f:
                json.dump(output_data, f, indent=2, ensure_ascii=False)
            print(f"{GREEN}✓ Result saved to {args.output}{RESET}")
    else:
        # Interactive mode
        interactive_mode()


if __name__ == "__main__":
    main()
