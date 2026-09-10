import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { Couple, CoupleStatus, CrmData, InboxMessage, Provider, Thread } from "@/lib/crm";

const dataPath = join(process.cwd(), "data/crm.json");

type LegacyLead = {
	id: string;
	couple: string;
	place: Couple["place"];
	date?: string;
	stage?: string;
	source?: string;
	contact: Couple["contact"];
	notes?: string;
	createdAt?: string;
};

type LegacyClient = Omit<Couple, "status" | "createdAt"> & {
	status: string;
	createdAt?: string;
};

type DiskShape = Partial<CrmData> & {
	leads?: LegacyLead[];
	clients?: LegacyClient[];
};

function asCoupleStatus(value: string | undefined, fallback: CoupleStatus): CoupleStatus {
	if (value === "booked") return "confirmed";
	const allowed: CoupleStatus[] = [
		"new",
		"talking",
		"option",
		"confirmed",
		"day-of",
		"wrapped",
		"lost",
	];
	return value && (allowed as string[]).includes(value) ? (value as CoupleStatus) : fallback;
}

function fromLead(row: LegacyLead): Couple {
	return {
		id: row.id,
		couple: row.couple,
		place: row.place,
		date: row.date,
		status: asCoupleStatus(row.stage, "new"),
		source: row.source,
		contact: row.contact,
		notes: row.notes,
		createdAt: row.createdAt ?? new Date().toISOString(),
		fee: 0,
		budget: 0,
		bookedVendorTotal: 0,
		ourCost: 0,
		features: [],
		providerIds: [],
	};
}

function fromClient(row: LegacyClient): Couple {
	return {
		...row,
		status: asCoupleStatus(row.status, "confirmed"),
		createdAt: row.createdAt ?? new Date().toISOString(),
		fee: row.fee ?? 0,
		budget: row.budget ?? 0,
		bookedVendorTotal: row.bookedVendorTotal ?? 0,
		ourCost: row.ourCost ?? 0,
		features: row.features ?? [],
		providerIds: row.providerIds ?? [],
	};
}

function normalize(raw: DiskShape): CrmData {
	const couples = raw.couples ?? [
		...(raw.leads ?? []).map(fromLead),
		...(raw.clients ?? []).map(fromClient),
	];
	return {
		couples,
		providers: raw.providers ?? [],
		threads: raw.threads ?? [],
	};
}

async function readCrm(): Promise<CrmData> {
	const raw = await readFile(dataPath, "utf8");
	return normalize(JSON.parse(raw) as DiskShape);
}

async function writeCrm(data: CrmData): Promise<void> {
	await mkdir(dirname(dataPath), { recursive: true });
	await writeFile(dataPath, `${JSON.stringify(data, null, "\t")}\n`, "utf8");
}

export async function getCrm(): Promise<CrmData> {
	return readCrm();
}

export async function getCouple(id: string): Promise<Couple | undefined> {
	const data = await readCrm();
	return data.couples.find((row) => row.id === id);
}

export async function getProvider(id: string): Promise<Provider | undefined> {
	const data = await readCrm();
	return data.providers.find((row) => row.id === id);
}

export async function upsertCouple(couple: Couple): Promise<Couple> {
	const data = await readCrm();
	const index = data.couples.findIndex((row) => row.id === couple.id);
	if (index >= 0) data.couples[index] = couple;
	else data.couples.unshift(couple);
	await writeCrm(data);
	return couple;
}

export async function upsertProvider(provider: Provider): Promise<Provider> {
	const data = await readCrm();
	const index = data.providers.findIndex((row) => row.id === provider.id);
	if (index >= 0) data.providers[index] = provider;
	else data.providers.unshift(provider);
	await writeCrm(data);
	return provider;
}

export async function setCoupleStatus(
	id: string,
	status: CoupleStatus
): Promise<Couple | undefined> {
	const data = await readCrm();
	const row = data.couples.find((item) => item.id === id);
	if (!row) return undefined;
	row.status = status;
	await writeCrm(data);
	return row;
}

export async function getThreads(): Promise<Thread[]> {
	const data = await readCrm();
	return data.threads;
}

export async function getThread(id: string): Promise<Thread | undefined> {
	const data = await readCrm();
	return data.threads.find((row) => row.id === id);
}

export async function upsertThread(thread: Thread): Promise<Thread> {
	const data = await readCrm();
	const index = data.threads.findIndex((row) => row.id === thread.id);
	if (index >= 0) data.threads[index] = thread;
	else data.threads.unshift(thread);
	await writeCrm(data);
	return thread;
}

export async function appendMessage(
	threadId: string,
	message: InboxMessage,
	markUnread: boolean
): Promise<Thread | undefined> {
	const data = await readCrm();
	const thread = data.threads.find((row) => row.id === threadId);
	if (!thread) return undefined;
	thread.messages.push(message);
	thread.unread = markUnread;
	await writeCrm(data);
	return thread;
}

export async function markThreadRead(id: string): Promise<void> {
	const data = await readCrm();
	const thread = data.threads.find((row) => row.id === id);
	if (!thread) return;
	thread.unread = false;
	await writeCrm(data);
}
