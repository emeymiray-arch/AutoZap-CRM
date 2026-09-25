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
import { Badge } from "@/components/ui/Badge";

export type KanbanCard = {
  id: string;
  title: string;
  stage: string;
  subtitle?: string | null;
  meta?: string | null;
};

function Card({
  item,
  href,
  dragging,
}: {
  item: KanbanCard;
  href: (id: string) => string;
  dragging?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: { item },
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.4 : 1,
      }}
      {...listeners}
      {...attributes}
      className={`cursor-grab rounded-md border border-slate-200 bg-white p-2.5 shadow-sm active:cursor-grabbing ${
        dragging ? "shadow-md ring-2 ring-teal-600/30" : ""
      }`}
    >
      <Link
        href={href(item.id)}
        className="text-sm font-medium text-slate-900 hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        {item.title}
      </Link>
      {item.subtitle ? <div className="mt-1 text-xs text-slate-500">{item.subtitle}</div> : null}
      {item.meta ? <div className="mt-2 text-xs text-slate-600">{item.meta}</div> : null}
    </div>
  );
}

function Column({
  stage,
  label,
  items,
  href,
}: {
  stage: string;
  label: string;
  items: KanbanCard[];
  href: (id: string) => string;
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
        <Badge status={stage}>{label}</Badge>
        <span className="text-xs tabular-nums text-slate-500">{items.length}</span>
      </div>
      <div className="flex min-h-[120px] flex-1 flex-col gap-2 p-2">
        {items.map((item) => (
          <Card key={item.id} item={item} href={href} />
        ))}
      </div>
    </div>
  );
}

export function StatusKanban({
  initialItems,
  stages,
  labels,
  href,
  onMove,
}: {
  initialItems: KanbanCard[];
  stages: readonly string[];
  labels: Record<string, string>;
  href: (id: string) => string;
  onMove: (id: string, stage: string) => Promise<unknown>;
}) {
  const [items, setItems] = useState(initialItems);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const byStage = useMemo(() => {
    const map: Record<string, KanbanCard[]> = {};
    for (const s of stages) map[s] = [];
    for (const item of items) {
      const stage = stages.includes(item.stage) ? item.stage : stages[0];
      if (!map[stage]) map[stage] = [];
      map[stage].push({ ...item, stage });
    }
    return map;
  }, [items, stages]);

  const active = activeId ? items.find((i) => i.id === activeId) : null;

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const id = String(e.active.id);
    const overId = e.over?.id ? String(e.over.id) : null;
    if (!overId) return;
    const item = items.find((i) => i.id === id);
    if (!item) return;

    const target = stages.includes(overId)
      ? overId
      : items.find((i) => i.id === overId)?.stage;

    if (!target || target === item.stage) return;

    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, stage: target } : i)));
    startTransition(async () => {
      try {
        await onMove(id, target);
      } catch {
        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, stage: item.stage } : i)));
      }
    });
  }

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <Column
            key={stage}
            stage={stage}
            label={labels[stage] || stage}
            items={byStage[stage] || []}
            href={href}
          />
        ))}
      </div>
      <DragOverlay>{active ? <Card item={active} href={href} dragging /> : null}</DragOverlay>
    </DndContext>
  );
}
