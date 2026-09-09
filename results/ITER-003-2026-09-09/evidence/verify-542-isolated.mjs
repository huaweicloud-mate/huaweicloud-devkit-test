// #542 现象3 隔离验证：s2CurrentMatchesLastDevkitSync 修复语义
// 模拟 authEncrypt 落盘（KooCLI 指纹 ≠ S1 明文指纹）：
//   A 无 last_sync → 应报 S2-current 不一致（行为不倒退，1.1.1 行为）
//   B last_sync 匹配（devkit 自己 sync 的，指纹=当前 KooCLI 读法值）→ 不报（修复目标）
//   C last_sync 存在但 kooCliProfile 不匹配 → 仍报（防误吞真实不一致）
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fingerprint } from 'file:///C:/Users/Administrator/devkit-test/hdk/plugins/huaweicloud-core/src/auth/reconcile.mjs';

const home = mkdtempSync(join(tmpdir(), 'hdk-542-'));
mkdirSync(join(home, '.config', 'huaweicloud'), { recursive: true });
mkdirSync(join(home, '.hcloud'), { recursive: true });

const AK = 'FAKEAK1234567890ABCD';
const SK = 'FAKESK0987654321WXYZ';
// 模拟 KooCLI 7.x SK 落盘格式转换（#542 现象3）：AK 明文可读 == S1，SK 指纹计算差异
// → 1.1.1：s1Fp(明文) ≠ currentFp(SK转换) → 误报 S2-current 不一致
const CONVERTED_SK = 'KooCLI7x-formatted:' + SK;
writeFileSync(join(home, '.config', 'huaweicloud', 'credentials.json'),
  JSON.stringify({ ak: AK, sk: SK }), { encoding: 'utf8' });
// KooCLI 落盘：AK 明文（==S1），SK 转换格式（指纹 ≠ S1 明文指纹）
writeFileSync(join(home, '.hcloud', 'config.json'),
  JSON.stringify({ current: 'default', profiles: [{ name: 'default', accessKeyId: AK, secretAccessKey: CONVERTED_SK }] }), { encoding: 'utf8' });

// devkit sync 写入的 last_sync：s1Fingerprint = S1 明文指纹（syncAuth 写 fingerprint(credentials.ak, credentials.sk)）
const s1Fp = fingerprint(AK, SK);
const currentFp = fingerprint(AK, CONVERTED_SK);
console.log('  s1Fp:', s1Fp, '| currentFp(SK转换):', currentFp, '→ 1.1.1 会误报不一致');

function runScan(label, extraFiles) {
  const setup = `
    import { writeFileSync, mkdirSync } from 'node:fs';
    import { join } from 'node:path';
    mkdirSync(join(process.env.HUAWEICLOUD_HOME, '.config', 'huaweicloud'), { recursive: true });
    if (${JSON.stringify(extraFiles)}) {
      writeFileSync(join(process.env.HUAWEICLOUD_HOME, '.config', 'huaweicloud', '.last_sync'),
        JSON.stringify(${JSON.stringify(extraFiles)}), { encoding: 'utf8' });
    }
    const { exportStateForStatus, scanState, readKooCliProfiles } = await import('file:///C:/Users/Administrator/devkit-test/hdk/plugins/huaweicloud-core/src/auth/reconcile.mjs');
    scanState();
    const st = exportStateForStatus();
    const k = readKooCliProfiles();
    console.log(JSON.stringify({
      s1Fp: st.stores?.s1Fingerprint,
      currentFp: st.stores?.currentFingerprint,
      s2Count: (st.inconsistencies || []).filter(i => i.store === 'S2-current').length,
      inconsistent: st.inconsistent,
      kooCliCurrent: st.kooCliCurrent,
    }));
  `;
  const r = spawnSync('node', ['--input-type=module', '-e', setup], {
    env: { ...process.env, HUAWEICLOUD_HOME: home, USERPROFILE: home, HOME: home },
    encoding: 'utf8', timeout: 30000, windowsHide: true,
  });
  console.log(`[${label}]`, r.status === 0 ? r.stdout.trim() : 'EXIT ' + r.status + ' ' + (r.stderr || '').slice(0, 300));
}

runScan('A 无 last_sync（1.1.1 基线行为：应报 S2-current 不一致）', null);

const lastSync = { ts: Date.now(), kooCliProfile: 'default', s1Fingerprint: s1Fp };
runScan('B 匹配 last_sync（修复目标：S2-current 不再报）', lastSync);

const wrongProfile = { ts: Date.now(), kooCliProfile: 'other', s1Fingerprint: s1Fp };
runScan('C last_sync profile 不匹配（防误吞：应仍报）', wrongProfile);

rmSync(home, { recursive: true, force: true });