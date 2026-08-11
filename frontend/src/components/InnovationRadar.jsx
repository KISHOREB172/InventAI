import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

function InnovationRadar({
  innovationScore,
  noveltyScore,
  feasibilityScore,
  marketScore,
}) {
  const chartData = [
    {
      category: "Innovation",
      score: innovationScore,
    },
    {
      category: "Novelty",
      score: noveltyScore,
    },
    {
      category: "Feasibility",
      score: feasibilityScore,
    },
    { category: "Market", score: marketScore ?? innovationScore },
  ];

  return (
    <div className="h-96 w-full rounded-2xl border border-white/8 bg-white/[.025] p-5">
      <h2 className="mb-4 text-xl font-bold text-blue-400">
        Opportunity shape
      </h2>

      <ResponsiveContainer width="100%" height="90%">
        <RadarChart data={chartData} outerRadius="75%">
          <PolarGrid stroke="#475569" />

          <PolarAngleAxis
            dataKey="category"
            tick={{ fill: "#cbd5e1", fontSize: 14 }}
          />

          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fill: "#94a3b8" }}
          />

          <Tooltip />

          <Radar
            name="Score"
            dataKey="score"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.45}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default InnovationRadar;
