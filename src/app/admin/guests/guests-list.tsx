"use client";

import {
	CopyIcon,
	DownloadIcon,
	EllipsisIcon,
	EyeIcon,
	MailIcon,
	PencilIcon,
	PlusIcon,
	SendIcon,
	Trash2Icon,
	UploadIcon,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { sendInviteToOne, sendReminderToOne } from "@/app/admin/actions";
import { GuestsImportForm } from "@/app/admin/guests/import-form";
import { ResponseDetail } from "@/app/admin/guests/response-detail";
import { deleteInvitation } from "@/app/admin/invitations/actions";
import {
	InvitationDialog,
	type InvitationDialogTarget,
} from "@/app/admin/invitations/invitation-dialog";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IMPORT_EVENTS_SEPARATOR } from "@/domain/csv";
import type { EmailDeliveryStatus } from "@/domain/email-delivery";
import type { InvitationStatus } from "@/domain/invitation";
import type { Attendance, EmailKind, GuestKind, Locale } from "@/generated/prisma/enums";

export type InvitationRow = {
	id: string;
	email: string;
	link: string;
	locale: Locale;
	companionAllowance: number;
	childrenUnder12: number;
	childAttendance: Record<string, number>;
	childDietary: string[];
	respondedAt: string | null;
	note: string | null;
	songRequest: string | null;
	emailHistory: {
		id: string;
		kind: EmailKind;
		status: EmailDeliveryStatus;
		error: string | null;
		attemptedAt: string;
	}[];
	status: InvitationStatus;
	emailKinds: EmailKind[];
	guests: {
		id: string;
		firstName: string;
		lastName: string;
		kind: GuestKind;
		email: string | null;
		phone: string | null;
		dietary: string | null;
		addedByGuest: boolean;
		attendance: { eventId: string; status: Attendance }[];
	}[];
	eventIds: string[];
};

const STATUS_FILTERS = ["all", "pending", "accepted", "declined"] as const;
export type StatusFilter = (typeof STATUS_FILTERS)[number];

function toEditTarget(invitation: InvitationRow): InvitationDialogTarget {
	return {
		mode: "edit",
		invitationId: invitation.id,
		email: invitation.email,
		locale: invitation.locale,
		companionAllowance: invitation.companionAllowance,
		childrenUnder12: invitation.childrenUnder12,
		guests: invitation.guests
			.filter((guest) => guest.kind === "ADULT" && !guest.addedByGuest)
			.map((guest) => ({
				id: guest.id,
				firstName: guest.firstName,
				lastName: guest.lastName,
				kind: "ADULT" as const,
				email: guest.email ?? "",
				phone: guest.phone ?? "",
			})),
		eventIds: invitation.eventIds,
	};
}

const STATUS_LABELS: Record<InvitationStatus, string> = {
	pending: "Pending",
	accepted: "Accepted",
	declined: "Declined",
};

// Same palette as the guest-facing `StatusBadge`, so a status reads the same on both sides.
const STATUS_BADGE_CLASS: Record<InvitationStatus, string> = {
	pending: "bg-amber-100 text-amber-800",
	accepted: "bg-emerald-100 text-emerald-800",
	declined: "bg-red-100 text-red-800",
};

// The guest list: every invitation, filtered and searchable, with the invitation dialog and the
// two bulk CSV actions. Import and export are deliberate, occasional jobs, so they sit behind
// buttons that open a dialog rather than taking up the top of the page.
export function GuestsList({
	invitationRows,
	eventRows,
	eventSlugs,
	statusFilter,
	search,
	totalInvitations,
	timeZone,
	mediaPending,
	legacyPhotos,
}: {
	invitationRows: InvitationRow[];
	eventRows: { id: string; name: string }[];
	eventSlugs: string[];
	statusFilter: StatusFilter;
	search: string;
	totalInvitations: number;
	timeZone: string;
	mediaPending: boolean;
	legacyPhotos: boolean;
}) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [detailId, setDetailId] = useState<string | null>(null);
	const detail = invitationRows.find((row) => row.id === detailId) ?? null;
	const [dialogTarget, setDialogTarget] = useState<InvitationDialogTarget | null>(null);

	// Deep links (`/admin/invitations/new` and `/admin/invitations/[id]`) redirect here with
	// `?invitation=new|<id>`, which opens the same dialog the "Add invitation" button and each
	// row's "Edit" action use.
	useEffect(() => {
		const invitationParam = searchParams.get("invitation");
		if (invitationParam === "new") {
			setDialogTarget({ mode: "create" });
			return;
		}
		if (invitationParam) {
			const invitation = invitationRows.find((row) => row.id === invitationParam);
			if (invitation) {
				setDialogTarget(toEditTarget(invitation));
			}
		}
	}, [searchParams, invitationRows]);

	function closeDialog(open: boolean) {
		if (!open) {
			setDialogTarget(null);
			if (searchParams.get("invitation")) {
				router.replace("/admin/guests");
			}
		}
	}

	function setStatusFilter(next: StatusFilter) {
		const params = new URLSearchParams();
		if (next !== "all") {
			params.set("status", next);
		}
		if (search) {
			params.set("q", search);
		}
		router.push(params.size > 0 ? `/admin/guests?${params.toString()}` : "/admin/guests");
	}

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="text-2xl font-medium">Guests</h1>
					<p className="text-sm text-muted-foreground">
						{invitationRows.length} of {totalInvitations} households
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<ImportDialog eventSlugs={eventSlugs} />
					<ExportDialog />
					<Button onClick={() => setDialogTarget({ mode: "create" })}>
						<PlusIcon />
						Add invitation
					</Button>
				</div>
			</div>

			{(mediaPending || legacyPhotos) && (
				<div
					role="status"
					className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"
				>
					{mediaPending && (
						<p>
							Invitation removed. Some photo files are awaiting storage cleanup.{" "}
							<a className="underline underline-offset-4" href="/admin/memories">
								Review pending cleanup in Memories
							</a>
							.
						</p>
					)}
					{legacyPhotos && (
						<p>
							Older photo files were kept in storage because their ownership cannot be verified.
						</p>
					)}
				</div>
			)}
			<div className="flex flex-wrap items-center gap-3">
				<Tabs
					value={statusFilter}
					onValueChange={(value) => setStatusFilter(value as StatusFilter)}
				>
					<TabsList>
						<TabsTrigger value="all">All</TabsTrigger>
						<TabsTrigger value="pending">Pending</TabsTrigger>
						<TabsTrigger value="accepted">Accepted</TabsTrigger>
						<TabsTrigger value="declined">Declined</TabsTrigger>
					</TabsList>
				</Tabs>
				<form method="get" className="flex items-center gap-2">
					{statusFilter !== "all" && <input type="hidden" name="status" value={statusFilter} />}
					<Input
						name="q"
						aria-label="Search email or guest name"
						key={search}
						defaultValue={search}
						placeholder="Search email or guest name"
					/>
					<Button type="submit" variant="secondary">
						Search
					</Button>
				</form>
			</div>

			<Card>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Email</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Guests</TableHead>
							<TableHead>Email delivery</TableHead>
							<TableHead className="text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{invitationRows.length === 0 && (
							<TableRow>
								<TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
									{totalInvitations === 0 ? (
										"No invitations yet. Add a household or import your guest list to get started."
									) : (
										<>
											No households match these filters.{" "}
											<a href="/admin/guests" className="underline underline-offset-4">
												Clear filters
											</a>
										</>
									)}
								</TableCell>
							</TableRow>
						)}
						{invitationRows.map((invitation) => (
							<InvitationRowItem
								key={invitation.id}
								invitation={invitation}
								onEdit={() => setDialogTarget(toEditTarget(invitation))}
								onDetails={() => setDetailId(invitation.id)}
							/>
						))}
					</TableBody>
				</Table>
			</Card>

			<ResponseDetail
				invitation={detail}
				events={eventRows}
				timeZone={timeZone}
				onOpenChange={(open) => {
					if (!open) setDetailId(null);
				}}
			/>
			<InvitationDialog target={dialogTarget} events={eventRows} onOpenChange={closeDialog} />
		</div>
	);
}

function ImportDialog({ eventSlugs }: { eventSlugs: string[] }) {
	const router = useRouter();
	const [isOpen, setIsOpen] = useState(false);

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button variant="secondary">
					<UploadIcon />
					Import
				</Button>
			</DialogTrigger>
			<DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-3xl">
				<DialogHeader>
					<DialogTitle>Import guests</DialogTitle>
					<DialogDescription>
						Download the template, fill one row per adult, then upload it or paste it below. Rows
						sharing an invitation email become one household. Re-importing adds or updates matched
						adults and preserves existing guests, companions, and responses. Children under 12 are a
						household count; they do not need names or contact details.
					</DialogDescription>
				</DialogHeader>
				<div className="flex flex-wrap items-center gap-3">
					<Button asChild variant="secondary" size="sm">
						<a href="/admin/guests/template">
							<DownloadIcon />
							Download template
						</a>
					</Button>
					<p className="text-xs text-muted-foreground">
						<span className="font-medium text-foreground">events</span> column: the events this
						household is invited to, separated by &ldquo;{IMPORT_EVENTS_SEPARATOR}&rdquo;. Empty
						invites them to everything. Valid values:{" "}
						{eventSlugs.length > 0 ? (
							eventSlugs.map((slug) => (
								<code key={slug} className="mr-1 rounded bg-muted px-1 py-0.5">
									{slug}
								</code>
							))
						) : (
							<span>none yet, add events under Settings first</span>
						)}
					</p>
				</div>
				<GuestsImportForm
					eventSlugs={eventSlugs}
					onImported={() => {
						setIsOpen(false);
						router.refresh();
					}}
				/>
			</DialogContent>
		</Dialog>
	);
}

function ExportDialog() {
	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant="secondary">
					<DownloadIcon />
					Export
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Export guests</DialogTitle>
					<DialogDescription>
						Downloads one row per adult, including companions, and an aggregate children-under-12
						row per household. Includes contacts, dietary needs, household notes, song requests,
						response time, and per-event replies or child counts. An empty event cell means the
						person or household was not invited to that event.
					</DialogDescription>
				</DialogHeader>
				<Button asChild className="self-start">
					<a href="/admin/export">
						<DownloadIcon />
						Download guests.csv
					</a>
				</Button>
			</DialogContent>
		</Dialog>
	);
}

function InvitationRowItem({
	invitation,
	onEdit,
	onDetails,
}: {
	invitation: InvitationRow;
	onEdit: () => void;
	onDetails: () => void;
}) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);

	async function copyLink() {
		try {
			await navigator.clipboard.writeText(invitation.link);
			toast.success("Link copied");
		} catch {
			toast.error("Could not copy the link. Open the response details to select it manually.");
		}
	}

	function send(kind: "invite" | "reminder") {
		startTransition(async () => {
			try {
				const result = await (kind === "invite" ? sendInviteToOne : sendReminderToOne)(
					invitation.id
				);
				if (result.ok)
					toast.success(
						`${kind === "invite" ? "Invite" : "Reminder"} accepted by the email provider for ${invitation.email}`
					);
				else toast.error(result.error);
			} catch {
				toast.error("Could not confirm the email send. Review delivery history before retrying.");
			} finally {
				router.refresh();
			}
		});
	}

	return (
		<TableRow>
			<TableCell>
				<button
					type="button"
					onClick={onDetails}
					className="text-left underline decoration-muted-foreground/40 underline-offset-4 hover:decoration-foreground"
				>
					{invitation.email}
				</button>
			</TableCell>
			<TableCell>
				<Badge variant="secondary" className={STATUS_BADGE_CLASS[invitation.status]}>
					{STATUS_LABELS[invitation.status]}
				</Badge>
			</TableCell>
			<TableCell>
				<p>
					{invitation.guests
						.map(
							(guest) => `${guest.firstName} ${guest.lastName}${guest.addedByGuest ? " (+1)" : ""}`
						)
						.join(", ") || "No named adults"}
				</p>
				<p className="text-xs text-muted-foreground">
					{invitation.guests.length} adult(s) · {invitation.childrenUnder12} under 12
				</p>
			</TableCell>
			<TableCell>
				{invitation.emailKinds.length === 0 ? (
					<span className="text-muted-foreground">None accepted</span>
				) : (
					<div className="flex flex-wrap gap-1">
						{invitation.emailKinds.map((kind) => (
							<Badge key={kind} variant="secondary">
								{kind} accepted
							</Badge>
						))}
					</div>
				)}
				{invitation.emailHistory[0] && invitation.emailHistory[0].status !== "accepted" && (
					<p className="mt-1 text-xs text-amber-700">
						Latest {invitation.emailHistory[0].kind.toLowerCase()}:{" "}
						{invitation.emailHistory[0].status}
					</p>
				)}
			</TableCell>
			<TableCell className="text-right">
				<AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								disabled={isPending}
								aria-label={`Actions for ${invitation.email}`}
							>
								<EllipsisIcon />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-auto min-w-44">
							<DropdownMenuItem onSelect={onDetails}>
								<EyeIcon />
								View response
							</DropdownMenuItem>
							<DropdownMenuItem onSelect={copyLink}>
								<CopyIcon />
								Copy link
							</DropdownMenuItem>
							<DropdownMenuItem onSelect={() => send("invite")}>
								<SendIcon />
								Send invite
							</DropdownMenuItem>
							{invitation.status === "pending" && (
								<DropdownMenuItem onSelect={() => send("reminder")}>
									<MailIcon />
									Send reminder
								</DropdownMenuItem>
							)}
							<DropdownMenuItem onSelect={onEdit}>
								<PencilIcon />
								Edit
							</DropdownMenuItem>
							<AlertDialogTrigger asChild>
								<DropdownMenuItem
									variant="destructive"
									onSelect={(event) => event.preventDefault()}
								>
									<Trash2Icon />
									Delete
								</DropdownMenuItem>
							</AlertDialogTrigger>
						</DropdownMenuContent>
					</DropdownMenu>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Delete this invitation?</AlertDialogTitle>
							<AlertDialogDescription>
								This removes {invitation.email} and their guests and responses. This can't be
								undone.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<form action={deleteInvitation.bind(null, invitation.id)}>
								<DeleteInvitationSubmit />
							</form>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</TableCell>
		</TableRow>
	);
}

function DeleteInvitationSubmit() {
	const { pending } = useFormStatus();
	return (
		<Button type="submit" variant="destructive" disabled={pending}>
			{pending ? "Deleting…" : "Yes, delete"}
		</Button>
	);
}
