import { useMemo, useState } from "react";

const EMPTY_PROFILE = { name: "", role: "", organization: "", focus: "" };

const loadProfile = () => {
  try { return { ...EMPTY_PROFILE, ...JSON.parse(localStorage.getItem("inventai-profile")) }; }
  catch { return EMPTY_PROFILE; }
};

function Navbar() {
  const [profile, setProfile] = useState(loadProfile);
  const [draft, setDraft] = useState(profile);
  const [open, setOpen] = useState(false);
  const initials = useMemo(() => (profile.name || "Innovator").split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase(), [profile.name]);

  const showProfile = () => { setDraft(profile); setOpen(true); };
  const saveProfile = (event) => {
    event.preventDefault();
    const next = Object.fromEntries(Object.entries(draft).map(([key, value]) => [key, value.trim()]));
    setProfile(next); localStorage.setItem("inventai-profile", JSON.stringify(next)); setOpen(false);
  };

  return <>
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-[#050b14]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-5">
        <div className="flex min-w-0 items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-cyan-300 to-blue-600 font-black text-slate-950">I</span><div className="min-w-0"><div className="font-black tracking-tight">InventAI</div><div className="text-[10px] uppercase tracking-[.18em] text-slate-500">Innovation OS</div></div></div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-1.5 text-xs font-semibold text-emerald-300 sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Analysis engine ready</div>
          <button type="button" onClick={showProfile} aria-label="Open profile" className="flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 p-1.5 pr-2.5 text-left hover:bg-cyan-400/10"><span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-violet-300 to-cyan-300 text-xs font-black text-slate-950">{initials}</span><span className="hidden max-w-28 sm:block"><span className="block truncate text-xs font-bold text-slate-200">{profile.name || "Your profile"}</span><span className="block truncate text-[10px] text-slate-500">{profile.role || "Add your details"}</span></span></button>
        </div>
      </div>
    </nav>

    {open && <div role="dialog" aria-modal="true" aria-labelledby="profile-title" className="fixed inset-0 z-[70] grid place-items-center bg-black/75 p-4 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}>
      <form onSubmit={saveProfile} className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0a1422] p-6 shadow-2xl md:p-8">
        <div className="flex items-start justify-between gap-4"><div><p className="section-kicker">Innovator profile</p><h2 id="profile-title" className="mt-1 text-2xl font-black text-white">Make the brief yours</h2><p className="mt-2 text-sm leading-6 text-slate-500">Stored only on this device. Authentication can be added when the backend is deployed.</p></div><button type="button" onClick={() => setOpen(false)} aria-label="Close profile" className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 text-slate-400">×</button></div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-bold text-slate-400">Name<input autoFocus value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Your name" className="mt-2 w-full rounded-xl border border-white/10 bg-[#07111f] px-4 py-3 text-sm font-normal text-white outline-none focus:border-cyan-400/40" /></label>
          <label className="text-xs font-bold text-slate-400">Role<input value={draft.role} onChange={(event) => setDraft({ ...draft, role: event.target.value })} placeholder="Founder, student, engineer…" className="mt-2 w-full rounded-xl border border-white/10 bg-[#07111f] px-4 py-3 text-sm font-normal text-white outline-none focus:border-cyan-400/40" /></label>
          <label className="text-xs font-bold text-slate-400 sm:col-span-2">Organization<input value={draft.organization} onChange={(event) => setDraft({ ...draft, organization: event.target.value })} placeholder="College, company, team, or independent" className="mt-2 w-full rounded-xl border border-white/10 bg-[#07111f] px-4 py-3 text-sm font-normal text-white outline-none focus:border-cyan-400/40" /></label>
          <label className="text-xs font-bold text-slate-400 sm:col-span-2">Innovation focus<textarea value={draft.focus} onChange={(event) => setDraft({ ...draft, focus: event.target.value })} rows={3} placeholder="Climate, accessibility, healthcare, AI tooling…" className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-[#07111f] px-4 py-3 text-sm font-normal leading-6 text-white outline-none focus:border-cyan-400/40" /></label>
        </div>
        <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-400">Cancel</button><button type="submit" className="rounded-xl bg-gradient-to-r from-cyan-300 to-blue-500 px-5 py-2.5 text-sm font-black text-slate-950">Save profile</button></div>
      </form>
    </div>}
  </>;
}

export default Navbar;
