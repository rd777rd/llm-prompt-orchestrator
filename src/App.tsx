import { useEffect, useState } from "react";
import { PromptTemplate, DjangoIntegrationType } from "./types";
import { DEFAULT_TEMPLATES } from "./templates";
import PromptEditor from "./components/PromptEditor";
import SandboxRunner from "./components/SandboxRunner";
import CodeExporter from "./components/CodeExporter";
import ArchitectureVisualizer from "./components/ArchitectureVisualizer";
import ApiKeyModal from "./components/ApiKeyModal";
import { Sparkles, Terminal, Cpu, Database, Plus, Check, Settings, Code, Zap, BookOpen, Key, Globe, ShieldCheck } from "lucide-react";

export default function App() {
  const [templates, setTemplates] = useState<PromptTemplate[]>(DEFAULT_TEMPLATES);
  const [activeTemplateId, setActiveTemplateId] = useState<string>("django-view-json");
  const [activeTab, setActiveTab] = useState<'studio' | 'integration'>('studio');
  const [serverKeyStatus, setServerKeyStatus] = useState<{ hasServerKey: boolean; loaded: boolean }>({
    hasServerKey: false,
    loaded: false
  });

  // User-provided API Key state. Security note (see audit): defaults to
  // sessionStorage, which is cleared when the tab closes -- a smaller XSS
  // exposure window than localStorage. Visitors can explicitly opt in to
  // longer-lived storage via the "Remember on this device" checkbox in
  // ApiKeyModal, which is when we fall back to localStorage.
  const [userApiKey, setUserApiKey] = useState<string>(() => {
    return sessionStorage.getItem("gemini_demo_key") || localStorage.getItem("gemini_demo_key_persisted") || "";
  });
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  // Load API key status from express backend
  useEffect(() => {
    fetch("/api/status")
      .then(res => res.json())
      .then(data => {
        setServerKeyStatus({
          hasServerKey: data.hasServerKey,
          loaded: true
        });
      })
      .catch(() => {
        setServerKeyStatus({
          hasServerKey: false,
          loaded: true
        });
      });
  }, []);

  const handleSaveUserKey = (key: string, remember: boolean) => {
    setUserApiKey(key);
    // Always clear both stores first so switching the "remember" choice
    // doesn't leave a stale copy of the key behind in the other one.
    sessionStorage.removeItem("gemini_demo_key");
    localStorage.removeItem("gemini_demo_key_persisted");
    if (key) {
      if (remember) {
        localStorage.setItem("gemini_demo_key_persisted", key);
      } else {
        sessionStorage.setItem("gemini_demo_key", key);
      }
    }
  };

  const handleClearUserKey = () => {
    setUserApiKey("");
    sessionStorage.removeItem("gemini_demo_key");
    localStorage.removeItem("gemini_demo_key_persisted");
  };

  const activeTemplate = templates.find(t => t.id === activeTemplateId) || templates[0];

  const handleTemplateChange = (updated: PromptTemplate) => {
    setTemplates(prev => prev.map(t => (t.id === updated.id ? updated : t)));
  };

  const handleCreateCustom = () => {
    const customId = `custom-${Date.now()}`;
    const newCustom: PromptTemplate = {
      id: customId,
      name: "Custom Django Orchestration Pattern",
      description: "A custom user-defined prompt template with dynamic Jinja2/Django variables.",
      systemInstruction: "You are a precise JSON assistant.",
      templateText: "Write a short summary about {{ subject }} highlighting {{ feature }}.",
      variables: [
        { name: "subject", defaultValue: "Django Web Framework", description: "", value: "Django Web Framework" },
        { name: "feature", defaultValue: "Model-View-Template architecture", description: "", value: "Model-View-Template architecture" }
      ],
      model: "gemini-3.5-flash",
      temperature: 0.7,
      responseFormat: "text",
      responseSchemaText: "",
      djangoIntegration: "view_json"
    };

    setTemplates(prev => [...prev, newCustom]);
    setActiveTemplateId(customId);
  };

  // Compile prompt by dynamically replacing variables {{ var_name }} with active values
  const renderPrompt = (tpl: PromptTemplate): string => {
    let result = tpl.templateText;
    tpl.variables.forEach(v => {
      const regex = new RegExp(`\\{\\{\\s*${v.name}\\s*\\}\\}`, "g");
      result = result.replace(regex, v.value || `[${v.name}]`);
    });
    return result;
  };

  const activeRenderedPrompt = renderPrompt(activeTemplate);

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Dynamic Background Accents */}
      <div className="absolute top-0 left-0 right-0 h-[420px] bg-gradient-to-b from-indigo-950/20 via-blue-950/5 to-transparent pointer-events-none" />
      <div className="absolute top-[-100px] left-1/3 w-[300px] h-[300px] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[200px] right-10 w-[200px] h-[200px] rounded-full bg-emerald-600/5 blur-[80px] pointer-events-none" />

      {/* Primary Container */}
      <div className="max-w-7xl mx-auto px-4 py-6 relative z-10 flex flex-col min-h-screen gap-6">
        
        {/* Top Header Row */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="bg-indigo-600/15 border border-indigo-500/20 p-1.5 rounded-lg text-indigo-400">
                <Terminal className="w-5 h-5" />
              </span>
              <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-100 font-display">
                Python & Django LLM Orchestration Hub
              </h1>
              <span className="bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                <Globe className="w-3 h-3 text-indigo-400" />
                SHOWCASE DEMO
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-400 leading-relaxed max-w-2xl">
              Design and test dynamic AI prompts visually, run live sandbox executions with your own API key, and optionally export clean production Python/Django code for your applications.
            </p>
          </div>

          {/* Environment & User API Key Status Bar */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800/60 shadow-lg">
            <button
              onClick={() => setIsKeyModalOpen(true)}
              className={`flex items-center gap-2 px-3 py-1.5 text-[11px] font-mono font-medium rounded-lg border transition-all active:scale-95 shadow-sm ${
                userApiKey
                  ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/40"
                  : "bg-indigo-600/20 border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/30"
              }`}
            >
              <Key className="w-3.5 h-3.5 text-indigo-400" />
              <span>
                {userApiKey
                  ? `API Key: ${userApiKey.substring(0, 5)}••••`
                  : "Set Custom Gemini API Key"}
              </span>
              {userApiKey && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>

            <div className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-mono rounded-lg bg-slate-950 border border-slate-800 text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <span>Backend Ready</span>
            </div>
          </div>
        </header>

        {/* Template Catalog Row */}
        <section className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-400 shrink-0" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Orchestration Patterns</h2>
            </div>
            <button
              onClick={handleCreateCustom}
              className="flex items-center justify-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium bg-indigo-600/10 hover:bg-indigo-600/15 border border-indigo-500/20 px-3 py-1.5 rounded-lg transition-all active:scale-95 shadow w-full sm:w-auto shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Custom Pattern</span>
            </button>
          </div>

          {/* Quick Loading Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {templates.map((tpl) => {
              const isActive = tpl.id === activeTemplateId;
              return (
                <button
                  key={tpl.id}
                  onClick={() => setActiveTemplateId(tpl.id)}
                  className={`flex flex-col text-left p-3.5 rounded-xl border transition-all relative ${
                    isActive
                      ? "bg-indigo-950/20 border-indigo-500/40 shadow-md shadow-indigo-950/10"
                      : "bg-slate-900/30 border-slate-800/80 hover:bg-slate-900/50 hover:border-slate-700/60"
                  }`}
                >
                  {isActive && (
                    <span className="absolute top-2.5 right-2.5 bg-indigo-500/15 text-indigo-400 p-0.5 rounded-full">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  )}
                  <span className={`text-[10px] font-mono uppercase tracking-wider font-semibold ${isActive ? "text-indigo-400" : "text-slate-500"}`}>
                    {tpl.djangoIntegration === "view_json" && "Django View Hook"}
                    {tpl.djangoIntegration === "signal_tagger" && "post_save Signal"}
                    {tpl.djangoIntegration === "celery_async" && "Celery Task"}
                    {tpl.djangoIntegration === "rag_router" && "RAG router"}
                  </span>
                  <span className="text-xs font-semibold text-slate-200 mt-1 truncate max-w-[85%]">{tpl.name}</span>
                  <span className="text-[10px] text-slate-400 leading-normal mt-1.5 line-clamp-2">{tpl.description}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Primary Functional Tabs */}
        <div className="flex flex-col gap-5 flex-1 mt-2">
          
          {/* Navigation Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-0.5 gap-2 md:gap-0">
            <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap scrollbar-none pb-1 md:pb-0">
              <button
                onClick={() => setActiveTab('studio')}
                className={`px-4 py-2.5 text-xs font-semibold tracking-wider transition-all border-b-2 relative shrink-0 ${
                  activeTab === 'studio'
                    ? "border-indigo-500 text-slate-100"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                1. DESIGN STUDIO & SANDBOX
              </button>
              <button
                onClick={() => setActiveTab('integration')}
                className={`px-4 py-2.5 text-xs font-semibold tracking-wider transition-all border-b-2 relative shrink-0 ${
                  activeTab === 'integration'
                    ? "border-indigo-500 text-slate-100"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                2. DJANGO INTEGRATION & SNIPPETS
              </button>
            </div>
            
            <div className="flex items-center gap-1.5 bg-slate-900/60 rounded-lg border border-slate-800/60 text-[10px] font-mono text-slate-400 px-3 py-1.5 w-fit">
              <Zap className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="truncate">Current Django Context: Python 3.11+</span>
            </div>
          </div>

          {/* Tab 1: Design Studio & Live Sandbox */}
          {activeTab === 'studio' && (
            <div className="flex flex-col gap-6 flex-1">
              {/* Prompt Editor & variables */}
              <PromptEditor
                template={activeTemplate}
                onTemplateChange={handleTemplateChange}
                renderedPrompt={activeRenderedPrompt}
              />
              
              {/* Interactive Runner */}
              <SandboxRunner
                template={activeTemplate}
                renderedPrompt={activeRenderedPrompt}
                userApiKey={userApiKey}
                onOpenKeyModal={() => setIsKeyModalOpen(true)}
              />
            </div>
          )}

          {/* Tab 2: Django Hooks Code Exporter */}
          {activeTab === 'integration' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
              
              {/* Visual pipeline / instructions */}
              <div className="lg:col-span-5 flex flex-col gap-5">
                <ArchitectureVisualizer
                  integrationType={activeTemplate.djangoIntegration}
                />
                
                {/* Integration Details Info Card */}
                <div className="p-5 bg-slate-900/40 rounded-xl border border-slate-800 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">Django Setup Best Practices</h4>
                  </div>
                  <ul className="flex flex-col gap-2.5 text-[11px] text-slate-400 leading-relaxed list-disc list-inside pl-1">
                    <li>
                      <strong className="text-slate-300 font-medium">Keep secrets separate:</strong> Store your API keys in a local <code className="font-mono bg-slate-950 px-1 py-0.5 rounded border border-slate-800">.env</code> file or use Django's <code className="font-mono bg-slate-950 px-1 py-0.5 rounded border border-slate-800">settings.py</code> environment parameters. Never hardcode keys in python modules.
                    </li>
                    <li>
                      <strong className="text-slate-300 font-medium">Use lazy clients:</strong> Cache your <code className="font-mono bg-slate-950 px-1 py-0.5 rounded border border-slate-800">genai.Client()</code> or <code className="font-mono bg-slate-950 px-1 py-0.5 rounded border border-slate-800">Anthropic()</code> inside a service class to optimize connection warm starts across requests.
                    </li>
                    <li>
                      <strong className="text-slate-300 font-medium">Async fallback:</strong> If calling an external LLM on critical page loads, dispatch to Celery background workers to avoid long connection blocking and keep views responsive.
                    </li>
                    <li>
                      <strong className="text-slate-300 font-medium">JSON validation:</strong> Models can occasionally yield slight syntax faults. Wrap your <code className="font-mono bg-slate-950 px-1 py-0.5 rounded border border-slate-800">json.loads()</code> inside try/except structures with elegant fallback structures.
                    </li>
                  </ul>
                </div>
              </div>

              {/* Copyable Code Panel */}
              <div className="lg:col-span-7">
                <CodeExporter
                  template={activeTemplate}
                />
              </div>
            </div>
          )}

        </div>

        {/* Humble, minimalistic, crafted footer */}
        <footer className="border-t border-slate-900 pt-6 pb-4 mt-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-600 font-mono">
          <span>Python & Django LLM Orchestration Hub • Website Showcase Demo</span>
          <button
            onClick={() => setIsKeyModalOpen(true)}
            className="text-indigo-400 hover:underline flex items-center gap-1"
          >
            <Key className="w-3 h-3" />
            <span>{userApiKey ? "Manage Gemini API Key" : "Configure API Key"}</span>
          </button>
        </footer>

      </div>

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        apiKey={userApiKey}
        onSaveKey={handleSaveUserKey}
        onClearKey={handleClearUserKey}
      />
    </div>
  );
}
