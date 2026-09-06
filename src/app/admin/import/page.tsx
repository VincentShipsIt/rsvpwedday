import { ImportForm } from "@/app/admin/import/import-form";

export default function ImportPage() {
	return (
		<div className="flex flex-col gap-6">
			<h1 className="text-2xl font-medium">Import guests</h1>
			<p className="text-sm text-ink/70">
				Paste CSV rows:
				email,locale,companionAllowance,firstName,lastName,kind,guestEmail,guestPhone. One row per
				guest; rows sharing an email merge into one invitation. Re-importing an existing email
				replaces that invitation&apos;s guests.
			</p>
			<ImportForm />
		</div>
	);
}
