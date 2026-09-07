"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Locale } from "@/generated/prisma/enums";
import { locales } from "@/i18n/locales";

export type SectionHeadingState = { locale: Locale; heading: string };

// Per-locale heading for a home-page section. An empty value keeps the dictionary's default,
// which is shown as the placeholder so the couple can see what they would be replacing.
export function SectionHeadingField({
	values,
	defaults,
	onChange,
}: {
	values: SectionHeadingState[];
	defaults: Record<Locale, string>;
	onChange: (locale: Locale, heading: string) => void;
}) {
	const first = values[0];
	if (!first) {
		return null;
	}
	return (
		<div className="flex flex-col gap-2">
			<Label>Section heading</Label>
			<Tabs defaultValue={first.locale}>
				<TabsList>
					{values.map((value) => (
						<TabsTrigger key={value.locale} value={value.locale}>
							{locales[value.locale].label}
						</TabsTrigger>
					))}
				</TabsList>
				{values.map((value) => (
					<TabsContent key={value.locale} value={value.locale}>
						<Input
							placeholder={defaults[value.locale]}
							value={value.heading}
							onChange={(event) => onChange(value.locale, event.target.value)}
						/>
					</TabsContent>
				))}
			</Tabs>
		</div>
	);
}
