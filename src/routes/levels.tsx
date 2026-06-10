import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LEVELS, type Level } from "@/lib/game-data";

export const Route = createFileRoute("/levels")({
  head: () => ({
    meta: [
      { title: "Levels - Neon Parkour" },
      { name: "description", content: "Choose a Neon Parkour level." },
    ],
  }),
  component: LevelsPage,
});

function LevelsPage() {
  const [unlocked, setUnlocked] = useState(1);
  const [selectedId, setSelectedId] = useState(1);
  const [customLevels, setCustomLevels] = useState<Level[]>([]);

  useEffect(() => {
    setUnlocked(Number(localStorage.getItem("np_unlocked") ?? 1));
    setSelectedId(Number(localStorage.getItem("np_level") ?? 1));
    try {
      setCustomLevels(JSON.parse(localStorage.getItem("np_custom_levels") ?? "[]"));
    } catch {
      setCustomLevels([]);
    }
  }, []);

  function playLevel(id: number) {
    localStorage.setItem("np_level", String(id));
    window.location.href = "/play";
  }

  return (
    <main className="min-h-screen p-4 md:p-6" style={{ background: "radial-gradient(circle at 50% 0%, #1a2129 0%, #262e38 48%, #05010f 100%)" }}>
      <nav className="mx-auto mb-6 flex w-full max-w-5xl items-center justify-between font-mono text-sm font-bold tracking-wider">
        <Link to="/" style={{ color: "#e6e6e6" }}>NEON PARKOUR</Link>
        <Link to="/" className="border px-4 py-2 text-xs uppercase" style={{ borderColor: "#6b6b6b", color: "#e6e6e6" }}>MENU</Link>
      </nav>

      <section className="mx-auto w-full max-w-5xl p-4 md:p-5 font-mono" style={{ background: "rgba(26,33,41,0.78)", border: "1px solid #1c69d4" }}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h1 className="text-lg font-black tracking-wider" style={{ color: "#1c69d4" }}>LEVELS</h1>
          <span className="text-[10px]" style={{ color: "#6b6b6b" }}>Choose a level to start</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {LEVELS.map((level) => {
            const isLocked = level.id > unlocked;
            const active = level.id === selectedId;
            return (
              <button
                key={level.id}
                onClick={() => !isLocked && playLevel(level.id)}
                disabled={isLocked}
                className="min-h-28 border p-3 text-left transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40"
                style={{
                  background: active ? level.ground : "rgba(0,0,0,0.22)",
                  color: active ? "#ffffff" : isLocked ? "#6b6b6b" : "#e6e6e6",
                  borderColor: active ? level.ground : "#3a4250",
                }}
              >
                <div className="flex items-center justify-between text-xs font-black">
                  <span>{String(level.id).padStart(2, "0")}</span>
                  <span style={{ color: active ? "#ffffff" : level.ground }}>{isLocked ? "LOCK" : level.target < 9999 ? level.target : "INF"}</span>
                </div>
                <div className="mt-4 text-sm font-black uppercase leading-tight">{level.name.includes("\u00b7") ? level.name.split("\u00b7").pop()!.trim() : level.name}</div>
              </button>
            );
          })}
        </div>

        {customLevels.length > 0 && (
          <>
            <h2 className="mb-3 mt-6 text-sm font-black tracking-wider" style={{ color: "#22e6ff" }}>MY LEVELS</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {customLevels.map((level) => (
                <button
                  key={level.id}
                  onClick={() => playLevel(level.id)}
                  className="min-h-24 border p-3 text-left transition-transform hover:scale-[1.02]"
                  style={{ background: "rgba(0,0,0,0.22)", borderColor: "#3a4250", color: "#e6e6e6" }}
                >
                  <div className="flex items-center justify-between text-xs font-black">
                    <span>{level.name.slice(0, 22)}</span>
                    <span style={{ color: level.ground }}>{level.target}</span>
                  </div>
                  <div className="mt-3 text-[10px]" style={{ color: "#6b6b6b" }}>{level.theme}</div>
                </button>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
