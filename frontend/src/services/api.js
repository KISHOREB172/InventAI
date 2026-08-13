import { Capacitor } from "@capacitor/core";

const API_URL = import.meta.env.VITE_API_URL || (Capacitor.isNativePlatform() ? "http://10.0.2.2:8000" : "http://127.0.0.1:8000");

export async function analyzeIdea(idea, provider = "gemini", mode = "analysis") {
  const controller = new AbortController();
  // Render's free tier can need 50+ seconds to wake before the model request begins.
  // Keep the client alive long enough for both the cold start and structured response.
  const timeout = setTimeout(() => controller.abort(), 180000);
  let response;
  try {
    response = await fetch(`${API_URL}/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
      body: JSON.stringify({ idea, provider, improve: mode === "improve", novelty: mode === "novelty", breakthrough: mode === "breakthrough" }),
      signal: controller.signal,
    });
  } catch (error) {
    throw new Error(error.name === "AbortError" ? "Analysis took longer than 3 minutes. Please retry; the server should now be awake." : "Cannot reach the analysis engine.", { cause: error });
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
    const response = await fetch(`${API_URL}/research`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
