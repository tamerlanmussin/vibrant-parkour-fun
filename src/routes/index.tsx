import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SKINS, type Level, type Skin, type Theme } from "@/lib/game-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NEON PARKOUR - Menu" },
      { name: "description", content: "Neon Parkour main menu with skins, play, and level creator." },
    ],
  }),
  component: MainMenu,
});

const THEMES: Theme[] = ["warmup", "city", "desert", "jungle", "neon", "arctic", "volcano", "void", "cyber", "space", "swamp", "candy", "graveyard", "underwater", "sunset", "factory", "crystal", "abyss", "aurora", "omega"];

function SkinPreview({ skin }: { skin: Skin }) {
  return (
    <div
      className="h-full w-full border"
      style={{
        background: skin.body,
        borderColor: skin.stroke,
        borderRadius: skin.shape === "circle" || skin.shape === "ring" ? "999px" : skin.shape === "pill" ? "999px" : "0",
        clipPath: skin.shape === "triangle" ? "polygon(50% 5%, 95% 95%, 5% 95%)" : skin.shape === "diamond" ? "polygon(50% 0, 100% 50%, 50% 100%, 0 50%)" : undefined,
      }}
    />
  );
}

function MainMenu() {
  const defaultOwned = useMemo(
    () => SKINS.filter((s) => s.shape === "square" && ["БЕЛЫЙ", "СИНИЙ", "КРАСНЫЙ"].some((n) => s.name.endsWith(n))).map((s) => s.id),
    []
  );
  const [skinId, setSkinId] = useState(() => {
    if (typeof window === "undefined") return SKINS[0].id;
    return localStorage.getItem("np_skin") ?? SKINS[0].id;
  });
  const [owned, setOwned] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem("np_owned");
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  });
  const [customLevels, setCustomLevels] = useState<Level[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem("np_custom_levels");
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  });
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState<Level | null>(null);

  useEffect(() => {
    if (owned.length === 0) setOwned(defaultOwned);
  }, []);
  useEffect(() => { localStorage.setItem("np_skin", skinId); }, [skinId]);
  useEffect(() => { localStorage.setItem("np_owned", JSON.stringify(owned)); }, [owned]);
  useEffect(() => { localStorage.setItem("np_custom_levels", JSON.stringify(customLevels)); }, [customLevels]);

  const skin = SKINS.find((s) => s.id === skinId) ?? SKINS[0];

  function openCreateEditor() {
    const nextId = 1000 + customLevels.length + 1;
    setDraft({
      id: nextId,
      name: `MY LEVEL ${customLevels.length + 1}`,
      target: 500,
      gapMin: 120,
      gapMax: 240,
      wallChance: 0.5,
      gravity: 0.44,
      speed: 5.5,
      bgTop: "#1a2129",
      bgBot: "#262e38",
      ground: "#22e6ff",
      wall: "#ec4899",
      theme: "neon",
    });
    setEditorOpen(true);
  }

  function saveDraft() {
    if (!draft) return;
    setCustomLevels((levels) => {
      const exists = levels.some((l) => l.id === draft.id);
      return exists ? levels.map((l) => l.id === draft.id ? draft : l) : [...levels, draft];
    });
    localStorage.setItem("np_level", String(draft.id));
    setEditorOpen(false);
    setDraft(null);
  }

  function deleteCustom(id: number) {
    setCustomLevels((levels) => levels.filter((l) => l.id !== id));
  }

  function chooseCustom(id: number) {
    localStorage.setItem("np_level", String(id));
    window.location.href = "/play";
  }

  return (
    <main className="min-h-screen p-4 md:p-6" style={{ background: "radial-gradient(circle at 50% 0%, #1a2129 0%, #262e38 48%, #05010f 100%)" }}>
      <nav className="mx-auto mb-5 flex w-full max-w-7xl items-center justify-between text-sm font-bold tracking-wider">
        <span style={{ color: "#e6e6e6" }}>NEON PARKOUR</span>
        <Link to="/auth" className="px-3 py-1 text-xs uppercase border" style={{ borderColor: "#1c69d4", color: "#1c69d4" }}>LOGIN</Link>
      </nav>

      <section className="mx-auto grid w-full max-w-7xl gap-4 lg:grid-cols-[280px_1fr_300px]">
        <aside className="p-4 font-mono" style={{ background: "rgba(26,33,41,0.78)", border: "1px solid #facc15" }}>
          <h2 className="mb-3 text-sm font-black tracking-wider" style={{ color: "#facc15" }}>SKINS</h2>
          <div className="mb-3 flex items-center gap-3 border p-3" style={{ borderColor: "#3a4250", background: "rgba(0,0,0,0.25)" }}>
            <div className="h-16 w-16"><SkinPreview skin={skin} /></div>
            <div className="min-w-0 text-[10px]" style={{ color: skin.body }}>{skin.name}</div>
          </div>
          <div className="grid max-h-[520px] grid-cols-4 gap-2 overflow-y-auto pr-1">
            {SKINS.map((s) => {
              const isOwned = owned.includes(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => isOwned && setSkinId(s.id)}
                  disabled={!isOwned}
                  title={isOwned ? s.name : "Locked"}
                  className="aspect-square border-2 p-1 transition-transform hover:scale-105 disabled:cursor-not-allowed"
                  style={{
                    background: "rgba(0,0,0,0.3)",
                    borderColor: skinId === s.id ? "#ffffff" : "#3a4250",
                    opacity: isOwned ? 1 : 0.25,
                    filter: isOwned ? "none" : "grayscale(1)",
                  }}
                >
                  {isOwned ? <SkinPreview skin={s} /> : <span className="text-[9px]" style={{ color: "#6b6b6b" }}>LOCK</span>}
                </button>
              );
            })}
          </div>
        </aside>

        <section className="flex min-h-[520px] flex-col items-center justify-center p-6 text-center font-mono" style={{ background: "rgba(26,33,41,0.78)", border: "2px solid #1c69d4" }}>
          <h1 className="text-5xl font-black tracking-tighter md:text-7xl" style={{ color: "#ffffff" }}>NEON<br /><span style={{ color: "#1c69d4" }}>PARKOUR</span></h1>
          <div className="my-8 flex items-end gap-2">
            <div className="h-12 w-4" style={{ background: "#1c69d4" }} />
            <div className="h-8 w-4" style={{ background: "#e22718" }} />
            <div className="h-8 w-8"><SkinPreview skin={skin} /></div>
            <div className="h-16 w-4" style={{ background: "#22e6ff" }} />
            <div className="h-10 w-4" style={{ background: "#facc15" }} />
          </div>
          <Link to="/levels" className="px-12 py-5 text-base font-black uppercase tracking-wider transition-transform hover:scale-[1.03]" style={{ background: "#1c69d4", color: "#ffffff" }}>PLAY</Link>
          <p className="mt-4 text-xs" style={{ color: "#6b6b6b" }}>Select a level on /levels to start the run.</p>
        </section>

        <aside className="p-4 font-mono" style={{ background: "rgba(26,33,41,0.78)", border: "1px solid #22e6ff" }}>
          <h2 className="mb-3 text-sm font-black tracking-wider" style={{ color: "#22e6ff" }}>CREATE</h2>
          <button onClick={openCreateEditor} className="mb-3 min-h-24 w-full border-2 border-dashed p-3 text-sm font-black uppercase tracking-wider hover:bg-[#22e6ff] hover:text-[#0a0a0a]" style={{ borderColor: "#22e6ff", color: "#22e6ff" }}>+ CREATE LEVEL</button>
          <div className="flex max-h-[520px] flex-col gap-3 overflow-y-auto pr-1">
            {customLevels.length === 0 && <p className="text-xs" style={{ color: "#6b6b6b" }}>Your created levels will be here.</p>}
            {customLevels.map((level) => (
              <div key={level.id} className="border p-3" style={{ borderColor: "#3a4250", background: "rgba(0,0,0,0.22)" }}>
                <button onClick={() => chooseCustom(level.id)} className="w-full text-left text-xs font-black uppercase" style={{ color: "#e6e6e6" }}>
                  <span>{level.name.slice(0, 22)}</span>
                  <span className="float-right" style={{ color: level.ground }}>{level.target}</span>
                </button>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => { setDraft({ ...level }); setEditorOpen(true); }} className="flex-1 border py-1 text-[10px]" style={{ borderColor: "#facc15", color: "#facc15" }}>EDIT</button>
                  <button onClick={() => deleteCustom(level.id)} className="flex-1 border py-1 text-[10px]" style={{ borderColor: "#e22718", color: "#e22718" }}>DELETE</button>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </section>

      {editorOpen && draft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)" }} onClick={() => setEditorOpen(false)}>
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto p-6 font-mono" style={{ background: "#1a2129", border: "2px solid #22e6ff" }} onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-black" style={{ color: "#22e6ff" }}>LEVEL CREATOR</h2>
              <button onClick={() => setEditorOpen(false)} className="px-2 text-xl" style={{ color: "#6b6b6b" }}>x</button>
            </div>
            <div className="flex flex-col gap-3 text-xs" style={{ color: "#e6e6e6" }}>
              <label className="flex flex-col gap-1">
                <span style={{ color: "#22e6ff" }}>NAME</span>
                <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="border bg-black/40 px-2 py-1" style={{ borderColor: "#3a4250", color: "#fff" }} />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <Range label="GOAL" min={100} max={9999} step={50} value={draft.target} onChange={(target) => setDraft({ ...draft, target })} />
                <Range label="SPEED" min={3} max={10} step={0.1} value={draft.speed} onChange={(speed) => setDraft({ ...draft, speed })} />
                <Range label="GRAVITY" min={0.3} max={0.7} step={0.01} value={draft.gravity} onChange={(gravity) => setDraft({ ...draft, gravity })} />
                <Range label="WALLS" min={0} max={1} step={0.05} value={draft.wallChance} onChange={(wallChance) => setDraft({ ...draft, wallChance })} />
              </div>
              <select value={draft.theme} onChange={(e) => setDraft({ ...draft, theme: e.target.value as Theme })} className="border bg-black/40 px-2 py-1" style={{ borderColor: "#3a4250", color: "#fff" }}>
                {THEMES.map((theme) => <option key={theme} value={theme}>{theme}</option>)}
              </select>
            </div>
            <button onClick={saveDraft} className="mt-5 w-full py-3 text-xs font-black uppercase tracking-wider" style={{ background: "#22e6ff", color: "#0a0a0a" }}>SAVE LEVEL</button>
          </div>
        </div>
      )}
    </main>
  );
}

function Range({ label, min, max, step, value, onChange }: { label: string; min: number; max: number; step: number; value: number; onChange: (value: number) => void }) {
  return (
    <label className="flex flex-col gap-1">
      <span style={{ color: "#22e6ff" }}>{label}: {Number(value).toFixed(step < 1 ? 2 : 0)}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}
