function AnalysisCard({ title, value }) {
  return (
    <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-md">
      <h3 className="text-blue-400 font-semibold text-lg">
        {title}
      </h3>

      <p className="mt-2 text-gray-300">
        {value}
      </p>
    </div>
  );
}

export default AnalysisCard;