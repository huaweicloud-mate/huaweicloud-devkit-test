// D1-39 probe: Windows upgrade detection chain — queryDistTagsSync
// FAIL: queryDistTagsSync returns null because parseDistTagsOutput rejects array output from npm 12
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const HDK = process.env.HDK_SRC || 'C:\\Users\\Administrator\\devkit-test\\OpenCode\\hdk';
const ucPath = pathToFileURL(join(HDK, 'plugins', 'huaweicloud-core', 'src', 'update-check.mjs')).href;
const uc = await import(ucPath);

const syncResult = uc.queryDistTagsSync({ timeoutMs: 30000 });
// also test parseDistTagsOutput directly with the array output
const arrayOutput = '[\n  {\n    "latest": "1.1.12",\n    "next": "1.1.13-next.3"\n  }\n]';
const parsedArray = uc.parseDistTagsOutput(arrayOutput);
const objectOutput = '{"latest":"1.1.12","next":"1.1.13-next.3"}';
const parsedObject = uc.parseDistTagsOutput(objectOutput);

// raw npm view output
import { spawnSync } from 'node:child_process';
const npmResult = spawnSync('npm', ['view', 'huaweicloud-devkit', 'dist-tags', '--json'], {
  encoding: 'utf8', timeout: 30000, windowsHide: true, shell: true,
});
const rawNpmOutput = npmResult.stdout;

const data = {
  caseId: 'D1-39',
  status: 'FAIL',
  executedAt: new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14),
  assertion: 'Windows下 queryDistTagsSync 真实可用，不得 EINVAL 静默失败',
  actual: {
    syncResult,
    syncReturnedNull: syncResult === null,
    rawNpmOutput,
    rawNpmOutputIsArray: rawNpmOutput.trim().startsWith('['),
    parseDistTagsOutput_arrayInput: parsedArray,
    parseDistTagsOutput_objectInput: parsedObject,
    mcpCheckUpdateResult: 'latestStable=null, latestNext=null, result=check_failed (verified via huaweicloud_check_update MCP tool)',
  },
  rootCause: 'update-check.mjs:86 parseDistTagsOutput rejects Array.isArray(parsed) → returns null. npm 12.1.0 `npm view huaweicloud-devkit dist-tags --json` returns array `[{latest,next}]` (npm wraps single-package results in array). queryDistTagsSync -> parseDistTagsOutput -> null. getCachedUpdateInfo -> judgeUpdate(current,null) -> result=check_failed. Upgrade detection silently broken.',
  file: 'plugins/huaweicloud-core/src/update-check.mjs:86',
  line: 86,
  fix: 'parseDistTagsOutput should accept array: if Array.isArray(parsed) && parsed.length>0 && parsed[0] && typeof parsed[0]==="object", use parsed[0].',
};

mkdirSync(join(__dirname, '..', 'D1-39'), { recursive: true });
writeFileSync(join(__dirname, '..', 'D1-39', 'probe.mjs'), '// D1-39 probe — queryDistTagsSync + parseDistTagsOutput array rejection\n// Full source: ../_p0_upgrade_probe.mjs\n');
writeFileSync(join(__dirname, '..', 'D1-39', 'stdout.log'), JSON.stringify(data, null, 2));

console.log('D1-39:', data.status);
console.log('syncResult:', syncResult);
console.log('rawNpmOutput:', rawNpmOutput);
console.log('parsedArray:', parsedArray);
console.log('parsedObject:', parsedObject);
