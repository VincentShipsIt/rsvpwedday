import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteInvitation } from "@/app/admin/invitations/actions";
import { InvitationForm } from "@/app/admin/invitations/invitation-form";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function EditInvitationPage({
	params,
	searchParams,
}: {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ confirm?: string }>;
}) {
	const { id } = await params;
	const { confirm } = await searchParams;

	const invitation = await db.invitation.findUnique({
		where: { id },
		include: { guests: { where: { addedByGuest: false } } },
	});

	if (!invitation) {
		notFound();
	}

	if (confirm === "delete") {
		return (
			<Card className="flex flex-col gap-4">
				<p>
					Delete the invitation for {invitation.email}? This also removes their guests and
					responses.
				</p>
				<div className="flex gap-3">
					<form action={deleteInvitation.bind(null, invitation.id)}>
						<Button type="submit">Yes, delete</Button>
					</form>
					<Link
						href={`/admin/invitations/${invitation.id}`}
						className="text-sm text-green underline underline-offset-4"
					>
						Cancel
					</Link>
				</div>
			</Card>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-medium">Edit invitation</h1>
				<Link
					href={`/admin/invitations/${invitation.id}?confirm=delete`}
					className="text-sm text-red-700 underline underline-offset-4"
				>
					Delete
				</Link>
			</div>
			<InvitationForm
				mode="edit"
				invitationId={invitation.id}
				initialEmail={invitation.email}
				initialLocale={invitation.locale}
				initialCompanionAllowance={invitation.companionAllowance}
				initialGuests={invitation.guests.map((guest) => ({
					id: guest.id,
					firstName: guest.firstName,
					lastName: guest.lastName,
					kind: guest.kind,
					email: guest.email ?? "",
					phone: guest.phone ?? "",
				}))}
			/>
		</div>
	);
}
