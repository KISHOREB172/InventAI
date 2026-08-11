const clamp = (value) => Math.max(0, Math.min(100, value));
const words = (value = "") => new Set(value.toLowerCase().match(/[a-z0-9-]{3,}/g) || []);

const sourceFor = (key, research) => {
  if (!research) return null;
  const papers = research.papers || [];
  const projects = research.existing_projects || [];
  if (key === "novelty") return projects[0] || papers[0] || null;
  if (key === "feasibility") return projects[0] || null;
  if (key === "market") return [...papers].sort((a, b) => (b.citations || 0) - (a.citations || 0))[0] || null;
  return papers[0] || projects[0] || null;
};

export function EvidenceScoreGrid({ result, research, adjustedConfidence }) {
  const scores = [
    ["Innovation", result.innovation_score, "innovation", "from-cyan-300 to-cyan-500"],
    ["Novelty", result.novelty_score, "novelty", "from-violet-300 to-violet-500"],
    ["Feasibility", result.feasibility_score, "feasibility", "from-blue-300 to-blue-500"],
    ["Market", result.market_score ?? result.innovation_score, "market", "from-emerald-300 to-emerald-500"],
  ];
  return <section className="mt-12">
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="section-kicker">Traceable decision dashboard</p><h2 className="section-title">Scores with evidence attached</h2></div><div className="text-right"><div className="text-2xl font-black text-white">{adjustedConfidence ?? result.confidence_score ?? 50}%</div><div className="text-[10px] uppercase tracking-wider text-slate-600">evidence-adjusted confidence</div></div></div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{scores.map(([name, score, key, color]) => {
      const source = sourceFor(key, research);
      return <div key={name} className="score-card"><div className="flex items-end justify-between"><span className="text-sm text-slate-400">{name}</span><strong className="text-3xl text-white">{clamp(score)}</strong></div><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-800"><div className={`h-full rounded-full bg-gradient-to-r ${color}`} style={{ width: `${clamp(score)}%` }} /></div><p className="mt-3 text-xs leading-5 text-slate-500">{result.score_explanations?.[key] || "Directional estimate based on the submitted idea."}</p>{source ? <a href={source.url} target="_blank" rel="noreferrer" className="mt-3 block rounded-lg border border-emerald-400/15 bg-emerald-400/[.04] p-2 text-[10px] leading-4 text-emerald-200"><span className="font-black uppercase">Evidence link</span><br />{source.title || source.name}<br /><span className="text-emerald-400/60">Matched: {(source.matched_terms || []).join(", ") || `${source.relevance_score}% relevance`}</span></a> : <div className="mt-3 rounded-lg border border-amber-400/10 bg-amber-400/[.03] p-2 text-[10px] leading-4 text-amber-200/70">AI rationale only · run external research to attach a source.</div>}</div>;
    })}</div>
    <p className="mt-3 text-[11px] leading-5 text-slate-600">Linked sources support or challenge the rationale; they do not mathematically prove a score.</p>
  </section>;
}

export function CapabilityMatrix({ idea, result, research }) {
  if (!research?.existing_projects?.length) return null;
  const projects = research.existing_projects.slice(0, 3);
  const candidates = [...new Set([...(research.query || "").split(/\s+/), ...projects.flatMap((p) => p.matched_terms || [])])]
    .filter((term) => term && term.length > 2).slice(0, 6);
  const ideaWords = words([idea, result.technology, result.differentiator, ...(result.architecture_blocks || []).flatMap((x) => [x.name, x.description])].join(" "));
  return <section className="mt-12 rounded-2xl border border-violet-400/15 bg-violet-400/[.025] p-6 md:p-8">
    <p className="section-kicker text-violet-300">Novelty comparison</p><h2 className="section-title">Where the idea overlaps—and where it differs</h2>
    <div className="mt-6 overflow-x-auto"><table className="w-full min-w-[680px] border-collapse text-left text-xs"><thead><tr className="border-b border-white/10 text-slate-500"><th className="p-3">Capability signal</th><th className="p-3 text-cyan-300">Your idea</th>{projects.map((p) => <th key={p.url} className="max-w-44 p-3"><span className="line-clamp-2">{p.name}</span></th>)}</tr></thead><tbody>{candidates.map((term) => <tr key={term} className="border-b border-white/6"><td className="p-3 font-semibold capitalize text-slate-300">{term.replaceAll("-", " ")}</td><td className="p-3"><span className={ideaWords.has(term.toLowerCase()) ? "text-emerald-300" : "text-slate-700"}>{ideaWords.has(term.toLowerCase()) ? "✓ present" : "— unclear"}</span></td>{projects.map((p) => { const present = (p.matched_terms || []).includes(term); return <td key={p.url} className="p-3"><span className={present ? "text-violet-300" : "text-slate-700"}>{present ? "✓ matched" : "—"}</span></td>; })}</tr>)}</tbody></table></div>
    <p className="mt-4 text-[11px] leading-5 text-slate-600">This matrix compares retrieved metadata terms, not full source code. Open each project before making a novelty claim.</p>
  </section>;
}
