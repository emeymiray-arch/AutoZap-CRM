import { redirect } from "next/navigation";

/** Модуль каталогов отключён — перенаправляем на партнёров */
export default function CatalogsRemovedPage() {
  redirect("/partners");
}
