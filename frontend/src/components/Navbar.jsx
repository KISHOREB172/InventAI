import { useEffect, useMemo, useRef, useState } from "react";

const EMPTY_PROFILE = { name: "", role: "", organization: "", focus: "" };

const loadProfile = () => {
  try { return { ...EMPTY_PROFILE, ...JSON.parse(localStorage.getItem("inventai-profile")) }; }
  catch { return EMPTY_PROFILE; }
};

function Navbar({ onNewIdea, onClearData }) {
  const [profile, setProfile] = useState(loadProfile);
  const [draft, setDraft] = useState(profile);
  const [open, setOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const triggerRef = useRef(null);
  const dialogRef = useRef(null);
  const firstInputRef = useRef(null);
  const initials = useMemo(() => (profile.name || "Innovator")
    .split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase(), [profile.name]);

  useEffect(() => {
    if (!open) return undefined;
    const trigger = triggerRef.current;
    const main = document.querySelector("main");
    const navigation = document.querySelector(".app-navbar");
    main?.setAttribute("inert", "");
    navigation?.setAttribute("inert", "");
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => firstInputRef.current?.focus());

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const controls = [...dialogRef.current.querySelectorAll("button, input, textarea, select, [tabindex]:not([tabindex='-1'])")]
        .filter((control) => !control.disabled);
      if (!controls.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      main?.removeAttribute("inert");
      navigation?.removeAttribute("inert");
      trigger?.focus();
    };
  }, [open]);

  const showProfile = () => {
    setDraft(profile);
    setConfirmClear(false);
    setOpen(true);
  };

  const saveProfile = (event) => {
    event.preventDefault();
    const next = Object.fromEntries(Object.entries(draft).map(([key, value]) => [key, value.trim()]));
    setProfile(next);
    localStorage.setItem("inventai-profile", JSON.stringify(next));
    setOpen(false);
  };

  const clearData = () => {
    if (!confirmClear) { setConfirmClear(true); return; }
    setProfile(EMPTY_PROFILE);
    setDraft(EMPTY_PROFILE);
    setOpen(false);
    onClearData();
  };

  return <>
    <nav className="app-navbar fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-[#050b14]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-5">
        <button type="button" onClick={onNewIdea} className="brand-button" aria-label="Start a new idea">
          <span>I</span><div><strong>InventAI</strong><small>Decision workspace</small></div>
        </button>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onNewIdea} className="hidden rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 sm:block">New idea</button>
          <button ref={triggerRef} type="button" onClick={showProfile} aria-label="Open profile" aria-expanded={open} className="profile-trigger">
            <span className="profile-avatar">{initials}</span>
            <span className="profile-copy"><strong>{profile.name || "Your profile"}</strong><small>{profile.role || "Add your details"}</small></span>
          </button>
        </div>
      </div>
    </nav>

    {open && <div
      className="profile-overlay"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}
    >
      <form ref={dialogRef} onSubmit={saveProfile} role="dialog" aria-modal="true" aria-labelledby="profile-title" className="profile-dialog">
        <div className="profile-dialog__header">
          <div><p className="section-kicker">Innovator profile</p><h2 id="profile-title">Make the brief yours</h2><p>These details stay on this device and are never added to an analysis request.</p></div>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close profile">Close</button>
        </div>
        <div className="profile-fields">
          <label>Name<input ref={firstInputRef} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Your name" autoComplete="name" /></label>
          <label>Role<input value={draft.role} onChange={(event) => setDraft({ ...draft, role: event.target.value })} placeholder="Founder, student, engineer" /></label>
          <label className="profile-fields__wide">Organization<input value={draft.organization} onChange={(event) => setDraft({ ...draft, organization: event.target.value })} placeholder="College, company, team, or independent" /></label>
          <label className="profile-fields__wide">Innovation focus<textarea value={draft.focus} onChange={(event) => setDraft({ ...draft, focus: event.target.value })} rows={3} placeholder="Climate, accessibility, healthcare, developer tools" /></label>
        </div>
        <div className="profile-dialog__actions">
          <button type="button" className={confirmClear ? "danger" : "quiet"} onClick={clearData}>{confirmClear ? "Confirm clear all local data" : "Clear local data"}</button>
          <span />
          <button type="button" className="quiet" onClick={() => setOpen(false)}>Cancel</button>
          <button type="submit" className="primary">Save profile</button>
        </div>
      </form>
    </div>}
  </>;
}

export default Navbar;
