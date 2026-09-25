"use client";

import { StatusKanban, type KanbanCard } from "@/components/kanban/StatusKanban";
import { movePartnerStatusAction } from "@/lib/actions";
import { PARTNER_FUNNEL_ORDER, PARTNER_STATUS_LABELS } from "@/lib/labels";

export function PartnerKanban({ items }: { items: KanbanCard[] }) {
  return (
    <StatusKanban
      initialItems={items}
      stages={PARTNER_FUNNEL_ORDER}
      labels={PARTNER_STATUS_LABELS}
      href={(id) => `/partners/${id}`}
      onMove={movePartnerStatusAction}
    />
  );
}
