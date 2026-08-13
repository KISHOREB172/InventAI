import { useState } from "react";

const formatDate = (value) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
};

function SavedProjectCard({ project, onOpen, onDelete, onRename, onFavorite }) {
  const title = project.name || project.result?.title || "Untitled innovation";
  const [draftName, setDraftName] = useState(title);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const commitName = () => {
    const next = draftName.trim();
    if (next !== (project.name || "")) onRename(next);
    if (!next) setDraftName(project.result?.title || "Untitled innovation");
  };

  return <article className="project-card">
    <div className="project-card__head">
      <div>
        <label className="sr-only" htmlFor={`project-${project.id}`}>Rename {title}</label>
        <input id={`project-${project.id}`} value={draftName} onChange={(event) => setDraftName(event.target.value)} onBlur={commitName} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} />
        <p>{formatDate(project.createdAt)} · {project.versions?.length || 1} version{(project.versions?.length || 1) !== 1 ? "s" : ""}</p>
      </div>
      <button type="button" aria-label={project.favorite ? "Remove from favorites" : "Add to favorites"} aria-pressed={Boolean(project.favorite)} onClick={onFavorite}>{project.favorite ? "Saved" : "Favorite"}</button>
    </div>
    <p className="project-card__idea">{project.idea}</p>
    <div className="project-card__scores">{[
      ["Innovation", project.result?.innovation_score],
      ["Novelty", project.result?.novelty_score],
      ["Feasibility", project.result?.feasibility_score],
    ].map(([label, value]) => <div key={label}><small>{label}</small><strong>{value ?? "--"}</strong></div>)}</div>
    <div className="project-card__actions">
      <button type="button" className="primary" onClick={() => onOpen(project)}>Open idea</button>
      {!confirmDelete && <button type="button" onClick={() => setConfirmDelete(true)}>Delete</button>}
      {confirmDelete && <><button type="button" onClick={() => setConfirmDelete(false)}>Cancel</button><button type="button" className="danger" onClick={() => onDelete(project.id)}>Confirm delete</button></>}
    </div>
  </article>;
}

export default SavedProjectCard;
