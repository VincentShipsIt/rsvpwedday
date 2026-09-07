import Link from "next/link";
import { notFound } from "next/navigation";
import { updateInvitationLocale } from "@/app/rsvp/[token]/actions";
import { RsvpForm } from "@/app/rsvp/[token]/rsvp-form";
import { Card } from "@/components/card";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { StatusBadge } from "@/components/status-badge";
import { canRespond, getInvitationStatus, type InvitationStatus } from "@/domain/invitation";
import { filterToInvited, invitedEventIds } from "@/domain/invitation-events";
import { resolvePhotoBookAccess } from "@/domain/photo-book";
import { Attendance } from "@/generated/prisma/enums";
import { getDictionary, t } from "@/i18n";
import { locales } from "@/i18n/locales";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function RsvpPage({
	params,
	searchParams,
}: {
	params: Promise<{ token: string }>;
	searchParams: Promise<{ edit?: string }>;
}) {
	const { token } = await params;
	const { edit } = await searchParams;

	const invitation = await db.invitation.findUnique({
		where: { token },
		include: { guests: { include: { attendance: true } } },
	});

	if (!invitation) {
		notFound();
	}

	const [settings, allEvents, siteContent] = await Promise.all([
		db.settings.findUniqueOrThrow({ where: { id: 1 } }),
		db.event.findMany({ orderBy: { sortOrder: "asc" }, include: { translations: true } }),
		db.siteContent.findUnique({
			where: { id: 1 },
			select: { photosEnabled: true, photosOpenAt: true, photosTestMode: true },
		}),
	]);
	// Only the events this household was invited to; the rest never appear on their page.
	const events = filterToInvited(allEvents, invitedEventIds(invitation.guests));

	const dictionary = getDictionary(invitation.locale);
	const localeDefinition = locales[invitation.locale];
	const status = getInvitationStatus(invitation);
	const canRespondNow = canRespond(new Date(), settings.rsvpDeadline);
	const hasResponded = invitation.respondedAt !== null;
	const showForm = canRespondNow && (!hasResponded || edit === "1");
	// The photo book only shows up here once it is actually open; before the day, the guest's
	// invitation says nothing about it.
	const photoBook = resolvePhotoBookAccess(
		{
			enabled: siteContent?.photosEnabled ?? false,
			openAt: siteContent?.photosOpenAt ?? null,
			testMode: siteContent?.photosTestMode ?? false,
		},
		new Date()
	);

	const localizedEvents = events.map((event) => {
		const translation =
			event.translations.find((candidate) => candidate.locale === invitation.locale) ??
			event.translations[0];
		return {
			id: event.id,
			slug: event.slug,
			name: translation?.name ?? event.slug,
			description: translation?.description ?? null,
			startsAt: event.startsAt,
			venue: event.venue,
			address: event.address,
			mapsUrl: event.mapsUrl,
			dressCode: event.dressCode,
		};
	});

	const namedGuests = invitation.guests.filter((guest) => !guest.addedByGuest);
	const companionGuests = invitation.guests.filter((guest) => guest.addedByGuest);

	const statusLabel: Record<InvitationStatus, string> = {
		pending: dictionary.rsvp.statusPending,
		accepted: dictionary.rsvp.statusAccepted,
		declined: dictionary.rsvp.statusDeclined,
	};

	const primaryGuestName = namedGuests[0]?.firstName ?? "";

	return (
		<main
			lang={invitation.locale}
			dir={localeDefinition.dir}
			className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-16"
		>
			<header className="flex flex-col gap-3">
				<h1 className="text-3xl font-medium sm:text-4xl">
					{t(dictionary.rsvp.heading, { name: primaryGuestName })}
				</h1>
				<div className="flex items-center justify-between gap-3">
					<StatusBadge status={status} label={statusLabel[status]} />
					<LocaleSwitcher
						currentLocale={invitation.locale}
						action={updateInvitationLocale.bind(null, token)}
						label={dictionary.common.languageLabel}
					/>
				</div>
			</header>

			{photoBook.state === "open" && (
				<Card className="flex flex-col gap-2">
					<h2 className="text-xl">{dictionary.photos.title}</h2>
					<p className="text-sm text-ink/70">{dictionary.photos.addHint}</p>
					<Link
						href={`/rsvp/${token}/memories`}
						className="text-sm text-green underline underline-offset-4"
					>
						{dictionary.photos.openBookLabel}
					</Link>
				</Card>
			)}

			<div className="flex flex-col gap-4">
				{localizedEvents.map((event) => (
					<Card key={event.id} className="flex flex-col gap-1">
						<h2 className="text-xl">{event.name}</h2>
						<p className="text-sm text-ink/70">{formatDate(event.startsAt, invitation.locale)}</p>
						<p className="text-sm">
							{dictionary.rsvp.eventVenueLabel}: {event.venue}
						</p>
						<p className="text-sm">
							{dictionary.rsvp.eventAddressLabel}: {event.address}
						</p>
						{event.dressCode && (
							<p className="text-sm">
								{dictionary.rsvp.eventDressCodeLabel}: {event.dressCode}
							</p>
						)}
						<div className="mt-2 flex gap-4 text-sm">
							{event.mapsUrl && (
								<a href={event.mapsUrl} className="text-green underline underline-offset-4">
									{dictionary.rsvp.eventMapsLinkLabel}
								</a>
							)}
							<Link
								href={`/calendar/${event.slug}.ics?locale=${invitation.locale}`}
								className="text-green underline underline-offset-4"
							>
								{dictionary.rsvp.eventCalendarLabel}
							</Link>
						</div>
					</Card>
				))}
			</div>

			{!canRespondNow && (
				<Card>
					<p>{t(dictionary.rsvp.deadlinePassedMessage, { replyTo: settings.replyTo ?? "" })}</p>
				</Card>
			)}

			{showForm && (
				<RsvpForm
					token={token}
					dictionary={dictionary}
					companionAllowance={invitation.companionAllowance}
					events={localizedEvents.map((event) => ({ id: event.id, name: event.name }))}
					initialNote={invitation.note ?? ""}
					initialSongRequest={invitation.songRequest ?? ""}
					guests={namedGuests.map((guest) => ({
						id: guest.id,
						firstName: guest.firstName,
						lastName: guest.lastName,
						dietary: guest.dietary ?? "",
						attendance: localizedEvents.map((event) => ({
							eventId: event.id,
							attending:
								guest.attendance.find((attendance) => attendance.eventId === event.id)?.status ===
								Attendance.ACCEPTED,
						})),
					}))}
					companions={companionGuests.map((guest) => ({
						firstName: guest.firstName,
						lastName: guest.lastName,
						kind: guest.kind,
						email: guest.email ?? "",
						phone: guest.phone ?? "",
					}))}
				/>
			)}

			{!showForm && canRespondNow && hasResponded && (
				<Card className="flex flex-col gap-4">
					<h2 className="text-xl">{dictionary.rsvp.summaryHeading}</h2>
					{namedGuests.map((guest) => (
						<div key={guest.id} className="text-sm">
							<p className="font-medium">
								{guest.firstName} {guest.lastName}
							</p>
							<ul className="list-inside list-disc text-ink/70">
								{localizedEvents.map((event) => {
									const attending =
										guest.attendance.find((candidate) => candidate.eventId === event.id)?.status ===
										Attendance.ACCEPTED;
									return (
										<li key={event.id}>
											{event.name}: {attending ? dictionary.common.yes : dictionary.common.no}
										</li>
									);
								})}
							</ul>
							{guest.dietary && <p className="text-ink/70">{guest.dietary}</p>}
						</div>
					))}
					{companionGuests.length > 0 && (
						<div className="text-sm">
							<p className="font-medium">{dictionary.rsvp.companionsHeading}</p>
							<ul className="list-inside list-disc text-ink/70">
								{companionGuests.map((guest) => (
									<li key={guest.id}>
										{guest.firstName} {guest.lastName}
									</li>
								))}
							</ul>
						</div>
					)}
					<Link href="?edit=1" className="text-sm text-green underline underline-offset-4">
						{dictionary.rsvp.editButton}
					</Link>
				</Card>
			)}
		</main>
	);
}
