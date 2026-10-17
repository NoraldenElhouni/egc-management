import type { TaskTypeLite } from "../../../hooks/tasks/useTaskBoard";

// The small coloured badge that marks a task's type on the Gantt bars, the
// link diagram's boxes and the type board's columns — Construction Flow's
// lettered category circles, with our task types as the categories.
//
// The letters are the shortest start of the Arabic name that no other type
// shares: "تقرير" → "ت", but "مرحلة" / "مهمة" → "مر" / "مه". Capped at two
// letters so the badge stays small; the full name is in its tooltip.

export interface TypeBadge {
  label: string;
  color: string;
  name: string;
}

const DEFAULT_TYPE_COLOR = "#6B7280";

export function typeBadges(taskTypes: ReadonlyMap<string, TaskTypeLite>): Map<string, TypeBadge> {
  const types = Array.from(taskTypes.values());
  const out = new Map<string, TypeBadge>();
  for (const type of types) {
    const name = type.name_ar.trim();
    let label = name.slice(0, 1);
    for (let k = 1; k <= Math.min(2, name.length); k++) {
      label = name.slice(0, k);
      const shared = types.some((other) => other.id !== type.id && other.name_ar.trim().startsWith(label));
      if (!shared) break;
    }
    out.set(type.id, { label: label || "؟", color: type.color ?? DEFAULT_TYPE_COLOR, name });
  }
  return out;
}
