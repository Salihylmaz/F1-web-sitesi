"""
F1 Multi-Agent System — Tools
==============================
LangGraph agent'larının kullanacağı araçlar (tools).
Her tool bir Ergast API endpoint'ini sarmalar.
"""

import requests
from langchain_core.tools import tool


@tool
def get_driver_standings(season: str = "current") -> str:
    """
    F1 pilot puan tablosunu getirir.
    Args:
        season: Yıl (örn: '2024') veya 'current' for current season
    Returns:
        Puan tablosu string formatında
    """
    try:
        url = f"https://api.jolpi.ca/ergast/f1/{season}/driverStandings.json"
        resp = requests.get(url, timeout=10)
        data = resp.json()
        standings = (
            data["MRData"]["StandingsTable"]["StandingsLists"][0]["DriverStandings"]
        )
        lines = []
        for s in standings[:20]:
            driver = s["Driver"]
            team   = s["Constructors"][0]["name"]
            name   = f"{driver['givenName']} {driver['familyName']}"
            lines.append(
                f"P{s['position']}: {name} ({team}) — {s['points']} pts, {s['wins']} wins"
            )
        return f"Driver Standings ({season}):\n" + "\n".join(lines)
    except Exception as e:
        return f"Error fetching standings: {e}"


@tool
def get_constructor_standings(season: str = "current") -> str:
    """
    F1 takım (constructor) puan tablosunu getirir.
    Args:
        season: Yıl veya 'current'
    Returns:
        Takım puan tablosu
    """
    try:
        url = f"https://api.jolpi.ca/ergast/f1/{season}/constructorStandings.json"
        resp = requests.get(url, timeout=10)
        data = resp.json()
        standings = (
            data["MRData"]["StandingsTable"]["StandingsLists"][0]["ConstructorStandings"]
        )
        lines = []
        for s in standings:
            lines.append(
                f"P{s['position']}: {s['Constructor']['name']} — {s['points']} pts, {s['wins']} wins"
            )
        return f"Constructor Standings ({season}):\n" + "\n".join(lines)
    except Exception as e:
        return f"Error fetching constructor standings: {e}"


@tool
def get_race_results(season: str = "current", round_num: str = "last") -> str:
    """
    Belirli bir yarışın sonuçlarını getirir.
    Args:
        season: Yıl veya 'current'
        round_num: Tur numarası veya 'last'
    Returns:
        Yarış sonuçları (ilk 10)
    """
    try:
        url = f"https://api.jolpi.ca/ergast/f1/{season}/{round_num}/results.json"
        resp = requests.get(url, timeout=10)
        data = resp.json()
        race_data = data["MRData"]["RaceTable"]["Races"][0]
        race_name = race_data["raceName"]
        results   = race_data["Results"]

        lines = [f"Race: {race_name} ({race_data['date']})"]
        for r in results[:10]:
            driver = r["Driver"]
            name   = f"{driver['givenName']} {driver['familyName']}"
            team   = r["Constructor"]["name"]
            pos    = r["position"]
            status = r.get("status", "Finished")
            lines.append(f"  P{pos}: {name} ({team}) — {status}")
        return "\n".join(lines)
    except Exception as e:
        return f"Error fetching race results: {e}"


@tool
def get_driver_info(driver_id: str) -> str:
    """
    Belirli bir pilotun kariyerini ve istatistiklerini getirir.
    Args:
        driver_id: Ergast driver ID (örn: 'verstappen', 'hamilton', 'leclerc')
    Returns:
        Pilot bilgileri ve kariyer istatistikleri
    """
    try:
        url = f"https://api.jolpi.ca/ergast/f1/drivers/{driver_id}.json"
        resp = requests.get(url, timeout=10)
        data = resp.json()
        driver = data["MRData"]["DriverTable"]["Drivers"][0]
        return (
            f"Driver: {driver['givenName']} {driver['familyName']}\n"
            f"Nationality: {driver['nationality']}\n"
            f"Date of Birth: {driver['dateOfBirth']}\n"
            f"Permanent Number: {driver.get('permanentNumber', 'N/A')}\n"
            f"Code: {driver.get('code', 'N/A')}"
        )
    except Exception as e:
        return f"Error fetching driver info: {e}"


@tool
def get_race_schedule(season: str = "current") -> str:
    """
    Sezonun yarış takvimini getirir.
    Args:
        season: Yıl veya 'current'
    Returns:
        Yarış takvimi listesi
    """
    try:
        url = f"https://api.jolpi.ca/ergast/f1/{season}.json"
        resp = requests.get(url, timeout=10)
        data = resp.json()
        races = data["MRData"]["RaceTable"]["Races"]
        lines = [f"F1 {season} Race Calendar ({len(races)} races):"]
        for r in races:
            circuit = r["Circuit"]["circuitName"]
            country = r["Circuit"]["Location"]["country"]
            lines.append(f"  Round {r['round']}: {r['raceName']} — {circuit}, {country} ({r['date']})")
        return "\n".join(lines)
    except Exception as e:
        return f"Error fetching schedule: {e}"


# Tool listesi (graph.py'de kullanılacak)
ALL_TOOLS = [
    get_driver_standings,
    get_constructor_standings,
    get_race_results,
    get_driver_info,
    get_race_schedule,
]
