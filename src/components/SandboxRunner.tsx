import { useState } from "react";
import { PromptTemplate } from "../types";
import { Play, Loader2, Sparkles, Clock, AlertCircle, Key, Layers, Database, ShieldCheck } from "lucide-react";

interface SandboxRunnerProps {
  template: PromptTemplate;
  renderedPrompt: string;
  userApiKey: string;
  onOpenKeyModal: () => void;
}

export default function SandboxRunner({ template, renderedPrompt, userApiKey, onOpenKeyModal }: SandboxRunnerProps) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRun = async () => {
    setRunning(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/run-sandbox", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-api-key": userApiKey || "",
        },
        body: JSON.stringify({
          prompt: renderedPrompt,
          model: template.model,
          systemInstruction: template.systemInstruction,
          temperature: template.temperature,
          responseFormat: template.responseFormat,
          responseSchema: template.responseSchemaText ? JSON.parse(template.responseSchemaText) : null,
          userApiKey: userApiKey || undefined
        })
      });

      const data = await response.json();
      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || "An error occurred during sandbox execution.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Could not connect to backend orchestration service.");
    } finally {
      setRunning(false);
    }
  };

  const renderResultOutput = () => {
    if (!result) return null;

    if (template.responseFormat === "json") {
      try {
        const parsed = JSON.parse(result.text);
        return (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Successfully parsed JSON match:</span>
            </div>
            <pre className="p-4 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-emerald-300 overflow-x-auto max-h-[300px] leading-relaxed shadow-inner">
              {JSON.stringify(parsed, null, 2)}
            </pre>
          </div>
        );
      } catch (e) {
        return (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-1.5 text-xs text-amber-500 font-semibold">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>Failed to parse strict JSON: (Showing raw text)</span>
            </div>
            <pre className="p-4 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-amber-200 overflow-x-auto max-h-[300px] leading-relaxed shadow-inner">
              {result.text}
            </pre>
          </div>
        );
      }
    }

    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5 text-xs text-sky-400 font-semibold">
          <span>Output Response Body:</span>
        </div>
        <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-slate-200 overflow-x-auto max-h-[300px] whitespace-pre-wrap leading-relaxed shadow-inner">
          {result.text}
        </div>
      </div>
    );
  };

  return (
    <div className="p-5 bg-slate-900/60 rounded-xl border border-slate-800 shadow-lg flex flex-col gap-4">
      {/* Demo Notice Banner */}
      {!userApiKey && (
        <div className="p-3 bg-amber-950/20 border border-amber-500/20 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-200/90">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong className="text-amber-300 font-semibold">Demo Showcase Mode:</strong> No custom API key set. Provide your key to execute live against real Gemini models.
            </span>
          </div>
          <button
            onClick={onOpenKeyModal}
            className="shrink-0 px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold rounded-md border border-amber-500/30 transition-all text-[11px]"
          >
            Enter API Key
          </button>
        </div>
      )}

      {userApiKey && (
        <div className="p-2.5 bg-emerald-950/20 border border-emerald-500/20 rounded-lg flex items-center justify-between gap-2 text-xs text-emerald-300">
          <div className="flex items-center gap-2 font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Using Custom User Gemini Key ({userApiKey.substring(0, 6)}••••••••)</span>
          </div>
          <button
            onClick={onOpenKeyModal}
            className="text-[10px] text-emerald-400 hover:underline font-semibold"
          >
            Manage Key
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-3 sm:gap-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400 shrink-0" />
          <h3 className="text-sm font-semibold text-slate-200">Interactive Prompt Test Sandbox</h3>
        </div>

        <button
          onClick={handleRun}
          disabled={running || !renderedPrompt}
          className={`flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all shadow-lg w-full sm:w-auto ${
            running
              ? "bg-slate-800 text-slate-500 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-500 text-white active:scale-95 hover:shadow-indigo-500/20"
          }`}
        >
          {running ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Orchestrating Model...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 text-indigo-200 fill-indigo-200" />
              <span>Run Django Prompt Sandbox</span>
            </>
          )}
        </button>
      </div>

      {/* Error Output */}
      {error && (
        <div className="flex items-start gap-2.5 p-4 bg-red-950/40 border border-red-900/50 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-red-200">Execution Orchestrator Error</span>
            <p className="text-[11px] text-red-300 leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {/* Loading state visual indicator */}
      {running && (
        <div className="flex flex-col items-center justify-center py-12 bg-slate-950/40 rounded-lg border border-dashed border-slate-800/80">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
          <span className="text-xs font-semibold text-slate-300">Communicating with Sandbox Orchestrator</span>
          <p className="text-[10px] text-slate-500 mt-1 max-w-xs text-center leading-normal">
            Compiling Jinja2 templates, establishing SSL, injecting {template.model} parameters, and parsing strict response schemas...
          </p>
        </div>
      )}

      {/* Results details */}
      {result && !running && (
        <div className="flex flex-col gap-4">
          {/* Metadata chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-lg flex flex-col gap-0.5 shadow-sm">
              <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Model Used</span>
              <span className="text-xs font-mono font-semibold text-slate-200 truncate">{result.modelUsed}</span>
            </div>
            <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-lg flex flex-col gap-0.5 shadow-sm">
              <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Execution Time</span>
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-xs font-mono font-semibold text-slate-200">{result.latencyMs} ms</span>
              </div>
            </div>
            <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-lg flex flex-col gap-0.5 shadow-sm">
              <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Tokens (Est.)</span>
              <div className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-xs font-mono font-semibold text-slate-200">{result.tokensEstimated}</span>
              </div>
            </div>
            <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-lg flex flex-col gap-0.5 shadow-sm">
              <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">API Connection</span>
              <span className={`text-xs font-semibold ${result.keySource === 'user' ? "text-emerald-400" : "text-amber-400"}`}>
                {result.keySource === 'user' ? "User API Key (Live)" : "Simulated Fallback"}
              </span>
            </div>
          </div>

          {/* Transparency disclosure: "claude-*" model selections are actually
              served by Gemini role-playing Claude's style for demo purposes.
              This makes that explicit to the user, not just in a code comment. */}
          {result.isSimulatingClaude && (
            <div className="p-3 bg-amber-950/20 border border-amber-500/20 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-200/90 leading-relaxed">
                Note: this response was generated by <strong>Gemini</strong> instructed to mimic Claude's style —
                it is not a real call to Anthropic's API. This tool doesn't have Claude API access; the
                generated Django code snippets show you how to call the real Claude API yourself.
              </p>
            </div>
          )}

          {/* Actual content output */}
          {renderResultOutput()}
        </div>
      )}

      {/* Initial state placeholder */}
      {!running && !result && !error && (
        <div className="flex flex-col items-center justify-center py-10 bg-slate-950/20 rounded-lg border border-slate-800/50 text-center">
          <Database className="w-8 h-8 text-slate-700 mb-2" />
          <span className="text-xs font-semibold text-slate-400">Sandbox Ready for Execution</span>
          <p className="text-[10px] text-slate-500 mt-1 max-w-sm leading-relaxed">
            Fill in the test parameters in the form above and click <strong className="text-indigo-400">Run Django Prompt Sandbox</strong> to render the template and call the target model model-side.
          </p>
        </div>
      )}
    </div>
  );
}
