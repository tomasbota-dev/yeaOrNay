import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) {
      const pt = localStorage.getItem("yn_locale") === "pt-PT";
      return (
        <main className="page">
          <h1>{pt ? "Vamos tentar de novo." : "Let’s try that again."}</h1>
          <p>
            {pt
              ? "Não foi possível apresentar esta página."
              : "This page could not be displayed."}
          </p>
          <button className="button" onClick={() => location.reload()}>
            {pt ? "Recarregar a página" : "Reload the page"}
          </button>
        </main>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
