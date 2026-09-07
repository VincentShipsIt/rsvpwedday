"use client";

import {
	CopyIcon,
	DownloadIcon,
	EllipsisIcon,
	MailIcon,
	PencilIcon,
	PlusIcon,
	SendIcon,
	Trash2Icon,
	UploadIcon,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { sendInviteToOne, sendReminderToOne } from "@/app/admin/actions";
import { GuestsImportForm } from "@/app/admin/guests/import-form";
import { deleteInvitation } from "@/app/admin/invitations/actions";
import {
	InvitationDialog,
	type InvitationDialogTarget,
} from "@/app/admin/invitations/invitation-dialog";
import {
	AlertDialog,
	AlertDialogAction,
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
import type { InvitationStatus } from "@/domain/invitation";
import type { EmailKind, GuestKind, Locale } from "@/generated/prisma/enums";

export type InvitationRow = {
	id: string;
	email: string;
	link: string;
	locale: Locale;
	companionAllowance: number;
	status: InvitationStatus;
	emailKinds: EmailKind[];
	guests: {
		id: string;
		firstName: string;
		lastName: string;
		kind: GuestKind;
		email: string | null;
		phone: string | null;
	}[];
	eventIds: string[];
};

const STATUS_FILTERS = ["all", "pending", "accepted", "declined"] as const;
export type StatusFilter = (typeof STATUS_FILTERS)[number];

export function isStatusFilter(value: string): value is StatusFilter {
	return (STATUS_FILTERS as readonly string[]).includes(value);
}

function toEditTarget(invitation: InvitationRow): InvitationDialogTarget {
	return {
		mode: "edit",
		invitationId: invitation.id,
		email: invitation.email,
		locale: invitation.locale,
		companionAllowance: invitation.companionAllowance,
		guests: invitation.guests.map((guest) => ({
			id: guest.id,
			firstName: guest.firstName,
			lastName: guest.lastName,
			kind: guest.kind,
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
}: {
	invitationRows: InvitationRow[];
	eventRows: { id: string; name: string }[];
	eventSlugs: string[];
	statusFilter: StatusFilter;
	search: string;
}) {
	const router = useRouter();
	const searchParams = useSearchParams();
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
				<h1 className="text-2xl font-medium">Guests</h1>
				<div className="flex flex-wrap items-center gap-2">
					<ImportDialog eventSlugs={eventSlugs} />
					<ExportDialog />
					<Button onClick={() => setDialogTarget({ mode: "create" })}>
						<PlusIcon />
						Add invitation
					</Button>
				</div>
			</div>

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
					<Input name="q" defaultValue={search} placeholder="Search email or guest name" />
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
							<TableHead>Emails sent</TableHead>
							<TableHead className="text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{invitationRows.map((invitation) => (
							<InvitationRowItem
								key={invitation.id}
								invitation={invitation}
								onEdit={() => setDialogTarget(toEditTarget(invitation))}
							/>
						))}
					</TableBody>
				</Table>
			</Card>

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
						Download the template, fill one row per guest, then upload it or paste it below. Rows
						sharing an email become one invitation, and re-importing an existing email replaces that
						invitation&apos;s guests.
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
							<span>none yet, add events under Website first</span>
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
						Downloads every guest as CSV: invitationEmail, status, firstName, lastName, kind,
						dietary, and one column per event slug with each guest&apos;s attendance. An empty event
						cell means the guest was not invited to it.
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
}: {
	invitation: InvitationRow;
	onEdit: () => void;
}) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);

	function copyLink() {
		navigator.clipboard.writeText(invitation.link);
		toast.success("Link copied");
	}

	function sendInvite() {
		startTransition(async () => {
			await sendInviteToOne(invitation.id);
			toast.success(`Invite sent to ${invitation.email}`);
			router.refresh();
		});
	}

	function sendReminder() {
		startTransition(async () => {
			await sendReminderToOne(invitation.id);
			toast.success(`Reminder sent to ${invitation.email}`);
			router.refresh();
		});
	}

	return (
		<TableRow>
			<TableCell>{invitation.email}</TableCell>
			<TableCell>
				<Badge variant="secondary" className={STATUS_BADGE_CLASS[invitation.status]}>
					{STATUS_LABELS[invitation.status]}
				</Badge>
			</TableCell>
			<TableCell>
				{invitation.guests.map((guest) => `${guest.firstName} ${guest.lastName}`).join(", ")}
			</TableCell>
			<TableCell>
				{invitation.emailKinds.length === 0 ? (
					<span className="text-muted-foreground">None</span>
				) : (
					<div className="flex flex-wrap gap-1">
						{invitation.emailKinds.map((kind) => (
							<Badge key={kind} variant="secondary">
								{kind}
							</Badge>
						))}
					</div>
				)}
			</TableCell>
			<TableCell className="text-right">
				<AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="icon" disabled={isPending} aria-label="Row actions">
								<EllipsisIcon />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-auto min-w-44">
							<DropdownMenuItem onSelect={copyLink}>
								<CopyIcon />
								Copy link
							</DropdownMenuItem>
							<DropdownMenuItem onSelect={sendInvite}>
								<SendIcon />
								Send invite
							</DropdownMenuItem>
							{invitation.status === "pending" && (
								<DropdownMenuItem onSelect={sendReminder}>
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
								<AlertDialogAction asChild>
									<button type="submit">Yes, delete</button>
								</AlertDialogAction>
							</form>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</TableCell>
		</TableRow>
	);
}
