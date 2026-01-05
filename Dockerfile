FROM python:3.12-slim-bookworm

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    gnupg \
    git \
    vim \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm and Node.js (LTS) via pnpm env
ENV PNPM_HOME="/root/.local/share/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN curl -fsSL https://get.pnpm.io/install.sh | sh - \
    && pnpm env use --global lts

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
