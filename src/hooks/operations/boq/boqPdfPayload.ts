import { ArticleFull, ItemRow, WorkFull } from "./types";
import { Zone } from "./useZones";

export interface BOQReportItem {
  name: string;
  unit: string;
  quantity: number;
  unit_price: number | null;
}

export type BOQReportNodeKind = "type" | "article" | "work" | "zone";

export interface BOQReportNode {
  label: string;
  kind: BOQReportNodeKind;
  nodes?: BOQReportNode[];
  items?: BOQReportItem[];
}

export interface BOQReportRequest {
  report_title: string;
  project_name: string;
  generated_at: string;
  nodes?: BOQReportNode[];
  items?: BOQReportItem[];
  logo_url?: string;
}

export type BuildableEntity =
  | { kind: "type"; type: { name: string }; articles: ArticleFull[] }
  | { kind: "article"; article: ArticleFull }
  | { kind: "work"; work: WorkFull };

export function toReportItem(item: ItemRow): BOQReportItem {
  return {
    name: item.name,
    unit: item.unit,
    quantity: item.quantity,
    unit_price: item.unit_price,
  };
}

export function groupItemsByZone(items: ItemRow[]): Map<string, ItemRow[]> {
  const map = new Map<string, ItemRow[]>();
  items.forEach((item) => {
    const list = map.get(item.zone_id) ?? [];
    list.push(item);
    map.set(item.zone_id, list);
  });
  return map;
}

export function buildNode(entity: BuildableEntity, zones: Zone[]): BOQReportNode {
  switch (entity.kind) {
    case "type":
      return {
        label: entity.type.name,
        kind: "type",
        nodes: entity.articles.map((article) =>
          buildNode({ kind: "article", article }, zones),
        ),
      };
    case "article":
      return {
        label: entity.article.name,
        kind: "article",
        nodes: entity.article.works.map((work) =>
          buildNode({ kind: "work", work }, zones),
        ),
      };
    case "work": {
      const itemsByZone = groupItemsByZone(entity.work.items);
      return {
        label: entity.work.name,
        kind: "work",
        nodes: Array.from(itemsByZone.entries()).map(([zoneId, items]) => ({
          label: zones.find((z) => z.id === zoneId)?.name ?? "منطقة غير معروفة",
          kind: "zone" as const,
          items: items.map(toReportItem),
        })),
      };
    }
  }
}

/** Every item across every article/work in `articles` whose zone_id matches `zoneId`. */
export function flattenItemsByZone(
  articles: ArticleFull[],
  zoneId: string,
): BOQReportItem[] {
  const items: ItemRow[] = [];
  articles.forEach((article) => {
    article.works.forEach((work) => {
      work.items.forEach((item) => {
        if (item.zone_id === zoneId) items.push(item);
      });
    });
  });
  return items.map(toReportItem);
}

/**
 * Items aggregated by name+unit across every article/work in `articles`.
 * Quantities are summed; unit_price is kept only when every matching item
 * shares the same unit_price, otherwise null (mixed pricing can't be summarized).
 */
export function buildSummaryItems(articles: ArticleFull[]): BOQReportItem[] {
  const groups = new Map<
    string,
    {
      name: string;
      unit: string;
      quantity: number;
      firstPrice: number | null;
      pricesMatch: boolean;
    }
  >();

  articles.forEach((article) => {
    article.works.forEach((work) => {
      work.items.forEach((item) => {
        const key = `${item.name}__${item.unit}`;
        const existing = groups.get(key);
        if (!existing) {
          groups.set(key, {
            name: item.name,
            unit: item.unit,
            quantity: item.quantity,
            firstPrice: item.unit_price,
            pricesMatch: true,
          });
        } else {
          existing.quantity += item.quantity;
          if (existing.firstPrice !== item.unit_price) {
            existing.pricesMatch = false;
          }
        }
      });
    });
  });

  return Array.from(groups.values()).map((g) => ({
    name: g.name,
    unit: g.unit,
    quantity: g.quantity,
    unit_price: g.pricesMatch ? g.firstPrice : null,
  }));
}
