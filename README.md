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
