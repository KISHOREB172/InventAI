import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import AnalysisProgress from "./components/AnalysisProgress";
import IdeaWorkbench from "./components/IdeaWorkbench";
import MobileDecisionView from "./components/MobileDecisionView";
import Navbar from "./components/Navbar";
import RecentProjects from "./components/RecentProjects";
import { useMediaQuery } from "./hooks/useMediaQuery";
import { analyzeIdea, researchIdea, warmAnalysisService } from "./services/api";
import { clearAllAppData, clearTransientAppData, loadProjects, saveProjects } from "./utils/storage";

const DesktopWorkspace = lazy(() => import("./components/DesktopWorkspace"));
const ResearchEvidence = lazy(() => import("./components/ResearchEvidence"));

const EXAMPLE_IDEA = "A low-cost smart irrigation kit for small farms that combines soil sensors, local weather data, and clear recommendations to reduce water use while working offline.";
const EXAMPLE_RESULT = {
  title: "TerraPulse Field Guide",
  one_liner: "An offline irrigation guide that turns field conditions into clear, measurable watering decisions.",
  verdict: "PROMISING",
  provider: "Example",
  innovation_score: 84,
  novelty_score: 76,
  feasibility_score: 82,
  market_score: 87,
  confidence_score: 79,
  patent_risk: "Medium",
  score_explanations: {
    innovation: "A credible combination of offline operation and explainable field decisions.",
    novelty: "Irrigation automation exists, but trust and offline use create a useful wedge.",
    feasibility: "The first field prototype can use accessible hardware and simple rules.",
    market: "Water cost and reliability are urgent, measurable problems for small farms.",
  },
  problem: "Small farms often overwater because precision-agriculture systems are expensive, connectivity-dependent, and difficult to trust.",
  technology: "Soil sensors, a low-power field controller, local weather inputs, offline decision rules, and a simple mobile interface.",
  users: "Smallholder farmers and agricultural cooperatives.",
  prototype: "Instrument one plot and compare water use against a control plot for four weeks.",
  estimated_cost: "INR 30,000-60,000 for a field pilot.",
  market_potential: "A focused entry point into practical, climate-resilient farm operations.",
  business_model: "Starter kit plus seasonal support for cooperatives.",
  differentiator: "Offline operation and a clear explanation for every recommendation.",
  next_experiment: "Recruit five farmers and prove at least 20% lower water use without reducing crop health.",
  strengths: ["Urgent, measurable problem", "Clear first user group", "Prototype uses accessible components"],
  risks: ["Calibration varies by soil type", "Farmers may prefer manual control", "The trust advantage is not yet proven"],
  recommended_actions: ["Interview five farmers", "Measure current water use", "Build one sensor-to-recommendation journey"],
  critical_assumptions: ["Farmers value offline operation", "The kit saves at least 20% water", "Explanations improve trust"],
  validation_questions: ["How do you decide when to irrigate today?", "What caused your last costly watering mistake?", "What evidence would make you trust a recommendation?"],
  success_metrics: ["20% lower water use", "No more than 5% crop-health decline", "4 of 5 farmers request another trial"],
  improvement_suggestions: ["Focus on one crop", "Keep manual override visible", "Make water savings the primary proof"],
  improved_idea: EXAMPLE_IDEA,
  competitors: [],
  market_gaps: ["Reliable offline operation", "Low-cost cooperative deployment", "Visible decision explanations"],
  roadmap: [
    { phase: "Understand", duration: "Week 1", outcome: "Five farmer interviews and baseline water data", components: [], skills: [], estimated_cost: "INR 0-2,000" },
    { phase: "Prototype", duration: "Weeks 2-3", outcome: "Working sensor-to-recommendation prototype", components: [], skills: [], estimated_cost: "INR 15,000-30,000" },
    { phase: "Prove", duration: "Weeks 4-6", outcome: "Field trial with measured savings", components: [], skills: [], estimated_cost: "INR 15,000-30,000" },
  ],
  architecture_blocks: [],
  required_hardware: [],
  analysis_mode: "analysis",
};

function App() {
  const isNarrowScreen = useMediaQuery("(max-width: 700px)");
  const isMobile = Capacitor.isNativePlatform() || isNarrowScreen;
  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [demoMode, setDemoMode] = useState(false);
  const [provider, setProvider] = useState("gemini");
  const [compareMode, setCompareMode] = useState(false);
  const [groundedMode, setGroundedMode] = useState(false);
  const [compareResults, setCompareResults] = useState(null);
  const [research, setResearch] = useState(null);
  const [researchLoading, setResearchLoading] = useState(false);
  const [researchError, setResearchError] = useState("");
  const [showResearchPanel, setShowResearchPanel] = useState(false);
  const [savedProjects, setSavedProjects] = useState(loadProjects);
  const [notice, setNotice] = useState("");
  const analysisController = useRef(null);
  const researchController = useRef(null);
  const analysisSequence = useRef(0);
  const researchSequence = useRef(0);
  const noticeTimer = useRef(null);

  const readiness = useMemo(() => {
    const text = idea.toLowerCase();
    const checks = [
      idea.trim().length >= 80,
      /user|customer|farmer|student|team|business|patient|worker|nurse|doctor|teacher|parent|driver|owner|manager|employee|resident/.test(text),
      /problem|struggle|waste|cost|slow|difficult|risk|lose|missing|delay|error|pain|manual|burden/.test(text),
      /measure|reduce|increase|save|target|%|faster|cheaper/.test(text),
    ];
    const score = checks.filter(Boolean).length * 25;
    return {
      score,
      tone: score >= 75 ? "good" : score >= 50 ? "medium" : "low",
      missing: ["more detail", "target user", "current problem", "measurable outcome"].filter((_, index) => !checks[index]),
    };
  }, [idea]);

  const showNotice = useCallback((message) => {
    window.clearTimeout(noticeTimer.current);
    setNotice(message);
    noticeTimer.current = window.setTimeout(() => setNotice(""), 2600);
  }, []);

  const resetEvidence = useCallback(() => {
    researchSequence.current += 1;
    researchController.current?.abort();
    researchController.current = null;
    setResearch(null);
    setResearchLoading(false);
    setResearchError("");
  }, []);

  const startNewIdea = useCallback(() => {
    analysisSequence.current += 1;
    analysisController.current?.abort();
    analysisController.current = null;
    setLoading(false);
    setIdea("");
    setResult(null);
    setCompareResults(null);
    setDemoMode(false);
    setError("");
    setShowResearchPanel(false);
    resetEvidence();
    clearTransientAppData();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [resetEvidence]);

  const editCurrentIdea = () => {
    analysisSequence.current += 1;
    analysisController.current?.abort();
    setLoading(false);
    setResult(null);
    setCompareResults(null);
    setDemoMode(false);
    setError("");
    setShowResearchPanel(false);
    resetEvidence();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    clearTransientAppData();
    void warmAnalysisService();
    if (!Capacitor.isNativePlatform()) return undefined;
    const handleNewLaunch = () => startNewIdea();
    window.addEventListener("inventai:new-launch", handleNewLaunch);
    return () => {
      window.removeEventListener("inventai:new-launch", handleNewLaunch);
    };
  }, [startNewIdea]);

  useEffect(() => () => {
    analysisController.current?.abort();
    researchController.current?.abort();
    window.clearTimeout(noticeTimer.current);
  }, []);

  const loadResearch = async (source = idea.trim()) => {
    const sourceIdea = typeof source === "string" ? source.trim() : idea.trim();
    if (sourceIdea.length < 20) return;
    const sequence = researchSequence.current + 1;
    researchSequence.current = sequence;
    researchController.current?.abort();
    const requestController = new AbortController();
    researchController.current = requestController;
    setShowResearchPanel(true);
    setResearchLoading(true);
    setResearchError("");
    try {
      const evidence = await researchIdea(sourceIdea, requestController.signal);
      if (sequence === researchSequence.current) setResearch(evidence);
    } catch (requestError) {
      if (sequence === researchSequence.current && requestError.name !== "AbortError") setResearchError(requestError.message);
    } finally {
      if (sequence === researchSequence.current) {
        setResearchLoading(false);
        researchController.current = null;
      }
    }
  };

  const runAnalysis = async (mode = "analysis") => {
    const sourceIdea = idea.trim();
    if (sourceIdea.length < 20) {
      setError("Add the user, their problem, and how your idea helps before requesting a review.");
      return;
    }
    const sequence = analysisSequence.current + 1;
    analysisSequence.current = sequence;
    analysisController.current?.abort();
    const requestController = new AbortController();
    analysisController.current = requestController;
    const hasCurrentResult = Boolean(result);
    setLoading(true);
    setError("");
    if (!hasCurrentResult) {
      setCompareResults(null);
      setDemoMode(false);
      resetEvidence();
    }

    try {
      let selected;
      if (compareMode) {
        const [gemini, openai] = await Promise.allSettled([
          analyzeIdea(sourceIdea, "gemini", mode, requestController.signal),
          analyzeIdea(sourceIdea, "openai", mode, requestController.signal),
        ]);
        const compared = {
          gemini: gemini.status === "fulfilled" ? gemini.value : null,
          openai: openai.status === "fulfilled" ? openai.value : null,
          errors: {
            gemini: gemini.status === "rejected" ? gemini.reason.message : "",
            openai: openai.status === "rejected" ? openai.reason.message : "",
          },
        };
        if (sequence !== analysisSequence.current) return;
        selected = compared[provider] || compared.gemini || compared.openai;
        if (!selected) throw new Error("Neither analysis engine completed the review.");
        setCompareResults(compared);
      } else {
        selected = await analyzeIdea(sourceIdea, provider, mode, requestController.signal);
      }
      if (sequence !== analysisSequence.current) return;
      setResult(selected);
      setDemoMode(false);
      if (!compareMode) setCompareResults(null);
      resetEvidence();
      window.scrollTo({ top: 0, behavior: "auto" });
      if (groundedMode) void loadResearch(sourceIdea);
    } catch (requestError) {
      if (sequence === analysisSequence.current && requestError.name !== "AbortError") setError(requestError.message);
    } finally {
      if (sequence === analysisSequence.current) {
        setLoading(false);
        analysisController.current = null;
      }
    }
  };

  const cancelAnalysis = () => {
    analysisSequence.current += 1;
    analysisController.current?.abort();
    analysisController.current = null;
    setLoading(false);
    showNotice("Analysis cancelled. Your idea is still here.");
  };

  const runDemo = () => {
    analysisSequence.current += 1;
    analysisController.current?.abort();
    setLoading(false);
    setIdea(EXAMPLE_IDEA);
    setResult(EXAMPLE_RESULT);
    setCompareResults(null);
    setDemoMode(true);
    setError("");
    resetEvidence();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveProject = () => {
    if (!result) return false;
    const existing = savedProjects.find((project) => project.idea === idea);
    const savedAt = new Date().toISOString();
    const version = { result, provider: result.provider || provider, createdAt: savedAt };
    const next = existing
      ? savedProjects.map((project) => project.id === existing.id
        ? { ...project, result, versions: [...(project.versions || []), version].slice(-8) }
        : project)
      : [{ id: Date.now(), idea, result, versions: [version], createdAt: savedAt, favorite: false }, ...savedProjects].slice(0, 30);
    if (!saveProjects(next)) {
      setError("This device could not save another project. Remove an older project and retry.");
      return false;
    }
    setSavedProjects(next);
    showNotice(existing ? "A new version was saved on this device." : "Idea saved on this device.");
    return true;
  };

  const deleteProject = (id) => {
    const next = savedProjects.filter((project) => project.id !== id);
    if (!saveProjects(next)) {
      setError("This device could not update the idea library. Free some storage and retry.");
      return false;
    }
    setSavedProjects(next);
    showNotice("Saved idea deleted.");
    return true;
  };

  const updateProject = (id, changes) => {
    const next = savedProjects.map((project) => project.id === id ? { ...project, ...changes } : project);
    if (!saveProjects(next)) {
      setError("This device could not update the idea library. Free some storage and retry.");
      return false;
    }
    setSavedProjects(next);
    return true;
  };

  const openProject = (project) => {
    analysisSequence.current += 1;
    analysisController.current?.abort();
    setLoading(false);
    setIdea(project.idea);
    setResult(project.result);
    setCompareResults(null);
    setDemoMode(false);
    setError("");
    resetEvidence();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearLocalData = () => {
    clearAllAppData();
    setSavedProjects([]);
    startNewIdea();
    showNotice("Local InventAI data was cleared.");
  };

  return <div className="app-shell">
    {!(isMobile && result) && <Navbar onNewIdea={startNewIdea} onClearData={clearLocalData} />}
    <main className={result ? "has-result" : ""}>
      {!result && <IdeaWorkbench
        idea={idea}
        onIdeaChange={(value) => { setIdea(value); if (error) setError(""); }}
        readiness={readiness}
        loading={loading}
        error={error}
        onAnalyze={runAnalysis}
        onRetry={() => runAnalysis("analysis")}
        onDemo={runDemo}
        onResearch={() => loadResearch()}
        provider={provider}
        onProviderChange={setProvider}
        compareMode={compareMode}
        onCompareChange={setCompareMode}
        groundedMode={groundedMode}
        onGroundedChange={setGroundedMode}
      />}
      {!result && isMobile && showResearchPanel && <Suspense fallback={null}>
        <div className="mobile-inline-evidence">
          <ResearchEvidence evidence={research} loading={researchLoading} error={researchError} onRetry={() => loadResearch()} />
        </div>
      </Suspense>}
      {!result && isMobile && savedProjects.length > 0 && <RecentProjects projects={savedProjects} onOpen={openProject} />}
      {loading && <AnalysisProgress onCancel={cancelAnalysis} />}
      {result && isMobile && <MobileDecisionView
        key={`${idea}-${result.title}`}
        result={result}
        demoMode={demoMode}
        onEdit={editCurrentIdea}
        onNewIdea={startNewIdea}
        onSave={saveProject}
        onAnalyze={runAnalysis}
        loading={loading}
        compareResults={compareResults}
        onResearch={() => loadResearch()}
        research={research}
        researchLoading={researchLoading}
        researchError={researchError}
      />}
      {!isMobile && <Suspense fallback={<div className="workspace-loading">Loading workspace...</div>}>
        <DesktopWorkspace
          idea={idea}
          result={result}
          provider={provider}
          demoMode={demoMode}
          loading={loading}
          compareResults={compareResults}
          savedProjects={savedProjects}
          research={research}
          researchLoading={researchLoading}
          researchError={researchError}
          showResearchPanel={showResearchPanel}
          onAnalyze={runAnalysis}
          onEdit={editCurrentIdea}
          onSave={saveProject}
          onLoadResearch={loadResearch}
          onOpenProject={openProject}
          onDeleteProject={deleteProject}
          onUpdateProject={updateProject}
        />
      </Suspense>}
    </main>
    {result && error && <div className="app-toast app-toast--error" role="alert">{error}</div>}
    {notice && !error && <div className="app-toast" role="status">{notice}</div>}
  </div>;
}

export default App;
