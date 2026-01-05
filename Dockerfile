# Stage 1: Build Frontend
FROM node:20-slim AS frontend-builder

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app/frontend
COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN pnpm install

COPY frontend/ ./
# Build output goes to backend/static (per vite config) or dist
# We need to make sure the vite config output dir is respected relative to where we run build.
# If vite.config.ts says `../backend/static`, and we are in /app/frontend, it tries to write to /app/backend/static.
# So we should prepare that dir.
RUN mkdir -p /app/backend/static
RUN pnpm run build

# Stage 2: Backend
FROM python:3.12-slim-bookworm

WORKDIR /app

# Install uv
RUN pip install uv

# Copy backend dependencies
COPY backend/pyproject.toml backend/uv.lock* ./backend/
WORKDIR /app/backend
RUN uv sync --frozen --no-install-project

# Copy backend code
COPY backend/ ./

# Copy built frontend assets from Stage 1
# created in /app/backend/static in stage 1
COPY --from=frontend-builder /app/backend/static ./static

# Expose port (Promp asked for 0.0.0.0:80)
EXPOSE 80

# Command to run
# We need to run uvicorn on port 80.
# Note: standard user might not have privs for 80, but in docker it's fine usually.
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "80"]
