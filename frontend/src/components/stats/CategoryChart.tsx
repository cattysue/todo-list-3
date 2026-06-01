'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { CategoryStatData } from '@/types/stats';

interface Props {
  data: CategoryStatData[];
}

export function CategoryChart({ data }: Props) {
  const chartHeight = Math.max(200, data.length * 52);
  const yAxisWidth = Math.min(
    160,
    Math.max(80, ...data.map((d) => d.category_name.length * 8)),
  );

  return (
    <div className="w-full" style={{ height: chartHeight }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 8, right: 48, left: 8, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 100]}
            unit="%"
            tick={{ fontSize: 11 }}
          />
          <YAxis
            type="category"
            dataKey="category_name"
            width={yAxisWidth}
            tick={{ fontSize: 11 }}
          />
          <Tooltip
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any) => [`${value ?? 0}%`, '완료율']}
          />
          <Bar
            dataKey="completion_rate"
            name="완료율"
            fill="#3b82f6"
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
