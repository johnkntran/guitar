# Chord Crusher - Guitar Chord Identifier

A full-stack Neobrutalist web application for identifying guitar chords and reverse lookups.

## Tech Stack
- **Frontend**: Vue 3, TypeScript, Pinia, Vite (SPA)
- **Backend**: FastAPI, UV (Python)
- **Deployment**: Docker

## Project Structure
- `backend/`: FastAPI application and chord logic.
- `frontend/`: Vue.js application.
- `.devcontainer/`: VS Code Dev Container configuration.

## How to Run

### Local Development
1. **Backend**:
    ```bash
    cd backend
    uv sync
    uv run uvicorn main:app --reload
    ```
2. **Frontend** (in a new terminal):
    ```bash
    cd frontend
    pnpm install
    pnpm dev
    ```
    Access at `http://localhost:5173`.

### Docker
Run the entire stack with Docker Compose:
```bash
docker-compose up --build
```
Access at `http://localhost:8000`.

## Deployment
### GitHub Actions
To deploy via GitHub Actions:
1. Build the Docker image.
2. Push to a container registry (GHCR/DockerHub).
3. Deploy to your cloud provider (Azure App Service, AWS ECS, GCP Cloud Run).

### Azure/AWS/GCP
This application is containerized and stateless (no DB). It can be deployed to any container orchestration service that supports Docker.
- **Port**: The container exposes port `80`.
- **Environment**: No special env vars required for basic functionality.
