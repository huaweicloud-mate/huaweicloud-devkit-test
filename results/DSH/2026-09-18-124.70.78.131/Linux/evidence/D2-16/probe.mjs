// D2-16 import文件读取后擦除：auth_switch mode=import action=persist → 读 creds-import.json → 持久化 → 无条件擦除(exists=False)
import { pathToFileURL } from 'node:url';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SRC = '/home/testbot2/devkit-test/DSH/hdk/plugins/huaweicloud-core/src';
const { callTool } = await import(pathToFileURL(SRC + '/tools.mjs').href);

const HOME = mkdtempSync(join(tmpdir(), 'hdktest-d216-'));
const cfg = join(HOME, '.config', 'huaweicloud');
mkdirSync(cfg, { recursive: true });
process.env.HUAWEICLOUD_HOME = HOME;
process.env.HCLOUD_OBS_CONFIG_PATH = join(HOME, 'obsutilconfig');
process.env.HCLOUD_BIN = '/bin/true';

const importPath = join(cfg, 'creds-import.json');
const AK = 'AKIAIMPORT00000000000000000';
const SK = 'skimportskimport000000000000';
const creds = { ak: AK, sk: SK, region: 'cn-north-4' };
writeFileSync(importPath, JSON.stringify(creds), 'utf8');
console.log('BEFORE import file exists:', existsSync(importPath));

const res = await callTool('huaweicloud_auth_switch', { mode: 'import', action: 'persist' });
console.log('RESULT', JSON.stringify(res));

const afterExists = existsSync(importPath);
console.log('AFTER import file exists:', afterExists);
// 校验 S1 已写入导入的 ak 指纹（用于证明确实"读"了文件再擦除）
let s1ak = '';
try { s1ak = JSON.parse(readFileSync(join(cfg,'credentials.json'),'utf8')).ak || ''; } catch {}
console.log('S1.ak == import ak:', s1ak === AK);

const passed = afterExists === false && s1ak === AK && (res.status === 'ok' || res.status === 'partial');
console.log('ASSERT 读后擦除(exists=False):', afterExists === false);
console.log('VERDICT', passed ? 'PASS' : 'FAIL');
process.exit(afterExists === false && s1ak === AK ? 0 : 1);
