// D3-B5: detect_framework识别 — verify detectFramework identifies common frameworks
import { loadDetectFramework } from '../_helper.mjs';
const { detectFramework } = await loadDetectFramework();
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const testDir = join(tmpdir(), 'd3-b5-test');
// Clean and create
try { rmSync(testDir, { recursive: true, force: true }); } catch {}
mkdirSync(testDir, { recursive: true });

// Test 1: Next.js
mkdirSync(join(testDir, 'nextjs'), { recursive: true });
writeFileSync(join(testDir, 'nextjs', 'package.json'), JSON.stringify({ name: 'test-next' }));
writeFileSync(join(testDir, 'nextjs', 'next.config.js'), '');
const nextResult = detectFramework(join(testDir, 'nextjs'));

// Test 2: Vite
mkdirSync(join(testDir, 'vite'), { recursive: true });
writeFileSync(join(testDir, 'vite', 'package.json'), JSON.stringify({ name: 'test-vite', dependencies: { vite: '^5.0.0' } }));
writeFileSync(join(testDir, 'vite', 'vite.config.js'), '');
const viteResult = detectFramework(join(testDir, 'vite'));

// Test 3: VitePress
mkdirSync(join(testDir, 'vitepress'), { recursive: true });
writeFileSync(join(testDir, 'vitepress', 'package.json'), JSON.stringify({ name: 'test-vp' }));
mkdirSync(join(testDir, 'vitepress', '.vitepress'), { recursive: true });
const vpResult = detectFramework(join(testDir, 'vitepress'));

// Test 4: No framework (empty)
mkdirSync(join(testDir, 'empty'), { recursive: true });
writeFileSync(join(testDir, 'empty', 'package.json'), JSON.stringify({ name: 'test-empty' }));
const emptyResult = detectFramework(join(testDir, 'empty'));

// Cleanup
try { rmSync(testDir, { recursive: true, force: true }); } catch {}

const nextOk = nextResult?.framework === 'Next.js';
const viteOk = viteResult?.framework?.includes('Vite');
const vpOk = vpResult?.framework === 'VitePress';
const emptyOk = emptyResult === null;

const ok = nextOk && viteOk && vpOk && emptyOk;
console.log(JSON.stringify({
  status: ok ? 'PASS' : 'FAIL',
  caseId: 'D3-B5',
  why: ok ? 'detectFramework correctly identifies Next.js, Vite, VitePress, and returns null for unknown.' : `nextOk=${nextOk}, viteOk=${viteOk}, vpOk=${vpOk}, emptyOk=${emptyOk}`,
  executedAt: '20260930103000',
  nextResult: nextResult?.framework,
  viteResult: viteResult?.framework,
  vpResult: vpResult?.framework,
  emptyResult
}, null, 2));