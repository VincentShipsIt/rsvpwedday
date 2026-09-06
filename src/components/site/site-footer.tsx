export function SiteFooter({ line }: { line: string }) {
	return (
		<footer className="border-t border-ink/10 px-6 py-10 text-center text-sm text-ink/60">
			<p>{line}</p>
		</footer>
	);
}
