import { redirect } from "next/navigation";

/** Компании = партнёры: раздел убран из UI */
export default function CompaniesRedirectPage() {
  redirect("/partners");
}
