# Wingr AI & Developer Intelligence Microservice

High-throughput, asynchronous AI & ML engine powering Wingr.

## Key Capabilities
- **FastAPI**: Async, high-performance REST APIs.
- **LangGraph Multi-Agent Workflows**: GitHub auditing, ATS scoring, and research breakdown.
- **Predictive Time-Series Forecaster**: Facebook Prophet, Auto-ARIMA, and Linear Regression.
- **Upstash Redis Caching**: Sub-millisecond response caching.

## Run Locally
`ash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
`
