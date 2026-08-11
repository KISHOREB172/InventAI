const metrics = [
  ["Innovation", "innovation_score"], ["Novelty", "novelty_score"],
  ["Feasibility", "feasibility_score"], ["Market", "market_score"],
];

function ModelComparison({ results }) {
  if (!results) return null;
  const entries = [["Gemini", results.gemini], ["OpenAI", results.openai]].filter(([, data]) => data);
  if (!entries.length) return null;
  const complete = entries.length === 2;
  return <section className="mb-8 rounded-3xl border border-white/10 bg-[#07111f] p-6 md:p-8">
    <p className="section-kicker">Model consensus</p><h2 className="section-title">Gemini vs OpenAI</h2>
    {!complete && <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-200">One provider was unavailable, so the successful analysis is shown. {Object.entries(results.errors || {}).filter(([, message]) => message).map(([name, message]) => `${name}: ${message}`).join(" ")}</div>}
    <div className="mt-6 overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead><tr className="border-b border-white/10 text-slate-500"><th className="pb-3">Metric</th>{entries.map(([name]) => <th key={name} className="pb-3">{name}</th>)}{complete && <th className="pb-3">Difference</th>}</tr></thead><tbody>{metrics.map(([label, key]) => <tr key={key} className="border-b border-white/6"><td className="py-4 font-semibold">{label}</td>{entries.map(([name, data], index) => <td key={name} className={`py-4 ${index ? "text-violet-300" : "text-cyan-300"}`}>{data[key]}%</td>)}{complete && <td className="py-4 text-slate-400">{Math.abs(results.gemini[key]-results.openai[key])} points</td>}</tr>)}</tbody></table></div>
    <div className="mt-6 grid gap-4 md:grid-cols-2">{entries.map(([name, data]) => <div key={name} className="rounded-2xl border border-white/8 bg-white/[.025] p-5"><div className="flex items-center justify-between"><h3 className="font-bold">{name} recommendation</h3><span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">{data.verdict}</span></div><p className="mt-3 text-sm leading-6 text-slate-400">{data.next_experiment}</p></div>)}</div>
  </section>;
}
export default ModelComparison;
