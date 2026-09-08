"use client";

import { UndoIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { releaseClaim } from "@/app/admin/gifts/actions";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

export type ClaimRow = {
	giftId: string;
	claimVersion: string | null;
	giftTitle: string;
	price: string;
	guestName: string;
	/** The household's email — who to thank, and who to ask if something goes wrong. */
	household: string;
	message: string;
	createdAt: string;
};

/*
 * Who is bringing what: one row per reserved gift, newest first. This is the whole point of the
 * list for the couple — the wish list itself is edited above, but this is what they open the page
 * to read.
 *
 * Releasing puts a gift back on the list without deleting it, which is the answer to the guest who
 * emails to say they cannot manage it after all.
 */
export function GiftClaims({ claims, giftCount }: { claims: ClaimRow[]; giftCount: number }) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Reserved</CardTitle>
				<CardDescription>
					{claims.length === 0
						? "Nobody has reserved a gift yet."
						: `${claims.length} of ${giftCount} reserved. Guests only ever see that a gift is taken, never by whom.`}
				</CardDescription>
			</CardHeader>
			{claims.length > 0 && (
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Gift</TableHead>
								<TableHead>Who</TableHead>
								<TableHead>Household</TableHead>
								<TableHead>Note</TableHead>
								<TableHead>Reserved</TableHead>
								<TableHead className="text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{claims.map((claim) => (
								<ClaimRowItem key={claim.giftId} claim={claim} />
							))}
						</TableBody>
					</Table>
				</CardContent>
			)}
		</Card>
	);
}

function ClaimRowItem({ claim }: { claim: ClaimRow }) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	function handleRelease() {
		startTransition(async () => {
			const result = await releaseClaim(claim.giftId, claim.claimVersion);
			if (result.ok) {
				toast.success(`${claim.giftTitle} is back on the list.`);
				router.refresh();
			} else {
				toast.error(result.error);
				router.refresh();
			}
		});
	}

	return (
		<TableRow>
			<TableCell className="font-medium">
				{claim.giftTitle}
				{claim.price && <span className="ml-2 text-muted-foreground">{claim.price}</span>}
			</TableCell>
			<TableCell>{claim.guestName}</TableCell>
			<TableCell className="text-muted-foreground">{claim.household}</TableCell>
			<TableCell className="max-w-xs text-muted-foreground">{claim.message}</TableCell>
			<TableCell className="whitespace-nowrap text-muted-foreground">{claim.createdAt}</TableCell>
			<TableCell className="text-right">
				<AlertDialog>
					<AlertDialogTrigger asChild>
						<Button variant="ghost" size="sm" disabled={isPending}>
							<UndoIcon />
							Release
						</Button>
					</AlertDialogTrigger>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Put {claim.giftTitle} back on the list?</AlertDialogTitle>
							<AlertDialogDescription>
								{claim.guestName} stops being down for it and anyone can reserve it again. They are
								not told, so say so yourself if they did not ask for this.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Leave it</AlertDialogCancel>
							<AlertDialogAction onClick={handleRelease}>Release</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</TableCell>
		</TableRow>
	);
}
