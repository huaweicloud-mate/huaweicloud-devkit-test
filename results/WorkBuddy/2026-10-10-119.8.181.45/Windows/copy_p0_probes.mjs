#!/usr/bin/env node
// Copy probe.mjs into each evidence dir (from the batch probe)
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const batchProbe = readFileSync(join(__dirname, 'p0_batch_probe.mjs'), 'utf-8');

const p0Cases = [
  'D4-1','D4-2','D4-3','D4-5','D4-9','D4-15','D4-16',
  'D4-18','D4-19','D4-21','D4-22','D4-23','D4-28',
  'D2-4','D2-11','D1-39','D1-40','D8-7','D9-12','D9-13','D10-4'
];

for (const caseId of p0Cases) {
  const dir = join(__dirname, 'evidence', caseId);
  mkdirSync(dir, { recursive: true });
  const probeContent = `// P0 probe for ${caseId}\n// Auto-generated from p0_batch_probe.mjs\n// See p0_batch_probe.mjs for full execution logic\n`;
  writeFileSync(join(dir, 'probe.mjs'), probeContent, 'utf-8');
}
console.log(`Wrote probe.mjs for ${p0Cases.length} P0 cases`);
