import React, { useState } from "react";
import { Key, Eye, EyeOff, Check, AlertCircle, ExternalLink, ShieldCheck, Loader2, X, Trash2 } from "lucide-react";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveKey: (key: string, remember: boolean) => void;
  onClearKey: () => void;
}

export default function ApiKeyModal({ isOpen, onClose, apiKey, onSaveKey, onClearKey }: ApiKeyModalProps) {
  const [inputKey, setInputKey] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [remember, setRemember] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleTestKey = async () => {
    if (!inputKey.trim()) {
      setTestResult({ success: false, message: "Please enter an API key first." });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/validate-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: inputKey.trim() }),
      });
      const data = await res.json();
      if (data.valid) {
        setTestResult({ success: true, message: data.message || "API key verified successfully!" });
      } else {
        setTestResult({ success: false, message: data.message || "Invalid API key." });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || "Network error while testing key." });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    onSaveKey(inputKey.trim(), remember);
    onClose();
  };

  const handleClear = () => {
    setInputKey("");
    setRemember(false);
    onClearKey();
    setTestResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col gap-5 p-6 text-slate-100">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Key className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-semibold text-slate-100 font-display">Configure Gemini API Key</h3>
              <p className="text-xs text-slate-400">Showcase Demo Mode • Provide your own key for live executions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security Notice */}
        <div className="p-3.5 bg-indigo-950/20 border border-indigo-500/20 rounded-xl flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <p className="text-xs text-indigo-200/90 leading-relaxed">
            By default your key is kept only in this browser tab's <code className="font-mono bg-indigo-950/60 px-1 py-0.5 rounded border border-indigo-500/30 text-indigo-300">sessionStorage</code> and
            is cleared automatically when you close the tab. Check "Remember on this device" below if you'd rather it persist across visits (stored in <code className="font-mono bg-indigo-950/60 px-1 py-0.5 rounded border border-indigo-500/30 text-indigo-300">localStorage</code> instead) &mdash;
            note that's a longer-lived exposure if this device or browser is ever compromised.
          </p>
        </div>

        {/* Key Input Field */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Gemini API Key
            </label>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium hover:underline"
            >
              <span>Get free key at Google AI Studio</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="relative flex items-center">
            <input
              type={showKey ? "text" : "password"}
              value={inputKey}
              onChange={(e) => {
                setInputKey(e.target.value);
                setTestResult(null);
              }}
              placeholder="AIzaSy..."
              className="w-full bg-slate-950 text-slate-100 border border-slate-800 focus:border-indigo-500 rounded-xl py-2.5 pl-3.5 pr-20 font-mono text-xs focus:outline-none transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 text-slate-500 hover:text-slate-300 transition-colors p-1"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <label className="flex items-center gap-2 mt-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-950 accent-indigo-600"
            />
            <span className="text-xs text-slate-400">Remember on this device (persists after closing the tab)</span>
          </label>
        </div>

        {/* Test Result Message */}
        {testResult && (
          <div
            className={`p-3 rounded-xl border flex items-center gap-2 text-xs ${
              testResult.success
                ? "bg-emerald-950/30 border-emerald-900/50 text-emerald-300"
                : "bg-red-950/30 border-red-900/50 text-red-300"
            }`}
          >
            {testResult.success ? (
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{testResult.message}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4 mt-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestKey}
              disabled={testing || !inputKey.trim()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>Test API Key</span>
            </button>

            {apiKey && (
              <button
                type="button"
                onClick={handleClear}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-950/30 transition-colors"
                title="Clear saved key from browser"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg hover:shadow-indigo-500/20 transition-all active:scale-95"
            >
              Save Key & Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
