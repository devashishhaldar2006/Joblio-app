# InnovateX — Developer Intelligence Platform

InnovateX is a full-stack, AI-powered Developer Intelligence Platform combining LLM orchestration, machine learning forecasting, and real-time developer telemetry into a unified dashboard.

---

## Architecture & Modules

The platform consists of 6 integrated intelligence modules:

1. **GitHub Profile Analyzer**: Multi-agent repository analysis, code quality auditing, and commit pattern insights.
2. **Research Paper Agent**: ArXiv paper exploration, technical concept breakdown, and architecture explanation.
3. **Open Source Contribution Finder**: Personalized good-first-issue matching with step-by-step PR guides and automated code reviews.
4. **Competitive Programming Intelligence**: Live contest radar integrating CLIST API with personalized difficulty filtering.
5. **Multi-Agent Job Search**: Automated resume parsing, skill matching, and tailored role recommendations.
6. **Job Market Demand Forecaster**:
   - **Data Feed**: Live telemetry from RapidAPI JSearch across global tech hubs.
   - **NLP Engine**: Two-pass skill extraction across 570+ technology skills.
   - **Auto-Selecting ML**: Facebook Prophet (weekly additive model, $\ge 16$ weeks), ARIMA (auto-AIC order search, $\ge 12$ weeks), or Linear Regression ($\ge 4$ weeks).
   - **Trajectory Analytics**: 26-week demand predictions, 80% confidence interval bands, and momentum indexes.
   - **Skill Gap Auditor**: Portfolio resilience scoring and personalized skill recommendations.

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Recharts, Lucide React, Modern Glassmorphism CSS |
| **Backend API** | Node.js, Express, MongoDB / Mongoose, JWT Authentication, Axios |
| **AI / ML Microservices** | Python 3.11+, FastAPI, LangGraph, Facebook Prophet, Statsmodels (ARIMA), Scikit-learn, APScheduler, Motor (Async MongoDB) |
| **LLMs & Telemetry** | Google Gemini, Groq, RapidAPI JSearch Feed, CLIST API |

---

## Project Structure

```text
innovatex/
├── backend/                  # Node.js / Express REST API
│   ├── controllers/          # Route handlers (market, auth, jobs, etc.)
│   ├── middleware/           # Auth and optional auth guards
│   ├── models/               # Mongoose schemas (SkillDataPoint, MarketSnapshot, etc.)
│   ├── routes/               # Express API endpoints
│   ├── .env.example          # Environment template
│   └── package.json
│
├── frontend/                 # React + Vite application
│   ├── src/
│   │   ├── components/       # UI elements (Navbar, Sidebar, etc.)
│   │   ├── pages/            # View pages (market, dashboard, etc.)
│   │   ├── services/         # Axios API client
│   │   └── utils/            # Skill taxonomy (570+ skills autocomplete)
│   ├── .env.example          # Environment template
│   └── package.json
│
└── pythonservices/           # Python FastAPI + ML Microservices
    ├── agents/market/        # JSearch scraper, NLP extractor, timeseries, Prophet/ARIMA engine
    ├── graphs/               # LangGraph state pipelines
    ├── utils/                # 573-skill dictionary, MongoDB clients
    ├── main.py               # FastAPI server & endpoints
    ├── scheduler.py          # APScheduler weekly telemetry job (Sunday 02:00 UTC)
    ├── .env.example          # Environment template
    └── requirements.txt      # Python dependencies
```

---

## Quickstart Setup Guide

### 1. Prerequisites
- **Node.js** v18+ and **npm**
- **Python** 3.10+ (with C++ build tools for `prophet`)
- **MongoDB** (Atlas cluster or local MongoDB instance)

---

### 2. Python AI/ML Microservice

```bash
cd innovatex/pythonservices

# 1. Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate    # On Windows: .venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# Edit .env and supply your GEMINI_API_KEY, GROQ_API_KEY, RAPIDAPI_KEY, and MONGO_URI

# 4. Start the FastAPI microservice
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

---

### 3. Node.js Backend API

```bash
cd innovatex/backend

# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env and supply your MONGO_URI and JWT_SECRET

# 3. Start the Express API server
node app.js
```
Backend runs at `http://localhost:5000`.

---

### 4. React Frontend

```bash
cd innovatex/frontend

# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env if your backend runs on a different port (default: http://localhost:5000/api)

# 3. Start development server
npm run dev
```
Frontend runs at `http://localhost:5173`.

---

## Running Automated ML Tests

To verify the Prophet, ARIMA, and Linear Regression forecasting pipeline:

```bash
cd innovatex/pythonservices
python test_market_ml.py
```

---

## Security & Secrets

All API keys, JWT secrets, and database credentials are excluded from Git via `.gitignore`. Always maintain your local secrets in `.env` and configure production secrets via deployment platform environment variables.

---

## License
MIT License. Created for the InnovateX Developer Intelligence Platform.
