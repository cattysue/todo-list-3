export interface TemplateItem {
  id: string;
  title: string;
  category_id: string | null;
  priority: 'high' | 'medium' | 'low' | null;
  due_date_offset: number | null;
  sort_order: number;
}

export interface Template {
  id: string;
  name: string;
  created_at: string;
  items: TemplateItem[];
}

export interface CreateTemplateRequest {
  name: string;
  items: Omit<TemplateItem, 'id' | 'sort_order'>[];
}

export interface ApplyTemplateRequest {
  base_date?: string;
}
