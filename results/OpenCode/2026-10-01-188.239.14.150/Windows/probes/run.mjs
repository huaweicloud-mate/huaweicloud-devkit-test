// 探针执行器：为每个用例生成 evidence/<case-id>/probe.mjs 并真实执行
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { PACK, EVROOT } from '../_lib/lib.mjs';
import { PROBES } from './index.mjs';

function caseIds() {
    const out = [];
    for (const f of ['用例矩阵-设计级.csv', '用例矩阵-展开级.csv']) {
        const text = readFileSync(join(PACK, f), 'utf8');
        for (const line of text.split(/\r?\n/).slice(1)) {
            if (!line.trim()) continue;
            const id = line.split(',')[0].replace(/^"|"$/g, '').trim();
            if (id) out.push(id);
        }
    }
    return [...new Set(out)];
}

function writeProbe(id) {
    const dir = join(EVROOT, id);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const p = join(dir, 'probe.mjs');
    const src = `// 用例 ${id} 探针（真实执行：调用 probes/ 下该用例的实现，结论写同目录 stdout.log）
import { mk } from '../../_lib/lib.mjs';
import { PROBES } from '../../probes/index.mjs';
const ctx = mk(${JSON.stringify(id)});
try {
  await PROBES[${JSON.stringify(id)}](ctx);
} catch (e) {
  ctx.fail('探针执行异常: ' + (e && e.stack ? e.stack.split('\\n').slice(0, 4).join(' | ') : String(e)));
}
await ctx.finish();
`;
    if (!existsSync(p) || readFileSync(p, 'utf8') !== src) writeFileSync(p, src, 'utf8');
    return p;
}

function runProbe(id, timeoutMs) {
    return new Promise((resolve) => {
        const p = writeProbe(id);
        const child = spawn(process.execPath, [p], {
            cwd: PACK, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true,
            env: { ...process.env, NO_COLOR: '1' }
        });
        let out = '', err = '';
        child.stdout.on('data', (d) => { out += d; process.stdout.write(d); });
        child.stderr.on('data', (d) => { err += d; });
        const timer = setTimeout(() => { try { child.kill(); } catch { } }, timeoutMs);
        child.on('close', (code) => { clearTimeout(timer); resolve({ id, code, out, err }); });
        child.on('error', (e) => { clearTimeout(timer); resolve({ id, code: -1, out, err: String(e) }); });
    });
}

const all = caseIds();
const ids = all.filter((id) => PROBES[id]);
const missing = all.filter((id) => !PROBES[id]);
console.log(`[runner] 用例总数=${all.length} 已实现探针=${ids.length} 未实现=${missing.length}`);
if (process.env.HDK_SHOW_MISSING === '1') console.log(`[runner] 未实现: ${missing.join(', ')}`);
const only = process.argv[2] ? process.argv[2].split(',') : null;
const targets = only ? ids.filter((i) => only.includes(i)) : ids;
const t0 = Date.now();
const failed = [];
for (const id of targets) {
    const r = await runProbe(id, Number(process.env.HDK_PROBE_TIMEOUT || 420000));
    if (r.code !== 0) failed.push(`${id}(code=${r.code})`);
}
console.log(`[runner] 完成 ${targets.length} 条，耗时 ${Math.round((Date.now() - t0) / 1000)}s，异常退出 ${failed.length} 条 ${failed.join(',')}`);
