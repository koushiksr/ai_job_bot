# 🚀 Deploying AI Job Bot Web Dashboard to Vercel

This Next.js web dashboard allows you to manage candidate profiles, toggle daily schedules, inspect logs, and trigger bot runs remotely.

---

## 1. Quick Deploy on Vercel

1. Log into your [Vercel Dashboard](https://vercel.com).
2. Click **"Add New..."** -> **"Project"**.
3. Import your GitHub repository:
   - If deploying from the main repo (`naukri_ai_bot_automatic_job_apply`), set **Root Directory** to `frontend`.
   - If deploying from the standalone frontend repo (`naukri_ai_bot_automatic_job_apply_frontend`), leave Root Directory as `./`.
4. Under **Environment Variables**, add the following (optional):
   - `NEXT_PUBLIC_ENGINE_URL`: URL of your backend Engine (defaults to `http://localhost:8000`).
   - `NEXT_PUBLIC_API_KEY`: Secret API key matching your backend `API_KEY` (default: `default-secret-key`).
   - `NEXT_PUBLIC_SUPABASE_URL`: (Optional) Supabase URL if using cloud database.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: (Optional) Supabase Anon Key.
5. Click **"Deploy"**!

---

## 2. Remote Engine Connection

When your dashboard is hosted on Vercel:
- **Direct Browser Connection**: When you open your Vercel URL in your browser, the dashboard can communicate directly with your local engine at `http://localhost:8000` because the browser runs on your local machine.
- **Remote / Cloud Tunnel**: You can also expose your local backend via Ngrok or Cloudflare Tunnel:
  ```bash
  ngrok http 8000
  ```
  Then paste your ngrok URL into the **Local Engine Backend URL** input on the Settings tab in the Web Dashboard.
