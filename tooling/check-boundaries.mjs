#!/usr/bin/env node
/**
 * Layered import-boundary check (Master Plan §1 rule 4/5, Blueprint §20).
 * Dependency-free (no eslint plugin): the lower layers must not import from the
 * higher, feature-specific layers. Fails the build with a clear report.
 *
 *   lower (may be imported by anyone):  types, constants, lib, services,
 *                                       stores, hooks, love, ai, achievements,
 *                                       content, audio, shaders
 *   higher (must NOT be imported by lower): ui, world, scenes, app-shell
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("../src/", import.meta.url).pathname;
const HIGHER = ["ui", "world", "scenes", "app-shell"];
const LOWER = [
  "types",
  "constants",
  "lib",
  "services",
  "stores",
  "hooks",
  "love",
  "ai",
  "achievements",
  "content",
  "audio",
  "shaders",
];

const IMPORT_RE = /from\s+["']@\/([\w-]+)/g;

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.(ts|tsx)$/.test(name)) out.push(p);
  }
  return out;
}

const violations = [];
for (const file of walk(ROOT)) {
  const rel = relative(ROOT, file);
  const topLayer = rel.split("/")[0];
  if (!LOWER.includes(topLayer)) continue; // only lower layers are constrained
  const src = readFileSync(file, "utf8");
  let m;
  while ((m = IMPORT_RE.exec(src))) {
    const target = m[1];
    if (HIGHER.includes(target)) {
      violations.push(`${rel}  →  @/${target}  (lower layer importing higher)`);
    }
  }
}

if (violations.length) {
  console.error("✗ Import-boundary violations:\n" + violations.map((v) => "  " + v).join("\n"));
  process.exit(1);
}
console.log("✓ Import boundaries OK");
