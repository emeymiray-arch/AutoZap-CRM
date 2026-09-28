import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Card, formatDate } from "@/components/layout/Page";
import { canAccessPayroll } from "@/lib/permissions";
import { SALARY_TYPE_LABELS, ROLE_LABELS } from "@/lib/labels";
import { createSalaryEntryAction, deleteSalaryEntryAction } from "@/lib/actions";
import { Input, Select, Textarea } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import {
  endOfMonth,
  format,
  parse,
  startOfMonth,
  subMonths,
} from "date-fns";
import { ru } from "date-fns/locale";

function formatRub(n: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(n);
}

function monthParam(raw?: string | string[]) {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v && /^\d{4}-\d{2}$/.test(v)) {
    return parse(`${v}-01`, "yyyy-MM-dd", new Date());
  }
  return startOfMonth(new Date());
}

export default async function PayrollPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session?.user) return null;
  if (!canAccessPayroll(session.user.role)) redirect("/dashboard");

  const sp = await searchParams;
  const monthDate = monthParam(sp.month);
  const monthKey = format(monthDate, "yyyy-MM");
  const from = startOfMonth(monthDate);
  const to = endOfMonth(monthDate);

  const employeeFilter = Array.isArray(sp.employeeId)
    ? sp.employeeId[0]
    : sp.employeeId;

  const employees = await prisma.user.findMany({
    where: { archivedAt: null, active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, role: true },
  });

  const entries = await prisma.salaryEntry.findMany({
    where: {
      entryDate: { gte: from, lte: to },
      ...(employeeFilter ? { employeeId: employeeFilter } : {}),
    },
    include: {
      employee: { select: { id: true, name: true, role: true } },
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: [{ entryDate: "desc" }, { createdAt: "desc" }],
  });

  const total = entries.reduce((s, e) => s + e.amount, 0);

  const byEmployee = new Map<
    string,
    { name: string; role: string; total: number; count: number }
  >();
  for (const e of entries) {
    const cur = byEmployee.get(e.employeeId) || {
      name: e.employee.name,
      role: e.employee.role,
      total: 0,
      count: 0,
    };
    cur.total += e.amount;
    cur.count += 1;
    byEmployee.set(e.employeeId, cur);
  }
  const summaryRows = [...byEmployee.entries()]
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.total - a.total);

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = startOfMonth(subMonths(new Date(), i));
    return {
      value: format(d, "yyyy-MM"),
      label: format(d, "LLLL yyyy", { locale: ru }),
    };
  });

  const today = format(new Date(), "yyyy-MM-dd");

  return (
    <div>
      <PageHeader
        title="Дневник ЗП"
        description={`Начисления сотрудников · ${format(monthDate, "LLLL yyyy", { locale: ru })} · итого ${formatRub(total)}`}
      />

      <form
        method="get"
        action="/payroll"
        className="mb-3 flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3 sm:flex-row sm:flex-wrap sm:items-end"
      >
        <Select name="month" label="Месяц" defaultValue={monthKey}>
          {monthOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
        <Select name="employeeId" label="Сотрудник" defaultValue={employeeFilter || ""}>
          <option value="">Все</option>
          {employees.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </Select>
        <Button type="submit" size="sm" variant="secondary">
          Показать
        </Button>
      </form>

      <div className="mb-4 grid gap-4 lg:grid-cols-3">
        <Card title="Новая запись" className="lg:col-span-1">
          <form action={createSalaryEntryAction} className="space-y-3">
            <Select name="employeeId" label="Сотрудник" required defaultValue="">
              <option value="" disabled>
                Выберите…
              </option>
              {employees.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({ROLE_LABELS[u.role] || u.role})
                </option>
              ))}
            </Select>
            <Input name="entryDate" label="Дата" type="date" required defaultValue={today} />
            <Input
              name="amount"
              label="Сумма, ₽"
              type="number"
              step="1"
              min="0"
              required
              placeholder="0"
            />
            <Select name="type" label="Тип" required defaultValue="SALARY">
              {Object.entries(SALARY_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
            <Textarea name="note" label="Комментарий" placeholder="Опционально" rows={2} />
            <Button type="submit" size="sm">
              Добавить в дневник
            </Button>
          </form>
        </Card>

        <Card title="Итого по сотрудникам" className="lg:col-span-2">
          {summaryRows.length === 0 ? (
            <p className="text-sm text-slate-500">За выбранный месяц записей нет</p>
          ) : (
            <ul className="divide-y divide-slate-100 text-sm">
              {summaryRows.map((row) => (
                <li key={row.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <div className="font-medium text-slate-900">{row.name}</div>
                    <div className="text-xs text-slate-500">
                      {ROLE_LABELS[row.role] || row.role} · {row.count} запис.
                    </div>
                  </div>
                  <div
                    className={`shrink-0 font-semibold tabular-nums ${
                      row.total < 0 ? "text-rose-600" : "text-slate-900"
                    }`}
                  >
                    {formatRub(row.total)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <DataTable
        rows={entries}
        empty="Нет записей за выбранный период"
        columns={[
          {
            key: "date",
            header: "Дата",
            render: (r) => formatDate(r.entryDate),
          },
          {
            key: "employee",
            header: "Сотрудник",
            render: (r) => r.employee.name,
          },
          {
            key: "type",
            header: "Тип",
            render: (r) => (
              <Badge>{SALARY_TYPE_LABELS[r.type] || r.type}</Badge>
            ),
          },
          {
            key: "amount",
            header: "Сумма",
            className: "text-right",
            render: (r) => (
              <span
                className={`tabular-nums font-medium ${
                  r.amount < 0 ? "text-rose-600" : "text-slate-900"
                }`}
              >
                {formatRub(r.amount)}
              </span>
            ),
          },
          {
            key: "note",
            header: "Комментарий",
            render: (r) => (
              <span className="text-slate-600">{r.note || "—"}</span>
            ),
          },
          {
            key: "by",
            header: "Кто внёс",
            render: (r) => (
              <span className="text-xs text-slate-500">{r.createdBy.name}</span>
            ),
          },
          {
            key: "actions",
            header: "",
            render: (r) => (
              <form action={deleteSalaryEntryAction}>
                <input type="hidden" name="id" value={r.id} />
                <Button type="submit" size="sm" variant="ghost" className="text-rose-600">
                  Удалить
                </Button>
              </form>
            ),
          },
        ]}
      />
    </div>
  );
}
