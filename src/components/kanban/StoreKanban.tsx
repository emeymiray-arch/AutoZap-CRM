"use client";

import { StatusKanban, type KanbanCard } from "@/components/kanban/StatusKanban";
import { moveStoreStatusAction } from "@/lib/actions";
import { STORE_FUNNEL_ORDER, STORE_STATUS_LABELS } from "@/lib/labels";

export function StoreKanban({ items }: { items: KanbanCard[] }) {
  return (
    <StatusKanban
      initialItems={items}
      stages={STORE_FUNNEL_ORDER}
      labels={STORE_STATUS_LABELS}
      href={(id) => `/stores/${id}`}
      onMove={moveStoreStatusAction}
    />
  );
}
