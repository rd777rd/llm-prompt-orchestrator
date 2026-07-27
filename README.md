# Django LLM Orchestrator

## Project Description
A visual design studio for building, testing, and exporting production-ready LLM prompt
integrations for Django applications.

## Features
- Visual prompt builder with Jinja2-style `{{ variable }}` templating
- Live sandbox — test prompts against Gemini using your own API key
- 4 orchestration patterns: Django API view, post-save signal, Celery background task,
  RAG query router
- Auto-generated, production-ready Python/Django code snippets (Google GenAI + Claude API)
- Built-in best-practices guidance: secrets handling, lazy client init, async fallback,
  safe JSON parsing

## Tech Stack
- React 19 + Vite
- Netlify Functions (serverless backend — see setup below)
- Google Gemini API / `@google/genai`
- Jinja2-style templating
- Modeled backend patterns generated: Django, Celery, PostgreSQL
- Netlify (hosting)

## Live Demo
https://llm-prompt-orchestrator.netlify.app/

---

## ⚠️ Important: this refactor changes how the backend works

The previous version of this project ran its API routes (`/api/status`, `/api/validate-key`,
`/api/run-sandbox`) through a standalone Express server (`server.ts`). That works fine for local
development, but **Netlify does not run a persistent Node server** — it only serves static files
from `dist/`. As a result, those routes silently 404'd on the live Netlify deployment and the
"Live sandbox" feature never actually worked in production.

This refactor ports those three routes to **Netlify Functions** (serverless), which Netlify *does*
run. Nothing changes from the frontend's point of view — it still calls `/api/status`,
`/api/validate-key`, and `/api/run-sandbox` exactly as before; `netlify.toml` just redirects those
paths to the new functions behind the scenes.

### Setting up Netlify Functions (step-by-step)

You don't need to write any new code — this is already wired up. Here's what to do to actually
deploy it correctly:

1. **Install the Netlify CLI locally** (optional but recommended for testing before you deploy):
   ```bash
   npm install
   ```
   This now includes `netlify-cli` and `@netlify/functions` as dev dependencies, so a plain
   `npm install` is all you need — nothing extra to install globally.

2. **Test it locally with `netlify dev` instead of `npm run dev`.**
   `npm run dev` still runs the old Express server, which is fine for quick UI iteration, but it
   won't exercise the real Netlify Functions path. To test the *actual* production wiring locally:
   ```bash
   npm run netlify:dev
   ```
   This spins up a local server that serves your Vite app **and** runs the functions in
   `netlify/functions/` exactly like production, proxying `/api/*` through `netlify.toml`'s
   redirects. Visit the URL it prints (usually `http://localhost:8888`) and the sandbox should work
   end-to-end.

3. **Set your environment variable(s) in the Netlify dashboard, not in a `.env` file.**
   - Go to your site in the Netlify dashboard → **Site configuration → Environment variables**
   - Add `GEMINI_API_KEY` **only if** you want `/api/status` to report a server key is configured.
     (Read the security note below — this key is *never* used to actually run a visitor's sandbox
     request, by design.)
   - Redeploy after adding/changing environment variables (Netlify doesn't hot-reload them).

4. **Deploy.** If your site is already connected to this repo via Netlify's Git integration, just
   push — `netlify.toml` tells Netlify to run `npm run build`, publish `dist/`, and pick up
   everything in `netlify/functions/` automatically. No dashboard configuration needed beyond step 3.

5. **Verify after deploying:**
   - Visit `https://<your-site>.netlify.app/api/status` — you should get back JSON like
     `{"status":"ok","hasServerKey":false,...}`, not a 404 or the HTML shell of the app.
   - Open the site, click "Configure API Key", paste a real Gemini key (get one free at
     https://aistudio.google.com/app/apikey), click "Test API Key" — it should say verified.
   - Run a prompt through the sandbox — you should get a real Gemini response, not the
     "[SHOWCASE DEMO - SIMULATED RESPONSE]" placeholder text.

If any of those checks fail, the most common cause is the Netlify site's **publish directory**
or **functions directory** being overridden in the Netlify dashboard's build settings so that it
ignores `netlify.toml`. Check **Site configuration → Build & deploy → Build settings** and make
sure nothing there is overriding what's in `netlify.toml`.

### Security note: why there's no server-side API key fallback for live runs
The previous version of `/api/run-sandbox` fell back to a `GEMINI_API_KEY` environment variable
if a visitor didn't supply their own key. On a public site, that's an **unauthenticated proxy to
your paid API quota** — anyone could hit the endpoint repeatedly and run up your bill. This
refactor removes that fallback entirely: if a visitor hasn't entered their own key, they always get
the simulated/demo response, never a real billed call. `GEMINI_API_KEY` (if set) is only used to
report `hasServerKey: true` from `/api/status` for informational display — it's never spent on a
stranger's request.

A lightweight best-effort rate limit is also included in `netlify/functions/run-sandbox.ts`
(20 requests/minute per warm instance). It's not a substitute for a real rate-limiting service —
serverless functions don't share memory across cold starts — but it's zero-cost insurance against
casual abuse. If you need stronger guarantees, look at Netlify's built-in Rate Limiting
(Site configuration → Traffic rules) or a persistent store like Netlify Blobs.

### API key storage (client-side)
Visitor-provided Gemini keys default to `sessionStorage` (cleared when the tab closes). There's an
explicit opt-in checkbox ("Remember on this device") in the API Key modal for anyone who wants
their key to persist across visits via `localStorage` — trading convenience for a longer exposure
window if that device is ever compromised. This is disclosed in the modal itself.

## Known open items
- Selecting a "claude-*" model in the sandbox is actually served by Gemini instructed to mimic
  Claude's style (this tool has no real Anthropic API access) — now disclosed directly in the UI
  result panel, not just in a code comment.
- The generated Django/Celery code snippets are illustrative reference patterns, not a real
  deployed backend — treat them as a starting point, not copy-paste-ready production code without
  review.
