# rsvpwedday

Bun/Turbo monorepo for a wedding planning company:

| App | Port | Who |
|---|---|---|
| `apps/client` | 3010 | Couple CMS + guest RSVP/gifts/memories (the live product) |
| `apps/console` | 3011 | Planner OS (requests, partners, AI) |
| `apps/website` | 3012 | Company marketing site |

## Getting started

```
bun install
cp apps/client/.env.example apps/client/.env   # DATABASE_URL and admin/session secrets
bun run db:push        # sync apps/client/prisma/schema.prisma
bun run db:seed        # placeholder settings, one event, one sample invitation
bun run dev            # client app at http://localhost:3010
bun run dev:console    # http://localhost:3011
bun run dev:website    # http://localhost:3012
```

There is no migrations directory: `bun run db:push` keeps the schema in sync. `bun run db:seed`
prints a sample RSVP link once it finishes.

## Checks

```
bun run check       # Biome lint and format (repo root)
bun run typecheck   # tsc in each app
bun run test        # Vitest in apps/client (domain layer)
bun run build       # all apps via Turbo
```

See `AGENTS.md` for the stack, the derived invitation-status rule, where translations live, and
the environment variable list.

## Opening effects

Choose an opening in **Admin → Settings → Effects**, or preview it with `?opening=seal`,
`?opening=bloom`, `?opening=monogram`, or `?opening=mediterranean`. A preview forces the cover
back on even if it already opened during the visit. `?opening=none` skips the cover.

**Mediterranean Bloom** is a generated envelope film with a fixed cream, blue, and lemon palette.
Pair it with `?theme=mediterranean` to preview the matching page. Its generic media lives in
`public/openings/mediterranean-bloom`; names and initials remain live text from settings.
The first frame was made with Nano Banana 2 Lite and animated with Seedance 2.5. Serving the
finished media needs no Replicate or Blob credentials.

The film downloads on the guest's click. Its poster remains visible until playback starts;
completion reveals the page, and Skip, Escape, playback errors, or a bounded timeout can also
end the cover. The opening speed controls playback rate. Reduced motion bypasses the cover.
`MEDITERRANEAN_BLOOM` is an additive Prisma enum value; the deployment's existing schema push
must run before saving this choice against an older database.
