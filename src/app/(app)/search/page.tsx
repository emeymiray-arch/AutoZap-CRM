import { auth } from "@/lib/auth";
import { globalSearch } from "@/lib/search";
import { PageHeader, Card } from "@/components/layout/Page";
import Link from "next/link";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await auth();
  if (!session?.user) return null;
  const { q = "" } = await searchParams;
  const result = q ? await globalSearch(q, session.user) : null;

  return (
    <div>
      <PageHeader title="Поиск" description={q ? `Результаты по «${q}»` : "Введите запрос в верхней панели"} />
      {!result && <Card><p className="text-sm text-slate-500">Минимум 2 символа</p></Card>}
      {result && (
        <div className="grid gap-4 md:grid-cols-2">
          {(
            [
              ["Партнёры", result.partners, "/partners", (r: { name: string }) => r.name],
              ["Контакты", result.contacts, "/crm/contacts", (r: { firstName: string; lastName: string | null }) => `${r.firstName} ${r.lastName || ""}`],
              ["Лиды", result.leads, "/crm/leads", (r: { title: string }) => r.title],
              ["Сделки", result.deals, "/crm/deals", (r: { title: string }) => r.title],
              ["Магазины", result.stores, "/stores", (r: { name: string }) => r.name],
              ["Задачи", result.tasks, "/tasks", (r: { title: string }) => r.title],
            ] as const
          ).map(([title, rows, base, label]) => (
            <Card key={title} title={`${title} (${rows.length})`}>
              <ul className="space-y-1 text-sm">
                {rows.map((r) => (
                  <li key={r.id}>
                    <Link className="hover:underline" href={`${base}/${r.id}`}>
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {label(r as any)}
                    </Link>
                  </li>
                ))}
                {rows.length === 0 && <li className="text-slate-500">Нет совпадений</li>}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
