# InventAI

InventAI is an idea decision workspace for web and Android. It turns an early concept into four directional scores, one explicit risk, a three-phase validation plan, and the first experiment worth running.

[Open the website](https://inventai-web-kishore.onrender.com) · [View the repository](https://github.com/KISHOREB172/InventAI)

## What makes it useful

InventAI is designed for the decision after brainstorming: _what must be true before this idea deserves more time or money?_

- A concise mobile decision brief instead of a long chat response
- Innovation, novelty, feasibility, and market signals with explanations
- One highest-value experiment with numeric success thresholds
- Live Crossref and GitHub evidence kept separate from AI-generated reasoning
- Three build phases, architecture, minimum prototype needs, and pilot cost
- Gemini analysis, an optional OpenAI second opinion, and model comparison
- Local saved ideas, bounded version history, experiment tracking, and a lightweight PDF brief
- Optional hackathon judging, pitch, demo-flow, and comparison tools

The app never presents a patent-risk estimate as a patent search. External source records are linked to their original public pages, and weak matches are filtered instead of used as filler.

## Architecture

- `frontend/` — React 19, Vite, responsive web UI, and Capacitor shell
- `frontend/android/` — native Android Studio project targeting SDK 36
- `backend/` — FastAPI API with Gemini/OpenAI structured output and public-evidence retrieval
- `render.yaml` — Render blueprint for the static website and API

API keys remain server-side. Android release builds reject cleartext traffic, disable backups, use hardware-accelerated rendering, and require a stable private signing key.

## Run locally

Backend:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
# Add GEMINI_API_KEY and optionally OPENAI_API_KEY to .env
.\venv\Scripts\python.exe -m uvicorn app:app --reload --port 8000
```

Frontend:

```powershell
cd frontend
npm ci
npm run dev
```

The browser uses `http://127.0.0.1:8000` by default. Set `VITE_API_URL` at build time for another backend.

## Verification

```powershell
cd frontend
npm run check

cd ..\backend
.\venv\Scripts\python.exe -m unittest discover -s tests -v
```

For a clean Android sync plus debug test build:

```powershell
cd frontend
powershell -ExecutionPolicy Bypass -File .\android\prepare-release.ps1 `
  -ApiUrl "https://inventai-api-scx1.onrender.com" `
  -SkipReleaseBuild
```

See [`frontend/ANDROID.md`](frontend/ANDROID.md) for Android Studio setup and production signing.

## Deployment and operating limits

The included Render blueprint uses a free API instance, which may sleep and add a cold-start delay. The client starts waking it when the app opens, but predictable production latency requires an always-on service plan.

The API includes request validation, payload limits, provider deadlines, concurrency bounds, per-process rate limits, security headers, and independent research limits. A public production deployment that funds paid model usage should add user authentication plus a shared Redis or edge rate limiter.

## Responsible use

InventAI provides early-stage decision support, not certainty. Scores, competitor hypotheses, market claims, technical feasibility, and patent risk require independent validation. Do not enter confidential clinical, personal, legal, or proprietary data unless the selected model providers and deployment meet your organization’s requirements.
