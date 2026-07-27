import React, { useEffect, useState } from "react";
import { PromptTemplate, TemplateVariable } from "../types";
import { Sliders, HelpCircle, FileText, Settings, Sparkles, BrainCircuit, ChevronDown, ChevronUp, Zap } from "lucide-react";

interface PromptEditorProps {
  template: PromptTemplate;
  onTemplateChange: (updated: PromptTemplate) => void;
  renderedPrompt: string;
}

export default function PromptEditor({ template, onTemplateChange, renderedPrompt }: PromptEditorProps) {
  const [detectedVars, setDetectedVars] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Detect variables dynamically using Jinja2/Django style syntax {{ var_name }}
  useEffect(() => {
    const regex = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
    const matches = new Set<string>();
    let match;
    while ((match = regex.exec(template.templateText)) !== null) {
      matches.add(match[1]);
    }
    
    const matchedVars = Array.from(matches);
    setDetectedVars(matchedVars);

    // Sync variables state
    let updatedVars = [...template.variables];
    let dirty = false;

    // Add newly found variables
    matchedVars.forEach(vName => {
      if (!updatedVars.some(uv => uv.name === vName)) {
        updatedVars.push({
          name: vName,
          defaultValue: "",
          description: `Custom template variable: ${vName}`,
          value: ""
        });
        dirty = true;
      }
    });

    const filteredVars = updatedVars.filter(uv => matchedVars.includes(uv.name));
    if (filteredVars.length !== updatedVars.length) {
      updatedVars = filteredVars;
      dirty = true;
    }

    if (dirty) {
      onTemplateChange({
        ...template,
        variables: updatedVars
      });
    }
  }, [template.templateText]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onTemplateChange({
      ...template,
      templateText: e.target.value
    });
  };

  const handleSystemInstructionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onTemplateChange({
      ...template,
      systemInstruction: e.target.value
    });
  };

  const handleVariableValChange = (name: string, newVal: string) => {
    const updatedVars = template.variables.map(v => {
      if (v.name === name) {
        return { ...v, value: newVal };
      }
      return v;
    });
    onTemplateChange({
      ...template,
      variables: updatedVars
    });
  };

  const handleConfigChange = (key: keyof PromptTemplate, val: any) => {
    onTemplateChange({
      ...template,
      [key]: val
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Novice/Expert Toggle Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900/60 p-3 rounded-xl border border-slate-800 shadow-sm gap-3 sm:gap-0">
        <div className="flex items-start sm:items-center gap-2">
          <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400 shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-200">Editor Complexity</span>
            <span className="text-[10px] text-slate-400">
              {showAdvanced ? "Expert mode: full orchestration controls visible." : "Novice mode: focusing only on the prompt design."}
            </span>
          </div>
        </div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all shrink-0 w-full sm:w-auto ${
            showAdvanced
              ? "bg-indigo-600/20 border-indigo-500/40 text-indigo-300"
              : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
          }`}
        >
          {showAdvanced ? "Disable Advanced Mode" : "Enable Advanced Mode"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Prompt / System Instruction Editor (Left 7/8 Cols depending on layout) */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          {/* System Instruction Panel - Hidden in Novice Mode */}
          {showAdvanced && (
            <div className="flex flex-col gap-2 p-4 bg-slate-900/60 rounded-xl border border-slate-800 shadow-lg animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <label className="text-xs font-semibold text-slate-200">System Instruction / AI Role</label>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Influences bot behavior / constraints</span>
              </div>
              <textarea
                value={template.systemInstruction}
                onChange={handleSystemInstructionChange}
                rows={2}
                className="w-full bg-slate-950 text-slate-100 border border-slate-800 focus:border-indigo-500 rounded-lg p-2.5 text-xs font-mono placeholder-slate-600 focus:outline-none transition-colors leading-relaxed"
                placeholder="e.g. You are a helpful assistant. Output clean raw JSON arrays without any markdown wrapping."
              />
            </div>
          )}

          {/* Prompt Template Panel */}
          <div className="flex flex-col gap-2 p-5 bg-slate-900/60 rounded-xl border border-slate-800 shadow-lg flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4.5 h-4.5 text-indigo-400" />
                <h3 className="text-xs font-semibold text-slate-200">Orchestrator Prompt Template (Django Syntax)</h3>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-[9px] font-mono text-slate-400">Jinja2 syntax enabled</span>
              </div>
            </div>
            <div className="p-3 bg-indigo-950/20 border border-indigo-500/20 rounded-lg text-[11px] text-indigo-200/90 leading-relaxed">
              <strong>Tip for beginners:</strong> Write your prompt normally as if you are talking to the AI. When you want to inject dynamic content (like a user's name), wrap a variable name in double curly brackets, e.g. <code className="font-mono bg-indigo-950/50 px-1 py-0.5 rounded border border-indigo-500/30 text-indigo-300">{"{{ product_description }}"}</code>. The form on the right will automatically update to let you test it!
            </div>
            <div className="relative flex-1 min-h-[220px] mt-1">
              <textarea
                value={template.templateText}
                onChange={handleTextChange}
                className="w-full h-full min-h-[220px] bg-slate-950 text-slate-100 border border-slate-800 focus:border-indigo-500 rounded-lg p-4 font-mono text-xs leading-relaxed placeholder-slate-600 focus:outline-none transition-colors"
                placeholder="Enter your Django template text. E.g.\nExtract categories from this product content:\n{{ product_content }}"
              />
            </div>
          </div>

          {/* Live Prompt Preview / Rendered Result */}
          <div className="flex flex-col gap-2 p-4 bg-slate-950 rounded-xl border border-slate-800 shadow-inner">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-sky-400" />
                <span className="font-semibold text-slate-300">Live Rendered Prompt Output Preview</span>
              </div>
              <span className="text-[9px] font-mono">Dynamic replaces variables in real-time</span>
            </div>
            <div className="p-3.5 bg-slate-950/80 rounded-lg border border-slate-800/60 max-h-[160px] overflow-y-auto font-mono text-[11px] text-slate-300 leading-relaxed scrollbar-thin">
              {renderedPrompt ? (
                renderedPrompt.split("\n").map((line, idx) => (
                  <div key={idx} className="min-h-[1rem]">
                    {line}
                  </div>
                ))
              ) : (
                <span className="text-slate-600 italic">No prompt text provided yet...</span>
              )}
            </div>
          </div>
        </div>

        {/* Variables & LLM Settings Panel (Right 4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          
          {/* Dynamic Parameter Value Inputs (Always Visible) */}
          <div className="flex flex-col gap-4 p-4 bg-slate-900/60 rounded-xl border border-slate-800 shadow-lg flex-1">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-semibold text-slate-200">Sandbox Test Parameter Inputs</h4>
            </div>

            <div className="flex flex-col gap-3.5 overflow-y-auto max-h-[400px] pr-1 scrollbar-thin">
              {template.variables.length > 0 ? (
                template.variables.map((variable) => (
                  <div key={variable.name} className="flex flex-col gap-1 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-mono text-sky-400 font-semibold bg-sky-950/40 px-1.5 py-0.5 rounded border border-sky-900/40">
                        {`{{ ${variable.name} }}`}
                      </label>
                      <span className="text-[10px] text-slate-500 italic">string</span>
                    </div>
                    <textarea
                      rows={3}
                      value={variable.value}
                      onChange={(e) => handleVariableValChange(variable.name, e.target.value)}
                      className="w-full bg-slate-950 text-slate-200 border border-slate-800 focus:border-indigo-500 rounded-lg p-2 text-xs placeholder-slate-600 focus:outline-none transition-all leading-normal"
                      placeholder={`Enter test value for variable: ${variable.name}`}
                    />
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center p-6 bg-slate-950/50 rounded-lg border border-dashed border-slate-800/80 text-center">
                  <HelpCircle className="w-6 h-6 text-slate-600 mb-2" />
                  <span className="text-xs font-semibold text-slate-400">No parameters detected yet</span>
                  <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                    Type <code className="font-mono text-indigo-400">{"{{ your_variable }}"}</code> in the prompt to automatically generate an input field here.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Model Execution Configurations - Hidden in Novice Mode */}
          {showAdvanced && (
            <div className="flex flex-col gap-4 p-4 bg-slate-900/60 rounded-xl border border-slate-800 shadow-lg animate-fadeIn">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <Settings className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-semibold text-slate-200">LLM Hub Orchestration Configuration</h4>
              </div>

              {/* Model selection */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Target Model</label>
                <select
                  value={template.model}
                  onChange={(e) => handleConfigChange("model", e.target.value)}
                  className="bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg p-2 text-xs text-slate-200 focus:outline-none cursor-pointer"
                >
                  <optgroup label="Google Gemini">
                    <option value="gemini-3.5-flash">Gemini 3.5 Flash (Default / High Speed)</option>
                    <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Advanced Logic)</option>
                  </optgroup>
                  <optgroup label="Anthropic Claude (Simulated on Sandbox)">
                    <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                    <option value="claude-3-5-haiku">Claude 3.5 Haiku</option>
                  </optgroup>
                </select>
              </div>

              {/* Temperature slider */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  <span>Temperature</span>
                  <span className="font-mono text-indigo-400">{template.temperature}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.2"
                  step="0.1"
                  value={template.temperature}
                  onChange={(e) => handleConfigChange("temperature", parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer h-1 bg-slate-800 rounded-lg appearance-none"
                />
                <div className="flex items-center justify-between text-[9px] text-slate-500">
                  <span>Precise / Deterministic (0.0)</span>
                  <span>Creative / Varied (1.2)</span>
                </div>
              </div>

              {/* Response Type toggle */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Enforced Response Format</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleConfigChange("responseFormat", "text")}
                    className={`py-1 rounded text-xs font-medium transition-all ${
                      template.responseFormat === "text" ? "bg-indigo-600/80 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Plain Text
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConfigChange("responseFormat", "json")}
                    className={`py-1 rounded text-xs font-medium transition-all ${
                      template.responseFormat === "json" ? "bg-indigo-600/80 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Strict JSON
                  </button>
                </div>
              </div>

              {/* Django Hook Type selector */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Django Hook Pattern</label>
                <select
                  value={template.djangoIntegration}
                  onChange={(e) => handleConfigChange("djangoIntegration", e.target.value)}
                  className="bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg p-2 text-xs text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="view_json">API View (Sync JSON classification)</option>
                  <option value="signal_tagger">post_save Signal (Model Auto-Tagger)</option>
                  <option value="celery_async">Celery Task (Async lead enrichment)</option>
                  <option value="rag_router">Intelligent Search Router (RAG)</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
