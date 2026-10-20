// 探针: D3-C2 —— OBS 静态站部署 E2E（真实建删资源并归零）
// 真实 hcloud OBS：mb 建桶 → cp 上传(public-read) → curl 公网可达 → 删除对象 → 删除空桶 → 归零验证。
// 注意：本沙箱 ~/.obsutil_output 只读，递归 rm -r 会因写报告失败，故用单对象删除 + 空桶删除两段式归零。
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const REGION = 'cn-north-4';
const bucket = `testbot2-dsh-obs-${String(Date.now()).slice(-10)}`;
const sh = (args) => { const r = spawnSync('hcloud', args, { encoding: 'utf8', timeout: 120000 }); return { ok: r.status === 0, text: ((r.stdout||'') + (r.stderr||'')).trim() }; };
const run = (cmd) => { const r = spawnSync('bash', ['-c', cmd], { encoding: 'utf8', timeout: 120000 }); return { ok: r.status === 0, text: ((r.stdout||'') + (r.stderr||'')).trim() }; };

const dir = mkdtempSync(join(tmpdir(), 'hdk-site-'));
writeFileSync(join(dir, 'index.html'), '<html><body>hdk-daily-test-ok</body></html>', 'utf-8');
const det = [];
let mb = false, cp = false, curl200 = false, del = false, zero = false;
try {
  const m = sh(['OBS', 'mb', `obs://${bucket}`, `-location=${REGION}`]);
  mb = m.ok || /success|create bucket/i.test(m.text);
  det.push(`mb=${mb}`);
  const c = sh(['OBS', 'cp', `${dir}/index.html`, `obs://${bucket}/index.html`, '-f', '-acl=public-read']);
  cp = c.ok || /success/i.test(c.text);
  det.push(`cp=${cp}`);
  const cr = run(`curl -s -o /dev/null -w "%{http_code}" --max-time 30 https://${bucket}.obs.${REGION}.myhuaweicloud.com/index.html`);
  curl200 = String(cr.text).trim() === '200';
  det.push(`curl=${cr.text}`);
} finally {
  rmSync(dir, { recursive: true, force: true });
  sh(['OBS', 'rm', `obs://${bucket}/index.html`, '-f']);
  const db = sh(['OBS', 'rm', `obs://${bucket}`, '-f']);
  del = db.ok || /successfully/i.test(db.text);
  const l = sh(['OBS', 'ls']);
  zero = !l.text.includes(bucket);
  det.push(`del=${del} zero=${zero}`);
}
const status = (mb && cp && curl200 && del && zero) ? 'PASS' : 'FAIL';
const why = `OBS 静态站部署 E2E: mb=${mb} cp=${cp} curl200=${curl200} del=${del} 归零=${zero}（已真机建删归零）`;
writeFileSync(join(here, 'stdout.log'), JSON.stringify({ status, why, executedAt: new Date().toISOString().replace(/[-:TZ]/g,'').slice(0,14), detail: det.join('|') }) + '\n');
process.stdout.write(JSON.stringify({ status, why, detail: det.join('|') }) + '\n');
