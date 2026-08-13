import { useEffect, useState } from "react";

const messageFor = (seconds) => {
  if (seconds < 4) return "Sending your brief securely…";
  if (seconds < 16) return "Reviewing usefulness, originality, and feasibility…";
  if (seconds < 35) return "Building your decision brief and first experiment…";
  return "The analysis service is taking longer than usual. You can cancel safely.";
};

export default function AnalysisProgress({ onCancel }) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return <section className="analysis-progress" aria-busy="true">
    <div className="analysis-progress__top"><span className="analysis-spinner" aria-hidden="true" /><div><strong>Reviewing your idea</strong><p aria-live="polite">{messageFor(seconds)}</p></div><time aria-hidden="true">{seconds}s</time></div>
    <div className="analysis-progress__track"><span /></div>
    <button type="button" onClick={onCancel}>Cancel analysis</button>
  </section>;
}
