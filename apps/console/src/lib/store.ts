import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { Client, CrmData, InboxMessage, Lead, Provider, Thread } from "@/lib/crm";

const dataPath = join(process.cwd(), "data/crm.json");

async function readCrm(): Promise<CrmData> {
	const raw = await readFile(dataPath, "utf8");
	const data = JSON.parse(raw) as CrmData;
	data.threads ??= [];
	return data;
}

async function writeCrm(data: CrmData): Promise<void> {
	await mkdir(dirname(dataPath), { recursive: true });
	await writeFile(dataPath, `${JSON.stringify(data, null, "\t")}\n`, "utf8");
}

export async function getCrm(): Promise<CrmData> {
	return readCrm();
}

export async function getLead(id: string): Promise<Lead | undefined> {
	const data = await readCrm();
	return data.leads.find((row) => row.id === id);
}

export async function getClient(id: string): Promise<Client | undefined> {
	const data = await readCrm();
	return data.clients.find((row) => row.id === id);
}

export async function getProvider(id: string): Promise<Provider | undefined> {
	const data = await readCrm();
	return data.providers.find((row) => row.id === id);
}

export async function upsertLead(lead: Lead): Promise<Lead> {
	const data = await readCrm();
	const index = data.leads.findIndex((row) => row.id === lead.id);
	if (index >= 0) data.leads[index] = lead;
	else data.leads.unshift(lead);
	await writeCrm(data);
	return lead;
}

export async function upsertClient(client: Client): Promise<Client> {
	const data = await readCrm();
	const index = data.clients.findIndex((row) => row.id === client.id);
	if (index >= 0) data.clients[index] = client;
	else data.clients.unshift(client);
	await writeCrm(data);
	return client;
}

export async function upsertProvider(provider: Provider): Promise<Provider> {
	const data = await readCrm();
	const index = data.providers.findIndex((row) => row.id === provider.id);
	if (index >= 0) data.providers[index] = provider;
	else data.providers.unshift(provider);
	await writeCrm(data);
	return provider;
}

export async function setLeadStage(id: string, stage: Lead["stage"]): Promise<Lead | undefined> {
	const data = await readCrm();
	const lead = data.leads.find((row) => row.id === id);
	if (!lead) return undefined;
	lead.stage = stage;
	await writeCrm(data);
	return lead;
}

export async function setClientStatus(
	id: string,
	status: Client["status"]
): Promise<Client | undefined> {
	const data = await readCrm();
	const client = data.clients.find((row) => row.id === id);
	if (!client) return undefined;
	client.status = status;
	await writeCrm(data);
	return client;
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
