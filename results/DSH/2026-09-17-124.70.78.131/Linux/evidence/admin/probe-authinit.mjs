// DSH/Linux daily probe — auth init 三端同步 (D2-1, source-level, hermetic + real KooCLI)
import { mkdtempSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir, homedir } from 'node:os';
import { join } from 'node:path';
const TMP = mkdtempSync(join(tmpdir(), 'hdk-authinit-'));
process.env.HUAWEICLOUD_HOME = TMP;                       // S1 沙箱凭证目录
process.env.HCLOUD_OBS_CONFIG_PATH = join(TMP, 'obsutilconfig'); // S3 OBS 凭证目录
// 注意：不设置 HCLOUD_CONFIG_PATH，让 S2 读真实 KooCLI ~/.hcloud/config.json
delete process.env.HW_ACCESS_KEY; delete process.env.HW_SECRET_KEY; delete process.env.HW_SECURITY_TOKEN;

const CORE = 'file:///home/testbot2/nodejs/lib/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src';
const cred = await import(CORE + '/auth/credentials.mjs');
const rec = await import(CORE + '/auth/reconcile.mjs');
const results = [];
function check(id, name, pass, actual) { results.push({ id, name, pass: !!pass, actual: typeof actual === 'string' ? actual : JSON.stringify(actual) }); }

const AK = 'AUTHINITAK000000000001', SK = 'AUTHINITSK000000000001', REGION = 'cn-north-4';
try {
  // S1 沙箱凭证端：writeGlobalCredentials → readGlobalCredentials 匹配
  cred.writeGlobalCredentials({ ak: AK, sk: SK, region: REGION });
  const s1 = cred.readGlobalCredentials();
  check('D2-1', 'S1 沙箱凭证落位 (writeGlobalCredentials→read ak 匹配)', s1 && s1.ak === AK, s1 && s1.ak);

  // S3 OBS 端：writeObsConfig → obsutilconfig flat key=value 落位
  const obs = cred.writeObsConfig({ ak: AK, sk: SK, region: REGION });
  const obsWritten = existsSync(obs.path);
  const obsHasAk = obsWritten && String(readFileSync(obs.path, 'utf8')).includes(`ak=${AK}`);
  check('D2-1', 'S3 OBS 配置落位 (obsutilconfig ak= 写入)', obsWritten && obsHasAk, `exists=${obsWritten} hasAk=${obsHasAk}`);

  // S2 KooCLI 端：真实 ~/.hcloud/config.json 已含 current profile + region（doctor 已确认 hcloud credentials configured）
  const kcPath = join(homedir(), '.hcloud', 'config.json');
  let kcOk = false, kcDetail = 'missing';
  if (existsSync(kcPath)) {
    const cfg = JSON.parse(readFileSync(kcPath, 'utf8'));
    kcOk = cfg.current === 'default' && Array.isArray(cfg.profiles) && cfg.profiles.length >= 1 && !!cfg.profiles[0].region;
    kcDetail = `current=${cfg.current} profiles=${cfg.profiles?.length} region=${cfg.profiles?.[0]?.region}`;
  }
  check('D2-1', 'S2 KooCLI 配置落位 (current profile + region)', kcOk, kcDetail);
} catch (e) {
  check('D2-1', '三端同步无异常抛出', false, 'throw: ' + e.message);
}

const failed = results.filter(r => !r.pass);
console.log('=== AUTH-INIT PROBE RESULTS (v1.1.4 stable) ===');
console.log(`total=${results.length} pass=${results.length - failed.length} fail=${failed.length}`);
for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.id}  ${r.name}  => ${r.actual}`);
if (failed.length) { console.log('--- FAILED ---'); for (const r of failed) console.log(`  ${r.id} ${r.name} => ${r.actual}`); }
rmSync(TMP, { recursive: true, force: true });