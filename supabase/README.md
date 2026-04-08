## Phase 1 migration

This repo now supports an optional Supabase-backed data source.

Nothing switches to Supabase until these env vars are set:

```bash
VITE_DATA_SOURCE=supabase
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_ANON_KEY=...
```

If Supabase is missing or returns an error, the app falls back to `public/wine-entries.json`.

### Recommended rollout

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor.
3. Generate a seed file with `npm run build:supabase:seed`.
4. Run `supabase/seed.sql` in the SQL editor.
5. Add the three env vars locally.
6. Run the app and confirm list screens behave the same.
7. Add the same env vars in Vercel only after local verification.

### Suggested import shape

Each row in `public.wine_entries` should match the existing `WineEntry` structure:

- scalar fields stay scalar
- `tags` is a `text[]`
- `details` is `jsonb`
- `tastingProfile` is `jsonb`
- `grapeCard` is `jsonb`

This keeps the migration low-risk because the UI can reuse the existing `WineEntry` shape without a large rewrite.
