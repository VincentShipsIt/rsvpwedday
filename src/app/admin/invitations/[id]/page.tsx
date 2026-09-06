import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function EditInvitationPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;

	const invitation = await db.invitation.findUnique({ where: { id }, select: { id: true } });
	if (!invitation) {
		notFound();
	}

	redirect(`/admin?invitation=${invitation.id}`);
}
