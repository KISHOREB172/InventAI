import { useState } from "react";
import HackathonStudio from "./HackathonStudio";

const items = (value) => Array.isArray(value) ? value : [];

export default function MobileDecisionView({ idea, result, projects, onEdit }) {
  const [tab, setTab] = useState("decision");
  const score = Math.round((result.innovation_score + result.novelty_score + result.feasibility_score + (result.market_score || 0)) / 4);
  return <section className="mobile-decision">
    <button className="mobile-decision__back" type="button" onClick={onEdit}>← Edit idea</button>
    <div className="mobile-decision__hero"><p>Decision brief</p><h2>{result.title}</h2><span>{result.verdict || "VALIDATE"}</span><strong>{score}<small>/100</small></strong><p>{result.one_liner}</p></div>
    <nav className="mobile-decision__tabs" aria-label="Result sections">{[["decision","Decision"],["plan","Plan"],["tools","Tools"]].map(([key,label]) => <button key={key} onClick={() => setTab(key)} className={tab === key ? "active" : ""}>{label}</button>)}</nav>
    {tab === "decision" && <div className="mobile-decision__content"><section><span>Biggest opportunity</span><h3>{items(result.strengths)[0] || result.differentiator}</h3></section><section><span>Biggest risk</span><h3>{items(result.risks)[0] || "Validate the core assumption before building."}</h3></section><section className="accent"><span>Run this first</span><h3>{result.next_experiment || result.prototype}</h3></section><details><summary>View four scores</summary><div className="mobile-score-grid">{[["Innovation",result.innovation_score],["Novelty",result.novelty_score],["Feasibility",result.feasibility_score],["Market",result.market_score]].map(([label,value]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div></details></div>}
    {tab === "plan" && <div className="mobile-decision__content">{(result.roadmap || []).map((step,index) => <section key={step.phase}><span>Step {index + 1} · {step.duration}</span><h3>{step.phase}</h3><p>{step.outcome}</p></section>)}<details><summary>Customer questions</summary>{items(result.validation_questions).map((question) => <p key={question} className="mobile-list-item">{question}</p>)}</details></div>}
    {tab === "tools" && <HackathonStudio idea={idea} result={result} projects={projects} />}
  </section>;
}
