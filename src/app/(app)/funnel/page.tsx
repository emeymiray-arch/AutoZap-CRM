import { redirect } from "next/navigation";

/** Главная воронка — партнёры (крупные компании) */
export default function FunnelPage() {
  redirect("/partners?view=funnel");
}
