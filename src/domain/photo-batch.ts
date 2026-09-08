export type PendingPhoto<FileType> = {
	file: FileType;
	receipt?: { id: string; pathname: string };
};

// Keep the same receipt after uncertain network failures. Completed items leave the queue only
// after registration succeeds, so Retry resumes the remainder without uploading duplicates.
export async function savePhotoBatch<FileType>(
	queue: PendingPhoto<FileType>[],
	operations: {
		prepare: () => Promise<{ id: string; pathname: string }>;
		upload: (file: FileType, receipt: { id: string; pathname: string }) => Promise<void>;
		register: (receiptId: string) => Promise<boolean>;
		progress: (remaining: number) => void;
	}
) {
	while (queue.length > 0) {
		const item = queue[0];
		operations.progress(queue.length);
		if (item.receipt && (await operations.register(item.receipt.id))) {
			queue.shift();
			continue;
		}
		item.receipt ??= await operations.prepare();
		await operations.upload(item.file, item.receipt);
		if (!(await operations.register(item.receipt.id))) throw new Error("Photo registration failed");
		queue.shift();
	}
}
