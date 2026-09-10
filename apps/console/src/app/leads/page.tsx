import { redirect } from "next/navigation";

/* Leads are a lane on /couples now, not a table of their own. */
export default function LeadsRedirectPage() {
	redirect("/couples?lane=lead");
}
