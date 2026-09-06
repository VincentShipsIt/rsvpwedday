import { InvitationForm } from "@/app/admin/invitations/invitation-form";

export default function NewInvitationPage() {
	return (
		<div className="flex flex-col gap-6">
			<h1 className="text-2xl font-medium">New invitation</h1>
			<InvitationForm mode="create" />
		</div>
	);
}
