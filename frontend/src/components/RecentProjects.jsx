const formatDate = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
};

export default function RecentProjects({ projects, onOpen }) {
  return <section className="recent-projects" aria-labelledby="recent-projects-title">
    <details>
      <summary>
        <span><small>Saved on this device</small><strong id="recent-projects-title">Your ideas</strong></span>
        <b>{projects.length}</b>
      </summary>
      <div className="recent-projects__list">
        {projects.map((project) => <button type="button" key={project.id} onClick={() => onOpen(project)}>
          <span>
            <strong>{project.name || project.result?.title || "Untitled idea"}</strong>
            <small>{formatDate(project.createdAt)} · {project.result?.innovation_score ?? "--"}/100 potential</small>
          </span>
          <span aria-hidden="true">Open</span>
        </button>)}
      </div>
    </details>
  </section>;
}
