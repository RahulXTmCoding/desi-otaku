/**
 * generate-pincode-lookup.js
 * ─────────────────────────────────────────────────────────────
 * Processes the raw India Post pincodes.json (154K+ entries)
 * into a compact lookup file that ships with the client.
 *
 * Compact format:
 *   {
 *     s: string[],          // states index (35 entries)
 *     d: string[],          // districts index (~700 entries)
 *     t: string[],          // taluks index (~4000 entries)
 *     p: { [pin]: [tIdx, dIdx, sIdx] }   // 19K pincodes
 *   }
 *
 * Usage:
 *   node scripts/generate-pincode-lookup.js <path-to-pincodes.json>
 *
 * Output:
 *   client/public/data/pincodes-lookup.json
 * ─────────────────────────────────────────────────────────────
 */

"use strict";

const fs   = require("fs");
const path = require("path");

// ── Config ───────────────────────────────────────────────────
const inputPath  = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve(__dirname, "../pincodes.json");

const outputDir  = path.resolve(__dirname, "../client/public/data");
const outputPath = path.join(outputDir, "pincodes-lookup.json");

// ── 1. Read raw data ─────────────────────────────────────────
console.log(`\nReading: ${inputPath}`);
if (!fs.existsSync(inputPath)) {
  console.error(`ERROR: File not found — ${inputPath}`);
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(inputPath, "utf-8"));
console.log(`Read ${raw.length.toLocaleString()} entries.`);

// ── 2. Deduplicate: pick most-frequent (taluk, district, state) per pincode
//     Multiple post offices share the same pincode; we pick the most common.
const freqMap = Object.create(null);

for (const entry of raw) {
  const pin = String(entry.pincode).padStart(6, "0");
  const key = entry.taluk + "\x00" + entry.districtName + "\x00" + entry.stateName;

  if (!freqMap[pin]) freqMap[pin] = Object.create(null);
  freqMap[pin][key] = (freqMap[pin][key] || 0) + 1;
}

const bestPerPin = Object.create(null);

for (const pin of Object.keys(freqMap)) {
  let best = null;
  let bestCount = 0;
  for (const combo of Object.keys(freqMap[pin])) {
    const c = freqMap[pin][combo];
    if (c > bestCount) { bestCount = c; best = combo; }
  }
  const parts = best.split("\x00");
  bestPerPin[pin] = { taluk: parts[0], district: parts[1], state: parts[2] };
}

const uniquePins = Object.keys(bestPerPin).length;
console.log(`Deduplicated → ${uniquePins.toLocaleString()} unique pincodes.`);

// ── 3. Build sorted index arrays ─────────────────────────────
const stateSet    = new Set();
const districtSet = new Set();
const talukSet    = new Set();

for (const v of Object.values(bestPerPin)) {
  stateSet.add(v.state);
  districtSet.add(v.district);
  talukSet.add(v.taluk);
}

const states    = Array.from(stateSet).sort();
const districts = Array.from(districtSet).sort();
const taluks    = Array.from(talukSet).sort();

// Reverse-lookup maps for fast index resolution
const stateIdx    = Object.create(null);
const districtIdx = Object.create(null);
const talukIdx    = Object.create(null);

states.forEach((v, i)    => (stateIdx[v]    = i));
districts.forEach((v, i) => (districtIdx[v] = i));
taluks.forEach((v, i)    => (talukIdx[v]    = i));

console.log(
  `Index sizes — states: ${states.length}, districts: ${districts.length}, taluks: ${taluks.length}`
);

// ── 4. Build compact pincode map ─────────────────────────────
const p = Object.create(null);

for (const [pin, v] of Object.entries(bestPerPin)) {
  p[pin] = [talukIdx[v.taluk], districtIdx[v.district], stateIdx[v.state]];
}

// ── 5. Write output ──────────────────────────────────────────
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const output = { s: states, d: districts, t: taluks, p };
fs.writeFileSync(outputPath, JSON.stringify(output));

const sizeKB   = (fs.statSync(outputPath).size / 1024).toFixed(1);
const estGzipKB = (fs.statSync(outputPath).size / 1024 / 3.5).toFixed(0);

console.log(`\n✅ Written: ${outputPath}`);
console.log(`   Size   : ${sizeKB} KB raw  (~${estGzipKB} KB gzip)\n`);
