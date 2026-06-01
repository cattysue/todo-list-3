export interface TodoDashboardItem {
  id: string;
  title: string;
  due_date: string | null;
  priority: 'high' | 'medium' | 'low' | null;
  is_completed: boolean;
  created_at: string | null;
  category_id: string | null;
  category_name: string | null;
  recurrence_type: 'daily' | 'weekly' | 'monthly' | null;
  recurrence_paused: boolean;
}

export interface DashboardResponse {
  overdue: TodoDashboardItem[];
  today: TodoDashboardItem[];
  tomorrow: TodoDashboardItem[];
  this_week: TodoDashboardItem[];
}
