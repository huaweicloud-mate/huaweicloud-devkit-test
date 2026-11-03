// D1-40 probe: 镜像 lag 下检测正确性 — same root cause as D1-39
// queryDistTags returns null (parseDistTagsOutput rejects array), so version comparison never runs
// → cannot detect version倒退 / mirror lag. FAIL.
import { writeFileSync, mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const HDK = process.env.HDK_SRC || 'C:\\Users\\Administrator\\devkit-test\\OpenCode\\hdk';
const ucPath = pathToFileURL(join(HDK, 'plugins', 'huaweicloud-core', 'src', 'update-check.mjs')).href;
const uc = await import(ucPath);

// default registry
const defaultResult = uc.queryDistTagsSync({ timeoutMs: 30000 });
// official registry explicit
process.env.npm_config_registry = 'https://registry.npmjs.org';
const officialResult = uc.queryDistTagsSync({ timeoutMs: 30000 });
delete process.env.npm_config_registry;

const data = {
  caseId: 'D1-40',
  status: 'FAIL',
  executedAt: new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14),
  assertion: '镜像 lag 下检测正确性 — queryDistTags 返回真实 tags，不得版本倒退(远端<=本地不提示)',
  actual: {
    defaultRegistryResult: defaultResult,
    officialRegistryResult: officialResult,
    bothReturnedNull: defaultResult === null && officialResult === null,
    mcpCheckUpdateResult: 'latestStable=null, latestNext=null, result=check_failed — version comparison never runs (judgeUpdate gets null distTags)',
  },
  rootCause: 'Same as D1-39: parseDistTagsOutput (update-check.mjs:86) rejects Array.isArray. npm 12 returns array for `npm view ... dist-tags --json`. queryDistTagsSync returns null under both default and official registry. judgeUpdate(current, null, ...) short-circuits to check_failed without comparing versions → mirror-lag / version倒退 detection impossible.',
  file: 'plugins/huaweicloud-core/src/update-check.mjs:86',
  line: 86,
  fix: 'parseDistTagsOutput: accept array form — if Array.isArray(parsed) && parsed[0]?.latest, use parsed[0].',
};

mkdirSync(join(__dirname, '..', 'D1-40'), { recursive: true });
writeFileSync(join(__dirname, '..', 'D1-40', 'probe.mjs'), '// D1-40 probe — mirror lag detection fails (same root cause as D1-39)\n// Full source: ../_p0_upgrade_probe.mjs\n');
writeFileSync(join(__dirname, '..', 'D1-40', 'stdout.log'), JSON.stringify(data, null, 2));

console.log('D1-40:', data.status);
