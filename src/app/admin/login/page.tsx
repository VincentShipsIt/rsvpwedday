import { login } from "@/app/admin/login/actions";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { Input } from "@/components/input";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
	searchParams,
}: {
	searchParams: Promise<{ error?: string }>;
}) {
	const { error } = await searchParams;

	return (
		<main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6">
			<Card>
				<form action={login} className="flex flex-col gap-4">
					<h1 className="text-2xl font-medium">Admin login</h1>
					<Input type="password" name="password" placeholder="Password" required />
					{error && <p className="text-sm text-red-700">Incorrect password</p>}
					<Button type="submit">Sign in</Button>
				</form>
			</Card>
		</main>
	);
}
