# InventAI — AI Innovation Operating System

InventAI turns an early invention idea into a decision-ready brief in under a minute. It scores innovation, novelty, feasibility, and market potential; surfaces patent risk; and converts uncertainty into a measurable three-phase validation roadmap.

## Why it matters

Founders and student innovators often build before validating the problem, differentiation, or riskiest assumption. InventAI makes expert-style innovation strategy accessible at the moment it has the highest leverage: before time and money are committed.

## Standout features

- Four-axis opportunity scoring and visual radar
- Clear `PROMISING`, `VALIDATE`, or `PIVOT` verdict
- Strengths, failure risks, business model, and defensible edge
- Three-phase evidence roadmap and one highest-value experiment
- AI-generated system block diagram and minimum prototype hardware list
- Gemini/OpenAI provider selector with a shared validated output schema
- Parallel compare mode with score differences and recommendations
- Evidence-based explanations under every score
- Competitor alternatives, market gaps, and an idea-improvement mode
- Searchable project dashboard with sort, favorites, rename, and local version history
- Backend request validation, rate limiting, provider fallback models, and structured logging
- Honest AI patent-risk estimate with explicit legal disclaimer
- Save briefs locally and export a polished PDF
- Instant demo mode for a reliable, zero-setup presentation

## Run locally

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Backend:

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app:app --reload
```

Copy `backend/.env.example` to `backend/.env`. Add `GEMINI_API_KEY`, `OPENAI_API_KEY`, or both. Compare mode requires both keys. Provider API keys stay server-side and are never sent to the browser. Set `VITE_API_URL` for a deployed backend; it defaults to `http://127.0.0.1:8000`.

## Capability status

- **Available now:** multi-provider analysis, compare mode, score reasoning, idea improvement, competitor hypotheses, detailed prototype roadmap, dashboard controls, local history, PDF export, rate limiting, validation, and logging.
- **Clearly separated:** patent risk and competitor names are AI-generated hypotheses, not live searches.
- **Integration-ready next:** real patent APIs, authenticated cloud accounts/database, and public deployment. These require selecting external providers and credentials before they can be implemented responsibly.

## 90-second demo script

1. Open with the problem: most ideas fail from untested assumptions, not a lack of effort.
2. Paste a real idea or select **Try instant demo**.
3. Reveal the verdict and four decision scores.
4. Show the defensible edge and the concrete failure watchlist.
5. End on the highlighted “Run this first” experiment—the product turns AI analysis into action.
6. Export the brief as the tangible takeaway.

## Responsible AI

InventAI is an early-stage planning assistant. Scores are directional estimates. Patent risk is not a patent-database search or legal opinion, and all important assumptions should be independently validated.
