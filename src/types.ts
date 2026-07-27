export interface TemplateVariable {
  name: string;
  defaultValue: string;
  description: string;
  value: string;
}

export type DjangoIntegrationType = 'view_json' | 'signal_tagger' | 'celery_async' | 'rag_router';

export type ResponseFormatType = 'text' | 'json';

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  systemInstruction: string;
  templateText: string;
  variables: TemplateVariable[];
  model: string;
  temperature: number;
  responseFormat: ResponseFormatType;
  responseSchemaText: string;
  djangoIntegration: DjangoIntegrationType;
}

export interface ExecutionLog {
  id: string;
  timestamp: string;
  templateId: string;
  templateName: string;
  renderedPrompt: string;
  variables: Record<string, string>;
  response: string;
  latencyMs: number;
  tokensEstimated: number;
  modelUsed: string;
  isSimulated: boolean;
}
