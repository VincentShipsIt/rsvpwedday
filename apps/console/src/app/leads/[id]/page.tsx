import { redirect } from "next/navigation";

export default async function LeadRedirectPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	redirect(`/couples/${id}`);
}
