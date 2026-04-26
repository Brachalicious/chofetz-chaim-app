# Deploying to Netlify

This guide walks you through publishing the Chofetz Chaim Shmiras HaLashon App to Netlify so you can share a public URL.

---

## What's deployed

- **Static frontend** (from `/public/`) — index.html, app.js, styles.css, daily-lessons.js, etc.
- **3 Netlify Functions** (serverless backend) replacing the Express routes in `src/server.ts`:
  - `/api/chofetz-chaim/chat` → `netlify/functions/chofetz-chaim-chat.ts`
  - `/api/chofetz-chaim/daily-encouragement` → `netlify/functions/chofetz-chaim-daily-encouragement.ts`
  - `/api/chofetz-chaim/speech-lab` → `netlify/functions/chofetz-chaim-speech-lab.ts`

`netlify.toml` wires the URLs together so `public/app.js` keeps calling `/api/...` with no code changes.

---

## One-time setup

### 1. Push the project to GitHub

If you haven't already:

```bash
git add .
git commit -m "Add Netlify deploy config"
git push origin main
```

### 2. Create a Netlify site connected to the repo

1. Go to [app.netlify.com](https://app.netlify.com).
2. Click **Add new site → Import an existing project**.
3. Pick **GitHub** and select this repository.
4. Netlify will auto-detect `netlify.toml`. Confirm:
   - **Build command:** `echo 'No build step required for static assets.'`
   - **Publish directory:** `public`
   - **Functions directory:** `netlify/functions`
5. Click **Deploy site**.

### 3. Add required environment variables

The bot uses the OpenAI API, so it needs your API key.

1. In Netlify, open your site → **Site settings → Environment variables**.
2. Add:
   - `OPENAI_API_KEY` = `sk-...` (same value as in your local `.env`)
3. Trigger a redeploy: **Deploys → Trigger deploy → Deploy site**.

> **Do not commit your `.env` file.** It's in `.gitignore` for a reason — the key must live only in Netlify's env vars.

### 4. (Optional) Claim the subdomain you want

1. **Site settings → Domain management → Options → Edit site name.**
2. Pick something like `shmirashalashon` so the URL is `https://shmirashalashon.netlify.app`.
   - If `shmirashalashon` is already taken on Netlify, try `shmiras-halashon`, `chofetz-chaim-app`, `mysticminded33-shmiras`, etc.

---

## Test your deploy

Once the deploy is green, open your site URL and:

1. The homepage should load (no more "Page not found").
2. Open the daily lesson — you should see Days 1–52 in the "Jump to a specific day" index.
3. Open the Chofetz Chaim bot and send a message. If you get a response, the `OPENAI_API_KEY` env var is wired correctly. If you see a "difficulty responding" fallback, double-check the env var in Netlify settings.

---

## Local development

Use the regular Express server while developing. This does **not** use Netlify credits:

```bash
npm run dev
```

Then open `http://localhost:3000`.

---

## Low-usage workflow

To avoid burning Netlify credits while working in Cursor:

1. Make as many edits as you want locally.
2. Preview locally with the Express server:

```bash
npm run dev
```

3. Deploy only when a batch is ready:

```bash
npm run deploy:prod
```

The site also has a Netlify ignore script at `scripts/netlify-ignore.sh`. Auto-deploy builds will now run only when these deploy-relevant files change:

- `public/**`
- `netlify/**`
- `src/services/**`
- `package.json`
- `package-lock.json`
- `netlify.toml`

Commits that only touch docs, `firestore.rules`, local notes, or other non-deploy files should be skipped by Netlify automatically.

For the biggest savings, keep local commits local while experimenting and push/deploy only after several changes are ready.

---

## Firebase note

The app also uses Firebase for auth + Firestore. Those calls go straight from the browser to Firebase and don't need anything on the Netlify side — they'll keep working out of the box. Just make sure your Firebase project has `*.netlify.app` (or your custom domain) in **Authentication → Settings → Authorized domains**.
