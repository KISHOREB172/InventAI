import { useState } from "react";
import { CapabilityMatrix, EvidenceScoreGrid } from "./EvidenceDecisionLayer";
import ExperimentTracker from "./ExperimentTracker";
import InnovationRadar from "./InnovationRadar";
import JudgeReadiness from "./JudgeReadiness";
import SystemArchitecture from "./SystemArchitecture";

const list = (value) => Array.isArray(value) ? value : [];
const score = (value) => Math.max(0, Math.min(100, Math.round(Number(value) || 0)));

function TextList({ items, tone = "neutral", empty = "No items were returned." }) {
  const values = list(items);
  if (!values.length) return <p className="report-empty">{empty}</p>;
  return <div className={`report-text-list tone-${tone}`}>{values.map((item, index) => <p key={`${item}-${index}`}><span>{String(index + 1).padStart(2, "0")}</span>{item}</p>)}</div>;
}

function Disclosure({ number, title, summary, children, open = false }) {
  return <details className="report-disclosure" open={open}>
    <summary><span>{number}</span><div><strong>{title}</strong><small>{summary}</small></div><b aria-hidden="true">+</b></summary>
    <div className="report-disclosure__body">{children}</div>
  </details>;
}

function InnovationReport({ idea, result, patentRiskColor, research }) {
  const [adjustedConfidence, setAdjustedConfidence] = useState(result.confidence_score ?? 50);
  const scores = [
    ["Innovation", score(result.innovation_score), "innovation"],
    ["Novelty", score(result.novelty_score), "novelty"],
    ["Feasibility", score(result.feasibility_score), "feasibility"],
    ["Market", score(result.market_score ?? result.innovation_score), "market"],
  ];

  return <article className="decision-report">
    <header className="decision-report__header">
      <div className="decision-report__meta"><span>InventAI decision brief</span><span className="decision-verdict">{result.verdict || "VALIDATE"}</span></div>
      <div className="decision-report__title">
        <div><h1>{result.title}</h1><p>{result.one_liner || result.market_potential}</p></div>
        <div className="confidence-block"><strong>{adjustedConfidence}%</strong><span>working confidence</span></div>
      </div>
      <blockquote>{idea}</blockquote>
      <div className="executive-grid">
        <section><small>Recommendation</small><strong>{result.verdict === "PROMISING" ? "Worth testing" : result.verdict === "PIVOT" ? "Change direction first" : "Validate before building"}</strong><p>This is a direction, not a guarantee.</p></section>
        <section><small>Biggest concern</small><strong>{list(result.risks)[0] || "More real-world evidence is needed."}</strong></section>
        <section className="executive-grid__next"><small>First experiment</small><strong>{result.next_experiment || result.prototype}</strong></section>
      </div>
    </header>

    <div className="decision-report__content">
      <section className="report-score-section" aria-labelledby="score-section-title">
        <div className="report-section-heading"><div><p className="section-kicker">Decision signals</p><h2 id="score-section-title">A balanced view of the opportunity</h2></div><p>Directional estimates · validate the weakest signal first</p></div>
        <div className="report-score-grid">{scores.map(([name, value, key]) => <section key={name}>
          <div><span>{name}</span><strong>{value}</strong></div>
          <div className="report-score-track" role="progressbar" aria-label={name} aria-valuemin="0" aria-valuemax="100" aria-valuenow={value}><i style={{ width: `${value}%` }} /></div>
          <p>{result.score_explanations?.[key] || "Directional estimate based on the submitted brief."}</p>
        </section>)}</div>
      </section>

      <section className="report-focus-grid" aria-label="Strategic focus">
        <div><span>01</span><small>User and problem</small><strong>{result.users}</strong><p>{result.problem}</p></div>
        <div><span>02</span><small>Defensible edge</small><strong>{result.differentiator || result.technology}</strong><p>{result.business_model || result.market_potential}</p></div>
        <div><span>03</span><small>Pilot boundary</small><strong>{result.estimated_cost}</strong><p>{result.prototype}</p></div>
      </section>

      <div className="report-disclosures">
        <Disclosure number="01" title="Validation and evidence" summary="Signals, risks, assumptions, questions, and measurable proof">
          <div className="report-two-column">
            <section><p className="section-kicker">Signals</p><h3>What is working</h3><TextList items={result.strengths} tone="positive" /></section>
            <section><p className="section-kicker">Watchlist</p><h3>What could break</h3><TextList items={result.risks} tone="warning" /></section>
          </div>
          <div className="report-three-column">
            <section><h3>Critical assumptions</h3><TextList items={result.critical_assumptions} /></section>
            <section><h3>Ask five users</h3><TextList items={result.validation_questions} /></section>
            <section><h3>Proof thresholds</h3><TextList items={result.success_metrics} tone="positive" /></section>
          </div>
          <EvidenceScoreGrid result={result} research={research} adjustedConfidence={adjustedConfidence} />
          <ExperimentTracker idea={idea} result={result} onConfidenceChange={setAdjustedConfidence} />
        </Disclosure>

        <Disclosure number="02" title="Build and improve" summary="Three phases, concrete actions, technical shape, and an achievable prototype">
          <div className="report-roadmap">{list(result.roadmap).map((step, index) => <section key={`${step.phase}-${index}`}><span>{String(index + 1).padStart(2, "0")}</span><small>{step.duration}</small><h3>{step.phase}</h3><p>{step.outcome}</p>{step.estimated_cost && <strong>{step.estimated_cost}</strong>}</section>)}</div>
          <div className="report-two-column">
            <section><p className="section-kicker">Recommended actions</p><h3>Earn the next decision</h3><TextList items={result.recommended_actions} /></section>
            <section><p className="section-kicker">Idea upgrades</p><h3>Make the concept stronger</h3><TextList items={result.improvement_suggestions} tone="positive" /></section>
          </div>
          <SystemArchitecture blocks={result.architecture_blocks || []} hardware={result.required_hardware || []} />
        </Disclosure>

        <Disclosure number="03" title="Positioning and presentation" summary="Alternatives, market gaps, opportunity shape, judge readiness, and pitch support">
          <div className="report-two-column report-positioning">
            <section><p className="section-kicker">Likely alternatives</p><h3>Know what users compare you with</h3>{list(result.competitors).length ? list(result.competitors).map((item) => <article key={item.name}><strong>{item.name}</strong><p>{item.approach}</p><small>Open gap: {item.gap}</small></article>) : <p className="report-empty">No alternatives were returned.</p>}</section>
            <section><p className="section-kicker">Market gaps</p><h3>Places to create an advantage</h3><TextList items={result.market_gaps} tone="positive" /><p className="report-patent-note"><strong className={patentRiskColor}>{result.patent_risk} patent risk estimate.</strong> No patent database was searched.</p></section>
          </div>
          <InnovationRadar innovationScore={result.innovation_score} noveltyScore={result.novelty_score} feasibilityScore={result.feasibility_score} marketScore={result.market_score} />
          <JudgeReadiness readiness={result.judge_readiness} />
          <CapabilityMatrix idea={idea} result={result} research={research} />
        </Disclosure>
      </div>

      <footer className="decision-report__footer"><strong>Decision support, not certainty.</strong> Validate claims, sources, technical feasibility, privacy requirements, and market assumptions before committing significant time or money.</footer>
    </div>
  </article>;
}

export default InnovationReport;
