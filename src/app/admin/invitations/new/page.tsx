import { redirect } from "next/navigation";

export default function NewInvitationPage() {
	redirect("/admin?invitation=new");
}
