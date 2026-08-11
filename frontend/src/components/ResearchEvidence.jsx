const formatDate = (value) => {
  if (!value) return "";
  try { return new Date(value).toLocaleDateString(); } catch { return value; }
};

function ResearchEvidence({ evidence, loading, error, onRetry }) {
  return <section className="mt-12 rounded-2xl border border-cyan-400/15 bg-cyan-400/[.025] p-6 md:p-8">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="section-kicker">Grounded evidence</p><h2 className="section-title">Prior research & existing implementations</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Live source records matched to this idea. These are retrieved links—not names invented by the AI analysis.</p></div>
      {evidence?.searched_at && <span className="rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-1.5 text-[11px] font-bold text-emerald-300">SOURCES CHECKED · {formatDate(evidence.searched_at)}</span>}
    </div>

    {loading && <div className="mt-6 rounded-xl border border-white/8 bg-white/[.025] p-5 text-sm text-cyan-200"><span className="mr-2 inline-block animate-pulse">●</span>Searching scholarly records and public implementations…</div>}
    {!evidence && !loading && !error && <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-xl border border-white/8 bg-white/[.025] p-5 sm:flex-row sm:items-center"><div><p className="text-sm font-semibold text-slate-200">Search verified external sources for this idea</p><p className="mt-1 text-xs leading-5 text-slate-500">When you continue, derived idea keywords are sent to Crossref and GitHub to retrieve matching public records.</p></div><button onClick={onRetry} className="shrink-0 rounded-xl bg-cyan-300 px-4 py-2.5 text-xs font-black text-slate-950">Search external evidence</button></div>}
    {error && !loading && <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-200"><span>{error}</span><button onClick={onRetry} className="rounded-lg border border-amber-300/20 px-3 py-1.5 text-xs font-bold">Retry search</button></div>}

    {evidence && !loading && <>
      <div className="mt-7 grid gap-7 lg:grid-cols-2">
        <div><div className="mb-4 flex items-center justify-between"><h3 className="font-bold text-white">Research papers</h3><span className="text-[11px] uppercase tracking-wider text-slate-600">Crossref metadata</span></div><div className="space-y-3">{evidence.papers?.length ? evidence.papers.map((paper) => <a key={paper.doi || paper.url} href={paper.url} target="_blank" rel="noreferrer" className="block rounded-xl border border-white/8 bg-[#07111f] p-4 hover:border-cyan-400/25"><div className="flex items-start justify-between gap-3"><h4 className="text-sm font-bold leading-5 text-slate-200">{paper.title}</h4><span className="shrink-0 rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black text-emerald-300">{paper.relevance_score}% match</span></div><p className="mt-2 text-xs leading-5 text-slate-500">{paper.authors?.join(", ") || "Authors unavailable"}{paper.year ? ` · ${paper.year}` : ""}</p><div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-600">{paper.venue && <span>{paper.venue}</span>}<span>{paper.citations} citations</span><span>DOI verified</span></div>{paper.matched_terms?.length > 0 && <p className="mt-2 text-[11px] text-cyan-400/70">Matched: {paper.matched_terms.join(", ")}</p>}</a>) : <p className="rounded-xl border border-white/8 p-4 text-sm leading-6 text-slate-500">No sufficiently relevant papers were found. This is more useful than showing weak keyword matches; try adding the core technology or industry to your idea.</p>}</div></div>

        <div><div className="mb-4 flex items-center justify-between"><h3 className="font-bold text-white">Existing public projects</h3><span className="text-[11px] uppercase tracking-wider text-slate-600">GitHub records</span></div><div className="space-y-3">{evidence.existing_projects?.length ? evidence.existing_projects.map((project) => <a key={project.url} href={project.url} target="_blank" rel="noreferrer" className="block rounded-xl border border-white/8 bg-[#07111f] p-4 hover:border-violet-400/25"><div className="flex items-start justify-between gap-3"><h4 className="text-sm font-bold text-slate-200">{project.name}</h4><span className="shrink-0 rounded-full bg-violet-400/10 px-2 py-1 text-[10px] font-black text-violet-300">{project.relevance_score}% match</span></div><p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{project.description}</p><div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-600"><span>★ {project.stars}</span>{project.language && <span>{project.language}</span>}{project.updated_at && <span>Updated {formatDate(project.updated_at)}</span>}</div>{project.matched_terms?.length > 0 && <p className="mt-2 text-[11px] text-violet-400/70">Matched: {project.matched_terms.join(", ")}</p>}</a>) : <p className="rounded-xl border border-white/8 p-4 text-sm leading-6 text-slate-500">No sufficiently relevant public projects were found. The app will not pad this section with unrelated repositories.</p>}</div></div>
      </div>
      <div className="mt-5 rounded-xl border border-white/6 bg-black/10 p-4 text-xs leading-5 text-slate-600"><strong className="text-slate-400">Search terms:</strong> {evidence.query}. {evidence.limitations}</div>
    </>}
  </section>;
}

export default ResearchEvidence;
