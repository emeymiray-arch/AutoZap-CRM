"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
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

const LONG_PRESS_MS = 2000;
const MOVE_CANCEL_PX = 10;
const MOBILE_MQ = "(max-width: 767px)";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isMobile;
}

function CardBody({ item, href }: { item: KanbanCard; href: (id: string) => string }) {
  return (
    <>
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
    </>
  );
}

/** Карточка для телефона: долгое нажатие 2с → выбор этапа */
function MobileCard({
  item,
  href,
  onLongPress,
}: {
  item: KanbanCard;
  href: (id: string) => string;
  onLongPress: (item: KanbanCard) => void;
}) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const [pressing, setPressing] = useState(false);

  function clear() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    start.current = null;
    setPressing(false);
  }

  function onPointerDown(e: React.PointerEvent) {
    if (e.button !== 0) return;
    start.current = { x: e.clientX, y: e.clientY };
    setPressing(true);
    timer.current = setTimeout(() => {
      timer.current = null;
      setPressing(false);
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try {
          navigator.vibrate(30);
        } catch {
          /* ignore */
        }
      }
      onLongPress(item);
    }, LONG_PRESS_MS);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!start.current || !timer.current) return;
    const dx = Math.abs(e.clientX - start.current.x);
    const dy = Math.abs(e.clientY - start.current.y);
    if (dx > MOVE_CANCEL_PX || dy > MOVE_CANCEL_PX) clear();
  }

  useEffect(() => () => clear(), []);

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={clear}
      onPointerCancel={clear}
      onContextMenu={(e) => e.preventDefault()}
      className={`touch-manipulation select-none rounded-md border border-slate-200 bg-white p-2 shadow-sm transition ${
        pressing ? "scale-[0.98] ring-2 ring-teal-500/40" : ""
      }`}
      style={{ WebkitTouchCallout: "none", WebkitUserSelect: "none", userSelect: "none" }}
    >
      <CardBody item={item} href={href} />
      {pressing ? (
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-teal-500"
            style={{ animation: `kanban-longpress ${LONG_PRESS_MS}ms linear forwards` }}
          />
        </div>
      ) : null}
    </div>
  );
}

function DragCard({
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
      <CardBody item={item} href={href} />
    </div>
  );
}

function Column({
  stage,
  label,
  items,
  href,
  mobile,
  onLongPress,
}: {
  stage: string;
  label: string;
  items: KanbanCard[];
  href: (id: string) => string;
  mobile?: boolean;
  onLongPress?: (item: KanbanCard) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage, disabled: mobile });
  const empty = items.length === 0;
  if (mobile && empty) return null;

  return (
    <div
      ref={mobile ? undefined : setNodeRef}
      className={`flex w-full shrink-0 flex-col rounded-lg border bg-slate-50 md:w-64 ${
        isOver ? "border-teal-600 bg-teal-50/40" : "border-slate-200"
      }`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-3 py-2">
        <Badge status={stage} className="max-w-[80%] truncate text-[10px] md:text-xs">
          {label}
        </Badge>
        <span className="shrink-0 text-xs tabular-nums text-slate-500">{items.length}</span>
      </div>
      <div className={`flex flex-col gap-1.5 p-2 md:min-h-[120px] md:gap-2 ${empty ? "min-h-[2.5rem]" : ""}`}>
        {items.map((item) =>
          mobile && onLongPress ? (
            <MobileCard key={item.id} item={item} href={href} onLongPress={onLongPress} />
          ) : (
            <DragCard key={item.id} item={item} href={href} />
          ),
        )}
        {empty ? <p className="hidden text-center text-[11px] text-slate-400 md:block">Перетащите сюда</p> : null}
      </div>
    </div>
  );
}

function StagePicker({
  item,
  stages,
  labels,
  onSelect,
  onClose,
}: {
  item: KanbanCard;
  stages: readonly string[];
  labels: Record<string, string>;
  onSelect: (stage: string) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center md:hidden" role="dialog" aria-modal>
      <button type="button" className="absolute inset-0 bg-slate-950/40" onClick={onClose} aria-label="Закрыть" />
      <div className="relative z-10 max-h-[70dvh] w-full max-w-lg overflow-hidden rounded-t-2xl bg-white shadow-xl">
        <div className="border-b border-slate-100 px-4 py-3">
          <div className="text-sm font-semibold text-slate-900">Этап воронки</div>
          <div className="mt-0.5 truncate text-xs text-slate-500">{item.title}</div>
        </div>
        <ul className="overflow-y-auto px-2 py-2" style={{ maxHeight: "calc(70dvh - 4rem)" }}>
          {stages.map((stage) => {
            const current = stage === item.stage;
            return (
              <li key={stage}>
                <button
                  type="button"
                  disabled={current}
                  onClick={() => onSelect(stage)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm ${
                    current
                      ? "bg-teal-50 font-medium text-teal-900"
                      : "text-slate-800 active:bg-slate-50"
                  }`}
                >
                  <span>{labels[stage] || stage}</span>
                  {current ? <span className="text-xs text-teal-700">сейчас</span> : null}
                </button>
              </li>
            );
          })}
        </ul>
        <div className="border-t border-slate-100 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-slate-100 py-2.5 text-sm font-medium text-slate-700"
          >
            Отмена
          </button>
        </div>
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
  const [pickerItem, setPickerItem] = useState<KanbanCard | null>(null);
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobile();
  const [, startTransition] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useEffect(() => {
    setMounted(true);
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

  function moveTo(id: string, target: string) {
    const item = items.find((i) => i.id === id);
    if (!item || target === item.stage) return;
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, stage: target } : i)));
    startTransition(async () => {
      try {
        await onMove(id, target);
      } catch {
        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, stage: item.stage } : i)));
      }
    });
  }

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const id = String(e.active.id);
    const overId = e.over?.id ? String(e.over.id) : null;
    if (!overId) return;
    const target = stages.includes(overId)
      ? overId
      : items.find((i) => i.id === overId)?.stage;
    if (!target) return;
    moveTo(id, target);
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
        />
      ))}
    </div>
  );

  // До монтирования / на телефоне — без dnd-kit
  if (!mounted || isMobile) {
    return (
      <>
        <style>{`@keyframes kanban-longpress{from{width:0%}to{width:100%}}`}</style>
        <div className="mb-2 text-xs text-slate-500 md:hidden">
          Удерживайте карточку 2 сек, чтобы сменить этап
        </div>
        <div className="flex flex-col gap-2 pb-4">
          {stages
            .filter((s) => (byStage[s] || []).length > 0)
            .map((stage) => (
              <Column
                key={stage}
                stage={stage}
                label={labels[stage] || stage}
                items={byStage[stage] || []}
                href={href}
                mobile
                onLongPress={setPickerItem}
              />
            ))}
        </div>
        {pickerItem ? (
          <StagePicker
            item={pickerItem}
            stages={stages}
            labels={labels}
            onClose={() => setPickerItem(null)}
            onSelect={(stage) => {
              moveTo(pickerItem.id, stage);
              setPickerItem(null);
            }}
          />
        ) : null}
      </>
    );
  }

  return (
    <DndContext id="autozap-status-kanban" sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      {board}
      <DragOverlay>{active ? <DragCard item={active} href={href} dragging /> : null}</DragOverlay>
    </DndContext>
  );
}
