import modal
import os

# 1. Define high-performance cloud container with all Debian & Python C++ libraries
image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("build-essential", "g++", "libgomp1", "curl")
    .pip_install_from_requirements("requirements.txt")
    .pip_install("fastapi>=0.110.0", "uvicorn>=0.28.0")
)

# 2. Initialize Modal Application
app = modal.App(name="joblio-ai", image=image)

# 3. Mount existing FastAPI application with automatic scaling, 4GB RAM, and secret injection
@app.function(
    image=image,
    secrets=[modal.Secret.from_dotenv()],
    timeout=120,
    memory=4096,  # 4 GB RAM for effortless Prophet / Auto-ARIMA / PDF parsing
    cpu=2.0,      # 2 dedicated vCPUs
    scaledown_window=300, # Keep warm for 5 minutes between calls to eliminate cold starts
)
@modal.asgi_app()
def fastapi_app():
    from main import app as web_app
    return web_app
