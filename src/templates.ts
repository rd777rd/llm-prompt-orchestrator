import { PromptTemplate } from "./types";

export const DEFAULT_TEMPLATES: PromptTemplate[] = [
  {
    id: "django-view-json",
    name: "Django API View: Feedback Classifier",
    description: "Synchronous JSON classifier inside a Django view. Analyzes customer feedback and outputs clean JSON for direct DB ingestion.",
    systemInstruction: "You are a robust data-parsing microservice. You must output a JSON object, and only JSON. Do not wrap the JSON in Markdown formatting like ```json ... ```, do not write anything else, and do not include any conversational intro or outro.",
    templateText: `Analyze the following customer feedback:
Customer Tier: {{ customer_tier }}
Feedback Text:
"""
{{ feedback_text }}
"""

Extract the following details:
1. "category": Choose from [Bug Report, Feature Request, Billing Issue, General Praise, Spam]
2. "sentiment_score": Rated from -1.0 (very negative) to 1.0 (very positive)
3. "summary": A concise 1-sentence summary of the main issue/point
4. "urgency": "high" if they mention billing errors or critical service crashes, else "medium" or "low"
5. "recommended_response": A professional 2-sentence draft addressing their tier ({{ customer_tier }}) and feedback.`,
    variables: [
      {
        name: "feedback_text",
        defaultValue: "I love the new Django dashboard, but since the 2.4 upgrade, my celery background tasks are occasionally dropping. Also, I was double billed for my premium subscription this month. Can someone from support check this immediately?",
        description: "The feedback submitted by the customer.",
        value: "I love the new Django dashboard, but since the 2.4 upgrade, my celery background tasks are occasionally dropping. Also, I was double billed for my premium subscription this month. Can someone from support check this immediately?"
      },
      {
        name: "customer_tier",
        defaultValue: "Enterprise Premium",
        description: "The customer's current billing tier (e.g. Enterprise, Pro, Free).",
        value: "Enterprise Premium"
      }
    ],
    model: "gemini-3.5-flash",
    temperature: 0.1,
    responseFormat: "json",
    responseSchemaText: `{
  "type": "object",
  "properties": {
    "category": { "type": "string" },
    "sentiment_score": { "type": "number" },
    "summary": { "type": "string" },
    "urgency": { "type": "string" },
    "recommended_response": { "type": "string" }
  },
  "required": ["category", "sentiment_score", "summary", "urgency", "recommended_response"]
}`,
    djangoIntegration: "view_json"
  },
  {
    id: "django-signal-tagger",
    name: "Django Model Signal: Auto-Tagger",
    description: "Post-save database signal. Automatically analyzes blog posts or articles upon creation, generates taxonomy tags, and saves them back to the DB.",
    systemInstruction: "You are a professional editor and search engine specialist. Analyze the content and return a raw JSON list of strings representing the best SEO tags.",
    templateText: `Analyze this newly saved article content:
Title: {{ article_title }}
Content:
"""
{{ article_content }}
"""

Generate 4 to 6 relevant, lowercase tags. Focus on technology concepts, software frameworks, and professional practices.`,
    variables: [
      {
        name: "article_title",
        defaultValue: "Securing Django REST Framework with OAuth2 and Custom Middlewares",
        description: "The title of the blog post.",
        value: "Securing Django REST Framework with OAuth2 and Custom Middlewares"
      },
      {
        name: "article_content",
        defaultValue: "In this guide, we dive deep into configuring OAuth2 authentication in Django REST Framework (DRF). We will implement customized middleware classes to inspect JWT payloads, audit incoming requests, and cache token lookups using Redis to maintain ultra-low latency. We also discuss writing integration tests using Django's standard TestCase module.",
        description: "The full content body of the article.",
        value: "In this guide, we dive deep into configuring OAuth2 authentication in Django REST Framework (DRF). We will implement customized middleware classes to inspect JWT payloads, audit incoming requests, and cache token lookups using Redis to maintain ultra-low latency. We also discuss writing integration tests using Django's standard TestCase module."
      }
    ],
    model: "claude-3-5-sonnet",
    temperature: 0.2,
    responseFormat: "json",
    responseSchemaText: `{
  "type": "array",
  "items": { "type": "string" }
}`,
    djangoIntegration: "signal_tagger"
  },
  {
    id: "django-celery-enrichment",
    name: "Celery Background Task: Lead Enricher",
    description: "Asynchronous background task. Runs when a new lead signs up, parses their profile, and generates a tailored sales introduction script.",
    systemInstruction: "You are an automated backend sales advisor. Write structured, professional outreach recommendations.",
    templateText: `Enrich and draft outreach for this new sign-up:
Lead Name: {{ lead_name }}
Role: {{ lead_role }}
Company Profile: {{ company_bio }}

Compose:
1. Personalization hook: Mention their specific role ({{ lead_role }}) and a potential pain point they have.
2. Introduction hook: Introduce how our Django analytics integration optimizes standard database queries.
3. Call to Action: A friendly, brief closing sentence asking to chat.`,
    variables: [
      {
        name: "lead_name",
        defaultValue: "Sarah Jenkins",
        description: "Full name of the signing customer.",
        value: "Sarah Jenkins"
      },
      {
        name: "lead_role",
        defaultValue: "VP of Engineering",
        description: "Job title of the lead.",
        value: "VP of Engineering"
      },
      {
        name: "company_bio",
        defaultValue: "FinTech startup scaleup building secure payment gateways on top of Python, Django, and PostgreSQL, handling over 50,000 requests per minute with strict compliance rules.",
        description: "The customer's company description.",
        value: "FinTech startup scaleup building secure payment gateways on top of Python, Django, and PostgreSQL, handling over 50,000 requests per minute with strict compliance rules."
      }
    ],
    model: "gemini-3.5-flash",
    temperature: 0.6,
    responseFormat: "text",
    responseSchemaText: "",
    djangoIntegration: "celery_async"
  },
  {
    id: "django-rag-router",
    name: "Intelligent Query RAG Router",
    description: "Determines if a natural language query is a database reporting request (requires Django ORM filtering), a semantic docs search, or general conversation.",
    systemInstruction: "You are a smart middleware router. Categorize and optimize queries to maximize response efficiency. Output strictly valid JSON.",
    templateText: `The user asked our database portal: "{{ user_query }}"
Available Django models for querying:
- User (fields: username, email, date_joined, is_active)
- Order (fields: id, user, total_amount, status, created_at)
- Product (fields: name, price, stock_count, category)

Analyze the query and output:
- "route": Must be either "DATABASE_FILTER", "SEMANTIC_DOCS", or "CONVERSATIONAL"
- "orm_suggestion": A string containing Django ORM filter code (e.g. Order.objects.filter(status='paid').count()) if DATABASE_FILTER is selected, else null
- "optimized_search_query": Re-written search terms for vector search if SEMANTIC_DOCS, else null
- "response_reason": A short explanation of why this route was selected.`,
    variables: [
      {
        name: "user_query",
        defaultValue: "Show me all active orders with total amount greater than 200 dollars from last week",
        description: "The natural language query entered by the user.",
        value: "Show me all active orders with total amount greater than 200 dollars from last week"
      }
    ],
    model: "claude-3-5-sonnet",
    temperature: 0.1,
    responseFormat: "json",
    responseSchemaText: `{
  "type": "object",
  "properties": {
    "route": { "type": "string" },
    "orm_suggestion": { "type": "string" },
    "optimized_search_query": { "type": "string" },
    "response_reason": { "type": "string" }
  },
  "required": ["route", "orm_suggestion", "optimized_search_query", "response_reason"]
}`,
    djangoIntegration: "rag_router"
  }
];
