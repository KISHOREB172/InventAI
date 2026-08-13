const PROJECTS_KEY = "inventai-projects";

export function loadProjects() {
  try {
    const parsed = JSON.parse(localStorage.getItem(PROJECTS_KEY));
    return Array.isArray(parsed)
      ? parsed
        .filter((project) => project?.id && project?.idea && project?.result)
        .slice(0, 30)
        .map((project) => ({ ...project, versions: Array.isArray(project.versions) ? project.versions.slice(-8) : [] }))
      : [];
  } catch {
    return [];
  }
}

export function saveProjects(projects) {
  try {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects.slice(0, 30)));
    return true;
  } catch {
    return false;
  }
}

export function clearTransientAppData() {
  localStorage.removeItem("inventai-draft");
  localStorage.removeItem("inventai-last-analysis");
}

export function clearAllAppData() {
  const keys = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key?.startsWith("inventai-")) keys.push(key);
  }
  keys.forEach((key) => localStorage.removeItem(key));
}
