import type { Handler } from "@netlify/functions";

// Mirrors the old Express `/api/status` route, ported to a Netlify Function.
// Reachable in production at /.netlify/functions/status, and at the friendlier
// /api/status path via the redirect rules in netlify.toml.
export const handler: Handler = async () => {
  // NOTE: unlike the old server, a configured server-side GEMINI_API_KEY is
  // reported here for informational purposes only. It is intentionally never
  // used to actually run a visitor's sandbox request — see run-sandbox.ts for
  // why (unauthenticated open-proxy / API cost risk).
  const hasServerKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY";

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      status: "ok",
      hasServerKey,
      environment: process.env.CONTEXT || process.env.NODE_ENV || "production",
    }),
  };
};
