from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone
import json
import logging
import os
from pathlib import Path
import re
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request as UrlRequest, urlopen

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

BACKEND_DIR = Path(__file__).resolve().parent
load_dotenv(BACKEND_DIR / ".env")
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger("inventai")

gemini_key = os.getenv("GEMINI_API_KEY")
openai_key = os.getenv("OPENAI_API_KEY")
gemini_client = genai.Client(api_key=gemini_key) if gemini_key else None

app = FastAPI(title="InventAI API", description="Multi-model innovation intelligence", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,https://localhost,capacitor://localhost",
    ).split(","),
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

request_log: dict[str, deque] = defaultdict(deque)

@app.middleware("http")
async def rate_limit(request: Request, call_next):
    if request.url.path == "/analyze":
        client_ip = request.client.host if request.client else "unknown"
        now = datetime.now(timezone.utc)
        window = request_log[client_ip]
        while window and window[0] < now - timedelta(minutes=1):
            window.popleft()
        if len(window) >= int(os.getenv("RATE_LIMIT_PER_MINUTE", "10")):
            raise HTTPException(status_code=429, detail="Too many analyses. Please wait one minute and try again.")
        window.append(now)
    started = time.perf_counter()
    response = await call_next(request)
    logger.info("%s %s %s %.0fms", request.method, request.url.path, response.status_code, (time.perf_counter() - started) * 1000)
    return response

class IdeaRequest(BaseModel):
    idea: str = Field(min_length=20, max_length=5000)
    provider: str = Field(default="gemini", pattern="^(gemini|openai)$")
    improve: bool = False
    novelty: bool = False
    breakthrough: bool = False

class ResearchRequest(BaseModel):
    idea: str = Field(min_length=20, max_length=6000)

class ResearchPaper(BaseModel):
    title: str
    authors: list[str]
    year: int | None = None
    venue: str = ""
    doi: str = ""
    url: str
    citations: int = 0
    relevance_score: int = Field(default=0, ge=0, le=100)
    matched_terms: list[str] = Field(default_factory=list)
    source: str = "Crossref"

class ExistingProject(BaseModel):
    name: str
    description: str
    url: str
    stars: int = 0
    language: str = ""
    updated_at: str = ""
    relevance_score: int = Field(default=0, ge=0, le=100)
    matched_terms: list[str] = Field(default_factory=list)
    source: str = "GitHub"

class ResearchEvidence(BaseModel):
    query: str
    papers: list[ResearchPaper]
    existing_projects: list[ExistingProject]
    searched_at: str
    limitations: str

class RoadmapStep(BaseModel):
    phase: str
    duration: str
    outcome: str
    components: list[str]
    skills: list[str]
    estimated_cost: str

class ArchitectureBlock(BaseModel):
    name: str
    description: str

class HardwareItem(BaseModel):
    name: str
    quantity: int = Field(ge=1, le=100)
    purpose: str

class Competitor(BaseModel):
    name: str
    approach: str
    gap: str

class ScoreExplanations(BaseModel):
    innovation: str
    novelty: str
    feasibility: str
    market: str

class JudgeFactor(BaseModel):
    score: int = Field(ge=0, le=100)
    evidence: str
    gap: str
    next_action: str

class JudgeReadiness(BaseModel):
    problem_importance: JudgeFactor
    novelty: JudgeFactor
    technical_innovation: JudgeFactor
    working_prototype: JudgeFactor
    impact_scalability: JudgeFactor
    presentation: JudgeFactor
    weighted_total: int = Field(ge=0, le=100)
    demo_flow: list[str]
    pitch_outline: list[str]
    likely_judge_questions: list[str]

class InnovationAnalysis(BaseModel):
    title: str
    one_liner: str
    verdict: str
    provider: str = ""
    innovation_score: int = Field(ge=0, le=100)
    novelty_score: int = Field(ge=0, le=100)
    feasibility_score: int = Field(ge=0, le=100)
    market_score: int = Field(ge=0, le=100)
    confidence_score: int = Field(default=50, ge=0, le=100)
    score_explanations: ScoreExplanations
    patent_risk: str
    problem: str
    technology: str
    users: str
    prototype: str
    estimated_cost: str
    market_potential: str
    business_model: str
    differentiator: str
    next_experiment: str
    strengths: list[str]
    risks: list[str]
    recommended_actions: list[str]
    critical_assumptions: list[str] = Field(default_factory=list)
    validation_questions: list[str] = Field(default_factory=list)
    success_metrics: list[str] = Field(default_factory=list)
    judge_readiness: JudgeReadiness | None = None
    improvement_suggestions: list[str]
    improved_idea: str
    competitors: list[Competitor]
    market_gaps: list[str]
    roadmap: list[RoadmapStep]
    architecture_blocks: list[ArchitectureBlock]
    required_hardware: list[HardwareItem]
    patent_search_status: str = "AI_ESTIMATE_ONLY"
    analysis_mode: str = "analysis"

RESEARCH_STOP_WORDS = {
    "about", "after", "also", "and", "app", "application", "are", "based", "because", "been", "before", "being", "best", "but", "can", "cannot", "could", "customer", "customers", "currently", "does", "existing", "feature", "features", "for", "from", "given", "has", "have", "help", "helps", "how", "idea", "intelligent", "into", "its", "make", "more", "need", "needs", "not", "often", "our", "problem", "provide", "provides", "right", "should", "smart", "solution", "system", "that", "the", "their", "then", "this", "through", "under", "use", "user", "users", "using", "visiting", "want", "waste", "where", "which", "while", "with", "would", "your"
}

RESEARCH_ALIASES = {
    "stores": "retail", "store": "retail", "retailer": "retail", "retailers": "retail",
    "stocks": "inventory", "inventories": "inventory", "shortage": "stockout", "shortages": "stockout",
    "products": "product", "items": "product", "nearby": "local", "prediction": "forecasting",
    "predict": "forecasting", "predicts": "forecasting", "recommendations": "recommendation",
    "sales": "sale", "shopping-list": "shopping", "realtime": "real-time",
}

RESEARCH_DOMAIN_TERMS = {
    "algorithm", "analytics", "availability", "demand", "forecasting", "hyperlocal", "inventory",
    "local", "marketplace", "optimization", "price", "product", "recommendation", "restock", "retail",
    "routing", "sale", "security", "shopping", "stock", "stockout", "supply", "real-time",
}

def normalized_research_tokens(text: str) -> list[str]:
    prepared = re.sub(r"\breal[ -]?time\b", "real-time", text.lower())
    words = re.findall(r"[a-z][a-z0-9+-]{2,}", prepared)
    return [RESEARCH_ALIASES.get(word, word) for word in words if word not in RESEARCH_STOP_WORDS]

def research_keywords(idea: str, limit: int = 8) -> list[str]:
    tokens = normalized_research_tokens(idea)
    counts: dict[str, int] = defaultdict(int)
    first_seen: dict[str, int] = {}
    for index, token in enumerate(tokens):
        counts[token] += 1
        first_seen.setdefault(token, index)
    ranked = sorted(
        counts,
        key=lambda token: (
            -(counts[token] * 3 + (9 if token in RESEARCH_DOMAIN_TERMS else 0) + min(len(token), 10) / 10),
            first_seen[token],
        ),
    )
    domain_ranked = [token for token in ranked if token in RESEARCH_DOMAIN_TERMS]
    other_ranked = [token for token in ranked if token not in RESEARCH_DOMAIN_TERMS]
    return (domain_ranked + other_ranked)[:limit]

def research_query(idea: str) -> str:
    return " ".join(research_keywords(idea)) or "innovation technology"

def relevance_for_text(text: str, keywords: list[str]) -> tuple[int, list[str]]:
    haystack = set(normalized_research_tokens(text))
    matched = [term for term in keywords if term in haystack]
    if not matched:
        return 0, []
    domain_matches = sum(term in RESEARCH_DOMAIN_TERMS for term in matched)
    score = min(100, 18 + len(matched) * 18 + domain_matches * 8)
    return score, matched

def has_context_conflict(text: str, keywords: list[str]) -> bool:
    lowered = text.lower()
    retail_inventory_query = "retail" in keywords or "inventory" in keywords
    financial_markets = re.search(r"\b(stock market|stock price|trading|equities|sentiment analysis)\b", lowered)
    return bool(retail_inventory_query and financial_markets)

def has_required_context_anchor(text: str, keywords: list[str]) -> bool:
    if "retail" not in keywords and "inventory" not in keywords:
        return True
    tokens = set(normalized_research_tokens(text))
    return bool(tokens & {"retail", "inventory", "marketplace", "product", "shopping", "stockout", "restock"})

def fetch_json(url: str, headers: dict[str, str] | None = None) -> dict:
    request = UrlRequest(url, headers={"User-Agent": "InventAI/2.1 research-evidence", **(headers or {})})
    try:
        with urlopen(request, timeout=12) as response:
            return json.loads(response.read().decode("utf-8"))
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as error:
        logger.warning("Evidence source failed url=%s error=%s", url.split("?")[0], error)
        return {}

def crossref_papers(query: str) -> list[ResearchPaper]:
    keywords = query.split()
    params = urlencode({"query.bibliographic": query, "rows": 30, "sort": "relevance"})
    data = fetch_json(f"https://api.crossref.org/works?{params}")
    candidates: list[ResearchPaper] = []
    for item in data.get("message", {}).get("items", []):
        if item.get("type") not in {"journal-article", "proceedings-article", "posted-content", "book-chapter"}:
            continue
        title = next(iter(item.get("title") or []), "").strip()
        doi = item.get("DOI", "")
        if not title or not doi:
            continue
        searchable = " ".join([title, next(iter(item.get("container-title") or []), ""), " ".join(item.get("subject") or []), re.sub(r"<[^>]+>", " ", item.get("abstract") or "")])
        if has_context_conflict(searchable, keywords) or not has_required_context_anchor(searchable, keywords):
            continue
        relevance_score, matched_terms = relevance_for_text(searchable, keywords)
        title_score, title_matches = relevance_for_text(title, keywords)
        if len(matched_terms) < 2 or (not title_matches and relevance_score < 75):
            continue
        date_parts = item.get("published", {}).get("date-parts", [[]])
        year = date_parts[0][0] if date_parts and date_parts[0] else None
        authors = [" ".join(filter(None, [author.get("given"), author.get("family")])) for author in item.get("author", [])[:4]]
        candidates.append(ResearchPaper(title=title, authors=authors, year=year, venue=next(iter(item.get("container-title") or []), ""), doi=doi, url=f"https://doi.org/{doi}", citations=item.get("is-referenced-by-count", 0), relevance_score=max(relevance_score, title_score), matched_terms=matched_terms))
    candidates.sort(key=lambda paper: (paper.relevance_score, min(paper.citations, 100)), reverse=True)
    return candidates[:5]

def github_projects(query: str) -> list[ExistingProject]:
    keywords = query.split()
    headers = {"Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28"}
    if os.getenv("GITHUB_TOKEN"):
        headers["Authorization"] = f"Bearer {os.getenv('GITHUB_TOKEN')}"
    pairs = [keywords[index:index + 2] for index in range(0, min(len(keywords), 6), 2)]
    found: dict[str, ExistingProject] = {}
    for pair in pairs:
        params = urlencode({"q": f"{' '.join(pair)} in:name,description", "sort": "stars", "order": "desc", "per_page": 15})
        data = fetch_json(f"https://api.github.com/search/repositories?{params}", headers)
        for item in data.get("items", []):
            description = (item.get("description") or "Public implementation matching the idea keywords.").strip()
            searchable = " ".join([item.get("name", ""), description, " ".join(item.get("topics") or [])])
            if has_context_conflict(searchable, keywords) or not has_required_context_anchor(searchable, keywords):
                continue
            relevance_score, matched_terms = relevance_for_text(searchable, keywords)
            if not matched_terms or (len(matched_terms) < 2 and relevance_score < 50):
                continue
            url = item.get("html_url", "")
            project = ExistingProject(name=item.get("full_name", item.get("name", "Project")), description=description, url=url, stars=item.get("stargazers_count", 0), language=item.get("language") or "", updated_at=item.get("updated_at", ""), relevance_score=relevance_score, matched_terms=matched_terms)
            if url and (url not in found or project.relevance_score > found[url].relevance_score):
                found[url] = project
    return sorted(found.values(), key=lambda project: (project.relevance_score, project.stars), reverse=True)[:5]

def build_prompt(idea: str, improve: bool, novelty: bool = False, breakthrough: bool = False) -> str:
    if breakthrough:
        mode = """Run an inventive-contradiction lab inspired by TRIZ and cross-industry analogy. Identify the central trade-off in the idea in the form 'we need X, but increasing X makes Y worse.' Redesign the solution so it achieves both sides without merely choosing a compromise. Borrow one concrete operating mechanism from a distant domain such as biology, logistics, gaming, insurance, manufacturing, or distributed systems and adapt it credibly. improved_idea must describe the breakthrough concept and explicitly name the contradiction it resolves. improvement_suggestions must contain exactly: (1) the contradiction-breaking mechanism, (2) the cross-industry transfer, and (3) a falsifiable experiment that proves the advantage. Avoid generic feature additions and keep the result prototype-ready."""
    elif novelty:
        mode = """Act as a contrarian invention designer. Do not merely add generic AI, voice, blockchain, dashboards, or prediction features. First infer why existing alternatives make this idea feel familiar. Then redesign the concept around a non-obvious mechanism, proprietary data loop, workflow wedge, or business-model advantage that competitors cannot copy quickly. Preserve the original customer problem, but make the solution meaningfully different and realistically buildable. improved_idea must describe the reinvented concept. improvement_suggestions must be three specific novelty mechanisms, not cosmetic features. The novelty score must judge the reinvented concept."""
    elif improve:
        mode = "Actively redesign weak parts of the idea and provide an improved version."
    else:
        mode = "Analyze the idea without silently changing its premise."
    return f"""You are a rigorous innovation strategist, product architect, and startup advisor.
{mode}

IDEA:
{idea}

Return realistic, concise, decision-grade analysis. Scores are integers 0-100. confidence_score measures how strongly the submitted detail supports the conclusions, not how good the idea is. Verdict is exactly PROMISING, VALIDATE, or PIVOT. Patent risk is exactly Low, Medium, or High and is only an AI estimate—never claim a patent search. score_explanations must have exactly these keys: innovation, novelty, feasibility, market. Explain each score with concrete evidence or uncertainty. Give exactly 3 strengths, 3 risks, 3 recommended actions, 3 critical_assumptions, 3 validation_questions, 3 success_metrics, and 3 improvement_suggestions. Validation questions must be neutral customer-interview questions that do not pitch the solution. Every success metric must contain a numeric threshold. improved_idea must be a polished one-paragraph version of the concept. Identify exactly 3 likely competitors or alternative approaches without claiming live research; each has name, approach, and gap. Give exactly 3 market gaps. Give exactly 3 roadmap phases with duration, outcome, components, skills, and estimated_cost. Give exactly 3 ordered architecture blocks. Include only minimum prototype hardware; return [] for software-only ideas.

Also evaluate hackathon judge readiness. Score these exact factors independently: problem_importance (20%), novelty (20%), technical_innovation (20%), working_prototype (20%), impact_scalability (10%), and presentation (10%). For every factor provide concrete evidence from the idea, the largest current gap, and one next action. technical_innovation must reward meaningful AI, algorithms, security, or data design—not ordinary CRUD. working_prototype must judge what can actually be demonstrated, not planned features. weighted_total must equal the weighted sum of the six scores, rounded to an integer. Provide exactly 5 demo_flow steps for a reliable live demo, exactly 5 pitch_outline segments whose suggested timings total between 3 and 5 minutes, and exactly 3 likely_judge_questions with concise suggested answers. Set patent_search_status to AI_ESTIMATE_ONLY."""

def analyze_gemini(idea: str, improve: bool, novelty: bool = False, breakthrough: bool = False) -> InnovationAnalysis:
    if not gemini_client:
        raise HTTPException(status_code=503, detail="Gemini is not configured. Add GEMINI_API_KEY.")
    last_error = None
    models = [
        os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite"),
        "gemini-3.6-flash",
        "gemini-3.1-flash-lite",
    ]
    for model in models:
        try:
            response = gemini_client.models.generate_content(
                model=model,
                contents=build_prompt(idea, improve, novelty, breakthrough),
                config=types.GenerateContentConfig(response_mime_type="application/json", response_schema=InnovationAnalysis),
            )
            parsed = response.parsed
            result = parsed if isinstance(parsed, InnovationAnalysis) else InnovationAnalysis.model_validate(parsed)
            result.provider = "Gemini"
            result.analysis_mode = "breakthrough" if breakthrough else ("novelty" if novelty else ("improve" if improve else "analysis"))
            return result
        except Exception as error:
            last_error = error
            logger.warning("Gemini model %s failed: %s", model, error)
    logger.error("All Gemini models failed: %s", last_error)
    raise HTTPException(status_code=502, detail="Gemini could not complete the analysis. Please retry or choose another provider.")

def analyze_openai(idea: str, improve: bool, novelty: bool = False, breakthrough: bool = False) -> InnovationAnalysis:
    if not openai_key:
        raise HTTPException(status_code=503, detail="OpenAI is not configured. Add OPENAI_API_KEY.")
    try:
        from openai import OpenAI
        client = OpenAI(api_key=openai_key)
        completion = client.chat.completions.parse(
            model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            messages=[
                {"role": "system", "content": "Return only the requested validated innovation analysis."},
                {"role": "user", "content": build_prompt(idea, improve, novelty, breakthrough)},
            ],
            response_format=InnovationAnalysis,
        )
        result = completion.choices[0].message.parsed
        if result is None:
            raise ValueError("The model did not return a valid structured analysis.")
        result.provider = "OpenAI"
        result.analysis_mode = "breakthrough" if breakthrough else ("novelty" if novelty else ("improve" if improve else "analysis"))
        return result
    except HTTPException:
        raise
    except Exception as error:
        logger.exception("OpenAI analysis failed")
        raise HTTPException(status_code=502, detail="OpenAI could not complete the analysis. Please retry or choose another provider.") from error

@app.get("/")
def home():
    return {"message": "InventAI Backend Running", "version": "2.0.0"}

@app.get("/health")
def health():
    return {"status": "healthy", "providers": {"gemini": bool(gemini_key), "openai": bool(openai_key)}, "patent_search": False}

@app.post("/research", response_model=ResearchEvidence)
def research(request: ResearchRequest):
    query = research_query(request.idea.strip())
    logger.info("Evidence search requested query=%s", query)
    papers = crossref_papers(query)
    projects = github_projects(query)
    if not papers and not projects:
        raise HTTPException(status_code=502, detail="Evidence sources are temporarily unavailable. Please retry.")
    return ResearchEvidence(
        query=query,
        papers=papers,
        existing_projects=projects,
        searched_at=datetime.now(timezone.utc).isoformat(),
        limitations="Results are live metadata matches, not proof of novelty or patent clearance. Read the linked sources and verify relevance before making decisions.",
    )

@app.post("/analyze", response_model=InnovationAnalysis)
def analyze(request: IdeaRequest):
    idea = request.idea.strip()
    logger.info("Analysis requested provider=%s improve=%s novelty=%s breakthrough=%s chars=%s", request.provider, request.improve, request.novelty, request.breakthrough, len(idea))
    return analyze_openai(idea, request.improve, request.novelty, request.breakthrough) if request.provider == "openai" else analyze_gemini(idea, request.improve, request.novelty, request.breakthrough)
