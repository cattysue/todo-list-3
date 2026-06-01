export type RecurrenceType = 'daily' | 'weekly' | 'monthly';

export interface TodoItem {
  id: string;
  title: string;
  due_date: string | null;
  priority: 'high' | 'medium' | 'low' | null;
  is_completed: boolean;
  created_at: string | null;
  category_id: string | null;
  category_name: string | null;
  recurrence_type: RecurrenceType | null;
  recurrence_days: string | null;
  recurrence_day_of_month: number | null;
}

export interface CreateTodoRequest {
  title: string;
  category_id?: string;
  priority?: 'high' | 'medium' | 'low';
  due_date?: string;
  recurrence_type?: RecurrenceType;
  recurrence_days?: string;
  recurrence_day_of_month?: number;
}

export interface UpdateTodoRequest {
  title?: string;
  category_id?: string | null;
  priority?: 'high' | 'medium' | 'low' | null;
  due_date?: string | null;
  recurrence_type?: RecurrenceType | null;
  recurrence_days?: string | null;
  recurrence_day_of_month?: number | null;
}
