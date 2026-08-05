export interface ItemRow {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  unit_price: number | null;
  zone_id: string;
  sort_order: number;
}

export interface WorkFull {
  id: string;
  name: string;
  sort_order: number;
  items: ItemRow[];
}

export interface ArticleFull {
  id: string;
  name: string;
  sort_order: number;
  works: WorkFull[];
}
