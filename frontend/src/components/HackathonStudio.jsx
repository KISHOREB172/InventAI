import { useMemo, useState } from "react";

const clamp = (value) => Math.max(0, Math.min(100, Math.round(value || 0)));
const average = (result) => clamp((result.innovation_score + result.novelty_score + result.feasibility_score + (result.market_score || 0)) / 4);

export default function HackathonStudio({ idea, result, projects = [] }) {
  const [criteria, setCriteria] = useState("Innovation 30%, Technical execution 30%, Impact 20%, Presentation 20%");
  const [opponentId, setOpponentId] = useState("");
  const opponent = projects.find((project) => String(project.id) === opponentId);
  const judgeScore = useMemo(() => {
    const base = result.judge_readiness?.weighted_total || average(result);
    const text = criteria.toLowerCase();
    let score = base;
    if (text.includes("innovation")) score += (result.innovation_score - base) * 0.2;
    if (text.includes("technical")) score += ((result.judge_readiness?.technical_innovation?.score || result.feasibility_score) - base) * 0.2;
    if (text.includes("impact")) score += ((result.judge_readiness?.impact_scalability?.score || result.market_score) - base) * 0.15;
    if (text.includes("presentation")) score += ((result.judge_readiness?.presentation?.score || base) - base) * 0.15;
    return clamp(score);
  }, [criteria, result]);
  const slides = [
    ["1. The problem", result.problem], ["2. The solution", result.one_liner || result.technology],
    ["3. Why it wins", result.differentiator || result.strengths?.[0]],
    ["4. How it works", (result.architecture_blocks || []).map((block) => block.name).join(" → ") || result.technology],
    ["5. Proof & next step", result.next_experiment || result.prototype],
  ];
  const downloadPitch = () => {
    const content = [`# ${result.title}`, ``, `Idea: ${idea}`, ``, ...slides.flatMap(([title, body]) => [`## ${title}`, body || "Add supporting evidence.", ``])].join("\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/markdown" }));
    const link = document.createElement("a"); link.href = url; link.download = `${(result.title || "InventAI-pitch").replace(/[^a-z0-9]+/gi, "-")}-pitch.md`; link.click(); URL.revokeObjectURL(url);
  };
  return <section className="mt-8 rounded-3xl border border-violet-400/20 bg-[#07111f] p-6 md:p-8">
    <p className="section-kicker text-violet-300">Hackathon studio</p><h2 className="section-title">Turn the decision brief into a submission</h2>
    <div className="mt-6 grid gap-5 lg:grid-cols-3">
      <article className="rounded-2xl border border-white/8 bg-white/[.025] p-5"><h3 className="font-bold text-white">Custom Judge Mode</h3><p className="mt-2 text-xs leading-5 text-slate-500">Paste the event’s criteria. The score adapts to the priorities it detects.</p><textarea aria-label="Hackathon judging criteria" value={criteria} onChange={(event) => setCriteria(event.target.value)} rows={4} className="mt-4 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-slate-300 outline-none"/><div className="mt-4 flex items-end justify-between"><span className="text-xs uppercase tracking-wider text-slate-500">Criteria fit</span><strong className="text-4xl text-violet-300">{judgeScore}</strong></div></article>
      <article className="rounded-2xl border border-white/8 bg-white/[.025] p-5"><h3 className="font-bold text-white">Idea Comparison</h3><p className="mt-2 text-xs leading-5 text-slate-500">Save another analysis, then compare it with this idea.</p><select aria-label="Idea to compare" value={opponentId} onChange={(event) => setOpponentId(event.target.value)} className="mt-4 w-full rounded-xl border border-white/10 bg-[#0b1626] p-3 text-sm text-slate-300"><option value="">Choose a saved idea</option>{projects.filter((project) => project.result && project.idea !== idea).map((project) => <option key={project.id} value={project.id}>{project.result.title || project.idea.slice(0, 45)}</option>)}</select><div className="mt-5 grid grid-cols-2 gap-3 text-center"><div className="rounded-xl bg-cyan-400/5 p-3"><strong className="text-2xl text-cyan-300">{average(result)}</strong><p className="mt-1 text-[10px] uppercase text-slate-500">Current</p></div><div className="rounded-xl bg-amber-400/5 p-3"><strong className="text-2xl text-amber-300">{opponent ? average(opponent.result) : "—"}</strong><p className="mt-1 text-[10px] uppercase text-slate-500">Saved</p></div></div>{opponent && <p className="mt-4 text-sm font-semibold text-slate-300">Recommendation: {average(result) >= average(opponent.result) ? result.title : opponent.result.title}</p>}</article>
      <article className="rounded-2xl border border-white/8 bg-white/[.025] p-5"><div className="flex items-center justify-between gap-3"><h3 className="font-bold text-white">Five-slide Pitch Deck</h3><button onClick={downloadPitch} className="rounded-lg bg-white px-3 py-2 text-xs font-black text-slate-950">Download</button></div><div className="mt-4 space-y-3">{slides.map(([title, body]) => <div key={title} className="rounded-xl border border-white/6 bg-black/10 p-3"><p className="text-xs font-black text-emerald-300">{title}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">{body || "Add supporting evidence."}</p></div>)}</div></article>
    </div>
  </section>;
}
