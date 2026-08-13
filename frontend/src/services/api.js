import { Capacitor, CapacitorHttp } from "@capacitor/core";

const API_URL = import.meta.env.VITE_API_URL || (Capacitor.isNativePlatform() ? "http://10.0.2.2:8000" : "http://127.0.0.1:8000");

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function apiRequest(path, { method = "GET", body, signal } = {}) {
  if (Capacitor.isNativePlatform()) {
    const response = await CapacitorHttp.request({
      url: `${API_URL}${path}`,
      method,
      headers: body ? { "Content-Type": "application/json" } : {},
      data: body ? JSON.parse(body) : undefined,
      connectTimeout: 60000,
      readTimeout: 180000,
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
    await wakeAnalysisEngine(controller.signal);
    response = await apiRequest("/analyze", {
    method: "POST",
      body: JSON.stringify({ idea, provider, improve: mode === "improve", novelty: mode === "novelty", breakthrough: mode === "breakthrough" }),
      signal: controller.signal,
    });
  } catch (error) {
    throw new Error(error.name === "AbortError" ? "Analysis took longer than 3 minutes. Please retry; the server should now be awake." : "Cannot reach the analysis engine after 3 attempts. Check internet access and try again.", { cause: error });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    let message = "The analysis engine could not complete this request.";
    try { const body = await response.json(); message = body.detail || body.error || message; } catch { /* keep fallback */ }
    throw new Error(message);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error);
  }

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
