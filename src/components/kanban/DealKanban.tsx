"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { moveDealStageAction } from "@/lib/actions";
import { DEAL_STAGE_LABELS, DEAL_STAGES_ORDER } from "@/lib/labels";
import { Badge } from "@/components/ui/Badge";

export type KanbanDeal = {
  id: string;
  title: string;
  stage: string;
  amount: number | null;
  companyName?: string | null;
  responsibleName?: string | null;
};

function DealCard({
  deal,
  dragging,
}: {
  deal: KanbanDeal;
  dragging?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id,
    data: { deal },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`cursor-grab rounded-md border border-slate-200 bg-white p-2.5 shadow-sm active:cursor-grabbing ${
        dragging ? "shadow-md ring-2 ring-teal-600/30" : ""
      }`}
    >
      <Link
        href={`/crm/deals/${deal.id}`}
        className="text-sm font-medium text-slate-900 hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        {deal.title}
      </Link>
      {deal.companyName && (
        <div className="mt-1 text-xs text-slate-500">{deal.companyName}</div>
      )}
      <div className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-600">
        <span>{deal.responsibleName || "—"}</span>
        {deal.amount != null && (
          <span className="tabular-nums font-medium">
            {deal.amount.toLocaleString("ru-RU")}
          </span>
        )}
      </div>
    </div>
  );
}

function StageColumn({
  stage,
  deals,
}: {
  stage: string;
  deals: KanbanDeal[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div
      ref={setNodeRef}
      className={`flex w-64 shrink-0 flex-col rounded-lg border bg-slate-50 ${
        isOver ? "border-teal-600 bg-teal-50/40" : "border-slate-200"
      }`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-3 py-2">
        <Badge status={stage}>{DEAL_STAGE_LABELS[stage] || stage}</Badge>
        <span className="text-xs tabular-nums text-slate-500">{deals.length}</span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-2 min-h-[120px]">
        {deals.map((d) => (
          <DealCard key={d.id} deal={d} />
        ))}
      </div>
    </div>
  );
}

export function DealKanban({ initialDeals }: { initialDeals: KanbanDeal[] }) {
  const [deals, setDeals] = useState(initialDeals);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const byStage = useMemo(() => {
    const map: Record<string, KanbanDeal[]> = {};
    for (const s of DEAL_STAGES_ORDER) map[s] = [];
    for (const d of deals) {
      if (!map[d.stage]) map[d.stage] = [];
      map[d.stage].push(d);
    }
    return map;
  }, [deals]);

  const activeDeal = activeId ? deals.find((d) => d.id === activeId) : null;

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const dealId = String(e.active.id);
    const overId = e.over?.id ? String(e.over.id) : null;
    if (!overId) return;

    const deal = deals.find((d) => d.id === dealId);
    if (!deal) return;

    const targetStage = DEAL_STAGES_ORDER.includes(overId as never)
      ? overId
      : deals.find((d) => d.id === overId)?.stage;

    if (!targetStage || targetStage === deal.stage) return;

    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, stage: targetStage } : d))
    );

    startTransition(async () => {
      try {
        await moveDealStageAction(dealId, targetStage);
      } catch {
        setDeals((prev) =>
          prev.map((d) => (d.id === dealId ? { ...d, stage: deal.stage } : d))
        );
      }
    });
  }

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {DEAL_STAGES_ORDER.map((stage) => (
          <StageColumn key={stage} stage={stage} deals={byStage[stage] || []} />
        ))}
      </div>
      <DragOverlay>
        {activeDeal ? <DealCard deal={activeDeal} dragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}
