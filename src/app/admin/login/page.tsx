import { login } from "@/app/admin/login/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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
				<CardHeader>
					<CardTitle className="text-2xl">Admin login</CardTitle>
				</CardHeader>
				<CardContent>
					<form action={login} className="flex flex-col gap-4">
						<Input type="password" name="password" placeholder="Password" required />
						{error && <p className="text-sm text-destructive">Incorrect password</p>}
						<Button type="submit">Sign in</Button>
					</form>
				</CardContent>
			</Card>
		</main>
	);
}
