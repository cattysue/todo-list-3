'use client';

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { PeriodData } from '@/types/stats';

interface Props {
  data: PeriodData[];
}

export function CompletionChart({ data }: Props) {
  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 24, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis yAxisId="left" allowDecimals={false} />
          <YAxis yAxisId="right" orientation="right" unit="%" domain={[0, 100]} />
          <Tooltip
            formatter={(value: number | undefined, name: string) => {
            if (value === undefined) return ['', name];
            if (name === '완료율') return [`${value}%`, name];
            return [value, name];
          }}
          />
          <Legend />
          <Bar yAxisId="left" dataKey="completed_count" name="완료 개수" fill="#3b82f6" />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="completion_rate"
            name="완료율"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
