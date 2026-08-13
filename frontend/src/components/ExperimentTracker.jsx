import { useEffect, useMemo, useState } from "react";

const safeKey = (idea) => `inventai-experiment-${idea.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 80)}`;

function ExperimentTracker({ idea, result, onConfidenceChange }) {
  const metrics = Array.isArray(result.success_metrics) ? result.success_metrics : [];
  const storageKey = useMemo(() => safeKey(idea), [idea]);
  const [record, setRecord] = useState(() => { try { return JSON.parse(localStorage.getItem(storageKey)) || { status: "planned", notes: "", metrics: {} }; } catch { return { status: "planned", notes: "", metrics: {} }; } });
  const passed = metrics.filter((_, i) => record.metrics?.[i] === "passed").length;
  const failed = metrics.filter((_, i) => record.metrics?.[i] === "failed").length;
  const adjusted = Math.max(0, Math.min(100, (result.confidence_score ?? 50) + passed * 8 - failed * 6));

  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(record)); } catch { /* Storage can be unavailable or full. */ }
    onConfidenceChange?.(adjusted);
  }, [record, storageKey, adjusted, onConfidenceChange]);
  const setMetric = (index, value) => setRecord((current) => ({ ...current, metrics: { ...current.metrics, [index]: value }, updatedAt: new Date().toISOString() }));

  return <section className="mt-12 rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-400/[.07] to-cyan-400/[.03] p-6 md:p-8">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="section-kicker text-emerald-300">Experiment tracker</p><h2 className="section-title">Turn the recommendation into evidence</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Record outcomes against predefined thresholds. Changes are saved on this device and adjust confidence transparently.</p></div><div className="rounded-xl border border-white/10 bg-black/15 px-5 py-3 text-center"><div className="text-3xl font-black text-white">{adjusted}%</div><div className="text-[10px] uppercase tracking-wider text-slate-500">adjusted confidence</div><div className="mt-1 text-[10px] text-slate-600">Base {result.confidence_score ?? 50} · +8 pass · −6 fail</div></div></div>
    <div className="mt-6 rounded-2xl border border-cyan-400/15 bg-[#07111f]/70 p-5"><p className="text-[11px] font-black uppercase tracking-wider text-cyan-300">Critical experiment</p><p className="mt-2 text-sm font-semibold leading-6 text-white">{result.next_experiment || result.prototype}</p><select aria-label="Experiment status" value={record.status} onChange={(e) => setRecord((current) => ({ ...current, status: e.target.value, updatedAt: new Date().toISOString() }))} className="mt-4 rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-slate-200"><option value="planned">Planned</option><option value="running">Running</option><option value="completed">Completed</option></select></div>
    <div className="mt-5 grid gap-3">{metrics.map((metric, index) => <div key={metric} className="flex flex-col gap-3 rounded-xl border border-white/8 bg-black/10 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-3 text-sm leading-5 text-slate-300"><span className="font-black text-emerald-400">M{index + 1}</span>{metric}</div><div className="flex shrink-0 gap-2">{["untested", "passed", "failed"].map((status) => <button key={status} type="button" onClick={() => setMetric(index, status)} className={`rounded-lg px-3 py-1.5 text-[10px] font-black uppercase ${((record.metrics?.[index] || "untested") === status) ? status === "passed" ? "bg-emerald-300 text-slate-950" : status === "failed" ? "bg-rose-300 text-slate-950" : "bg-white text-slate-950" : "border border-white/10 text-slate-500"}`}>{status}</button>)}</div></div>)}</div>
    <label className="mt-5 block text-xs font-bold text-slate-400">Evidence notes<textarea value={record.notes} onChange={(e) => setRecord((current) => ({ ...current, notes: e.target.value, updatedAt: new Date().toISOString() }))} rows={4} placeholder="Add interview counts, measurements, links, observations, and reasons for failed thresholds…" className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-[#07111f] p-4 text-sm font-normal leading-6 text-slate-200 outline-none focus:border-emerald-400/40" /></label>
    <div className="mt-4 text-xs text-slate-600">Progress: {passed + failed}/{metrics.length} thresholds tested · {passed} passed · {failed} failed{record.updatedAt ? ` · Updated ${new Date(record.updatedAt).toLocaleString()}` : ""}</div>
  </section>;
}

export default ExperimentTracker;
