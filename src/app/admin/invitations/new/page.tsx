import { redirect } from "next/navigation";

export default function NewInvitationPage() {
	redirect("/admin/guests?invitation=new");
}
