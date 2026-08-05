import { ItemRow, WorkFull } from "./types";
import { Zone } from "./useZones";

export interface BOQReportItem {
  name: string;
  unit: string;
  quantity: number;
  unit_price: number | null;
}

export type BOQReportNodeKind = "type" | "zone" | "work";

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
  | { kind: "type"; type: { name: string }; works: WorkFull[]; zones: Zone[] }
  | { kind: "zone"; zone: Zone; works: WorkFull[] }
  | { kind: "work"; work: WorkFull };

export function toReportItem(item: ItemRow): BOQReportItem {
  return {
    name: item.name,
    unit: item.unit,
    quantity: item.quantity,
    unit_price: item.unit_price,
  };
}

export function buildNode(entity: BuildableEntity): BOQReportNode {
  switch (entity.kind) {
    case "type": {
      const zonesWithWorks = entity.zones.filter((zone) =>
        entity.works.some((w) => w.zone_id === zone.id),
      );
      return {
        label: entity.type.name,
        kind: "type",
        nodes: zonesWithWorks.map((zone) =>
          buildNode({
            kind: "zone",
            zone,
            works: entity.works.filter((w) => w.zone_id === zone.id),
          }),
        ),
      };
    }
    case "zone":
      return {
        label: entity.zone.name,
        kind: "zone",
        nodes: entity.works.map((work) => buildNode({ kind: "work", work })),
      };
    case "work":
      return {
        label: entity.work.name,
        kind: "work",
        items: entity.work.items.map(toReportItem),
      };
  }
}

/**
 * Items aggregated by name+unit across every work in `works`.
 * Quantities are summed; unit_price is kept only when every matching item
 * shares the same unit_price, otherwise null (mixed pricing can't be summarized).
 */
export function buildSummaryItems(works: WorkFull[]): BOQReportItem[] {
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

  works.forEach((work) => {
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

  return Array.from(groups.values()).map((g) => ({
    name: g.name,
    unit: g.unit,
    quantity: g.quantity,
    unit_price: g.pricesMatch ? g.firstPrice : null,
  }));
}
