import { redirect } from "next/navigation";

export default function RequestsRedirectPage() {
	redirect("/couples?lane=client");
}
