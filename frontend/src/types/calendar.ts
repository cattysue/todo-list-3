export type CalendarView = 'month' | 'week';

export interface TodoCalendarItem {
  id: string;
  title: string;
  due_date: string;
  priority: 'high' | 'medium' | 'low' | null;
  is_completed: boolean;
  category_name: string | null;
  category_id: string | null;
}
