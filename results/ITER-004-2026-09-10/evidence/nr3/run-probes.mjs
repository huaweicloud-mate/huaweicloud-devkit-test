// run-probes.mjs：NR3 探针统一执行器（2026-09-10T17:10:00+08:00）
// 串行运行 4 个探针，原始 stdout/stderr/退出码 + 环境 manifest 归档到 run-logs/
// 用法: node run-probes.mjs <沙箱根>
import { spawnSync } from 'node:child_process';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { homedir, platform, arch, cpus, totalmem } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const S = resolve(process.argv[2] || join(__dirname, '.sandbox'));
const LOGS = join(__dirname, 'run-logs');
mkdirSync(LOGS, { recursive: true });

const now = () => new Date().toISOString().replace('Z', '+00:00').replace('+00:00', '+08:00').replace(/T(\d{2}):(\d{2}):(\d{2})/, 'T$1:$2:00');
const nowFull = () => new Date().toISOString().replace('Z', '+08:00');

const PROBES = ['d1-unit-probe.mjs', 'd1-mcp-loop.mjs', 'd1-upgrade-real.mjs', 'd1-49-d1-55-ext.mjs'];

function nodeVersion() {
  return process.version.replace('v', '');
}
function npmVersion() {
  const r = spawnSync('npm', ['--version'], { encoding: 'utf8', shell: true, timeout: 30000 });
  return String(r.stdout || '').trim();
}
function gitHead() {
  const r = spawnSync('git', ['-C', 'C:/Users/Administrator/devkit-test/hdk', 'rev-parse', 'HEAD'], { encoding: 'utf8', timeout: 30000 });
  return String(r.stdout || '').trim();
}

const started = nowFull();
const summary = [];

for (const probe of PROBES) {
  const t0 = Date.now();
  const t0iso = nowFull();
  const r = spawnSync(process.execPath, [join(__dirname, probe), S], { encoding: 'utf8', timeout: 500000 });
  const dt = Date.now() - t0;
  const t1iso = nowFull();
  const base = probe.replace(/\.mjs$/, '');
  writeFileSync(join(LOGS, `${base}.stdout.log`), r.stdout || '', 'utf8');
  writeFileSync(join(LOGS, `${base}.stderr.log`), r.stderr || '', 'utf8');
  writeFileSync(join(LOGS, `${base}.exit`), String(r.status), 'utf8');
  const tail = (r.stdout || '').split(/\r?\n/).filter(Boolean).slice(-2).join(' | ');
  summary.push({ probe, start: t0iso, end: t1iso, ms: dt, exit: r.status, ok: r.status === 0, tail });
  console.log(`[${r.status === 0 ? 'OK' : 'FAIL'}] ${probe} exit=${r.status} ${dt}ms`);
}

const env = {
  command: `node ${join(__dirname, 'run-probes.mjs')} ${S}`,
  probes: PROBES.map((p) => `node ${join(__dirname, p)} ${S}`),
  started,
  finished: nowFull(),
  node: nodeVersion(),
  npm: npmVersion(),
  os: platform(),
  arch: arch(),
  shell: process.env.SHELL || 'powershell.exe (Windows PowerShell 5.1)',
  ttyMode: 'none (spawnSync pipe)',
  cpu: cpus().length + ' cores',
  totalmemGB: (totalmem() / 1024 ** 3).toFixed(1),
  hdkGitHead: gitHead(),
  sandboxPath: S,
  sandboxManifest: existsSync(join(S, 'MANIFEST.md')) ? join(S, 'MANIFEST.md') : null,
  envSnapshot: {
    npm_config_registry: process.env.npm_config_registry || null,
    HUAWEICLOUD_HOME: process.env.HUAWEICLOUD_HOME || null,
    HOME: homedir(),
    temp: process.env.TEMP || null,
  },
  summary,
  totals: summary.reduce((a, s) => ({ ok: a.ok + (s.ok ? 1 : 0), n: a.n + 1 }), { ok: 0, n: 0 }),
};
writeFileSync(join(LOGS, 'manifest.json'), JSON.stringify(env, null, 2), 'utf8');
console.log(`\nmanifest -> ${LOGS}\\manifest.json`);
console.log(`汇总: ${env.totals.ok}/${env.totals.n} 探针 OK`);
process.exit(env.totals.n - env.totals.ok === 0 ? 0 : 1);