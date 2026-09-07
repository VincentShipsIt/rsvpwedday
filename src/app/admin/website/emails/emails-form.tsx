"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
	type EmailTemplateInput,
	sendTestEmailAction,
	updateEmailTemplates,
} from "@/app/admin/website/emails/actions";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { SaveStatus } from "@/components/admin/save-status";
import { useAutosave } from "@/components/admin/use-autosave";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

export function EmailsForm({ initialTemplates, defaults, sendingEnabled }: EmailsFormProps) {
	const [templates, setTemplates] = useState(initialTemplates);
	const [previewLocale, setPreviewLocale] = useState<Locale>(localeCodes[0]);
	const [testTo, setTestTo] = useState("");
	const [testKind, setTestKind] = useState<EmailKind>(EmailKind.INVITE);
	const [isSending, startSending] = useTransition();

	const { status, error, retry } = useAutosave({
		value: templates,
		save: (nextTemplates) => updateEmailTemplates({ templates: nextTemplates }),
	});

	function updateTemplate(
		kind: EmailKind,
		locale: Locale,
		patch: Partial<Pick<EmailTemplateInput, "subject" | "heading" | "body">>
	) {
		setTemplates((current) =>
			current.map((template) =>
				template.kind === kind && template.locale === locale ? { ...template, ...patch } : template
			)
		);
	}

	function sendTest() {
		startSending(async () => {
			const result = await sendTestEmailAction({
				kind: testKind,
				locale: previewLocale,
				to: testTo,
			});
			if (result.ok) {
				toast.success(`Test ${KIND_META[testKind].title.toLowerCase()} sent to ${testTo}`);
			} else {
				toast.error(result.error);
			}
		});
	}

	// The preview iframe re-fetches whenever a save settles, so the key changes with the status.
	const previewKey = `${testKind}-${previewLocale}-${status}`;

	return (
		<div className="flex flex-col gap-8">
			<p className="text-sm text-muted-foreground">
				Placeholders you can use anywhere:{" "}
				{EMAIL_PLACEHOLDERS.map((placeholder) => (
					<code key={placeholder} className="mr-1 rounded bg-muted px-1 py-0.5 text-xs">
						{`{${placeholder}}`}
					</code>
				))}
			</p>

			{KINDS.map((kind) => (
				<Card key={kind}>
					<CardHeader>
						<CardTitle>{KIND_META[kind].title}</CardTitle>
						<CardDescription>{KIND_META[kind].description}</CardDescription>
					</CardHeader>
					<CardContent>
						<Tabs defaultValue={localeCodes[0]}>
							<TabsList>
								{localeCodes.map((code) => (
									<TabsTrigger key={code} value={code}>
										{locales[code].label}
									</TabsTrigger>
								))}
							</TabsList>
							{templates
								.filter((template) => template.kind === kind)
								.map((template) => {
									const fallback = defaults[kind][template.locale];
									const fieldId = `${kind}-${template.locale}`;
									return (
										<TabsContent
											key={template.locale}
											value={template.locale}
											className="flex flex-col gap-3"
										>
											<div className="flex flex-col gap-1.5">
												<Label htmlFor={`${fieldId}-subject`}>Subject</Label>
												<Input
													id={`${fieldId}-subject`}
													placeholder={fallback.subject}
													value={template.subject}
													onChange={(event) =>
														updateTemplate(kind, template.locale, { subject: event.target.value })
													}
												/>
											</div>
											<div className="flex flex-col gap-1.5">
												<Label htmlFor={`${fieldId}-heading`}>Heading</Label>
												<Input
													id={`${fieldId}-heading`}
													placeholder={fallback.heading}
													value={template.heading}
													onChange={(event) =>
														updateTemplate(kind, template.locale, { heading: event.target.value })
													}
												/>
											</div>
											<div className="flex flex-col gap-1.5">
												<Label htmlFor={`${fieldId}-body`}>Message</Label>
												<RichTextEditor
													id={`${fieldId}-body`}
													placeholder={fallback.body}
													value={template.body}
													onChange={(html) => updateTemplate(kind, template.locale, { body: html })}
												/>
											</div>
										</TabsContent>
									);
								})}
						</Tabs>
					</CardContent>
				</Card>
			))}

			<div className="flex items-center gap-3">
				<Button type="button" variant="secondary" disabled={status === "saving"} onClick={retry}>
					Save now
				</Button>
				<SaveStatus status={status} error={error} onRetry={retry} />
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Preview and test</CardTitle>
					<CardDescription>
						Rendered with the current theme and a stand-in guest called Sam.
						{!sendingEnabled &&
							" Sending is off until RESEND_API_KEY is set; the preview still works."}
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-4">
					<div className="flex flex-wrap items-center gap-2">
						<div className="flex gap-1 rounded-lg bg-muted p-1">
							{KINDS.map((kind) => (
								<Button
									key={kind}
									type="button"
									size="sm"
									variant={kind === testKind ? "secondary" : "ghost"}
									aria-pressed={kind === testKind}
									onClick={() => setTestKind(kind)}
								>
									{KIND_META[kind].title}
								</Button>
							))}
						</div>
						<div className="flex gap-1 rounded-lg bg-muted p-1">
							{localeCodes.map((code) => (
								<Button
									key={code}
									type="button"
									size="sm"
									variant={code === previewLocale ? "secondary" : "ghost"}
									aria-pressed={code === previewLocale}
									onClick={() => setPreviewLocale(code)}
								>
									{locales[code].label}
								</Button>
							))}
						</div>
					</div>
					<iframe
						key={previewKey}
						title="Email preview"
						src={`/admin/website/emails/preview?kind=${testKind}&locale=${previewLocale}`}
						className="h-[640px] w-full rounded-lg border bg-white"
					/>
					<form
						className="flex flex-wrap items-end gap-2"
						onSubmit={(event) => {
							event.preventDefault();
							sendTest();
						}}
					>
						<div className="flex min-w-64 flex-1 flex-col gap-1.5">
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
							{isSending ? "Sending…" : `Send test ${KIND_META[testKind].title.toLowerCase()}`}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
