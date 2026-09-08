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

## Per-invitation events

An invitation's event list is derived, not stored: `src/domain/invitation-events.ts#invitedEventIds`
is the union of its guests' `EventAttendance` rows, and a guest with no row for an event was not
invited to it. The invitation dialog's "Invited to" checkboxes and the CSV `events` column (event
slugs separated by `;`, empty = every event; the Guests page serves a filled-in template at
`/admin/guests/template`) decide which rows are created; `updateInvitation` re-syncs every guest of
the household, companions included. The RSVP page, the invite/reminder emails and the export all
read the derived list, so nothing else needs to know.

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
background/text stay scoped to that class. `/admin` is the dashboard — reply counts, per-event headcount, and the two bulk sends — and
`/admin/guests` is the guest list: every invitation, filtered and searchable, with the per-row
actions. Import and export are occasional jobs, so they are buttons there that open a dialog
(`ImportDialog`, `ExportDialog` in `guests-list.tsx`) rather than cards above the list;
`/admin/import` redirects to the page and `/admin/export` still serves the CSV. The invitation
create/edit form is a single `InvitationDialog` component
(`src/app/admin/invitations/invitation-dialog.tsx`); the `/admin/invitations/new` and
`/admin/invitations/[id]` routes redirect to `/admin/guests?invitation=new|<id>`, which opens it.

`/admin/pages` is the site's content manager. Every public page is a `Page` row holding ordered
`Block` rows, so a page is whatever blocks it carries and a block can be moved, inserted between
two others, or removed on its own. `home` is the root route; any other slug is served by
`src/app/[slug]/page.tsx`, and both render through one component,
`src/components/site/site-page.tsx`, so nav, theme, footer and effects can never drift between
routes. `src/domain/blocks.ts` is the single registry: it declares, per `BlockType`, which fields
the editor shows and the renderer reads, whether the type is built-in (one per page), its default
heading key and its default anchor. Adding a type means a `BlockType` value, a definition there, an
editor case and a case in `src/components/site/page-blocks.tsx` — nothing else.

Seven types are built in and display data owned by other tables: `HERO` (photo and tagline on the
block, couple names and countdown from settings and events), `STORY` (heading and intro on the
block, milestones from `StoryMilestone`), `EVENTS`, `GALLERY` (photos on the block), `FAQ`
(questions as `BlockItem` rows), `RSVP` and `GIFTS` (heading and intro on the block, entries from
`Gift`). Four are free content the couple adds anywhere: `TEXT`,
`CARDS` (what a travel-guide section was — heading, intro, and cards with optional links and
photos), `IMAGE` and `PAGE_LINK` (a teaser pointing at another page). Every text field is the
rich-text editor; `anchor` is the block's `#fragment` and is unique within its page, and an empty
anchor keeps the block off the top bar without hiding it. A block with nothing in it renders
nothing and gets no nav link (`src/lib/page-content.ts#blockHasContent`), so an unfilled block
never leaves a heading over an empty section.

The editor (`src/app/admin/pages/[id]`) has one language switcher at the top driving every block
below it, blocks reorder by dragging their handle (dnd-kit), and **each block saves itself** —
`updateBlock` names one block id and ignores every field its type does not declare, so a stale
client can never blank a neighbour the way the old whole-page forms could. `prisma/page-migration.ts`
moved the fixed home page and the guide into blocks once, guarded on the page count and run from
both `scripts/prepare-database.ts` and the dev seed; the `SiteContent*`, `GuideSection` and
`FaqEntry` tables still exist but nothing reads them.

`/admin/settings` keeps the couple names, RSVP deadline and reply-to, and indexes the four
sections that blocks display but do not own: `events`, `milestones`, `theme` and `effects`,
registered in `src/app/admin/settings/sections.ts`. `/admin/website/*` is a catch-all that
redirects each old path to whichever page now owns it. Every image field (hero, milestones, cards, gallery) is `src/components/admin/image-field.tsx` or
`image-list-field.tsx`, and the music track is `audio-field.tsx`; all three start from
`media-drop-zone.tsx`. Empty, a field is a drop zone uploading via `src/lib/blob-upload.ts` when
`BLOB_READ_WRITE_TOKEN` is set (a browser-to-Blob client upload authorised by the token route
`src/app/admin/upload/route.ts`, so files never pass through a Server Action and its 4.5 MB Vercel
body cap); filled, it shows the picture (or a player and file name) with Replace and Remove. The
URL is never displayed: "Use a link" / "Add by link" reveals a paste box, which is also the whole
field when Blob is not configured. The gallery grid reorders by drag and drop. Before either field
calls `uploadImage`, `src/lib/downscale-image.ts#downscaleImage` shrinks a file 1 MB or larger to
fit under the 8 MB upload cap: draws it to a canvas capped at 2400px on the long edge and
re-encodes at ~0.85 quality JPEG, except PNG stays PNG (it may carry transparency) and GIF/SVG
pass through untouched. It never throws — a decode or canvas failure just returns the original
file, so a browser without canvas support still uploads, it just skips the shrink.

Every image field also offers "Generate illustration" when `REPLICATE_API_TOKEN` is set — both
fields on a block, each card inside one, and each story milestone. The browser posts only the
block's type and its own English copy to `src/app/admin/generate-image/route.ts`; the route reads
the theme, couple names and event venues from the database and builds the prompt with
`src/domain/illustration-prompt.ts`, so the art direction cannot be steered from the client. That
module holds one art direction per `SiteTheme` — palette copied from the `[data-theme]` blocks the
same way `src/emails/theme.ts` copies it for mail clients — plus a brief and aspect ratio per
`BlockType` and a fixed rules block. The rules are what make a set of images look like a set, and
they are load-bearing in a non-obvious way: a style line that names a medium as an object
("screenprint", "paper foxing", "wet edges") makes the model paint the artefact — a sheet with a
margin, or literal off-register plates — which `object-cover` then crops at random. Describe the
palette, the marks and the light, never the printing process. `src/lib/replicate.ts` calls the
official `google/nano-banana-2-lite` model over plain fetch (one POST, `Prefer: wait`, then a short
poll). Replicate's output URL expires within the hour, so `src/lib/blob.ts#copyImageToBlob` copies
the result into the same Blob store as an uploaded photo before the admin ever sees it — which is
why generation needs both tokens.

`/admin/emails` edits the invite, reminder and confirmation emails per locale: subject, heading
and a rich-text message, stored in `EmailTemplate` (empty keeps the dictionary default). Tabs pick
the kind, a second switcher the language, and the fields sit beside a live preview of that exact
email. The preview renders the copy **in the editor**, not the last save: `renderEmailPreview`
passes the draft to `renderEmail`'s `copyOverride`, and the result is fed to the iframe as
sandboxed `srcDoc` about half a second after the last keystroke.
`src/domain/email-copy.ts#resolveEmailCopy` merges override and default and substitutes
`{name}`, `{coupleNames}` and `{deadline}`. All three kinds render through one template,
`src/emails/invitation-email.tsx`, themed by `src/emails/theme.ts` (an email-safe copy of each
`[data-theme]` palette, since mail clients cannot load the web fonts) and framed with the couple
names and hero photo. A test can be sent to any address; test sends are not written to `EmailLog`.

Every settings-section form and the Settings page save through `src/components/admin/use-autosave.ts`,
a debounced (1.5s default) autosave hook: it skips the initial mount, only fires once the value
differs from the last saved snapshot, serialises overlapping saves (a value that arrives mid-save
is queued and run once the current save settles), and flushes immediately on `visibilitychange`
to hidden and on `beforeunload`. `src/components/admin/save-status.tsx` renders the resulting
saving/saved/error state next to a secondary "Save now" button, which stays as a manual fallback
and the retry action on error. The invitation dialog and the Guests CSV import are deliberate,
one-shot actions and do not autosave.

## The wedding date

`Settings.weddingDate` is the ceremony itself: what the countdown counts to, and what "the day"
means everywhere else. Events are **not** derived from it — each `Event` keeps its own absolute
`startsAt`, because a henna night the evening before and a brunch the morning after are ordinary
events, not exceptions.

It is optional, so a database that predates it keeps working: `src/domain/wedding-date.ts`'s
`resolveWeddingDate` falls back to the earliest event **by date**, never by `sortOrder`, which is a
display preference and can disagree with the calendar. That fallback is what the site did for every
event before this column existed, and it is why the countdown could point at a welcome dinner. The
settings page says out loud which date is in use and where it came from, and the events page labels
every event against it (`dayOffset` / `describeDayOffset`), so a mistyped year reads as "364 days
before" instead of hiding inside a timestamp.

Every admin date field is `src/components/admin/date-time-field.tsx`: a calendar popover plus a
time input, exchanging the same `yyyy-MM-ddTHH:mm` string a native `datetime-local` used, so no
server action had to change. Build that string with `src/lib/wire-date.ts` and never with
`toISOString()` — that is UTC, and an evening in Berlin comes back an hour early, or near midnight
on the wrong day.

## Wish list

The couple keeps a list of gifts at `/admin/gifts`; guests reserve from their own invitation link
at `/rsvp/<token>/gifts`, and a `GIFTS` block puts the same list on any public page. One gift has
one taker, and that is enforced by the schema rather than by the actions: `GiftClaim.giftId` is the
**primary key**, so two guests reserving in the same second cannot both win — the loser's insert
fails with `P2002`, which `reserveGift` turns into `already-taken` and the guest reads as "someone
reserved that one a moment ago" in their own language. Releasing is a `deleteMany` scoped by
`invitationId` as well as `giftId`, so a household can only ever take back its own reservation.

Nothing in the data says whether it is a gift registry or a honeymoon registry. A `Gift` is a
picture, an optional link, a **free-text** `price` (`"€120"`, `"about 80 francs"`, `""` — a family
site has no business modelling currency) and per-locale title and rich-text body; "Two nights in
the riad" and "Espresso machine" are the same row. What names the section is the block's own
heading and intro, which is why the block carries `title` and `body` and the dictionary's
`giftsHeading` is only the fallback.

`src/domain/gifts.ts` holds the decisions all three surfaces share, so they cannot drift:
`giftStatus` (`available` / `mine` / `taken`, where `mine` is the whole permission model),
`sortByAvailability` (still-available first, so a guest sees what they can act on),
`publishableGifts` (an untitled row never reaches a guest) and `localizeGift`. The public page
passes `viewerInvitationId: null`, which is exactly why a claimed gift reads as "already taken"
there and never as somebody's name — who gave what is the couple's business, and it is shown only
in `/admin/gifts`, alongside the household's email, the note the giver left, and a Release action
for the guest who emails to say they cannot manage it after all.

`src/components/site/gifts.tsx` is one grid serving both surfaces; the difference between reading
the list and reserving from it is the `renderAction` prop. That function runs on the server and
returns `GiftActions`, the page's only client component — the cards stay server-rendered so
`RichText`'s sanitiser never reaches a guest's bundle. `GiftGrid`'s `w-full` is load-bearing: the
guest page centres its children, and without it the grid collapses to one narrow column.

Deleting a gift cascades its claim, which is why the admin's remove dialog says so when somebody
has already taken it. Claims also cascade with the invitation, like photos.

## Memories book

Guests photograph the wedding from their own invitation link and everything they add appears in
one shared, page-turning book at `/rsvp/<token>/memories`. The token gates both reading and
writing, so a private family album never sits on a public URL, and the RSVP page only mentions the
book once it is open.

`src/domain/photo-book.ts` holds the three decisions: `resolvePhotoBookAccess` turns the
`SiteContent` columns `photosEnabled` / `photosOpenAt` / `photosTestMode` into `disabled` (the
route 404s), `closed` (guests see the date) or `open`; `buildBookPages` orders cover, optional
intro, photos oldest-first, and a closing page; `buildLeaves` groups those pages into physical
sheets — two per sheet for a desktop spread, one per sheet on a phone. Both the page and the
upload route re-derive access from those columns, so neither trusts the other.

`src/components/site/photo-book.tsx` turns pages with CSS 3D transforms and no library
(`react-pageflip` is five years old and predates React 19). Two things about it are load-bearing
and easy to undo by accident: leaf stacking comes from `translateZ` applied *after* the rotation,
never `z-index`, because a perspective context paints 3D-transformed siblings by depth and ignores
`z-index`; and which face of a sheet you see is an opacity swap delayed by half the turn, not
`backface-visibility`, which Chrome culls even when a leaf's rotation and its back face's own
rotation compose to identity.

Uploads reuse the admin's Blob path: `downscaleImage` shrinks the photo in the browser (and
transcodes an iPhone's HEIC to JPEG — `isWebDisplayable` reports the case where a browser could
not, so the guest gets an explanation instead of a photo nobody can open), then it goes straight
to Blob through `src/app/rsvp/[token]/memories/upload/route.ts`, which mints a client token only
for a real invitation on an open book. Only the resulting URLs pass through the `addPhotos` action.
Photos cascade with their invitation, so deleting a household deletes the photos it added.

`/admin/website/memories` sets when the book opens (with a test switch that ignores the date
without changing it), holds the per-locale cover title and opening note, and moderates every
photo: hiding is reversible, deleting removes the Blob file too. The photo-day email is a fourth
`EmailKind`, `PHOTOS`, whose link points at the book instead of the RSVP form; the dashboard sends
it to attending households on the day.

`src/app/icon.tsx` crops the hero photo into the browser-tab favicon, falling back to a plain ring
when no hero is set.

## Site effects

`/admin/settings/effects` edits three `SiteContent` columns. `openingAnimation` picks the first-load
cover (`src/components/site/invitation-opening.tsx` plus one SVG art file per variant under
`src/components/site/opening/`): `SEAL` (wax-sealed envelope, doors part), `MONOGRAM` (stroke-drawn
initials, iris reveal), `BLOOM` (growing branches), or `NONE`. Every variant shares one exit: the cover ground is four
quadrant panels carrying the theme's own page texture and a blurred, scrimmed copy of the hero
photo; on open the scrim fades so the photo sharpens behind the art, then the quadrants slide out
to their corners, so the page lands on the same picture. The cover doubles as the
loading screen — it waits for fonts and the hero photo (capped at 4s) before offering the button —
and never traps a guest: reduced motion skips it, Escape opens it in any phase, and `sessionStorage`
stops it repeating within a visit. `?opening=seal|monogram|bloom|none` previews a variant by URL
(and forces it to show again), the same way `?theme=` previews a theme. `particlesEnabled` toggles
`src/components/site/particles.tsx`, a fixed canvas inside `<main>` whose particle kind and colours
come from the active theme's own `--color-*` tokens; a burst erupts from the cover art's centre
when the cover opens (or scatters across the page when there is no cover), then fades out. The
numeric knobs — cover hold time and reveal speed, particle count, seconds, and speed — are the
`opening*`/`particle*` integer columns plus `musicVolume` (percent), always read through
`src/domain/effects-settings.ts#clampEffectsSettings`. `musicUrl` is an https audio URL (uploaded to
Blob via `AudioField`, or pasted); `src/components/site/music-toggle.tsx` renders the floating
on/off button, loops the track, fades it in to `musicVolume`, and only ever starts playback from a real click — the guest's own toggle, or the
cover's open button via the `wed:invitation-opened` window event. `?preview=1` (the admin theme
thumbnails) drops all three.

## Translations

The public site is `/` plus one route per page the couple adds, all sharing `SiteNav`,
`SiteFooter`, and the theme. `src/lib/site-links.ts#buildSiteLinks` returns two lists from the
localized pages: `navLinks` (the home page's own block anchors, as absolute `/#story` hrefs so they
work from any page) and `footerLinks` (those plus a link to every other page that has content and
`showInNav`). `src/proxy.ts` treats every path that is not `/admin`, `/rsvp`, `/calendar` or `/api`
as a public page and writes the `?lang=` cookie there, so a new page needs no matcher change.

`src/i18n/dictionaries/en.ts` is the source of truth (`Dictionary` type = `typeof en`). `de.ts`
and `ku.ts` are typed `: Dictionary`, so a missing key fails `tsc`. The admin UI is English only
and does not use the dictionary. **The German and Kurmanji copy has not been proofread by a
native speaker** — get that review before any real invite/reminder email goes out.

## Environment

`DATABASE_URL`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `APP_URL`, `EMAIL_FROM`, and optional
`RESEND_API_KEY`, `BLOB_READ_WRITE_TOKEN` (a Vercel Blob store token; when unset, the admin's
image fields fall back to a plain link input instead of drag-and-drop upload — see
`src/lib/blob.ts`) and `REPLICATE_API_TOKEN` (when unset, the "Generate illustration" buttons are
hidden). `src/lib/database-url.ts#resolveDatabaseUrl` also accepts `POSTGRES_URL` and any
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

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
