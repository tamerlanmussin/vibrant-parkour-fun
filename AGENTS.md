# Project Rules

## Deployment

- This app is a TanStack Start SSR app with Nitro, not a static Vite SPA.
- Deploy from the repository root: `vibrant-parkour-fun`.
- Vercel framework preset: `tanstack-start`.
- Vercel install command: `npm ci`.
- Vercel build command: `npm run build`.
- `npm run build` must leave a Vercel Build Output API directory at `.vercel/output`. The helper script `scripts/prepare-vercel-output.mjs` converts Nitro's `dist/` output into that shape.
- Leave Vercel output directory automatic/empty so Vercel can detect `.vercel/output`.
- If Vercel shows `404: NOT_FOUND`, check that the project root is correct, `vercel.json` is committed, Vercel did not override the framework/output settings with an old static Vite configuration, and the build log includes `Prepared Vercel Build Output API`.

## Environment Safety

- Never commit real `.env` files or files containing copied secret values.
- `.env`, `.env.*`, `VERCEL_ENV_IMPORT.local.env`, and `VERCEL_ENV_VALUES.local.md` must stay ignored by Git.
- `.env.example` should stay committed with variable names only.
- Public browser variables use `VITE_` and are visible to anyone who opens the site.
- Secret server variables must not use `VITE_`.

## Supabase

- `SUPABASE_URL` and `VITE_SUPABASE_URL` must be the base project URL, for example `https://PROJECT_REF.supabase.co`; do not append `/rest/v1`.
- The project ref is the part before `.supabase.co`. The current local Supabase config uses project ref `gsfqamqanahoqrqqsyop`.
- `SUPABASE_PUBLISHABLE_KEY` and `VITE_SUPABASE_PUBLISHABLE_KEY` are the same anon/public frontend-safe key.
- `SUPABASE_SERVICE_ROLE_KEY` is a secret backend/server-only key. Never add it to `VITE_*`, frontend code, `.env.example` with a value, or public copy-paste docs.
- Only require the service-role key for real backend admin actions that must bypass RLS. Public reads and authenticated user writes should use the anon/public key with RLS policies.
- Migrations are SQL files that create or update Supabase tables. Apply files in `supabase/migrations` to the target Supabase project before deploying if the app reads those tables.

## Gemini

- `GEMINI_API_KEY` is secret backend/server-only and must never use `VITE_*`.
- `GEMINI_MODEL` should default to `gemini-2.5-flash-lite` for student projects unless the user explicitly requests another model.

## Before Deploy

- Confirm the local folder, Git remote, and branch are the intended project.
- Run `npm ci` and `npm run build`.
- Confirm `.env` is ignored and not tracked.
- Confirm `.env.example` is committed.
- Add required variables to Vercel Project Settings -> Environment Variables for Production, Preview, and Development.
- Apply Supabase migrations for `profiles` and `scores` if the target project does not already have those tables.
- Redeploy after changing Vercel environment variables or build settings.
