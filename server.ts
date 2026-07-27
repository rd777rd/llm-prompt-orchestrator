import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json());

// API route to check server and API key status
app.get("/api/status", (req, res) => {
  const hasKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY";
  res.json({
    status: "ok",
    hasServerKey: hasKey,
    environment: process.env.NODE_ENV || "development",
  });
});

// Endpoint to validate a user-provided Gemini API key
app.post("/api/validate-key", async (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey || typeof apiKey !== "string" || !apiKey.trim()) {
    return res.status(400).json({ valid: false, message: "No API key provided." });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: apiKey.trim(),
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "Hello",
    });

    if (response.text) {
      return res.json({ valid: true, message: "Gemini API key verified successfully!" });
    } else {
      return res.json({ valid: false, message: "Empty response received from Gemini API." });
    }
  } catch (err: any) {
    return res.status(400).json({ valid: false, message: err.message || "Failed to validate Gemini API key." });
  }
});

// Endpoint to run the prompt template against Gemini (or Claude simulation)
app.post("/api/run-sandbox", async (req, res) => {
  const { prompt, model, systemInstruction, temperature, responseFormat, responseSchema, userApiKey } = req.body;

  // SECURITY FIX (see audit / README): only ever use a key the visitor typed
  // in themselves. A previous version of this endpoint fell back to
  // process.env.GEMINI_API_KEY for anyone who didn't supply their own key --
  // that turns a public demo into an unauthenticated proxy for the site
  // owner's paid API quota. No user key -> always the simulated demo
  // response, never a real call billed to the site owner.
  const clientKey = (req.headers["x-gemini-api-key"] as string) || userApiKey || req.body.apiKey;
  const key = clientKey?.trim();

  if (!key) {
    // Return graceful simulated output with clear demo guidance
    const latency = Math.round(400 + Math.random() * 400);
    const mockOutput = responseFormat === "json" 
      ? JSON.stringify({
          status: "simulated_demo_response",
          message: "This is a simulated JSON response. Enter your Gemini API key in the top bar to run live model executions.",
          input_prompt_length: prompt?.length || 0,
          parameters: { temperature, model },
          note: "Get a free Gemini API key from Google AI Studio at https://aistudio.google.com/app/apikey"
        }, null, 2)
      : `[SHOWCASE DEMO - SIMULATED RESPONSE]\n\nYour prompt template was compiled successfully and would be sent to: "${model}".\n\nNo custom Gemini API key was provided for this sandbox run.\n\nRendered Prompt:\n---\n${prompt}\n---\n\nTo run live inferences with real AI models, click on "🔑 Custom API Key" in the header menu to set your Gemini API key.`;

    return res.json({
      success: true,
      text: mockOutput,
      modelUsed: `${model} (Simulated Demo)`,
      latencyMs: latency,
      tokensEstimated: Math.round((prompt?.length || 0) / 4 + 80),
      isSimulated: true,
      keySource: "none",
    });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const startTime = Date.now();
    let targetModel = "gemini-3.5-flash";
    let activeSystemInstruction = systemInstruction || "";
    const isSimulatingClaude = typeof model === "string" && model.includes("claude");

    if (isSimulatingClaude) {
      targetModel = "gemini-3.5-flash";
      activeSystemInstruction = `[You are simulating the response behavior, formatting style, and analytical tone of the Anthropic ${model} model for a developer testing Django integrations. Do not break character. Keep your explanation structured, concise, and professional.]\n\n${activeSystemInstruction}`;
    } else if (model.includes("pro")) {
      targetModel = "gemini-3.5-flash";
    }

    const config: any = {
      temperature: typeof temperature === "number" ? temperature : 0.7,
    };

    if (activeSystemInstruction) {
      config.systemInstruction = activeSystemInstruction;
    }

    if (responseFormat === "json") {
      config.responseMimeType = "application/json";
      if (responseSchema) {
        config.responseSchema = responseSchema;
      }
    }

    const response = await ai.models.generateContent({
      model: targetModel,
      contents: prompt,
      config,
    });

    const endTime = Date.now();
    const text = response.text || "Empty response received.";

    res.json({
      success: true,
      text: text,
      modelUsed: model,
      isSimulatingClaude,
      latencyMs: endTime - startTime,
      tokensEstimated: Math.round((prompt.length + text.length) / 3.8),
      isSimulated: false,
      keySource: "user",
    });
  } catch (error: any) {
    console.error("Error executing Gemini API:", error);
    res.status(500).json({
      success: false,
      error: error.message || "An unknown error occurred while communicating with the AI service. Please check your API key.",
    });
  }
});

// Configure Vite middleware in development or static serving in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
