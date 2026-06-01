export type StatsPeriod = 'weekly' | 'monthly';

export interface PeriodData {
  label: string;
  completed_count: number;
  total_count: number;
  completion_rate: number;
}

export interface CompletionStatsResponse {
  period: StatsPeriod;
  data: PeriodData[];
}

export interface CategoryStatData {
  category_id: string;
  category_name: string;
  total_count: number;
  completed_count: number;
  completion_rate: number;
}

export interface CategoryStatsResponse {
  data: CategoryStatData[];
}
