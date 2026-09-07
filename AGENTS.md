# AGENTS.md

Family wedding RSVP site. Guests get a personal link by email (`/rsvp/<token>`) and confirm
attendance per named guest per event. The couple manages everything in a password-protected
`/admin`. There are no anonymous plus-ones: every attendee, including a guest-added companion,
is a named person with contact details.

## Stack

Bun, Next.js 16 (App Router, `src/app`, `src/proxy.ts`, Turbopack), React 19, Prisma 7 with
`@prisma/adapter-pg`, Tailwind 4, Biome, Vitest, Resend + React Email.

## Commands

- `bun install` — installs and runs `postinstall` (`prisma generate`)
- `bun run dev` — Next dev server on port 3010
- `bun run build` — `prisma generate && next build`
- `bun run check` / `bun run check:fix` — Biome lint and format
- `bun run typecheck` — `tsc --noEmit`
- `bun run test` — Vitest (domain layer only; no DOM)
- `bun run db:push` — sync `prisma/schema.prisma` to the database (no migrations directory; this
  is a one-database family site). On Vercel the `vercel-build` script runs the same push before
  `next build` whenever a direct database url resolves, so a production deployment syncs the
  database and a preview without one still builds.
- `bun run db:seed` — placeholder settings, one `wedding` event, one sample invitation
- `bun run db:studio` — Prisma Studio

## Derived status

`Invitation` has no stored status column. `src/domain/invitation.ts#getInvitationStatus` derives
it: `pending` while `respondedAt` is null, else `accepted` if any guest has any `ACCEPTED`
attendance, else `declined`. Recompute it, never store it.

## Admin UI

`/admin` is built on shadcn/ui; components live in `src/components/ui` (`components.json` pins the
Nova preset, radix base, neutral colour). shadcn's tokens live on `:root` in `globals.css` (they
don't collide with the public site's own `--wed-*`/`--color-*` names) so Radix's portalled content
(Select, Dialog, AlertDialog, DropdownMenu, the Toaster — all rendered on `document.body`, outside
`.admin-root`) resolves them too; only the base-layer rules that paint `.admin-root`'s own
background/text stay scoped to that class. The Guests page (`src/app/admin/guests`) replaces the
old separate Import/Export pages; `/admin/import` now redirects there and `/admin/export` is
unchanged. The invitation create/edit form is a single `InvitationDialog` component
(`src/app/admin/invitations/invitation-dialog.tsx`); the `/admin/invitations/new` and
`/admin/invitations/[id]` routes redirect to `/admin?invitation=new|<id>`, which opens it.

`/admin/website` is a section index linking to one page per home-page section — `hero`, `story`,
`events`, `gallery`, `rsvp`, `theme` — each saving through its own server action in
`src/app/admin/website/actions.ts`. `events` edits the `Event` rows and their translations (moved
here from Settings, which keeps only couple names, RSVP deadline, and reply-to). Every image field
(hero, milestones, gallery) is `src/components/admin/image-field.tsx` or `image-list-field.tsx`:
drag-and-drop upload via `src/lib/blob.ts#uploadImage` when `BLOB_READ_WRITE_TOKEN` is set, always
with a plain URL input underneath so a pasted link keeps working either way. Before either field
calls `uploadImage`, `src/lib/downscale-image.ts#downscaleImage` shrinks a file 1 MB or larger to
fit under the 8 MB upload cap: draws it to a canvas capped at 2400px on the long edge and
re-encodes at ~0.85 quality JPEG, except PNG stays PNG (it may carry transparency) and GIF/SVG
pass through untouched. It never throws — a decode or canvas failure just returns the original
file, so a browser without canvas support still uploads, it just skips the shrink.

`/admin/website/emails` edits the invite, reminder and confirmation emails per locale: subject,
heading and a rich-text message, stored in `EmailTemplate` (empty keeps the dictionary default).
`src/domain/email-copy.ts#resolveEmailCopy` merges override and default and substitutes
`{name}`, `{coupleNames}` and `{deadline}`. All three kinds render through one template,
`src/emails/invitation-email.tsx`, themed by `src/emails/theme.ts` (an email-safe copy of each
`[data-theme]` palette, since mail clients cannot load the web fonts) and framed with the couple
names and hero photo. The page previews the result in an iframe served by
`/admin/website/emails/preview` and can send a test to any address; test sends are not written
to `EmailLog`.

Every website-section form and the Settings page save through `src/components/admin/use-autosave.ts`,
a debounced (1.5s default) autosave hook: it skips the initial mount, only fires once the value
differs from the last saved snapshot, serialises overlapping saves (a value that arrives mid-save
is queued and run once the current save settles), and flushes immediately on `visibilitychange`
to hidden and on `beforeunload`. `src/components/admin/save-status.tsx` renders the resulting
saving/saved/error state next to a secondary "Save now" button, which stays as a manual fallback
and the retry action on error. The invitation dialog and the Guests CSV import are deliberate,
one-shot actions and do not autosave.

## Translations

`src/i18n/dictionaries/en.ts` is the source of truth (`Dictionary` type = `typeof en`). `de.ts`
and `ku.ts` are typed `: Dictionary`, so a missing key fails `tsc`. The admin UI is English only
and does not use the dictionary. **The German and Kurmanji copy has not been proofread by a
native speaker** — get that review before any real invite/reminder email goes out.

## Environment

`DATABASE_URL`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `APP_URL`, `EMAIL_FROM`, and optional
`RESEND_API_KEY` and `BLOB_READ_WRITE_TOKEN` (a Vercel Blob store token; when unset, the admin's
image fields fall back to a plain URL input instead of drag-and-drop upload — see
`src/lib/blob.ts`). `src/lib/database-url.ts#resolveDatabaseUrl` also accepts `POSTGRES_URL` and any
prefixed `*_POSTGRES_URL` or `*_DATABASE_URL` that a Vercel storage integration injects, as long
as it is a direct `postgres://` url; the `prisma+postgres://` Accelerate url is ignored because
the pg adapter needs a TCP connection (unset in development: emails are logged to the console instead of sent). Parsed
once in `src/lib/env.ts`; import `env` from there, never read `process.env` elsewhere.

## Verification

Every test, typecheck, build, and CI run happens on Mac Studio or in GitHub Actions
(`.github/workflows/ci.yml`), never on a MacBook. CI builds with no environment variables at all: `env` and `db` are parsed and created on first
access, so a build never needs runtime secrets or a database.

## No personal data in code

Names, the venue, dates, and every other guest- or couple-specific fact live in the database, not
in source, so the repository can be made public; a fresh checkout has no wedding details until it is seeded
or configured.
