// DSH/Linux daily probe — install/manifest/rules (v1.1.4 stable)
import { readFileSync, existsSync, readdirSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir, homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const results = [];
function check(id,name,pass,actual){results.push({id,name,pass:!!pass,actual:typeof actual==='string'?actual:JSON.stringify(actual)});}
const __dirname = dirname(fileURLToPath(import.meta.url));
const CORE = 'file:///home/testbot2/nodejs/lib/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src';
const PKG = '/home/testbot2/nodejs/lib/node_modules/huaweicloud-devkit';
const HDNAME = process.env.HOME;

// ---- D4-23 全局规则注入 (rules/huawei-agent-rules.mdc) ----
const pkgJson = JSON.parse(readFileSync(join(PKG,'package.json'),'utf8'));
const filesHasRules = (pkgJson.files||[]).includes('rules');
const pkgHasRulesDir = existsSync(join(PKG,'rules'));
const srcHasRules = existsSync('/home/testbot2/devkit-test/DSH/hdk/rules/huawei-agent-rules.mdc');
check('D4-23','package.json files includes "rules"', filesHasRules, JSON.stringify(pkgJson.files));
check('D4-23','installed package contains rules/', pkgHasRulesDir, pkgHasRulesDir);

// Hermetic install --target dsh into temp DSH_HOME, then scan for huawei-agent-rules.*
const tmpHome = mkdtempSync(join(tmpdir(), 'hdk-install-test-'));
const dshHome = join(tmpHome, 'dshhome');
const res = spawnSync(process.execPath, [join(PKG,'bin','setup.cjs'), 'install', '--target', 'dsh'], {
  env: { ...process.env, HOME: tmpHome, DSH_HOME: dshHome, HUAWEICLOUD_HOME: tmpHome },
  encoding: 'utf8', timeout: 60000,
});
let rulesFound = 0;
function scan(dir, depth) {
  if (!existsSync(dir) || depth < 0) return;
  for (const e of readdirSync(dir, {withFileTypes:true})) {
    const p = join(dir, e.name);
    if (e.isDirectory()) scan(p, depth-1);
    else if (/agent-rules/i.test(e.name)) rulesFound++;
  }
}
scan(tmpHome, 4);
check('D4-23','install --target dsh injects huawei-agent-rules', rulesFound > 0, `found=${rulesFound} exit=${res.status}`);
check('D4-23','src hdk rules/huawei-agent-rules.mdc exists (orphan)', srcHasRules, srcHasRules);

// ---- D1-1 全新环境引导安装 (hermetic: 全新 HOME + install --target dsh) ----
check('D1-1','install --target dsh completes (exit 0)', res.status===0, `exit=${res.status}`);
check('D1-1','install 输出含引导(下一步/重启)', /下一步|重启|DSH/.test(res.stdout||''), String(res.stdout||'').slice(-600));
// ---- D1-2 多 Agent 探测 (无 --target 自动探测) ----
const tmpHome2 = mkdtempSync(join(tmpdir(), 'hdk-install-autod-'));
mkdirSync(join(tmpHome2, '.dsh'), { recursive: true });   // 预置 DSH 客户端标记，供 auto-detect 识别
const res2 = spawnSync(process.execPath, [join(PKG,'bin','setup.cjs'), 'install'], {
  env: { ...process.env, HOME: tmpHome2, HUAWEICLOUD_HOME: tmpHome2 },
  encoding: 'utf8', timeout: 60000,
});
const autoOut = (res2.stdout||'') + (res2.stderr||'');
check('D1-2','无 --target install 自动探测到 DSH 并执行', res2.status===0 && /DSH|dsh/i.test(autoOut), `exit=${res2.status} len=${autoOut.length}`);
rmSync(tmpHome, {recursive:true, force:true});
rmSync(tmpHome2, {recursive:true, force:true});

// ---- D1-58 MCP 白名单 merge 语义 ----
const { mergeMcpServersFile } = await import(CORE + '/mcp-config-merge.mjs');
const existing = { mcpServers: { 'other-server': { command:'x', args:['y'] } }, extra: 42 };
const r1 = mergeMcpServersFile(existing, { mcpPath:'/abs/huaweicloud-devkit/mcp-server.mjs' });
const cfg1 = r1.config;
const hasHdk = cfg1.mcpServers && cfg1.mcpServers['huaweicloud-devkit'];
const preserved = cfg1.extra===42 && cfg1.mcpServers['other-server'];
check('D1-58','merge adds huaweicloud-devkit + preserves others', !!hasHdk && !!preserved, `hasHdk=${!!hasHdk} preserved=${!!preserved}`);
const r2 = mergeMcpServersFile(cfg1, { mcpPath:'/abs/huaweicloud-devkit/mcp-server.mjs' });
const cnt = Object.keys(r2.config.mcpServers).filter(k=>k==='huaweicloud-devkit').length;
check('D1-58','re-merge idempotent (no duplicate)', cnt===1 && r2.changed===false, `hdkEntries=${cnt} changed=${r2.changed}`);

// ---- D5-1 清单发现加载 (DSH) ----
const { listSkillDirs } = await import(CORE + '/tools.mjs');
const skillsRootDev = join(PKG,'plugins','huaweicloud-core','skills');
const devSkills = listSkillDirs(skillsRootDev);
const dshSkills = listSkillDirs(join(process.env.DSH_HOME || join(HDNAME,'.dsh'), 'skills'));
const dshHook = existsSync(join(PKG,'integrations','dsh','hook-plugin.mjs'));
const dshOpencodeJson = existsSync(join(PKG,'integrations','opencode','opencode.json'));
check('D5-1','bundled skills manifest discoverable (>=29)', devSkills.length>=29, devSkills.length);
check('D5-1','DSH integration hook-plugin present', dshHook, dshHook);
check('D5-1','DSH skills dir loads (>=29)', dshSkills.length>=29, dshSkills.length);
check('D5-1','opencode manifest present', dshOpencodeJson, dshOpencodeJson);

const failed=results.filter(r=>!r.pass);
console.log('=== INSTALL PROBE RESULTS (v1.1.4 stable) ===');
console.log(`total=${results.length} pass=${results.length-failed.length} fail=${failed.length}`);
for(const r of results) console.log(`${r.pass?'PASS':'FAIL'}  ${r.id}  ${r.name}  => ${r.actual}`);
if(failed.length){console.log('--- FAILED ---');for(const r of failed)console.log(`  ${r.id} ${r.name} => ${r.actual}`);}
if (typeof res!=='undefined') console.log('install stdout tail:', (res.stdout||'').slice(-300));
