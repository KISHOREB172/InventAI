import { useEffect, useMemo, useRef, useState } from "react";
import Navbar from "./components/Navbar";
import InnovationReport from "./components/InnovationReport";
import ProjectDashboard from "./components/ProjectDashboard";
import ModelComparison from "./components/ModelComparison";
import ResearchEvidence from "./components/ResearchEvidence";
import { analyzeIdea, researchIdea } from "./services/api";
import { publishResearch } from "./services/researchStore";

const EXAMPLE = "A low-cost smart irrigation kit for small farms that combines soil sensors, hyperlocal weather data, and explainable AI to automatically reduce water use while working offline.";
const IDEA_STARTERS = [
  ["Product", "A [product] for [specific user] who struggles with [problem]. It works by [mechanism], unlike [alternative], and succeeds if [measurable outcome]."],
  ["Climate", "A climate solution for [community or industry] that reduces [waste/emissions/resource use] by [mechanism], with a pilot target of [number]."],
  ["AI workflow", "An AI-assisted workflow for [role] that replaces [painful task], uses [unique data or process], keeps humans in control by [safeguard], and saves [time/cost]."],
];

const DEMO_RESULT = {
  title: "TerraPulse Offline Irrigation",
  one_liner: "An offline-first irrigation copilot that turns field conditions into explainable watering decisions.",
  verdict: "PROMISING",
  innovation_score: 86, novelty_score: 78, feasibility_score: 84, market_score: 88,
  confidence_score: 82,
  patent_risk: "Medium",
  problem: "Small farms overwater because existing precision-agriculture systems are costly, connectivity-dependent, and difficult to trust.",
  technology: "ESP32 sensor nodes, capacitive soil probes, LoRa, a solar gateway, TinyML rules, and a lightweight mobile PWA.",
  users: "Smallholder farmers, cooperatives, agronomists, and rural irrigation programs.",
  prototype: "Instrument one plot with three sensor nodes and a valve controller; compare water use and crop health against a control plot for four weeks.",
  estimated_cost: "$350–$700 for a field-ready pilot",
  market_potential: "A strong wedge into climate-resilient agriculture, with recurring revenue from agronomy insights and fleet monitoring.",
  business_model: "Starter kit sale plus a low-cost seasonal analytics subscription; cooperatives can sponsor shared gateways.",
  differentiator: "Offline operation plus a visible reason for every watering recommendation creates a defensible trust advantage.",
  next_experiment: "Recruit five farmers and prove at least 20% water savings without reducing crop health.",
  strengths: ["Clear, urgent customer pain", "Measurable climate impact", "Prototype uses accessible hardware"],
  risks: ["Sensor calibration across soil types", "Farmers may resist automated valve control", "Patent landscape needs professional search"],
  critical_assumptions: ["Farmers will trust explainable recommendations", "The kit can save at least 20% water", "Offline operation is a purchase driver"],
  validation_questions: ["How do you decide when and how much to irrigate today?", "What caused your most expensive irrigation mistake?", "What proof would you need before allowing automatic valve control?"],
  success_metrics: ["At least 20% lower water use", "No more than 5% reduction in crop health", "4 of 5 pilot farmers request a second-season trial"],
  judge_readiness: {
    weighted_total: 84,
    problem_importance: { score: 92, evidence: "Water scarcity and irrigation costs create urgent, measurable pain for small farms.", gap: "The submission does not yet quantify the problem for one target region.", next_action: "Add one regional water-cost statistic and two farmer interview quotes." },
    novelty: { score: 78, evidence: "Offline explainability and low-cost cooperative deployment differentiate it from cloud-first farm platforms.", gap: "Sensors plus irrigation automation already exist.", next_action: "Demonstrate the unique trust loop: recommendation, explanation, farmer override, and learning." },
    technical_innovation: { score: 86, evidence: "Edge inference, sensor fusion, LoRa networking, and explainable control form a meaningful technical system.", gap: "The learning and explanation mechanism needs a concrete architecture.", next_action: "Show one live sensor reading passing through the edge decision model into an explained valve action." },
    working_prototype: { score: 82, evidence: "Accessible components support a credible end-to-end field demonstration.", gap: "Field reliability and calibration remain unproven.", next_action: "Prepare a tabletop soil-moisture demo with a recorded field-trial fallback." },
    impact_scalability: { score: 84, evidence: "Reusable sensor nodes and shared gateways can scale through cooperatives without continuous connectivity.", gap: "Unit economics at 1,000 farms are not yet shown.", next_action: "Present cost per farm at 10, 100, and 1,000 deployments." },
    presentation: { score: 80, evidence: "The before-and-after water story is visual and easy to demonstrate.", gap: "The pitch risks spending too long on hardware details.", next_action: "Lead with one farmer story, show one automatic decision, and close with measured water savings." },
    demo_flow: ["Show the dry and wet soil sensor readings changing live.", "Display the edge gateway combining soil and weather inputs.", "Trigger a watering recommendation with a plain-language explanation.", "Approve the action and operate the demonstration valve.", "Reveal the pilot dashboard with water saved and the next validation milestone."],
    pitch_outline: ["0:00–0:35 — Open with the cost of overwatering for one small farmer.", "0:35–1:10 — Explain why cloud-first precision agriculture fails in low-connectivity farms.", "1:10–2:35 — Run the sensor-to-explanation-to-valve live demo.", "2:35–3:25 — Show differentiation, pilot evidence, and scalable cooperative economics.", "3:25–4:00 — Close with the 20% water-saving target and the next field trial."],
    likely_judge_questions: ["Why is this better than a timer? The system adapts to soil and weather while explaining every decision.", "What happens without internet? All critical sensing and control run locally; connectivity is only needed for optional synchronization.", "How will you validate impact? Compare water use and crop-health indicators against a control plot for four weeks."],
  },
  roadmap: [
    { phase: "Validate", duration: "Week 1", outcome: "5 farmer interviews and baseline water data" },
    { phase: "Build", duration: "Weeks 2–3", outcome: "Working sensor-to-valve prototype" },
    { phase: "Prove", duration: "Weeks 4–6", outcome: "Field trial with quantified savings" }
  ],
  architecture_blocks: [
    { name: "Field Sensors", description: "Capture soil moisture and local weather conditions" },
    { name: "Edge Gateway", description: "Fuse readings and run offline decision logic" },
    { name: "Smart Control", description: "Operate valves and explain each watering action" }
  ],
  required_hardware: [
    { name: "ESP32 controller", quantity: 3, purpose: "Read sensors and transmit field data" },
    { name: "Capacitive soil sensor", quantity: 3, purpose: "Measure soil moisture without rapid corrosion" },
    { name: "LoRa modules", quantity: 4, purpose: "Long-range, low-power field communication" },
    { name: "12V solenoid valve", quantity: 1, purpose: "Control irrigation flow" },
    { name: "Solar power kit", quantity: 1, purpose: "Power the offline field gateway" }
  ]
};

function App() {
  const reportRef = useRef(null);
  const [idea, setIdea] = useState(() => localStorage.getItem("inventai-draft") || "");
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [demoMode, setDemoMode] = useState(false);
  const [provider, setProvider] = useState("gemini");
  const [compareMode, setCompareMode] = useState(false);
  const [groundedMode, setGroundedMode] = useState(true);
  const [compareResults, setCompareResults] = useState(null);
  const [research, setResearch] = useState(null);
  const [researchLoading, setResearchLoading] = useState(false);
  const [researchError, setResearchError] = useState("");
  const [showResearchPanel, setShowResearchPanel] = useState(false);
  const [savedProjects, setSavedProjects] = useState(() => { try { return JSON.parse(localStorage.getItem("inventai-projects")) || []; } catch { return []; } });
  const wordCount = useMemo(() => idea.trim() ? idea.trim().split(/\s+/).length : 0, [idea]);
  const ideaReadiness = useMemo(() => {
    const text = idea.toLowerCase();
    const checks = [idea.trim().length >= 80, /user|customer|farmer|student|team|business|patient|worker/.test(text), /problem|struggle|waste|cost|slow|difficult|risk/.test(text), /measure|reduce|increase|save|target|%|faster|cheaper/.test(text)];
    return { score: checks.filter(Boolean).length * 25, missing: ["more detail", "target user", "problem", "measurable outcome"].filter((_, i) => !checks[i]) };
  }, [idea]);
  const riskColor = result?.patent_risk?.toLowerCase() === "low" ? "text-emerald-400" : result?.patent_risk?.toLowerCase() === "medium" ? "text-amber-400" : "text-rose-400";

  useEffect(() => { localStorage.setItem("inventai-draft", idea); }, [idea]);

  const loadResearch = async (sourceIdea) => {
    setResearchLoading(true); setResearchError(""); setResearch(null); publishResearch(null);
    try { const evidence = await researchIdea(sourceIdea); setResearch(evidence); publishResearch(evidence); }
    catch (err) { setResearchError(err.message); }
    finally { setResearchLoading(false); }
  };

  const openResearch = () => {
    if (idea.trim().length < 20) { setError("Add at least 20 characters describing the idea before researching prior art."); return; }
    setError(""); setShowResearchPanel(true);
    loadResearch(idea.trim());
    setTimeout(() => document.getElementById("research-evidence")?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const runAnalysis = async (mode = "analysis") => {
    if (idea.trim().length < 20) { setError("Add a little more detail: the problem, target user, and how your idea works."); return; }
    setLoading(true); setError(""); setResult(null); setCompareResults(null); setDemoMode(false);
    try {
      let selected;
      if (compareMode) {
        const [geminiResult, openaiResult] = await Promise.allSettled([analyzeIdea(idea.trim(), "gemini", mode), analyzeIdea(idea.trim(), "openai", mode)]);
        const compared = {
          gemini: geminiResult.status === "fulfilled" ? geminiResult.value : null,
          openai: openaiResult.status === "fulfilled" ? openaiResult.value : null,
          errors: {
            gemini: geminiResult.status === "rejected" ? geminiResult.reason.message : "",
            openai: openaiResult.status === "rejected" ? openaiResult.reason.message : "",
          },
        };
        setCompareResults(compared);
        selected = compared[provider] || compared.gemini || compared.openai;
        if (!selected) throw new Error("Neither AI provider completed the analysis.");
      } else selected = await analyzeIdea(idea.trim(), provider, mode);
      setResult(selected);
      setResearch(null); setResearchError("");
      if (groundedMode) { setShowResearchPanel(true); loadResearch(idea.trim()); }
    }
    catch (err) { setError(`${err.message} You can still use the instant demo below.`); }
    finally { setLoading(false); }
  };

  const runDemo = () => { setIdea(EXAMPLE); setResult(DEMO_RESULT); setCompareResults(null); setResearch(null); setResearchError(""); setDemoMode(true); setError(""); setTimeout(() => document.getElementById("report")?.scrollIntoView({ behavior: "smooth" }), 50); };
  const saveProject = () => {
    if (!result) return;
    const existing = savedProjects.find((p) => p.idea === idea);
    const version = { result, provider: result.provider || provider, createdAt: new Date().toLocaleString() };
    const next = existing ? savedProjects.map((p) => p.id === existing.id ? { ...p, result, versions: [...(p.versions || [{result:p.result,createdAt:p.createdAt}]), version] } : p) : [{ id: Date.now(), idea, result, versions:[version], createdAt: new Date().toLocaleString(), favorite:false }, ...savedProjects].slice(0, 30);
    setSavedProjects(next); localStorage.setItem("inventai-projects", JSON.stringify(next));
  };
  const deleteProject = (id) => { const next = savedProjects.filter((p) => p.id !== id); setSavedProjects(next); localStorage.setItem("inventai-projects", JSON.stringify(next)); };
  const updateProject = (id, changes) => { const next=savedProjects.map((p)=>p.id===id?{...p,...changes}:p); setSavedProjects(next); localStorage.setItem("inventai-projects",JSON.stringify(next)); };
  const downloadReport = async () => {
    if (!reportRef.current) return; setPdfLoading(true);
    try {
      const [{ toPng }, { default: jsPDF }] = await Promise.all([import("html-to-image"), import("jspdf")]);
      await document.fonts?.ready;
      const data = await toPng(reportRef.current, { pixelRatio: 2, backgroundColor: "#07111f", cacheBust: true });
      const img = new Image(); img.src = data; await img.decode();
      const pdf = new jsPDF({ unit: "mm", format: "a4" }); const width = 190; const height = img.height * width / img.width; const page = 277;
      for (let y = 0, first = true; y < height; y += page) { if (!first) pdf.addPage(); pdf.addImage(data, "PNG", 10, 10 - y, width, height); first = false; }
      pdf.save(`${(result.title || "InventAI-report").replace(/[^a-z0-9]+/gi, "-")}.pdf`);
    } catch { setError("PDF generation failed. Try the browser print dialog instead."); } finally { setPdfLoading(false); }
  };

  return <div className="min-h-screen bg-[#050b14] text-slate-100 selection:bg-cyan-400/30">
    <Navbar />
    <main>
      <section className="relative overflow-hidden px-5 pb-20 pt-32">
        <div className="hero-glow" />
        <div className="relative mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-4 py-2 text-xs font-semibold uppercase tracking-[.2em] text-cyan-300"><span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" /> AI innovation intelligence</div>
            <h1 className="text-balance text-5xl font-black leading-[1.02] tracking-tight sm:text-7xl">Turn a raw idea into a <span className="gradient-text">winning plan.</span></h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-400">Describe your idea in plain language. InventAI checks whether it is useful, different, buildable, and competition-ready—then tells you exactly what to do next.</p>
          </div>
          <div className="mx-auto mt-12 max-w-4xl rounded-3xl border border-white/10 bg-slate-900/70 p-3 shadow-2xl shadow-cyan-950/30 backdrop-blur md:p-5">
            <textarea aria-label="Innovation idea" value={idea} onChange={(e) => setIdea(e.target.value)} onKeyDown={(e) => e.ctrlKey && e.key === "Enter" && runAnalysis()} rows={6} placeholder="Describe the problem, who has it, your solution, and what makes it different..." className="w-full resize-none rounded-2xl border border-white/10 bg-[#07111f] p-5 text-base leading-7 outline-none placeholder:text-slate-600 focus:border-cyan-400/50" />
            <div className="mt-3 flex flex-wrap items-center gap-2 px-1"><span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Idea starters</span>{IDEA_STARTERS.map(([label, template]) => <button key={label} type="button" onClick={() => setIdea(template)} className="rounded-full border border-white/8 bg-white/[.025] px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-cyan-200">{label}</button>)}<span className={`ml-auto text-xs font-bold ${ideaReadiness.score >= 75 ? "text-emerald-300" : ideaReadiness.score >= 50 ? "text-amber-300" : "text-slate-500"}`}>Brief readiness {ideaReadiness.score}%</span></div>
            {ideaReadiness.missing.length > 0 && idea.length > 0 && <p className="px-1 pt-2 text-xs text-slate-600">Strengthen it with: {ideaReadiness.missing.join(", ")}.</p>}
            <div className="flex flex-col gap-3 px-1 pt-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs text-slate-500">{wordCount} words · Ctrl + Enter to analyze</span>
              <div className="flex flex-wrap gap-3"><button onClick={runDemo} className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-slate-300 hover:bg-white/5">See an example</button><button onClick={()=>runAnalysis("novelty")} disabled={loading} title="Find ways to make the idea meaningfully different" className="rounded-xl border border-violet-400/30 bg-violet-400/10 px-5 py-3 text-sm font-bold text-violet-200 hover:bg-violet-400/15 disabled:opacity-60">Make it different</button><button onClick={()=>runAnalysis("breakthrough")} disabled={loading} title="Solve the idea's biggest technical trade-off" className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-5 py-3 text-sm font-bold text-amber-200 hover:bg-amber-400/15 disabled:opacity-60">Find a breakthrough</button><button onClick={()=>runAnalysis("analysis")} disabled={loading} className="rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/20 disabled:opacity-60">{loading ? (compareMode ? "Comparing both models…" : "Checking your idea…") : "Check my idea →"}</button></div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-white/6 px-1 pt-4"><span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Analysis engine</span>{["gemini","openai"].map((item)=><button key={item} onClick={()=>setProvider(item)} className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize ${provider===item ? "bg-white text-slate-950" : "bg-white/5 text-slate-400"}`}>{item}</button>)}<label title="Search matching papers and public projects" className="ml-auto flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-400"><input type="checkbox" checked={groundedMode} onChange={(e)=>setGroundedMode(e.target.checked)} className="accent-emerald-400"/> Check external sources</label><label title="Ask both AI engines and compare their scores" className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-400"><input type="checkbox" checked={compareMode} onChange={(e)=>setCompareMode(e.target.checked)} className="accent-cyan-400"/> Get a second opinion</label></div>
          </div>
          <div className="mx-auto mt-5 flex max-w-4xl flex-wrap items-center justify-center gap-3"><button onClick={openResearch} className="rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-5 py-2.5 text-sm font-bold text-emerald-300">⌕ Research prior art</button><span className="text-xs text-slate-600">Search papers and existing public implementations without running a full analysis.</span></div>
          {error && <div role="alert" className="mx-auto mt-5 max-w-4xl rounded-xl border border-rose-400/20 bg-rose-400/5 p-4 text-sm text-rose-200">{error}</div>}
          {!result && <div className="mx-auto mt-12 max-w-4xl">
            <p className="mb-4 text-center text-[11px] font-bold uppercase tracking-[.22em] text-slate-600">Every analysis includes</p>
            <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-4">{[["4", "scored dimensions"], ["3", "recommended phases"], ["1", "experiment to run first"], ["<60s", "typical turnaround"]].map(([n,l]) => <div key={l}><div className="text-2xl font-black text-white">{n}</div><div className="text-xs uppercase tracking-wider text-slate-500">{l}</div></div>)}</div>
            <p className="mt-4 text-center text-xs text-slate-600">These are output counts, not scores for your idea. Your results appear in the decision brief after analysis.</p>
          </div>}
        </div>
      </section>

      {result && <section id="report" className="px-5 pb-24"><div className="mx-auto max-w-6xl"><ModelComparison results={compareResults}/><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold text-cyan-400">YOUR INNOVATION BRIEF</p><p className="text-sm text-slate-500">Generated by {result.provider || (demoMode ? "Demo" : provider)}</p></div><div className="flex flex-wrap gap-2">{demoMode && <span className="rounded-full bg-amber-400/10 px-3 py-2 text-xs font-semibold text-amber-300">DEMO DATA</span>}<button onClick={()=>runAnalysis("novelty")} disabled={loading||demoMode} className="rounded-xl border border-violet-400/20 bg-violet-400/10 px-4 py-2 text-sm font-semibold text-violet-300 disabled:opacity-40">✦ Reinvent for novelty</button><button onClick={()=>runAnalysis("breakthrough")} disabled={loading||demoMode} className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-sm font-semibold text-amber-300 disabled:opacity-40">⚡ Breakthrough Lab</button><button onClick={()=>runAnalysis("improve")} disabled={loading||demoMode} className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-300 disabled:opacity-40">Improve feasibility</button><button onClick={saveProject} className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/5">Save version</button><button onClick={downloadReport} disabled={pdfLoading} className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-950">{pdfLoading ? "Exporting…" : "Export PDF"}</button></div></div>{["novelty","breakthrough"].includes(result.analysis_mode) && result.improved_idea && <div className={`mb-6 rounded-2xl border p-6 ${result.analysis_mode === "breakthrough" ? "border-amber-400/25 bg-gradient-to-r from-amber-400/10 to-rose-400/5" : "border-violet-400/25 bg-gradient-to-r from-violet-400/10 to-cyan-400/5"}`}><p className={`mb-2 text-xs font-black uppercase tracking-[.2em] ${result.analysis_mode === "breakthrough" ? "text-amber-300" : "text-violet-300"}`}>{result.analysis_mode === "breakthrough" ? "Breakthrough Lab · Contradiction resolved" : "Novelty Booster · Reinvented concept"}</p><p className="text-base leading-7 text-slate-200">{result.improved_idea}</p></div>}<div ref={reportRef}><InnovationReport idea={idea} result={result} patentRiskColor={riskColor} /></div></div></section>}
      {showResearchPanel && !result && <section id="research-evidence" className="px-5 pb-24"><div className="mx-auto max-w-6xl"><ResearchEvidence evidence={research} loading={researchLoading} error={researchError} onRetry={()=>loadResearch(idea.trim())} /></div></section>}
      {result && !demoMode && <section id="research-evidence" className="px-5 pb-24"><div className="mx-auto max-w-6xl"><ResearchEvidence evidence={research} loading={researchLoading} error={researchError} onRetry={()=>loadResearch(idea.trim())} /></div></section>}
      {savedProjects.length > 0 && <ProjectDashboard projects={savedProjects} onOpen={(x)=>{setIdea(x.idea);setResult(x.result);setCompareResults(null);setResearch(null);setResearchError("");window.scrollTo({top:0,behavior:"smooth"});}} onDelete={deleteProject} onUpdate={updateProject}/>} 
    </main>
  </div>;
}
export default App;
