export interface SearchFilters {
  priority?: 'high' | 'medium' | 'low';
  due_date_from?: string;
  due_date_to?: string;
  is_completed?: boolean;
  category_id?: string;
}

export interface CategoryItem {
  id: string;
  name: string;
}
