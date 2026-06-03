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


type Shape = "square" | "circle" | "triangle" | "diamond" | "hexagon" | "star" | "pill" | "cross" | "ring" | "heart" | "quad";
type Skin = { id: string; name: string; body: string; stroke: string; shape: Shape };
const SKINS: Skin[] = [
  { id: "white",   name: "КУБ",       body: "#ffffff", stroke: "#262626", shape: "square" },
  { id: "blue",    name: "КРУГ",      body: "#1c69d4", stroke: "#0653b6", shape: "circle" },
  { id: "red",     name: "ТРЕУГОЛ.",  body: "#e22718", stroke: "#7f1d1d", shape: "triangle" },
  { id: "neon",    name: "РОМБ",      body: "#22e6ff", stroke: "#0e7490", shape: "diamond" },
  { id: "gold",    name: "ГЕКСАГОН",  body: "#fbbf24", stroke: "#78350f", shape: "hexagon" },
  { id: "ghost",   name: "ЗВЕЗДА",    body: "#94a3b8", stroke: "#ffffff", shape: "star" },
  { id: "magenta", name: "ПИЛЮЛЯ",    body: "#ec4899", stroke: "#831843", shape: "pill" },
  { id: "lime",    name: "КРЕСТ",     body: "#a3e635", stroke: "#365314", shape: "cross" },
  { id: "violet",  name: "КОЛЬЦО",    body: "#a855f7", stroke: "#3b0764", shape: "ring" },
  { id: "rose",    name: "СЕРДЦЕ",    body: "#fb7185", stroke: "#881337", shape: "heart" },
  { id: "quad",    name: "4-В-1",     body: "#f59e0b", stroke: "#1f2937", shape: "quad" },
];


function drawShape(ctx: CanvasRenderingContext2D, shape: Shape, x: number, y: number, w: number, h: number, body: string, stroke: string) {
  ctx.fillStyle = body;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.5;
  const cx = x + w / 2, cy = y + h / 2;
  switch (shape) {
    case "square":
      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
      break;
    case "circle":
      ctx.beginPath(); ctx.ellipse(cx, cy, w / 2, h / 2, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      break;
    case "triangle":
      ctx.beginPath(); ctx.moveTo(cx, y); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.closePath(); ctx.fill(); ctx.stroke();
      break;
    case "diamond":
      ctx.beginPath(); ctx.moveTo(cx, y); ctx.lineTo(x + w, cy); ctx.lineTo(cx, y + h); ctx.lineTo(x, cy); ctx.closePath(); ctx.fill(); ctx.stroke();
      break;
    case "hexagon": {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 2;
        const px = cx + Math.cos(a) * (w / 2);
        const py = cy + Math.sin(a) * (h / 2);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      break;
    }
    case "star": {
      ctx.beginPath();
      const outer = w / 2, inner = w / 4;
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? outer : inner;
        const a = (Math.PI / 5) * i - Math.PI / 2;
        const px = cx + Math.cos(a) * r;
        const py = cy + Math.sin(a) * (r * (h / w));
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      break;
    }
    case "pill": {
      const r = w / 2;
      ctx.beginPath();
      ctx.moveTo(x, y + r);
      ctx.arc(cx, y + r, r, Math.PI, 0);
      ctx.lineTo(x + w, y + h - r);
      ctx.arc(cx, y + h - r, r, 0, Math.PI);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      break;
    }
    case "cross": {
      const t = w / 3;
      ctx.beginPath();
      ctx.moveTo(cx - t / 2, y);
      ctx.lineTo(cx + t / 2, y);
      ctx.lineTo(cx + t / 2, cy - t / 2);
      ctx.lineTo(x + w, cy - t / 2);
      ctx.lineTo(x + w, cy + t / 2);
      ctx.lineTo(cx + t / 2, cy + t / 2);
      ctx.lineTo(cx + t / 2, y + h);
      ctx.lineTo(cx - t / 2, y + h);
      ctx.lineTo(cx - t / 2, cy + t / 2);
      ctx.lineTo(x, cy + t / 2);
      ctx.lineTo(x, cy - t / 2);
      ctx.lineTo(cx - t / 2, cy - t / 2);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      break;
    }
    case "ring":
      ctx.beginPath(); ctx.ellipse(cx, cy, w / 2, h / 2, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath(); ctx.ellipse(cx, cy, w / 4, h / 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      break;
    case "heart": {
      ctx.beginPath();
      const topY = y + h * 0.3;
      ctx.moveTo(cx, y + h);
      ctx.bezierCurveTo(x - w * 0.1, cy, x + w * 0.15, y, cx, topY);
      ctx.bezierCurveTo(x + w * 0.85, y, x + w * 1.1, cy, cx, y + h);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      break;
    }
  }
}

function ShapeSwatch({ shape, body, stroke }: { shape: Shape; body: string; stroke: string }) {
  // Render via canvas API on mount to reuse drawShape exactly
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    drawShape(ctx, shape, 6, 6, 28, 28, body, stroke);
  }, [shape, body, stroke]);
  return <canvas ref={ref} width={40} height={40} className="w-full h-full" />;
}



// Hash-based pseudo-random for stable parallax scenery
function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function drawBackdrop(ctx: CanvasRenderingContext2D, theme: Theme, cam: number, W: number, H: number) {
  const horizon = H - 80;

  if (theme === "city") {
    const farOff = cam * 0.15;
    ctx.fillStyle = "rgba(20,40,70,0.7)";
    for (let i = -2; i < 40; i++) {
      const sx = i * 90 - (farOff % 90);
      const h = 80 + rand(i + 1) * 140;
      ctx.fillRect(sx, horizon - h, 70, h);
      ctx.fillStyle = "rgba(180,210,255,0.18)";
      for (let wy = horizon - h + 8; wy < horizon - 8; wy += 14) {
        for (let wx = sx + 6; wx < sx + 64; wx += 12) {
          if (rand(i * 50 + wy + wx) > 0.5) ctx.fillRect(wx, wy, 4, 6);
        }
      }
      ctx.fillStyle = "rgba(20,40,70,0.7)";
    }
    const nearOff = cam * 0.4;
    ctx.fillStyle = "rgba(10,20,40,0.85)";
    for (let i = -2; i < 30; i++) {
      const sx = i * 140 - (nearOff % 140);
      const h = 140 + rand(i + 99) * 180;
      ctx.fillRect(sx, horizon - h, 110, h);
    }
  } else if (theme === "desert") {
    const off1 = cam * 0.2;
    ctx.fillStyle = "rgba(140,80,30,0.5)";
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 20) {
      const wx = x + off1;
      const y = horizon - 30 - Math.sin(wx * 0.01) * 40 - Math.sin(wx * 0.004) * 60;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
    const off2 = cam * 0.4;
    ctx.fillStyle = "rgba(90,45,15,0.7)";
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 20) {
      const wx = x + off2;
      const y = horizon + 10 - Math.sin(wx * 0.012 + 1) * 35;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "rgba(255,180,90,0.5)";
    ctx.beginPath(); ctx.arc(W * 0.78, 110, 60, 0, Math.PI * 2); ctx.fill();
  } else if (theme === "jungle") {
    const off1 = cam * 0.2;
    ctx.fillStyle = "rgba(10,40,20,0.7)";
    for (let i = -2; i < 40; i++) {
      const sx = i * 70 - (off1 % 70);
      const r = 40 + rand(i + 3) * 30;
      ctx.beginPath(); ctx.arc(sx, horizon - r * 0.4, r, 0, Math.PI * 2); ctx.fill();
    }
    const off2 = cam * 0.45;
    ctx.fillStyle = "rgba(5,25,12,0.9)";
    for (let i = -2; i < 30; i++) {
      const sx = i * 100 - (off2 % 100);
      const r = 60 + rand(i + 77) * 40;
      ctx.beginPath(); ctx.arc(sx, horizon - r * 0.3 + 20, r, 0, Math.PI * 2); ctx.fill();
    }
  } else if (theme === "neon") {
    const off = cam * 0.2;
    ctx.strokeStyle = "rgba(236,72,153,0.35)"; ctx.lineWidth = 1;
    for (let i = 0; i < 14; i++) {
      const y = horizon + i * i * 1.6;
      if (y > H) break;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    for (let i = -10; i <= 10; i++) {
      ctx.beginPath();
      const vx = W / 2 + i * 30;
      ctx.moveTo(vx - (off % 30), horizon);
      ctx.lineTo(W / 2 + i * 200, H);
      ctx.stroke();
    }
    const tOff = cam * 0.3;
    for (let i = -2; i < 30; i++) {
      const sx = i * 120 - (tOff % 120);
      const h = 100 + rand(i + 5) * 160;
      ctx.fillStyle = "rgba(168,85,247,0.5)";
      ctx.fillRect(sx, horizon - h, 50, h);
      ctx.fillStyle = "rgba(34,230,255,0.6)";
      ctx.fillRect(sx + 22, horizon - h - 12, 6, 12);
    }
  } else if (theme === "arctic") {
    const off1 = cam * 0.15;
    ctx.fillStyle = "rgba(200,220,240,0.4)";
    for (let i = -2; i < 30; i++) {
      const sx = i * 200 - (off1 % 200);
      ctx.beginPath();
      ctx.moveTo(sx, horizon);
      ctx.lineTo(sx + 100, horizon - 160 - rand(i + 9) * 40);
      ctx.lineTo(sx + 200, horizon);
      ctx.closePath(); ctx.fill();
    }
    const off2 = cam * 0.35;
    ctx.fillStyle = "rgba(150,180,210,0.6)";
    for (let i = -2; i < 30; i++) {
      const sx = i * 140 - (off2 % 140);
      ctx.beginPath();
      ctx.moveTo(sx, horizon);
      ctx.lineTo(sx + 70, horizon - 110 - rand(i + 22) * 30);
      ctx.lineTo(sx + 140, horizon);
      ctx.closePath(); ctx.fill();
    }
    for (let i = 0; i < 60; i++) {
      const sx = ((i * 73 - cam * 0.6) % W + W) % W;
      const sy = (i * 37) % H;
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.fillRect(sx, sy, 2, 2);
    }
  } else if (theme === "volcano") {
    const off1 = cam * 0.18;
    for (let i = -2; i < 30; i++) {
      const sx = i * 180 - (off1 % 180);
      const peak = horizon - 180 - rand(i + 11) * 50;
      ctx.fillStyle = "rgba(60,10,5,0.85)";
      ctx.beginPath();
      ctx.moveTo(sx, horizon);
      ctx.lineTo(sx + 90, peak);
      ctx.lineTo(sx + 180, horizon);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = "rgba(249,115,22,0.7)";
      ctx.fillRect(sx + 85, peak + 30, 10, 60);
    }
    for (let i = 0; i < 40; i++) {
      const sx = ((i * 91 - cam * 0.5) % W + W) % W;
      const sy = (i * 53) % H;
      ctx.fillStyle = `rgba(255,${100 + (i % 80)},20,0.7)`;
      ctx.fillRect(sx, sy, 2, 2);
    }
  } else if (theme === "warmup") {
    const off = cam * 0.2;
    ctx.fillStyle = "rgba(28,105,212,0.18)";
    for (let i = -2; i < 30; i++) {
      const sx = i * 110 - (off % 110);
      const h = 90 + rand(i + 13) * 120;
      ctx.fillRect(sx, horizon - h, 90, h);
    }
  } else if (theme === "void") {
    for (let i = 0; i < 120; i++) {
      const sx = ((i * 137 - cam * 0.3) % W + W) % W;
      const sy = (i * 71) % H;
      const a = 0.3 + rand(i) * 0.7;
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.fillRect(sx, sy, rand(i + 1) > 0.85 ? 2 : 1, 1);
    }
  }
}

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
      drawShape(ctx, S.shape, player.x, player.y, player.w, player.h, S.body, S.stroke);

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
            <div className="grid grid-cols-5 gap-2">
              {SKINS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSkinId(s.id)}
                  title={s.name}
                  className="aspect-square flex items-center justify-center border-2 transition-transform hover:scale-105"
                  style={{
                    background: "rgba(0,0,0,0.3)",
                    borderColor: skinId === s.id ? "#ffffff" : "#3a4250",
                    outline: skinId === s.id ? "2px solid #1c69d4" : "none",
                    outlineOffset: "2px",
                  }}
                >
                  <ShapeSwatch shape={s.shape} body={s.body} stroke={s.stroke} />
                </button>
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
