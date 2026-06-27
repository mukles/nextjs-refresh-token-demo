# Refresh Tokens in Next.js — a teaching demo

A small, self-contained **Next.js (App Router)** app that shows how to do refresh
tokens *properly*: **httpOnly cookies**, **refresh-token rotation**, and
**reuse (theft) detection** — the part most tutorials skip.

Backed by **MongoDB via Prisma** (a free Atlas cluster). Clone it, run it,
read it top-to-bottom.

> Built as the companion to a LinkedIn post: "How to manage refresh tokens in Next.js."

---

## The model in 30 seconds

Two tokens, two very different jobs:

| Token | What it is | Lifetime | Stored in | Job |
|-------|-----------|----------|-----------|-----|
| **Access token** | A signed **JWT** | **60s** (short!) | httpOnly cookie, `Path=/` | Proves who you are on every request. Verified with no DB hit. |
| **Refresh token** | An **opaque random string** | 7 days | httpOnly cookie, `Path=/api/auth` | Used *only* to mint a new access token. Lives server-side so it can be revoked. |

Both cookies are `HttpOnly` + `SameSite=Lax` → **JavaScript can't read them** (XSS-safe)
and they're not sent cross-site (CSRF mitigation).

### Why these choices

- **Short access token** → if one leaks, it's useless in a minute.
- **Opaque refresh token (not a JWT)** → its only power is "look me up in the store,"
  so the server stays in full control and can revoke any session instantly.
- **Rotation** → every refresh swaps the refresh token for a brand-new one.
- **Reuse detection** → if an *old* (already-rotated) refresh token ever shows up
  again, that's a stolen copy being replayed → we burn the **entire token family**,
  logging out both attacker and victim. They re-authenticate; the thief is locked out.

---

## Run it

```bash
npm install

# 1. Point at a MongoDB Atlas cluster (free M0 works; it's already a replica set,
#    which Prisma requires). Then set DATABASE_URL:
cp .env.example .env       # edit DATABASE_URL + JWT_SECRET

# 2. Sync the schema and seed the demo user
npm run db:push
npm run db:seed

# 3. Go
npm run dev          # http://localhost:3000
```

The connection string lives in `.env` (`DATABASE_URL`). A free
[MongoDB Atlas](https://www.mongodb.com/cloud/atlas) M0 cluster is the easiest option and
is already a replica set; the same string works locally and on Vercel.

Handy script: `npm run db:studio` (Prisma Studio).

Login is prefilled with the seeded demo user:

```text
email:    demo@example.com
password: password123
```

### See it work

1. Sign in → land on **/dashboard**. Watch the **access-token countdown** tick down from 60s.
2. Click **Call protected API** before it expires → succeeds with the current token.
3. Let it hit `expired`, then click **Call protected API** again → the call 401s, the
   client **silently refreshes** and retries. You stay logged in. (Toast: "Access token silently refreshed".)
4. Click **Force refresh (rotate)** → the refresh-token *value* changes every time.
5. **Prove it's httpOnly:** DevTools → Application → Cookies shows `access_token` /
   `refresh_token` with **HttpOnly** checked. Type `document.cookie` in the console —
   they don't appear.

---

## Architecture

```text
app/
  api/auth/login/route.ts    POST  verify creds (zod + bcrypt) → set access + refresh cookies
  api/auth/refresh/route.ts  POST  rotate refresh token → new cookies, or revoke on reuse
  api/auth/logout/route.ts   POST  revoke the token family + clear cookies
  api/auth/me/route.ts       GET   protected; returns user iff access token valid
  login/page.tsx                   shadcn/ui login form
  dashboard/page.tsx               protected UI: countdown, buttons, live activity log
lib/
  auth.ts        jose sign/verify + cookie writers + TTLs
  tokens.ts      issueRefreshToken / rotateRefreshToken + reuse detection  ← the core
  db.ts          Prisma-backed user + refresh-token queries
  prisma.ts      PrismaClient singleton (hot-reload safe)
  validation.ts  zod request schemas
  api-client.ts  browser fetch wrapper that does the silent refresh-on-401
prisma/
  schema.prisma  User + RefreshToken models (MongoDB)
  seed.mjs       seeds the demo user
proxy.ts         protects /dashboard (Next 16's renamed middleware, Node.js runtime)
```

The whole rotation/theft story lives in [`lib/tokens.ts`](lib/tokens.ts) — start there.

---

## Verify the security claims yourself (curl)

```bash
B=http://localhost:3000

# Log in, save cookies
curl -s -c jar.txt -X POST $B/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@example.com","password":"password123"}'

# Grab the current refresh token, then rotate it once
RT_OLD=$(grep refresh_token jar.txt | awk '{print $NF}')
curl -s -b jar.txt -c jar.txt -X POST $B/api/auth/refresh   # refresh token value now CHANGED

# 🚨 Replay the OLD token = simulated theft → reuse detected, family revoked
curl -s -b "refresh_token=$RT_OLD" -X POST $B/api/auth/refresh
# → 401 {"error":"Refresh token reuse detected...","code":"REUSE_DETECTED"}
```

After that, even the *current* refresh token is dead (the whole family was burned) —
the user must log in again. That's the point.

---

## Deliberately out of scope

Kept out to keep the lesson focused — add these for production:

- **Token-store hardening** — refresh tokens persist in MongoDB, but for production add
  a TTL index on `expiresAt` (or Redis) so expired rows are reaped automatically.
- **CSRF token** — `SameSite=Lax` covers this demo; add a CSRF token for sensitive POSTs.
- **Secret management** — `JWT_SECRET` falls back to a dev string; set a real one via env.
- OAuth/social login, email verification, multi-device session listing.

---

## Stack

Next.js 16 (App Router) · TypeScript · [Prisma](https://www.prisma.io) + MongoDB ·
[`jose`](https://github.com/panva/jose) (JWT) · `bcryptjs` · [`zod`](https://zod.dev) ·
[shadcn/ui](https://ui.shadcn.com) · Tailwind CSS.
