# 🏎️ F1 Dashboard — Live Standings & Search

[![CI/CD](https://github.com/YOUR_USERNAME/f1-proje/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/f1-proje/actions/workflows/ci.yml)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-Railway-blueviolet?logo=railway)](https://f1-api.up.railway.app)
[![Docker](https://img.shields.io/badge/Docker-Hub-2496ED?logo=docker)](https://hub.docker.com/r/YOUR_USERNAME/f1-api)

> Real-time F1 driver standings powered by **ASP.NET Core 8**, **Elasticsearch**, and the **Ergast F1 API** — with automated data sync after every race.

**🔗 Live Demo:** [https://f1-api.up.railway.app/swagger](https://f1-api.up.railway.app/swagger)

---

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────┐    ┌───────────────────┐
│  React + Vite   │───▶│ ASP.NET Core │───▶│   Elasticsearch   │
│   (Frontend)    │    │   8 (API)    │    │  (Search Engine)  │
└─────────────────┘    └──────┬───────┘    └───────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │   Ergast F1 API    │
                    │  (Race scheduler   │
                    │   via Hangfire)    │
                    └────────────────────┘
```

## ✨ Features

- 🏁 **Live standings** — auto-updated after every F1 race via Hangfire scheduler
- 🔍 **Full-text search** — Elasticsearch powered prefix search across drivers & teams
- 🐳 **Fully Dockerized** — one command to run everything
- 🤖 **Multi-Agent AI** — LangGraph pipeline for F1 season analysis (Research → Analyze → Write → Critique)
- 📊 **LLM Eval System** — automated evaluation of AI-generated F1 summaries

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)
```bash
docker-compose up --build
```
- API: http://localhost:8080/swagger
- Elasticsearch: http://localhost:9200

### Option 2: Local Development
```bash
# Backend
cd f1-backend
dotnet run

# Frontend (separate terminal)
cd f1-frontend
npm install && npm run dev
```

## 🧪 Running Tests

```bash
dotnet test f1-backend.sln --verbosity normal
```

## 🤖 Multi-Agent AI System

```bash
cd agents
pip install -r requirements.txt
export GEMINI_API_KEY=your_key_here

# Single query
python run_agents.py --query "Who is leading the 2024 F1 championship?"

# Interactive mode
python run_agents.py
```

**Agent Pipeline:**
```
User Query
    │
    ▼
[Research Agent]  ─ Fetches live F1 data via Ergast API tools
    │
    ▼
[Analysis Agent]  ─ Statistical analysis & trend detection
    │
    ▼
[Writer Agent]    ─ Generates readable report
    │
    ▼
[Critic Agent]    ─ Fact-checks & scores the report (0-10)
```

## 📊 LLM Eval System

```bash
cd eval
pip install -r requirements.txt
export GEMINI_API_KEY=your_key_here

# Run all evaluations
python eval_runner.py

# Run specific test case
python eval_runner.py --id eval_001

# Save results to JSON (useful for CI)
python eval_runner.py --output results.json
```

## ⚙️ CI/CD Pipeline

GitHub Actions automatically:
1. ✅ Builds the .NET solution
2. ✅ Runs all unit tests
3. 🐳 Builds & pushes Docker image to Docker Hub
4. 🚀 Deploys to Railway (on `main` branch push)

**Required GitHub Secrets:**
| Secret | Description |
|--------|-------------|
| `DOCKERHUB_USERNAME` | Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub access token |
| `RAILWAY_TOKEN` | Railway project token |

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | ASP.NET Core 8, C# |
| Database | Elasticsearch 8.13 |
| Scheduler | Hangfire |
| Frontend | React, Vite |
| Container | Docker, Docker Compose |
| CI/CD | GitHub Actions |
| Cloud | Railway |
| AI Agents | LangGraph, LangChain |
| LLM | Google Gemini / OpenAI |

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/drivers` | All driver standings |
| GET | `/api/drivers/search?searchTerm=max` | Search drivers |
| GET | `/health` | Health check |

---

*Data sourced from [Ergast F1 API](https://api.jolpi.ca/ergast/f1/) — updated automatically after each race.*
