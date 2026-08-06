export interface ItemRow {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  unit_price: number | null;
  sort_order: number;
  created_by: string;
}

export interface WorkFull {
  id: string;
  type_id: string;
  zone_id: string;
  name: string;
  sort_order: number;
  template_work_id: string | null;
  items: ItemRow[];
}

export interface TemplateItemRow {
  id: string;
  name: string;
  unit: string;
  default_quantity: number;
  default_unit_price: number | null;
  sort_order: number;
}

export interface TemplateWorkFull {
  id: string;
  template_type_id: string;
  name: string;
  sort_order: number;
  items: TemplateItemRow[];
}
