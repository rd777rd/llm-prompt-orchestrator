import { DjangoIntegrationType } from "../types";
import { ArrowRight, Server, Database, Brain, Cpu, MessageSquare } from "lucide-react";

interface VisualizerProps {
  integrationType: DjangoIntegrationType;
}

const getThemeClasses = (theme: string) => {
  switch (theme) {
    case 'sky': return { wrapper: 'border-sky-900/50', iconBg: 'bg-sky-500/10 text-sky-400 border-sky-500/20' };
    case 'blue': return { wrapper: 'border-blue-900/50', iconBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
    case 'emerald': return { wrapper: 'border-emerald-900/50', iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
    case 'indigo': return { wrapper: 'border-indigo-900/50', iconBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' };
    case 'purple': return { wrapper: 'border-purple-900/50', iconBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20' };
    case 'amber': return { wrapper: 'border-amber-900/50', iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
    case 'rose': return { wrapper: 'border-rose-900/50', iconBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
    case 'teal': return { wrapper: 'border-teal-900/50', iconBg: 'bg-teal-500/10 text-teal-400 border-teal-500/20' };
    default: return { wrapper: 'border-slate-800', iconBg: 'bg-slate-800 text-slate-300 border-slate-700' };
  }
};

const PipelineNode = ({ icon: Icon, title, sub, theme }: any) => {
  const { wrapper, iconBg } = getThemeClasses(theme);
  return (
    <div className={`flex flex-row lg:flex-col items-center gap-4 lg:gap-3 p-4 rounded-xl border ${wrapper} bg-slate-900/50 backdrop-blur-sm z-10 shrink-0 w-full lg:w-44 transition-colors shadow-sm`}>
      <div className={`p-2.5 rounded-lg border shadow-inner ${iconBg}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex flex-col lg:items-center text-left lg:text-center min-w-0 flex-1 lg:flex-none">
        <span className="text-xs font-bold text-slate-200 truncate w-full">{title}</span>
        <span className="text-[10px] text-slate-400 font-mono mt-0.5 truncate w-full">{sub}</span>
      </div>
    </div>
  );
};

const Connector = ({ label }: { label: string }) => (
  <div className="flex flex-col lg:flex-row items-center justify-center z-10 shrink-0">
    <div className="w-px h-5 lg:w-6 lg:h-px bg-slate-700" />
    <div className="my-1 lg:my-0 lg:mx-2 relative group">
      <span className="relative text-[10px] font-mono text-slate-300 bg-slate-950 px-3 py-1.5 rounded-full border border-slate-700 shadow-sm flex items-center gap-1.5 whitespace-nowrap">
        {label}
        <ArrowRight className="w-3 h-3 text-indigo-400/80 rotate-90 lg:rotate-0 transition-transform group-hover:translate-y-0.5 lg:group-hover:translate-y-0 lg:group-hover:translate-x-0.5" />
      </span>
    </div>
    <div className="w-px h-5 lg:w-6 lg:h-px bg-slate-700" />
  </div>
);

export default function ArchitectureVisualizer({ integrationType }: VisualizerProps) {
  const renderDiagram = () => {
    switch (integrationType) {
      case "view_json":
        return (
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-center w-full bg-slate-950/40 p-4 lg:p-6 rounded-xl border border-slate-800/80 shadow-inner overflow-x-auto scrollbar-none">
            <PipelineNode icon={MessageSquare} title="Client / App" sub="Sends Feedback" theme="sky" />
            <Connector label="POST /api/feedback" />
            <PipelineNode icon={Server} title="Django View" sub="views.py (Sync)" theme="blue" />
            <Connector label="Prompt Render" />
            <PipelineNode icon={Brain} title="LLM API" sub="Structured JSON" theme="emerald" />
            <Connector label="Save & Respond" />
            <PipelineNode icon={Database} title="PostgreSQL" sub="Classified Record" theme="indigo" />
          </div>
        );

      case "signal_tagger":
        return (
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-center w-full bg-slate-950/40 p-4 lg:p-6 rounded-xl border border-slate-800/80 shadow-inner overflow-x-auto scrollbar-none">
            <PipelineNode icon={Database} title="Admin / API" sub="Saves BlogPost" theme="slate" />
            <Connector label="post_save signal" />
            <PipelineNode icon={Cpu} title="@receiver" sub="signals.py" theme="purple" />
            <Connector label="Generate Tags" />
            <PipelineNode icon={Brain} title="LLM Engine" sub="Returns List" theme="emerald" />
            <Connector label="Update Field" />
            <PipelineNode icon={Database} title="PostgreSQL DB" sub="Save (No Loop)" theme="purple" />
          </div>
        );

      case "celery_async":
        return (
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-center w-full bg-slate-950/40 p-4 lg:p-6 rounded-xl border border-slate-800/80 shadow-inner overflow-x-auto scrollbar-none">
            <PipelineNode icon={Server} title="Django View" sub="Lead Sign-Up" theme="slate" />
            <Connector label="task.delay()" />
            <PipelineNode icon={Cpu} title="Celery Redis" sub="Broker Queue" theme="amber" />
            <Connector label="Worker Fetch" />
            <PipelineNode icon={Server} title="Celery Worker" sub="tasks.py (Async)" theme="blue" />
            <Connector label="LLM Prompt" />
            <PipelineNode icon={Brain} title="LLM Response" sub="Outreach Script" theme="emerald" />
          </div>
        );

      case "rag_router":
        return (
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-center w-full bg-slate-950/40 p-4 lg:p-6 rounded-xl border border-slate-800/80 shadow-inner overflow-x-auto scrollbar-none">
            <PipelineNode icon={MessageSquare} title="User Query" sub='"Show sales..."' theme="indigo" />
            <Connector label="Route Check" />
            <PipelineNode icon={Brain} title="LLM Router" sub="Classify Intent" theme="blue" />
            <Connector label="Decisions" />
            
            <div className="flex flex-col gap-3 w-full lg:w-56 shrink-0 z-10 py-1">
              <div className="p-3 bg-slate-900/80 border border-teal-900/50 rounded-xl relative overflow-hidden group shadow-sm transition-all hover:bg-slate-800/80">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-teal-500" />
                <div className="pl-2 flex flex-col">
                  <span className="font-semibold text-teal-400 text-xs">1. DB Filter</span>
                  <span className="text-[10px] text-slate-400 mt-1 leading-snug">Django ORM Query</span>
                </div>
              </div>
              <div className="p-3 bg-slate-900/80 border border-blue-900/50 rounded-xl relative overflow-hidden group shadow-sm transition-all hover:bg-slate-800/80">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
                <div className="pl-2 flex flex-col">
                  <span className="font-semibold text-blue-400 text-xs">2. Semantic Docs</span>
                  <span className="text-[10px] text-slate-400 mt-1 leading-snug">pgvector Embedding Search</span>
                </div>
              </div>
              <div className="p-3 bg-slate-900/80 border border-rose-900/50 rounded-xl relative overflow-hidden group shadow-sm transition-all hover:bg-slate-800/80">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500" />
                <div className="pl-2 flex flex-col">
                  <span className="font-semibold text-rose-400 text-xs">3. Conversational</span>
                  <span className="text-[10px] text-slate-400 mt-1 leading-snug">Direct friendly answer</span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getFlowDescription = () => {
    switch (integrationType) {
      case "view_json":
        return "Direct synchronous route. The user request blocks while Django compiles the prompt, calls Gemini/Claude, parses the returned JSON string into a native dict, saves the log to PostgreSQL, and outputs the structured response directly back to the client.";
      case "signal_tagger":
        return "Event-driven orchestration using Django Database Signals. When a BlogPost is saved, the post_save signal interceptor reads the text, calls the LLM tag generator, parses the JSON array, and performs an updated .save(update_fields=['tags']) bypass to prevent recursion loops.";
      case "celery_async":
        return "Robust asynchronous background processing. The web request fires off a non-blocking Celery task via Redis, which immediately frees up the main thread. A Celery worker processes the prompt, queries the LLM, saves the generated content, and can optionally stream updates back.";
      case "rag_router":
        return "Dynamic RAG and semantic router. Integrates prompt routing to classify if queries require relational filters, vector search, or chit-chat. Translates English directly to Django ORM syntax safely or rewrites search parameters for maximized accuracy.";
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full min-w-0 overflow-hidden">
      <div className="flex items-center gap-2">
        <Cpu className="w-5 h-5 text-indigo-400 animate-pulse shrink-0" />
        <h3 className="text-sm font-semibold text-slate-200 truncate">Live Django Orchestration Pipeline Flow</h3>
      </div>
      
      <div className="w-full overflow-x-auto pb-2 scrollbar-none">
        {renderDiagram()}
      </div>

      <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
        <p className="text-xs text-slate-300 leading-relaxed">
          <strong className="text-slate-100 font-medium">Django Architecture Insight:</strong>{" "}
          {getFlowDescription()}
        </p>
      </div>
    </div>
  );
}
