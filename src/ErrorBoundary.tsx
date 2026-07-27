import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message?: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled error in Django LLM Orchestrator UI:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-6">
          <div className="max-w-md text-center space-y-4">
            <h1 className="text-lg font-semibold">Something went wrong</h1>
            <p className="text-sm text-slate-400">
              A component crashed unexpectedly. Try reloading the page. If this keeps happening,
              please report it.
            </p>
            {this.state.message && (
              <pre className="text-xs text-left bg-slate-900 border border-slate-800 rounded-lg p-3 overflow-x-auto text-rose-300">
                {this.state.message}
              </pre>
            )}
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold transition-colors"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
