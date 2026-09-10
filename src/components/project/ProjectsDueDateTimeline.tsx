import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarClock, Clock3 } from "lucide-react";
import type { ProjectExecution } from "../../hooks/execution-management/project/useProjects";
import { formatDate } from "../../utils/helpper";

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

type DatedProject = ProjectExecution & { dueTime: number };

interface Props {
  projects: ProjectExecution[];
}

export default function ProjectsDueDateTimeline({ projects }: Props) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

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
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const list = (e.target as HTMLElement).closest<HTMLElement>(
        "[data-timeline-scroll-list]",
      );
      if (list) list.scrollTop += e.deltaY;
      else el.scrollLeft += e.deltaX !== 0 ? e.deltaX : e.deltaY;
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const items = useMemo(() => {
    return projects
      .filter((p): p is ProjectExecution & { estimated_due_date: string } =>
        Boolean(p.estimated_due_date),
      )
      .map((p) => ({ ...p, dueTime: new Date(p.estimated_due_date).getTime() }))
      .filter((p) => !Number.isNaN(p.dueTime))
      .sort((a, b) => a.dueTime - b.dueTime);
  }, [projects]);

  // Same due date (the raw column value, not just close in time) →
  // one group. Order is preserved because `items` is already sorted.
  const groups = useMemo(() => {
    const byDate = new Map<string, DatedProject[]>();
    for (const p of items) {
      const key = p.estimated_due_date;
      const list = byDate.get(key);
      if (list) list.push(p);
      else byDate.set(key, [p]);
    }
    return Array.from(byDate.values());
  }, [items]);

  if (items.length === 0) {
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

  const trackWidth = Math.max(groups.length * SLOT_PX, 900);

  // Cards are ~176-208px wide and centered on their point, so the
  // outermost ones would get clipped by the scroll container's own
  // edge without this margin.
  const EDGE_MARGIN = 110;
  const usableWidth = trackWidth - EDGE_MARGIN * 2;

  // 0 → earliest date, at EDGE_MARGIN px from the RIGHT edge.
  // 1 → latest date, at EDGE_MARGIN px from the LEFT edge.
  // `right: Npx` puts dates in reading order for a dir="rtl" page.
  const pxOf = (t: number) =>
    EDGE_MARGIN + ((t - minTime) / span) * usableWidth;
  const todayPx = pxOf(today);

  const isOverdue = (p: ProjectExecution) =>
    new Date(p.estimated_due_date as string).getTime() < today &&
    p.status !== "completed" &&
    p.status !== "cancelled";

  const overdueCount = items.filter(isOverdue).length;

  // Two cards on the same side collide once their points are closer
  // than a card width plus a little breathing room. Greedily alternate
  // above/below, but only when the alternate lane is actually free at
  // this point — a tight run of groups falls back to whichever lane
  // has more room rather than blindly following index parity into an
  // overlap.
  const CARD_SPACING = 208 + 16;
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
    <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <CalendarClock size={16} className="text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-800">
            الجدول الزمني لمواعيد التسليم المقدَّرة
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

      <div ref={trackRef} className="overflow-x-auto pb-3">
        <div
          className="relative"
          style={{ width: `${trackWidth}px`, height: `${TRACK_HEIGHT}px` }}
        >
          {/* axis */}
          <div className="absolute top-1/2 right-0 left-0 h-0.5 bg-gray-200 rounded-full" />

          {/* today marker — pointer-events-none so it never steals a
              hover/click from a card that happens to land nearby */}
          <div
            className="absolute top-3 bottom-3 border-r-2 border-dashed border-blue-300 pointer-events-none z-10"
            style={{ right: `${todayPx}px` }}
          >
            <span className="absolute -top-3 right-1/2 translate-x-1/2 text-[10px] font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5 whitespace-nowrap">
              اليوم
            </span>
          </div>

          {placed.map(({ group, posPx, above }) => {
            const groupKey = group[0].estimated_due_date as string;
            return (
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
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------

interface MarkerProps {
  groupKey: string;
  group: DatedProject[];
  posPx: number;
  above: boolean;
  isHovered: boolean;
  onHoverChange: (hovered: boolean) => void;
  isOverdue: (p: ProjectExecution) => boolean;
}

function TimelineMarker({
  groupKey,
  group,
  posPx,
  above,
  isHovered,
  onHoverChange,
  isOverdue,
}: MarkerProps) {
  const isCluster = group.length > 1;
  const groupOverdue = group.some(isOverdue);
  const dotColor = groupOverdue
    ? "bg-rose-600"
    : group.length === 1
      ? STATUS_DOT[group[0].status]
      : "bg-slate-500";

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
                to={`/execution-management/projects/${project.id}`}
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
      </div>
    </div>
  );
}
