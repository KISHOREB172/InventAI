const STARTERS = [
  ["Product", "A product for a specific user who struggles with a frequent problem. It works by a clear mechanism, improves on the current alternative, and succeeds if a measurable outcome changes."],
  ["Climate", "A climate solution for a specific community that reduces wasted resources through a practical mechanism, with a measurable pilot target."],
  ["Workflow", "A workflow tool for a specific role that replaces a painful task, keeps people in control, and saves measurable time or cost."],
];

export default function IdeaWorkbench({
  idea, onIdeaChange, readiness, loading, error, onAnalyze, onRetry, onDemo, onResearch,
  provider, onProviderChange, compareMode, onCompareChange, groundedMode, onGroundedChange,
}) {
  const wordCount = idea.trim() ? idea.trim().split(/\s+/).length : 0;
  return <section className="home-hero">
    <div className="hero-glow" />
    <div className="hero-layout">
      <div className="hero-copy">
        <p className="eyebrow"><span /> Independent idea review</p>
        <h1>Know what to test <em>before you build.</em></h1>
        <p className="hero-summary">Turn an early concept into a clear decision, an honest risk assessment, and one experiment your team can run next.</p>
        <div className="trust-list" aria-label="What InventAI provides"><span>4 decision signals</span><span>3 build phases</span><span>1 critical experiment</span></div>
      </div>

      <div className="composer-panel">
        <div className="composer-heading"><div><p className="field-kicker">Your idea</p><h2>What are you considering?</h2></div><span className={`readiness-pill readiness-${readiness.tone}`}>{readiness.score}% ready</span></div>
        <label className="sr-only" htmlFor="idea-input">Describe your innovation idea</label>
        <textarea id="idea-input" value={idea} onChange={(event) => onIdeaChange(event.target.value)} rows={7} maxLength={5000} placeholder="Describe the user, their problem, your solution, and the outcome you want to improve." disabled={loading} />
        <div className="composer-meta"><span>{wordCount} words</span><span>{idea.length}/5000</span></div>

        {!idea && <div className="starter-row"><span>Start with</span>{STARTERS.map(([label, value]) => <button type="button" key={label} onClick={() => onIdeaChange(value)}>{label}</button>)}</div>}
        {idea && readiness.missing.length > 0 && <p className="readiness-help">For a stronger review, add: {readiness.missing.join(", ")}.</p>}

        <button type="button" className="primary-action" onClick={() => onAnalyze("analysis")} disabled={loading || idea.trim().length < 20}>{loading ? "Reviewing idea…" : "Review my idea"}<span aria-hidden="true">→</span></button>
        <div className="secondary-actions"><button type="button" onClick={onDemo} disabled={loading}>View a complete example</button><button type="button" onClick={onResearch} disabled={loading || idea.trim().length < 20}>Research prior work</button></div>

        <details className="advanced-options">
          <summary>Analysis options</summary>
          <div className="advanced-options__body">
            <fieldset><legend>Analysis engine</legend><div className="segmented-control">{["gemini", "openai"].map((item) => <button type="button" key={item} className={provider === item ? "active" : ""} onClick={() => onProviderChange(item)}>{item === "gemini" ? "Gemini" : "OpenAI"}</button>)}</div></fieldset>
            <label className="switch-row"><span><strong>Second opinion</strong><small>Compare both available models</small></span><input type="checkbox" checked={compareMode} onChange={(event) => onCompareChange(event.target.checked)} /></label>
            <label className="switch-row"><span><strong>External evidence</strong><small>Search public papers and projects after analysis</small></span><input type="checkbox" checked={groundedMode} onChange={(event) => onGroundedChange(event.target.checked)} /></label>
          </div>
        </details>

        {error && <div className="error-state" role="alert"><div><strong>We could not complete the review</strong><p>{error}</p></div><button type="button" onClick={onRetry}>Retry</button></div>}
      </div>
    </div>
  </section>;
}
