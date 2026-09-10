import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { Client, CrmData, Lead, Provider } from "@/lib/crm";

const dataPath = join(process.cwd(), "data/crm.json");

async function readCrm(): Promise<CrmData> {
	const raw = await readFile(dataPath, "utf8");
	return JSON.parse(raw) as CrmData;
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
