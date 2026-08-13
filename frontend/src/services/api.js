import { Capacitor } from "@capacitor/core";

const DEFAULT_NATIVE_API_URL = "https://inventai-api-scx1.onrender.com";
const API_URL = (import.meta.env.VITE_API_URL || (Capacitor.isNativePlatform() ? DEFAULT_NATIVE_API_URL : "http://127.0.0.1:8000")).replace(/\/$/, "");
const REQUEST_TIMEOUT_MS = 60000;

export class ApiError extends Error {
  constructor(message, { code = "UNKNOWN", status = 0, retryable = true, cause } = {}) {
    super(message, { cause }); this.name = "ApiError"; this.code = code; this.status = status; this.retryable = retryable;
  }
}

const friendlyMessage = (status, detail) => {
  const readableDetail = typeof detail === "string" ? detail : "";
  if (status === 400 || status === 422) return readableDetail || "The idea could not be reviewed. Check the brief and try again.";
  if (status === 429) return "Too many reviews were requested. Wait one minute, then retry.";
  if (status === 401 || status === 403) return "This app is not authorized to use the analysis service.";
  if (status >= 500) return readableDetail || "The analysis service is temporarily unavailable. Please retry shortly.";
  return readableDetail || "The request could not be completed.";
};

const validateAnalysis = (data) => {
  const scoreKeys = ["innovation_score", "novelty_score", "feasibility_score", "market_score"];
  const validScores = scoreKeys.every((key) => Number.isFinite(data?.[key]) && data[key] >= 0 && data[key] <= 100);
  if (!data || typeof data.title !== "string" || typeof data.one_liner !== "string" || !validScores || !Array.isArray(data.roadmap) || !Array.isArray(data.risks)) {
    throw new ApiError("The analysis service returned an incomplete result. Please retry.", { code: "INVALID_RESPONSE" });
  }
  return data;
};

async function fetchRequest(path, options) {
  if (options.signal?.aborted) throw new DOMException("Aborted", "AbortError");
  const controller = new AbortController();
  let timedOut = false;
  const relayAbort = () => controller.abort();
  options.signal?.addEventListener("abort", relayAbort, { once: true });
  const timer = window.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);
  try {
    return await fetch(`${API_URL}${path}`, {
      method: options.method || "GET",
      headers: options.body ? { "Content-Type": "application/json" } : {},
      body: options.body,
      signal: controller.signal,
      cache: "no-store",
    });
  } catch (error) {
    if (timedOut) {
      throw new ApiError("The analysis service did not respond within 60 seconds. Retry once the service is awake.", { code: "TIMEOUT" });
    }
    if (options.signal?.aborted) throw new DOMException("Aborted", "AbortError");
    throw error;
  } finally {
    window.clearTimeout(timer);
    options.signal?.removeEventListener("abort", relayAbort);
  }
}

async function request(path, options = {}) {
  try {
    const response = await fetchRequest(path, options);
    if (!response.ok) {
      let detail = ""; try { const body = await response.json(); detail = body?.detail || body?.error || ""; } catch { /* no response body */ }
      throw new ApiError(friendlyMessage(response.status, detail), { code: `HTTP_${response.status}`, status: response.status, retryable: response.status === 429 || response.status >= 500 });
    }
    return await response.json();
  } catch (error) {
    if (error.name === "AbortError") throw error;
    if (error instanceof ApiError) throw error;
    throw new ApiError("Cannot connect to the analysis service. Check your internet connection and retry.", { code: "NETWORK", cause: error });
  }
}

export async function analyzeIdea(idea, provider = "gemini", mode = "analysis", signal) {
  const data = await request("/analyze", { method: "POST", body: JSON.stringify({ idea, provider, improve: mode === "improve", novelty: mode === "novelty", breakthrough: mode === "breakthrough" }), signal });
  return validateAnalysis(data);
}

export async function researchIdea(idea, signal) {
  const data = await request("/research", { method: "POST", body: JSON.stringify({ idea }), signal });
  if (!Array.isArray(data?.papers) || !Array.isArray(data?.existing_projects)) throw new ApiError("The evidence service returned an incomplete result.", { code: "INVALID_RESPONSE" });
  const isSafeUrl = (value) => {
    try { return ["http:", "https:"].includes(new URL(value).protocol); } catch { return false; }
  };
  return {
    ...data,
    papers: data.papers.filter((item) => isSafeUrl(item?.url)),
    existing_projects: data.existing_projects.filter((item) => isSafeUrl(item?.url)),
  };
}

export async function warmAnalysisService() {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`${API_URL}/health`, { signal: controller.signal, cache: "no-store" });
    return response.ok;
  } catch {
    return false;
  } finally {
    window.clearTimeout(timer);
  }
}
