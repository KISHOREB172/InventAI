const FACTORS = [
  ["Problem importance", "problem_importance", 20, "Is the pain real and urgent?"],
  ["Novelty", "novelty", 20, "Is it meaningfully different?"],
  ["Technical innovation", "technical_innovation", 20, "Is the technology more than CRUD?"],
  ["Working prototype", "working_prototype", 20, "Can judges see it work live?"],
  ["Impact & scalability", "impact_scalability", 10, "Can it reach thousands or millions?"],
  ["Presentation", "presentation", 10, "Can the story land in 3–5 minutes?"],
];

const tone = (score) => score >= 80 ? "text-emerald-300" : score >= 60 ? "text-amber-300" : "text-rose-300";

function JudgeReadiness({ readiness }) {
  if (!readiness) return null;
  const ranked = FACTORS.map(([label, key]) => ({ label, ...readiness[key] })).filter((item) => Number.isFinite(item.score)).sort((a, b) => a.score - b.score);
  const verdict = readiness.weighted_total >= 80 ? "Competition ready" : readiness.weighted_total >= 65 ? "Strong, but needs proof" : "Needs focused improvement";
  return <section className="mt-12 rounded-3xl border border-amber-400/20 bg-gradient-to-br from-amber-400/[.07] via-transparent to-violet-400/[.05] p-6 md:p-8">
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="section-kicker text-amber-300">Hackathon judge mode</p><h2 className="section-title">Competition readiness scorecard</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Weighted against the criteria judges commonly use. Scores reflect what the current idea can prove—not unsupported ambition.</p></div>
      <div className="shrink-0 rounded-2xl border border-white/10 bg-black/20 px-6 py-4 text-center"><div className={`text-4xl font-black ${tone(readiness.weighted_total)}`}>{readiness.weighted_total}</div><div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">weighted score / 100</div><div className={`mt-1 text-xs font-bold ${tone(readiness.weighted_total)}`}>{verdict}</div></div>
    </div>

    {ranked.length > 0 && <div className="mt-6 rounded-2xl border border-cyan-400/15 bg-cyan-400/[.04] p-5"><p className="text-xs font-black uppercase tracking-wider text-cyan-300">Your best next move</p><p className="mt-2 text-base font-semibold text-white">Improve {ranked[0].label.toLowerCase()}</p><p className="mt-1 text-sm leading-6 text-slate-400">{ranked[0].next_action}</p></div>}

    <div className="mt-7 grid gap-4 md:grid-cols-2">{FACTORS.map(([label, key, weight, question]) => { const factor = readiness[key]; if (!factor) return null; const status = factor.score >= 80 ? "Strong" : factor.score >= 60 ? "Improve" : "Priority"; return <article key={key} className="rounded-2xl border border-white/8 bg-[#07111f]/80 p-5"><div className="flex items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-white">{label}</h3><span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-bold text-slate-500">Worth {weight}%</span><span className={`rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-bold ${tone(factor.score)}`}>{status}</span></div><p className="mt-1 text-xs text-slate-600">{question}</p></div><strong className={`text-2xl ${tone(factor.score)}`}>{factor.score}</strong></div><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-cyan-400" style={{ width: `${factor.score}%` }} /></div><p className="mt-4 rounded-lg bg-cyan-400/[.06] p-3 text-xs leading-5 text-cyan-100"><strong>Do this:</strong> {factor.next_action}</p><details className="mt-3 text-xs leading-5 text-slate-400"><summary className="cursor-pointer font-semibold text-slate-500 hover:text-slate-300">Why this score?</summary><p className="mt-3"><strong className="text-emerald-300">What you have:</strong> {factor.evidence}</p><p className="mt-2"><strong className="text-rose-300">What is missing:</strong> {factor.gap}</p></details></article>; })}</div>

    <div className="mt-7 grid gap-5 lg:grid-cols-2"><div className="rounded-2xl border border-white/8 bg-black/10 p-5"><p className="section-kicker text-cyan-300">Live demo flow</p><h3 className="mt-1 text-lg font-bold">Five reliable demo beats</h3><ol className="mt-4 space-y-3">{(readiness.demo_flow || []).map((step, i) => <li key={step} className="flex gap-3 text-sm leading-6 text-slate-300"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-cyan-400/10 text-xs font-black text-cyan-300">{i + 1}</span>{step}</li>)}</ol></div><div className="rounded-2xl border border-white/8 bg-black/10 p-5"><p className="section-kicker text-violet-300">3–5 minute pitch</p><h3 className="mt-1 text-lg font-bold">Presentation outline</h3><ol className="mt-4 space-y-3">{(readiness.pitch_outline || []).map((step, i) => <li key={step} className="flex gap-3 text-sm leading-6 text-slate-300"><span className="font-black text-violet-300">0{i + 1}</span>{step}</li>)}</ol></div></div>

    {(readiness.likely_judge_questions || []).length > 0 && <div className="mt-5 rounded-2xl border border-white/8 bg-black/10 p-5"><p className="section-kicker text-emerald-300">Pressure test</p><h3 className="mt-1 text-lg font-bold">Questions judges may ask</h3><div className="mt-4 grid gap-3 md:grid-cols-3">{readiness.likely_judge_questions.map((item) => <div key={item} className="rounded-xl border border-white/6 bg-white/[.025] p-4 text-sm leading-6 text-slate-300">{item}</div>)}</div></div>}
  </section>;
}

export default JudgeReadiness;
