function SystemArchitecture({ blocks = [], hardware = [] }) {
  const safeBlocks = blocks.length ? blocks : [
    { name: "User / Input", description: "Idea inputs and operating context" },
    { name: "Core Intelligence", description: "Processing, rules, and AI decisions" },
    { name: "Output / Action", description: "Insights, alerts, or physical response" },
  ];

  return <div className="grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
    <div className="rounded-2xl border border-white/8 bg-white/[.025] p-5 md:p-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div><p className="section-kicker">System architecture</p><h3 className="mt-1 text-xl font-bold text-white">How the solution works</h3></div>
        <span className="rounded-full border border-cyan-400/15 bg-cyan-400/5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-300">Block diagram</span>
      </div>
      <div className="flex flex-col items-stretch gap-2 md:flex-row md:items-center">
        {safeBlocks.map((block, index) => <div key={`${block.name}-${index}`} className="contents">
          <div className="group min-w-0 flex-1 rounded-xl border border-cyan-400/20 bg-[#091827] p-4 text-center shadow-lg shadow-cyan-950/10">
            <div className="mx-auto mb-3 grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-cyan-300 to-blue-500 text-xs font-black text-slate-950">{index + 1}</div>
            <h4 className="text-sm font-bold text-white">{block.name}</h4>
            <p className="mt-2 text-xs leading-5 text-slate-500">{block.description}</p>
          </div>
          {index < safeBlocks.length - 1 && <div aria-hidden="true" className="flex h-7 items-center justify-center text-xl font-light text-cyan-500 md:h-auto md:w-5 md:rotate-0">→</div>}
        </div>)}
      </div>
    </div>

    <div className="rounded-2xl border border-violet-400/15 bg-violet-400/[.035] p-5 md:p-6">
      <p className="section-kicker text-violet-300">Prototype BOM</p>
      <h3 className="mt-1 text-xl font-bold text-white">Required hardware</h3>
      {hardware.length ? <div className="mt-5 space-y-3">{hardware.map((item, index) => <div key={`${item.name}-${index}`} className="flex items-start justify-between gap-3 border-b border-white/6 pb-3 last:border-0">
        <div><p className="text-sm font-semibold text-slate-200">{item.name}</p><p className="mt-1 text-xs leading-4 text-slate-500">{item.purpose}</p></div>
        <span className="shrink-0 rounded-md bg-white/5 px-2 py-1 text-[10px] font-bold text-violet-300">×{item.quantity || 1}</span>
      </div>)}</div> : <div className="mt-5 rounded-xl border border-white/8 bg-black/10 p-4 text-sm leading-6 text-slate-400">No dedicated hardware required. This concept can be prototyped using standard development computers and cloud services.</div>}
    </div>
  </div>;
}
export default SystemArchitecture;
