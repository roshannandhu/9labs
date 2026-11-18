# Nine Labs — Go-Live Runbook

Step-by-step setup to put **ninelabsolutions.ae** live: domains, e-mail, Resend, Supabase, Google
sign-in, Cloudflare and the first deploy. Written so an AI agent (Antigravity) can carry it out from
top to bottom with the owner answering questions.

**End state**

| What | Value |
|---|---|
| Website | `https://ninelabsolutions.ae` (+ `www.`) on Cloudflare Workers (worker `ninelabs`) |
| `.com` domain | 301-redirects to `https://ninelabsolutions.ae` |
| Mailboxes | 5 mailboxes on **Namecheap Private Email**, primary `info@ninelabsolutions.ae` |
| Automated e-mail | Sent by **Resend** **from** `no-reply@ninelabsolutions.ae`, **Reply-To** `info@ninelabsolutions.ae` |
| E-book PDFs | Sent automatically from `no-reply@` when a visitor requests a book |
| Admin login | `/admin` → **Continue with Google**, only for listed e-mails |
| Database / auth | Supabase |
| File storage | Cloudflare R2 |

---

## 0. Rules for the agent — read first

1. **Ask, never guess.** Every login, password, API key, e-mail address and choice comes from the
   owner. At the start of each phase, ask for **everything that phase needs in one message**
   (the `ASK` lines below), then work without interrupting.
2. **Secrets never go into committed files.** Only these places may hold secrets:
   `.env.local` (dev), `.env.production.local` (build), `wrangler secret`, and the dashboards
   themselves. All `.env*` files are git-ignored except `.env.example` — keep `.env.example` empty.
   Never paste secrets into commit messages, docs, issues or chat logs you save.
3. **Stop for an explicit "yes"** before anything that can break e-mail or the site:
   changing nameservers, deleting/editing any existing DNS record, running `pnpm deploy`, committing.
4. **Tick the boxes** (`- [ ]` → `- [x]`) in this file as you go, so a later session can resume.
   Don't write secret values into this file — only "done".
5. If a dashboard looks different from what's written here (they change), follow the dashboard and
   note the difference in the **Notes** section at the bottom.
6. If something fails twice, stop and show the owner the exact error instead of improvising.

---

## Phase 1 — Inventory (read-only, nothing changes)

**ASK the owner:**
- Exact spelling of both domains (main is `ninelabsolutions.ae`; the `.com` was written as
  `ninelabsolution.com` / `ninlabsolution.com` — confirm which, letter by letter).
- AE Server (aeserver.com) login — e-mail + password (+ 2FA code when prompted).
- Namecheap login — username + password (+ 2FA code).
- The 5 mailbox addresses, and which domain they are on (`.ae`, `.com`, or both).
- Do they already have a Cloudflare account? (login, or create one in Phase 2)

Steps:
- [ ] Log in to **AE Server** → Domains → `ninelabsolutions.ae`. Write down the **current nameservers**.
- [ ] Open its **DNS / Zone editor** (if DNS is hosted at AE Server). Screenshot or copy **every record**
      (type, name, value, priority, TTL) into the **Notes** section below.
- [ ] Repeat both for the `.com` domain.
- [ ] Log in to **Namecheap → Private Email** → the mail subscription → **DNS settings / Setup**.
      Write down the records Namecheap says are required. They are normally:

      | Type | Name | Value | Priority |
      |---|---|---|---|
      | MX | `@` | `mx1.privateemail.com` | 10 |
      | MX | `@` | `mx2.privateemail.com` | 10 |
      | TXT | `@` | `v=spf1 include:spf.privateemail.com ~all` | — |
      | TXT | `default._domainkey` | `v=DKIM1;k=rsa;p=…` (copy the exact key from Namecheap) | — |
      | CNAME | `mail` | `privateemail.com` | — |
      | CNAME | `autodiscover` | `privateemail.com` | — |
      | CNAME | `autoconfig` | `privateemail.com` | — |

      **Use what the Namecheap panel shows** if it differs from the table.
- [ ] Note any other records that exist today (old website A record, verification TXT records, etc.).

---

## Phase 2 — Move DNS to Cloudflare (keeps mail working)

Why: the site runs on Cloudflare Workers, and a Workers custom domain needs the domain's DNS on
Cloudflare. The domains **stay registered at AE Server** — only the nameservers change.

**ASK the owner:** Cloudflare login (or permission to create an account with `info@ninelabsolutions.ae`).

- [ ] Cloudflare dashboard → **Add a domain** → `ninelabsolutions.ae` → **Free** plan.
- [ ] Cloudflare scans existing records. Compare with the Phase 1 inventory and **add anything missing**,
      especially every mail record from the Namecheap table.
      All mail records (MX, the `mail`/`autodiscover`/`autoconfig` CNAMEs) must be **DNS only (grey cloud)**.
- [ ] Make sure there is **exactly one** TXT record at `@` starting with `v=spf1`.
- [ ] Remove any old A/AAAA/CNAME for `@` and `www` that pointed to an old website (**ask first**) —
      the Worker will own these in Phase 7.
- [ ] Cloudflare shows **two nameservers** (like `xxx.ns.cloudflare.com`). Copy them.
- [ ] **STOP — ask the owner "change nameservers now?"** Explain: e-mail keeps working only because the
      mail records were copied; a few hours of propagation is normal for `.ae`.
- [ ] AE Server → `ninelabsolutions.ae` → **Nameservers** → custom → enter the two Cloudflare nameservers → save.
- [ ] Repeat the whole phase for the `.com` domain (add domain, copy records, switch nameservers).
- [ ] Wait until Cloudflare shows the domain as **Active** (can take up to 24 h; usually 1–4 h).
- [ ] Test mail: send an e-mail from a personal Gmail **to** `info@ninelabsolutions.ae`, and reply from
      `info@` back. Both must arrive. If not → see Troubleshooting → "Mail broke".

---

## Phase 3 — Resend (sends as no-reply@)

`no-reply@ninelabsolutions.ae` does **not** need a mailbox — Resend may send as any address on a
verified domain. Replies go to `info@` because the site sets Reply-To (`MAIL_REPLY_TO`).

**ASK the owner:** Resend login (or permission to sign up at resend.com with `info@ninelabsolutions.ae`).

- [ ] resend.com → **Domains → Add Domain** → `ninelabsolutions.ae`, region **Ireland (eu-west-1)**.
- [ ] Resend shows its DNS records. Add each one in **Cloudflare → DNS** for `ninelabsolutions.ae`,
      **DNS only (grey cloud)**. They are usually:

      | Type | Name | Value |
      |---|---|---|
      | MX | `send` | `feedback-smtp.eu-west-1.amazonses.com` (priority 10) |
      | TXT | `send` | `v=spf1 include:amazonses.com ~all` |
      | TXT | `resend._domainkey` | `p=MIGf…` (copy exactly from Resend) |

      Copy the values **from the Resend screen**, not from this table.
- [ ] Add DMARC if no `_dmarc` record exists yet:
      TXT `_dmarc` → `v=DMARC1; p=none; rua=mailto:info@ninelabsolutions.ae`
- [ ] **Do not** add a second SPF at `@`, and **do not** touch the root MX records. Resend's records
      live on the `send` subdomain, so they don't clash with Namecheap mail.
- [ ] Resend → **Verify DNS records**. Wait until the domain is **Verified** (5–60 min).
- [ ] Resend → **API Keys → Create** → permission **Sending access**, domain `ninelabsolutions.ae`.
      Copy the key (`re_…`). It's shown once — give it to the owner to store in their password manager,
      and keep it for Phase 7 as `SMTP_PASS`.
- [ ] Optional: Namecheap Private Email → create an **alias / forwarder** `no-reply@ninelabsolutions.ae`
      → `info@ninelabsolutions.ae` (only if the plan allows aliases). This catches people who write to
      no-reply directly. Not required for sending.

---

## Phase 4 — Supabase (database + auth)

**ASK the owner:** Supabase login. Is there already a Supabase project for this site? (If yes, which one.)

- [ ] supabase.com → the project (or **New project**, region closest to UAE, e.g. Mumbai / Frankfurt;
      save the database password in the owner's password manager).
- [ ] **SQL Editor** → run the migrations from this repo **in order**, one at a time:
      1. `supabase/migrations/0001_init.sql`
      2. `supabase/migrations/0002_quiz_ai_result.sql`
      3. `supabase/migrations/0003_ai_kb.sql`
      4. `supabase/migrations/0004_ai_calls.sql`

      Before 0001: check **Table Editor** — if tables like `admins` already exist, 0001 was applied
      before; skip it and continue from the first one not applied. Show the owner any SQL error.
- [ ] **Project Settings → API** (or **API Keys**): note
      - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
      - Publishable key → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
      - Secret key → `SUPABASE_SECRET_KEY` (full access — secret)
      - The **project ref** = the part before `.supabase.co` in the URL (needed in Phase 5).
- [ ] **Authentication → URL Configuration**
      - Site URL: `https://ninelabsolutions.ae`
      - Redirect URLs: add `https://ninelabsolutions.ae/admin/`, `https://www.ninelabsolutions.ae/admin/`
        and `http://localhost:3002/admin/`
- [ ] **Authentication → SMTP Settings** → enable custom SMTP (so Supabase's own auth e-mails also come
      from your domain):
      - Host `smtp.resend.com`, Port `465`, Username `resend`, Password = the Resend key
      - Sender e-mail `no-reply@ninelabsolutions.ae`, Sender name `Nine Labs Solutions`

---

## Phase 5 — Google sign-in for the admin

The "Continue with Google" button is already in the code (`src/studio/SignIn.tsx`). Only the Google
and Supabase settings are missing.

**ASK the owner:** which Google account should own the Google Cloud project (log in with it), and
which Google e-mail(s) may enter the admin (these become `ADMIN_EMAILS`).

- [ ] console.cloud.google.com → project picker → **New project** → name `Nine Labs Admin`.
- [ ] **APIs & Services → OAuth consent screen** (or **Google Auth Platform → Branding**):
      - User type **External**
      - App name `Nine Labs Admin`, support e-mail `info@ninelabsolutions.ae`
      - Authorized domain: `ninelabsolutions.ae` (and `supabase.co` if it asks)
      - Developer contact: `info@ninelabsolutions.ae`
      - Scopes: only the defaults (`email`, `profile`, `openid`)
      - **Publish app** → status **In production** (otherwise only listed test users can sign in).
- [ ] **Credentials → Create credentials → OAuth client ID** → **Web application**
      - Name: `Supabase`
      - Authorized JavaScript origins: `https://ninelabsolutions.ae`
      - Authorized redirect URI: `https://<PROJECT-REF>.supabase.co/auth/v1/callback`
- [ ] Copy **Client ID** and **Client secret**.
- [ ] Supabase → **Authentication → Sign In / Providers → Google** → Enable → paste Client ID + secret → Save.

---

## Phase 6 — Cloudflare R2 (file storage) + AI keys + generated secrets

**ASK the owner:** Groq API key(s) (console.groq.com) and Gemini API key(s) (aistudio.google.com).
Several keys per provider may be given, comma-separated. If they have none, the quiz still works
with its built-in backup result — mark AI as "later".

- [ ] Cloudflare → **R2** → enable R2 (needs a card on file; free tier covers this site) →
      **Create bucket** `ninelabs-files` (location: automatic).
- [ ] R2 → **Manage API tokens → Create API token** → permission **Object Read & Write**, limited to
      bucket `ninelabs-files`. Note:
      - Account ID → `R2_ACCOUNT_ID`
      - Access Key ID → `R2_ACCESS_KEY_ID`
      - Secret Access Key → `R2_SECRET_ACCESS_KEY`
      - Bucket name → `R2_BUCKET`
- [ ] Generate two random secrets in the terminal (run twice, use a different output for each):
      ```
      node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
      ```
      → `APP_SECRET` and `CRON_SECRET`.
      **Never change `APP_SECRET` after launch** — it signs every e-book download link already sent.

---

## Phase 7 — Configure and deploy

### 7.1 The full list of settings

| Key | Value | Secret? |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://ninelabsolutions.ae` (no trailing slash) | no |
| `NEXT_PUBLIC_SUPABASE_URL` | from Phase 4 | no |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | from Phase 4 | no |
| `NEXT_PUBLIC_SAMPLE_SEED` | *(empty in production)* | no |
| `SUPABASE_SECRET_KEY` | from Phase 4 | **yes** |
| `APP_SECRET` | from Phase 6 | **yes** |
| `CRON_SECRET` | from Phase 6 | **yes** |
| `ADMIN_EMAILS` | owner Google e-mail(s), comma-separated — **must not be empty** | no |
| `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET` | from Phase 6 | **yes** (keys) |
| `SMTP_HOST` | `smtp.resend.com` | no |
| `SMTP_PORT` | `465` | no |
| `SMTP_USER` | `resend` | no |
| `SMTP_PASS` | the Resend key `re_…` | **yes** |
| `MAIL_FROM` | `no-reply@ninelabsolutions.ae` | no |
| `MAIL_FROM_NAME` | `Nine Labs Solutions` | no |
| `MAIL_REPLY_TO` | `info@ninelabsolutions.ae` | no |
| `ALLOW_SAMPLE_SEED` | *(empty in production)* | no |
| `GROQ_API_KEY` / `GEMINI_API_KEY` | from Phase 6 (or empty) | **yes** |
| `GROQ_MODEL` / `GEMINI_MODEL` / `GEMINI_EMBED_MODEL` / `AI_DAILY_CAP` | leave empty (code defaults) | no |

> ⚠️ `ADMIN_EMAILS` empty = the **first person who signs in becomes owner** (`src/server/auth.ts`).
> It must be set before the first deploy.

### 7.2 Local build file

- [ ] Create `.env.production.local` in the repo root with **every key above** (copy `.env.example`,
      fill production values). It is git-ignored. `NEXT_PUBLIC_*` values are baked into the build from here.
- [ ] Check: `git status` must **not** list `.env.production.local`.

### 7.3 Worker secrets (runtime)

- [ ] `npx wrangler login` (opens the browser — the owner approves).
- [ ] Write all keys from the table (including the `NEXT_PUBLIC_*` ones — the scheduled job reads
      `NEXT_PUBLIC_SITE_URL` at runtime) into a temporary JSON file **outside the repo**, e.g.
      `%TEMP%\ninelabs-secrets.json`:
      ```json
      { "NEXT_PUBLIC_SITE_URL": "https://ninelabsolutions.ae", "SMTP_HOST": "smtp.resend.com", "...": "..." }
      ```
- [ ] The first time, the worker may not exist yet — do 7.4 first, then come back.
      `npx wrangler secret bulk "%TEMP%\ninelabs-secrets.json"`
- [ ] **Delete the temp JSON** right after.
- [ ] `npx wrangler secret list` — every key is listed.

### 7.4 Commit and deploy

- [ ] `git status` → show the owner the pending changes. **Ask before committing.**
- [ ] Make sure the branch being deployed is the one the owner wants live (currently work is on
      `claude/ai-quiz`; main branch is `claude/client-animation-books-plan-grtwcu`). **Ask.**
- [ ] Checks: `pnpm lint`, `pnpm test`, `npx tsc --noEmit` — all must pass.
- [ ] **Ask "deploy now?"**, then `pnpm deploy`.
- [ ] If the secrets weren't uploaded yet (first deploy), do 7.3 now, then `pnpm deploy` once more.

### 7.5 Connect the domain

- [ ] Cloudflare → **Workers & Pages → ninelabs → Settings → Domains & Routes → Add → Custom domain**
      → `ninelabsolutions.ae`. Then again for `www.ninelabsolutions.ae`.
- [ ] Open `https://ninelabsolutions.ae` — the site loads with a valid padlock.

### 7.6 Redirect the .com

- [ ] Cloudflare → the `.com` zone → **DNS** → add `A @ 192.0.2.1` **Proxied (orange)** and
      `A www 192.0.2.1` **Proxied** (placeholder addresses; the redirect answers first).
- [ ] **Rules → Redirect Rules → Create** → "All incoming requests" →
      Dynamic → expression `concat("https://ninelabsolutions.ae", http.request.uri.path)`,
      status **301**, preserve query string ✔.
- [ ] If the `.com` has **no** mailboxes: add TXT `@` → `v=spf1 -all` (stops spammers faking it).
      If it **has** mailboxes, keep its Namecheap mail records instead.
- [ ] Test: `https://<the .com>/about` → lands on `https://ninelabsolutions.ae/about`.

---

## Phase 8 — Admin settings and smoke test

- [ ] `https://ninelabsolutions.ae/admin` → **Continue with Google** with the first `ADMIN_EMAILS`
      address → lands on the Dashboard as **owner**.
- [ ] Admin → **Settings → Team** → add the other admins' Google e-mails.
- [ ] Admin → **Books → Delivery** → admin alert e-mail `info@ninelabsolutions.ae`.
- [ ] Admin → **Quiz** → set the mode to AI + scoring (if AI keys were given). The Dashboard's
      Quiz AI health panel should show green.
- [ ] Upload the e-book PDFs and covers if not done, then **Publish**.

**Tests** (tick each):
- [ ] Health + test mail (sends to the first `ADMIN_EMAILS` address):
      ```
      curl -H "Authorization: Bearer <CRON_SECRET>" "https://ninelabsolutions.ae/api/health/?mail=1"
      ```
      Response shows `env`, `db`, `r2` OK and `mail: { attempted: true, ok: true, logged: false }`.
- [ ] In that e-mail (Gmail → ⋮ → **Show original**): From `Nine Labs Solutions <no-reply@ninelabsolutions.ae>`,
      Reply-To `info@ninelabsolutions.ae`, **SPF PASS, DKIM PASS, DMARC PASS**.
- [ ] Request an e-book on the site with a personal address → the PDF (attachment or link) arrives;
      Admin → Inbox shows it **sent**.
- [ ] **Reply** to that e-mail → it arrives in `info@ninelabsolutions.ae`.
- [ ] Do the quiz once → a result appears; "e-mail me this plan" arrives.
- [ ] Top bar **About** on the homepage scrolls to About; on `/about` it stays on `/about`.
- [ ] `.com` redirects (7.6).
- [ ] Within 15 minutes: Cloudflare → ninelabs → **Logs** shows the scheduled run hitting `/api/cron/tick/`.
- [ ] mail-tester.com: send the e-book e-mail to the address it gives → score **9/10 or higher**.

---

## Phase 9 — Cleanup

- [ ] Google login confirmed working → remove the temporary password sign-in:
      in `src/studio/SignIn.tsx` delete the `PasswordSignIn` function (the block under the
      "ponytail: a temporary password sign-in" comment) and the `<PasswordSignIn />` line that renders it.
      Then `npx tsc --noEmit`, `pnpm lint`, **ask**, commit, `pnpm deploy`.
- [ ] Supabase → **Authentication → Providers → Email**: turn off "Allow new users to sign up" with
      e-mail/password (Google stays on).
- [ ] Confirm the temp secrets JSON is deleted and no `.env*.local` file is in git (`git ls-files | findstr env`
      → only `.env.example`).
- [ ] Hand the owner a list of every account created (Cloudflare, Resend, Supabase, Google Cloud) —
      **names only, no passwords** — so they can store them.

---

## Appendix A — Final DNS for `ninelabsolutions.ae` (Cloudflare)

| Type | Name | Value | Proxy | Owner |
|---|---|---|---|---|
| (Worker) | `@`, `www` | added by Workers custom domain | proxied | Website |
| MX | `@` | `mx1.privateemail.com` (10), `mx2.privateemail.com` (10) | DNS only | Namecheap mail |
| TXT | `@` | `v=spf1 include:spf.privateemail.com ~all` (the only root SPF) | — | Namecheap mail |
| TXT | `default._domainkey` | Namecheap DKIM key | — | Namecheap mail |
| CNAME | `mail`, `autodiscover`, `autoconfig` | `privateemail.com` | DNS only | Namecheap mail |
| MX | `send` | `feedback-smtp.eu-west-1.amazonses.com` (10) | DNS only | Resend |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` | — | Resend |
| TXT | `resend._domainkey` | Resend DKIM key | — | Resend |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:info@ninelabsolutions.ae` | — | Both |

After ~2 weeks of clean DMARC reports, the owner may tighten `p=none` → `p=quarantine`.

## Appendix B — Troubleshooting

| Symptom | Cause / fix |
|---|---|
| **Mail broke** after the nameserver switch | A Namecheap record wasn't copied, or MX/CNAMEs are proxied (orange). Re-check Phase 1 table in Cloudflare DNS, set grey cloud. |
| Resend domain stuck "Pending" | Record name typed as `send.ninelabsolutions.ae` → Cloudflare already appends the domain; use just `send`. Same for `resend._domainkey`. Wait up to 1 h. |
| E-mails show as **logged**, not sent | `SMTP_HOST` missing on the Worker → `npx wrangler secret list`, re-upload, redeploy. |
| Mail fails with an auth error | `SMTP_USER` must be literally `resend`; `SMTP_PASS` is the API key. Key must have access to this domain. |
| Lands in spam | Check SPF/DKIM/DMARC in "Show original"; run mail-tester; make sure only **one** root SPF exists. |
| Google: `redirect_uri_mismatch` | The redirect URI in Google Cloud must be exactly `https://<ref>.supabase.co/auth/v1/callback`. |
| After Google login, back on the sign-in page / wrong site | Supabase → URL Configuration: Site URL + Redirect URLs (Phase 4). |
| "This e-mail isn't on the team" | Add it in Admin → Settings → Team (or `ADMIN_EMAILS` before the first owner exists). |
| Uploads fail | R2 secrets wrong/missing, or the token isn't scoped to the bucket. `/api/health/` shows `r2`. |
| Site shows old content / localhost links | `NEXT_PUBLIC_*` came from the wrong file at build → fix `.env.production.local`, `pnpm deploy` again. |
| Download links in old e-mails stopped working | `APP_SECRET` was changed. Never rotate it after launch unless links must be killed. |

## Notes (agent writes here — no secrets)

- DNS inventory (Phase 1):
- Dashboard differences found:
- Decisions made by the owner:
