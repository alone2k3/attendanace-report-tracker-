"use client";
import { Bar, BarChart, CartesianGrid, LabelList, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function WeekChart({ data, series, today }: { data: Record<string, string | number>[]; series: { key: string; name: string; color: string }[]; today: string }) {
  return (
    <div className="h-[260px] w-full" role="img" aria-label="Tasks logged this week by department">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 18, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#F0E9D6" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={(props: { x?: number | string; y?: number | string; payload?: { value: string; index: number } }) => {
              const row = data[props.payload?.index ?? 0];
              const isToday = row?.day === today;
              return (
                <text x={Number(props.x)} y={Number(props.y) + 12} textAnchor="middle" fontSize={12} fontWeight={isToday ? 700 : 400} fill={isToday ? "#14110A" : "#6B6250"}>
                  {props.payload?.value}
                </text>
              );
            }}
          />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#6B6250" }} />
          <Tooltip cursor={{ fill: "#FAF6EC" }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {series.map((s) => (
            <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} radius={[4, 4, 0, 0]} maxBarSize={22}>
              <LabelList dataKey={s.key} position="top" fontSize={11} fill="#3B3426" />
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
