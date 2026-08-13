import { useMemo, useState } from "react";

const list = (value) => Array.isArray(value) ? value : [];
const clamp = (value) => Math.max(0, Math.min(100, Math.round(Number(value) || 0)));

export default function MobileDecisionView({ result, onEdit }) {
  const [tab, setTab] = useState("brief");
  const [copied, setCopied] = useState(false);
  const scores = useMemo(() => [
    ["Originality", clamp(result.novelty_score), "How meaningfully different it is"],
    ["Value", clamp(result.market_score), "How strongly people may want it"],
    ["Buildability", clamp(result.feasibility_score), "How realistic the first version is"],
    ["Potential", clamp(result.innovation_score), "How far the idea could travel"],
  ], [result]);
  const total = Math.round(scores.reduce((sum, score) => sum + score[1], 0) / scores.length);
  const pitch = `${result.title}: ${result.one_liner} ${result.differentiator ? `Unlike existing options, ${result.differentiator}` : ""}`.trim();
  const share = async () => {
    const text = `${result.title}\n\n${result.one_liner}\n\nFirst experiment: ${result.next_experiment || result.prototype}`;
    if (navigator.share) return navigator.share({ title: result.title, text }).catch(() => {});
    await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800);
  };

  return <section className="mobile-decision">
    <header className="mobile-appbar">
      <button type="button" onClick={onEdit} aria-label="Edit idea">‹</button>
      <div><strong>Idea review</strong><span>{result.offline ? "On-device · works offline" : "Online analysis"}</span></div>
      <button type="button" onClick={share} aria-label="Share result">↗</button>
    </header>

    <div className="mobile-decision__body">
      {tab === "brief" && <>
        <section className="decision-lead">
          <div className="decision-lead__meta"><span>{result.verdict || "Worth testing"}</span><strong>{total}<small>/100</small></strong></div>
          <h1>{result.title}</h1>
          <p>{result.one_liner}</p>
        </section>
        <p className="mobile-section-label">What matters now</p>
        <section className="insight-row opportunity"><span>01</span><div><small>Strongest signal</small><h2>{list(result.strengths)[0] || result.differentiator}</h2></div></section>
        <section className="insight-row risk"><span>02</span><div><small>Question to answer</small><h2>{list(result.risks)[0] || "Will the intended users care enough to change their current behaviour?"}</h2></div></section>
        <section className="next-move"><small>Your next move</small><h2>{result.next_experiment || result.prototype}</h2><p>Run this before adding more features. A clear result is more valuable than a polished prototype.</p></section>
      </>}

      {tab === "scores" && <>
        <div className="mobile-page-heading"><small>Decision evidence</small><h1>Four signals, plainly explained.</h1><p>These are directional scores—not proof. Use them to decide what to test next.</p></div>
        <div className="human-score-list">{scores.map(([name, value, note]) => <section key={name}><div><strong>{name}</strong><span>{note}</span></div><b>{value}</b><div className="score-track"><i style={{width:`${value}%`}} /></div></section>)}</div>
        <section className="score-note"><strong>How to read this</strong><p>A balanced idea is usually safer than one brilliant score with a serious weakness. Validate the lowest score first.</p></section>
      </>}

      {tab === "plan" && <>
        <div className="mobile-page-heading"><small>Build path</small><h1>From uncertainty to evidence.</h1><p>Each phase should earn the right to begin the next one.</p></div>
        <div className="roadmap-list">{list(result.roadmap).map((step, index) => <section key={`${step.phase}-${index}`}><span>{index + 1}</span><div><small>{step.duration || `Phase ${index + 1}`}</small><h2>{step.phase}</h2><p>{step.outcome}</p></div></section>)}</div>
        {list(result.validation_questions).length > 0 && <details className="question-drawer"><summary>Questions for five users</summary>{list(result.validation_questions).map((q, i) => <p key={q}><span>{i + 1}</span>{q}</p>)}</details>}
      </>}

      {tab === "pitch" && <>
        <div className="mobile-page-heading"><small>Presentation kit</small><h1>Tell a story people remember.</h1><p>Lead with the problem and the proof—not the technology.</p></div>
        <section className="pitch-card"><small>30-second pitch</small><p>{pitch}</p><button type="button" onClick={() => {navigator.clipboard.writeText(pitch); setCopied(true); setTimeout(() => setCopied(false), 1800);}}>{copied ? "Copied" : "Copy pitch"}</button></section>
        <div className="pitch-outline">{[
          ["Problem", result.problem], ["Promise", result.one_liner], ["Advantage", result.differentiator || list(result.strengths)[0]],
          ["Proof", result.next_experiment || result.prototype], ["Ask", "Support the next validation milestone."],
        ].map(([title, body], i) => <section key={title}><span>{String(i + 1).padStart(2,"0")}</span><div><strong>{title}</strong><p>{body}</p></div></section>)}</div>
      </>}
    </div>

    <nav className="mobile-bottom-nav" aria-label="Analysis sections">{[
      ["brief","⌂","Brief"], ["scores","◫","Scores"], ["plan","✓","Plan"], ["pitch","◇","Pitch"],
    ].map(([key, icon, label]) => <button key={key} className={tab === key ? "active" : ""} onClick={() => {setTab(key); window.scrollTo({top:0,behavior:"smooth"});}}><span>{icon}</span>{label}</button>)}</nav>
  </section>;
}
