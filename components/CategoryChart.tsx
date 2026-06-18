"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

type Props = {
  view: string;
  categoryData: any[];
  yearlyCategoryData: any[];
};

export default function CategoryChart({ view, categoryData, yearlyCategoryData }: Props) {
  const chartData = view === "year" ? yearlyCategoryData : categoryData;

  return (
    <>
      <h3 className="font-extrabold mb-4 text-sm text-gray-800 dark:text-gray-100">
        카테고리별 지출
      </h3>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} height={90} />
            <YAxis domain={["auto", "auto"]} />
            <Tooltip formatter={(value) => [`₩${Number(value).toLocaleString()}`, " "]} />
            <Bar dataKey="value" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
