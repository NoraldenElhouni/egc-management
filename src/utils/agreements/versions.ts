import type {
  AgreementItem,
  AgreementVersion,
  PenaltyDisplayStatus,
} from "../../types/agreements.types";

// =====================================================================
// Turning the item rows into what management reads
// =====================================================================
// Items are never deleted or edited in place (01_tables.sql, section C):
//   removed in vN  → removed_in_version = N
//   edited in vN   → old row removed in N + a new row added in N whose
//                    replaces_item_id points at it
// So "what changed in vN" and "the items as they were in vN" are pure
// functions of the rows — nothing else is stored.
// =====================================================================

/** Items as they stood at version `v`. */
export function itemsAtVersion(items: AgreementItem[], v: number): AgreementItem[] {
  return items
    .filter(
      (i) =>
        i.added_in_version <= v &&
        (i.removed_in_version == null || i.removed_in_version > v),
    )
    .sort((a, b) => a.sort_order - b.sort_order);
}

/** The current agreement — the "overall" view. */
export function currentItems(items: AgreementItem[]): AgreementItem[] {
  return items
    .filter((i) => i.removed_in_version == null)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export type VersionChange =
  | { kind: "added"; item: AgreementItem }
  | { kind: "edited"; item: AgreementItem; before: AgreementItem }
  | { kind: "removed"; item: AgreementItem };

/** What version `v` (≥ 2) changed compared with the one before it. */
export function changesInVersion(items: AgreementItem[], v: number): VersionChange[] {
  const byId = new Map(items.map((i) => [i.id, i]));
  const replacedInV = new Set(
    items
      .filter((i) => i.added_in_version === v && i.replaces_item_id)
      .map((i) => i.replaces_item_id as string),
  );

  const changes: VersionChange[] = [];
  for (const item of items) {
    if (item.added_in_version === v) {
      const before = item.replaces_item_id ? byId.get(item.replaces_item_id) : undefined;
      changes.push(before ? { kind: "edited", item, before } : { kind: "added", item });
    } else if (item.removed_in_version === v && !replacedInV.has(item.id)) {
      changes.push({ kind: "removed", item });
    }
  }
  return changes;
}

/** Title / description / note changes between two version snapshots. */
export function headerChanges(prev: AgreementVersion, next: AgreementVersion) {
  const changes: { label: string; before: string; after: string }[] = [];
  const add = (label: string, a: string | null, b: string | null) => {
    if ((a ?? "") !== (b ?? "")) changes.push({ label, before: a || "—", after: b || "—" });
  };
  add("العنوان", prev.title, next.title);
  add("الوصف", prev.description, next.description);
  add("الملاحظة", prev.note, next.note);
  return changes;
}

export const PAYMENT_STATUS: Record<
  string,
  { label: string; variant: "warning" | "success" | "danger" | "default" }
> = {
  pending: { label: "قيد الانتظار", variant: "warning" },
  approved: { label: "مقبولة", variant: "success" },
  declined: { label: "مرفوضة", variant: "danger" },
};

export const PENALTY_STATUS: Record<
  PenaltyDisplayStatus,
  { label: string; variant: "warning" | "success" | "danger" | "info" }
> = {
  pending: { label: "قيد الانتظار", variant: "warning" },
  approved: { label: "معتمدة", variant: "info" },
  deducted: { label: "مخصومة", variant: "success" },
  declined: { label: "مرفوضة", variant: "danger" },
};
