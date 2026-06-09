export type Theme = "warmup" | "city" | "desert" | "jungle" | "neon" | "arctic" | "volcano" | "void" | "cyber" | "space" | "swamp" | "candy" | "graveyard" | "underwater" | "sunset" | "factory" | "crystal" | "abyss" | "aurora" | "omega";

export type Level = {
  id: number;
  name: string;
  target: number; // distance score to finish
  gapMin: number;
  gapMax: number;
  wallChance: number;
  gravity: number;
  speed: number;
  platformMinY?: number;
  platformMaxY?: number;
  platformMinW?: number;
  platformMaxW?: number;
  wallMinH?: number;
  wallMaxH?: number;
  wallGapMin?: number;
  wallGapMax?: number;
  bgTop: string;
  bgBot: string;
  ground: string;
  wall: string;
  theme: Theme;
};

export const LEVELS: Level[] = [
  { id: 1, name: "ТРАССА 01 · РАЗМИНКА", target: 200, gapMin: 80, gapMax: 180, wallChance: 0.25, gravity: 0.40, speed: 4.5, platformMinY: 330, platformMaxY: 455, platformMinW: 180, platformMaxW: 280, wallMinH: 90, wallMaxH: 150, wallGapMin: 55, wallGapMax: 110, bgTop: "#1a2129", bgBot: "#262e38", ground: "#1c69d4", wall: "#e22718", theme: "warmup" },
  { id: 2, name: "ТРАССА 02 · ГОРОД", target: 400, gapMin: 100, gapMax: 200, wallChance: 0.40, gravity: 0.42, speed: 5.0, platformMinY: 300, platformMaxY: 440, platformMinW: 140, platformMaxW: 260, wallMinH: 110, wallMaxH: 210, wallGapMin: 35, wallGapMax: 95, bgTop: "#0c1a2a", bgBot: "#1a3045", ground: "#00b3d4", wall: "#ff5a1f", theme: "city" },
  { id: 3, name: "ТРАССА 03 · ПУСТЫНЯ", target: 600, gapMin: 110, gapMax: 220, wallChance: 0.45, gravity: 0.40, speed: 5.5, platformMinY: 340, platformMaxY: 470, platformMinW: 180, platformMaxW: 320, wallMinH: 70, wallMaxH: 130, wallGapMin: 70, wallGapMax: 140, bgTop: "#3a1a05", bgBot: "#5a2d0a", ground: "#e8a35a", wall: "#c2410c", theme: "desert" },
  { id: 4, name: "ТРАССА 04 · ДЖУНГЛИ", target: 850, gapMin: 120, gapMax: 240, wallChance: 0.50, gravity: 0.46, speed: 5.8, platformMinY: 250, platformMaxY: 430, platformMinW: 110, platformMaxW: 230, wallMinH: 130, wallMaxH: 250, wallGapMin: 35, wallGapMax: 90, bgTop: "#0a1f10", bgBot: "#143a1f", ground: "#22c55e", wall: "#fbbf24", theme: "jungle" },
  { id: 5, name: "ТРАССА 05 · НОЧНОЙ НЕОН", target: 1100, gapMin: 130, gapMax: 260, wallChance: 0.55, gravity: 0.44, speed: 6.0, platformMinY: 230, platformMaxY: 455, platformMinW: 95, platformMaxW: 210, wallMinH: 120, wallMaxH: 260, wallGapMin: 30, wallGapMax: 80, bgTop: "#1a0535", bgBot: "#0a0420", ground: "#a855f7", wall: "#ec4899", theme: "neon" },
  { id: 6, name: "ТРАССА 06 · АРКТИКА", target: 1400, gapMin: 140, gapMax: 280, wallChance: 0.55, gravity: 0.42, speed: 6.2, platformMinY: 300, platformMaxY: 455, platformMinW: 160, platformMaxW: 300, wallMinH: 90, wallMaxH: 190, wallGapMin: 45, wallGapMax: 100, bgTop: "#0a2540", bgBot: "#1a4a6e", ground: "#bae6fd", wall: "#3b82f6", theme: "arctic" },
  { id: 7, name: "ТРАССА 07 · ВУЛКАН", target: 1800, gapMin: 150, gapMax: 300, wallChance: 0.60, gravity: 0.48, speed: 6.5, platformMinY: 245, platformMaxY: 450, platformMinW: 100, platformMaxW: 220, wallMinH: 150, wallMaxH: 280, wallGapMin: 30, wallGapMax: 75, bgTop: "#1a0505", bgBot: "#3a0a0a", ground: "#f97316", wall: "#dc2626", theme: "volcano" },
  { id: 8, name: "ТРАССА 08 · ПУСТОТА", target: 2400, gapMin: 160, gapMax: 320, wallChance: 0.60, gravity: 0.46, speed: 7.0, platformMinY: 215, platformMaxY: 465, platformMinW: 85, platformMaxW: 190, wallMinH: 150, wallMaxH: 290, wallGapMin: 25, wallGapMax: 70, bgTop: "#000000", bgBot: "#1a1a1a", ground: "#ffffff", wall: "#facc15", theme: "void" },
  { id: 9, name: "ТРАССА 09 · КИБЕРПАНК", target: 2800, gapMin: 170, gapMax: 340, wallChance: 0.62, gravity: 0.46, speed: 7.2, platformMinY: 250, platformMaxY: 445, platformMinW: 90, platformMaxW: 180, wallMinH: 170, wallMaxH: 300, wallGapMin: 25, wallGapMax: 65, bgTop: "#0a0a1a", bgBot: "#1a1a3a", ground: "#f472b6", wall: "#22d3ee", theme: "cyber" },
  { id: 10, name: "ТРАССА 10 · КОСМОС", target: 3200, gapMin: 180, gapMax: 360, wallChance: 0.62, gravity: 0.47, speed: 7.4, platformMinY: 200, platformMaxY: 440, platformMinW: 120, platformMaxW: 240, wallMinH: 110, wallMaxH: 230, wallGapMin: 50, wallGapMax: 130, bgTop: "#050510", bgBot: "#0a0a20", ground: "#a78bfa", wall: "#34d399", theme: "space" },
  { id: 11, name: "ТРАССА 11 · БОЛОТО", target: 3700, gapMin: 190, gapMax: 380, wallChance: 0.65, gravity: 0.47, speed: 7.6, platformMinY: 340, platformMaxY: 475, platformMinW: 120, platformMaxW: 240, wallMinH: 95, wallMaxH: 190, wallGapMin: 35, wallGapMax: 85, bgTop: "#0a1a0a", bgBot: "#142814", ground: "#65a30d", wall: "#3f6212", theme: "swamp" },
  { id: 12, name: "ТРАССА 12 · КОНФЕТЫ", target: 4200, gapMin: 200, gapMax: 400, wallChance: 0.65, gravity: 0.48, speed: 7.8, platformMinY: 225, platformMaxY: 450, platformMinW: 150, platformMaxW: 330, wallMinH: 80, wallMaxH: 180, wallGapMin: 70, wallGapMax: 150, bgTop: "#2a0a2a", bgBot: "#3a153a", ground: "#f9a8d4", wall: "#c084fc", theme: "candy" },
  { id: 13, name: "ТРАССА 13 · КЛАДБИЩЕ", target: 4800, gapMin: 210, gapMax: 420, wallChance: 0.68, gravity: 0.48, speed: 8.0, platformMinY: 255, platformMaxY: 470, platformMinW: 90, platformMaxW: 190, wallMinH: 160, wallMaxH: 310, wallGapMin: 25, wallGapMax: 70, bgTop: "#0a0a0a", bgBot: "#111111", ground: "#4b5563", wall: "#10b981", theme: "graveyard" },
  { id: 14, name: "ТРАССА 14 · ПОДВОДНЫЙ", target: 5400, gapMin: 220, gapMax: 440, wallChance: 0.68, gravity: 0.49, speed: 8.2, platformMinY: 180, platformMaxY: 410, platformMinW: 150, platformMaxW: 280, wallMinH: 90, wallMaxH: 210, wallGapMin: 55, wallGapMax: 130, bgTop: "#001a33", bgBot: "#002a4d", ground: "#22d3ee", wall: "#0ea5e9", theme: "underwater" },
  { id: 15, name: "ТРАССА 15 · ЗАКАТ", target: 6000, gapMin: 230, gapMax: 460, wallChance: 0.70, gravity: 0.49, speed: 8.4, platformMinY: 240, platformMaxY: 455, platformMinW: 110, platformMaxW: 230, wallMinH: 120, wallMaxH: 260, wallGapMin: 35, wallGapMax: 95, bgTop: "#2a0a05", bgBot: "#4a1a0a", ground: "#fb923c", wall: "#f43f5e", theme: "sunset" },
  { id: 16, name: "ТРАССА 16 · ФАБРИКА", target: 6700, gapMin: 240, gapMax: 480, wallChance: 0.70, gravity: 0.50, speed: 8.6, platformMinY: 285, platformMaxY: 455, platformMinW: 80, platformMaxW: 170, wallMinH: 190, wallMaxH: 330, wallGapMin: 20, wallGapMax: 60, bgTop: "#1a1a1a", bgBot: "#262626", ground: "#facc15", wall: "#ef4444", theme: "factory" },
  { id: 17, name: "ТРАССА 17 · КРИСТАЛЛЫ", target: 7500, gapMin: 250, gapMax: 500, wallChance: 0.72, gravity: 0.50, speed: 8.8, platformMinY: 195, platformMaxY: 455, platformMinW: 75, platformMaxW: 170, wallMinH: 160, wallMaxH: 320, wallGapMin: 30, wallGapMax: 90, bgTop: "#0a0a1a", bgBot: "#1a1a2e", ground: "#22d3ee", wall: "#a78bfa", theme: "crystal" },
  { id: 18, name: "ТРАССА 18 · БЕЗДНА", target: 8200, gapMin: 260, gapMax: 520, wallChance: 0.72, gravity: 0.50, speed: 9.0, platformMinY: 185, platformMaxY: 475, platformMinW: 70, platformMaxW: 155, wallMinH: 180, wallMaxH: 340, wallGapMin: 20, wallGapMax: 60, bgTop: "#000000", bgBot: "#050505", ground: "#ffffff", wall: "#ef4444", theme: "abyss" },
  { id: 19, name: "ТРАССА 19 · СИЯНИЕ", target: 9000, gapMin: 270, gapMax: 540, wallChance: 0.74, gravity: 0.50, speed: 9.2, platformMinY: 170, platformMaxY: 430, platformMinW: 85, platformMaxW: 190, wallMinH: 150, wallMaxH: 320, wallGapMin: 30, wallGapMax: 90, bgTop: "#050a10", bgBot: "#0a1a15", ground: "#34d399", wall: "#a78bfa", theme: "aurora" },
  { id: 20, name: "ТРАССА 20 · ОМЕГА", target: 9999, gapMin: 280, gapMax: 560, wallChance: 0.75, gravity: 0.52, speed: 9.5, platformMinY: 160, platformMaxY: 475, platformMinW: 70, platformMaxW: 150, wallMinH: 200, wallMaxH: 360, wallGapMin: 18, wallGapMax: 55, bgTop: "#0a0000", bgBot: "#1a0505", ground: "#fbbf24", wall: "#ef4444", theme: "omega" },
];


export type Shape = "square" | "circle" | "triangle" | "diamond" | "hexagon" | "star" | "pill" | "cross" | "ring" | "heart" | "quad";
export type Skin = { id: string; name: string; body: string; stroke: string; shape: Shape };
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

export const SKINS: Skin[] = SHAPES.flatMap((sh) =>
  PALETTE.map((c) => ({
    id: `${sh.id}-${c.name}`,
    name: `${sh.name} · ${c.name}`,
    body: c.body,
    stroke: c.stroke,
    shape: sh.id,
  }))
);
