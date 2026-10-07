import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Lock } from "lucide-react";
import Tooltip from "../../ui/Tooltip";
import type { BarSpan } from "./ganttScale";

// One task's bar on the Gantt (TaskGantt.tsx). The page is dir="rtl", so
// time runs right → left: a bar's RIGHT edge is its start date and its
// LEFT edge its due date, and dragging leftward moves it later.
//
// Pointer events with capture on the bar itself (not native HTML5 drag,
// which TaskRow uses for reordering): a resize needs continuous movement
// updates and no drag ghost image. The bar previews the drag locally and
// only reports once, on release — the mutation behind onCommit is
// optimistic, so the bar doesn't snap back while the save is in flight.

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
 * that column should change. */
export interface BarChange {
  startDay?: number;
  endDay?: number;
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
  blocked: boolean;
  /** "من ... إلى ..." for a given (possibly mid-drag) day range. */
  describe: (startDay: number, endDay: number) => string;
  /** How far in from the scroller's right edge the sticky left panel ends
   * (plus a little air) — the inside title slides to stay clear of it. */
  labelInset: number;
  onOpen: () => void;
  onCommit: (change: BarChange) => void;
  /** No edit rights: the bar can be clicked open but never dragged. */
  readOnly?: boolean;
}

export default function GanttBar({
  span,
  rangeStart,
  pxPerDay,
  title,
  color,
  done,
  overdue,
  blocked,
  describe,
  labelInset,
  onOpen,
  onCommit,
  readOnly = false,
}: GanttBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragState | null>(null);

  const view = drag ? applyDrag(span, drag.mode, drag.delta) : span;
  const isMilestone = span.kind === "milestone";

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
    const change = toChange(span, finished.mode, applyDrag(span, finished.mode, finished.delta));
    if (Object.keys(change).length > 0) onCommit(change);
  };

  const dragLabel = drag?.moved ? describe(view.startDay, view.endDay) : null;
  const tooltip = drag ? null : `${title} · ${describe(span.startDay, span.endDay)}`;
  const pointerHandlers = {
    onPointerMove,
    onPointerUp,
    onPointerCancel: () => setDrag(null),
  };
  const dragLabelEl = dragLabel && (
    <span className="pointer-events-none absolute -top-5 right-0 z-10 whitespace-nowrap rounded bg-gray-800 px-1.5 py-0.5 text-[10px] text-white">
      {dragLabel}
    </span>
  );

  if (isMilestone) {
    const size = 14;
    const center = (view.startDay - rangeStart + 0.5) * pxPerDay;
    return (
      <>
        <div
          ref={barRef}
          {...pointerHandlers}
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
        <OutsideLabel right={center + MILESTONE_HALF + 4} title={title} blocked={blocked} done={done} />
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
        onPointerDown={begin("move")}
        className={`absolute select-none touch-none rounded ${done ? "opacity-50" : ""} ${
          overdue ? "ring-2 ring-red-400 ring-offset-1" : ""
        } ${drag?.moved ? "z-[2] cursor-grabbing shadow-md" : "cursor-grab"}`}
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
                {blocked && <Lock className="h-3 w-3 shrink-0" />}
                <span className="truncate">{title}</span>
              </span>
            )}
          </span>
        </Tooltip>
        {resizable && (
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
      {!labelInside && <OutsideLabel right={right + width + 6} title={title} blocked={blocked} done={done} />}
    </>
  );
}

/** The title beside a bar too short to hold it — just past its due-date
 * end (to its left, RTL). At week/month zoom that's most bars; without
 * this they'd be unlabeled slivers. */
function OutsideLabel({
  right,
  title,
  blocked,
  done,
}: {
  right: number;
  title: string;
  blocked: boolean;
  done: boolean;
}) {
  return (
    <span
      className={`pointer-events-none absolute flex max-w-[220px] items-center gap-1 whitespace-nowrap text-xs text-gray-600 ${
        done ? "opacity-50" : ""
      }`}
      style={{ right, top: 0, height: ROW_H }}
    >
      {blocked && <Lock className="h-3 w-3 shrink-0 text-orange-500" />}
      <span className="truncate">{title}</span>
    </span>
  );
}
