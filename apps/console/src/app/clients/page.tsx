import { redirect } from "next/navigation";

/* Clients are a lane on /couples now, not a table of their own. */
export default function ClientsRedirectPage() {
	redirect("/couples?lane=client");
}
