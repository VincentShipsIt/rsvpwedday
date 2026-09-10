export type EmailDeliveryStatus = "attempted" | "simulated" | "accepted" | "failed";
export type EmailDeliveryLog = {
	kind: string;
	resendId: string | null;
	error: string | null;
};

// Historical no-key sends have neither an error nor a provider id. Only a provider id proves
// acceptance; an attempt or simulation must never remove a household from the retry list.
export function emailDeliveryStatus(log: Omit<EmailDeliveryLog, "kind">): EmailDeliveryStatus {
	if (log.error === "Delivery attempt in progress") return "attempted";
	if (log.error) return "failed";
	return log.resendId ? "accepted" : "simulated";
}

export function hasSuccessfulEmail(logs: EmailDeliveryLog[], kind: string): boolean {
	return logs.some((log) => log.kind === kind && emailDeliveryStatus(log) === "accepted");
}
