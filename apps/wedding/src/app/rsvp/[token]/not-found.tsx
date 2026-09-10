import { en } from "@/i18n/dictionaries/en";

export default function RsvpNotFound() {
	return (
		<main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
			<h1 className="text-3xl font-medium">{en.rsvp.notFoundTitle}</h1>
			<p className="text-ink/70">{en.rsvp.notFoundBody}</p>
		</main>
	);
}
