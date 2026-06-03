import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/play")({
  head: () => ({
    meta: [
      { title: "Play — Neon Parkour" },
      { name: "description", content: "Прыгай, беги по стенам и не падай." },
    ],
  }),
  component: Game,
});

type LeaderRow = { username: string; best_score: number };
type Profile = { username: string; best_score: number };
type Platform = { x: number; y: number; w: number; h: number; kind: "ground" | "wall" };

type Theme = "warmup" | "city" | "desert" | "jungle" | "neon" | "arctic" | "volcano" | "void";

type Level = {
  id: number;
  name: string;
  target: number; // distance score to finish
  gapMin: number;
  gapMax: number;
  wallChance: number;
  gravity: number;
  speed: number;
  bgTop: string;
  bgBot: string;
  ground: string;
  wall: string;
  theme: Theme;
};

const LEVELS: Level[] = [
  { id: 1, name: "ТРАССА 01 · РАЗМИНКА",     target: 200,  gapMin: 80,  gapMax: 180, wallChance: 0.25, gravity: 0.55, speed: 6.5, bgTop: "#1a2129", bgBot: "#262e38", ground: "#1c69d4", wall: "#e22718", theme: "warmup" },
  { id: 2, name: "ТРАССА 02 · ГОРОД",        target: 400,  gapMin: 100, gapMax: 200, wallChance: 0.40, gravity: 0.58, speed: 7.0, bgTop: "#0c1a2a", bgBot: "#1a3045", ground: "#00b3d4", wall: "#ff5a1f", theme: "city" },
  { id: 3, name: "ТРАССА 03 · ПУСТЫНЯ",      target: 600,  gapMin: 110, gapMax: 220, wallChance: 0.45, gravity: 0.55, speed: 7.5, bgTop: "#3a1a05", bgBot: "#5a2d0a", ground: "#e8a35a", wall: "#c2410c", theme: "desert" },
  { id: 4, name: "ТРАССА 04 · ДЖУНГЛИ",      target: 850,  gapMin: 120, gapMax: 240, wallChance: 0.50, gravity: 0.62, speed: 7.8, bgTop: "#0a1f10", bgBot: "#143a1f", ground: "#22c55e", wall: "#fbbf24", theme: "jungle" },
  { id: 5, name: "ТРАССА 05 · НОЧНОЙ НЕОН",  target: 1100, gapMin: 130, gapMax: 260, wallChance: 0.55, gravity: 0.60, speed: 8.2, bgTop: "#1a0535", bgBot: "#0a0420", ground: "#a855f7", wall: "#ec4899", theme: "neon" },
  { id: 6, name: "ТРАССА 06 · АРКТИКА",      target: 1400, gapMin: 140, gapMax: 280, wallChance: 0.55, gravity: 0.58, speed: 8.5, bgTop: "#0a2540", bgBot: "#1a4a6e", ground: "#bae6fd", wall: "#3b82f6", theme: "arctic" },
  { id: 7, name: "ТРАССА 07 · ВУЛКАН",       target: 1800, gapMin: 150, gapMax: 300, wallChance: 0.60, gravity: 0.65, speed: 8.8, bgTop: "#1a0505", bgBot: "#3a0a0a", ground: "#f97316", wall: "#dc2626", theme: "volcano" },
  { id: 8, name: "ТРАССА 08 · БЕСКОНЕЧНОСТЬ", target: 9999, gapMin: 160, gapMax: 320, wallChance: 0.55, gravity: 0.62, speed: 9.2, bgTop: "#000000", bgBot: "#1a1a1a", ground: "#ffffff", wall: "#facc15", theme: "void" },
];


type Skin = { id: string; name: string; body: string; stroke: string };
const SKINS: Skin[] = [
  { id: "white",   name: "БЕЛЫЙ",    body: "#ffffff", stroke: "#262626" },
  { id: "blue",    name: "СИНИЙ",    body: "#1c69d4", stroke: "#0653b6" },
  { id: "red",     name: "КРАСНЫЙ",  body: "#e22718", stroke: "#7f1d1d" },
  { id: "neon",    name: "НЕОН",     body: "#22e6ff", stroke: "#0e7490" },
  { id: "gold",    name: "ЗОЛОТО",   body: "#fbbf24", stroke: "#78350f" },
  { id: "ghost",   name: "ПРИЗРАК",  body: "#94a3b8", stroke: "#ffffff" },
  { id: "magenta", name: "МАГЕНТА",  body: "#ec4899", stroke: "#831843" },
  { id: "lime",    name: "ЛАЙМ",     body: "#a3e635", stroke: "#365314" },
];

function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [dead, setDead] = useState(false);
  const [won, setWon] = useState(false);
  const restartRef = useRef<() => void>(() => {});
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [leaders, setLeaders] = useState<LeaderRow[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showRules, setShowRules] = useState(false);

  const [skinId, setSkinId] = useState<string>(() => {
    if (typeof window === "undefined") return "white";
    return localStorage.getItem("np_skin") ?? "white";
  });
  const [levelId, setLevelId] = useState<number>(() => {
    if (typeof window === "undefined") return 1;
    return Number(localStorage.getItem("np_level") ?? 1);
  });
  const [unlocked, setUnlocked] = useState<number>(() => {
    if (typeof window === "undefined") return 1;
    return Number(localStorage.getItem("np_unlocked") ?? 1);
  });

  const level = useMemo(() => LEVELS.find((l) => l.id === levelId) ?? LEVELS[0], [levelId]);
  const skin = useMemo(() => SKINS.find((s) => s.id === skinId) ?? SKINS[0], [skinId]);

  const levelRef = useRef(level);
  const skinRef = useRef(skin);
  useEffect(() => { levelRef.current = level; }, [level]);
  useEffect(() => { skinRef.current = skin; }, [skin]);

  const lastSubmittedRef = useRef<number>(-1);

  useEffect(() => { localStorage.setItem("np_skin", skinId); }, [skinId]);
  useEffect(() => { localStorage.setItem("np_level", String(levelId)); }, [levelId]);
  useEffect(() => { localStorage.setItem("np_unlocked", String(unlocked)); }, [unlocked]);

  async function loadLeaders() {
    const { data } = await supabase
      .from("profiles").select("username,best_score")
      .order("best_score", { ascending: false }).limit(10);
    if (data) setLeaders(data);
  }
  async function loadProfile(uid: string) {
    const { data } = await supabase
      .from("profiles").select("username,best_score")
      .eq("user_id", uid).maybeSingle();
    if (data) { setProfile(data); setBest(data.best_score); }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user.id ?? null;
      setUserId(uid);
      if (uid) loadProfile(uid);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const uid = session?.user.id ?? null;
      setUserId(uid);
      if (uid) loadProfile(uid); else setProfile(null);
    });
    loadLeaders();
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submitScore(finalScore: number) {
    if (!userId || finalScore <= 0) return;
    if (lastSubmittedRef.current === finalScore) return;
    lastSubmittedRef.current = finalScore;
    setSubmitting(true);
    try {
      await supabase.from("scores").insert({ user_id: userId, score: finalScore });
      if (profile && finalScore > profile.best_score) {
        await supabase.from("profiles").update({ best_score: finalScore }).eq("user_id", userId);
        setProfile({ ...profile, best_score: finalScore });
      }
      await loadLeaders();
    } finally { setSubmitting(false); }
  }

  useEffect(() => {
    if ((dead || won) && score > 0) submitScore(score);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dead, won, score]);

  // unlock next level on win
  useEffect(() => {
    if (won && level.id < LEVELS.length && level.id >= unlocked) {
      setUnlocked(level.id + 1);
    }
  }, [won, level.id, unlocked]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const W = (canvas.width = 960);
    const H = (canvas.height = 540);

    const keys: Record<string, boolean> = {};
    const kd = (e: KeyboardEvent) => {
      keys[e.code] = true;
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") e.preventDefault();
    };
    const ku = (e: KeyboardEvent) => (keys[e.code] = false);
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);

    let player = { x: 120, y: 200, w: 28, h: 40, vx: 0, vy: 0, onGround: false, onWall: 0 as -1 | 0 | 1, jumps: 2 };
    let cameraX = 0;
    let platforms: Platform[] = [];
    let lastX = 0;
    let scoreLocal = 0;
    let alive = true;
    let finished = false;

    function seedWorld() {
      platforms = [{ x: 0, y: 460, w: 600, h: 80, kind: "ground" }];
      lastX = 600;
      for (let i = 0; i < 10; i++) genChunk();
    }
    function genChunk() {
      const L = levelRef.current;
      const gap = L.gapMin + Math.random() * (L.gapMax - L.gapMin);
      const y = 260 + Math.random() * 200;
      const w = 120 + Math.random() * 180;
      platforms.push({ x: lastX + gap, y, w, h: 20, kind: "ground" });
      if (Math.random() < L.wallChance) {
        const wx = lastX + gap + w + 40 + Math.random() * 80;
        const wh = 120 + Math.random() * 100;
        platforms.push({ x: wx, y: y - wh - 20, w: 22, h: wh, kind: "wall" });
      }
      lastX = lastX + gap + w;
    }
    function reset() {
      player = { x: 120, y: 200, w: 28, h: 40, vx: 0, vy: 0, onGround: false, onWall: 0, jumps: 2 };
      cameraX = 0; scoreLocal = 0; alive = true; finished = false;
      setDead(false); setWon(false); setScore(0);
      seedWorld();
    }
    restartRef.current = reset;
    seedWorld();

    let jumpHeld = false;
    function update() {
      if (!alive || finished) return;
      const L = levelRef.current;
      const accel = 1.2;
      const max = L.speed;
      if (keys["ArrowLeft"] || keys["KeyA"]) player.vx = Math.max(player.vx - accel, -max);
      else if (keys["ArrowRight"] || keys["KeyD"]) player.vx = Math.min(player.vx + accel, max);
      else player.vx = player.onGround ? 0 : player.vx * 0.9;

      const jumpPressed = keys["Space"] || keys["ArrowUp"] || keys["KeyW"];
      if (jumpPressed && !jumpHeld) {
        if (player.onWall !== 0) { player.vy = -11; player.vx = -player.onWall * 7; player.jumps = 1; }
        else if (player.jumps > 0) { player.vy = -11; player.jumps--; }
      }
      jumpHeld = jumpPressed;

      player.vy += player.onWall !== 0 && player.vy > 0 ? 0.25 : L.gravity;
      if (player.onWall !== 0 && player.vy > 3) player.vy = 3;

      player.x += player.vx;
      player.onWall = 0;
      for (const p of platforms) {
        if (rectHit(player, p)) {
          if (player.vx > 0) { player.x = p.x - player.w; if (p.kind === "wall") player.onWall = 1; }
          else if (player.vx < 0) { player.x = p.x + p.w; if (p.kind === "wall") player.onWall = -1; }
          player.vx = 0;
        }
      }
      player.y += player.vy;
      player.onGround = false;
      for (const p of platforms) {
        if (rectHit(player, p)) {
          if (player.vy > 0) { player.y = p.y - player.h; player.vy = 0; player.onGround = true; player.jumps = 2; }
          else if (player.vy < 0) { player.y = p.y + p.h; player.vy = 0; }
        }
      }
      cameraX = player.x - 240;
      scoreLocal = Math.max(scoreLocal, Math.floor(player.x / 10));
      while (lastX < cameraX + W + 400) genChunk();
      platforms = platforms.filter((p) => p.x + p.w > cameraX - 200);

      if (L.target < 9999 && scoreLocal >= L.target) {
        finished = true;
        setScore(scoreLocal);
        setWon(true);
        setBest((b) => Math.max(b, scoreLocal));
      }
      if (player.y > H + 200) {
        alive = false;
        setDead(true);
        setScore(scoreLocal);
        setBest((b) => Math.max(b, scoreLocal));
      }
    }
    function rectHit(a: { x: number; y: number; w: number; h: number }, b: Platform) {
      return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    }
    function draw() {
      const L = levelRef.current;
      const S = skinRef.current;
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, L.bgTop); g.addColorStop(1, L.bgBot);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

      drawBackdrop(ctx, L.theme, cameraX, W, H);

      if (L.theme === "warmup" || L.theme === "void") {
        ctx.strokeStyle = "rgba(255,255,255,0.06)"; ctx.lineWidth = 1;
        const off = (cameraX * 0.3) % 60;
        for (let x = -off; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      }


      ctx.save();
      ctx.translate(-cameraX, 0);

      // finish line marker
      if (L.target < 9999) {
        const fx = L.target * 10;
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.fillRect(fx, 0, 3, H);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 14px monospace";
        ctx.fillText("FINISH", fx + 8, 22);
      }

      for (const p of platforms) {
        ctx.fillStyle = p.kind === "wall" ? L.wall : L.ground;
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.fillStyle = "rgba(255,255,255,0.18)";
        ctx.fillRect(p.x, p.y, p.w, 1);
      }
      ctx.fillStyle = S.body;
      ctx.fillRect(player.x, player.y, player.w, player.h);
      ctx.strokeStyle = S.stroke; ctx.lineWidth = 1;
      ctx.strokeRect(player.x + 0.5, player.y + 0.5, player.w - 1, player.h - 1);
      ctx.restore();

      // progress bar
      if (L.target < 9999) {
        const pct = Math.min(1, scoreLocal / L.target);
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.fillRect(20, H - 20, W - 40, 6);
        ctx.fillStyle = L.ground;
        ctx.fillRect(20, H - 20, (W - 40) * pct, 6);
      }
    }
    let raf = 0;
    function loop() { update(); draw(); raf = requestAnimationFrame(loop); }
    loop();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
    };
  }, [levelId]); // restart loop when changing level

  function pickLevel(id: number) {
    if (id > unlocked) return;
    setLevelId(id);
    setDead(false); setWon(false); setScore(0);
    lastSubmittedRef.current = -1;
  }
  function nextLevel() {
    const next = Math.min(LEVELS.length, level.id + 1);
    pickLevel(next);
  }

  return (
    <main className="min-h-screen flex flex-col items-center gap-4 p-4 transition-colors duration-500" style={{ background: `radial-gradient(circle at 50% 0%, ${level.bgTop} 0%, ${level.bgBot} 60%, #05010f 100%)` }}>
      <nav className="w-full max-w-5xl flex items-center justify-between text-sm font-bold tracking-wider">
        <Link to="/" style={{ color: "#e6e6e6" }}>NEON PARKOUR</Link>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowRules(true)} className="px-3 py-1 text-xs tracking-wider uppercase border transition-colors hover:bg-[#e6e6e6] hover:text-[#1a2129]" style={{ borderColor: "#6b6b6b", color: "#6b6b6b" }}>ПРАВИЛА</button>
          {userId ? (
            <>
              <span style={{ color: "#e6e6e6" }}>{profile?.username ?? "..."}</span>
              <button onClick={async () => { await supabase.auth.signOut(); }} className="px-3 py-1 text-xs tracking-wider uppercase border transition-colors hover:bg-[#e22718] hover:text-white" style={{ borderColor: "#e22718", color: "#e22718" }}>ВЫЙТИ</button>
            </>
          ) : (
            <Link to="/auth" className="px-3 py-1 text-xs font-bold tracking-wider uppercase border transition-colors hover:bg-[#1c69d4] hover:text-white" style={{ borderColor: "#1c69d4", color: "#1c69d4" }}>ВОЙТИ / РЕГИСТРАЦИЯ</Link>
          )}
        </div>
      </nav>

      {showRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(5,1,15,0.85)" }} onClick={() => setShowRules(false)}>
          <div className="max-w-lg w-full p-6 font-mono" style={{ background: "#1a2129", border: "1px solid #1c69d4" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-black" style={{ color: "#ffffff" }}>ПРАВИЛА ИГРЫ</h2>
              <button onClick={() => setShowRules(false)} className="text-xl px-2" style={{ color: "#6b6b6b" }} aria-label="Закрыть">✕</button>
            </div>
            <div className="flex flex-col gap-3 text-sm" style={{ color: "#6b6b6b" }}>
              <div><div style={{ color: "#1c69d4" }} className="font-bold mb-1">🎮 УПРАВЛЕНИЕ</div><p>A / D — бег · Space / W / ↑ — двойной прыжок · у стены — wall-jump</p></div>
              <div><div style={{ color: "#1c69d4" }} className="font-bold mb-1">🏁 УРОВНИ</div><p>Доберись до финиша, чтобы открыть следующую трассу. Последняя — бесконечная.</p></div>
              <div><div style={{ color: "#1c69d4" }} className="font-bold mb-1">🎨 СКИНЫ</div><p>Выбери цвет персонажа справа. Скин сохраняется автоматически.</p></div>
              <div><div style={{ color: "#1c69d4" }} className="font-bold mb-1">🏆 ОЧКИ</div><p>Считаются по пройденной дистанции. Войди в аккаунт — рекорд попадёт в ТОП-10.</p></div>
            </div>
            <button onClick={() => setShowRules(false)} className="mt-5 w-full py-3 font-bold text-sm tracking-wider uppercase" style={{ background: "#1c69d4", color: "#ffffff" }}>ПОНЯТНО, БЕЖИМ</button>
          </div>
        </div>
      )}

      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter" style={{ color: "#ffffff" }}>NEON PARKOUR</h1>
        <p className="text-sm md:text-base mt-1" style={{ color: "#6b6b6b" }}>{level.name} · ЦЕЛЬ: {level.target < 9999 ? level.target : "∞"}</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-4 items-start justify-center w-full max-w-6xl">
        {/* Left: levels */}
        <aside className="w-full lg:w-56 p-4 font-mono" style={{ background: "rgba(26,33,41,0.7)", border: "1px solid #1c69d4" }}>
          <h2 className="text-sm font-black mb-3 tracking-wider" style={{ color: "#1c69d4" }}>УРОВНИ</h2>
          <div className="flex flex-col gap-2">
            {LEVELS.map((l) => {
              const isLocked = l.id > unlocked;
              const active = l.id === levelId;
              return (
                <button
                  key={l.id}
                  onClick={() => pickLevel(l.id)}
                  disabled={isLocked}
                  className="text-left px-3 py-2 text-xs tracking-wider border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: active ? l.ground : "transparent",
                    color: active ? "#ffffff" : isLocked ? "#6b6b6b" : "#e6e6e6",
                    borderColor: active ? l.ground : "#3a4250",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span>{String(l.id).padStart(2, "0")} {isLocked && "🔒"}</span>
                    <span style={{ color: active ? "#ffffff" : l.ground }}>{l.target < 9999 ? l.target : "∞"}</span>
                  </div>
                  <div className="text-[10px] opacity-70 mt-0.5 truncate">{l.name.replace(/^ТРАССА \d+ · /, "")}</div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Canvas */}
        <div className="relative overflow-hidden flex-shrink-0" style={{ border: `1px solid ${level.ground}` }}>
          <canvas ref={canvasRef} className="block max-w-full h-auto" />
          <div className="absolute top-3 left-4 font-mono text-lg" style={{ color: level.ground }}>SCORE {score}</div>
          <div className="absolute top-3 right-4 font-mono text-lg" style={{ color: level.wall }}>BEST {best}</div>
          {(dead || won) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4" style={{ background: "rgba(5,1,15,0.85)" }}>
              <div className="text-5xl font-black" style={{ color: won ? level.ground : level.wall }}>
                {won ? "FINISH!" : "YOU FELL"}
              </div>
              <div className="text-xl font-mono" style={{ color: "#ffffff" }}>Score: {score}</div>
              {won && level.id < LEVELS.length && (
                <div className="text-xs font-mono" style={{ color: level.ground }}>Открыт уровень {level.id + 1}!</div>
              )}
              {!userId && (
                <Link to="/auth" className="text-xs underline" style={{ color: "#1c69d4" }}>Войди, чтобы сохранить рекорд</Link>
              )}
              {userId && submitting && (
                <div className="text-xs font-mono" style={{ color: "#1c69d4" }}>сохраняем...</div>
              )}
              <div className="flex gap-3">
                <button onClick={() => restartRef.current()} className="px-6 py-3 font-bold text-sm tracking-wider uppercase transition-opacity hover:opacity-80" style={{ background: level.ground, color: "#ffffff" }}>
                  {won ? "ПОВТОР" : "RUN AGAIN"}
                </button>
                {won && level.id < LEVELS.length && (
                  <button onClick={nextLevel} className="px-6 py-3 font-bold text-sm tracking-wider uppercase transition-opacity hover:opacity-80" style={{ background: level.wall, color: "#ffffff" }}>
                    ДАЛЬШЕ →
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: skins + leaderboard */}
        <div className="w-full lg:w-64 flex flex-col gap-4">
          <aside className="p-4 font-mono" style={{ background: "rgba(26,33,41,0.7)", border: "1px solid #1c69d4" }}>
            <h2 className="text-sm font-black mb-3 tracking-wider" style={{ color: "#1c69d4" }}>СКИНЫ</h2>
            <div className="grid grid-cols-4 gap-2">
              {SKINS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSkinId(s.id)}
                  title={s.name}
                  className="aspect-square border-2 transition-transform hover:scale-105"
                  style={{
                    background: s.body,
                    borderColor: skinId === s.id ? "#ffffff" : s.stroke,
                    outline: skinId === s.id ? "2px solid #1c69d4" : "none",
                    outlineOffset: "2px",
                  }}
                />
              ))}
            </div>
            <div className="mt-2 text-[10px] tracking-wider" style={{ color: "#6b6b6b" }}>ВЫБРАН: <span style={{ color: skin.body }}>{skin.name}</span></div>
          </aside>

          <aside className="p-4 font-mono" style={{ background: "rgba(26,33,41,0.7)", border: "1px solid #1c69d4" }}>
            <h2 className="text-sm font-black mb-3 tracking-wider" style={{ color: "#1c69d4" }}>ТОП-10</h2>
            {leaders.length === 0 ? (
              <p className="text-xs" style={{ color: "#6b6b6b" }}>Пока пусто.</p>
            ) : (
              <ol className="flex flex-col gap-1.5 text-xs">
                {leaders.map((l, i) => (
                  <li key={i} className="flex items-center justify-between gap-2">
                    <span style={{ color: i === 0 ? "#ffffff" : "#6b6b6b" }}>{String(i + 1).padStart(2, "0")}. {l.username}</span>
                    <span style={{ color: "#e22718" }}>{l.best_score}</span>
                  </li>
                ))}
              </ol>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
