# rsvpwedday

Family wedding RSVP site. Guests receive a personal link by email and confirm attendance there. The couple manages the guest list, sends the emails, and reads the head count in a password-protected admin.

## Getting started

```
bun install
cp .env.example .env   # fill in DATABASE_URL and the admin/session secrets
bun run db:push        # sync prisma/schema.prisma to the database
bun run db:seed        # placeholder settings, one event, one sample invitation
bun run dev            # http://localhost:3010
```

There is no migrations directory: this is a one-database family site, and `bun run db:push`
keeps the schema in sync. `bun run db:seed` prints a sample RSVP link once it finishes.

## Checks

```
bun run check       # Biome lint and format
bun run typecheck   # tsc --noEmit
bun run test        # Vitest, domain layer
bun run build       # prisma generate && next build
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
