"use client";

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
  hideEdit,
  listHref,
}: {
  entity: string;
  id: string;
  archived?: boolean | Date | string | null;
  canDelete?: boolean;
  editHref: string;
  restoreTo: string;
  /** Карточка уже с формой редактирования */
  hideEdit?: boolean;
  /** Куда вернуться после удаления */
  listHref?: string;
}) {
  const [pending, start] = useTransition();
  const afterDelete = listHref || restoreTo.replace(/\/[^/]+$/, "") || "/dashboard";

  return (
    <div className="flex flex-wrap gap-2">
      {!archived && (
        <>
          {!hideEdit ? (
            <Button href={editHref} variant="secondary" size="sm">
              Изменить
            </Button>
          ) : null}
          <Button
            variant="secondary"
            size="sm"
            disabled={pending}
            onClick={() => {
              if (confirm("Убрать в архив? Можно будет восстановить.")) {
                start(() => archiveAction(entity, id, restoreTo));
              }
            }}
          >
            В архив
          </Button>
          {canDelete ? (
            <Button
              variant="danger"
              size="sm"
              disabled={pending}
              onClick={() => {
                if (
                  confirm(
                    "Удалить эту запись навсегда? Восстановить будет нельзя.",
                  )
                ) {
                  start(() => hardDeleteAction(entity, id, afterDelete));
                }
              }}
            >
              Удалить
            </Button>
          ) : null}
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
          {canDelete ? (
            <Button
              variant="danger"
              size="sm"
              disabled={pending}
              onClick={() => {
                if (confirm("Удалить навсегда без возможности восстановления?")) {
                  start(() => hardDeleteAction(entity, id, afterDelete));
                }
              }}
            >
              Удалить навсегда
            </Button>
          ) : null}
        </>
      )}
    </div>
  );
}
