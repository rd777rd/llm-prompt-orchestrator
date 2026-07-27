import { useState } from "react";
import { PromptTemplate } from "../types";
import { Check, Copy, Code, FileCode, Terminal } from "lucide-react";

interface CodeExporterProps {
  template: PromptTemplate;
}

export default function CodeExporter({ template }: CodeExporterProps) {
  const [activeTab, setActiveTab] = useState<'gemini' | 'claude' | 'django'>('gemini');
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate python formatting logic for active variables
  const pythonVarFormatting = template.variables
    .map(v => `        "${v.name}": ${v.name},`)
    .join("\n");

  const pythonFunctionArgs = template.variables
    .map(v => `${v.name}: str`)
    .join(", ");

  const promptFormattingLine = `    # Render dynamic variables into prompt template
    rendered_prompt = PROMPT_TEMPLATE
    for key, value in variables.items():
        rendered_prompt = rendered_prompt.replace(f"{{{{{key}}}}}", value)`;

  const getGeminiPythonCode = () => {
    return `import os
from google import genai
from google.genai import types

# 1. Define Prompt Template (Python formatting safe)
PROMPT_TEMPLATE = """${template.templateText}"""

SYSTEM_INSTRUCTION = """${template.systemInstruction}"""

def get_gemini_client():
    """Lazily initializes the Gemini client with User-Agent for standard telemetry."""
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable is required")
    
    # Initialize using the modern google-genai library
    return genai.Client(
        api_key=api_key,
        http_options={"headers": {"User-Agent": "aistudio-build"}}
    )

def orchestrate_gemini_call(${pythonFunctionArgs}) -> str:
    """Renders prompt variables and executes content generation via Gemini."""
    client = get_gemini_client()
    
    # Variables dict
    variables = {
${pythonVarFormatting}
    }
    
${promptFormattingLine}
    
    # Build call config
    config = types.GenerateContentConfig(
        temperature=${template.temperature},
        system_instruction=SYSTEM_INSTRUCTION,
    )
    
    # Configure JSON response structure if required
    if "${template.responseFormat}" == "json":
        config.response_mime_type = "application/json"
        # Optionally define response_schema using Pydantic or native dict schema
    
    try:
        response = client.models.generate_content(
            model="${template.model.includes("claude") ? "gemini-3.5-flash" : template.model}",
            contents=rendered_prompt,
            config=config
        )
        return response.text
    except Exception as e:
        # Handle API connection or validation errors gracefully inside your Django pipeline
        print(f"Error calling Gemini: {e}")
        raise
`;
  };

  const getClaudePythonCode = () => {
    return `import os
from anthropic import Anthropic

# 1. Define Prompt Template
PROMPT_TEMPLATE = """${template.templateText}"""

SYSTEM_INSTRUCTION = """${template.systemInstruction}"""

def get_claude_client():
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY environment variable is required")
    return Anthropic(api_key=api_key)

def orchestrate_claude_call(${pythonFunctionArgs}) -> str:
    """Renders template variables and invokes Claude's Messages API."""
    client = get_claude_client()
    
    variables = {
${pythonVarFormatting}
    }
    
${promptFormattingLine}
    
    try:
        # Call Anthropic API
        message = client.messages.create(
            model="${template.model.includes("claude") ? template.model : "claude-3-5-sonnet-20241022"}",
            max_tokens=2048,
            temperature=${template.temperature},
            system=SYSTEM_INSTRUCTION,
            messages=[
                {"role": "user", "content": rendered_prompt}
            ]
        )
        return message.content[0].text
    except Exception as e:
        print(f"Error calling Claude: {e}")
        raise
`;
  };

  const getDjangoIntegrationCode = () => {
    switch (template.djangoIntegration) {
      case "view_json":
        return `import json
from django.http import JsonResponse
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from .services import orchestrate_gemini_call  # Import orchestrator service

@method_decorator(csrf_exempt, name='dispatch')
class FeedbackClassifierView(View):
    """
    Synchronous Django view to classify e-commerce or product feedback.
    Parses request POST payload, validates arguments, calls LLM, and responds with JSON.
    """
    def post(self, request, *args, **kwargs):
        try:
            # Parse incoming body
            data = json.loads(request.body.decode('utf-8'))
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON body"}, status=400)
            
        # Extract variables with sensible defaults
        feedback_text = data.get("feedback_text", "").strip()
        customer_tier = data.get("customer_tier", "Free").strip()
        
        if not feedback_text:
            return JsonResponse({"error": "feedback_text parameter is required"}, status=400)
            
        try:
            # Call our orchestrator service that executes the compiled template
            llm_response_text = orchestrate_gemini_call(
                feedback_text=feedback_text,
                customer_tier=customer_tier
            )
            
            # Since the prompt has JSON enforcement, safely parse the output string
            try:
                parsed_json = json.loads(llm_response_text)
            except json.JSONDecodeError:
                # Fallback if model fails strict JSON compliance formatting
                parsed_json = {
                    "raw_output": llm_response_text,
                    "parsing_error": True,
                    "category": "Unclassified"
                }
                
            # Respond to client with structured details
            return JsonResponse({
                "status": "success",
                "classification": parsed_json
            })
            
        except Exception as e:
            return JsonResponse({
                "status": "error",
                "message": f"Orchestration failure: {str(e)}"
            }, status=500)
`;

      case "signal_tagger":
        return `import json
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import BlogPost
from .services import orchestrate_gemini_call

@receiver(post_save, sender=BlogPost)
def auto_tag_blog_post(sender, instance, created, **kwargs):
    """
    Django post_save signal. Triggers auto-tag generation when an article is saved.
    Protects against infinite saving loops by targeting specific 'update_fields'.
    """
    # Only tag if content exists and it doesn't already have tags generated
    if not instance.content or instance.tags:
        return
        
    try:
        # Call the prompt orchestration service
        response_text = orchestrate_gemini_call(
            article_title=instance.title,
            article_content=instance.content
        )
        
        # Safely parse JSON tags array from LLM
        try:
            tags_list = json.loads(response_text)
            if isinstance(tags_list, list):
                # Save back to database (bypass normal save signals to prevent infinite loop)
                instance.tags = ",".join(tags_list)
                instance.save(update_fields=['tags'])
        except json.JSONDecodeError:
            print("Failed to parse tags JSON array")
            
    except Exception as e:
        print(f"Signal orchestration tagger failure: {e}")
`;

      case "celery_async":
        return `from celery import shared_task
from django.contrib.auth import get_user_model
from .models import LeadProfile
from .services import orchestrate_gemini_call

User = get_user_model()

@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def enrich_lead_background_task(self, lead_id: int):
    """
    Celery background task. Safely handles rate limits and API timeouts.
    Retries automatically if the LLM provider experiences server failures.
    """
    try:
        lead = LeadProfile.objects.get(pk=lead_id)
    except LeadProfile.DoesNotExist:
        return f"Lead with id {lead_id} not found"
        
    try:
        # Run background LLM orchestration with company bio details
        outreach_copy = orchestrate_gemini_call(
            lead_name=lead.name,
            lead_role=lead.role,
            company_bio=lead.company_description
        )
        
        # Save enriched copy back to database
        lead.automated_outreach_draft = outreach_copy
        lead.is_enriched = True
        lead.save()
        
        return f"Successfully enriched lead: {lead.name}"
        
    except Exception as exc:
        # Auto-retry task on transient API timeouts or connection drops
        print(f"Enrichment failed. Retrying in 60s... Error: {exc}")
        raise self.retry(exc=exc)
`;

      case "rag_router":
        return `import json
from django.http import JsonResponse
from django.views import View
from .models import Order, Product
from .services import orchestrate_gemini_call

class IntelligentQueryView(View):
    """
    Dynamic routing view. Uses LLM router to interpret user query and choose
    the optimal data fetching strategy (Relational DB vs Vector support search).
    """
    def get(self, request, *args, **kwargs):
        query = request.GET.get("q", "").strip()
        if not query:
            return JsonResponse({"error": "Empty search query"}, status=400)
            
        try:
            # Query the LLM router to make a decision
            router_json_text = orchestrate_gemini_call(user_query=query)
            router_data = json.loads(router_json_text)
            
            route = router_data.get("route", "CONVERSATIONAL")
            
            if route == "DATABASE_FILTER":
                # Handle database query route. Here you can execute the suggestion or filter ORM
                # Safe eval or parse custom queries. 
                # (Example: filtering orders from previous week)
                order_count = Order.objects.filter(total_amount__gt=200).count()
                return JsonResponse({
                    "route": route,
                    "reason": router_data.get("response_reason"),
                    "data": {
                        "active_high_value_orders": order_count,
                        "orm_code": router_data.get("orm_suggestion")
                    }
                })
                
            elif route == "SEMANTIC_DOCS":
                # Handle Vector Search or Semantic Database matching
                search_terms = router_data.get("optimized_search_query", query)
                # In Django, you would search a pgvector embedding table:
                # SupportDoc.objects.annotate(similarity=CosineDistance('embedding', query_emb)).filter(similarity__gt=0.7)
                return JsonResponse({
                    "route": route,
                    "reason": router_data.get("response_reason"),
                    "data": {
                        "semantic_search_parameters": search_terms,
                        "note": "Query is routed to PostgreSQL pgvector indexing."
                    }
                })
                
            else:
                # Conversational route - return LLM generated reply directly
                return JsonResponse({
                    "route": route,
                    "reason": router_data.get("response_reason"),
                    "reply": "Hi! We found your query is general. How can I help you manage your Django models today?"
                })
                
        except Exception as e:
            return JsonResponse({"error": f"Router failed: {str(e)}"}, status=500)
`;
      default:
        return "";
    }
  };

  const getCodeContent = () => {
    switch (activeTab) {
      case 'gemini':
        return getGeminiPythonCode();
      case 'claude':
        return getClaudePythonCode();
      case 'django':
        return getDjangoIntegrationCode();
      default:
        return '';
    }
  };

  const getFilename = () => {
    switch (activeTab) {
      case 'gemini':
        return 'services.py (Google GenAI)';
      case 'claude':
        return 'services.py (Anthropic Claude)';
      case 'django':
        switch (template.djangoIntegration) {
          case 'view_json': return 'views.py (Django View)';
          case 'signal_tagger': return 'signals.py (Django Signal)';
          case 'celery_async': return 'tasks.py (Celery Task)';
          case 'rag_router': return 'views.py (Search Router)';
        }
    }
  };

  const getDependencyNote = () => {
    switch (activeTab) {
      case 'gemini':
        return "pip install google-genai";
      case 'claude':
        return "pip install anthropic";
      case 'django':
        return "Django >= 4.2";
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-2 gap-3 sm:gap-0 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <Code className="w-5 h-5 text-indigo-400 shrink-0" />
          <h3 className="text-sm font-semibold text-slate-200 truncate">Production Snippets</h3>
        </div>
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 overflow-x-auto scrollbar-none w-full sm:w-auto shrink-0">
          <button
            onClick={() => setActiveTab('gemini')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all shrink-0 ${
              activeTab === 'gemini' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Google GenAI
          </button>
          <button
            onClick={() => setActiveTab('claude')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all shrink-0 ${
              activeTab === 'claude' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Claude API
          </button>
          <button
            onClick={() => setActiveTab('django')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all shrink-0 ${
              activeTab === 'django' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Django Hook
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900 px-4 py-2 rounded-t-lg border-t border-x border-slate-800 text-xs gap-3 sm:gap-0">
          <div className="flex items-center gap-2 text-slate-300 min-w-0">
            <FileCode className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="font-mono text-[11px] font-semibold truncate">{getFilename()}</span>
          </div>
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-400 bg-slate-950 px-2.5 py-0.5 rounded border border-slate-800 shrink-0">
              <Terminal className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{getDependencyNote()}</span>
            </div>
            <button
              onClick={() => handleCopy(getCodeContent())}
              className="flex items-center justify-center gap-1 text-slate-400 hover:text-slate-200 active:text-indigo-400 font-medium transition-all shrink-0 ml-auto sm:ml-0 border border-slate-700 sm:border-transparent px-2 py-1 sm:px-0 sm:py-0 rounded bg-slate-800 sm:bg-transparent"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[11px] text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Copy Snippet</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-b-lg border-b border-x border-slate-800 overflow-x-auto max-h-[420px] shadow-inner font-mono text-xs text-indigo-200/90 leading-relaxed scrollbar-thin">
          <pre className="whitespace-pre">{getCodeContent()}</pre>
        </div>
      </div>
    </div>
  );
}
