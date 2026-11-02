#!/usr/bin/env bash
set -e

echo "=========================================="
echo " Joblio AI Service Auto-Deploy for Oracle Cloud"
echo "=========================================="

# 1. Update OS and install Docker & Compose
echo "[1/4] Installing Docker and essential tools..."
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl gnupg lsb-release ufw

if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
fi

# 2. Allow Firewall port 8000 and standard HTTP/HTTPS
echo "[2/4] Configuring Ubuntu firewall..."
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 8000 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save || true

# 3. Clone or pull latest Joblio-app
echo "[3/4] Fetching latest Joblio AI Service..."
if [ ! -d "Joblio-app" ]; then
    git clone https://github.com/devashishhaldar2006/Joblio-app.git
fi
cd Joblio-app/innovatex/pythonservices

# 4. Build and run Docker container with restart policy
echo "[4/4] Building and launching Joblio AI container..."
sudo docker build -t joblio-ai .

sudo docker stop joblio-ai-container 2>/dev/null || true
sudo docker rm joblio-ai-container 2>/dev/null || true

sudo docker run -d \
  --name joblio-ai-container \
  --restart always \
  -p 8000:8000 \
  --env-file .env \
  joblio-ai

echo "=========================================="
echo "🚀 Joblio AI Service is LIVE on port 8000!"
echo "Check health: curl http://localhost:8000/docs"
echo "=========================================="
