// run-probes.mjs：NR3 探针统一执行器 v2（2026-09-10T18:20:00+08:00）
// 修订（Codex review-round-03 P2）：
//  - 真北京时间转换（UTC+8h 后格式化，去毫秒），不再字符串替换 Z
//  - commit 从 .sandbox/source-commit.json 采集（fallback: MANIFEST.md），不依赖外部工作副本
//  - 统计口径双轨：探针 checks（PASS+SPEC+FAIL 行）与 OBSERVED_SPEC_MISMATCH 分开
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

// 真北京时间 ISO 8601（无毫秒）：UTC+8h 后取 UTC 字段，附加 +08:00 偏移（语义=北京时间墙钟）
function bjISO(d = new Date()) {
  const t = d instanceof Date ? d.getTime() : Number(d);
  return new Date(t + 8 * 3600 * 1000).toISOString().replace(/\.\d{3}Z$/, '+08:00');
}

const PROBES = ['d1-unit-probe.mjs', 'd1-mcp-loop.mjs', 'd1-upgrade-real.mjs', 'd1-49-d1-55-ext.mjs'];

function nodeVersion() {
  return process.version.replace('v', '');
}
function npmVersion() {
  const r = spawnSync('npm', ['--version'], { encoding: 'utf8', shell: true, timeout: 30000 });
  return String(r.stdout || '').trim();
}
// 源 commit：优先 .sandbox/source-commit.json（build-sandbox 写出），fallback MANIFEST.md 正则
function sandboxCommits() {
  const scj = join(S, 'source-commit.json');
  if (existsSync(scj)) {
    try {
      const j = JSON.parse(readFileSync(scj, 'utf8'));
      return { old: j.old, next: j.next, fixVersion: j.fixVersion, builtAt: j.builtAt };
    } catch {}
  }
  const man = join(S, 'MANIFEST.md');
  if (existsSync(man)) {
    const t = readFileSync(man, 'utf8');
    const oldM = /09a59b937eb3/.test(t);
    const nextM = /c6c0965f0bdf/.test(t);
    return { old: oldM ? '09a59b937eb3…' : null, next: nextM ? 'c6c0965f0bdf…' : null, fixVersion: null, builtAt: null };
  }
  return null;
}

const started = bjISO();
const summary = [];
let totalPass = 0;
let totalSpecObserved = 0;
let totalFail = 0;

for (const probe of PROBES) {
  const t0 = Date.now();
  const t0iso = bjISO(t0);
  const r = spawnSync(process.execPath, [join(__dirname, probe), S], { encoding: 'utf8', timeout: 500000 });
  const dt = Date.now() - t0;
  const t1iso = bjISO();
  const base = probe.replace(/\.mjs$/, '');
  writeFileSync(join(LOGS, `${base}.stdout.log`), r.stdout || '', 'utf8');
  writeFileSync(join(LOGS, `${base}.stderr.log`), r.stderr || '', 'utf8');
  writeFileSync(join(LOGS, `${base}.exit`), String(r.status), 'utf8');
  const out = r.stdout || '';
  const passN = (out.match(/^PASS /gm) || []).length;
  const specN = (out.match(/^SPEC /gm) || []).length;
  const failN = (out.match(/^FAIL /gm) || []).length;
  totalPass += passN;
  totalSpecObserved += specN;
  totalFail += failN;
  const tail = out.split(/\r?\n/).filter(Boolean).slice(-2).join(' | ');
  summary.push({ probe, start: t0iso, end: t1iso, ms: dt, exit: r.status, ok: r.status === 0, passChecks: passN, specObserved: specN, failChecks: failN, tail });
  console.log(`[${r.status === 0 ? 'OK' : 'FAIL'}] ${probe} exit=${r.status} ${dt}ms checks=PASS${passN}+SPEC${specN}`);
}

const sc = sandboxCommits();
const env = {
  command: `node ${join(__dirname, 'run-probes.mjs')} ${S}`,
  probes: PROBES.map((p) => `node ${join(__dirname, p)} ${S}`),
  started,
  finished: bjISO(),
  timezone: '+08:00 (Asia/Shanghai, 真转换 UTC+8)',
  node: nodeVersion(),
  npm: npmVersion(),
  os: platform(),
  arch: arch(),
  shell: process.env.SHELL || 'powershell.exe (Windows PowerShell 5.1)',
  ttyMode: 'none (spawnSync pipe)',
  cpu: cpus().length + ' cores',
  totalmemGB: (totalmem() / 1024 ** 3).toFixed(1),
  sandboxSourceCommits: sc,
  sandboxPath: S,
  sandboxManifest: existsSync(join(S, 'MANIFEST.md')) ? join(S, 'MANIFEST.md') : null,
  envSnapshot: {
    npm_config_registry: process.env.npm_config_registry || null,
    HUAWEICLOUD_HOME: process.env.HUAWEICLOUD_HOME || null,
    HOME: homedir(),
    temp: process.env.TEMP || null,
  },
  stats: {
    probeChecksPassed: totalPass,
    probeChecksSpecObserved: totalSpecObserved,
    probeChecksFailed: totalFail,
    probeChecksTotal: totalPass + totalSpecObserved + totalFail,
    note: '探针 checks 通过 = 成功观测到预设行为；OBSERVED_SPEC_MISMATCH 单独计数（如 D1-55b），不等于设计级 PASS。设计级口径见报告：PASS 24 / SPEC-MISMATCH 4 / FAIL 1 / BLOCKED 1',
  },
  summary,
  totals: summary.reduce((a, s) => ({ ok: a.ok + (s.ok ? 1 : 0), n: a.n + 1 }), { ok: 0, n: 0 }),
};
writeFileSync(join(LOGS, 'manifest.json'), JSON.stringify(env, null, 2), 'utf8');
console.log(`\nmanifest -> ${LOGS}\\manifest.json`);
console.log(`统计: 探针探子 checks PASS=${totalPass} OBSERVED_SPEC=${totalSpecObserved} FAIL=${totalFail} | 探针进程 ${env.totals.ok}/${env.totals.n} OK`);
console.log(`时间口径: started=${started} finished=${env.finished}（+08:00 北京时间真转换）`);
process.exit(env.totals.n - env.totals.ok === 0 ? 0 : 1);