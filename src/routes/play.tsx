import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
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

type Platform = { x: number; y: number; w: number; h: number; kind: "ground" | "wall" };

function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [dead, setDead] = useState(false);
  const restartRef = useRef<() => void>(() => {});
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [leaders, setLeaders] = useState<LeaderRow[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const lastSubmittedRef = useRef<number>(-1);

  async function loadLeaders() {
    const { data } = await supabase
      .from("profiles")
      .select("username,best_score")
      .order("best_score", { ascending: false })
      .limit(10);
    if (data) setLeaders(data);
  }

  async function loadProfile(uid: string) {
    const { data } = await supabase
      .from("profiles")
      .select("username,best_score")
      .eq("user_id", uid)
      .maybeSingle();
    if (data) {
      setProfile(data);
      setBest(data.best_score);
    }
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
      if (uid) loadProfile(uid);
      else setProfile(null);
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
        await supabase
          .from("profiles")
          .update({ best_score: finalScore })
          .eq("user_id", userId);
        setProfile({ ...profile, best_score: finalScore });
      }
      await loadLeaders();
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (dead && score > 0) submitScore(score);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dead, score]);

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

    let player = {
      x: 120,
      y: 200,
      w: 28,
      h: 40,
      vx: 0,
      vy: 0,
      onGround: false,
      onWall: 0 as -1 | 0 | 1,
      jumps: 2,
    };

    let cameraX = 0;
    let platforms: Platform[] = [];
    let lastX = 0;
    let scoreLocal = 0;
    let alive = true;

    function seedWorld() {
      platforms = [{ x: 0, y: 460, w: 600, h: 80, kind: "ground" }];
      lastX = 600;
      for (let i = 0; i < 10; i++) genChunk();
    }

    function genChunk() {
      const gap = 80 + Math.random() * 140;
      const y = 260 + Math.random() * 200;
      const w = 120 + Math.random() * 180;
      platforms.push({ x: lastX + gap, y, w, h: 20, kind: "ground" });
      if (Math.random() < 0.45) {
        const wx = lastX + gap + w + 40 + Math.random() * 80;
        const wh = 120 + Math.random() * 100;
        platforms.push({ x: wx, y: y - wh - 20, w: 22, h: wh, kind: "wall" });
      }
      lastX = lastX + gap + w;
    }

    function reset() {
      player = { x: 120, y: 200, w: 28, h: 40, vx: 0, vy: 0, onGround: false, onWall: 0, jumps: 2 };
      cameraX = 0;
      scoreLocal = 0;
      alive = true;
      setDead(false);
      setScore(0);
      seedWorld();
    }
    restartRef.current = reset;
    seedWorld();

    let jumpHeld = false;

    function update() {
      if (!alive) return;
      const accel = 0.6;
      const max = 6.5;
      if (keys["ArrowLeft"] || keys["KeyA"]) player.vx = Math.max(player.vx - accel, -max);
      else if (keys["ArrowRight"] || keys["KeyD"]) player.vx = Math.min(player.vx + accel, max);
      else player.vx *= 0.82;

      player.vx += 0.08;
      if (player.vx > max) player.vx = max;

      const jumpPressed = keys["Space"] || keys["ArrowUp"] || keys["KeyW"];
      if (jumpPressed && !jumpHeld) {
        if (player.onWall !== 0) {
          player.vy = -11;
          player.vx = -player.onWall * 7;
          player.jumps = 1;
        } else if (player.jumps > 0) {
          player.vy = -11;
          player.jumps--;
        }
      }
      jumpHeld = jumpPressed;

      player.vy += player.onWall !== 0 && player.vy > 0 ? 0.25 : 0.55;
      if (player.onWall !== 0 && player.vy > 3) player.vy = 3;

      player.x += player.vx;
      player.onWall = 0;
      for (const p of platforms) {
        if (rectHit(player, p)) {
          if (player.vx > 0) {
            player.x = p.x - player.w;
            if (p.kind === "wall") player.onWall = 1;
          } else if (player.vx < 0) {
            player.x = p.x + p.w;
            if (p.kind === "wall") player.onWall = -1;
          }
          player.vx = 0;
        }
      }

      player.y += player.vy;
      player.onGround = false;
      for (const p of platforms) {
        if (rectHit(player, p)) {
          if (player.vy > 0) {
            player.y = p.y - player.h;
            player.vy = 0;
            player.onGround = true;
            player.jumps = 2;
          } else if (player.vy < 0) {
            player.y = p.y + p.h;
            player.vy = 0;
          }
        }
      }

      cameraX = player.x - 240;
      scoreLocal = Math.max(scoreLocal, Math.floor(player.x / 10));

      while (lastX < cameraX + W + 400) genChunk();
      platforms = platforms.filter((p) => p.x + p.w > cameraX - 200);

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
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#1a2129");
      g.addColorStop(1, "#262e38");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = "rgba(230,230,230,0.06)";
      ctx.lineWidth = 1;
      const off = (cameraX * 0.3) % 60;
      for (let x = -off; x < W; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y < H; y += 60) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      ctx.save();
      ctx.translate(-cameraX, 0);

      for (const p of platforms) {
        const color = p.kind === "wall" ? "#e22718" : "#1c69d4";
        ctx.fillStyle = color;
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.fillStyle = "rgba(255,255,255,0.18)";
        ctx.fillRect(p.x, p.y, p.w, 1);
      }

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(player.x, player.y, player.w, player.h);
      ctx.strokeStyle = "#262626";
      ctx.lineWidth = 1;
      ctx.strokeRect(player.x + 0.5, player.y + 0.5, player.w - 1, player.h - 1);

      ctx.restore();
    }

    let raf = 0;
    function loop() {
      update();
      draw();
      raf = requestAnimationFrame(loop);
    }
    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
    };
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center gap-4 p-4" style={{ background: "radial-gradient(circle at 50% 0%, #1a2129 0%, #05010f 70%)" }}>
      <nav className="w-full max-w-5xl flex items-center justify-between text-sm font-bold tracking-wider">
        <Link to="/" style={{ color: "#e6e6e6" }}>
          NEON PARKOUR
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowRules(true)}
            className="px-3 py-1 text-xs tracking-wider uppercase border transition-colors hover:bg-[#e6e6e6] hover:text-[#1a2129]"
            style={{ borderColor: "#6b6b6b", color: "#6b6b6b" }}
          >
            ПРАВИЛА
          </button>
          {userId ? (
            <>
              <span style={{ color: "#e6e6e6" }}>{profile?.username ?? "..."}</span>
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                }}
                className="px-3 py-1 text-xs tracking-wider uppercase border transition-colors hover:bg-[#e22718] hover:text-white"
                style={{ borderColor: "#e22718", color: "#e22718" }}
              >
                ВЫЙТИ
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="px-3 py-1 text-xs font-bold tracking-wider uppercase border transition-colors hover:bg-[#1c69d4] hover:text-white"
              style={{ borderColor: "#1c69d4", color: "#1c69d4" }}
            >
              ВОЙТИ / РЕГИСТРАЦИЯ
            </Link>
          )}
        </div>
      </nav>

      {showRules && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(5,1,15,0.85)" }}
          onClick={() => setShowRules(false)}
        >
          <div
            className="max-w-lg w-full p-6 font-mono"
            style={{ background: "#1a2129", border: "1px solid #1c69d4" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-black" style={{ color: "#ffffff" }}>
                ПРАВИЛА ИГРЫ
              </h2>
              <button
                onClick={() => setShowRules(false)}
                className="text-xl px-2"
                style={{ color: "#6b6b6b" }}
                aria-label="Закрыть"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-col gap-3 text-sm" style={{ color: "#6b6b6b" }}>
              <div>
                <div style={{ color: "#1c69d4" }} className="font-bold mb-1">🎮 УПРАВЛЕНИЕ</div>
                <p>A / D или ← / → — бег</p>
                <p>Space / W / ↑ — прыжок (двойной в воздухе)</p>
                <p>У стены — wall-jump (отталкивание)</p>
              </div>
              <div>
                <div style={{ color: "#1c69d4" }} className="font-bold mb-1">⚙️ МЕХАНИКА</div>
                <p>Персонажа автоматически тянет вперёд</p>
                <p>Платформы генерируются бесконечно</p>
                <p>Упал вниз — конец забега</p>
              </div>
              <div>
                <div style={{ color: "#1c69d4" }} className="font-bold mb-1">🏆 ОЧКИ</div>
                <p>Считаются по пройденной дистанции</p>
                <p>Войди в аккаунт — рекорд попадёт в ТОП-10</p>
              </div>
              <div>
                <div style={{ color: "#1c69d4" }} className="font-bold mb-1">🎨 ЦВЕТА</div>
                <p><span style={{ color: "#ffffff" }}>● Белый</span> — игрок</p>
                <p><span style={{ color: "#1c69d4" }}>● Синий</span> — платформы</p>
                <p><span style={{ color: "#e22718" }}>● Красный</span> — стены (wall-jump)</p>
              </div>
            </div>
            <button
              onClick={() => setShowRules(false)}
              className="mt-5 w-full py-3 font-bold text-sm tracking-wider uppercase"
              style={{ background: "#1c69d4", color: "#ffffff" }}
            >
              ПОНЯТНО, БЕЖИМ
            </button>
          </div>
        </div>
      )}

      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter" style={{ color: "#ffffff" }}>
          NEON PARKOUR
        </h1>
        <p className="text-sm md:text-base mt-1" style={{ color: "#6b6b6b" }}>
          A / D — бег · Space — двойной прыжок · у стены — wall-jump
        </p>
      </header>

      <div className="flex flex-col lg:flex-row gap-4 items-start justify-center w-full max-w-5xl">
        <div className="relative overflow-hidden flex-shrink-0" style={{ border: "1px solid #1c69d4" }}>
          <canvas ref={canvasRef} className="block max-w-full h-auto" />
          <div className="absolute top-3 left-4 font-mono text-lg" style={{ color: "#1c69d4" }}>
            SCORE {score}
          </div>
          <div className="absolute top-3 right-4 font-mono text-lg" style={{ color: "#e22718" }}>
            BEST {best}
          </div>
          {dead && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4" style={{ background: "rgba(5,1,15,0.8)" }}>
              <div className="text-5xl font-black" style={{ color: "#e22718" }}>
                YOU FELL
              </div>
              <div className="text-xl font-mono" style={{ color: "#ffffff" }}>Score: {score}</div>
              {!userId && (
                <Link to="/auth" className="text-xs underline" style={{ color: "#1c69d4" }}>
                  Войди, чтобы сохранить рекорд
                </Link>
              )}
              {userId && submitting && (
                <div className="text-xs font-mono" style={{ color: "#1c69d4" }}>сохраняем...</div>
              )}
              <button
                onClick={() => restartRef.current()}
                className="px-6 py-3 font-bold text-sm tracking-wider uppercase transition-opacity hover:opacity-80"
                style={{ background: "#1c69d4", color: "#ffffff" }}
              >
                RUN AGAIN
              </button>
            </div>
          )}
        </div>

        <aside
          className="w-full lg:w-72 p-4 font-mono"
          style={{ background: "rgba(26,33,41,0.7)", border: "1px solid #1c69d4" }}
        >
          <h2 className="text-lg font-black mb-3" style={{ color: "#1c69d4" }}>
            ТОП-10
          </h2>
          {leaders.length === 0 ? (
            <p className="text-xs" style={{ color: "#6b6b6b" }}>Пока пусто. Стань первым!</p>
          ) : (
            <ol className="flex flex-col gap-2 text-sm">
              {leaders.map((l, i) => (
                <li key={i} className="flex items-center justify-between gap-2">
                  <span style={{ color: i === 0 ? "#ffffff" : "#6b6b6b" }}>
                    {String(i + 1).padStart(2, "0")}. {l.username}
                  </span>
                  <span style={{ color: "#e22718" }}>{l.best_score}</span>
                </li>
              ))}
            </ol>
          )}
        </aside>
      </div>
    </main>
  );
}
