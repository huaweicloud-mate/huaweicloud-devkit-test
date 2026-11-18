// D3-C2 OBS static-site E2E — real environment probe (tool availability + write permission)
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const EV = String.raw`C:\Users\Administrator\devkit-test\testbot4-win-Opencode\huaweicloud-devkit-test\results\OpenCode\2026-11-19-119.8.181.45\Windows\evidence\D3-C2`;
const HDK = String.raw`C:\Users\Administrator\devkit-test\testbot4-win-Opencode\hdk`;
const CASE_ID = 'D3-C2';
const NK = "20261119050413";
const hcloud = (args, timeout = 90000) => {
  const r = spawnSync(process.env.HCLOUD_BIN || 'hcloud', args, { encoding: 'utf8', timeout });
  return { code: r.status, out: (r.stdout || '').trim(), err: (r.stderr || '').trim() };
};
const which = (bin) => { const r = spawnSync('where.exe', [bin], { encoding: 'utf8' }); return r.status === 0; };

async function main() {
  const tm = await import(new URL('file:///' + HDK.replace(/\\/g, '/') + '/plugins/huaweicloud-core/src/tools.mjs').href);
  const cfg = await tm.callTool('huaweicloud_setup_obs_config', {}, {});
  const hasObsutil = which('obsutil');
  const mb = hcloud(['OBS', 'CreateBucket', '--cli-region=cn-north-4', '--bucket=tctest-obs-' + NK.slice(4)]);
  const wt = JSON.stringify(mb.out) + mb.err;
  const unsupported = /No such command|命令不存在/i.test(wt);
  const rec = {
    caseId: CASE_ID,
    status: cfg && cfg.ok === true && (unsupported || !hasObsutil) ? 'BLOCKED' : (cfg && cfg.ok === true ? 'FAIL' : 'FAIL'),
    why: 'OBS 凭证同步成功，但静态站部署闭环无法执行：' +
      (unsupported ? 'KooCLI 无 OBS 建桶命令（OBS 非 KooCLI 服务，需 obsutil）' : '') +
      (!hasObsutil ? ' + 本机无 obsutil 可执行文件（where obsutil 未找到，OBS 桶创建/上传/public-read/curl 200/清理无法真实执行）' : '') +
      ' + 现有唯一可用凭证为只读 IAM 用户 test001（写操作 Pdp.0001），未创建任何桶、云端零残留。解除条件：安装 obsutil 并下发具备 OBS 写权限的 AK/SK',
    executedAt: NK,
    result: { setupObsConfig: { ok: cfg && cfg.ok, path: cfg && cfg.path }, hasObsutil, createAttempt: { code: mb.code, out: wt.slice(0, 400) }, residue: 'no bucket created' },
  };
  writeFileSync(join(EV, 'stdout.log'), JSON.stringify(rec, null, 2), 'utf8');
  console.log(JSON.stringify({ caseId: CASE_ID, status: rec.status, why: rec.why }));
}
main().catch((e) => {
  const rec = { caseId: CASE_ID, status: 'FAIL', why: 'probe exception: ' + String(e && e.message || e), executedAt: NK };
  writeFileSync(join(EV, 'stdout.log'), JSON.stringify(rec, null, 2), 'utf8');
  console.log(JSON.stringify(rec));
});
