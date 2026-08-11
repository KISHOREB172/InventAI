function ScoreCard({ title, value, color }) {
  return (
    <div className="bg-slate-900 rounded-xl p-6 shadow-lg border border-slate-700">
      <h3 className="text-gray-400">{title}</h3>

      <h1 className={`text-4xl font-bold mt-3 ${color}`}>
        {value}
      </h1>
    </div>
  );
}

export default ScoreCard;