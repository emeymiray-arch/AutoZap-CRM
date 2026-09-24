"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { archiveAction, restoreAction, hardDeleteAction } from "@/lib/actions";

export function EntityActions({
  entity,
  id,
  archived,
  canDelete,
  editHref,
  restoreTo,
}: {
  entity: string;
  id: string;
  archived?: boolean | Date | string | null;
  canDelete?: boolean;
  editHref: string;
  restoreTo: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      {!archived && (
        <>
          <Button href={editHref} variant="secondary" size="sm">
            Изменить
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={pending}
            onClick={() => {
              if (confirm("Архивировать объект? Данные сохранятся.")) {
                start(() => archiveAction(entity, id, restoreTo));
              }
            }}
          >
            Архивировать
          </Button>
        </>
      )}
      {archived && (
        <>
          <Button
            size="sm"
            disabled={pending}
            onClick={() => start(() => restoreAction(entity, id, restoreTo))}
          >
            Восстановить
          </Button>
          {canDelete && (
            <Button
              variant="danger"
              size="sm"
              disabled={pending}
              onClick={() => {
                if (
                  confirm(
                    "Вы действительно хотите удалить объект? Это действие может быть необратимым."
                  )
                ) {
                  start(async () => {
                    await hardDeleteAction(entity, id);
                    router.refresh();
                  });
                }
              }}
            >
              Удалить навсегда
            </Button>
          )}
        </>
      )}
    </div>
  );
}
