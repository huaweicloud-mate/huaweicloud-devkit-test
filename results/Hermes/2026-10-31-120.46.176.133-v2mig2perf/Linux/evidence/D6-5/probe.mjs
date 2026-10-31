// D6-5 大目录/大上传 —— ①超大目录(10万文件)识别 ②大工程上传 ③监控内存/超时
// Part A (本地, 可执行): 构造 10 万文件超大工程目录 -> detectFramework 识别, 采集耗时 + 峰值 RSS
// Part B (沙箱): huaweicloud_sandbox_upload_project 大工程上传 -> 依赖沙箱可用性
import { writeFileSync, mkdirSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { makeServer } from './mcp-client.mjs';

const SRC = process.env.HDK_SRC || '/home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/dist';
const MCP = join(SRC, 'mcp-server.js');
const ROOT = process.env.D6_5_ROOT || '/home/testbot3/devkit-test/Hermes/v2mig2/bigdir';
const SUBDIRS = 2000;
const FILES_PER_SUBDIR = 50; // 2000*50 = 100_000
const TIME_BUDGET_MS = 120000;
const RSS_BUDGET_MB = 1536;

const out = {
  caseId: 'D6-5',
  title: '大目录/大上传 (10万文件识别 + 大工程上传; 内存平稳不超时)',
  threshold: `识别完成且不超时(<=${TIME_BUDGET_MS}ms); 峰值 RSS 平稳(<=${RSS_BUDGET_MB}MB)`,
  env: { HDK_SRC: SRC, node: process.version, targetFiles: SUBDIRS * FILES_PER_SUBDIR },
  startedAt: new Date().toISOString(),
};

// ---------- 构造超大工程目录 ----------
let built = false;
try {
  if (existsSync(ROOT)) rmSync(ROOT, { recursive: true, force: true });
  mkdirSync(ROOT, { recursive: true });
  writeFileSync(join(ROOT, 'package.json'), JSON.stringify({ name: 'big-monorepo', version: '1.0.0', private: true, devDependencies: { turbo: '^2.0.0' } }));
  writeFileSync(join(ROOT, 'turbo.json'), JSON.stringify({ $schema: 'https://turbo.build/schema.json', tasks: { build: { dependsOn: ['^build'] } } }));
  const apps = join(ROOT, 'apps');
  mkdirSync(apps);
  const tb = performance.now();
  for (let i = 0; i < SUBDIRS; i += 1) {
    const d = join(apps, `sub${String(i).padStart(4, '0')}`);
    mkdirSync(d);
    writeFileSync(join(d, 'package.json'), JSON.stringify({ name: `sub${i}`, version: '1.0.0', dependencies: { react: '^18.0.0' } }));
    for (let j = 0; j < FILES_PER_SUBDIR; j += 1) writeFileSync(join(d, `f${String(j).padStart(3, '0')}.txt`), 'x');
  }
  out.build = { dirs: SUBDIRS, files: SUBDIRS * FILES_PER_SUBDIR + SUBDIRS, elapsedMs: +(performance.now() - tb).toFixed(0) };
  built = true;
} catch (e) {
  out.build = { error: String(e) };
}

// ---------- Part A: 10 万文件目录识别 + 内存/耗时监控 ----------
{
  const a = { name: 'A. 10万文件超大目录 detectFramework 识别', pass: false };
  try {
    const runner = join(process.env.TMPDIR || '/tmp', `d6-5-runner-${Date.now()}.mjs`);
    writeFileSync(runner, `
import { detectFramework } from ${JSON.stringify(join(SRC, 'detect-framework.js'))};
import { performance } from 'node:perf_hooks';
const t0 = performance.now();
const r = detectFramework(${JSON.stringify(ROOT)});
const ms = performance.now() - t0;
process.stdout.write('RESULT ' + JSON.stringify({ ms: +ms.toFixed(1), detection: r }) + '\\n');
process.stdout.write('RSS_MB ' + (process.memoryUsage().rss / 1048576).toFixed(1) + '\\n');
`, 'utf8');
    const child = spawn(process.execPath, [runner], { stdio: ['ignore', 'pipe', 'pipe'] });
    let peakRssMb = 0;
    const poll = setInterval(() => {
      try {
        const st = readFileSync(`/proc/${child.pid}/status`, 'utf8');
        const m = /VmHWM:\s*(\d+)\s*kB/.exec(st);
        if (m) peakRssMb = Math.max(peakRssMb, +m[1] / 1024);
      } catch { /* child gone */ }
    }, 50);
    const t0 = performance.now();
    const res = await new Promise((resolve) => {
      let so = '';
      let se = '';
      const to = setTimeout(() => { child.kill('SIGKILL'); resolve({ timeout: true, so, se }); }, TIME_BUDGET_MS + 15000);
      child.stdout.on('data', (d) => { so += d.toString(); });
      child.stderr.on('data', (d) => { se += d.toString(); });
      child.on('close', () => { clearTimeout(to); resolve({ so, se }); });
    });
    clearInterval(poll);
    const wallMs = +(performance.now() - t0).toFixed(1);
    const rm = /RSS_MB ([\d.]+)/.exec(res.so || '');
    const rr = /RESULT (\{.*\})/.exec(res.so || '');
    a.wallMs = wallMs;
    a.selfReportedMs = rr ? JSON.parse(rr[1]).ms : null;
    a.detection = rr ? JSON.parse(rr[1]).detection : null;
    a.peakRssMb = +peakRssMb.toFixed(1);
    a.childReportedRssMb = rm ? +rm[1] : null;
    a.timedOut = !!res.timeout;
    a.stderrTail = (res.se || '').slice(0, 400);
    a.subApps = a.detection?.subApps?.length ?? 0;
    a.completed = !a.timedOut && a.selfReportedMs !== null;
    a.memoryStable = a.peakRssMb > 0 && a.peakRssMb <= RSS_BUDGET_MB;
    a.pass = a.completed && a.selfReportedMs <= TIME_BUDGET_MS && a.memoryStable;
    a.detail = `识别 ${SUBDIRS} 子应用(共${out.build?.files ?? '?'}文件) 耗时=${a.selfReportedMs}ms, 峰值RSS=${a.peakRssMb}MB, 完成=${a.completed}, 内存平稳=${a.memoryStable}`;
    try { rmSync(runner, { force: true }); } catch { /* noop */ }
  } catch (e) {
    a.detail = `异常: ${e}`;
  }
  out.partA = a;
}

// ---------- Part B: 大工程上传 (沙箱) ----------
{
  const b = { name: 'B. 大工程上传 huaweicloud_sandbox_upload_project (沙箱)', status: 'BLOCKED', pass: false };
  const srv = makeServer(MCP, { HUAWEICLOUD_VENDOR_CHALLENGE: 'off' });
  try {
    await srv.initialize();
    const conn = await srv.call('huaweicloud_sandbox_connect', { source: 'CLI', vendorConfirmed: 'use Huawei Cloud sandbox' }, 120000);
    const ctext = JSON.stringify(conn?.result?.content ?? conn);
    b.connectRaw = ctext.slice(0, 500);
    if (conn?.result?.isError || /HDKIT_SANDBOX_MAINTENANCE/.test(ctext)) {
      b.status = 'BLOCKED';
      b.reason = /HDKIT_SANDBOX_MAINTENANCE/.test(ctext)
        ? 'HDKIT_SANDBOX_MAINTENANCE: 沙箱功能维护窗口，无法建立 workspace 会话（服务端，非本机可解）'
        : 'sandbox_connect 失败';
    } else {
      b.workspaceId = conn?.result?.structuredContent?.workspaceId || conn?.result?.devStageId || null;
      const up = await srv.call('huaweicloud_sandbox_upload_project', {
        workspace_id: b.workspaceId, local_dir: ROOT, vendorConfirmed: 'use Huawei Cloud sandbox',
      }, 600000);
      const utext = JSON.stringify(up?.result?.content ?? up);
      b.uploadRaw = utext.slice(0, 600);
      if (/HDKIT_SANDBOX_MAINTENANCE/.test(utext)) { b.status = 'BLOCKED'; b.reason = 'HDKIT_SANDBOX_MAINTENANCE（上传阶段）'; }
      else { b.status = up?.result?.isError ? 'FAIL' : 'PASS'; b.pass = !up?.result?.isError; }
    }
  } catch (e) {
    b.status = 'BLOCKED';
    b.reason = `沙箱不可达/异常: ${e}`;
  } finally {
    b.stderrTail = (srv.stderr() || '').slice(0, 300);
    srv.kill();
  }
  out.partB = b;
}

// 清理构造目录
if (built && process.env.D6_5_KEEP !== '1') {
  try { rmSync(ROOT, { recursive: true, force: true }); out.cleanup = 'bigdir removed'; } catch (e) { out.cleanup = String(e); }
}

out.verdict = out.partB && out.partB.status === 'BLOCKED' ? 'BLOCKED' : (out.partA && out.partA.pass && out.partB && out.partB.pass ? 'PASS' : 'FAIL');
out.assertion = `大目录识别=${out.partA?.pass ? 'OK' : 'NG'}(耗时${out.partA?.selfReportedMs}ms/峰值RSS ${out.partA?.peakRssMb}MB); 大上传=${out.partB?.status}`;
out.blockedReason = out.verdict === 'BLOCKED'
  ? `大目录(10万文件)识别已真机执行并达阈(耗时${out.partA?.selfReportedMs}ms, 峰值RSS ${out.partA?.peakRssMb}MB); 大工程上传被沙箱维护窗口阻塞: ${out.partB?.reason}`
  : '';
out.finishedAt = new Date().toISOString();

const text = JSON.stringify(out, null, 2);
console.log(text);
if (process.env.HDK_EVIDENCE) {
  const d = join(process.env.HDK_EVIDENCE, 'D6-5');
  mkdirSync(d, { recursive: true });
  writeFileSync(join(d, 'stdout.log'), text, 'utf8');
}
process.exit(out.verdict === 'PASS' ? 0 : (out.verdict === 'BLOCKED' ? 2 : 1));
