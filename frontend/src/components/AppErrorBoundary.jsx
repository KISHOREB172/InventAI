import { Component } from "react";

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    if (import.meta.env.DEV) console.error("InventAI render failure", error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return <main className="fatal-error" role="alert">
      <div>
        <span>I</span>
        <p className="section-kicker">InventAI</p>
        <h1>This screen could not be displayed.</h1>
        <p>Your saved ideas are still on this device. Reload the app to recover the workspace.</p>
        <button type="button" onClick={() => window.location.reload()}>Reload app</button>
      </div>
    </main>;
  }
}
