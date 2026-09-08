import { login } from "@/app/admin/login/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
						<Label htmlFor="admin-password">Password</Label>
						<Input
							id="admin-password"
							type="password"
							name="password"
							autoComplete="current-password"
							required
							aria-describedby={error ? "login-error" : undefined}
						/>
						{error && (
							<p id="login-error" role="alert" className="text-sm text-destructive">
								Incorrect password
							</p>
						)}
						<Button type="submit">Sign in</Button>
					</form>
				</CardContent>
			</Card>
		</main>
	);
}
