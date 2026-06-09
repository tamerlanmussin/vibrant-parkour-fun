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

type Theme = "warmup" | "city" | "desert" | "jungle" | "neon" | "arctic" | "volcano" | "void" | "cyber" | "space" | "swamp" | "candy" | "graveyard" | "underwater" | "sunset" | "factory" | "crystal" | "abyss" | "aurora" | "omega";

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
  { id: 1, name: "ТРАССА 01 · РАЗМИНКА", target: 200, gapMin: 80, gapMax: 180, wallChance: 0.25, gravity: 0.40, speed: 4.5, bgTop: "#1a2129", bgBot: "#262e38", ground: "#1c69d4", wall: "#e22718", theme: "warmup" },
  { id: 2, name: "ТРАССА 02 · ГОРОД", target: 400, gapMin: 100, gapMax: 200, wallChance: 0.40, gravity: 0.42, speed: 5.0, bgTop: "#0c1a2a", bgBot: "#1a3045", ground: "#00b3d4", wall: "#ff5a1f", theme: "city" },
  { id: 3, name: "ТРАССА 03 · ПУСТЫНЯ", target: 600, gapMin: 110, gapMax: 220, wallChance: 0.45, gravity: 0.40, speed: 5.5, bgTop: "#3a1a05", bgBot: "#5a2d0a", ground: "#e8a35a", wall: "#c2410c", theme: "desert" },
  { id: 4, name: "ТРАССА 04 · ДЖУНГЛИ", target: 850, gapMin: 120, gapMax: 240, wallChance: 0.50, gravity: 0.46, speed: 5.8, bgTop: "#0a1f10", bgBot: "#143a1f", ground: "#22c55e", wall: "#fbbf24", theme: "jungle" },
  { id: 5, name: "ТРАССА 05 · НОЧНОЙ НЕОН", target: 1100, gapMin: 130, gapMax: 260, wallChance: 0.55, gravity: 0.44, speed: 6.0, bgTop: "#1a0535", bgBot: "#0a0420", ground: "#a855f7", wall: "#ec4899", theme: "neon" },
  { id: 6, name: "ТРАССА 06 · АРКТИКА", target: 1400, gapMin: 140, gapMax: 280, wallChance: 0.55, gravity: 0.42, speed: 6.2, bgTop: "#0a2540", bgBot: "#1a4a6e", ground: "#bae6fd", wall: "#3b82f6", theme: "arctic" },
  { id: 7, name: "ТРАССА 07 · ВУЛКАН", target: 1800, gapMin: 150, gapMax: 300, wallChance: 0.60, gravity: 0.48, speed: 6.5, bgTop: "#1a0505", bgBot: "#3a0a0a", ground: "#f97316", wall: "#dc2626", theme: "volcano" },
  { id: 8, name: "ТРАССА 08 · ПУСТОТА", target: 2400, gapMin: 160, gapMax: 320, wallChance: 0.60, gravity: 0.46, speed: 7.0, bgTop: "#000000", bgBot: "#1a1a1a", ground: "#ffffff", wall: "#facc15", theme: "void" },
  { id: 9, name: "ТРАССА 09 · КИБЕРПАНК", target: 2800, gapMin: 170, gapMax: 340, wallChance: 0.62, gravity: 0.46, speed: 7.2, bgTop: "#0a0a1a", bgBot: "#1a1a3a", ground: "#f472b6", wall: "#22d3ee", theme: "cyber" },
  { id: 10, name: "ТРАССА 10 · КОСМОС", target: 3200, gapMin: 180, gapMax: 360, wallChance: 0.62, gravity: 0.47, speed: 7.4, bgTop: "#050510", bgBot: "#0a0a20", ground: "#a78bfa", wall: "#34d399", theme: "space" },
  { id: 11, name: "ТРАССА 11 · БОЛОТО", target: 3700, gapMin: 190, gapMax: 380, wallChance: 0.65, gravity: 0.47, speed: 7.6, bgTop: "#0a1a0a", bgBot: "#142814", ground: "#65a30d", wall: "#3f6212", theme: "swamp" },
  { id: 12, name: "ТРАССА 12 · КОНФЕТЫ", target: 4200, gapMin: 200, gapMax: 400, wallChance: 0.65, gravity: 0.48, speed: 7.8, bgTop: "#2a0a2a", bgBot: "#3a153a", ground: "#f9a8d4", wall: "#c084fc", theme: "candy" },
  { id: 13, name: "ТРАССА 13 · КЛАДБИЩЕ", target: 4800, gapMin: 210, gapMax: 420, wallChance: 0.68, gravity: 0.48, speed: 8.0, bgTop: "#0a0a0a", bgBot: "#111111", ground: "#4b5563", wall: "#10b981", theme: "graveyard" },
  { id: 14, name: "ТРАССА 14 · ПОДВОДНЫЙ", target: 5400, gapMin: 220, gapMax: 440, wallChance: 0.68, gravity: 0.49, speed: 8.2, bgTop: "#001a33", bgBot: "#002a4d", ground: "#22d3ee", wall: "#0ea5e9", theme: "underwater" },
  { id: 15, name: "ТРАССА 15 · ЗАКАТ", target: 6000, gapMin: 230, gapMax: 460, wallChance: 0.70, gravity: 0.49, speed: 8.4, bgTop: "#2a0a05", bgBot: "#4a1a0a", ground: "#fb923c", wall: "#f43f5e", theme: "sunset" },
  { id: 16, name: "ТРАССА 16 · ФАБРИКА", target: 6700, gapMin: 240, gapMax: 480, wallChance: 0.70, gravity: 0.50, speed: 8.6, bgTop: "#1a1a1a", bgBot: "#262626", ground: "#facc15", wall: "#ef4444", theme: "factory" },
  { id: 17, name: "ТРАССА 17 · КРИСТАЛЛЫ", target: 7500, gapMin: 250, gapMax: 500, wallChance: 0.72, gravity: 0.50, speed: 8.8, bgTop: "#0a0a1a", bgBot: "#1a1a2e", ground: "#22d3ee", wall: "#a78bfa", theme: "crystal" },
  { id: 18, name: "ТРАССА 18 · БЕЗДНА", target: 8200, gapMin: 260, gapMax: 520, wallChance: 0.72, gravity: 0.50, speed: 9.0, bgTop: "#000000", bgBot: "#050505", ground: "#ffffff", wall: "#ef4444", theme: "abyss" },
  { id: 19, name: "ТРАССА 19 · СИЯНИЕ", target: 9000, gapMin: 270, gapMax: 540, wallChance: 0.74, gravity: 0.50, speed: 9.2, bgTop: "#050a10", bgBot: "#0a1a15", ground: "#34d399", wall: "#a78bfa", theme: "aurora" },
  { id: 20, name: "ТРАССА 20 · ОМЕГА", target: 9999, gapMin: 280, gapMax: 560, wallChance: 0.75, gravity: 0.52, speed: 9.5, bgTop: "#0a0000", bgBot: "#1a0505", ground: "#fbbf24", wall: "#ef4444", theme: "omega" },
];


type Shape = "square" | "circle" | "triangle" | "diamond" | "hexagon" | "star" | "pill" | "cross" | "ring" | "heart" | "quad";
type Skin = { id: string; name: string; body: string; stroke: string; shape: Shape };
const PALETTE: { name: string; body: string; stroke: string }[] = [
  { name: "БЕЛЫЙ",      body: "#ffffff", stroke: "#262626" },
  { name: "СИНИЙ",      body: "#1c69d4", stroke: "#0653b6" },
  { name: "КРАСНЫЙ",    body: "#e22718", stroke: "#7f1d1d" },
  { name: "НЕОН",       body: "#22e6ff", stroke: "#0e7490" },
  { name: "ЗОЛОТО",     body: "#fbbf24", stroke: "#78350f" },
  { name: "СЕРЫЙ",      body: "#94a3b8", stroke: "#1f2937" },
  { name: "РОЗОВЫЙ",    body: "#ec4899", stroke: "#831843" },
  { name: "ЛАЙМ",       body: "#a3e635", stroke: "#365314" },
  { name: "ФИОЛЕТ.",    body: "#a855f7", stroke: "#3b0764" },
  { name: "КОРАЛЛ",     body: "#fb7185", stroke: "#881337" },
  { name: "ОРАНЖ.",     body: "#f97316", stroke: "#7c2d12" },
  { name: "БИРЮЗА",     body: "#14b8a6", stroke: "#134e4a" },
  { name: "ИЗУМРУД",    body: "#10b981", stroke: "#064e3b" },
  { name: "ИНДИГО",     body: "#6366f1", stroke: "#312e81" },
  { name: "НЕБО",       body: "#38bdf8", stroke: "#075985" },
  { name: "МЯТА",       body: "#5eead4", stroke: "#115e59" },
  { name: "ЯНТАРЬ",     body: "#f59e0b", stroke: "#78350f" },
  { name: "СЛИВА",      body: "#7e22ce", stroke: "#3b0764" },
  { name: "ВИШНЯ",      body: "#dc2626", stroke: "#450a0a" },
  { name: "ОЛИВА",      body: "#84cc16", stroke: "#3f6212" },
  { name: "САКУРА",     body: "#f9a8d4", stroke: "#9d174d" },
  { name: "УГОЛЬ",      body: "#27272a", stroke: "#ffffff" },
  { name: "ПЕСОК",      body: "#fde68a", stroke: "#92400e" },
  { name: "МОРЕ",       body: "#0ea5e9", stroke: "#0c4a6e" },
];

const SHAPES: { id: Shape; name: string }[] = [
  { id: "square",   name: "КУБ" },
  { id: "circle",   name: "КРУГ" },
  { id: "triangle", name: "ТРЕУГ." },
  { id: "diamond",  name: "РОМБ" },
  { id: "hexagon",  name: "ГЕКС." },
  { id: "star",     name: "ЗВЕЗДА" },
  { id: "pill",     name: "ПИЛЮЛЯ" },
  { id: "cross",    name: "КРЕСТ" },
  { id: "ring",     name: "КОЛЬЦО" },
  { id: "heart",    name: "СЕРДЦЕ" },
  { id: "quad",     name: "4-В-1" },
];

const SKINS: Skin[] = SHAPES.flatMap((sh) =>
  PALETTE.map((c) => ({
    id: `${sh.id}-${c.name}`,
    name: `${sh.name} · ${c.name}`,
    body: c.body,
    stroke: c.stroke,
    shape: sh.id,
  }))
);


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
    case "quad": {
      // outer cube
      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
      // 4 inner cubes — 2x2 grid with different colors
      const pad = Math.max(2, w * 0.12);
      const gap = Math.max(1, w * 0.05);
      const innerW = (w - pad * 2 - gap) / 2;
      const innerH = (h - pad * 2 - gap) / 2;
      const colors = ["#e22718", "#1c69d4", "#22e6ff", "#a3e635"];
      for (let i = 0; i < 4; i++) {
        const ix = x + pad + (i % 2) * (innerW + gap);
        const iy = y + pad + Math.floor(i / 2) * (innerH + gap);
        ctx.fillStyle = colors[i];
        ctx.fillRect(ix, iy, innerW, innerH);
        ctx.strokeStyle = stroke;
        ctx.strokeRect(ix + 0.5, iy + 0.5, innerW - 1, innerH - 1);
      }
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
  } else if (theme === "cyber") {
    const off = cam * 0.25;
    ctx.strokeStyle = "rgba(34,211,238,0.25)"; ctx.lineWidth = 1;
    for (let i = 0; i < 18; i++) {
      const y = horizon + i * 12;
      if (y > H) break;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    for (let i = -2; i < 30; i++) {
      const sx = i * 130 - (off % 130);
      const h = 90 + rand(i + 3) * 130;
      ctx.fillStyle = "rgba(244,114,182,0.45)";
      ctx.fillRect(sx, horizon - h, 60, h);
      ctx.fillStyle = "rgba(34,211,238,0.7)";
      ctx.fillRect(sx + 25, horizon - h - 10, 10, 10);
    }
  } else if (theme === "space") {
    for (let i = 0; i < 160; i++) {
      const sx = ((i * 151 - cam * 0.15) % W + W) % W;
      const sy = (i * 97) % H;
      const a = 0.4 + rand(i) * 0.6;
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.fillRect(sx, sy, rand(i + 2) > 0.9 ? 3 : 1, 1);
    }
    const off = cam * 0.3;
    for (let i = -2; i < 20; i++) {
      const sx = i * 200 - (off % 200);
      ctx.fillStyle = "rgba(167,139,250,0.2)";
      ctx.beginPath(); ctx.arc(sx, 90, 40 + rand(i) * 20, 0, Math.PI * 2); ctx.fill();
    }
  } else if (theme === "swamp") {
    const off1 = cam * 0.2;
    ctx.fillStyle = "rgba(20,40,10,0.6)";
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 20) {
      const wx = x + off1;
      const y = horizon - 20 - Math.sin(wx * 0.008) * 30;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
    const off2 = cam * 0.4;
    for (let i = -2; i < 35; i++) {
      const sx = i * 90 - (off2 % 90);
      const h = 50 + rand(i + 7) * 40;
      ctx.fillStyle = "rgba(10,30,5,0.8)";
      ctx.beginPath();
      ctx.moveTo(sx + 20, horizon);
      ctx.quadraticCurveTo(sx + 45, horizon - h, sx + 70, horizon);
      ctx.closePath(); ctx.fill();
    }
  } else if (theme === "candy") {
    const off = cam * 0.3;
    for (let i = -2; i < 30; i++) {
      const sx = i * 110 - (off % 110);
      const h = 70 + rand(i + 4) * 80;
      ctx.fillStyle = "rgba(249,168,212,0.45)";
      ctx.beginPath();
      ctx.moveTo(sx, horizon);
      ctx.lineTo(sx + 55, horizon - h);
      ctx.lineTo(sx + 110, horizon);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = "rgba(192,132,252,0.5)";
      ctx.fillRect(sx + 45, horizon - h - 8, 20, 8);
    }
  } else if (theme === "graveyard") {
    const off = cam * 0.25;
    for (let i = -2; i < 35; i++) {
      const sx = i * 70 - (off % 70);
      const h = 30 + rand(i + 5) * 25;
      ctx.fillStyle = "rgba(75,85,99,0.7)";
      ctx.fillRect(sx + 20, horizon - h, 8, h);
      ctx.fillRect(sx + 8, horizon - h, 32, 8);
    }
    for (let i = 0; i < 80; i++) {
      const sx = ((i * 113 - cam * 0.5) % W + W) % W;
      const sy = (i * 67) % H;
      ctx.fillStyle = `rgba(16,185,129,${0.2 + rand(i) * 0.4})`;
      ctx.fillRect(sx, sy, 2, 2);
    }
  } else if (theme === "underwater") {
    const off = cam * 0.2;
    ctx.fillStyle = "rgba(14,165,233,0.25)";
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 20) {
      const wx = x + off;
      const y = horizon - 15 - Math.sin(wx * 0.006) * 25;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
    for (let i = -2; i < 25; i++) {
      const sx = i * 160 - (off % 160);
      ctx.fillStyle = "rgba(34,211,238,0.25)";
      ctx.beginPath();
      ctx.arc(sx, 80 + rand(i) * 40, 10 + rand(i + 3) * 15, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (theme === "sunset") {
    const off1 = cam * 0.15;
    ctx.fillStyle = "rgba(251,146,60,0.3)";
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 20) {
      const wx = x + off1;
      const y = horizon - 40 - Math.sin(wx * 0.01) * 50;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
    const off2 = cam * 0.35;
    ctx.fillStyle = "rgba(244,63,94,0.35)";
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 20) {
      const wx = x + off2;
      const y = horizon + 5 - Math.sin(wx * 0.008 + 2) * 35;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "rgba(251,191,36,0.5)";
    ctx.beginPath(); ctx.arc(W * 0.8, 120, 70, 0, Math.PI * 2); ctx.fill();
  } else if (theme === "factory") {
    const off = cam * 0.25;
    for (let i = -2; i < 30; i++) {
      const sx = i * 140 - (off % 140);
      const h = 110 + rand(i + 2) * 130;
      ctx.fillStyle = "rgba(60,60,60,0.7)";
      ctx.fillRect(sx, horizon - h, 100, h);
      ctx.fillStyle = "rgba(250,204,21,0.6)";
      for (let wy = horizon - h + 10; wy < horizon - 10; wy += 18) {
        for (let wx = sx + 10; wx < sx + 90; wx += 20) {
          if (rand(i * 60 + wy + wx) > 0.5) ctx.fillRect(wx, wy, 8, 8);
        }
      }
    }
    for (let i = 0; i < 40; i++) {
      const sx = ((i * 131 - cam * 0.4) % W + W) % W;
      const sy = (i * 53) % (H / 2);
      ctx.fillStyle = `rgba(239,68,68,${0.3 + rand(i) * 0.5})`;
      ctx.fillRect(sx, sy, 2, 2);
    }
  } else if (theme === "crystal") {
    const off = cam * 0.2;
    for (let i = -2; i < 30; i++) {
      const sx = i * 120 - (off % 120);
      const h = 80 + rand(i + 6) * 100;
      ctx.fillStyle = "rgba(34,211,238,0.35)";
      ctx.beginPath();
      ctx.moveTo(sx + 30, horizon);
      ctx.lineTo(sx + 60, horizon - h);
      ctx.lineTo(sx + 90, horizon);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "rgba(167,139,250,0.4)"; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx + 30, horizon);
      ctx.lineTo(sx + 60, horizon - h);
      ctx.lineTo(sx + 90, horizon);
      ctx.closePath(); ctx.stroke();
    }
  } else if (theme === "abyss") {
    for (let i = 0; i < 180; i++) {
      const sx = ((i * 149 - cam * 0.2) % W + W) % W;
      const sy = (i * 83) % H;
      const a = 0.2 + rand(i) * 0.8;
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.fillRect(sx, sy, rand(i + 1) > 0.9 ? 3 : 1, 1);
    }
    const off = cam * 0.4;
    for (let i = -2; i < 20; i++) {
      const sx = i * 250 - (off % 250);
      ctx.fillStyle = "rgba(239,68,68,0.15)";
      ctx.beginPath(); ctx.arc(sx, 100, 50, 0, Math.PI * 2); ctx.fill();
    }
  } else if (theme === "aurora") {
    const off = cam * 0.1;
    for (let i = 0; i < 5; i++) {
      const waveY = 60 + i * 35;
      ctx.strokeStyle = `rgba(${52 + i * 20},${211 - i * 15},${167 + i * 10},0.35)`;
      ctx.lineWidth = 3 + i;
      ctx.beginPath(); ctx.moveTo(0, waveY);
      for (let x = 0; x <= W; x += 10) {
        const wx = x + off + i * 50;
        const y = waveY + Math.sin(wx * 0.005 + i) * 20 + Math.sin(wx * 0.01 + i * 2) * 10;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    for (let i = 0; i < 100; i++) {
      const sx = ((i * 131 - cam * 0.15) % W + W) % W;
      const sy = (i * 79) % (H / 2);
      const a = 0.3 + rand(i) * 0.5;
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.fillRect(sx, sy, 1, 1);
    }
  } else if (theme === "omega") {
    for (let i = 0; i < 200; i++) {
      const sx = ((i * 157 - cam * 0.25) % W + W) % W;
      const sy = (i * 89) % H;
      const a = 0.15 + rand(i) * 0.85;
      ctx.fillStyle = `rgba(255,${200 + rand(i + 1) * 55},${rand(i + 2) * 100},${a})`;
      ctx.fillRect(sx, sy, rand(i + 3) > 0.9 ? 3 : 1, 1);
    }
    const off = cam * 0.3;
    for (let i = -2; i < 20; i++) {
      const sx = i * 300 - (off % 300);
      ctx.fillStyle = "rgba(251,191,36,0.12)";
      ctx.beginPath(); ctx.arc(sx, 80, 80, 0, Math.PI * 2); ctx.fill();
    }
    for (let i = 0; i < 30; i++) {
      const sx = ((i * 167 - cam * 0.5) % W + W) % W;
      const sy = (i * 61) % H;
      ctx.fillStyle = `rgba(239,68,68,${0.2 + rand(i) * 0.4})`;
      ctx.fillRect(sx, sy, 2, 2);
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

  const DEFAULT_OWNED = useMemo(
    () => SKINS.filter((s) => s.shape === "square" && ["БЕЛЫЙ", "СИНИЙ", "КРАСНЫЙ"].some((n) => s.name.endsWith(n))).map((s) => s.id),
    []
  );

  const [skinId, setSkinId] = useState<string>(() => {
    if (typeof window === "undefined") return SKINS[0].id;
    return localStorage.getItem("np_skin") ?? SKINS[0].id;
  });
  const [levelId, setLevelId] = useState<number>(() => {
    if (typeof window === "undefined") return 1;
    return Number(localStorage.getItem("np_level") ?? 1);
  });
  const [unlocked, setUnlocked] = useState<number>(() => {
    if (typeof window === "undefined") return 1;
    return Number(localStorage.getItem("np_unlocked") ?? 1);
  });
  const [owned, setOwned] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem("np_owned");
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  });
  const [lastClaim, setLastClaim] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("np_last_claim") ?? "";
  });
  const [giftPopup, setGiftPopup] = useState<Skin[] | null>(null);
  const [customLevels, setCustomLevels] = useState<Level[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem("np_custom_levels");
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  });
  const [levelTab, setLevelTab] = useState<"std" | "custom">("std");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorDraft, setEditorDraft] = useState<Level | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [voiceVolume, setVoiceVolume] = useState(0);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const voiceVolumeRef = useRef(0);
  const voiceCleanupRef = useRef<() => void>(() => {});
  const voiceThreshold = 0.18;

  useEffect(() => { localStorage.setItem("np_custom_levels", JSON.stringify(customLevels)); }, [customLevels]);

  // Seed defaults on first mount if owned is empty
  useEffect(() => {
    if (owned.length === 0) setOwned(DEFAULT_OWNED);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ALL_LEVELS = useMemo(() => [...LEVELS, ...customLevels], [customLevels]);
  const level = useMemo(() => ALL_LEVELS.find((l) => l.id === levelId) ?? LEVELS[0], [ALL_LEVELS, levelId]);
  const skin = useMemo(() => SKINS.find((s) => s.id === skinId) ?? SKINS[0], [skinId]);

  const levelRef = useRef(level);
  const skinRef = useRef(skin);
  useEffect(() => { levelRef.current = level; }, [level]);
  useEffect(() => { skinRef.current = skin; }, [skin]);

  const lastSubmittedRef = useRef<number>(-1);

  useEffect(() => { localStorage.setItem("np_skin", skinId); }, [skinId]);
  useEffect(() => { localStorage.setItem("np_level", String(levelId)); }, [levelId]);
  useEffect(() => { localStorage.setItem("np_unlocked", String(unlocked)); }, [unlocked]);
  useEffect(() => { localStorage.setItem("np_owned", JSON.stringify(owned)); }, [owned]);
  useEffect(() => { localStorage.setItem("np_last_claim", lastClaim); }, [lastClaim]);

  const today = new Date().toISOString().slice(0, 10);
  const canClaim = lastClaim !== today;

  function claimDaily() {
    if (!canClaim) return;
    const locked = SKINS.filter((s) => !owned.includes(s.id));
    if (locked.length === 0) {
      setLastClaim(today);
      return;
    }
    const count = Math.min(3, locked.length);
    const picked: Skin[] = [];
    const pool = [...locked];
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      picked.push(pool.splice(idx, 1)[0]);
    }
    setOwned([...owned, ...picked.map((s) => s.id)]);
    setLastClaim(today);
    setGiftPopup(picked);
  }

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

  // unlock next level on win (only for standard levels)
  useEffect(() => {
    if (won && level.id < 1000 && level.id < LEVELS.length && level.id >= unlocked) {
      setUnlocked(level.id + 1);
    }
  }, [won, level.id, unlocked]);

  function openCreateEditor() {
    const nextId = 1000 + customLevels.length + 1;
    setEditorDraft({
      id: nextId,
      name: `МОЙ УРОВЕНЬ ${customLevels.length + 1}`,
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
  function openEditEditor(l: Level) {
    setEditorDraft({ ...l });
    setEditorOpen(true);
  }
  function saveEditor() {
    if (!editorDraft) return;
    const exists = customLevels.find((l) => l.id === editorDraft.id);
    if (exists) {
      setCustomLevels(customLevels.map((l) => l.id === editorDraft.id ? editorDraft : l));
    } else {
      setCustomLevels([...customLevels, editorDraft]);
    }
    setLevelId(editorDraft.id);
    setEditorOpen(false);
    setEditorDraft(null);
  }
  function deleteCustom(id: number) {
    setCustomLevels(customLevels.filter((l) => l.id !== id));
    if (levelId === id) setLevelId(1);
  }

  async function startVoiceControl() {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setVoiceError("Микрофон не поддерживается в этом браузере.");
      return;
    }

    setVoiceError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) throw new Error("Web Audio API не поддерживается.");

      const audioContext = new AudioContextClass();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);

      const data = new Uint8Array(analyser.fftSize);
      let raf = 0;
      let smoothed = 0;

      function tick() {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (const value of data) {
          const centered = (value - 128) / 128;
          sum += centered * centered;
        }
        const rms = Math.sqrt(sum / data.length);
        smoothed = smoothed * 0.72 + rms * 0.28;
        voiceVolumeRef.current = smoothed;
        setVoiceVolume(smoothed);
        raf = requestAnimationFrame(tick);
      }

      voiceCleanupRef.current();
      setVoiceEnabled(true);
      tick();

      voiceCleanupRef.current = () => {
        cancelAnimationFrame(raf);
        source.disconnect();
        stream.getTracks().forEach((track) => track.stop());
        void audioContext.close();
        voiceVolumeRef.current = 0;
        setVoiceVolume(0);
        setVoiceEnabled(false);
      };
    } catch (err) {
      setVoiceEnabled(false);
      setVoiceError(err instanceof Error ? err.message : "Не удалось включить микрофон.");
    }
  }

  function stopVoiceControl() {
    voiceCleanupRef.current();
    voiceCleanupRef.current = () => {};
  }

  useEffect(() => stopVoiceControl, []);

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
      const accel = 0.9;
      const max = L.speed;
      if (keys["ArrowLeft"] || keys["KeyA"]) player.vx = Math.max(player.vx - accel, -max);
      else if (keys["ArrowRight"] || keys["KeyD"]) player.vx = Math.min(player.vx + accel, max);
      else player.vx = player.onGround ? 0 : player.vx * 0.9;

      const voiceJump = voiceEnabled && voiceVolumeRef.current >= voiceThreshold;
      const jumpPressed = keys["Space"] || keys["ArrowUp"] || keys["KeyW"] || voiceJump;
      if (jumpPressed && !jumpHeld) {
        if (player.onWall !== 0) { player.vy = -11; player.vx = -player.onWall * 5.5; player.jumps = 1; }
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

      <section className="w-full max-w-5xl p-3 font-mono" style={{ background: "rgba(26,33,41,0.7)", border: "1px solid #22e6ff" }}>
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <button
            type="button"
            onClick={voiceEnabled ? stopVoiceControl : startVoiceControl}
            className="px-4 py-2 text-xs font-black tracking-wider uppercase border transition-colors"
            style={{
              background: voiceEnabled ? "#22e6ff" : "transparent",
              borderColor: "#22e6ff",
              color: voiceEnabled ? "#0a0a0a" : "#22e6ff",
            }}
          >
            {voiceEnabled ? "ГОЛОС ВКЛ" : "ВКЛЮЧИТЬ ГОЛОС"}
          </button>
          <div className="flex-1">
            <div className="h-3 w-full" style={{ background: "rgba(255,255,255,0.12)" }}>
              <div
                className="h-full transition-all"
                style={{
                  width: `${Math.min(100, Math.round(voiceVolume * 360))}%`,
                  background: voiceVolume >= voiceThreshold ? "#fffb00" : "#22e6ff",
                }}
              />
            </div>
            <div className="mt-1 flex justify-between gap-3 text-[10px]" style={{ color: voiceError ? "#e22718" : "#6b6b6b" }}>
              <span>{voiceError ?? "Громко скажи звук - персонаж прыгнет"}</span>
              <span>{Math.round(voiceVolume * 100)}%</span>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-col lg:flex-row gap-4 items-start justify-center w-full max-w-6xl">
        {/* Left: levels */}
        <aside className="w-full lg:w-56 p-4 font-mono" style={{ background: "rgba(26,33,41,0.7)", border: "1px solid #1c69d4" }}>
          <div className="flex gap-1 mb-3">
            <button
              onClick={() => setLevelTab("std")}
              className="flex-1 py-1 text-[10px] font-black tracking-wider border"
              style={{
                background: levelTab === "std" ? "#1c69d4" : "transparent",
                color: levelTab === "std" ? "#fff" : "#1c69d4",
                borderColor: "#1c69d4",
              }}
            >УРОВНИ</button>
            <button
              onClick={() => setLevelTab("custom")}
              className="flex-1 py-1 text-[10px] font-black tracking-wider border"
              style={{
                background: levelTab === "custom" ? "#22e6ff" : "transparent",
                color: levelTab === "custom" ? "#0a0a0a" : "#22e6ff",
                borderColor: "#22e6ff",
              }}
            >СВОИ</button>
          </div>
          {levelTab === "std" ? (
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
          ) : (
            <div className="flex flex-col gap-2">
              <button
                onClick={openCreateEditor}
                className="px-3 py-2 text-xs font-black tracking-wider border-2 border-dashed transition-colors hover:bg-[#22e6ff] hover:text-[#0a0a0a]"
                style={{ borderColor: "#22e6ff", color: "#22e6ff" }}
              >+ СОЗДАТЬ УРОВЕНЬ</button>
              {customLevels.length === 0 && (
                <p className="text-[10px] text-center mt-2" style={{ color: "#6b6b6b" }}>
                  Создай свой уровень: настрой скорость, цвета, тему и цель.
                </p>
              )}
              {customLevels.map((l) => {
                const active = l.id === levelId;
                return (
                  <div
                    key={l.id}
                    className="border"
                    style={{
                      background: active ? l.ground : "transparent",
                      borderColor: active ? l.ground : "#3a4250",
                    }}
                  >
                    <button
                      onClick={() => pickLevel(l.id)}
                      className="text-left w-full px-3 py-2 text-xs tracking-wider"
                      style={{ color: active ? "#ffffff" : "#e6e6e6" }}
                    >
                      <div className="flex items-center justify-between">
                        <span>★ {l.name.slice(0, 14)}</span>
                        <span style={{ color: active ? "#ffffff" : l.ground }}>{l.target}</span>
                      </div>
                    </button>
                    <div className="flex gap-1 px-2 pb-2">
                      <button
                        onClick={() => openEditEditor(l)}
                        className="flex-1 py-0.5 text-[10px] border"
                        style={{ borderColor: "#facc15", color: active ? "#fff" : "#facc15" }}
                      >ИЗМ.</button>
                      <button
                        onClick={() => deleteCustom(l.id)}
                        className="flex-1 py-0.5 text-[10px] border"
                        style={{ borderColor: "#e22718", color: active ? "#fff" : "#e22718" }}
                      >УДАЛ.</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
          <aside className="p-4 font-mono" style={{ background: "rgba(26,33,41,0.7)", border: "1px solid #facc15" }}>
            <h2 className="text-sm font-black mb-2 tracking-wider" style={{ color: "#facc15" }}>🎁 ЕЖЕДНЕВНЫЙ ПОДАРОК</h2>
            <p className="text-[10px] mb-2" style={{ color: "#a3a3a3" }}>
              {canClaim ? "Забери 3 случайных скина!" : "Возвращайся завтра за новым подарком."}
            </p>
            <button
              onClick={claimDaily}
              disabled={!canClaim}
              className="w-full py-2 font-bold text-xs tracking-wider uppercase transition-opacity disabled:opacity-40"
              style={{ background: canClaim ? "#facc15" : "#3a4250", color: "#0a0a0a" }}
            >
              {canClaim ? "ЗАБРАТЬ ПОДАРОК" : "ПОЛУЧЕНО"}
            </button>
            <div className="mt-2 text-[10px]" style={{ color: "#6b6b6b" }}>
              Открыто: {owned.length} / {SKINS.length}
            </div>
          </aside>

          <aside className="p-4 font-mono" style={{ background: "rgba(26,33,41,0.7)", border: "1px solid #1c69d4" }}>
            <h2 className="text-sm font-black mb-3 tracking-wider" style={{ color: "#1c69d4" }}>СКИНЫ</h2>
            <div className="grid grid-cols-5 gap-2 max-h-80 overflow-y-auto pr-1">
              {SKINS.map((s) => {
                const isOwned = owned.includes(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => isOwned && setSkinId(s.id)}
                    disabled={!isOwned}
                    title={isOwned ? s.name : "🔒 Заблокировано"}
                    className="aspect-square flex items-center justify-center border-2 transition-transform hover:scale-105 disabled:cursor-not-allowed"
                    style={{
                      background: "rgba(0,0,0,0.3)",
                      borderColor: skinId === s.id ? "#ffffff" : "#3a4250",
                      outline: skinId === s.id ? "2px solid #1c69d4" : "none",
                      outlineOffset: "2px",
                      opacity: isOwned ? 1 : 0.25,
                      filter: isOwned ? "none" : "grayscale(1)",
                    }}
                  >
                    {isOwned ? (
                      <ShapeSwatch shape={s.shape} body={s.body} stroke={s.stroke} />
                    ) : (
                      <span className="text-base">🔒</span>
                    )}
                  </button>
                );
              })}
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

      {giftPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)" }}
          onClick={() => setGiftPopup(null)}
        >
          <div
            className="p-6 font-mono max-w-md w-full text-center"
            style={{ background: "#1a2129", border: "2px solid #facc15" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-4xl mb-3">🎁</div>
            <h3 className="text-2xl font-black mb-1" style={{ color: "#facc15" }}>ПОДАРОК ДНЯ!</h3>
            <p className="text-xs mb-5" style={{ color: "#a3a3a3" }}>Ты получил {giftPopup.length} новых скина:</p>
            <div className="flex justify-center gap-4 mb-5">
              {giftPopup.map((s) => (
                <div key={s.id} className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 flex items-center justify-center border-2" style={{ background: "rgba(0,0,0,0.3)", borderColor: "#facc15" }}>
                    <ShapeSwatch shape={s.shape} body={s.body} stroke={s.stroke} />
                  </div>
                  <div className="text-[10px]" style={{ color: s.body }}>{s.name}</div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setGiftPopup(null)}
              className="px-6 py-2 font-bold text-sm tracking-wider uppercase"
              style={{ background: "#facc15", color: "#0a0a0a" }}
            >
              КРУТО!
            </button>
          </div>
        </div>
      )}

      {editorOpen && editorDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)" }} onClick={() => setEditorOpen(false)}>
          <div className="max-w-xl w-full p-6 font-mono max-h-[90vh] overflow-y-auto" style={{ background: "#1a2129", border: "2px solid #22e6ff" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black" style={{ color: "#22e6ff" }}>РЕДАКТОР УРОВНЯ</h2>
              <button onClick={() => setEditorOpen(false)} className="text-xl px-2" style={{ color: "#6b6b6b" }}>✕</button>
            </div>

            <div className="flex flex-col gap-3 text-xs" style={{ color: "#e6e6e6" }}>
              <label className="flex flex-col gap-1">
                <span style={{ color: "#22e6ff" }}>НАЗВАНИЕ</span>
                <input
                  value={editorDraft.name}
                  onChange={(e) => setEditorDraft({ ...editorDraft, name: e.target.value })}
                  className="px-2 py-1 bg-black/40 border" style={{ borderColor: "#3a4250", color: "#fff" }}
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span style={{ color: "#22e6ff" }}>ЦЕЛЬ (дистанция): {editorDraft.target}</span>
                  <input type="range" min={100} max={9999} step={50}
                    value={editorDraft.target}
                    onChange={(e) => setEditorDraft({ ...editorDraft, target: Number(e.target.value) })} />
                </label>
                <label className="flex flex-col gap-1">
                  <span style={{ color: "#22e6ff" }}>СКОРОСТЬ: {editorDraft.speed.toFixed(1)}</span>
                  <input type="range" min={3} max={10} step={0.1}
                    value={editorDraft.speed}
                    onChange={(e) => setEditorDraft({ ...editorDraft, speed: Number(e.target.value) })} />
                </label>
                <label className="flex flex-col gap-1">
                  <span style={{ color: "#22e6ff" }}>ГРАВИТАЦИЯ: {editorDraft.gravity.toFixed(2)}</span>
                  <input type="range" min={0.3} max={0.7} step={0.01}
                    value={editorDraft.gravity}
                    onChange={(e) => setEditorDraft({ ...editorDraft, gravity: Number(e.target.value) })} />
                </label>
                <label className="flex flex-col gap-1">
                  <span style={{ color: "#22e6ff" }}>ШАНС СТЕН: {Math.round(editorDraft.wallChance * 100)}%</span>
                  <input type="range" min={0} max={1} step={0.05}
                    value={editorDraft.wallChance}
                    onChange={(e) => setEditorDraft({ ...editorDraft, wallChance: Number(e.target.value) })} />
                </label>
                <label className="flex flex-col gap-1">
                  <span style={{ color: "#22e6ff" }}>МИН. РАЗРЫВ: {editorDraft.gapMin}</span>
                  <input type="range" min={60} max={400} step={10}
                    value={editorDraft.gapMin}
                    onChange={(e) => setEditorDraft({ ...editorDraft, gapMin: Number(e.target.value) })} />
                </label>
                <label className="flex flex-col gap-1">
                  <span style={{ color: "#22e6ff" }}>МАКС. РАЗРЫВ: {editorDraft.gapMax}</span>
                  <input type="range" min={80} max={600} step={10}
                    value={editorDraft.gapMax}
                    onChange={(e) => setEditorDraft({ ...editorDraft, gapMax: Number(e.target.value) })} />
                </label>
              </div>

              <label className="flex flex-col gap-1">
                <span style={{ color: "#22e6ff" }}>ТЕМА ФОНА</span>
                <select
                  value={editorDraft.theme}
                  onChange={(e) => setEditorDraft({ ...editorDraft, theme: e.target.value as Theme })}
                  className="px-2 py-1 bg-black/40 border" style={{ borderColor: "#3a4250", color: "#fff" }}
                >
                  {(["warmup","city","desert","jungle","neon","arctic","volcano","void","cyber","space","swamp","candy","graveyard","underwater","sunset","factory","crystal","abyss","aurora","omega"] as Theme[]).map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-4 gap-2">
                {([["bgTop","ФОН ВЕРХ"],["bgBot","ФОН НИЗ"],["ground","ПЛАТФОРМЫ"],["wall","СТЕНЫ"]] as const).map(([k, label]) => (
                  <label key={k} className="flex flex-col gap-1 items-center">
                    <span className="text-[10px]" style={{ color: "#22e6ff" }}>{label}</span>
                    <input
                      type="color"
                      value={(editorDraft as any)[k]}
                      onChange={(e) => setEditorDraft({ ...editorDraft, [k]: e.target.value } as Level)}
                      className="w-12 h-10 bg-transparent border cursor-pointer"
                      style={{ borderColor: "#3a4250" }}
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setEditorOpen(false)}
                className="flex-1 py-2 font-bold text-xs tracking-wider uppercase border"
                style={{ borderColor: "#6b6b6b", color: "#6b6b6b" }}
              >ОТМЕНА</button>
              <button
                onClick={saveEditor}
                className="flex-1 py-2 font-bold text-xs tracking-wider uppercase"
                style={{ background: "#22e6ff", color: "#0a0a0a" }}
              >СОХРАНИТЬ И ИГРАТЬ</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
