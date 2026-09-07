"use client";

import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { remindAllPending, sendInvitesToUnsent } from "@/app/admin/actions";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { Headcount } from "@/domain/headcount";

// Where the couple lands: how many have replied, how many are coming to what, and the two bulk
// sends. The guest list itself lives on `/admin/guests`, which owns every per-invitation action.
export function AdminDashboard({
	headcount,
	eventRows,
	unsentCount,
	pendingCount,
}: {
	headcount: Headcount;
	eventRows: { id: string; name: string; adults: number; children: number }[];
	unsentCount: number;
	pendingCount: number;
}) {
	return (
		<div className="flex flex-col gap-8">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<h1 className="text-2xl font-medium">Dashboard</h1>
				<Button variant="secondary" asChild>
					<Link href="/admin/guests">
						All guests
						<ArrowRightIcon />
					</Link>
				</Button>
			</div>

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
			</div>
		</div>
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
