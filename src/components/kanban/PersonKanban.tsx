"use client";

import { StatusKanban, type KanbanCard } from "@/components/kanban/StatusKanban";
import { movePersonStatusAction } from "@/lib/actions";
import { PERSON_FUNNEL_ORDER, PERSON_STATUS_LABELS } from "@/lib/labels";

export function PersonKanban({ items }: { items: KanbanCard[] }) {
  return (
    <StatusKanban
      initialItems={items}
      stages={PERSON_FUNNEL_ORDER}
      labels={PERSON_STATUS_LABELS}
      href={(id) => `/people/${id}`}
      onMove={movePersonStatusAction}
    />
  );
}
