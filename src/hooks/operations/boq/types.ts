export interface ItemRow {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  unit_price: number | null;
  sort_order: number;
}

export interface WorkFull {
  id: string;
  type_id: string;
  zone_id: string;
  name: string;
  sort_order: number;
  items: ItemRow[];
}
