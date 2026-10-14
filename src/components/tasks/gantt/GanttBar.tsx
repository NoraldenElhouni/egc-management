import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import Tooltip from "../../ui/Tooltip";
import { HOLD_STYLE, WAIT_STYLE, holdingLabel, waitingLabel } from "../board/DependencyBadges";
import type { DependencyFlags } from "../../../hooks/tasks/dependencyFlags";
import type { BarSpan } from "./ganttScale";
import { addWorkingDays, workingDayOnOrAfter, workingDaysBetween } from "../board/workingDays";

// One task's bar on the Gantt (TaskGantt.tsx). The page is dir="rtl", so
// time runs right → left: a bar's RIGHT edge is its start date and its
// LEFT edge its due date, and dragging leftward moves it later.
//
// Pointer events with capture on the bar itself (not native HTML5 drag,
// which TaskRow uses for reordering): a resize needs continuous movement
// updates and no drag ghost image. The bar previews the drag locally and
// only reports once, on release — the mutation behind onCommit is
// optimistic, so the bar doesn't snap back while the save is in flight.
//
// On a real (calendar) board a task is a start plus a number of working
// days (`scheduling` below): the drag snaps to working days (Friday is
// skipped), a linked task can't be dragged before its predecessors end
// (`earliestDay`), and what's reported is what the gesture changed —
// move = new start (same days), right edge = new start and days, left
// edge = new days. The server works out the due date and moves the
// tasks linked after it. A summary (parent with subtasks) isn't draggable.

export const ROW_H = 36;
export const BAR_H = 20;
/** Narrower than this and the resize handles would cover the whole bar. */
const RESIZE_MIN_W = 16;
/** A bar is never drawn thinner than this, even at month zoom (4px/day). */
export const MIN_BAR_W = 6;
/** Half the diagonal of the rotated 14px milestone square. */
export const MILESTONE_HALF = 10;
/** Narrower than this, the title goes beside the bar instead of inside. */
const LABEL_INSIDE_MIN_W = 80;
/** Pointer travel below this is a click (open the task), not a drag. */
const CLICK_SLOP = 3;

type DragMode = "move" | "start" | "end";

interface DragState {
  mode: DragMode;
  originX: number;
  delta: number;
  moved: boolean;
}

/** Which DB dates to write, as day indexes — a key is only present when
 * that column should change. A scheduled bar reports durationDays
 * (working days) instead of endDay. */
export interface BarChange {
  startDay?: number;
  endDay?: number;
  durationDays?: number;
}

/** A calendar board's task: start + working days, maybe linked. */
export interface BarScheduling {
  durationDays: number;
  /** tasks.earliest_start as a day index; null = not linked. */
  earliestDay: number | null;
}

interface ScheduledDrag {
  startDay: number;
  endDay: number;
  durationDays: number;
  /** The start was held back at earliestDay. */
  clamped: boolean;
}

function applyScheduledDrag(span: BarSpan, sched: BarScheduling, mode: DragMode, delta: number): ScheduledDrag {
  const floor = sched.earliestDay;
  const clampStart = (day: number) => {
    const snapped = workingDayOnOrAfter(day);
    return floor !== null && snapped < floor ? { day: floor, clamped: true } : { day: snapped, clamped: false };
  };
  if (mode === "move") {
    const { day, clamped } = clampStart(span.startDay + delta);
    return { startDay: day, endDay: addWorkingDays(day, sched.durationDays), durationDays: sched.durationDays, clamped };
  }
  if (mode === "start") {
    const { day, clamped } = clampStart(Math.min(span.startDay + delta, span.endDay));
    const startDay = Math.min(day, span.endDay);
    const durationDays = Math.max(1, workingDaysBetween(startDay, span.endDay));
    return { startDay, endDay: addWorkingDays(startDay, durationDays), durationDays, clamped };
  }
  const durationDays = Math.max(1, workingDaysBetween(span.startDay, Math.max(span.endDay + delta, span.startDay)));
  return { startDay: span.startDay, endDay: addWorkingDays(span.startDay, durationDays), durationDays, clamped: false };
}

function scheduledChange(span: BarSpan, sched: BarScheduling, mode: DragMode, next: ScheduledDrag): BarChange {
  if (mode === "move") return next.startDay !== span.startDay ? { startDay: next.startDay } : {};
  if (mode === "end") return next.durationDays !== sched.durationDays ? { durationDays: next.durationDays } : {};
  return next.startDay !== span.startDay || next.durationDays !== sched.durationDays
    ? { startDay: next.startDay, durationDays: next.durationDays }
    : {};
}

function applyDrag(span: BarSpan, mode: DragMode, delta: number): { startDay: number; endDay: number } {
  if (mode === "move") return { startDay: span.startDay + delta, endDay: span.endDay + delta };
  // Resizing clamps at the other edge, so start can never pass due.
  if (mode === "start") return { startDay: Math.min(span.startDay + delta, span.endDay), endDay: span.endDay };
  return { startDay: span.startDay, endDay: Math.max(span.endDay + delta, span.startDay) };
}

/** Only the columns that held a value move with the bar — dragging a
 * due-date-only bar must not invent a start date. A resized edge is
 * always written, and a resize also writes the opposite edge if that
 * column was empty, so the saved task keeps the range the user drew
 * (otherwise a start-only bar would collapse back to one day). */
function toChange(span: BarSpan, mode: DragMode, next: { startDay: number; endDay: number }): BarChange {
  const change: BarChange = {};
  if (mode === "move") {
    if (span.hasStart) change.startDay = next.startDay;
    if (span.hasDue) change.endDay = next.endDay;
    return change;
  }
  if (mode === "start" || !span.hasStart) change.startDay = next.startDay;
  if (mode === "end" || !span.hasDue) change.endDay = next.endDay;
  return change;
}

/** White text on dark status colors, dark text on light ones (a yellow
 * "in review" status would otherwise be unreadable). */
function textColorFor(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return "#ffffff";
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.65 ? "#1f2937" : "#ffffff";
}

interface GanttBarProps {
  span: BarSpan;
  rangeStart: number;
  pxPerDay: number;
  title: string;
  color: string;
  /** done/closed status category — drawn faded. */
  done: boolean;
  overdue: boolean;
  /** Stop icon while it waits on an open task, "!" while others wait on it. */
  dependency?: DependencyFlags;
  /** "من ... إلى ..." for a given (possibly mid-drag) day range. */
  describe: (startDay: number, endDay: number) => string;
  /** How far in from the scroller's right edge the sticky left panel ends
   * (plus a little air) — the inside title slides to stay clear of it. */
  labelInset: number;
  onOpen: () => void;
  onCommit: (change: BarChange) => void;
  /** No edit rights: the bar can be clicked open but never dragged. */
  readOnly?: boolean;
  /** Calendar boards: drag in working days, respecting links. */
  scheduling?: BarScheduling | null;
  /** A parent with subtasks: drawn as a bracket spanning them, not draggable. */
  summary?: boolean;
  /** "لا يمكن أن تبدأ قبل …" for a drag held back by the task's links. */
  describeFloor?: (day: number) => string;
  /** Hovering the bar highlights its chain of links. */
  onHover?: (hovering: boolean) => void;
}

export default function GanttBar({
  span,
  rangeStart,
  pxPerDay,
  title,
  color,
  done,
  overdue,
  dependency,
  describe,
  labelInset,
  onOpen,
  onCommit,
  readOnly: readOnlyProp = false,
  scheduling = null,
  summary = false,
  describeFloor,
  onHover,
}: GanttBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const readOnly = readOnlyProp || summary;

  const scheduled = drag && scheduling ? applyScheduledDrag(span, scheduling, drag.mode, drag.delta) : null;
  const view = scheduled ?? (drag ? applyDrag(span, drag.mode, drag.delta) : span);
  const isMilestone = span.kind === "milestone";
  const hoverHandlers = onHover
    ? { onMouseEnter: () => onHover(true), onMouseLeave: () => onHover(false) }
    : {};

  const begin = (mode: DragMode) => (e: ReactPointerEvent) => {
    if (e.button !== 0) return;
    // A handle sits inside the bar — stop here so the bar's own "move"
    // handler doesn't also start.
    e.stopPropagation();
    e.preventDefault();
    barRef.current?.setPointerCapture(e.pointerId);
    setDrag({ mode, originX: e.clientX, delta: 0, moved: false });
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    // Read-only: the pointer never counts as "moved", so release is a click.
    if (!drag || readOnly) return;
    const dx = e.clientX - drag.originX;
    const moved = drag.moved || Math.abs(dx) >= CLICK_SLOP;
    // RTL: a leftward drag (negative dx) is later in time.
    const delta = moved ? Math.round(-dx / pxPerDay) : 0;
    if (delta !== drag.delta || moved !== drag.moved) setDrag({ ...drag, delta, moved });
  };

  const onPointerUp = () => {
    if (!drag) return;
    const finished = drag;
    setDrag(null);
    if (!finished.moved) {
      onOpen();
      return;
    }
    if (finished.delta === 0) return;
    const change = scheduling
      ? scheduledChange(span, scheduling, finished.mode, applyScheduledDrag(span, scheduling, finished.mode, finished.delta))
      : toChange(span, finished.mode, applyDrag(span, finished.mode, finished.delta));
    if (Object.keys(change).length > 0) onCommit(change);
  };

  const dragLabel = drag?.moved
    ? scheduled?.clamped && scheduling?.earliestDay != null && describeFloor
      ? describeFloor(scheduling.earliestDay)
      : describe(view.startDay, view.endDay)
    : null;
  const tooltip = drag
    ? null
    : [
        `${title} · ${describe(span.startDay, span.endDay)}`,
        dependency?.waitingOn.length ? waitingLabel(dependency.waitingOn) : null,
        dependency?.holding.length ? holdingLabel(dependency.holding) : null,
      ]
        .filter(Boolean)
        .join(" · ");
  const pointerHandlers = {
    onPointerMove,
    onPointerUp,
    onPointerCancel: () => setDrag(null),
  };
  const dragLabelEl = dragLabel && (
    <span
      className={`pointer-events-none absolute -top-5 right-0 z-10 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] text-white ${
        scheduled?.clamped ? "bg-red-600" : "bg-gray-800"
      }`}
    >
      {dragLabel}
    </span>
  );

  if (summary && !isMilestone) {
    // A parent's span over its subtasks: a bracket, clickable, not draggable.
    const right = (span.startDay - rangeStart) * pxPerDay;
    const width = Math.max((span.endDay - span.startDay + 1) * pxPerDay, MIN_BAR_W);
    return (
      <>
        <div
          {...hoverHandlers}
          onClick={onOpen}
          className={`absolute cursor-pointer ${done ? "opacity-50" : ""}`}
          style={{ right, width, top: ROW_H / 2 - 6, height: 12 }}
        >
          <Tooltip label={`${title} · ${describe(span.startDay, span.endDay)} · محسوبة من المهام الفرعية`} className="h-full w-full">
            <span className="block h-full w-full border-x-[3px] border-gray-700">
              <span className="mt-[3px] block h-1.5 w-full bg-gray-600" />
            </span>
          </Tooltip>
        </div>
        <OutsideLabel right={right + width + 6} title={title} dependency={dependency} done={done} />
      </>
    );
  }

  if (isMilestone) {
    const size = 14;
    const center = (view.startDay - rangeStart + 0.5) * pxPerDay;
    return (
      <>
        <div
          ref={barRef}
          {...pointerHandlers}
          {...hoverHandlers}
          onPointerDown={begin("move")}
          className={`absolute select-none touch-none ${drag?.moved ? "z-[2] cursor-grabbing" : "cursor-grab"}`}
          style={{ right: center - size / 2, top: (ROW_H - size) / 2, width: size, height: size }}
        >
          <Tooltip label={tooltip} className="h-full w-full">
            <span
              className={`block h-full w-full rotate-45 rounded-[2px] ${done ? "opacity-50" : ""} ${
                overdue ? "ring-2 ring-red-400 ring-offset-1" : ""
              }`}
              style={{ background: color }}
            />
          </Tooltip>
          {dragLabelEl}
        </div>
        <OutsideLabel right={center + MILESTONE_HALF + 4} title={title} dependency={dependency} done={done} />
      </>
    );
  }

  const right = (view.startDay - rangeStart) * pxPerDay;
  const width = Math.max((view.endDay - view.startDay + 1) * pxPerDay, MIN_BAR_W);
  const resizable = width >= RESIZE_MIN_W;
  const labelInside = width >= LABEL_INSIDE_MIN_W;

  return (
    <>
      <div
        ref={barRef}
        {...pointerHandlers}
        {...hoverHandlers}
        onPointerDown={begin("move")}
        className={`absolute select-none touch-none rounded ${done ? "opacity-50" : ""} ${
          overdue ? "ring-2 ring-red-400 ring-offset-1" : ""
        } ${scheduled?.clamped ? "ring-2 ring-red-500" : ""} ${drag?.moved ? "z-[2] cursor-grabbing shadow-md" : readOnly ? "cursor-pointer" : "cursor-grab"}`}
        style={{
          right,
          top: (ROW_H - BAR_H) / 2,
          width,
          height: BAR_H,
          background: color,
          color: textColorFor(color),
        }}
      >
        <Tooltip label={tooltip} className="h-full w-full">
          {/* overflow-clip, not -hidden: hidden would make this span the
              nearest scroll container and the sticky title below would
              stop sticking to the real scroller. */}
          <span className="flex h-full w-full items-center overflow-clip px-1.5 text-[11px] font-medium">
            {labelInside && (
              // Sticky: a bar that starts under the left panel keeps its
              // title (and lock) visible beside the panel instead of
              // being cut off by it.
              <span className="sticky flex min-w-0 items-center gap-1" style={{ right: labelInset }}>
                <DependencyIcons dependency={dependency} onBar />
                <span className="truncate">{title}</span>
              </span>
            )}
          </span>
        </Tooltip>
        {resizable && !readOnly && (
          <>
            {/* RTL: right edge = start date, left edge = due date. */}
            <span
              onPointerDown={begin("start")}
              className="absolute inset-y-0 right-0 w-1.5 cursor-ew-resize rounded-r hover:bg-black/20"
            />
            <span
              onPointerDown={begin("end")}
              className="absolute inset-y-0 left-0 w-1.5 cursor-ew-resize rounded-l hover:bg-black/20"
            />
          </>
        )}
        {dragLabelEl}
      </div>
      {!labelInside && <OutsideLabel right={right + width + 6} title={title} dependency={dependency} done={done} />}
    </>
  );
}

/** The title beside a bar too short to hold it — just past its due-date
 * end (to its left, RTL). At week/month zoom that's most bars; without
 * this they'd be unlabeled slivers. */
function OutsideLabel({
  right,
  title,
  dependency,
  done,
}: {
  right: number;
  title: string;
  dependency?: DependencyFlags;
  done: boolean;
}) {
  return (
    <span
      className={`pointer-events-none absolute flex max-w-[220px] items-center gap-1 whitespace-nowrap text-xs text-gray-600 ${
        done ? "opacity-50" : ""
      }`}
      style={{ right, top: 0, height: ROW_H }}
    >
      <DependencyIcons dependency={dependency} />
      <span className="truncate">{title}</span>
    </span>
  );
}

/** The board row's stop / "!" beside a bar's title. On the bar itself each
 * sits on a white dot so it reads on any status colour. */
function DependencyIcons({ dependency, onBar = false }: { dependency?: DependencyFlags; onBar?: boolean }) {
  if (!dependency) return null;
  const dot = onBar ? "rounded-full bg-white/90 p-px" : "";
  return (
    <>
      {dependency.waitingOn.length > 0 && (
        <span className={`inline-flex shrink-0 ${dot} ${WAIT_STYLE.text}`}>
          <WAIT_STYLE.Icon className="h-3 w-3" />
        </span>
      )}
      {dependency.holding.length > 0 && (
        <span className={`inline-flex shrink-0 ${dot} ${HOLD_STYLE.text}`}>
          <HOLD_STYLE.Icon className="h-3 w-3" />
        </span>
      )}
    </>
  );
}
