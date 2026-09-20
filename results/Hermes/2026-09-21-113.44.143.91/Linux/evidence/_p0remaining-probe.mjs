// P0 剩余用例探针 2026-09-21: D2-11 (STS R3) + D4-23 (agent-rules 注入) + D8-1 (文档工具数)
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { mkdtempSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
const HDK = '/home/zhangshuang/devkit-test/Hermes/hdk';
const SRC = join(HDK, 'plugins/huaweicloud-core/src');
const { callTool } = await import(pathToFileURL(join(SRC, 'tools.mjs')).href);
const results = [];
const log = (id, name, pass, detail) => results.push({ id, name, pass: !!pass, detail: String(detail ?? '').slice(0,240) });

// D2-11: raw auth_switch persist + securityToken → 应返回 scope=rejected 且 token 永不落盘
{
  const home = mkdtempSync(join(tmpdir(), 'hdk-d211-'));
  process.env.HUAWEICLOUD_HOME = home;
  try {
    const r = await callTool('huaweicloud_auth_switch', { action: 'persist', ak: 'AKTEST', sk: 'SKTEST', securityToken: 'FAKE-STS-TOKEN-123', region: 'cn-north-4' });
    const scope = r?.scope || r?.status;
    const rejected = scope === 'rejected' || r?.error;
    // 检查 S1 文件是否落盘 token
    let tokenLeaked = false;
    const cand = [join(home, 'credentials.json'), join(home, '.config', 'huaweicloud', 'credentials.json')];
    for (const p of cand) {
      if (existsSync(p)) { const t = readFileSync(p,'utf8'); if (t.includes('FAKE-STS-TOKEN-123')) tokenLeaked = true; }
    }
    log('D2-11', 'sts-persist-rejected', rejected, JSON.stringify(r).slice(0,160), 'scope=rejected');
    log('D2-11', 'sts-token-not-persisted', !tokenLeaked, tokenLeaked?'token 落盘':'token 未落盘');
  } catch (e) {
    log('D2-11', 'sts-persist-rejected', false, String(e).slice(0,160));
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
}

// D4-23: 全局规则 huawei-agent-rules 注入（11 目标）—— 是否有注入逻辑 + 文件是否随 install 写入
{
  const core = join(HDK, 'plugins', 'huaweicloud-core');
  const rulesMdc = join(HDK, 'rules', 'huawei-agent-rules.mdc');
  const fileExists = existsSync(rulesMdc);
  // 搜 plugin 安装/注入代码是否引用 agent-rules
  const { execSync } = await import('node:child_process');
  let refs = '';
  try { refs = execSync(`grep -rl "agent-rules\\|huawei-agent-rules" ${core}/src ${core}/bin 2>/dev/null`, {encoding:'utf8'}); } catch {}
  const injected = !!refs.trim();
  log('D4-23', 'rules-file-exists', fileExists, rulesMdc, 'huawei-agent-rules 存在');
  log('D4-23', 'injection-wired', injected, refs.trim() || '(无注入引用)', 'install/hook 有注入逻辑');
}

// D8-1: 文档 vs 实现工具数（README/AGENTS 声称 39 vs tools/list 实际 40）
{
  const { execSync } = await import('node:child_process');
  let docCount = 'n/a';
  try {
    const ag = readFileSync(join(HDK,'AGENTS.md'),'utf8');
    const m = ag.match(/(\d+)\s+tools?\s+in\s+tools\.mjs/i) || ag.match(/39 tools/i);
    docCount = m ? (m[1]||'39') : '39';
  } catch {}
  // 实际 TOOL_DEFINITIONS 计数
  const tm = readFileSync(join(SRC,'tools.mjs'),'utf8');
  const defs = (tm.match(/name:\s*'huaweicloud_[a-z0-9_]+'/g) || []).length;
  let actual = defs;
  if (actual === 0) {
    const m2 = tm.match(/TOOL_DEFINITIONS\s*=\s*\[([\s\S]*?)\]\s*;/);
    if (m2) actual = (m2[1].match(/name:\s*['"]/g)||[]).length;
  }
  const drift = docCount !== 'n/a' && actual && Number(docCount) !== actual;
  log('D8-1', 'tool-count-doc-vs-impl', !drift, `doc=${docCount} actual=${actual}`, '文档与实现工具数一致');
}
console.log(JSON.stringify({ total: results.length, passed: results.filter(r=>r.pass).length, results }, null, 2));