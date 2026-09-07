"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
	type EmailTemplateInput,
	renderEmailPreview,
	sendTestEmailAction,
	updateEmailTemplates,
} from "@/app/admin/emails/actions";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { SaveStatus } from "@/components/admin/save-status";
import { useAutosave } from "@/components/admin/use-autosave";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EMAIL_PLACEHOLDERS } from "@/domain/email-copy";
import { EmailKind, type Locale } from "@/generated/prisma/enums";
import { localeCodes, locales } from "@/i18n/locales";

type CopyDefaults = { subject: string; heading: string; body: string };

export type EmailsFormProps = {
	initialTemplates: EmailTemplateInput[];
	defaults: Record<EmailKind, Record<Locale, CopyDefaults>>;
	sendingEnabled: boolean;
};

const KIND_META: Record<EmailKind, { title: string; description: string }> = {
	[EmailKind.INVITE]: {
		title: "Invitation",
		description: "Sent from the dashboard with the guest's personal RSVP link.",
	},
	[EmailKind.REMINDER]: {
		title: "Reminder",
		description: "Sent to guests who have not answered yet.",
	},
	[EmailKind.CONFIRMATION]: {
		title: "Confirmation",
		description: "Sent automatically after a guest submits their RSVP.",
	},
};

const KINDS = [EmailKind.INVITE, EmailKind.REMINDER, EmailKind.CONFIRMATION] as const;

// How long the preview waits after the last keystroke before re-rendering. Long enough not to
// render every character, short enough that it feels like the same document you are editing.
const PREVIEW_DEBOUNCE_MS = 500;

// One email at a time: tabs pick which of the three a guest gets, the language switcher picks the
// version, and the fields sit beside a preview of that exact email. The preview renders the copy
// in the editor — not the last save — so it always shows what is being typed.
export function EmailsForm({ initialTemplates, defaults, sendingEnabled }: EmailsFormProps) {
	const [templates, setTemplates] = useState(initialTemplates);
	const [kind, setKind] = useState<EmailKind>(EmailKind.INVITE);
	const [locale, setLocale] = useState<Locale>(localeCodes[0]);
	const [previewHtml, setPreviewHtml] = useState<string | null>(null);
	const [previewSubject, setPreviewSubject] = useState("");
	const [testTo, setTestTo] = useState("");
	const [isSending, startSending] = useTransition();

	const { status, error, retry } = useAutosave({
		value: templates,
		save: (nextTemplates) => updateEmailTemplates({ templates: nextTemplates }),
	});

	const template =
		templates.find((entry) => entry.kind === kind && entry.locale === locale) ??
		({ kind, locale, subject: "", heading: "", body: "" } as EmailTemplateInput);
	const fallback = defaults[kind][locale];

	// Re-renders on every edit to the email being shown, and whenever the tabs change.
	useEffect(() => {
		let cancelled = false;
		const timer = setTimeout(async () => {
			const result = await renderEmailPreview({
				kind,
				locale,
				subject: template.subject,
				heading: template.heading,
				body: template.body,
			});
			if (!cancelled) {
				setPreviewHtml(result.html);
				setPreviewSubject(result.subject);
			}
		}, PREVIEW_DEBOUNCE_MS);
		return () => {
			cancelled = true;
			clearTimeout(timer);
		};
	}, [kind, locale, template.subject, template.heading, template.body]);

	function updateTemplate(
		patch: Partial<Pick<EmailTemplateInput, "subject" | "heading" | "body">>
	) {
		setTemplates((current) =>
			current.map((entry) =>
				entry.kind === kind && entry.locale === locale ? { ...entry, ...patch } : entry
			)
		);
	}

	function sendTest() {
		startSending(async () => {
			const result = await sendTestEmailAction({ kind, locale, to: testTo });
			if (result.ok) {
				toast.success(`Test ${KIND_META[kind].title.toLowerCase()} sent to ${testTo}`);
			} else {
				toast.error(result.error);
			}
		});
	}

	const fieldId = `${kind}-${locale}`;

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<Tabs value={kind} onValueChange={(value) => setKind(value as EmailKind)}>
					<TabsList>
						{KINDS.map((entry) => (
							<TabsTrigger key={entry} value={entry}>
								{KIND_META[entry].title}
							</TabsTrigger>
						))}
					</TabsList>
				</Tabs>
				<Tabs value={locale} onValueChange={(value) => setLocale(value as Locale)}>
					<TabsList>
						{localeCodes.map((code) => (
							<TabsTrigger key={code} value={code}>
								{locales[code].label}
							</TabsTrigger>
						))}
					</TabsList>
				</Tabs>
			</div>

			<p className="text-sm text-muted-foreground">{KIND_META[kind].description}</p>

			<div className="grid gap-6 lg:grid-cols-2">
				<div className="flex flex-col gap-4">
					<Card>
						<CardContent className="flex flex-col gap-4">
							<div className="flex flex-col gap-1.5">
								<Label htmlFor={`${fieldId}-subject`}>Subject</Label>
								<Input
									id={`${fieldId}-subject`}
									placeholder={fallback.subject}
									value={template.subject}
									onChange={(event) => updateTemplate({ subject: event.target.value })}
								/>
							</div>
							<div className="flex flex-col gap-1.5">
								<Label htmlFor={`${fieldId}-heading`}>Heading</Label>
								<Input
									id={`${fieldId}-heading`}
									placeholder={fallback.heading}
									value={template.heading}
									onChange={(event) => updateTemplate({ heading: event.target.value })}
								/>
							</div>
							<div className="flex flex-col gap-1.5">
								<Label>Message</Label>
								<RichTextEditor
									placeholder={fallback.body}
									value={template.body}
									onChange={(html) => updateTemplate({ body: html })}
								/>
							</div>
							<p className="text-xs text-muted-foreground">
								Empty fields keep the built-in copy shown as the placeholder. Placeholders:{" "}
								{EMAIL_PLACEHOLDERS.map((placeholder) => (
									<code key={placeholder} className="mr-1 rounded bg-muted px-1 py-0.5">
										{`{${placeholder}}`}
									</code>
								))}
							</p>
							<div className="flex items-center gap-3">
								<Button
									type="button"
									variant="secondary"
									disabled={status === "saving"}
									onClick={retry}
								>
									Save now
								</Button>
								<SaveStatus status={status} error={error} onRetry={retry} />
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent>
							<form
								className="flex flex-wrap items-end gap-2"
								onSubmit={(event) => {
									event.preventDefault();
									sendTest();
								}}
							>
								<div className="flex min-w-56 flex-1 flex-col gap-1.5">
									<Label htmlFor="test-email-to">Send a test to</Label>
									<Input
										id="test-email-to"
										type="email"
										placeholder="you@example.com"
										value={testTo}
										onChange={(event) => setTestTo(event.target.value)}
									/>
								</div>
								<Button type="submit" disabled={isSending || testTo.trim() === ""}>
									{isSending ? "Sending…" : "Send test"}
								</Button>
							</form>
							{!sendingEnabled && (
								<p className="pt-2 text-xs text-muted-foreground">
									Sending is off until RESEND_API_KEY is set; the preview still works.
								</p>
							)}
						</CardContent>
					</Card>
				</div>

				<div className="flex flex-col gap-2 lg:sticky lg:top-6 lg:self-start">
					<div className="flex items-baseline gap-2 text-sm">
						<span className="text-muted-foreground">Subject:</span>
						<span className="min-w-0 flex-1 truncate font-medium">{previewSubject}</span>
					</div>
					{previewHtml === null ? (
						<div className="flex h-[720px] items-center justify-center rounded-lg border text-sm text-muted-foreground">
							Rendering…
						</div>
					) : (
						<iframe
							title={`${KIND_META[kind].title} preview`}
							srcDoc={previewHtml}
							// Email HTML is ours, but it is rendered from admin-authored copy; the sandbox
							// keeps it inert either way.
							sandbox=""
							className="h-[720px] w-full rounded-lg border bg-white"
						/>
					)}
					<p className="text-xs text-muted-foreground">
						Rendered with the site&apos;s theme, hero photo and event list, for a stand-in guest
						called Sam.
					</p>
				</div>
			</div>
		</div>
	);
}
