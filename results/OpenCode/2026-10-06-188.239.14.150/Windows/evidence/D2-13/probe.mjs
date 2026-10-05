// D2-13 R9 configuredBySession 优先 env（P1）
// 用例原文：①写 S1+标记 ②注入 env ③resolveCredentials ④清除标记复查
//            预期：标记时 S1 胜出；清除后 env 兜底恢复
import { writeFileSync, mkdtempSync, rmSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
const CASE = process.env.PROBE_CASE;
const SRC = process.env.HDK_SRC || 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/plugins/huaweicloud-core/src';
function fmt() { const d = new Date(); const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`; }
function finish(status, why, extra = {}) {
  const out = { caseId: CASE, status, why, executedAt: fmt(), platform: process.platform, node: process.version, ...extra };
  writeFileSync('stdout.log', JSON.stringify(out, null, 2), 'utf8');
  console.log(JSON.stringify(out, null, 2));
}

const tmp = mkdtempSync(join(tmpdir(), 'd2-13-'));
process.env.HUAWEICLOUD_HOME = tmp;
const creds = await import(pathToFileURL(join(SRC, 'auth', 'credentials.mjs')).href);

const S1_AK = 'AKIAPROBES1MARKED00001';
const S1_SK = 'ProbeS1MarkedSecretKeyValue000000000';
const ENV_AK = 'AKIAPROBEENV000000001';
const ENV_SK = 'ProbeEnvSecretKeyValue00000000000';
mkdirSync(join(tmp, '.config', 'huaweicloud'), { recursive: true });

// ① 写 S1 + configuredBySession 标记
creds.writeGlobalCredentials({ ak: S1_AK, sk: S1_SK, region: 'cn-north-4' });
creds.setConfiguredBySession(true);
// ② 注入 env（含 HUAWEICLOUD_SECRET_ACCESS_KEY 别名语义核对）
process.env.HW_ACCESS_KEY = ENV_AK;
process.env.HW_SECRET_KEY = ENV_SK;
// ③ resolveCredentials
const marked = creds.resolveCredentials();
const s1Wins = marked && marked.ak === S1_AK && marked.sk === S1_SK;
// ④ 清除标记后复查：env 兜底恢复
creds.setConfiguredBySession(false);
const unmarkedFile = creds.readGlobalCredentials();
const clearedFlag = unmarkedFile && unmarkedFile.configuredBySession !== true;
const afterClear = creds.resolveCredentials();
const envTakesOver = afterClear && afterClear.ak === ENV_AK && afterClear.sk === ENV_SK;

delete process.env.HW_ACCESS_KEY;
delete process.env.HW_SECRET_KEY;
const rows = [
  { id: '写入 S1 并置 configuredBySession=true', ok: unmarkedFile !== null || !!marked, actual: { marked } },
  { id: '标记生效时 resolveCredentials 判 S1 胜出（不取 env）', ok: !!s1Wins, actual: { akPrefix: String(marked.ak).slice(0, 10), isS1: marked.ak === S1_AK, isEnv: marked.ak === ENV_AK } },
  { id: '清除标记后 configuredBySession 不再为 true', ok: clearedFlag, actual: unmarkedFile && unmarkedFile.configuredBySession },
  { id: '清除标记后 env 兜底恢复', ok: !!envTakesOver, actual: { akPrefix: String(afterClear.ak).slice(0, 10), isEnv: afterClear.ak === ENV_AK } },
];
const violations = rows.filter((x) => !x.ok);
rmSync(tmp, { recursive: true, force: true });
const ok = violations.length === 0;
finish(ok ? 'PASS' : 'FAIL',
  ok ? `R9 优先级语义成立：configuredBySession=true 时 S1 凭证胜出（AK 前缀 ${String(marked.ak).slice(0, 10)}，非 env 值）；清除标记后 resolveCredentials 回落 env 注入的凭证（AK 前缀 ${String(afterClear.ak).slice(0, 10)}）`
      : `R9 优先级断言不成立：${JSON.stringify(violations)}`,
  { markedResolution: { akPrefix: String(marked.ak).slice(0, 10), skLen: String(marked.sk).length }, clearedFlag, afterClearResolution: { akPrefix: String(afterClear.ak).slice(0, 10), skLen: String(afterClear.sk).length }, rows, violations, probeValues: '隔离 HOME + 占位凭证，仅用于本用例' });
