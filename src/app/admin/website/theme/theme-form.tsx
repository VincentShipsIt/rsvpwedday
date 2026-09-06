"use client";

import { cn } from "cn";
import { ExternalLinkIcon } from "lucide-react";
import { useState } from "react";
import { updateTheme } from "@/app/admin/website/actions";
import { SaveStatus } from "@/components/admin/save-status";
import { useAutosave } from "@/components/admin/use-autosave";
import { Button } from "@/components/ui/button";
import type { SiteTheme } from "@/generated/prisma/enums";
import { themeChoices } from "@/lib/site-theme";

export type ThemeFormProps = {
	initialTheme: SiteTheme;
};

export function ThemeForm({ initialTheme }: ThemeFormProps) {
	const [theme, setTheme] = useState<SiteTheme>(initialTheme);

	const { status, error, retry } = useAutosave({
		value: theme,
		save: (nextTheme) => updateTheme({ theme: nextTheme }),
	});

	return (
		<div className="flex flex-col gap-8">
			<div className="grid gap-4 sm:grid-cols-2">
				{themeChoices.map((choice) => {
					const isSelected = choice.theme === theme;
					return (
						// A native <button> can't contain the nested <a> Preview link below (interactive
						// content can't nest), so the card itself is a plain container and the selection
						// control is a full-size button layered behind the Preview link instead.
						<div
							key={choice.key}
							className={cn(
								"relative flex flex-col gap-3 rounded-lg border p-4 transition-colors",
								isSelected ? "border-ring bg-accent" : "hover:bg-accent/50"
							)}
						>
							<button
								type="button"
								aria-pressed={isSelected}
								onClick={() => setTheme(choice.theme)}
								className="absolute inset-0 rounded-lg"
							>
								<span className="sr-only">Select {choice.label} theme</span>
							</button>
							<div className="flex items-center justify-between">
								<span className="font-medium">{choice.label}</span>
								{isSelected && (
									<span className="text-xs font-medium text-muted-foreground">Selected</span>
								)}
							</div>
							<a
								href={`/?theme=${choice.key}`}
								target="_blank"
								rel="noreferrer"
								className="relative z-10 flex w-fit items-center gap-1 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
							>
								Preview
								<ExternalLinkIcon className="size-3.5" aria-hidden="true" />
							</a>
						</div>
					);
				})}
			</div>

			<div className="flex items-center gap-3">
				<Button type="button" variant="secondary" disabled={status === "saving"} onClick={retry}>
					Save now
				</Button>
				<SaveStatus status={status} error={error} onRetry={retry} />
			</div>
		</div>
	);
}
