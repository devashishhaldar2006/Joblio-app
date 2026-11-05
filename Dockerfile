# Production Dockerfile for InnovateX Python AI Service
# Target: AWS EC2 t4g.small (ARM64 / Graviton2, Ubuntu 24.04, Python 3.11)

FROM python:3.11-slim-bookworm

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=8000

WORKDIR /app

# Install runtime dependencies:
# - libgomp1: OpenMP support required by CmdStan / Prophet precompiled Stan binaries
# - curl: Required for Docker container health check
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    curl \
 && rm -rf /var/lib/apt/lists/*

# Copy and install python dependencies
COPY requirements.txt .

# Enforce binary-only installations to prevent heavy compilation and memory exhaustion on ARM64
RUN pip install --only-binary=:all: -r requirements.txt

# Copy application source code (secrets and .env are excluded via .dockerignore)
COPY . .

# Container health check verifying FastAPI /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -f http://127.0.0.1:8000/health || exit 1

# Expose internal port for container network (not bound publicly)
EXPOSE 8000

# Run single Uvicorn worker to stay within 2 GiB RAM headroom
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1", "--limit-concurrency", "50"]