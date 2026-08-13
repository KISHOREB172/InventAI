import { Capacitor, CapacitorHttp } from "@capacitor/core";

const API_URL = import.meta.env.VITE_API_URL || (Capacitor.isNativePlatform() ? "http://10.0.2.2:8000" : "http://127.0.0.1:8000");

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function onDeviceAnalysis(idea) {
  const clean = idea.replace(/\s+/g, " ").trim();
  const words = clean.split(" ");
  const title = words.slice(0, 7).join(" ").replace(/^(an?|the|my)\s+/i, "") || "New idea";
  const detail = Math.min(15, Math.floor(clean.length / 45));
  const scores = { innovation: 64 + detail, novelty: 58 + detail, feasibility: 70 + Math.floor(detail / 2), market: 62 + detail };
  return {
    title: title.charAt(0).toUpperCase() + title.slice(1), provider: "On-device", offline: true,
    one_liner: clean, verdict: detail >= 8 ? "PROMISING" : "VALIDATE", patent_risk: "Medium", confidence_score: 45 + detail,
    innovation_score: scores.innovation, novelty_score: scores.novelty, feasibility_score: scores.feasibility, market_score: scores.market,
    score_explanations: { innovation: "The concept has a clear opportunity, pending user evidence.", novelty: "Differentiation must be tested against current alternatives.", feasibility: "A narrow prototype appears achievable.", market: "Demand is plausible but not yet demonstrated." },
    problem: `The idea addresses the situation described by the innovator: ${clean}`,
    users: "Start with one sharply defined user group that experiences this problem frequently.",
    technology: "Use the smallest reliable stack that can demonstrate the core outcome.",
    differentiator: "Focus on one measurable improvement that current alternatives do not deliver well.",
    business_model: "Validate willingness to use and pay before selecting a revenue model.",
    market_potential: "Potential depends on problem frequency, urgency, and switching behaviour.",
    prototype: "Build only the core user journey and test it with five target users.", estimated_cost: "Keep the first evidence prototype below ₹10,000 where possible.",
    next_experiment: "Interview five target users, then test a clickable or manual prototype with at least three of them.",
    strengths: ["The concept can be tested without building the full product", "A focused first user group can produce useful evidence", "The core promise can be measured"],
    risks: ["The target user and urgent problem may still be too broad", "Existing alternatives may already feel good enough", "Interest may not translate into repeated use or payment"],
    critical_assumptions: ["The problem occurs often enough to matter", "Users will change their current behaviour", "The promised outcome can be delivered affordably"],
    validation_questions: ["Tell me about the last time this problem occurred.", "What do you use or do today to handle it?", "What would make you try a different solution?"],
    success_metrics: ["4 of 5 users confirm the problem occurred in the last month", "3 of 5 users complete the prototype journey without help", "At least 2 users commit to a follow-up pilot"],
    recommended_actions: ["Choose one primary user", "Document the current alternative", "Run the smallest behaviour test"],
    improvement_suggestions: ["Add a measurable outcome", "Explain why the current solution fails", "Reduce the first version to one job"],
    roadmap: [
      { phase: "Understand", duration: "Days 1–2", outcome: "Five problem interviews and a ranked pain list" },
      { phase: "Prototype", duration: "Days 3–5", outcome: "One testable core journey" },
      { phase: "Prove", duration: "Week 2", outcome: "Observed usage and a go, change, or stop decision" },
    ],
    architecture_blocks: [], required_hardware: [], competitors: [], market_gaps: [],
  };
}

async function apiRequest(path, { method = "GET", body, signal } = {}) {
  if (Capacitor.isNativePlatform()) {
    const response = await CapacitorHttp.request({
      url: `${API_URL}${path}`,
      method,
      headers: body ? { "Content-Type": "application/json" } : {},
      data: body ? JSON.parse(body) : undefined,
      connectTimeout: 15000,
      readTimeout: 30000,
    });
    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      json: async () => typeof response.data === "string" ? JSON.parse(response.data) : response.data,
    };
  }
  return fetch(`${API_URL}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body,
    signal,
    cache: method === "GET" ? "no-store" : undefined,
  });
}

async function wakeAnalysisEngine(signal) {
  // A free Render instance may briefly refuse/reset mobile connections while waking.
  // Health checks are safe to retry and make the following model request reliable.
  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await apiRequest("/health", { signal });
      if (response.ok) return;
      lastError = new Error(`Health check returned ${response.status}.`);
    } catch (error) {
      if (error.name === "AbortError") throw error;
      lastError = error;
    }
    await wait(2000 * (attempt + 1));
  }
  throw lastError || new Error("The analysis engine is unavailable.");
}

export async function analyzeIdea(idea, provider = "gemini", mode = "analysis") {
  const controller = new AbortController();
  // Render's free tier can need 50+ seconds to wake before the model request begins.
  // Keep the client alive long enough for both the cold start and structured response.
  const timeout = setTimeout(() => controller.abort(), 180000);
  let response;
  try {
    if (!Capacitor.isNativePlatform()) await wakeAnalysisEngine(controller.signal);
    response = await apiRequest("/analyze", {
    method: "POST",
      body: JSON.stringify({ idea, provider, improve: mode === "improve", novelty: mode === "novelty", breakthrough: mode === "breakthrough" }),
      signal: controller.signal,
    });
  } catch (error) {
    if (Capacitor.isNativePlatform()) return onDeviceAnalysis(idea);
    throw new Error(error.name === "AbortError" ? "Analysis took longer than 3 minutes. Please retry; the server should now be awake." : "Cannot reach the analysis engine after 3 attempts. Check internet access and try again.", { cause: error });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    let message = "The analysis engine could not complete this request.";
    try { const body = await response.json(); message = body.detail || body.error || message; } catch { /* keep fallback */ }
    if (Capacitor.isNativePlatform()) return onDeviceAnalysis(idea);
    throw new Error(message);
  }

  const data = await response.json();

  if (data.error) {
    if (Capacitor.isNativePlatform()) return onDeviceAnalysis(idea);
    throw new Error(data.error);
  }
  try { localStorage.setItem("inventai-last-analysis", JSON.stringify(data)); } catch { /* optional cache */ }
  return data;
}

export async function researchIdea(idea) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000);
  try {
    await wakeAnalysisEngine(controller.signal);
    const response = await apiRequest("/research", {
      method: "POST",
      body: JSON.stringify({ idea }),
      signal: controller.signal,
    });
    if (!response.ok) {
      let message = "Evidence search could not be completed.";
      try { const body = await response.json(); message = body.detail || message; } catch { /* keep fallback */ }
      throw new Error(message);
    }
    return await response.json();
  } catch (error) {
    if (error.name === "AbortError") throw new Error("Evidence search took longer than 2 minutes. Please retry; the server should now be awake.", { cause: error });
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
