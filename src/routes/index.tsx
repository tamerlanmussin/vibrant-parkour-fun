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
    () => SKINS.filter((s) => s.shape === "square").slice(0, 3).map((s) => s.id),
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
  const [skinsOpen, setSkinsOpen] = useState(false);
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
    <main className="relative min-h-screen overflow-hidden font-mono" style={{ background: "linear-gradient(180deg, #b407a9 0%, #d315c8 43%, #6c087a 44%, #1a1232 100%)" }}>
      <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(circle at 12% 18%, #ff62d7 0 8%, transparent 9%), radial-gradient(circle at 78% 20%, #ff62d7 0 10%, transparent 11%), radial-gradient(circle at 52% 46%, #ff62d7 0 18%, transparent 19%)" }} />
      <div className="absolute bottom-0 left-0 right-0 h-[25vh]" style={{ background: "repeating-linear-gradient(90deg, #360c4a 0 86px, #190923 86px 96px), linear-gradient(#ea18cf, #340a43)", borderTop: "8px solid #ff58e8" }} />
      <div className="absolute left-[-6vw] top-[42vh] h-2 w-[122vw] rotate-[-38deg] bg-white shadow-[0_0_0_4px_#b8c3d1,0_0_18px_#ffffff]" />
      <div className="absolute left-[56vw] top-[43vh] h-2 w-[44vw] rotate-[42deg] bg-white shadow-[0_0_0_4px_#b8c3d1,0_0_18px_#ffffff]" />

      <nav className="relative z-10 flex items-center px-4 py-4 md:px-8">
        <Link to="/auth" className="border-4 px-4 py-2 text-xs font-black uppercase shadow-[4px_4px_0_#000]" style={{ borderColor: "#ffffff", background: "#1c69d4", color: "#ffffff" }}>LOGIN</Link>
      </nav>

      <section className="relative z-10 mx-auto flex min-h-[68vh] max-w-6xl flex-col items-center justify-center px-4 text-center">
        <h1 className="mb-8 text-5xl font-black uppercase leading-none md:text-8xl" style={{ color: "#a8ff36", WebkitTextStroke: "2px #ffffff", textShadow: "0 7px 0 #1b4b13, 0 12px 0 #000000" }}>
          NEON PARKOUR
        </h1>

        <div className="grid w-full max-w-4xl grid-cols-3 items-center gap-4 md:gap-10">
          <button onClick={() => setSkinsOpen(true)} className="mx-auto flex h-24 w-24 items-center justify-center border-4 shadow-[7px_7px_0_#000] transition-transform hover:scale-105 md:h-36 md:w-36" style={{ borderColor: "#ffffff", background: "#92e329" }} aria-label="Open skins">
            <div className="h-14 w-14 md:h-20 md:w-20"><SkinPreview skin={skin} /></div>
          </button>

          <Link to="/levels" className="mx-auto flex h-32 w-32 items-center justify-center border-4 shadow-[9px_9px_0_#000] transition-transform hover:scale-105 md:h-48 md:w-48" style={{ borderColor: "#ffffff", background: "#92e329" }} aria-label="Play">
            <span className="ml-2 block h-0 w-0 border-y-[34px] border-l-[55px] border-y-transparent md:border-y-[48px] md:border-l-[78px]" style={{ borderLeftColor: "#ffe735", filter: "drop-shadow(5px 5px 0 #1b4b13)" }} />
          </Link>

          <button onClick={openCreateEditor} className="mx-auto flex h-24 w-24 items-center justify-center border-4 text-5xl font-black shadow-[7px_7px_0_#000] transition-transform hover:scale-105 md:h-36 md:w-36 md:text-7xl" style={{ borderColor: "#ffffff", background: "#92e329", color: "#245a0d", textShadow: "3px 3px 0 #d6ff50" }} aria-label="Create level">
            X
          </button>
        </div>
      </section>

      {skinsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.72)" }} onClick={() => setSkinsOpen(false)}>
          <div className="w-full max-w-3xl border-4 p-5 shadow-[10px_10px_0_#000]" style={{ background: "#1a1232", borderColor: "#ffffff" }} onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-black uppercase" style={{ color: "#a8ff36", WebkitTextStroke: "1px #ffffff", textShadow: "0 4px 0 #000" }}>Skins</h2>
              <button onClick={() => setSkinsOpen(false)} className="h-10 w-10 border-2 text-xl font-black" style={{ borderColor: "#ffffff", color: "#ffffff" }}>x</button>
            </div>
            <div className="mb-4 flex items-center gap-4 border-2 p-3" style={{ borderColor: "#ff58e8", background: "rgba(0,0,0,0.24)" }}>
              <div className="h-20 w-20"><SkinPreview skin={skin} /></div>
              <div className="text-sm font-black uppercase" style={{ color: skin.body }}>{skin.name}</div>
            </div>
            <div className="grid max-h-[58vh] grid-cols-5 gap-3 overflow-y-auto pr-1 md:grid-cols-8">
              {SKINS.map((s) => {
                const isOwned = owned.includes(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => isOwned && setSkinId(s.id)}
                    disabled={!isOwned}
                    title={isOwned ? s.name : "Locked"}
                    className="aspect-square border-4 p-2 transition-transform hover:scale-105 disabled:cursor-not-allowed"
                    style={{
                      background: skinId === s.id ? "#92e329" : "rgba(255,255,255,0.12)",
                      borderColor: skinId === s.id ? "#ffffff" : "#4f2d64",
                      opacity: isOwned ? 1 : 0.25,
                      filter: isOwned ? "none" : "grayscale(1)",
                    }}
                  >
                    {isOwned ? <SkinPreview skin={s} /> : <span className="text-[9px]" style={{ color: "#ffffff" }}>LOCK</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {editorOpen && draft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.78)" }} onClick={() => setEditorOpen(false)}>
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border-4 p-5 font-mono shadow-[10px_10px_0_#000]" style={{ background: "#1a1232", borderColor: "#ffffff" }} onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-black uppercase" style={{ color: "#a8ff36", WebkitTextStroke: "1px #ffffff", textShadow: "0 4px 0 #000" }}>Create Level</h2>
              <button onClick={() => setEditorOpen(false)} className="h-10 w-10 border-2 text-xl font-black" style={{ borderColor: "#ffffff", color: "#ffffff" }}>x</button>
            </div>
            <div className="flex flex-col gap-3 text-xs" style={{ color: "#ffffff" }}>
              <label className="flex flex-col gap-1">
                <span style={{ color: "#a8ff36" }}>NAME</span>
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
            <button onClick={saveDraft} className="mt-5 w-full border-4 py-3 text-xs font-black uppercase tracking-wider shadow-[5px_5px_0_#000]" style={{ borderColor: "#ffffff", background: "#92e329", color: "#245a0d" }}>SAVE LEVEL</button>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {customLevels.map((level) => (
                <div key={level.id} className="border-2 p-3" style={{ borderColor: "#4f2d64", background: "rgba(0,0,0,0.2)" }}>
                  <button onClick={() => chooseCustom(level.id)} className="w-full text-left text-xs font-black uppercase" style={{ color: "#ffffff" }}>
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
