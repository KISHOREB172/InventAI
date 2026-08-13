import { useMemo, useState } from "react";
import SavedProjectCard from "./SavedProjectCard";

function ProjectDashboard({ projects, onOpen, onDelete, onUpdate }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const visible = useMemo(() => projects
    .filter((project) => (!favoritesOnly || project.favorite)
      && `${project.name || ""} ${project.result?.title || ""} ${project.idea}`.toLowerCase().includes(query.toLowerCase()))
    .sort((first, second) => sort === "score"
      ? (second.result?.innovation_score || 0) - (first.result?.innovation_score || 0)
      : sort === "name"
        ? (first.name || first.result?.title || "").localeCompare(second.name || second.result?.title || "")
        : second.id - first.id), [projects, query, sort, favoritesOnly]);

  return <section className="project-dashboard" aria-labelledby="project-dashboard-title"><div>
    <header><div><p className="section-kicker">Saved on this device</p><h2 id="project-dashboard-title">Your idea library</h2><p>Open a prior decision or compare how the evidence changes over time.</p></div><span>{projects.length} saved</span></header>
    <div className="project-filters">
      <label><span className="sr-only">Search saved ideas</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search saved ideas" /></label>
      <label><span className="sr-only">Sort saved ideas</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Newest</option><option value="score">Highest score</option><option value="name">Name</option></select></label>
      <button type="button" aria-pressed={favoritesOnly} onClick={() => setFavoritesOnly((value) => !value)}>{favoritesOnly ? "Showing favorites" : "Favorites only"}</button>
    </div>
    <div className="project-grid">{visible.map((project) => <SavedProjectCard key={project.id} project={project} onOpen={onOpen} onDelete={onDelete} onRename={(name) => onUpdate(project.id, { name })} onFavorite={() => onUpdate(project.id, { favorite: !project.favorite })} />)}</div>
    {visible.length === 0 && <div className="project-empty">No saved ideas match these filters.</div>}
  </div></section>;
}

export default ProjectDashboard;
