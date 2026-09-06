import type { InvitationStatus } from "@/domain/invitation";

const statusClassNames: Record<InvitationStatus, string> = {
	pending: "bg-amber-100 text-amber-800",
	accepted: "bg-green/10 text-green",
	declined: "bg-red-100 text-red-800",
};

export function StatusBadge({ status, label }: { status: InvitationStatus; label: string }) {
	return (
		<span
			className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${statusClassNames[status]}`}
		>
			{label}
		</span>
	);
}
