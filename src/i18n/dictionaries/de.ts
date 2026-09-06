import type { Dictionary } from "@/i18n/dictionaries/en";

export const de: Dictionary = {
	common: {
		yes: "Ja",
		no: "Nein",
		save: "Speichern",
		submit: "Absenden",
		edit: "Bearbeiten",
		back: "Zurück",
		languageLabel: "Sprache",
		adultLabel: "Erwachsene(r)",
		childLabel: "Kind",
	},
	landing: {
		title: "{coupleNames}",
		tagline:
			"Wir heiraten. Einladungen werden per E-Mail mit einem persönlichen Link zur Anmeldung verschickt.",
	},
	rsvp: {
		heading: "Du bist eingeladen, {name}",
		notFoundTitle: "Diese Einladung konnten wir nicht finden",
		notFoundBody:
			"Bitte überprüfe den Link aus deiner E-Mail oder melde dich bei uns, falls es weiterhin nicht funktioniert.",
		eventVenueLabel: "Ort",
		eventAddressLabel: "Adresse",
		eventDressCodeLabel: "Dresscode",
		eventMapsLinkLabel: "In Maps öffnen",
		eventCalendarLabel: "Zum Kalender hinzufügen",
		attendingLabel: "Nimmst du an {event} teil?",
		dietaryLabel: "Ernährungshinweise",
		dietaryPlaceholder: "Allergien, vegetarisch, vegan...",
		companionsHeading: "Bringst du jemanden mit?",
		companionsHint: "Du darfst bis zu {count} weitere Person(en) mitbringen.",
		companionFirstNameLabel: "Vorname",
		companionLastNameLabel: "Nachname",
		companionKindLabel: "Art des Gastes",
		companionEmailLabel: "E-Mail",
		companionPhoneLabel: "Telefon",
		companionContactHint:
			"Gib eine E-Mail-Adresse oder Telefonnummer an, damit wir die Person erreichen können.",
		addCompanionButton: "Person hinzufügen",
		removeCompanionButton: "Entfernen",
		noteLabel: "Eine Nachricht an das Brautpaar",
		notePlaceholder: "Alles, was wir wissen sollten",
		songRequestLabel: "Musikwunsch",
		songRequestPlaceholder: "Ein Song, der dich auf die Tanzfläche bringt",
		submitButton: "Anmeldung senden",
		submitSuccessMessage: "Danke, deine Anmeldung wurde gespeichert.",
		editButton: "Antwort bearbeiten",
		summaryHeading: "Deine Antwort",
		deadlinePassedMessage:
			"Die Anmeldefrist ist abgelaufen. Für Änderungen wende dich bitte an {replyTo}.",
		statusPending: "Antwort steht noch aus",
		statusAccepted: "Du nimmst teil",
		statusDeclined: "Du hast abgesagt",
		validation: {
			companionContact: "Gib eine E-Mail-Adresse oder Telefonnummer an",
			required: "Dieses Feld ist erforderlich",
		},
	},
	emails: {
		invite: {
			subject: "Du bist eingeladen: {coupleNames}",
			heading: "Du bist eingeladen, {name}",
			body: "Wir würden uns sehr freuen, mit dir zu feiern. Bitte lass uns bis {deadline} wissen, ob du kommen kannst.",
			cta: "Jetzt anmelden",
		},
		reminder: {
			subject: "Erinnerung: Anmeldung für {coupleNames}",
			heading: "Nur zur Erinnerung, {name}",
			body: "Wir haben noch nichts von dir gehört. Bitte melde dich bis {deadline} an.",
			cta: "Jetzt anmelden",
		},
		confirmation: {
			subject: "Anmeldung erhalten: {coupleNames}",
			heading: "Danke, {name}",
			body: "Wir haben deine Anmeldung gespeichert. Du kannst deine Antworten jederzeit bis {deadline} ändern.",
		},
	},
};
