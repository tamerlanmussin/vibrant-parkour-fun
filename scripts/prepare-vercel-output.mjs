import { cp, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const distDir = join(root, "dist");
const outputDir = join(root, ".vercel", "output");
const functionsDir = join(outputDir, "functions");

const required = [
  join(distDir, "config.json"),
  join(distDir, "client"),
  join(distDir, "server"),
  join(distDir, "server", ".vc-config.json"),
];

for (const path of required) {
  if (!existsSync(path)) {
    throw new Error(`Missing Nitro Vercel output: ${path}`);
  }
}

await rm(outputDir, { recursive: true, force: true });
await mkdir(functionsDir, { recursive: true });

await cp(join(distDir, "config.json"), join(outputDir, "config.json"));
await cp(join(distDir, "client"), join(outputDir, "static"), { recursive: true });
await cp(join(distDir, "server"), join(functionsDir, "__server.func"), { recursive: true });

console.log("Prepared Vercel Build Output API at .vercel/output");
