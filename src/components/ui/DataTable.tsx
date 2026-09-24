import Link from "next/link";
import { cn } from "@/lib/utils";

export type Column<T> = {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => React.ReactNode;
};

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  href,
  empty = "Нет записей",
}: {
  columns: Column<T>[];
  rows: T[];
  href?: (row: T) => string;
  empty?: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
        {empty}
      </div>
    );
  }

  return (
    <div className="-mx-3 overflow-x-auto overscroll-x-contain rounded-none border-y border-slate-200 bg-white sm:mx-0 sm:rounded-lg sm:border">
      <table className="min-w-[36rem] w-full text-sm sm:min-w-full">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={cn("whitespace-nowrap px-3 py-2.5 font-medium", c.className)}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50/80">
              {columns.map((c, i) => (
                <td key={c.key} className={cn("px-3 py-2.5 text-slate-800", c.className)}>
                  {href && i === 0 ? (
                    <Link href={href(row)} className="font-medium text-slate-900 hover:underline">
                      {c.render(row)}
                    </Link>
                  ) : (
                    c.render(row)
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
