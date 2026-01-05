FROM python:3.12-slim-bookworm

WORKDIR /app

# Install system dependencies
# curl/ca-certificates/gnupg for NodeSource
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    gnupg \
    git \
    vim \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js (LTS v20)
RUN mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" > /etc/apt/sources.list.d/nodesource.list \
    && apt-get update \
    && apt-get install -y nodejs \
    && npm install -g pnpm

# Install uv
RUN pip install uv

# --- Backend Setup ---
WORKDIR /app/backend
COPY backend/pyproject.toml backend/uv.lock* ./
RUN uv sync --frozen --no-install-project

# --- Frontend Setup ---
WORKDIR /app/frontend
COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN pnpm install

# --- Application Code ---
WORKDIR /app
COPY . .

# Build Frontend (Initial build for the image)
WORKDIR /app/frontend
RUN pnpm run build

# --- Final Configuration ---
WORKDIR /app
EXPOSE 80

# Run uvicorn (Backend serves the static files built above)
CMD ["uv", "run", "--directory", "backend", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "80"]
