
"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

type Props = {
  view: string;
  categoryData: any[];
  yearlyCategoryData: any[];
};

export default function CategoryChart({
  view,
  categoryData,
  yearlyCategoryData,
}: Props) {
  const chartData = view === "year" ? yearlyCategoryData : categoryData;
const mobileChartData = chartData.filter(
  (item) => Number(item.value) !== 0
);

  return (
    <>
      <h3 className="mb-4 text-base font-bold text-[#191f28]">
        카테고리별 지출
      </h3>

      {/* 모바일: 0원 제외 가로 막대그래프 */}
<div
  className="w-full sm:hidden"
  style={{ height: Math.max(260, mobileChartData.length * 42 + 40) }}
>
  {mobileChartData.length > 0 ? (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={mobileChartData}
        layout="vertical"
        margin={{ top: 8, right: 12, left: 0, bottom: 8 }}
      >
        <CartesianGrid
          stroke="#eef0f3"
          strokeDasharray="3 3"
          horizontal={false}
        />
        <XAxis
          type="number"
          tick={{ fontSize: 10, fill: "#8b95a1" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value) =>
            value >= 10000
              ? `${Math.round(value / 10000)}만`
              : value.toLocaleString()
          }
        />
        <YAxis
          type="category"
          dataKey="name"
          width={85}
          interval={0}
          tick={{ fontSize: 11, fill: "#8b95a1" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(value) => [
            `₩${Number(value).toLocaleString()}`,
            "지출",
          ]}
          contentStyle={{
            borderRadius: "12px",
            border: "1px solid #e9edf2",
            boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
          }}
        />
        <Bar
          dataKey="value"
          fill="#3182f6"
          radius={[0, 6, 6, 0]}
          maxBarSize={24}
        />
      </BarChart>
    </ResponsiveContainer>
  ) : (
    <div className="flex h-full items-center justify-center text-sm text-[#8b95a1]">
      표시할 지출 항목이 없습니다.
    </div>
  )}
</div>

{/* PC: 기존 세로 막대그래프 */}
<div className="hidden h-64 w-full sm:block sm:h-80">
  <ResponsiveContainer width="100%" height="100%">
    <BarChart
      data={chartData}
      margin={{ top: 8, right: 12, left: 0, bottom: 35 }}
    >
      <CartesianGrid
        stroke="#eef0f3"
        strokeDasharray="3 3"
        vertical={false}
      />
      <XAxis
        dataKey="name"
        angle={-35}
        textAnchor="end"
        interval={0}
        height={55}
        tick={{ fontSize: 11, fill: "#8b95a1" }}
        axisLine={false}
        tickLine={false}
      />
      <YAxis
        tick={{ fontSize: 11, fill: "#8b95a1" }}
        axisLine={false}
        tickLine={false}
        width={55}
        tickFormatter={(value) =>
          value >= 10000
            ? `${Math.round(value / 10000)}만`
            : value.toLocaleString()
        }
      />
      <Tooltip
        formatter={(value) => [
          `₩${Number(value).toLocaleString()}`,
          "지출",
        ]}
        contentStyle={{
          borderRadius: "12px",
          border: "1px solid #e9edf2",
          boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
        }}
      />
      <Bar
        dataKey="value"
        fill="#3182f6"
        radius={[6, 6, 0, 0]}
        maxBarSize={42}
      />
    </BarChart>
  </ResponsiveContainer>
</div>
    </>
  );
}
