"use client";

import { Placeholder } from "@tiptap/extensions";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
	BoldIcon,
	Heading2Icon,
	Heading3Icon,
	ItalicIcon,
	LinkIcon,
	ListIcon,
	ListOrderedIcon,
	UnderlineIcon,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/*
 * Small rich-text editor for the copy blocks the couple writes (story intro, milestone bodies,
 * event descriptions, RSVP note). It emits the HTML subset `src/domain/rich-text.ts` accepts:
 * paragraphs, bold/italic/underline, two heading sizes, lists and links. The server sanitises
 * on save, so the toolbar is a convenience, not the security boundary.
 */
export function RichTextEditor({
	value,
	label,
	"aria-labelledby": labelledBy,
	onChange,
	placeholder,
	id,
	className,
}: {
	value: string;
	label: string;
	"aria-labelledby"?: string;
	onChange: (html: string) => void;
	placeholder?: string;
	id?: string;
	className?: string;
}) {
	const fallbackId = useId();
	const editorId = id ?? fallbackId;
	// The last HTML this editor emitted; if `value` comes back equal to it the change originated
	// here and the document must not be reset (that would drop the caret and undo history).
	const lastEmitted = useRef(value);

	const editor = useEditor({
		immediatelyRender: false,
		extensions: [
			StarterKit.configure({
				heading: { levels: [3, 4] },
				code: false,
				codeBlock: false,
				horizontalRule: false,
				link: { openOnClick: false, protocols: ["https", "mailto"] },
			}),
			Placeholder.configure({ placeholder: placeholder ?? "" }),
		],
		content: value,
		editorProps: {
			attributes: {
				id: editorId,
				role: "textbox",
				"aria-multiline": "true",
				"aria-labelledby": labelledBy ?? `${editorId}-label`,
				class:
					"rich-text min-h-32 rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
			},
		},
		onUpdate: ({ editor: instance }) => {
			const html = instance.isEmpty ? "" : instance.getHTML();
			lastEmitted.current = html;
			onChange(html);
		},
	});

	useEffect(() => {
		if (!editor || value === lastEmitted.current) {
			return;
		}
		lastEmitted.current = value;
		editor.commands.setContent(value, { emitUpdate: false });
	}, [editor, value]);

	const state = useEditorState({
		editor,
		selector: ({ editor: instance }) => ({
			bold: instance?.isActive("bold") ?? false,
			italic: instance?.isActive("italic") ?? false,
			underline: instance?.isActive("underline") ?? false,
			heading3: instance?.isActive("heading", { level: 3 }) ?? false,
			heading4: instance?.isActive("heading", { level: 4 }) ?? false,
			bulletList: instance?.isActive("bulletList") ?? false,
			orderedList: instance?.isActive("orderedList") ?? false,
			link: instance?.isActive("link") ?? false,
		}),
	});

	const [linkDraft, setLinkDraft] = useState<string | null>(null);

	function toggleLink() {
		if (!editor) {
			return;
		}
		if (state?.link) {
			editor.chain().focus().unsetLink().run();
			return;
		}
		setLinkDraft(editor.getAttributes("link").href ?? "https://");
	}

	function applyLink() {
		if (!editor || linkDraft === null) {
			return;
		}
		const href = linkDraft.trim();
		if (href && href !== "https://") {
			editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
		}
		setLinkDraft(null);
	}

	const tools = [
		{
			label: "Heading",
			icon: Heading2Icon,
			active: state?.heading3,
			run: () => editor?.chain().focus().toggleHeading({ level: 3 }).run(),
		},
		{
			label: "Subheading",
			icon: Heading3Icon,
			active: state?.heading4,
			run: () => editor?.chain().focus().toggleHeading({ level: 4 }).run(),
		},
		{
			label: "Bold",
			icon: BoldIcon,
			active: state?.bold,
			run: () => editor?.chain().focus().toggleBold().run(),
		},
		{
			label: "Italic",
			icon: ItalicIcon,
			active: state?.italic,
			run: () => editor?.chain().focus().toggleItalic().run(),
		},
		{
			label: "Underline",
			icon: UnderlineIcon,
			active: state?.underline,
			run: () => editor?.chain().focus().toggleUnderline().run(),
		},
		{
			label: "Bullet list",
			icon: ListIcon,
			active: state?.bulletList,
			run: () => editor?.chain().focus().toggleBulletList().run(),
		},
		{
			label: "Numbered list",
			icon: ListOrderedIcon,
			active: state?.orderedList,
			run: () => editor?.chain().focus().toggleOrderedList().run(),
		},
		{ label: "Link", icon: LinkIcon, active: state?.link, run: toggleLink },
	];

	return (
		<div className={cn("flex flex-col gap-2", className)}>
			<Label id={`${editorId}-label`} htmlFor={editorId}>
				{label}
			</Label>
			<div className="flex flex-wrap items-center gap-1" role="toolbar" aria-label="Formatting">
				{tools.map((tool) => (
					<Button
						key={tool.label}
						type="button"
						variant={tool.active ? "secondary" : "ghost"}
						size="icon-sm"
						aria-label={tool.label}
						aria-pressed={tool.active ?? false}
						title={tool.label}
						disabled={!editor}
						onMouseDown={(event) => event.preventDefault()}
						onClick={tool.run}
					>
						<tool.icon />
					</Button>
				))}
				{linkDraft !== null && (
					<form
						className="flex items-center gap-1"
						onSubmit={(event) => {
							event.preventDefault();
							applyLink();
						}}
					>
						<input
							// biome-ignore lint/a11y/noAutofocus: opened by the Link button, focus belongs here
							autoFocus
							type="url"
							value={linkDraft}
							onChange={(event) => setLinkDraft(event.target.value)}
							aria-label="Link URL"
							placeholder="https://"
							className="h-7 rounded-md border border-input bg-transparent px-2 text-xs outline-none focus-visible:border-ring"
						/>
						<Button type="submit" size="xs" variant="secondary">
							Add
						</Button>
						<Button type="button" size="xs" variant="ghost" onClick={() => setLinkDraft(null)}>
							Cancel
						</Button>
					</form>
				)}
			</div>
			<EditorContent editor={editor} />
		</div>
	);
}
