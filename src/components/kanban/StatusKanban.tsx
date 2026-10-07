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

const MOBILE_MQ = "(max-width: 767px)";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isMobile;
}

function Card({
  item,
  href,
  dragging,
  compact,
}: {
  item: KanbanCard;
  href: (id: string) => string;
  dragging?: boolean;
  compact?: boolean;
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
      className={`touch-manipulation cursor-grab rounded-md border border-slate-200 bg-white shadow-sm active:cursor-grabbing ${
        compact ? "p-2" : "p-2.5"
      } ${dragging ? "shadow-md ring-2 ring-teal-600/30" : ""}`}
    >
      <Link
        href={href(item.id)}
        className={`font-medium text-slate-900 hover:underline ${compact ? "text-sm leading-snug" : "text-sm"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {item.title}
      </Link>
      {!compact && item.subtitle ? <div className="mt-1 text-xs text-slate-500">{item.subtitle}</div> : null}
      {!compact && item.meta ? <div className="mt-2 text-xs text-slate-600">{item.meta}</div> : null}
      {compact && (item.subtitle || item.meta) ? (
        <div className="mt-0.5 truncate text-xs text-slate-500">{item.subtitle || item.meta}</div>
      ) : null}
    </div>
  );
}

function StaticCard({
  item,
  href,
  compact,
}: {
  item: KanbanCard;
  href: (id: string) => string;
  compact?: boolean;
}) {
  return (
    <div className={`rounded-md border border-slate-200 bg-white shadow-sm ${compact ? "p-2" : "p-2.5"}`}>
      <Link
        href={href(item.id)}
        className={`font-medium text-slate-900 hover:underline ${compact ? "text-sm leading-snug" : "text-sm"}`}
      >
        {item.title}
      </Link>
      {!compact && item.subtitle ? <div className="mt-1 text-xs text-slate-500">{item.subtitle}</div> : null}
      {compact && (item.subtitle || item.meta) ? (
        <div className="mt-0.5 truncate text-xs text-slate-500">{item.subtitle || item.meta}</div>
      ) : null}
    </div>
  );
}

function StaticColumn({
  stage,
  label,
  items,
  href,
  vertical,
}: {
  stage: string;
  label: string;
  items: KanbanCard[];
  href: (id: string) => string;
  vertical?: boolean;
}) {
  const empty = items.length === 0;
  if (vertical) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-3 py-2">
          <Badge status={stage} className="max-w-[75%] truncate text-[10px]">
            {label}
          </Badge>
          <span className="shrink-0 text-xs tabular-nums text-slate-500">{items.length}</span>
        </div>
        <div className={`flex flex-col gap-1.5 p-2 ${empty ? "min-h-[2.5rem]" : ""}`}>
          {items.map((item) => (
            <StaticCard key={item.id} item={item} href={href} compact />
          ))}
          {empty ? <p className="text-center text-[11px] text-slate-400">Перетащите сюда</p> : null}
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-64 shrink-0 flex-col rounded-lg border border-slate-200 bg-slate-50">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-3 py-2">
        <Badge status={stage}>{label}</Badge>
        <span className="text-xs tabular-nums text-slate-500">{items.length}</span>
      </div>
      <div className="flex min-h-[120px] flex-1 flex-col gap-2 p-2">
        {items.map((item) => (
          <StaticCard key={item.id} item={item} href={href} />
        ))}
      </div>
    </div>
  );
}

function Column({
  stage,
  label,
  items,
  href,
  vertical,
}: {
  stage: string;
  label: string;
  items: KanbanCard[];
  href: (id: string) => string;
  vertical?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const empty = items.length === 0;

  if (vertical) {
    return (
      <div
        ref={setNodeRef}
        className={`rounded-lg border bg-slate-50 transition-colors ${
          isOver ? "border-teal-600 bg-teal-50/50" : "border-slate-200"
        }`}
      >
        <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-3 py-2">
          <Badge status={stage} className="max-w-[75%] truncate text-[10px]">
            {label}
          </Badge>
          <span className="shrink-0 text-xs tabular-nums text-slate-500">{items.length}</span>
        </div>
        <div className={`flex flex-col gap-1.5 p-2 ${empty ? "min-h-[2.75rem]" : ""}`}>
          {items.map((item) => (
            <Card key={item.id} item={item} href={href} compact />
          ))}
          {empty && !isOver ? (
            <p className="pointer-events-none text-center text-[11px] text-slate-400">Перетащите сюда</p>
          ) : null}
        </div>
      </div>
    );
  }

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

function KanbanBoard({
  stages,
  labels,
  byStage,
  href,
  vertical,
  interactive,
}: {
  stages: readonly string[];
  labels: Record<string, string>;
  byStage: Record<string, KanbanCard[]>;
  href: (id: string) => string;
  vertical: boolean;
  interactive: boolean;
}) {
  const Col = interactive ? Column : StaticColumn;

  if (vertical) {
    return (
      <div className="flex flex-col gap-2 pb-4 md:hidden">
        {stages.map((stage) => (
          <Col
            key={stage}
            stage={stage}
            label={labels[stage] || stage}
            items={byStage[stage] || []}
            href={href}
            vertical
          />
        ))}
      </div>
    );
  }

  return (
    <div className="hidden gap-3 overflow-x-auto pb-4 md:flex">
      {stages.map((stage) => (
        <Col
          key={stage}
          stage={stage}
          label={labels[stage] || stage}
          items={byStage[stage] || []}
          href={href}
        />
      ))}
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
  const isMobile = useIsMobile();
  const [, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } }),
  );

  useEffect(() => {
    setDndReady(true);
  }, []);

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
  const vertical = isMobile !== false;

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

  if (!dndReady || isMobile === null) {
    return (
      <>
        <KanbanBoard
          stages={stages}
          labels={labels}
          byStage={byStage}
          href={href}
          vertical
          interactive={false}
        />
        <KanbanBoard
          stages={stages}
          labels={labels}
          byStage={byStage}
          href={href}
          vertical={false}
          interactive={false}
        />
      </>
    );
  }

  return (
    <DndContext id="autozap-status-kanban" sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <KanbanBoard
        stages={stages}
        labels={labels}
        byStage={byStage}
        href={href}
        vertical={vertical}
        interactive
      />
      <DragOverlay>
        {active ? <Card item={active} href={href} dragging compact={vertical} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
