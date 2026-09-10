import { redirect } from "next/navigation";

export default async function ClientRedirectPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	redirect(`/couples/${id}`);
}
