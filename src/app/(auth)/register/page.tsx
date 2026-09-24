import { redirect } from "next/navigation";

/** Публичная регистрация отключена — аккаунты создаёт только администратор */
export default function RegisterDisabledPage() {
  redirect("/login");
}
