"use client";

import {
	CopyIcon,
	EllipsisIcon,
	MailIcon,
	PencilIcon,
	PlusIcon,
	SendIcon,
	Trash2Icon,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
	remindAllPending,
	sendInvitesToUnsent,
	sendInviteToOne,
	sendReminderToOne,
} from "@/app/admin/actions";
import { deleteInvitation } from "@/app/admin/invitations/actions";
import {
	InvitationDialog,
	type InvitationDialogTarget,
} from "@/app/admin/invitations/invitation-dialog";
import type { StatusFilter } from "@/app/admin/page";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import type { Headcount } from "@/domain/headcount";
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
};

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
	};
}

const STATUS_LABELS: Record<InvitationStatus, string> = {
	pending: "Pending",
	accepted: "Accepted",
	declined: "Declined",
};

const STATUS_BADGE_VARIANT: Record<InvitationStatus, "outline" | "default" | "destructive"> = {
	pending: "outline",
	accepted: "default",
	declined: "destructive",
};

export function AdminDashboard({
	headcount,
	eventRows,
	invitationRows,
	statusFilter,
	search,
	unsentCount,
	pendingCount,
}: {
	headcount: Headcount;
	eventRows: { id: string; name: string; adults: number; children: number }[];
	invitationRows: InvitationRow[];
	statusFilter: StatusFilter;
	search: string;
	unsentCount: number;
	pendingCount: number;
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
				router.replace("/admin");
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
		router.push(params.size > 0 ? `/admin?${params.toString()}` : "/admin");
	}

	return (
		<div className="flex flex-col gap-8">
			<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-xs font-normal text-muted-foreground">Pending</CardTitle>
					</CardHeader>
					<CardContent className="text-2xl font-semibold">
						{headcount.invitations.pending}
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-xs font-normal text-muted-foreground">Accepted</CardTitle>
					</CardHeader>
					<CardContent className="text-2xl font-semibold">
						{headcount.invitations.accepted}
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-xs font-normal text-muted-foreground">Declined</CardTitle>
					</CardHeader>
					<CardContent className="text-2xl font-semibold">
						{headcount.invitations.declined}
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-xs font-normal text-muted-foreground">
							Attending (adults / children)
						</CardTitle>
					</CardHeader>
					<CardContent className="text-2xl font-semibold">
						{headcount.attendingOverall.adults} / {headcount.attendingOverall.children}
					</CardContent>
				</Card>
			</div>

			<Card>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Event</TableHead>
							<TableHead>Adults</TableHead>
							<TableHead>Children</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{eventRows.map((event) => (
							<TableRow key={event.id}>
								<TableCell>{event.name}</TableCell>
								<TableCell>{event.adults}</TableCell>
								<TableCell>{event.children}</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</Card>

			<div className="flex flex-wrap items-center gap-3">
				<ConfirmActionButton
					action={sendInvitesToUnsent}
					label={`Send invites to everyone not yet invited (${unsentCount})`}
					title="Send invites?"
					description={`This sends the invite email to ${unsentCount} invitation(s) that haven't been invited yet.`}
					confirmLabel="Yes, send invites"
					disabled={unsentCount === 0}
				/>
				<ConfirmActionButton
					action={remindAllPending}
					label={`Remind everyone pending (${pendingCount})`}
					title="Send reminders?"
					description={`This sends a reminder email to ${pendingCount} pending invitation(s).`}
					confirmLabel="Yes, send reminders"
					disabled={pendingCount === 0}
				/>
				<Button className="ml-auto" onClick={() => setDialogTarget({ mode: "create" })}>
					<PlusIcon />
					Add invitation
				</Button>
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

			<InvitationDialog target={dialogTarget} onOpenChange={closeDialog} />
		</div>
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
				<Badge variant={STATUS_BADGE_VARIANT[invitation.status]}>
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
						<DropdownMenuContent align="end">
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

function ConfirmActionButton({
	action,
	label,
	title,
	description,
	confirmLabel,
	disabled,
}: {
	action: () => Promise<void>;
	label: string;
	title: string;
	description: string;
	confirmLabel: string;
	disabled: boolean;
}) {
	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button variant="link" className="h-auto p-0" disabled={disabled}>
					{label}
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					<AlertDialogDescription>{description}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<form action={action}>
						<AlertDialogAction asChild>
							<button type="submit">{confirmLabel}</button>
						</AlertDialogAction>
					</form>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
