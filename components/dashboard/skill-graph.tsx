"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface SkillGraphDatum {
  label: string;
  value: number;
}

export function SkillGraph({ data }: { data: SkillGraphDatum[] }) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-base text-white">Execution Signal Graph</CardTitle>
        <CardDescription>
          A quick read on the dimensions that move your career velocity.
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={10}>
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#94a3b8", fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#64748b", fontSize: 11 }}
              width={30}
            />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
              contentStyle={{
                background: "rgba(15, 23, 40, 0.95)",
                border: "1px solid rgba(148, 163, 184, 0.12)",
                borderRadius: "16px",
                color: "#e2e8f0",
              }}
            />
            <Bar
              dataKey="value"
              fill="url(#skillGraphGradient)"
              radius={[14, 14, 4, 4]}
            />
            <defs>
              <linearGradient id="skillGraphGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="50%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#22D3EE" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
