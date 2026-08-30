"""
F1 Multi-Agent System — LangGraph Graph
=========================================
4 Ajan Mimarisi:
  1. ResearchAgent  → Ergast API'ından veri çeker
  2. AnalysisAgent  → İstatistik ve trend analizi yapar
  3. WriterAgent    → Raporun yazarı
  4. CriticAgent    → Raporu puanlar, hataları işaretler

State her node arasında geçer; her agent öncekinin çıktısını okur.
"""

import os
from typing import TypedDict, Annotated
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from tools import ALL_TOOLS


# ── State Tanımı ──────────────────────────────────────────────────────────────
class F1AgentState(TypedDict):
    """Her agent'ın okuyup yazacağı merkezi state."""
    user_query:    str               # Kullanıcının sorusu
    raw_data:      str               # ResearchAgent'ın çektiği ham veri
    analysis:      str               # AnalysisAgent'ın yorumu
    draft_report:  str               # WriterAgent'ın ilk taslağı
    final_report:  str               # CriticAgent'ın onayladığı final rapor
    critique:      str               # CriticAgent'ın değerlendirmesi
    quality_score: float             # 0.0 – 10.0 arası kalite skoru
    messages:      list[BaseMessage] # Tüm konuşma geçmişi


# ── LLM Seçimi ────────────────────────────────────────────────────────────────
def get_llm(tools: list | None = None):
    """Ortam değişkenine göre Gemini veya OpenAI seçer."""
    if os.getenv("GEMINI_API_KEY"):
        llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            google_api_key=os.getenv("GEMINI_API_KEY"),
            temperature=0.3,
        )
    elif os.getenv("OPENAI_API_KEY"):
        llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0.3,
        )
    else:
        raise ValueError(
            "No LLM API key found! Set GEMINI_API_KEY or OPENAI_API_KEY environment variable."
        )
    if tools:
        return llm.bind_tools(tools)
    return llm


# ── Node 1: Research Agent ────────────────────────────────────────────────────
def research_agent(state: F1AgentState) -> F1AgentState:
    """
    Kullanıcının sorusuna göre Ergast API'ından uygun verileri çeker.
    Tool calling kullanarak hangi endpoint'lere bakacağını kendi belirler.
    """
    print("\n🔍 [ResearchAgent] Veri araştırılıyor...")

    llm_with_tools = get_llm(tools=ALL_TOOLS)

    research_prompt = f"""You are an F1 data researcher. Your job is to gather relevant F1 data.

User Query: {state['user_query']}

Use the available tools to fetch the most relevant data. 
Call multiple tools if needed to get comprehensive information.
Focus on getting actual numbers, standings, and facts."""

    response = llm_with_tools.invoke([HumanMessage(content=research_prompt)])

    # Tool çağrıları varsa çalıştır
    tool_node = ToolNode(ALL_TOOLS)
    if hasattr(response, "tool_calls") and response.tool_calls:
        tool_results = tool_node.invoke({"messages": [response]})
        raw_data = "\n\n".join(
            str(m.content) for m in tool_results["messages"]
        )
    else:
        raw_data = response.content

    print(f"   ✓ {len(raw_data.split())} kelimelik veri toplandı")

    return {
        **state,
        "raw_data": raw_data,
        "messages": state["messages"] + [response],
    }


# ── Node 2: Analysis Agent ────────────────────────────────────────────────────
def analysis_agent(state: F1AgentState) -> F1AgentState:
    """
    Ham veriyi alır, istatistik ve trend analizi yapar.
    """
    print("📊 [AnalysisAgent] Veriler analiz ediliyor...")

    llm = get_llm()

    analysis_prompt = f"""You are an F1 data analyst. Analyze the following raw F1 data.

User Query: {state['user_query']}

Raw Data:
{state['raw_data']}

Provide:
1. Key statistics and numbers
2. Notable trends or patterns
3. Comparisons between drivers/teams
4. Important insights the data reveals

Be analytical and data-driven."""

    response = llm.invoke([HumanMessage(content=analysis_prompt)])
    analysis = response.content

    print(f"   ✓ Analiz tamamlandı ({len(analysis.split())} kelime)")

    return {
        **state,
        "analysis": analysis,
        "messages": state["messages"] + [response],
    }


# ── Node 3: Writer Agent ──────────────────────────────────────────────────────
def writer_agent(state: F1AgentState) -> F1AgentState:
    """
    Analizi alır ve okunabilir, akıcı bir rapor yazar.
    """
    print("✍️  [WriterAgent] Rapor yazılıyor...")

    llm = get_llm()

    writer_prompt = f"""You are an F1 journalist writing an engaging analysis report.

User Query: {state['user_query']}

Analysis Data:
{state['analysis']}

Write a compelling, well-structured report that:
1. Starts with a strong summary sentence
2. Presents key findings clearly
3. Uses engaging language (not dry statistics)
4. Ends with an outlook or conclusion

Target length: 150-250 words. Make it interesting!"""

    response = llm.invoke([HumanMessage(content=writer_prompt)])
    draft = response.content

    print(f"   ✓ Taslak hazır ({len(draft.split())} kelime)")

    return {
        **state,
        "draft_report": draft,
        "messages": state["messages"] + [response],
    }


# ── Node 4: Critic Agent ──────────────────────────────────────────────────────
def critic_agent(state: F1AgentState) -> F1AgentState:
    """
    Taslak raporu gözden geçirir, hataları işaretler ve puanlar.
    """
    print("🔎 [CriticAgent] Rapor değerlendiriliyor...")

    llm = get_llm()

    critic_prompt = f"""You are a strict F1 fact-checker and editor.

Original Query: {state['user_query']}
Raw Data (ground truth): {state['raw_data']}
Draft Report to Review: {state['draft_report']}

Review the draft for:
1. Factual accuracy (check against raw data)
2. Any hallucinations or invented facts
3. Completeness (does it answer the query?)
4. Clarity and readability

Respond in this exact format:
SCORE: [X.X/10]
ISSUES: [List any problems, or "None" if clean]
FINAL_REPORT: [Either the original report if good, or improved version]"""

    response = llm.invoke([HumanMessage(content=critic_prompt)])
    critique_text = response.content

    # Skoru parse et
    quality_score = 7.0  # default
    final_report  = state["draft_report"]  # default

    lines = critique_text.split("\n")
    for line in lines:
        if line.startswith("SCORE:"):
            try:
                score_part = line.replace("SCORE:", "").strip()
                quality_score = float(score_part.split("/")[0])
            except ValueError:
                pass
        elif line.startswith("FINAL_REPORT:"):
            idx = critique_text.find("FINAL_REPORT:")
            final_report = critique_text[idx + len("FINAL_REPORT:"):].strip()
            break

    issues_start = critique_text.find("ISSUES:")
    issues_end   = critique_text.find("FINAL_REPORT:")
    issues = critique_text[issues_start:issues_end].strip() if issues_start != -1 else "N/A"

    print(f"   ✓ Skor: {quality_score}/10 | {issues[:60]}...")

    return {
        **state,
        "critique":      issues,
        "quality_score": quality_score,
        "final_report":  final_report,
        "messages":      state["messages"] + [response],
    }


# ── Graph İnşası ──────────────────────────────────────────────────────────────
def build_f1_agent_graph() -> StateGraph:
    """4-agent pipeline'ını LangGraph ile birleştirir."""

    workflow = StateGraph(F1AgentState)

    # Node'ları ekle
    workflow.add_node("research",  research_agent)
    workflow.add_node("analysis",  analysis_agent)
    workflow.add_node("writer",    writer_agent)
    workflow.add_node("critic",    critic_agent)

    # Akış: research → analysis → writer → critic → END
    workflow.set_entry_point("research")
    workflow.add_edge("research", "analysis")
    workflow.add_edge("analysis", "writer")
    workflow.add_edge("writer",   "critic")
    workflow.add_edge("critic",   END)

    return workflow.compile()


# Graph'ı dışarı aç
f1_graph = build_f1_agent_graph()
