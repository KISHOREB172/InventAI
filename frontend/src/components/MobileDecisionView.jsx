import { useEffect, useMemo, useState } from "react";

const list = (value) => Array.isArray(value) ? value : [];
const clamp = (value) => Math.max(0, Math.min(100, Math.round(Number(value) || 0)));

const safeKey = (result) => `inventai-mobile-proof-${`${result.title}-${result.next_experiment || ""}`
  .toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 90)}`;

export default function MobileDecisionView({
  result, demoMode, onEdit, onNewIdea, onSave, onAnalyze, loading, compareResults, onResearch,
  research, researchLoading, researchError,
}) {
  const [tab, setTab] = useState("brief");
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const proofKey = useMemo(() => safeKey(result), [result]);
  const [proof, setProof] = useState(() => {
    try { return JSON.parse(localStorage.getItem(proofKey)) || {}; } catch { return {}; }
  });
  const scores = useMemo(() => [
    ["Originality", clamp(result.novelty_score), "How meaningfully different it is"],
    ["Value", clamp(result.market_score), "How strongly people may want it"],
    ["Buildability", clamp(result.feasibility_score), "How realistic the first version is"],
    ["Potential", clamp(result.innovation_score), "How far the idea could travel"],
  ], [result]);
  const total = Math.round(scores.reduce((sum, score) => sum + score[1], 0) / scores.length);
  const pitch = `${result.title}: ${result.one_liner} ${result.differentiator ? `Unlike existing options, ${result.differentiator}` : ""}`.trim();
  const judgeFactors = result.judge_readiness ? [
    ["Problem", result.judge_readiness.problem_importance],
    ["Novelty", result.judge_readiness.novelty],
    ["Technical", result.judge_readiness.technical_innovation],
    ["Prototype", result.judge_readiness.working_prototype],
    ["Impact", result.judge_readiness.impact_scalability],
    ["Presentation", result.judge_readiness.presentation],
  ] : [];
  const opinions = compareResults ? [
    ["Gemini", compareResults.gemini],
    ["OpenAI", compareResults.openai],
  ].filter(([, value]) => value) : [];

  useEffect(() => {
    try { localStorage.setItem(proofKey, JSON.stringify(proof)); } catch { /* Device storage can be unavailable. */ }
  }, [proof, proofKey]);

  const share = async () => {
    const text = `${result.title}\n\n${result.one_liner}\n\nFirst experiment: ${result.next_experiment || result.prototype}`;
    if (navigator.share) {
      try { await navigator.share({ title: result.title, text }); } catch { /* User dismissed the share sheet. */ }
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch { /* Sharing is unavailable on this device. */ }
  };

  const copyPitch = async () => {
    try {
      await navigator.clipboard.writeText(pitch);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch { /* Clipboard is unavailable. */ }
  };

  const save = () => {
    if (onSave()) setSaved(true);
  };

  return <section className="mobile-decision">
    <header className="mobile-appbar">
      <button type="button" className="mobile-appbar__back" onClick={onEdit}>Edit</button>
      <div>
        <strong>Idea review</strong>
        <span>{demoMode ? "Example review" : `${result.provider || "AI"} analysis`}</span>
      </div>
      <button type="button" className="mobile-appbar__share" onClick={share}>{copied ? "Copied" : "Share"}</button>
    </header>

    <div className="mobile-decision__body">
      {tab === "brief" && <>
        <section className="decision-lead">
          <div className="decision-lead__meta"><span>{result.verdict || "Worth testing"}</span><strong>{total}<small>/100</small></strong></div>
          <h1>{result.title}</h1>
          <p>{result.one_liner}</p>
        </section>
        <div className="mobile-quick-actions" aria-label="Result actions">
          <button type="button" onClick={save}>{saved ? "Saved" : "Save idea"}</button>
          <button type="button" onClick={() => { setTab("toolkit"); if (!research && !researchLoading) onResearch(); }}>Find evidence</button>
        </div>
        <p className="mobile-section-label">What matters now</p>
        <section className="insight-row opportunity"><span>01</span><div><small>Strongest signal</small><h2>{list(result.strengths)[0] || result.differentiator}</h2></div></section>
        <section className="insight-row risk"><span>02</span><div><small>Question to answer</small><h2>{list(result.risks)[0] || "Will the intended users care enough to change their current behaviour?"}</h2></div></section>
        <section className="next-move"><small>Your next move</small><h2>{result.next_experiment || result.prototype}</h2><p>Run this before adding more features. A clear result is more valuable than a polished prototype.</p></section>
      </>}

      {tab === "scores" && <>
        <div className="mobile-page-heading"><small>Decision evidence</small><h1>Four signals, plainly explained.</h1><p>These are directional scores, not proof. Use them to decide what to test next.</p></div>
        <div className="human-score-list">{scores.map(([name, value, note]) => <section key={name}>
          <div><strong>{name}</strong><span>{note}</span></div><b>{value}</b>
          <div className="score-track" role="progressbar" aria-label={name} aria-valuemin="0" aria-valuemax="100" aria-valuenow={value}><i style={{ width: `${value}%` }} /></div>
        </section>)}</div>
        {opinions.length > 1 && <section className="mobile-opinions"><small>Second opinion</small><h2>How the engines compared</h2>{opinions.map(([name, opinion]) => {
          const average = Math.round((clamp(opinion.innovation_score) + clamp(opinion.novelty_score) + clamp(opinion.feasibility_score) + clamp(opinion.market_score)) / 4);
          return <div key={name}><span>{name}</span><strong>{average}/100</strong><p>{list(opinion.risks)[0]}</p></div>;
        })}</section>}
        <section className="score-note"><strong>How to read this</strong><p>A balanced idea is usually safer than one brilliant score with a serious weakness. Validate the lowest score first.</p></section>
      </>}

      {tab === "plan" && <>
        <div className="mobile-page-heading"><small>Build path</small><h1>From uncertainty to evidence.</h1><p>Each phase should earn the right to begin the next one.</p></div>
        <div className="roadmap-list">{list(result.roadmap).map((step, index) => <section key={`${step.phase}-${index}`}><span>{index + 1}</span><div><small>{step.duration || `Phase ${index + 1}`}</small><h2>{step.phase}</h2><p>{step.outcome}</p></div></section>)}</div>
        {list(result.validation_questions).length > 0 && <details className="question-drawer"><summary>Questions for five users</summary>{list(result.validation_questions).map((question, index) => <p key={question}><span>{index + 1}</span>{question}</p>)}</details>}
        <section className="proof-checklist">
          <small>Proof checklist</small>
          <h2>Define success before the test.</h2>
          {list(result.success_metrics).map((metric, index) => <label key={metric}>
            <input type="checkbox" checked={Boolean(proof[index])} onChange={(event) => setProof((current) => ({ ...current, [index]: event.target.checked }))} />
            <span>{metric}</span>
          </label>)}
        </section>
      </>}

      {tab === "toolkit" && <>
        <div className="mobile-page-heading"><small>Evidence and pitch</small><h1>Check the landscape. Tell the story.</h1><p>Public sources support the next decision; they do not replace user testing.</p></div>
        <section className="mobile-evidence-card">
          <div><small>Prior work</small><h2>Papers and public implementations</h2></div>
          {!research && !researchLoading && !researchError && <button type="button" onClick={onResearch}>Search sources</button>}
          {researchLoading && <p className="evidence-loading" role="status">Searching Crossref and GitHub...</p>}
          {researchError && <div className="evidence-error"><p>{researchError}</p><button type="button" onClick={onResearch}>Retry</button></div>}
          {research && <div className="mobile-source-list">
            {[...list(research.papers).map((item) => ({ title: item.title, url: item.url, kind: "Paper", meta: item.year || item.venue })), ...list(research.existing_projects).map((item) => ({ title: item.name, url: item.url, kind: "Project", meta: `${item.stars ?? 0} stars${item.language ? ` · ${item.language}` : ""}` }))].slice(0, 8).map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer"><span><small>{source.kind}</small><strong>{source.title}</strong><em>{source.meta}</em></span><b aria-hidden="true">Open</b></a>)}
            {!research.papers?.length && !research.existing_projects?.length && <p>No strong matches were found. Add the core technology or industry to your brief and search again.</p>}
          </div>}
        </section>
        <section className="pitch-card"><small>30-second pitch</small><p>{pitch}</p><button type="button" onClick={copyPitch}>{copied ? "Copied" : "Copy pitch"}</button></section>
        {judgeFactors.length > 0 && <details className="mobile-judge-card">
          <summary><span><small>Hackathon readiness</small><strong>{result.judge_readiness.weighted_total}/100</strong></span><b>View criteria</b></summary>
          <div>{judgeFactors.map(([name, factor]) => <section key={name}><span><strong>{name}</strong><small>{factor?.gap}</small></span><b>{factor?.score ?? "--"}</b></section>)}</div>
        </details>}
        <section className="mobile-refine-card">
          <small>Focused second pass</small><h2>Strengthen the idea without starting over.</h2>
          <div>
            <button type="button" onClick={() => onAnalyze("novelty")} disabled={loading || demoMode}>Improve originality</button>
            <button type="button" onClick={() => onAnalyze("breakthrough")} disabled={loading || demoMode}>Resolve a trade-off</button>
            <button type="button" onClick={() => onAnalyze("improve")} disabled={loading || demoMode}>Improve feasibility</button>
          </div>
          {demoMode && <p>Focused passes are available after a live analysis.</p>}
        </section>
        <div className="pitch-outline">{[
          ["Problem", result.problem],
          ["Promise", result.one_liner],
          ["Advantage", result.differentiator || list(result.strengths)[0]],
          ["Proof", result.next_experiment || result.prototype],
          ["Ask", "Support the next validation milestone."],
        ].map(([title, body], index) => <section key={title}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{title}</strong><p>{body}</p></div></section>)}</div>
        <button type="button" className="start-over-button" onClick={onNewIdea}>Start a completely new idea</button>
      </>}
    </div>

    <nav className="mobile-bottom-nav" aria-label="Analysis sections">{[
      ["brief", "01", "Brief"],
      ["scores", "02", "Scores"],
      ["plan", "03", "Plan"],
      ["toolkit", "04", "Toolkit"],
    ].map(([key, number, label]) => <button
      type="button"
      key={key}
      aria-current={tab === key ? "page" : undefined}
      className={tab === key ? "active" : ""}
      onClick={() => { setTab(key); window.scrollTo({ top: 0, behavior: "smooth" }); }}
    ><span>{number}</span>{label}</button>)}</nav>
  </section>;
}
