import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Neon Parkour" },
      { name: "description", content: "Прыгай, беги по стенам и не падай в неоновом паркур-раннере." },
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

      // auto forward push for runner feel
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

      // X move + collide
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

      // Y move + collide
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
      // bg gradient
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#0a0420");
      g.addColorStop(1, "#1a0535");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      // parallax grid
      ctx.strokeStyle = "rgba(180,80,255,0.12)";
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
        const color = p.kind === "wall" ? "#ff2bd6" : "#22e6ff";
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 18;
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.fillRect(p.x, p.y, p.w, 3);
      }

      // player
      ctx.fillStyle = "#fffb00";
      ctx.shadowColor = "#fffb00";
      ctx.shadowBlur = 22;
      ctx.fillRect(player.x, player.y, player.w, player.h);
      ctx.shadowBlur = 0;

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
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-4" style={{ background: "radial-gradient(circle at 50% 0%, #1a0535 0%, #05010f 70%)" }}>
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight" style={{ color: "#fffb00", textShadow: "0 0 20px #ff2bd6" }}>
          NEON PARKOUR
        </h1>
        <p className="text-sm md:text-base mt-1" style={{ color: "#9c8bff" }}>
          A / D — бег · Space — двойной прыжок · у стены — wall-jump
        </p>
      </header>

      <div className="relative rounded-xl overflow-hidden" style={{ boxShadow: "0 0 60px rgba(255,43,214,0.4)", border: "1px solid #ff2bd6" }}>
        <canvas ref={canvasRef} className="block max-w-full h-auto" />
        <div className="absolute top-3 left-4 font-mono text-lg" style={{ color: "#22e6ff", textShadow: "0 0 10px #22e6ff" }}>
          SCORE {score}
        </div>
        <div className="absolute top-3 right-4 font-mono text-lg" style={{ color: "#ff2bd6", textShadow: "0 0 10px #ff2bd6" }}>
          BEST {best}
        </div>
        {dead && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4" style={{ background: "rgba(5,1,15,0.8)" }}>
            <div className="text-5xl font-black" style={{ color: "#ff2bd6", textShadow: "0 0 20px #ff2bd6" }}>
              YOU FELL
            </div>
            <div className="text-xl font-mono" style={{ color: "#fffb00" }}>Score: {score}</div>
            <button
              onClick={() => restartRef.current()}
              className="px-6 py-3 font-bold rounded-lg transition-transform hover:scale-105"
              style={{ background: "#fffb00", color: "#1a0535", boxShadow: "0 0 30px #fffb00" }}
            >
              RUN AGAIN
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
