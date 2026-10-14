import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { CalendarClock, Clock3 } from "lucide-react";
import type { ProjectExecution } from "../../hooks/execution-management/project/useProjects";
import { formatDate } from "../../utils/helpper";
import AnchoredMenu from "../tasks/board/AnchoredMenu";

// Two variants:
//   full     — the execution-management projects page: every date's card
//              always open, above and below the axis.
//   compact  — the top of the tasks page (TasksPage.tsx): a slim strip of
//              small pills (one project's name, or "N مشاريع"), the full
//              card opening on hover / click in a portal popover so the
//              slim track never clips it. It fills the box's width, opens
//              on today, and the wheel moves it sideways until either end,
//              then scrolls the page again.
//
// Which day a project sits on is `dueDateOf` — its estimated due date by
// default; the tasks page passes the end of the project's last task.

const STATUS_LABELS: Record<ProjectExecution["status"], string> = {
  active: "نشط",
  paused: "متوقف",
  completed: "مكتمل",
  cancelled: "ملغي",
};

const STATUS_DOT: Record<ProjectExecution["status"], string> = {
  active: "bg-emerald-500",
  paused: "bg-amber-500",
  completed: "bg-sky-500",
  cancelled: "bg-rose-500",
};

const DAY_MS = 24 * 60 * 60 * 1000;
const SLOT_PX = 190; // horizontal room reserved per marker
const STEM = 34; // px between the axis dot and the card edge
const CARD_HEADER_H = 32; // date/count row
const CARD_LIST_MAX_H = 128; // max-h-32 on the scrollable project list
const CARD_MAX_H = CARD_HEADER_H + CARD_LIST_MAX_H;
// The track box must be tall enough to fully contain the tallest
// possible card on both sides of the axis — otherwise the outer
// overflow-x-auto wrapper clips the overflow (setting overflow-x
// forces the browser to treat overflow-y as "auto" too, per the CSS
// overflow spec, even though only "visible" was ever intended for
// that axis), cutting off the top of an "above" card or the bottom of
// a "below" one — exactly the part you'd be scrolling to reach.
const TRACK_HEIGHT = (STEM + CARD_MAX_H) * 2 + 24;

// compact: a 144px pill (w-36) on a short stem; the card is a popover
const PILL_W = 144;
const PILL_H = 40;
const COMPACT_STEM = 12;
const CARD_W = 208; // w-52
// how long a popover stays after the pointer leaves, so it can reach the card
const HOVER_CLOSE_MS = 150;

const LAYOUT = {
  // Cards are ~176-208px wide and centered on their point, so the
  // outermost ones would get clipped by the scroll container's own
  // edge without the edge margin.
  full: { slot: SLOT_PX, edge: 110, spacing: 208 + 16, trackHeight: TRACK_HEIGHT, minWidth: 900 },
  compact: { slot: 150, edge: 80, spacing: PILL_W + 10, trackHeight: (COMPACT_STEM + PILL_H) * 2 + 16, minWidth: 900 },
};

/** A project placed on the timeline: `due` is the day it sits on (dueDateOf). */
type DatedProject = ProjectExecution & { due: string; dueTime: number };

interface Props {
  projects: ProjectExecution[];
  variant?: "full" | "compact";
  /** Where a project row links to. Default: its execution-management page. */
  projectHref?: (project: ProjectExecution) => string;
  /** The day a project sits on. Default: its estimated due date. Keep it stable (module-level or memoised). */
  dueDateOf?: (project: ProjectExecution) => string | null;
  title?: string;
  /** Extra lines under a project's name in its card. */
  renderProjectDetail?: (project: ProjectExecution) => ReactNode;
  /** compact: an amber pill when one of its projects is flagged (and none is overdue). */
  isLate?: (project: ProjectExecution) => boolean;
}

const defaultHref = (project: ProjectExecution) => `/execution-management/projects/${project.id}`;
const defaultDueDate = (project: ProjectExecution) => project.estimated_due_date;

export default function ProjectsDueDateTimeline({
  projects,
  variant = "full",
  projectHref = defaultHref,
  dueDateOf = defaultDueDate,
  title = "الجدول الزمني لمواعيد التسليم المقدَّرة",
  renderProjectDetail,
  isLate,
}: Props) {
  const compact = variant === "compact";
  const layout = LAYOUT[variant];
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const todayRef = useRef<HTMLDivElement>(null);

  // ONE wheel listener for the whole widget, native (not React's
  // onWheel, which is passive by default — preventDefault() there is
  // silently ignored) so it can actually stop the page from scrolling.
  // It decides per-event, from the real DOM target under the cursor at
  // that instant, what a vertical wheel should do:
  //   - over a cluster's project list  → scroll that list
  //   - anywhere else on the timeline  → pan the timeline horizontally
  // A single handler at this level (rather than one per card) is what
  // makes this reliable when two markers sit close together: it always
  // acts on whatever element is actually under the cursor right now,
  // instead of a per-card listener whose own boundary the cursor might
  // have drifted off during a fast trackpad scroll.
  // The compact strip sits at the top of a scrolling page: wheel down moves
  // forward in time (left, RTL), and once the strip can't move any further
  // that way (or has nothing to scroll) the wheel goes back to the page.
  const hasTrack = projects.some((p) => !!dueDateOf(p));
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      const list = (e.target as HTMLElement).closest<HTMLElement>(
        "[data-timeline-scroll-list]",
      );
      if (list) {
        e.preventDefault();
        list.scrollTop += e.deltaY;
        return;
      }
      if (!compact) {
        e.preventDefault();
        el.scrollLeft += e.deltaX !== 0 ? e.deltaX : e.deltaY;
        return;
      }
      const delta = e.deltaX !== 0 ? e.deltaX : -e.deltaY;
      // RTL: scrollLeft is 0 at the right edge and negative to the left
      const max = el.scrollWidth - el.clientWidth;
      const atEnd = delta > 0 ? el.scrollLeft >= -1 : el.scrollLeft <= -max + 1;
      if (max <= 0 || atEnd) return;
      e.preventDefault();
      el.scrollLeft += delta;
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [compact, hasTrack]);

  // compact: the track is at least as wide as the box, so the axis runs to
  // its edge and the dates spread across it.
  const [viewportW, setViewportW] = useState(0);
  useEffect(() => {
    const el = trackRef.current;
    if (!compact || !el) return;
    const measure = () => setViewportW(el.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [compact, hasTrack]);

  const items = useMemo(() => {
    return projects
      .flatMap((p): DatedProject[] => {
        const due = dueDateOf(p);
        return due ? [{ ...p, due, dueTime: new Date(due).getTime() }] : [];
      })
      .filter((p) => !Number.isNaN(p.dueTime))
      .sort((a, b) => a.dueTime - b.dueTime);
  }, [projects, dueDateOf]);

  // Same due date (the raw column value, not just close in time) →
  // one group. Order is preserved because `items` is already sorted.
  const groups = useMemo(() => {
    const byDate = new Map<string, DatedProject[]>();
    for (const p of items) {
      const key = p.due;
      const list = byDate.get(key);
      if (list) list.push(p);
      else byDate.set(key, [p]);
    }
    return Array.from(byDate.values());
  }, [items]);

  // compact: open on today rather than on the earliest date — once the
  // box has been measured, since that sets where today sits
  const measured = viewportW > 0;
  useEffect(() => {
    if (compact && measured) todayRef.current?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [compact, measured]);

  // compact: one popover at a time; leaving a pill closes it after a beat
  // so the pointer can travel into the card.
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearCloseTimer = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };
  useEffect(() => clearCloseTimer, []);
  const showCard = (key: string) => {
    clearCloseTimer();
    setHoveredKey(key);
  };
  const hideCardSoon = () => {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => setHoveredKey(null), HOVER_CLOSE_MS);
  };

  if (items.length === 0) {
    if (compact) return null;
    return (
      <div className="bg-white border border-dashed border-gray-300 rounded-xl p-6 text-center mb-6">
        <p className="text-sm font-medium text-gray-700">
          لا توجد مشاريع لديها تاريخ تسليم مقدَّر بعد
        </p>
      </div>
    );
  }

  const today = Date.now();
  const minTime = Math.min(items[0].dueTime, today);
  const maxTime = Math.max(items[items.length - 1].dueTime, today);
  const span = Math.max(maxTime - minTime, DAY_MS);

  const trackWidth = Math.max(groups.length * layout.slot, compact && viewportW > 0 ? viewportW : layout.minWidth);

  const EDGE_MARGIN = layout.edge;
  const usableWidth = trackWidth - EDGE_MARGIN * 2;

  // 0 → earliest date, at EDGE_MARGIN px from the RIGHT edge.
  // 1 → latest date, at EDGE_MARGIN px from the LEFT edge.
  // `right: Npx` puts dates in reading order for a dir="rtl" page.
  const pxOf = (t: number) =>
    EDGE_MARGIN + ((t - minTime) / span) * usableWidth;
  const todayPx = pxOf(today);

  const isOverdue = (p: DatedProject) =>
    p.dueTime < today &&
    p.status !== "completed" &&
    p.status !== "cancelled";

  const overdueCount = items.filter(isOverdue).length;

  // Two cards on the same side collide once their points are closer
  // than a card width plus a little breathing room. Greedily alternate
  // above/below, but only when the alternate lane is actually free at
  // this point — a tight run of groups falls back to whichever lane
  // has more room rather than blindly following index parity into an
  // overlap.
  const CARD_SPACING = layout.spacing;
  const laneEnd = { above: -Infinity, below: -Infinity };
  let lastLane: "above" | "below" = "below";
  const placed = groups.map((group) => {
    const posPx = pxOf(group[0].dueTime);
    const preferred: "above" | "below" =
      lastLane === "above" ? "below" : "above";
    const other = preferred === "above" ? "below" : "above";
    let lane: "above" | "below";
    if (posPx - laneEnd[preferred] >= CARD_SPACING) lane = preferred;
    else if (posPx - laneEnd[other] >= CARD_SPACING) lane = other;
    else lane = laneEnd[preferred] <= laneEnd[other] ? preferred : other;
    laneEnd[lane] = posPx;
    lastLane = lane;
    return { group, posPx, above: lane === "above" };
  });

  return (
    <div className={`bg-white border border-gray-200 rounded-xl ${compact ? "px-4 py-3 mb-5" : "p-4 mb-6"}`}>
      <div className={`flex items-center justify-between flex-wrap gap-2 ${compact ? "mb-2" : "mb-6"}`}>
        <div className="flex items-center gap-2">
          <CalendarClock size={16} className="text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-800">
            {title}
          </h2>
          <span className="text-xs text-gray-400">({items.length} مشروع)</span>
        </div>
        {overdueCount > 0 && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-full px-2.5 py-1">
            <Clock3 size={12} />
            {overdueCount} متأخر عن موعده
          </span>
        )}
      </div>

      <div ref={trackRef} className={`overflow-x-auto ${compact ? "pb-1" : "pb-3"}`}>
        <div
          className="relative"
          style={{ width: `${trackWidth}px`, height: `${layout.trackHeight}px` }}
        >
          {/* axis */}
          <div className="absolute top-1/2 right-0 left-0 h-0.5 bg-gray-200 rounded-full" />

          {/* today marker — pointer-events-none so it never steals a
              hover/click from a card that happens to land nearby */}
          <div
            ref={todayRef}
            className="absolute top-3 bottom-3 border-r-2 border-dashed border-blue-300 pointer-events-none z-10"
            style={{ right: `${todayPx}px` }}
          >
            <span className="absolute -top-3 right-1/2 translate-x-1/2 text-[10px] font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5 whitespace-nowrap">
              اليوم
            </span>
          </div>

          {placed.map(({ group, posPx, above }) => {
            const groupKey = group[0].due;
            return compact ? (
              <CompactMarker
                key={groupKey}
                groupKey={groupKey}
                group={group}
                posPx={posPx}
                above={above}
                open={hoveredKey === groupKey}
                onShow={() => showCard(groupKey)}
                onHide={hideCardSoon}
                onClose={() => {
                  clearCloseTimer();
                  setHoveredKey(null);
                }}
                isOverdue={isOverdue}
                isLate={isLate}
                projectHref={projectHref}
                renderProjectDetail={renderProjectDetail}
              />
            ) : (
              <TimelineMarker
                key={groupKey}
                groupKey={groupKey}
                group={group}
                posPx={posPx}
                above={above}
                isHovered={hoveredKey === groupKey}
                onHoverChange={(hovered) =>
                  setHoveredKey(hovered ? groupKey : null)
                }
                isOverdue={isOverdue}
                projectHref={projectHref}
                renderProjectDetail={renderProjectDetail}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------

/** The dot's color: red when any project of the date is overdue. */
function groupDotColor(group: DatedProject[], groupOverdue: boolean) {
  return groupOverdue
    ? "bg-rose-600"
    : group.length === 1
      ? STATUS_DOT[group[0].status]
      : "bg-slate-500";
}

/** A date's card: the date / count row, then its projects as links. */
function ProjectCardBody({
  groupKey,
  group,
  groupOverdue,
  isOverdue,
  projectHref,
  renderProjectDetail,
}: {
  groupKey: string;
  group: DatedProject[];
  groupOverdue: boolean;
  isOverdue: (p: DatedProject) => boolean;
  projectHref: (project: ProjectExecution) => string;
  renderProjectDetail?: (project: ProjectExecution) => ReactNode;
}) {
  const isCluster = group.length > 1;
  return (
    <>
      <div className="flex items-center justify-between px-2.5 py-1.5 bg-gray-50 border-b border-gray-100">
        <span
          className={`text-[10px] font-medium ${
            groupOverdue ? "text-rose-700" : "text-gray-500"
          }`}
        >
          {formatDate(groupKey)}
        </span>
        {isCluster && (
          <span className="text-[10px] font-semibold text-gray-600">
            {group.length} مشاريع
          </span>
        )}
      </div>

      <div
        data-timeline-scroll-list={isCluster ? true : undefined}
        className={
          isCluster ? "max-h-32 overflow-y-auto overscroll-contain" : ""
        }
      >
        {group.map((project) => {
          const overdue = isOverdue(project);
          return (
            <Link
              key={project.id}
              to={projectHref(project)}
              className="flex items-start gap-1.5 px-2.5 py-1.5 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0"
            >
              <span
                className={`shrink-0 w-1.5 h-1.5 rounded-full mt-1 ${
                  overdue ? "bg-rose-600" : STATUS_DOT[project.status]
                }`}
              />
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold text-gray-900 truncate">
                  {project.name}
                </span>
                <span className="flex items-center justify-between mt-0.5">
                  {project.serial_number !== null && (
                    <span className="text-[10px] text-gray-400" dir="ltr">
                      #{project.serial_number}
                    </span>
                  )}
                  <span className="text-[9px] text-gray-400">
                    {STATUS_LABELS[project.status]}
                  </span>
                </span>
                {renderProjectDetail?.(project)}
                {overdue && (
                  <span className="block text-[9px] font-medium text-rose-700">
                    متأخر عن الموعد المقدَّر
                  </span>
                )}
              </span>
            </Link>
          );
        })}
      </div>
    </>
  );
}

interface MarkerProps {
  groupKey: string;
  group: DatedProject[];
  posPx: number;
  above: boolean;
  isHovered: boolean;
  onHoverChange: (hovered: boolean) => void;
  isOverdue: (p: DatedProject) => boolean;
  projectHref: (project: ProjectExecution) => string;
  renderProjectDetail?: (project: ProjectExecution) => ReactNode;
}

function TimelineMarker({
  groupKey,
  group,
  posPx,
  above,
  isHovered,
  onHoverChange,
  isOverdue,
  projectHref,
  renderProjectDetail,
}: MarkerProps) {
  const isCluster = group.length > 1;
  const groupOverdue = group.some(isOverdue);
  const dotColor = groupDotColor(group, groupOverdue);

  return (
    <div
      className={`absolute top-1/2 ${isHovered ? "z-20" : "z-0"}`}
      style={{ right: `${posPx}px` }}
    >
      {/* stem connecting the dot to the card */}
      <div
        className="absolute right-1/2 w-px bg-gray-300"
        style={{
          transform: "translateX(50%)",
          top: above ? -STEM : 0,
          height: STEM,
        }}
      />

      {/* dot on the axis — hovering or clicking it reveals the card
          exactly like hovering the card itself, mainly for when the
          dot is the only reachable part of a partially-covered marker
          (and for touch, where there's no hover at all) */}
      <span
        onMouseEnter={() => onHoverChange(true)}
        onMouseLeave={() => onHoverChange(false)}
        onClick={() => onHoverChange(true)}
        className={`absolute right-1/2 top-0 -translate-y-1/2 translate-x-1/2 block rounded-full ring-2 ring-white cursor-pointer ${dotColor} ${
          isCluster ? "w-3 h-3" : "w-2.5 h-2.5"
        } ${isHovered ? "scale-125" : ""} transition-transform`}
      />

      {/* card */}
      <div
        onMouseEnter={() => onHoverChange(true)}
        onMouseLeave={() => onHoverChange(false)}
        className={`absolute right-1/2 w-52 rounded-lg border bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden ${
          groupOverdue ? "border-rose-200" : "border-gray-200"
        }`}
        style={{
          transform: above
            ? "translateX(50%) translateY(-100%)"
            : "translateX(50%)",
          top: above ? -STEM : STEM,
        }}
      >
        <ProjectCardBody
          groupKey={groupKey}
          group={group}
          groupOverdue={groupOverdue}
          isOverdue={isOverdue}
          projectHref={projectHref}
          renderProjectDetail={renderProjectDetail}
        />
      </div>
    </div>
  );
}

/** compact: a small pill per date; the full card opens over the page. */
function CompactMarker({
  groupKey,
  group,
  posPx,
  above,
  open,
  onShow,
  onHide,
  onClose,
  isOverdue,
  isLate,
  projectHref,
  renderProjectDetail,
}: {
  groupKey: string;
  group: DatedProject[];
  posPx: number;
  above: boolean;
  open: boolean;
  onShow: () => void;
  onHide: () => void;
  onClose: () => void;
  isOverdue: (p: DatedProject) => boolean;
  isLate?: (project: ProjectExecution) => boolean;
  projectHref: (project: ProjectExecution) => string;
  renderProjectDetail?: (project: ProjectExecution) => ReactNode;
}) {
  const pillRef = useRef<HTMLButtonElement>(null);
  const isCluster = group.length > 1;
  const groupOverdue = group.some(isOverdue);
  // overdue stays red; otherwise amber when a project is flagged late
  const groupLate = !groupOverdue && !!isLate && group.some(isLate);
  const dotColor = groupDotColor(group, groupOverdue);

  return (
    <div className={`absolute top-1/2 ${open ? "z-20" : "z-0"}`} style={{ right: `${posPx}px` }}>
      <div
        className="absolute right-1/2 w-px bg-gray-300"
        style={{ transform: "translateX(50%)", top: above ? -COMPACT_STEM : 0, height: COMPACT_STEM }}
      />
      <span
        onMouseEnter={onShow}
        onMouseLeave={onHide}
        onClick={onShow}
        className={`absolute right-1/2 top-0 -translate-y-1/2 translate-x-1/2 block rounded-full ring-2 ring-white cursor-pointer ${dotColor} ${
          isCluster ? "w-3 h-3" : "w-2.5 h-2.5"
        } ${open ? "scale-125" : ""} transition-transform`}
      />
      <button
        ref={pillRef}
        type="button"
        onMouseEnter={onShow}
        onMouseLeave={onHide}
        onClick={onShow}
        className={`absolute right-1/2 flex flex-col justify-center rounded-md border bg-white px-2 text-right shadow-sm transition-shadow hover:shadow-md ${
          groupOverdue ? "border-rose-200" : groupLate ? "border-amber-300" : "border-gray-200"
        }`}
        style={{
          width: PILL_W,
          height: PILL_H,
          transform: above ? "translateX(50%) translateY(-100%)" : "translateX(50%)",
          top: above ? -COMPACT_STEM : COMPACT_STEM,
        }}
      >
        <span className="flex w-full items-center gap-1.5">
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotColor}`} />
          <span className="truncate text-xs font-semibold text-gray-900">
            {isCluster ? `${group.length} مشاريع` : group[0].name}
          </span>
        </span>
        <span
          className={`text-[10px] ${
            groupOverdue ? "font-medium text-rose-700" : groupLate ? "font-medium text-amber-700" : "text-gray-500"
          }`}
        >
          {formatDate(groupKey)}
        </span>
      </button>
      <AnchoredMenu open={open} onClose={onClose} anchorRef={pillRef} width={CARD_W} className="overflow-hidden">
        <div onMouseEnter={onShow} onMouseLeave={onHide}>
          <ProjectCardBody
            groupKey={groupKey}
            group={group}
            groupOverdue={groupOverdue}
            isOverdue={isOverdue}
            projectHref={projectHref}
            renderProjectDetail={renderProjectDetail}
          />
        </div>
      </AnchoredMenu>
    </div>
  );
}
