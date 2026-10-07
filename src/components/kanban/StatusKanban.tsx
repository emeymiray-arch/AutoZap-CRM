"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
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
      className={`touch-manipulation cursor-grab rounded-md border border-slate-200 bg-white p-2 shadow-sm active:cursor-grabbing md:p-2.5 ${
        dragging ? "shadow-md ring-2 ring-teal-600/30" : ""
      }`}
    >
      <Link
        href={href(item.id)}
        className="text-sm font-medium leading-snug text-slate-900 hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        {item.title}
      </Link>
      {(item.subtitle || item.meta) && (
        <div className="mt-0.5 truncate text-xs text-slate-500 md:mt-1">
          {item.subtitle || item.meta}
        </div>
      )}
    </div>
  );
}

function Column({
  stage,
  label,
  items,
  href,
  showEmptyOnMobile,
}: {
  stage: string;
  label: string;
  items: KanbanCard[];
  href: (id: string) => string;
  /** пустой этап на телефоне виден только во время drag */
  showEmptyOnMobile?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const empty = items.length === 0;

  return (
    <div
      ref={setNodeRef}
      className={[
        "flex w-full shrink-0 flex-col rounded-lg border bg-slate-50 md:w-64",
        isOver ? "border-teal-600 bg-teal-50/40" : "border-slate-200",
        // телефон: пустые этапы скрыты, пока не тянут карточку
        empty && !showEmptyOnMobile ? "hidden md:flex" : "",
        // телефон при drag: компактная полоска-цель
        empty && showEmptyOnMobile
          ? "min-h-0 flex-row items-center justify-between px-3 py-2.5 md:min-h-0 md:flex-col md:items-stretch md:justify-start md:px-0 md:py-0"
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        className={`flex items-center justify-between gap-2 border-slate-200 px-3 py-2 ${
          empty && showEmptyOnMobile ? "w-full border-0 p-0 md:border-b md:px-3 md:py-2" : "border-b"
        }`}
      >
        <Badge
          status={stage}
          className={`max-w-[80%] truncate text-[10px] md:text-xs ${
            empty && showEmptyOnMobile ? "border-0 bg-transparent px-0 text-xs font-medium text-slate-600" : ""
          }`}
        >
          {label}
        </Badge>
        {empty && showEmptyOnMobile ? (
          <span className="shrink-0 text-[11px] text-slate-400 md:hidden">отпустить</span>
        ) : (
          <span className="shrink-0 text-xs tabular-nums text-slate-500">{items.length}</span>
        )}
      </div>
      <div
        className={`flex-col gap-1.5 p-2 md:flex md:min-h-[120px] md:gap-2 ${
          empty && showEmptyOnMobile ? "hidden md:flex" : "flex"
        } ${empty ? "min-h-[2.5rem]" : ""}`}
      >
        {items.map((item) => (
          <Card key={item.id} item={item} href={href} />
        ))}
        {empty ? <p className="text-center text-[11px] text-slate-400">Перетащите сюда</p> : null}
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
  const [dndReady, setDndReady] = useState(false);
  const [, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
  );

  useEffect(() => {
    setDndReady(true);
  }, []);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

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
  const dragging = Boolean(activeId);

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

  const board = (
    <div className="flex flex-col gap-2 pb-4 md:flex-row md:gap-3 md:overflow-x-auto">
      {stages.map((stage) => (
        <Column
          key={stage}
          stage={stage}
          label={labels[stage] || stage}
          items={byStage[stage] || []}
          href={href}
          showEmptyOnMobile={dragging}
        />
      ))}
    </div>
  );

  if (!dndReady) {
    return (
      <div className="flex flex-col gap-2 pb-4 md:flex-row md:gap-3 md:overflow-x-auto" aria-busy="true">
        {stages
          .filter((s) => (byStage[s] || []).length > 0)
          .map((stage) => (
            <div key={stage} className="w-full rounded-lg border border-slate-200 bg-slate-50 md:w-64">
              <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-3 py-2">
                <Badge status={stage} className="text-[10px] md:text-xs">
                  {labels[stage] || stage}
                </Badge>
                <span className="text-xs text-slate-500">{(byStage[stage] || []).length}</span>
              </div>
              <div className="flex flex-col gap-1.5 p-2">
                {(byStage[stage] || []).map((item) => (
                  <div key={item.id} className="rounded-md border border-slate-200 bg-white p-2 shadow-sm">
                    <div className="text-sm font-medium text-slate-900">{item.title}</div>
                    {(item.subtitle || item.meta) && (
                      <div className="mt-0.5 truncate text-xs text-slate-500">
                        {item.subtitle || item.meta}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>
    );
  }

  return (
    <DndContext id="autozap-status-kanban" sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      {board}
      <DragOverlay>{active ? <Card item={active} href={href} dragging /> : null}</DragOverlay>
    </DndContext>
  );
}
