import { redirect } from "next/navigation";

/** Дневник ЗП отключён — старые закладки уводят на дашборд */
export default function PayrollPage() {
  redirect("/dashboard");
}
