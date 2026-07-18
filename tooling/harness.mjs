#!/usr/bin/env node
/**
 * Playwright visual + integration harness (Master Plan §7). Drives the running
 * app at BASE_URL and asserts the Milestone A emotional-core flow still works —
 * the regression gate that protects the shipped experience across milestones.
 *
 * Usage: start the app (`npm run start`) then `node tooling/harness.mjs`.
 * Env: BASE_URL (default http://localhost:3000), PW_CHROMIUM (browser path),
 *      SHOTS=1 to write screenshots to tooling/__screenshots__/.
 */
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const EXE =
  process.env.PW_CHROMIUM ||
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const SHOTS = process.env.SHOTS === "1";
const shotDir = new URL("./__screenshots__/", import.meta.url).pathname;
if (SHOTS) mkdirSync(shotDir, { recursive: true });

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? "  — " + detail : ""}`);
};

const browser = await chromium.launch({
  executablePath: EXE,
  args: [
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--ignore-gpu-blocklist",
    "--enable-webgl",
  ],
});
const page = await browser.newPage({
  viewport: { width: 412, height: 900 },
  deviceScaleFactor: 2,
});
const errors = [];
page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
page.on("console", (m) => {
  if (m.type() === "error" && !/404/.test(m.text())) errors.push(m.text());
});

try {
  await page.goto(`${BASE}/?debug&jump=34`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.mouse.click(206, 450); // begin
  await page.waitForTimeout(4000);

  const greet = await page.evaluate(
    () => document.querySelector('[aria-live="polite"] p')?.textContent || ""
  );
  check("Mubi greets the visitor", greet.length > 0, greet);
  if (SHOTS) await page.screenshot({ path: shotDir + "01-greet.png" });

  await page.mouse.click(206, 720); // touch water
  await page.waitForTimeout(2500);
  const toast = await page.evaluate(
    () => document.querySelector('[role="status"]')?.textContent || ""
  );
  check("First-touch achievement fires", /sea remembers/i.test(toast), toast);

  await page.evaluate(() => window.__sos.simLantern("lantern-1"));
  await page.waitForTimeout(1200);
  const card = await page.evaluate(
    () => document.querySelector('[role="dialog"] p')?.textContent || ""
  );
  check("Lantern opens a memory card", card.length > 0, card.slice(0, 40) + "…");
  if (SHOTS) await page.screenshot({ path: shotDir + "02-memory.png" });

  // birthday reveal chain
  await page.evaluate(() => {
    window.__sos.simLantern("lantern-2");
    window.__sos.simLantern("lantern-3");
    window.__sos.speak("celebrate");
  });
  await page.waitForTimeout(1500);
  const flags = await page.evaluate(() => window.__sos.state().progress.flags);
  check("Birthday reveal sets flag", !!flags.birthday_revealed, JSON.stringify(flags));

  // persistence across reload
  const warmthBefore = await page.evaluate(
    () => window.__sos.state().progress.warmth
  );
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const persisted = await page.evaluate(() => {
    const raw = localStorage.getItem("sos:progress");
    return raw ? JSON.parse(raw).state.warmth : null;
  });
  check(
    "Warmth persists across reload",
    persisted != null && Math.abs(persisted - warmthBefore) < 0.001,
    `before=${warmthBefore.toFixed(3)} after=${persisted}`
  );

  check("No runtime console/page errors", errors.length === 0, errors.join(" | "));
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
