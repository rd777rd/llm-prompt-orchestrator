import type { Handler } from "@netlify/functions";
import { GoogleGenAI } from "@google/genai";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ valid: false, message: "Method not allowed." }) };
  }

  let apiKey: string | undefined;
  try {
    const body = JSON.parse(event.body || "{}");
    apiKey = body.apiKey;
  } catch {
    return { statusCode: 400, body: JSON.stringify({ valid: false, message: "Invalid request body." }) };
  }

  if (!apiKey || typeof apiKey !== "string" || !apiKey.trim()) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ valid: false, message: "No API key provided." }),
    };
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: apiKey.trim(),
      httpOptions: { headers: { "User-Agent": "aistudio-build" } },
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "Hello",
    });

    if (response.text) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ valid: true, message: "Gemini API key verified successfully!" }),
      };
    }
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ valid: false, message: "Empty response received from Gemini API." }),
    };
  } catch (err: any) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ valid: false, message: err?.message || "Failed to validate Gemini API key." }),
    };
  }
};
