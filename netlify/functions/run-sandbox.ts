import type { Handler } from "@netlify/functions";
import { GoogleGenAI } from "@google/genai";

// Best-effort per-instance rate limit. Serverless functions are stateless
// across cold starts, so this is NOT a substitute for a real rate-limiting
// service -- it only throttles bursts hitting the same warm instance. It's
// cheap insurance with zero added infrastructure; see README for how to
// upgrade to Netlify Blobs/Rate Limiting if you need stronger guarantees.
const requestLog = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 20;

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const timestamps = (requestLog.get(key) || []).filter((t) => now - t < WINDOW_MS);
  timestamps.push(now);
  requestLog.set(key, timestamps);
  return timestamps.length > MAX_REQUESTS_PER_WINDOW;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ success: false, error: "Method not allowed." }) };
  }

  const clientIp =
    event.headers["x-nf-client-connection-ip"] || event.headers["client-ip"] || "unknown";
  if (isRateLimited(clientIp)) {
    return {
      statusCode: 429,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: false, error: "Too many requests. Please wait a minute and try again." }),
    };
  }

  let payload: any;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: JSON.stringify({ success: false, error: "Invalid request body." }) };
  }

  const { prompt, model, systemInstruction, temperature, responseFormat, responseSchema } = payload;

  // SECURITY FIX (see audit): the previous Express version fell back to a
  // server-side GEMINI_API_KEY for anyone who didn't supply their own key,
  // which turns a public site into an unauthenticated proxy for your paid
  // API quota. This function ONLY ever uses a key the visitor typed in
  // themselves. No user key -> always the simulated demo response, never a
  // real call billed to the site owner.
  const userKey =
    (event.headers["x-gemini-api-key"] as string | undefined) || payload.userApiKey || payload.apiKey;
  const key = userKey?.trim();

  if (!key) {
    const latency = Math.round(400 + Math.random() * 400);
    const mockOutput =
      responseFormat === "json"
        ? JSON.stringify(
            {
              status: "simulated_demo_response",
              message: "This is a simulated JSON response. Enter your own Gemini API key in the top bar to run live model executions.",
              input_prompt_length: prompt?.length || 0,
              parameters: { temperature, model },
              note: "Get a free Gemini API key from Google AI Studio at https://aistudio.google.com/app/apikey",
            },
            null,
            2
          )
        : `[SHOWCASE DEMO - SIMULATED RESPONSE]\n\nYour prompt template was compiled successfully and would be sent to: "${model}".\n\nNo API key was provided for this sandbox run.\n\nRendered Prompt:\n---\n${prompt}\n---\n\nTo run live inferences with real AI models, click "🔑 Custom API Key" in the header and add your own free Gemini key.`;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: true,
        text: mockOutput,
        modelUsed: `${model} (Simulated Demo)`,
        latencyMs: latency,
        tokensEstimated: Math.round((prompt?.length || 0) / 4 + 80),
        isSimulated: true,
        keySource: "none",
      }),
    };
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: key,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } },
    });

    const startTime = Date.now();
    let targetModel = "gemini-3.5-flash";
    let activeSystemInstruction = systemInstruction || "";
    const isSimulatingClaude = typeof model === "string" && model.includes("claude");

    if (isSimulatingClaude) {
      targetModel = "gemini-3.5-flash";
      activeSystemInstruction = `[You are simulating the response behavior, formatting style, and analytical tone of the Anthropic ${model} model for a developer testing Django integrations. Do not break character. Keep your explanation structured, concise, and professional.]\n\n${activeSystemInstruction}`;
    }

    const config: any = { temperature: typeof temperature === "number" ? temperature : 0.7 };
    if (activeSystemInstruction) config.systemInstruction = activeSystemInstruction;
    if (responseFormat === "json") {
      config.responseMimeType = "application/json";
      if (responseSchema) config.responseSchema = responseSchema;
    }

    const response = await ai.models.generateContent({ model: targetModel, contents: prompt, config });
    const endTime = Date.now();
    const text = response.text || "Empty response received.";

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: true,
        text,
        modelUsed: model,
        // Disclosed to the caller (the UI surfaces this) whenever a "claude-*"
        // model is selected, since it's actually Gemini role-playing the
        // style -- not a real call to Anthropic's API.
        isSimulatingClaude,
        latencyMs: endTime - startTime,
        tokensEstimated: Math.round((prompt.length + text.length) / 3.8),
        isSimulated: false,
        keySource: "user",
      }),
    };
  } catch (error: any) {
    console.error("Error executing Gemini API:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: false,
        error: error?.message || "An unknown error occurred while communicating with the AI service. Please check your API key.",
      }),
    };
  }
};
