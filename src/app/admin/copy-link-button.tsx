"use client";

import { useState } from "react";
import { Button } from "@/components/button";

export function CopyLinkButton({ link }: { link: string }) {
	const [didCopy, setDidCopy] = useState(false);

	async function handleClick() {
		await navigator.clipboard.writeText(link);
		setDidCopy(true);
		setTimeout(() => setDidCopy(false), 2000);
	}

	return (
		<Button type="button" variant="ghost" onClick={handleClick}>
			{didCopy ? "Copied" : "Copy link"}
		</Button>
	);
}
