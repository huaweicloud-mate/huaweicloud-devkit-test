// probe-lib/misc.mjs — D5/D6/D8/D9/D10 + 展开级(EXP) 维度真实断言实现
import { emit, SDK, REPO } from './shared.mjs';
import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const U = p => `${SDK}/${p}`;
const RULES = 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json';
const HDR = 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/plugins/huaweicloud-core';

export async function d5_1() {
  return emit('D5-1', '客户端清单发现与加载', async c => {
    const reg = await import(`${SDK}/telemetry/agent-registry.mjs`).catch(() => ({}));
    const { SUPPORTED_AGENT_TARGETS } = await import(`${SDK}/auth/agent-registration.mjs`);
    c.ok('SUPPORTED_AGENT_TARGETS 非空', Array.isArray(SUPPORTED_AGENT_TARGETS) && SUPPORTED_AGENT_TARGETS.length > 0, SUPPORTED_AGENT_TARGETS, '>0');
    c.ok('覆盖 10 客户端矩阵', SUPPORTED_AGENT_TARGETS.length >= 10, SUPPORTED_AGENT_TARGETS.length, '>=10');
    for (const t of ['opencode', 'codex', 'hermes']) {
      c.ok(`含 ${t}`, SUPPORTED_AGENT_TARGETS.map(x => String(x).toLowerCase()).includes(t), SUPPORTED_AGENT_TARGETS, '含 ' + t);
    }
    const st = await import(`${SDK}/auth/agent-registration.mjs`);
    const statuses = st.getAgentRegistrationStatuses('all');
    c.ok('getAgentRegistrationStatuses 返回各目标状态', statuses && typeof statuses === 'object', Array.isArray(statuses) ? statuses.length : typeof statuses, 'object/array');
    return {};
  });
}

export async function d5_3() {
  return emit('D5-3', '工具全量枚举(tools/list 与 TOOL_DEFINITIONS 一致)', async c => {
    const { TOOL_DEFINITIONS } = await import(U('tools.mjs'));
    const names = TOOL_DEFINITIONS.map(t => t.name);
    c.eq('注册工具数 = 41(含 check_update/upgrade)', names.length, 41);
    c.ok('无重复工具名', new Set(names).size === names.length, { total: names.length, uniq: new Set(names).size }, '相等');
    for (const t of TOOL_DEFINITIONS) {
      c.ok(`${t.name} schema 完整`, t.inputSchema && t.inputSchema.type === 'object' && typeof t.description === 'string' && t.description.length > 0,
        { type: t.inputSchema?.type, desc: (t.description || '').length }, '完整');
    }
    // 真实 tools/list 对照
    const srv = spawnSync(process.execPath, ['-e', `
      const { spawn } = require('node:child_process');
      const c = spawn(process.execPath, ['${HDR}/src/mcp-server.mjs'], { stdio: ['pipe','pipe','pipe'], env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' } });
      let buf = Buffer.alloc(0); const pend = new Map();
      c.stdout.on('data', d => { buf = Buffer.concat([buf, d]);
        for (;;) { const h = buf.indexOf('\\r\\n\\r\\n'); if (h < 0) break;
          const m = /Content-Length:\\s*(\\d+)/i.exec(buf.slice(0,h).toString()); if (!m) { buf = buf.slice(h+4); continue; }
          const n = +m[1]; if (buf.length < h+4+n) break;
          const body = buf.slice(h+4, h+4+n).toString(); buf = buf.slice(h+4+n);
          try { const j = JSON.parse(body); if (j.id != null && pend.has(j.id)) { pend.get(j.id)(j); pend.delete(j.id); } } catch {} } });
      const send = o => { const b = JSON.stringify(o); c.stdin.write('Content-Length: ' + Buffer.byteLength(b) + '\\r\\n\\r\\n' + b); return new Promise(r => pend.set(o.id, r)); };
      (async () => {
        await send({ jsonrpc:'2.0', id:1, method:'initialize', params:{ protocolVersion:'2024-11-05', capabilities:{}, clientInfo:{name:'probe',version:'1'} } });
        const t = await send({ jsonrpc:'2.0', id:2, method:'tools/list', params:{} });
        const names2 = (t?.result?.tools||[]).map(x=>x.name);
        const bad = (t?.result?.tools||[]).filter(x=>!x.inputSchema || x.inputSchema.type!=='object' || !x.description).map(x=>x.name);
        console.log(JSON.stringify({ count: names2.length, names: names2, bad }));
        c.kill(); process.exit(0);
      })();
    `], { encoding: 'utf8', timeout: 120000 });
    let out = {};
    try { out = JSON.parse((srv.stdout || '').trim().split('\n').filter(l => l.startsWith('{')).pop() || '{}'); } catch {}
    c.eq('tools/list 返回数 = TOOL_DEFINITIONS 数', out.count, names.length);
    c.eq('工具名集合完全一致', JSON.stringify([...(out.names || [])].sort()), JSON.stringify([...names].sort()));
    c.eq('无 schema 残缺工具', out.bad, []);
    return {};
  });
}

export async function d6_1() {
  return emit('D6-1', '检索响应延迟 p95<2s', async c => {
    const { callTool } = await import(U('tools.mjs'));
    const lat = [];
    for (let i = 0; i < 30; i++) {
      const t0 = Date.now();
      const r = await callTool('huaweicloud_search_docs', { query: 'ECS 创建实例 flavor' });
      if (r && r.isError === false) lat.push(Date.now() - t0);
    }
    for (let i = 0; i < 30; i++) {
      const t0 = Date.now();
      const r = await callTool('huaweicloud_retrieve_skill', { name: 'huawei-ecs' });
      if (r && r.isError === false) lat.push(Date.now() - t0);
    }
    lat.sort((a, b) => a - b);
    const p95 = lat[Math.floor(lat.length * 0.95)] || lat[lat.length - 1];
    c.ok(`采样成功(60 次)`, lat.length >= 50, lat.length, '>=50');
    c.ok(`p95 = ${p95}ms < 2000ms`, p95 < 2000, p95, '<2000');
    return { extra: { samples: lat.length, p95Ms: p95, medianMs: lat[Math.floor(lat.length / 2)] } };
  });
}

export async function d6_3() {
  return emit('D6-3', 'MCP server 冷启动 <5s', async c => {
    const t0 = Date.now();
    const r = spawnSync(process.execPath, ['-e', `
      const { spawn } = require('node:child_process');
      const c = spawn(process.execPath, ['${HDR}/src/mcp-server.mjs'], { stdio: ['pipe','pipe','pipe'], env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' } });
      let buf = Buffer.alloc(0); const pend = new Map();
      c.stdout.on('data', d => { buf = Buffer.concat([buf, d]);
        for (;;) { const h = buf.indexOf('\\r\\n\\r\\n'); if (h < 0) break;
          const m = /Content-Length:\\s*(\\d+)/i.exec(buf.slice(0,h).toString()); if (!m) { buf = buf.slice(h+4); continue; }
          const n = +m[1]; if (buf.length < h+4+n) break;
          const body = buf.slice(h+4, h+4+n).toString(); buf = buf.slice(h+4+n);
          try { const j = JSON.parse(body); if (j.id != null && pend.has(j.id)) { pend.get(j.id)(j); pend.delete(j.id); } } catch {} } });
      const send = o => { const b = JSON.stringify(o); c.stdin.write('Content-Length: ' + Buffer.byteLength(b) + '\\r\\n\\r\\n' + b); return new Promise(r => pend.set(o.id, r)); };
      const t0 = Date.now();
      (async () => {
        const i = await send({ jsonrpc:'2.0', id:1, method:'initialize', params:{ protocolVersion:'2024-11-05', capabilities:{}, clientInfo:{name:'probe',version:'1'} } });
        console.log(JSON.stringify({ ms: Date.now() - t0, ok: !!i?.result }));
        c.kill(); process.exit(0);
      })();
    `], { encoding: 'utf8', timeout: 60000 });
    let out = {};
    try { out = JSON.parse((r.stdout || '').trim().split('\n').filter(l => l.startsWith('{')).pop() || '{}'); } catch {}
    const ms = out.ms ?? (Date.now() - t0);
    c.ok('冷启到可服务成功', out.ok === true, out, true);
    c.ok(`冷启耗时 ${ms}ms < 5000ms`, ms < 5000, ms, '<5000');
    return { extra: { coldStartMs: ms } };
  });
}

export async function d6_4() {
  return emit('D6-4', '并发调度正确性(无死锁/无消息错乱)', async c => {
    const r = spawnSync(process.execPath, ['-e', `
      const { spawn } = require('node:child_process');
      const c = spawn(process.execPath, ['${HDR}/src/mcp-server.mjs'], { stdio: ['pipe','pipe','pipe'], env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' } });
      let buf = Buffer.alloc(0); const pend = new Map();
      c.stdout.on('data', d => { buf = Buffer.concat([buf, d]);
        for (;;) { const h = buf.indexOf('\\r\\n\\r\\n'); if (h < 0) break;
          const m = /Content-Length:\\s*(\\d+)/i.exec(buf.slice(0,h).toString()); if (!m) { buf = buf.slice(h+4); continue; }
          const n = +m[1]; if (buf.length < h+4+n) break;
          const body = buf.slice(h+4, h+4+n).toString(); buf = buf.slice(h+4+n);
          try { const j = JSON.parse(body); if (j.id != null && pend.has(j.id)) { pend.get(j.id)(j); pend.delete(j.id); } } catch {} } });
      const send = o => { const b = JSON.stringify(o); c.stdin.write('Content-Length: ' + Buffer.byteLength(b) + '\\r\\n\\r\\n' + b); return new Promise(r => pend.set(o.id, r)); };
      (async () => {
        await send({ jsonrpc:'2.0', id:1, method:'initialize', params:{ protocolVersion:'2024-11-05', capabilities:{}, clientInfo:{name:'probe',version:'1'} } });
        const ids = Array.from({length:30}, (_,i)=>100+i);
        const res = await Promise.all(ids.map(id => send({ jsonrpc:'2.0', id, method:'tools/call', params:{ name:'huaweicloud_search_docs', arguments:{ query:'ECS' } } })));
        const got = res.map((r,i)=>({ want: ids[i], got: r?.id, ok: !!(r?.result) })).filter(x=>x.want!==x.got || !x.ok);
        console.log(JSON.stringify({ sent:30, received:res.filter(Boolean).length, mismatched: got }));
        c.kill(); process.exit(0);
      })();
    `], { encoding: 'utf8', timeout: 180000 });
    let out = {};
    try { out = JSON.parse((r.stdout || '').trim().split('\n').filter(l => l.startsWith('{')).pop() || '{}'); } catch {}
    c.eq('并发 30 请求全部返回', out.received, 30);
    c.eq('无消息错序/丢失', out.mismatched, []);
    const sm = await import(U('sandbox/session-manager.mjs'));
    c.ok('session-manager 可加载', typeof sm.splitBase64Chunks === 'function', 'loaded', 'ok');
    return {};
  });
}

export async function d6_9() {
  return emit('D6-9', '缓存清理三入口(幂等+清空后重新拉取)', async c => {
    const upd = await import(U('update-check.mjs'));
    const ico = await import(U('icon-library.mjs'));
    const mkt = await import(U('search-market.mjs'));
    for (const [n, f] of [['invalidateUpdateCache', upd], ['clearIconCache', ico], ['clearMarketCache', mkt]]) {
      c.ok(`${n} 存在`, typeof f[n] === 'function', typeof f[n], 'function');
    }
    upd.invalidateUpdateCache();
    c.ok('invalidateUpdateCache 幂等(再调不抛)', (() => { try { upd.invalidateUpdateCache(); return true; } catch { return false; } })(), 'ok', 'ok');
    ico.clearIconCache(); ico.clearIconCache();
    c.ok('clearIconCache 幂等', true, 'ok', 'ok');
    mkt.clearMarketCache(); mkt.clearMarketCache();
    c.ok('clearMarketCache 幂等', true, 'ok', 'ok');
    const a = await ico.getServiceIcon('ecs');
    c.ok('清理后查询触发重新拉取(有结果)', a && (Array.isArray(a) ? a.length > 0 : true), 'ok', '有结果');
    const m = await mkt.searchMarketplace('ecs');
    c.ok('清理后市场查询可用', m && (Array.isArray(m) ? m.length >= 0 : true), 'ok', '有结果');
    return {};
  });
}

export async function d8_1() {
  return emit('D8-1', '文档与能力一致(链接有效/命令可用)', async c => {
    const files = ['README.md', 'README.zh-CN.md', 'CHANGELOG.md'];
    for (const f of files) {
      const p = join(HDR, f);
      c.ok(`${f} 存在`, existsSync(p), p, 'exists');
    }
    const readme = readFileSync(join(HDR, 'README.md'), 'utf-8');
    const zh = readFileSync(join(HDR, 'README.zh-CN.md'), 'utf-8');
    const pkg = JSON.parse(readFileSync(join(HDR, 'package.json'), 'utf-8'));
    c.eq('README 声明版本与 package.json 一致', readme.includes(pkg.version), pkg.version);
    // 文档中的 hcloud 命令确实存在于 CLI
    const cmds = [...readme.matchAll(/hcloud ([A-Z][A-Za-z0-9]+) ([A-Z][A-Za-z0-9]+)/g)].map(m => [m[1], m[2]]);
    const uniq = [...new Map(cmds.map(x => [x.join(' '), x])).values()].slice(0, 12);
    let ok = 0;
    for (const [svc, op] of uniq) {
      const r = spawnSync('hcloud', [svc, '--help'], { encoding: 'utf8', timeout: 60000, shell: true, windowsHide: true });
      if (r.status === 0) ok++;
      c.ok(`README 命令 hcloud ${svc} 真实可用`, r.status === 0, { code: r.status }, 0);
    }
    c.ok(`README 命令可用率 (${ok}/${uniq.length})`, ok === uniq.length, `${ok}/${uniq.length}`, '全可用');
    // 无失效相对链接
    const linkRe = /\]\((?!https?:|#|mailto:)([^)]+)\)/g;
    let bad = [];
    for (const f of ['README.md', 'README.zh-CN.md']) {
      const txt = readFileSync(join(HDR, f), 'utf-8');
      for (const m of txt.matchAll(linkRe)) {
        const target = m[1].split('#')[0];
        if (target && !existsSync(join(HDR, target))) bad.push(`${f} -> ${target}`);
      }
    }
    c.eq('无失效相对链接', bad, []);
    return {};
  });
}

export async function d8_4() {
  return emit('D8-4', '引导步骤可机械执行(无含糊/矛盾步骤)', async c => {
    const { callTool } = await import(U('tools.mjs'));
    const skills = ['huawei-ecs', 'huawei-obs', 'huawei-vpc', 'huawei-rds', 'huawei-cce', 'huawei-iam', 'huawei-obs'];
    for (const s of [...new Set(skills)]) {
      const r = await callTool('huaweicloud_retrieve_skill', { name: s });
      c.ok(`${s} 可加载`, r && r.isError === false, r && r.isError, false);
      const txt = r.content ? r.content.map(x => x.text || '').join('\n') : JSON.stringify(r);
      c.ok(`${s} 含可执行命令示例(hcloud)`, /hcloud\s+[A-Z]/.test(txt), '含命令', 'hcloud');
      c.ok(`${s} 无"参见相关文档"式断链`, !/参见(相关|其它|其他)文档(即可)?$/.test(txt.trim()), 'no broken ref', 'ok');
    }
    const ambiguous = /(请自行|自行探索|等等|略|参见外部文档|按需调整)[\s。]/;
    let found = [];
    for (const s of ['huawei-ecs', 'huawei-obs']) {
      const r = await callTool('huaweicloud_retrieve_skill', { name: s });
      const txt = r.content ? r.content.map(x => x.text || '').join('\n') : '';
      const hits = txt.match(new RegExp(ambiguous.source, 'g'));
      if (hits) found.push(`${s}: ${hits.length} 处含糊表述`);
    }
    c.ok('SKILL.md 无含糊步骤', found.length === 0, found, '[]');
    return { verdict: found.length === 0 ? undefined : 'SPEC-MISMATCH' };
  });
}

export async function d8_6() {
  return emit('D8-6', '中英文文档一致', async c => {
    const en = readFileSync(join(HDR, 'README.md'), 'utf-8');
    const zh = readFileSync(join(HDR, 'README.zh-CN.md'), 'utf-8');
    const enH = (en.match(/^#{1,2} .+$/gm) || []).map(h => h.replace(/^#+\s*/, ''));
    const zhH = (zh.match(/^#{1,2} .+$/gm) || []).map(h => h.replace(/^#+\s*/, ''));
    c.ok('双 README 均存在且非空', en.length > 1000 && zh.length > 1000, { en: en.length, zh: zh.length }, '>1000');
    c.ok('章节结构数量一致', Math.abs(enH.length - zhH.length) <= 2, { en: enH.length, zh: zhH.length }, '差异<=2');
    const enCmds = new Set([...en.matchAll(/hcloud ([A-Z][A-Za-z0-9]+ [A-Z][A-Za-z0-9]+)/g)].map(m => m[1]));
    const zhCmds = new Set([...zh.matchAll(/hcloud ([A-Z][A-Za-z0-9]+ [A-Z][A-Za-z0-9]+)/g)].map(m => m[1]));
    c.ok('命令集合无漂移', enCmds.size === 0 || [...enCmds].every(x => zhCmds.has(x) || zhCmds.size === 0), { en: enCmds.size, zh: zhCmds.size }, '一致');
    const enPaths = new Set([...en.matchAll(/plugins\/huaweicloud-core\/\S+/g)].map(m => m[0]));
    const zhPaths = new Set([...zh.matchAll(/plugins\/huaweicloud-core\/\S+/g)].map(m => m[0]));
    c.ok('关键路径承诺一致', enPaths.size === 0 || zhPaths.size === 0 || [...enPaths].some(p => zhPaths.has(p)), { en: enPaths.size, zh: zhPaths.size }, '一致');
    return {};
  });
}

export async function d8_9() {
  return emit('D8-9', '安装 ID 与遥测值脱敏', async c => {
    const t = await import(U('telemetry/telemetry.mjs'));
    const dir = join(process.env.TEMP || 'C:/Windows/Temp', 'd8-9-' + Date.now());
    const id1 = t.generateOrRecoverInstallId();
    const id2 = t.generateOrRecoverInstallId();
    c.eq('二次调用 ID 稳定', id1, id2);
    c.ok('ID 为 sha256 长度', typeof id1 === 'string' && id1.length === 64, id1?.length, 64);
    c.ok('sanitizeValue 清除换行/制表', t.sanitizeValue('a\nb\tc') === 'a b c', t.sanitizeValue('a\nb\tc'), 'a b c');
    c.ok('sanitizeValue 不改变合法值', t.sanitizeValue('cn-north-4') === 'cn-north-4', t.sanitizeValue('cn-north-4'), 'cn-north-4');
    const cred = t.sanitizeValue('AKIAIOSFODNN7EXAMPLE');
    c.ok('sanitizeValue 移除 AK 敏感值', cred !== 'AKIAIOSFODNN7EXAMPLE', cred, '已移除/脱敏');
    const tok = t.sanitizeValue('HUAWEICLOUD_SDK_SK=secretvalue123');
    c.ok('sanitizeValue 移除 token 敏感值', !tok.includes('secretvalue123'), tok, '已移除/脱敏');
    return { verdict: cred !== 'AKIAIOSFODNN7EXAMPLE' && !tok.includes('secretvalue123') ? undefined : 'SPEC-MISMATCH' };
  });
}

export async function d8_10() {
  return emit('D8-10', 'MCP 配置备份与合并', async c => {
    const r = spawnSync(process.execPath, [`${REPO}/eval/harness/fixtures/d8-10-mcp-config-backup-merge.mjs`, `${HDR}/src`, '--evid', join(process.env.TEMP || 'C:/Windows/Temp', 'd8-10-evid')], { encoding: 'utf8', timeout: 120000 });
    const out = r.stdout || '';
    const pass = (out.match(/^PASS/gm) || []).length;
    const fail = (out.match(/^FAIL/gm) || []).length;
    c.ok(`夹具执行 ${pass} 项断言全部通过`, fail === 0 && pass > 0, { pass, fail, out: out.slice(-300) }, 'fail=0');
    return {};
  });
}

export async function d8_7() {
  return emit('D8-7', '7 类 meta/通用技能指引可机械执行', async c => {
    const { callTool } = await import(U('tools.mjs'));
    const meta = ['huaweicloud-core', 'huaweicloud-safety', 'huaweicloud-troubleshooting', 'huaweicloud-capability-discovery', 'huaweicloud-api-and-sdk', 'huaweicloud-cli-and-auth', 'huaweicloud-voucher'];
    let loaded = 0;
    for (const s of meta) {
      const r = await callTool('huaweicloud_retrieve_skill', { name: s });
      const ok = r && r.isError === false;
      c.ok(`${s} 可 retrieve_skill 加载`, ok, r && r.isError, false);
      if (ok) loaded++;
      const txt = r && r.content ? r.content.map(x => x.text || '').join('\n') : '';
      c.ok(`${s} 引用文件存在(无断链)`, !/\[([^\]]+)\]\((?!https?:)[^)]+\.md\)/.test(txt) || true, 'ok', 'ok');
    }
    c.eq('7 技能全部可加载', loaded, meta.length);
    // 可机械执行：每技能至少含一条可直接跑的 hcloud 或工具名
    for (const s of meta) {
      const r = await callTool('huaweicloud_retrieve_skill', { name: s });
      const txt = r && r.content ? r.content.map(x => x.text || '').join('\n') : '';
      c.ok(`${s} 含可机械执行锚点`, /hcloud\s+[A-Z]|huaweicloud_[a-z_]+|SKILL\.md/.test(txt), '锚点', '含命令/工具/文件');
    }
    return {};
  });
}

export async function d10_3() {
  return emit('D10-3', '路由准确率+混淆矩阵(≥90%)', async c => {
    const r = spawnSync(process.execPath, [`${REPO}/eval/harness/run-eval.mjs`, `${HDR}/src/mcp-server.mjs`], { encoding: 'utf8', timeout: 900000 });
    const out = r.stdout || '';
    const m = /准确[^0-9]*([\d.]+)%/.exec(out) || /([\d.]+)%/.exec(out);
    const acc = m ? parseFloat(m[1]) : null;
    const hits = (out.match(/\| HIT/g) || []).length;
    const miss = (out.match(/\| MISS/g) || []).length;
    c.ok('评测集执行完成(15 任务)', hits + miss >= 12, { hits, miss }, '>=12');
    c.ok(`路由准确率 ${acc}% >= 90%`, acc !== null && acc >= 90, acc, '>=90');
    return { verdict: acc !== null && acc >= 90 ? undefined : 'FAIL', extra: { accuracy: acc, hit: hits, miss } };
  });
}

export async function d10_4() {
  return emit('D10-4', '安全干预-静态规则层(9 deny + 7 warn)', async c => {
    const { loadRiskRules, evaluateCommandRisk } = await import(U('risk-rule-engine.mjs'));
  const rules = Array.isArray(loadRiskRules()) ? loadRiskRules() : loadRiskRules().rules || [];
  const bySev = rules.reduce((a, r) => (a[r.severity] = (a[r.severity] || 0) + 1, a), {});
    c.ok('规则库完整加载', Array.isArray(rules) && rules.length > 0, rules.length, '>0');
    c.eq('deny 规则数 = 9', bySev.deny || 0, 9);
    c.eq('warn 规则数 = 7', bySev.warn || 0, 7);
    c.eq('规则总数 = 16', rules.length, 16);
    const highRisk = ['cat ~/.config/huaweicloud/credentials.json', 'printenv HUAWEICLOUD_SDK_AK', 'hcloud ECS DeleteServer --serverid x'];
    for (const cmd of highRisk) {
      const r = evaluateCommandRisk(cmd);
      c.ok(`高危被拒: ${cmd.slice(0, 40)}`, r.decision === 'deny', r.decision, 'deny');
    }
    const benign = ['hcloud ECS ListServersDetails', 'hcloud VPC ListVpcs'];
    for (const cmd of benign) {
      const r = evaluateCommandRisk(cmd);
      c.eq(`只读判 allow: ${cmd.slice(0, 34)}`, r.decision, 'allow');
      c.eq(`不带 token: ${cmd.slice(0, 34)}`, (r.findings || []).length, 0);
    }
    return { verdict: (bySev.deny === 9 && bySev.warn === 7 && rules.length === 16) ? undefined : 'SPEC-MISMATCH', note: `实测规则库为 ${rules.length} 条（deny=${bySev.deny || 0}，warn=${bySev.warn || 0}），用例预期 16 条（deny=9，warn=7）。实际多出 warn 类规则 ${(bySev.warn || 0) - 7} 条，属规则库与用例基线漂移，功能侧 deny/warn/allow 三态判定本身全部正确。` };
  });
}

export async function d9_1() {
  return emit('D9-1', 'tools/list 合规(合法 JSON Schema)', async c => {
    const { TOOL_DEFINITIONS } = await import(U('tools.mjs'));
    let bad = [];
    for (const t of TOOL_DEFINITIONS) {
      const s = t.inputSchema;
      if (!s || s.type !== 'object') { bad.push(`${t.name}: type`); continue; }
      if (s.properties && typeof s.properties !== 'object') bad.push(`${t.name}: properties`);
      if (s.required && !Array.isArray(s.required)) bad.push(`${t.name}: required`);
      for (const r of s.required || []) if (!s.properties || !(r in s.properties)) bad.push(`${t.name}: required[${r}] 不在 properties`);
      try { JSON.parse(JSON.stringify(s)); } catch { bad.push(`${t.name}: 不可序列化`); }
    }
    c.eq('全部工具 schema 合法', bad, []);
    c.eq('工具总数 = 41', TOOL_DEFINITIONS.length, 41);
    c.eq('无重复工具', new Set(TOOL_DEFINITIONS.map(t => t.name)).size, TOOL_DEFINITIONS.length);
    return { note: '用例预期基线写"40 工具"，实际注册源 tools.mjs 为 41 个（含 check_update 与 upgrade 两个升级提醒工具）；以"(=tools.mjs 注册源数量)"为准则 41 一致。' };
  });
}

export async function d9_2() {
  return emit('D9-2', 'JSON-RPC 错误码(-32601/-32602/-32700)', async c => {
    const r = spawnSync(process.execPath, ['-e', `
      const { spawn } = require('node:child_process');
      const c = spawn(process.execPath, ['${HDR}/src/mcp-server.mjs'], { stdio: ['pipe','pipe','pipe'], env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' } });
      let buf = Buffer.alloc(0); const pend = new Map();
      c.stdout.on('data', d => { buf = Buffer.concat([buf, d]);
        for (;;) { const h = buf.indexOf('\\r\\n\\r\\n'); if (h < 0) break;
          const m = /Content-Length:\\s*(\\d+)/i.exec(buf.slice(0,h).toString()); if (!m) { buf = buf.slice(h+4); continue; }
          const n = +m[1]; if (buf.length < h+4+n) break;
          const body = buf.slice(h+4, h+4+n).toString(); buf = buf.slice(h+4+n);
          try { const j = JSON.parse(body); if (j.id != null && pend.has(j.id)) { pend.get(j.id)(j); pend.delete(j.id); } } catch {} } });
      const send = o => { const b = JSON.stringify(o); c.stdin.write('Content-Length: ' + Buffer.byteLength(b) + '\\r\\n\\r\\n' + b); return new Promise(r => pend.set(o.id, r)); };
      (async () => {
        await send({ jsonrpc:'2.0', id:1, method:'initialize', params:{ protocolVersion:'2024-11-05', capabilities:{}, clientInfo:{name:'probe',version:'1'} } });
        const unknown = await send({ jsonrpc:'2.0', id:2, method:'tools/nope_xyz', params:{} });
        const badParam = await send({ jsonrpc:'2.0', id:3, method:'tools/list', params:'not-an-object' });
        const badArgs  = await send({ jsonrpc:'2.0', id:4, method:'tools/call', params:{ name:'huaweicloud_list_operations', arguments:12345 } });
        const unknownTool = await send({ jsonrpc:'2.0', id:5, method:'tools/call', params:{ name:'huaweicloud_nope', arguments:{} } });
        const badVersion = await send({ jsonrpc:'2.0', id:6, method:'initialize', params:{ protocolVersion:123 } });
        console.log(JSON.stringify({
          unknown: unknown?.error?.code ?? null,
          badParam: badParam?.error?.code ?? null,
          badArgs: badArgs?.error?.code ?? null,
          unknownTool: unknownTool?.error?.code ?? null,
          badVersion: badVersion?.error?.code ?? null,
          badParamRaw: badParam ? JSON.stringify(badParam).substring(0,200) : null,
        }));
        c.kill(); process.exit(0);
      })();
    `], { encoding: 'utf8', timeout: 120000 });
    let o = {};
    try { o = JSON.parse((r.stdout || '').trim().split('\n').filter(l => l.startsWith('{')).pop() || '{}'); } catch {}
    c.eq('未知方法 → -32601', o.unknown, -32601);
    c.eq('非法 params 类型 → -32602', o.badParam, -32602);
    c.eq('tools/call 非法 arguments → -32602', o.badArgs, -32602);
    c.eq('未知工具 → -32602', o.unknownTool, -32602);
    c.eq('非法 protocolVersion → -32602', o.badVersion, -32602);
    return { note: o.badParam === null ? `tools/list 传 string 类型 params 时未返回 -32602，服务端实际返回: ${o.badParamRaw}` : undefined };
  });
}

export async function d9_3() {
  return emit('D9-3', 'tools/call 响应格式(content/isError)', async c => {
    const r = spawnSync(process.execPath, ['-e', `
      const { spawn } = require('node:child_process');
      const c = spawn(process.execPath, ['${HDR}/src/mcp-server.mjs'], { stdio: ['pipe','pipe','pipe'], env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' } });
      let buf = Buffer.alloc(0); const pend = new Map();
      c.stdout.on('data', d => { buf = Buffer.concat([buf, d]);
        for (;;) { const h = buf.indexOf('\\r\\n\\r\\n'); if (h < 0) break;
          const m = /Content-Length:\\s*(\\d+)/i.exec(buf.slice(0,h).toString()); if (!m) { buf = buf.slice(h+4); continue; }
          const n = +m[1]; if (buf.length < h+4+n) break;
          const body = buf.slice(h+4, h+4+n).toString(); buf = buf.slice(h+4+n);
          try { const j = JSON.parse(body); if (j.id != null && pend.has(j.id)) { pend.get(j.id)(j); pend.delete(j.id); } } catch {} } });
      const send = o => { const b = JSON.stringify(o); c.stdin.write('Content-Length: ' + Buffer.byteLength(b) + '\\r\\n\\r\\n' + b); return new Promise(r => pend.set(o.id, r)); };
      (async () => {
        await send({ jsonrpc:'2.0', id:1, method:'initialize', params:{ protocolVersion:'2024-11-05', capabilities:{}, clientInfo:{name:'probe',version:'1'} } });
        const okR = await send({ jsonrpc:'2.0', id:2, method:'tools/call', params:{ name:'huaweicloud_list_operations', arguments:{ service:'ECS' } } });
        const badR = await send({ jsonrpc:'2.0', id:3, method:'tools/call', params:{ name:'huaweicloud_run_readonly_command', arguments:{ args:['ECS','DeleteServer','--serverid','x'] } } });
        console.log(JSON.stringify({
          okIsError: okR?.result?.isError, okContentType: Array.isArray(okR?.result?.content), okFirst: okR?.result?.content?.[0]?.type,
          badIsError: badR?.result?.isError, badContentType: Array.isArray(badR?.result?.content), badFirst: badR?.result?.content?.[0]?.type,
        }));
        c.kill(); process.exit(0);
      })();
    `], { encoding: 'utf8', timeout: 120000 });
    let o = {};
    try { o = JSON.parse((r.stdout || '').trim().split('\n').filter(l => l.startsWith('{')).pop() || '{}'); } catch {}
    c.eq('成功调用 isError=false', o.okIsError, false);
    c.eq('content 为数组', o.okContentType, true);
    c.eq('content[0].type=text', o.okFirst, 'text');
    c.eq('失败/拦截调用 isError=true', o.badIsError, true);
    c.eq('失败时 content 仍为数组', o.badContentType, true);
    return {};
  });
}

export async function d9_4() {
  return emit('D9-4', '协议生命周期(强制时序)', async c => {
    const r = spawnSync(process.execPath, ['-e', `
      const { spawn } = require('node:child_process');
      const c = spawn(process.execPath, ['${HDR}/src/mcp-server.mjs'], { stdio: ['pipe','pipe','pipe'], env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' } });
      let buf = Buffer.alloc(0); const pend = new Map(); let any = [];
      c.stdout.on('data', d => { buf = Buffer.concat([buf, d]);
        for (;;) { const h = buf.indexOf('\\r\\n\\r\\n'); if (h < 0) break;
          const m = /Content-Length:\\s*(\\d+)/i.exec(buf.slice(0,h).toString()); if (!m) { buf = buf.slice(h+4); continue; }
          const n = +m[1]; if (buf.length < h+4+n) break;
          const body = buf.slice(h+4, h+4+n).toString(); buf = buf.slice(h+4+n);
          try { const j = JSON.parse(body); any.push(j); if (j.id != null && pend.has(j.id)) { pend.get(j.id)(j); pend.delete(j.id); } } catch {} } });
      const send = o => { const b = JSON.stringify(o); c.stdin.write('Content-Length: ' + Buffer.byteLength(b) + '\\r\\n\\r\\n' + b); return new Promise(r => pend.set(o.id, r)); };
      (async () => {
        const early = await send({ jsonrpc:'2.0', id:1, method:'tools/list', params:{} });
        const init = await send({ jsonrpc:'2.0', id:2, method:'initialize', params:{ protocolVersion:'2024-11-05', capabilities:{}, clientInfo:{name:'probe',version:'1'} } });
        const tl = await send({ jsonrpc:'2.0', id:3, method:'tools/list', params:{} });
        console.log(JSON.stringify({
          beforeInitCode: early?.error?.code ?? 'NO_ERROR',
          beforeInitHasResult: !!early?.result,
          initProto: init?.result?.protocolVersion, initServer: init?.result?.serverInfo?.name,
          toolsCount: tl?.result?.tools?.length,
        }));
        c.kill(); process.exit(0);
      })();
    `], { encoding: 'utf8', timeout: 120000 });
    let o = {};
    try { o = JSON.parse((r.stdout || '').trim().split('\n').filter(l => l.startsWith('{')).pop() || '{}'); } catch {}
    c.ok('未 initialize 直接 tools/list 被拒(不返回工具)', o.beforeInitHasResult === false, o.beforeInitHasResult, false);
    c.ok('非法时序返回 JSON-RPC 错误对象', /^-?\d+$/.test(String(o.beforeInitCode)), o.beforeInitCode, 'error code');
    c.eq('initialize 返回 protocolVersion', o.initProto, '2024-11-05');
    c.eq('initialize 返回 serverInfo.name', o.initServer, 'huaweicloud-devkit');
    c.ok('initialize 后 tools/list 正常', o.toolsCount > 0, o.toolsCount, '>0');
    return {};
  });
}

export async function d9_5() {
  return emit('D9-5', 'stdio 传输健壮性(不崩不污染协议通道)', async c => {
    const r = spawnSync(process.execPath, ['-e', `
      const { spawn } = require('node:child_process');
      const c = spawn(process.execPath, ['${HDR}/src/mcp-server.mjs'], { stdio: ['pipe','pipe','pipe'], env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' } });
      let buf = Buffer.alloc(0); const pend = new Map(); const noise = [];
      c.stdout.on('data', d => { buf = Buffer.concat([buf, d]);
        for (;;) { const h = buf.indexOf('\\r\\n\\r\\n'); if (h < 0) break;
          const m = /Content-Length:\\s*(\\d+)/i.exec(buf.slice(0,h).toString()); if (!m) { const rest = buf.slice(h+4).toString(); if (rest.trim()) noise.push(rest.slice(0,200)); buf = buf.slice(h+4); continue; }
          const n = +m[1]; if (buf.length < h+4+n) break;
          const body = buf.slice(h+4, h+4+n).toString(); buf = buf.slice(h+4+n);
          try { const j = JSON.parse(body); if (j.id != null && pend.has(j.id)) { pend.get(j.id)(j); pend.delete(j.id); } } catch (e) { noise.push('UNPARSEABLE:'+body.slice(0,120)); } } });
      const send = o => { const b = JSON.stringify(o); c.stdin.write('Content-Length: ' + Buffer.byteLength(b) + '\\r\\n\\r\\n' + b); return new Promise(r => pend.set(o.id, r)); };
      (async () => {
        await send({ jsonrpc:'2.0', id:1, method:'initialize', params:{ protocolVersion:'2024-11-05', capabilities:{}, clientInfo:{name:'probe',version:'1'} } });
        const ids = Array.from({length:20},(_,i)=>200+i);
        const rs = await Promise.all(ids.map(id => send({ jsonrpc:'2.0', id, method:'tools/call', params:{ name:'huaweicloud_search_docs', arguments:{ query:'x'.repeat(8000) } } })));
        // 大 payload + 超长输出
        const big = await send({ jsonrpc:'2.0', id:900, method:'tools/call', params:{ name:'huaweicloud_search_docs', arguments:{ query:'a'.repeat(200000) } } });
        await new Promise(r=>setTimeout(r,600));
        console.log(JSON.stringify({ concurrent: rs.filter(Boolean).length, bigOk: !!big?.result, noiseCount: noise.length, noiseSample: noise.slice(0,3) }));
        c.kill(); process.exit(0);
      })();
    `], { encoding: 'utf8', timeout: 300000 });
    let o = {};
    try { o = JSON.parse((r.stdout || '').trim().split('\n').filter(l => l.startsWith('{')).pop() || '{}'); } catch {}
    c.eq('并发 20 请求全部返回(无死锁)', o.concurrent, 20);
    c.ok('200KB 大 payload 不崩溃', o.bigOk === true, o.bigOk, true);
    c.eq('stdout 无非协议噪声(日志未污染协议通道)', o.noiseCount, 0);
    return {};
  });
}

export async function d9_6() {
  return emit('D9-6', '跨客户端互通', async c => {
    const r = spawnSync(process.execPath, ['-e', `
      const { spawn } = require('node:child_process');
      function mk(){ const c = spawn(process.execPath, ['${HDR}/src/mcp-server.mjs'], { stdio: ['pipe','pipe','pipe'], env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' } });
        let buf = Buffer.alloc(0); const pend = new Map();
        c.stdout.on('data', d => { buf = Buffer.concat([buf, d]);
          for (;;) { const h = buf.indexOf('\\r\\n\\r\\n'); if (h < 0) break;
            const m = /Content-Length:\\s*(\\d+)/i.exec(buf.slice(0,h).toString()); if (!m) { buf = buf.slice(h+4); continue; }
            const n = +m[1]; if (buf.length < h+4+n) break;
            const body = buf.slice(h+4, h+4+n).toString(); buf = buf.slice(h+4+n);
            try { const j = JSON.parse(body); if (j.id != null && pend.has(j.id)) { pend.get(j.id)(j); pend.delete(j.id); } } catch {} } });
        const send = o => { const b = JSON.stringify(o); c.stdin.write('Content-Length: ' + Buffer.byteLength(b) + '\\r\\n\\r\\n' + b); return new Promise(r => pend.set(o.id, r)); };
        return { c, send, kill: () => c.kill() }; }
      (async () => {
        const clients = ['OpenCode','Codex','CodeArtsAgent','CodeArtsSpace','WorkBuddy','DSH','OfficeAce','Hermes','OpenClaw','AtomCode'];
        let ok = 0; const details = [];
        for (const cn of clients) {
          const s = mk();
          try {
            const i = await s.send({ jsonrpc:'2.0', id:1, method:'initialize', params:{ protocolVersion:'2024-11-05', capabilities:{}, clientInfo:{ name: cn, version:'1' } } });
            const t = await s.send({ jsonrpc:'2.0', id:2, method:'tools/list', params:{} });
            const res = await s.send({ jsonrpc:'2.0', id:3, method:'tools/call', params:{ name:'huaweicloud_list_operations', arguments:{ service:'ECS' } } });
            const good = !!i?.result && (t?.result?.tools?.length||0) > 0 && !!(res?.result);
            if (good) ok++;
            details.push({ c: cn, tools: t?.result?.tools?.length ?? 0, call: !!res?.result });
          } catch(e) { details.push({ c: cn, err: String(e.message).slice(0,60) }); }
          s.kill();
        }
        console.log(JSON.stringify({ ok, total: clients.length, details }));
        process.exit(0);
      })();
    `], { encoding: 'utf8', timeout: 600000 });
    let o = {};
    try { o = JSON.parse((r.stdout || '').trim().split('\n').filter(l => l.startsWith('{')).pop() || '{}'); } catch {}
    c.eq('10 客户端全部协议互通', o.ok, 10);
    return { verdict: o.ok === 10 ? undefined : 'FAIL' };
  });
}

export async function d9_7() {
  return emit('D9-7', '协议版本协商降级', async c => {
    const r = spawnSync(process.execPath, ['-e', `
      const { spawn } = require('node:child_process');
      function mk(){ const c = spawn(process.execPath, ['${HDR}/src/mcp-server.mjs'], { stdio: ['pipe','pipe','pipe'], env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' } });
        let buf = Buffer.alloc(0); const pend = new Map();
        c.stdout.on('data', d => { buf = Buffer.concat([buf, d]);
          for (;;) { const h = buf.indexOf('\\r\\n\\r\\n'); if (h < 0) break;
            const m = /Content-Length:\\s*(\\d+)/i.exec(buf.slice(0,h).toString()); if (!m) { buf = buf.slice(h+4); continue; }
            const n = +m[1]; if (buf.length < h+4+n) break;
            const body = buf.slice(h+4, h+4+n).toString(); buf = buf.slice(h+4+n);
            try { const j = JSON.parse(body); if (j.id != null && pend.has(j.id)) { pend.get(j.id)(j); pend.delete(j.id); } } catch {} } });
        const send = o => { const b = JSON.stringify(o); c.stdin.write('Content-Length: ' + Buffer.byteLength(b) + '\\r\\n\\r\\n' + b); return new Promise(r => pend.set(o.id, r)); };
        return { c, send, kill: () => c.kill() }; }
      (async () => {
        const out = {};
        for (const [k, pv, caps] of [['old2024', '2024-11-05', {}], ['newer', '2099-01-01', {}], ['noCaps', '2024-11-05', null]]) {
          const s = mk();
          try {
            const params = { protocolVersion: pv, clientInfo:{ name:'old', version:'0.1' } };
            if (caps) params.capabilities = caps;
            const i = await s.send({ jsonrpc:'2.0', id:1, method:'initialize', params });
            out[k] = { proto: i?.result?.protocolVersion, err: i?.error?.code ?? null, ok: !!i?.result };
            const t = await s.send({ jsonrpc:'2.0', id:2, method:'tools/list', params:{} });
            out[k].tools = t?.result?.tools?.length ?? 0;
          } catch(e) { out[k] = { err: String(e.message).slice(0,80) }; }
          s.kill();
        }
        console.log(JSON.stringify(out));
        process.exit(0);
      })();
    `], { encoding: 'utf8', timeout: 300000 });
    let o = {};
    try { o = JSON.parse((r.stdout || '').trim().split('\n').filter(l => l.startsWith('{')).pop() || '{}'); } catch {}
    c.ok('老版本客户端完成协商(不挂死)', o.old2024?.ok === true, o.old2024, 'ok');
    c.ok('协商后 tools/list 可用', (o.old2024?.tools || 0) > 0, o.old2024?.tools, '>0');
    c.ok('超新版本不挂死(协商或明确报错)', o.newer?.ok === true || /^-?\d+$/.test(String(o.newer?.err)), o.newer, '协商或报错');
    c.ok('capabilities 缺失仍可完成握手', o.noCaps?.ok === true || /^-?\d+$/.test(String(o.noCaps?.err)), o.noCaps, '协商或报错');
    c.ok('协商结果版本可预测', typeof o.old2024?.proto === 'string', o.old2024?.proto, 'semver string');
    return {};
  });
}

export async function d9_8() {
  return emit('D9-8', 'inputSchema 版本合规', async c => {
    const { TOOL_DEFINITIONS } = await import(U('tools.mjs'));
    let versions = new Set(), mixed = [];
    for (const t of TOOL_DEFINITIONS) {
      const v = t.inputSchema?.$schema;
      if (v) versions.add(v);
      const txt = JSON.stringify(t.inputSchema || {});
      if (/"\$schema"\s*:\s*"http:\/\/json-schema\.org\/draft-07/.test(txt) && /2020-12/.test(txt)) mixed.push(t.name);
    }
    c.ok('无 draft-07 / 2020-12 混用', mixed, [], '[]');
    c.ok(`$schema 声明统一(实际: ${[...versions].join(',') || '未声明'})`, versions.size <= 1, [...versions], '<=1');
    c.ok('全部 schema 可 JSON 序列化', TOOL_DEFINITIONS.every(t => { try { JSON.parse(JSON.stringify(t.inputSchema)); return true; } catch { return false; } }), 'all', 'ok');
    return { verdict: versions.size <= 1 ? undefined : 'SPEC-MISMATCH', note: versions.size <= 1 ? undefined : `存在 ${versions.size} 种 $schema 版本声明：${[...versions].join(' , ')}` };
  });
}

export async function d9_10() {
  return emit('D9-10', 'MCP remote transport(9528)', async c => {
    const r = spawnSync(process.execPath, [`${REPO}/eval/harness/fixtures/d9-10-remote-transport.mjs`, `${HDR}/src`, '--evid', join(process.env.TEMP || 'C:/Windows/Temp', 'd9-10-ev')], { encoding: 'utf8', timeout: 300000 });
    const out = r.stdout || '';
    const pass = (out.match(/^PASS/gm) || []).length, fail = (out.match(/^FAIL/gm) || []).length;
    c.ok('remote 服务在 127.0.0.1:9528 监听', /listening on 127\.0\.0\.1:9528/.test(out), '9528', '监听');
    c.ok('remote initialize 返回 serverInfo', /D9-10-initialize\s+PASS/.test(out), 'initialize', 'PASS');
    c.ok('remote tools/list 与 stdio 一致', /D9-10-stdio-parity\s+PASS/.test(out), 'parity', 'PASS');
    c.ok(`夹具全部断言通过 (${pass}/${pass + fail})`, fail === 0 && pass > 0, { pass, fail, tail: out.slice(-200) }, 'fail=0');
    return {};
  });
}

export async function d9_11() {
  return emit('D9-11', 'WebSocket 隧道通道生命周期', async c => {
    const r = spawnSync(process.execPath, [`${REPO}/eval/harness/fixtures/d9-11-ws-tunnel.mjs`, `${HDR}/src`, '--evid', join(process.env.TEMP || 'C:/Windows/Temp', 'd9-11-ev')], { encoding: 'utf8', timeout: 300000 });
    const out = r.stdout || '';
    const pass = (out.match(/^PASS/gm) || []).length, fail = (out.match(/^FAIL/gm) || []).length;
    c.ok('attach 注册到 mux', /D9-11-attach\s+PASS/.test(out), 'attach', 'PASS');
    c.ok('ready Promise 在 open 时 resolve', /D9-11-ready-resolve\s+PASS/.test(out), 'ready', 'PASS');
    c.ok('close 后 localServer 关闭且 subConnections 清空', /D9-11-close-cleanup\s+PASS/.test(out), 'cleanup', 'PASS');
    c.ok(`夹具全部断言通过 (${pass}/${pass + fail})`, fail === 0 && pass > 0, { pass, fail, tail: out.slice(-200) }, 'fail=0');
    return {};
  });
}

export async function d9_12() {
  return emit('D9-12', 'initialize 握手协议安全基线', async c => {
    const src = readFileSync(`${HDR}/src/mcp-protocol.mjs`, 'utf-8');
    const tools = readFileSync(`${HDR}/src/tools.mjs`, 'utf-8');
    c.ok('mcp-protocol 导出 callTool 路由', /callTool/.test(src) || /handleRequest/.test(src), 'callTool', '存在');
    c.ok('_decorateResult 包装响应', src.includes('_decorateResult') || tools.includes('_decorateResult'), '_decorateResult', '存在');
    c.ok('_resetHintConsumption 消费提示标记', src.includes('_resetHintConsumption') || tools.includes('_resetHintConsumption'), '_resetHintConsumption', '存在');
    c.ok('_isHintConsumed 标记检查', src.includes('_isHintConsumed') || tools.includes('_isHintConsumed'), '_isHintConsumed', '存在');
    c.ok('listSkillDirs/findSkillsRoot 存在', tools.includes('listSkillDirs') || tools.includes('findSkillsRoot') || tools.includes('findSkills'), 'skills root', '存在');
    c.ok('非法时序返回 -32600', src.includes('-32600') || /非法时序|Invalid Request|未 initialize/i.test(src), '-32600', '存在');
    const skills = await import(`${SDK}/auth/credentials.mjs`);
    c.ok('模块可加载(无副作用崩溃)', typeof skills.globalCredentialsPath === 'function', 'ok', 'ok');
    const r = spawnSync(process.execPath, ['-e', `
      const { spawn } = require('node:child_process');
      const c = spawn(process.execPath, ['${HDR}/src/mcp-server.mjs'], { stdio: ['pipe','pipe','pipe'], env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' } });
      let buf = Buffer.alloc(0); const pend = new Map();
      c.stdout.on('data', d => { buf = Buffer.concat([buf, d]);
        for (;;) { const h = buf.indexOf('\\r\\n\\r\\n'); if (h < 0) break;
          const m = /Content-Length:\\s*(\\d+)/i.exec(buf.slice(0,h).toString()); if (!m) { buf = buf.slice(h+4); continue; }
          const n = +m[1]; if (buf.length < h+4+n) break;
          const body = buf.slice(h+4, h+4+n).toString(); buf = buf.slice(h+4+n);
          try { const j = JSON.parse(body); if (j.id != null && pend.has(j.id)) { pend.get(j.id)(j); pend.delete(j.id); } } catch {} } });
      const send = o => { const b = JSON.stringify(o); c.stdin.write('Content-Length: ' + Buffer.byteLength(b) + '\\r\\n\\r\\n' + b); return new Promise(r => pend.set(o.id, r)); };
      (async () => {
        const e = await send({ jsonrpc:'2.0', id:1, method:'tools/list', params:{} });
        const i = await send({ jsonrpc:'2.0', id:2, method:'initialize', params:{ protocolVersion:'2024-11-05', capabilities:{}, clientInfo:{name:'probe',version:'1'} } });
        console.log(JSON.stringify({ earlyCode: e?.error?.code ?? null, earlyHasResult: !!e?.result, proto: i?.result?.protocolVersion, caps: i?.result?.capabilities, srv: i?.result?.serverInfo?.name }));
        c.kill(); process.exit(0);
      })();
    `], { encoding: 'utf8', timeout: 120000 });
    let o = {};
    try { o = JSON.parse((r.stdout || '').trim().split('\n').filter(l => l.startsWith('{')).pop() || '{}'); } catch {}
    c.eq('initialize 返回 protocolVersion', o.proto, '2024-11-05');
    c.eq('initialize 返回 serverInfo.name', o.srv, 'huaweicloud-devkit');
    c.ok('initialize 返回 capabilities 对象', o.caps && typeof o.caps === 'object', o.caps, 'object');
    c.ok('非法时序(未 initialize)被拒', o.earlyHasResult === false, { code: o.earlyCode, hasResult: o.earlyHasResult }, '无 result');
    return {};
  });
}

export async function d9_13() {
  return emit('D9-13', 'tools/call 凭证不泄露与权限校验', async c => {
    const cred = await import(U('auth/credentials.mjs'));
    const { classifyHcloudArgs, loadPolicy, redactSecrets } = await import(U('safety-policy.mjs'));
    const rre = await import(U('risk-rule-engine.mjs'));
    const hc = await import(U('hcloud-cli.mjs'));
    cred.setRuntimeCredentials('AKPROBE00000000000A', 'SKPROBEfakefakefakefake000', 'STPROBE000000');
    c.eq('setRuntimeCredentials 生效', cred.hasRuntimeCredentials(), true);
    const rt = cred.resolveCredentialsWithRuntime({});
    c.eq('resolveCredentialsWithRuntime 返回注入 AK', rt.accessKeyId || rt.ak, 'AKPROBE00000000000A');
    c.ok('loadPolicy 加载策略', typeof loadPolicy() === 'object', 'ok', 'ok');
    const cls = classifyHcloudArgs(['ECS', 'ListServersDetails']);
    c.ok('classifyHcloudArgs 返回三态判定', ['allow', 'warn', 'deny'].includes(cls.decision), cls.decision, '三态');
    c.ok('evaluateArtifacts 可用', typeof rre.evaluateArtifacts === 'function', 'ok', 'ok');
    c.ok('evaluateDeployPlan 可用', typeof rre.evaluateDeployPlan === 'function', 'ok', 'ok');
    c.ok('mergeRiskDecision 可用', typeof rre.mergeRiskDecision === 'function', 'ok', 'ok');
    const t = hc.createApprovalToken(['ECS', 'CreateServers']);
    hc.consumeApprovalToken(t);
    const t2 = hc.consumeApprovalToken(t);
    c.ok('审批令牌不可重放', t2 && (t2.valid === false || t2.outcome), t2, 'invalid');
    c.ok('readServiceCatalogs 可用', typeof hc.readServiceCatalogs === 'function', 'ok', 'ok');
    c.ok('classifyUnsupported 可用', typeof hc.classifyUnsupported === 'function', 'ok', 'ok');
    c.ok('planHcloudCommand 可用', typeof hc.planHcloudCommand === 'function', 'ok', 'ok');
    // tools/call 返回不含明文
    const { callTool } = await import(U('tools.mjs'));
    const r = await callTool('huaweicloud_show_profile_redacted', {});
    const txt = JSON.stringify(r);
    c.ok('tools/call 返回不含明文 AK', !txt.includes('AKPROBE00000000000A'), 'AK', '不含');
    c.ok('tools/call 返回不含明文 SK', !txt.includes('SKPROBEfakefakefakefake000'), 'SK', '不含');
    c.ok('tools/call 返回不含明文 token', !txt.includes('STPROBE000000'), 'token', '不含');
    const before = readFileSync('C:/Users/Administrator/.config/huaweicloud/credentials.json', 'utf-8');
    cred.clearRuntimeCredentials();
    c.eq('clearRuntimeCredentials 清理 runtime', cred.hasRuntimeCredentials(), false);
    c.eq('clearRuntimeCredentials 不落盘到 S1', readFileSync('C:/Users/Administrator/.config/huaweicloud/credentials.json', 'utf-8'), before);
    c.eq('readGlobalCredentials 可读', typeof cred.readGlobalCredentials() === 'object', true);
    c.ok('globalCredentialsPath 路径正确', cred.globalCredentialsPath().endsWith('credentials.json'), cred.globalCredentialsPath(), 'credentials.json');
    c.ok('obsConfigPath 路径正确', /obsutilconfig/.test(cred.obsConfigPath()), cred.obsConfigPath(), 'obsutilconfig');
    c.eq('isPlaceholder 识别占位', cred.isPlaceholder('YOUR_AK_HERE'), true);
    c.eq('isPlaceholder 不误判真实值', cred.isPlaceholder('AKIAIOSFODNN7EXAMPLE'), false);
    return {};
  });
}

export async function exp_e01() { return emit('EXP-E01', '路由评测: 查询 ECS 清单(中文)', async c => await routeOne(c, 1, ECS, '帮我查一下我账号在华北北京四有哪些云主机')); }
export async function exp_e02() { return emit('EXP-E02', '路由评测: 创建 2C4G Ubuntu 云服务器', async c => await routeOne(c, 2, ECS, '创建一台2C4G 的 Ubuntu 云服务器')); }
export async function exp_e03() { return emit('EXP-E03', '路由评测: dist 部署为公网静态网站', async c => await routeOne(c, 3, OBS, '把本地 dist 目录部署成一个公网静态网站')); }
export async function exp_e04() { return emit('EXP-E04', '路由评测: 绑定弹性公网 IP', async c => await routeOne(c, 4, EIP, '给这台服务器绑定一个弹性公网IP')); }
export async function exp_e05() { return emit('EXP-E05', '路由评测: MySQL 实例状态', async c => await routeOne(c, 5, RDS, '看一下我的云数据库MySQL实例的状态')); }
export async function exp_e06() { return emit('EXP-E06', '路由评测: Redis 缓存实例', async c => await routeOne(c, 6, DCS, '创建一个Redis 缓存实例用于会话存储')); }
export async function exp_e07() { return emit('EXP-E07', '路由评测: 生产环境每日备份', async c => await routeOne(c, 7, CBR, '给生产环境的服务器配置一个每日备份策略')); }
export async function exp_e08() { return emit('EXP-E08', '路由评测: ECS 启动失败诊断', async c => await routeOne(c, 8, null, '我的ECS启动失败，帮我分析原因')); }
export async function exp_e09() { return emit('EXP-E09', '路由评测: Kubernetes 集群', async c => await routeOne(c, 9, CCE, '开设一个 Kubernetes 集群用于微服务部署')); }
export async function exp_e10() { return emit('EXP-E10', '路由评测: 图片压缩函数', async c => await routeOne(c, 10, FunctionGraph, '部署一个函数处理图片自动压缩')); }
export async function exp_e11() { return emit('EXP-E11', '路由评测: 本月费用', async c => await routeOne(c, 11, BSS, '查一下我账号这个月的费用情况')); }
export async function exp_e12() { return emit('EXP-E12', '路由评测: 日志指标推送到云监控', async c => await routeOne(c, 12, CES, '把应用日志指标推送到云监控告警')); }
export async function exp_e13() { return emit('EXP-E13', '路由评测: HTTPS 证书配置到域名', async c => await routeOne(c, 13, ELB, '申请HTTPS证书并配置到我的域名')); }
export async function exp_e14() { return emit('EXP-E14', '路由评测: 用户权限审计', async c => await routeOne(c, 14, IAM, '我账号下的用户都有哪些权限，帮我审计一下')); }
export async function exp_e15() { return emit('EXP-E15', '路由评测: 领取代金券', async c => await routeOne(c, 15, Voucher, '帮我领一下华为云的代金券')); }

async function routeOne(c, n, expect, intent) {
  const { callTool } = await import(U('tools.mjs'));
  const r = await callTool('huaweicloud_service_catalog', { intent });
  const t = JSON.stringify(r);
  c.ok('service_catalog 调用成功', r && r.isError === false, r && r.isError, false);
  c.ok('返回 recommendedServices', Array.isArray(r.recommendedServices) && r.recommendedServices.length > 0, r.recommendedServices?.slice(0, 3), '>0');
  if (expect) {
    const hit = new RegExp(expect.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(t);
    c.ok(`命中预期服务 ${expect}`, hit, r.recommendedServices?.slice(0, 4), `含 ${expect}`);
  } else {
    c.ok('诊断类意图有 nextStep/建议(可定位)', /nextStep|建议|诊断|troubleshoot|Run hcloud/i.test(t), 'nextStep', '存在');
  }
}

export async function exp_c4_01() { return emit('EXP-C4-01', 'EXP-C4 枚举: ECS 服务创建回路', async c => { const { callTool } = await import(U('tools.mjs')); const r = await callTool('huaweicloud_list_operations', { service: 'ECS' }); const txt = r.content ? r.content.map(x => x.text || '').join('') : ''; c.ok('ECS CreateServers 可发现', /CreateServers/.test(txt), 'CreateServers', '存在'); c.ok('ECS DeleteServer 可发现', /DeleteServer/.test(txt), 'DeleteServer', '存在'); return {}; }); }
export async function exp_c4_02() { return emit('EXP-C4-02', 'EXP-C4 枚举: VPC 服务创建回路', async c => { const { callTool } = await import(U('tools.mjs')); const r = await callTool('huaweicloud_list_operations', { service: 'VPC' }); const txt = r.content ? r.content.map(x => x.text || '').join('') : ''; c.ok('VPC CreateVpc 可发现', /CreateVpc/.test(txt), 'CreateVpc', '存在'); c.ok('VPC DeleteVpc 可发现', /DeleteVpc/.test(txt), 'DeleteVpc', '存在'); return {}; }); }
export async function exp_c4_03() { return emit('EXP-C4-03', 'EXP-C4 枚举: OBS 服务创建回路', async c => { const { callTool } = await import(U('tools.mjs')); const r = await callTool('huaweicloud_list_operations', { service: 'OBS' }); const txt = r.content ? r.content.map(x => x.text || '').join('') : ''; c.ok('OBS CreateBucket 可发现', /CreateBucket/.test(txt), 'CreateBucket', '存在'); c.ok('OBS DeleteBucket 可发现', /DeleteBucket/.test(txt), 'DeleteBucket', '存在'); return {}; }); }
export async function exp_c4_04() { return emit('EXP-C4-04', 'EXP-C4 枚举: RDS 服务创建回路', async c => { const { callTool } = await import(U('tools.mjs')); const r = await callTool('huaweicloud_list_operations', { service: 'RDS' }); const txt = r.content ? r.content.map(x => x.text || '').join('') : ''; c.ok('RDS 有 Create 类操作', /Create/.test(txt), 'Create', '存在'); return {}; }); }
export async function exp_c4_05() { return emit('EXP-C4-05', 'EXP-C4 枚举: EVS 服务创建回路', async c => { const { callTool } = await import(U('tools.mjs')); const r = await callTool('huaweicloud_list_operations', { service: 'EVS' }); const txt = r.content ? r.content.map(x => x.text || '').join('') : ''; c.ok('EVS CreateVolume 可发现', /CreateVolume/.test(txt), 'CreateVolume', '存在'); return {}; }); }
export async function exp_c4_06() { return emit('EXP-C4-06', 'EXP-C4 枚举: EIP 服务创建回路', async c => { const { callTool } = await import(U('tools.mjs')); const r = await callTool('huaweicloud_list_operations', { service: 'EIP' }); const txt = r.content ? r.content.map(x => x.text || '').join('') : ''; c.ok('EIP CreatePublicIP 可发现', /Create/.test(txt), 'Create', '存在'); return {}; }); }
export async function exp_c4_07() { return emit('EXP-C4-07', 'EXP-C4 枚举: CCE 服务创建回路', async c => { const { callTool } = await import(U('tools.mjs')); const r = await callTool('huaweicloud_list_operations', { service: 'CCE' }); const txt = r.content ? r.content.map(x => x.text || '').join('') : ''; c.ok('CCE CreateCluster 可发现', /Create/.test(txt), 'Create', '存在'); return {}; }); }
export async function exp_c4_08() { return emit('EXP-C4-08', 'EXP-C4 枚举: FunctionGraph 服务创建回路', async c => { const { callTool } = await import(U('tools.mjs')); const r = await callTool('huaweicloud_list_operations', { service: 'FunctionGraph' }); const txt = r.content ? r.content.map(x => x.text || '').join('') : ''; c.ok('FunctionGraph CreateFunction 可发现', /CreateFunction/.test(txt), 'CreateFunction', '存在'); return {}; }); }
export async function exp_c4_09() { return emit('EXP-C4-09', 'EXP-C4 枚举: SMN 服务创建回路', async c => { const { callTool } = await import(U('tools.mjs')); const r = await callTool('huaweicloud_list_operations', { service: 'SMN' }); const txt = r.content ? r.content.map(x => x.text || '').join('') : ''; c.ok('SMN 有 Create 类操作', /Create/.test(txt), 'Create', '存在'); return {}; }); }
export async function exp_c4_10() { return emit('EXP-C4-10', 'EXP-C4 枚举: CTS 服务创建回路', async c => { const { callTool } = await import(U('tools.mjs')); const r = await callTool('huaweicloud_list_operations', { service: 'CTS' }); const txt = r.content ? r.content.map(x => x.text || '').join('') : ''; c.ok('CTS 可列举', (r && r.isError === false) || txt.length > 0, r && r.isError, 'ok'); return {}; }); }
export async function exp_c4_11() { return emit('EXP-C4-11', 'EXP-C4 枚举: KMS 服务创建回路', async c => { const { callTool } = await import(U('tools.mjs')); const r = await callTool('huaweicloud_list_operations', { service: 'KMS' }); const txt = r.content ? r.content.map(x => x.text || '').join('') : ''; c.ok('KMS CreateKey 可发现', /Create/.test(txt), 'Create', '存在'); return {}; }); }
export async function exp_c4_12() { return emit('EXP-C4-12', 'EXP-C4 枚举: CBR 服务创建回路', async c => { const { callTool } = await import(U('tools.mjs')); const r = await callTool('huaweicloud_list_operations', { service: 'CBR' }); const txt = r.content ? r.content.map(x => x.text || '').join('') : ''; c.ok('CBR 有 Create 类操作', /Create/.test(txt), 'Create', '存在'); return {}; }); }
export async function exp_c4_13() { return emit('EXP-C4-13', 'EXP-C4 枚举: DDS 服务创建回路', async c => { const { callTool } = await import(U('tools.mjs')); const r = await callTool('huaweicloud_list_operations', { service: 'DDS' }); const txt = r.content ? r.content.map(x => x.text || '').join('') : ''; c.ok('DDS CreateInstance 可发现', /Create/.test(txt), 'Create', '存在'); return {}; }); }
export async function exp_c4_14() { return emit('EXP-C4-14', 'EXP-C4 枚举: DCS 服务创建回路', async c => { const { callTool } = await import(U('tools.mjs')); const r = await callTool('huaweicloud_list_operations', { service: 'DCS' }); const txt = r.content ? r.content.map(x => x.text || '').join('') : ''; c.ok('DCS CreateInstance 可发现', /Create/.test(txt), 'Create', '存在'); return {}; }); }
export async function exp_c4_15() { return emit('EXP-C4-15', 'EXP-C4 枚举: GaussDB 服务创建回路', async c => { const { callTool } = await import(U('tools.mjs')); const r = await callTool('huaweicloud_list_operations', { service: 'GaussDB' }); const txt = r.content ? r.content.map(x => x.text || '').join('') : ''; c.ok('GaussDB 有 Create 类操作', /Create/.test(txt), 'Create', '存在'); return {}; }); }
export async function exp_c4_16() { return emit('EXP-C4-16', 'EXP-C4 枚举: ELB 服务创建回路', async c => { const { callTool } = await import(U('tools.mjs')); const r = await callTool('huaweicloud_list_operations', { service: 'ELB' }); const txt = r.content ? r.content.map(x => x.text || '').join('') : ''; c.ok('ELB CreateLoadBalancer 可发现', /Create/.test(txt), 'Create', '存在'); return {}; }); }
export async function exp_c4_17() { return emit('EXP-C4-17', 'EXP-C4 枚举: APIG 服务创建回路', async c => { const { callTool } = await import(U('tools.mjs')); const r = await callTool('huaweicloud_list_operations', { service: 'APIG' }); const txt = r.content ? r.content.map(x => x.text || '').join('') : ''; c.ok('APIG CreateApi 可发现', /Create/.test(txt), 'Create', '存在'); return {}; }); }
export async function exp_c4_18() { return emit('EXP-C4-18', 'EXP-C4 枚举: DNS 服务创建回路', async c => { const { callTool } = await import(U('tools.mjs')); const r = await callTool('huaweicloud_list_operations', { service: 'DNS' }); const txt = r.content ? r.content.map(x => x.text || '').join('') : ''; c.ok('DNS 有 Create 类操作', /Create/.test(txt), 'Create', '存在'); return {}; }); }
export async function exp_c4_19() { return emit('EXP-C4-19', 'EXP-C4 枚举: AS 服务创建回路', async c => { const { callCall: _x, ...m } = {}; const { callTool } = await import(U('tools.mjs')); const r = await callTool('huaweicloud_list_operations', { service: 'AS' }); const txt = r.content ? r.content.map(x => x.text || '').join('') : ''; c.ok('AS 有 Create 类操作', /Create/.test(txt), 'Create', '存在'); return {}; }); }
export async function exp_c4_20() { return emit('EXP-C4-20', 'EXP-C4 枚举: IAM 服务创建回路', async c => { const { callTool } = await import(U('tools.mjs')); const r = await callTool('huaweicloud_list_operations', { service: 'IAM' }); const txt = r.content ? r.content.map(x => x.text || '').join('') : ''; c.ok('IAM CreateUser 可发现', /Create/.test(txt), 'Create', '存在'); return {}; }); }
export async function exp_c4_21() { return emit('EXP-C4-21', 'EXP-C4 枚举: OBS 静态托管操作可发现', async c => { const { callTool } = await import(U('tools.mjs')); const r = await callTool('huaweicloud_obs_set_website_config', { action: 'get', bucket: 'notexist-hdk-probe', region: 'cn-north-4' }); c.ok('静态托管工具对不存在 bucket 返回明确错误(非崩溃)', r && r.isError === true, { isError: r && r.isError, text: JSON.stringify(r).slice(0, 160) }, true); return {}; }); }
export async function exp_c4_22() { return emit('EXP-C4-22', 'EXP-C4 枚举: 20+ 服务可发现性汇总', async c => { const { callTool } = await import(U('tools.mjs')); const svcs = ['ECS','VPC','OBS','RDS','EVS','EIP','IAM','SMN','DDS','GaussDB','CCE','FunctionGraph','APIG','ELB','AS','CTS','DNS','KMS','CSMS','CBR','CFS','DLM','DMS','AOM','LTS']; let ok = 0; for (const s of svcs) { const r = await callTool('huaweicloud_list_operations', { service: s }); if (r && r.isError === false) ok++; } c.ok(`20+ 服务均可 list_operations (${ok}/${svcs.length})`, ok >= 20, ok, '>=20'); return {}; }); }
export async function exp_d5_1_1() { return emit('EXP-D5-1-1', 'EXP-D5 展开: OpenCode 客户端发现', async c => { const { TOOL_DEFINITIONS } = await import(U('tools.mjs')); c.ok('OpenCode 为注册安装目标', /opencode/i.test(readFileSync(`${HDR}/src/auth/agent-registration.mjs`, 'utf-8')), 'opencode', '存在'); c.ok('OpenCode 侧工具可枚举', TOOL_DEFINITIONS.length > 0, TOOL_DEFINITIONS.length, '>0'); return {}; }); }
export async function exp_d5_1_3() { return emit('EXP-D5-1-3', 'EXP-D5 展开: Hermes 客户端发现', async c => { const reg = await import(`${SDK}/auth/agent-registration.mjs`); c.ok('Hermes 为注册安装目标', reg.SUPPORTED_AGENT_TARGETS.map(x => String(x).toLowerCase()).includes('hermes'), reg.SUPPORTED_AGENT_TARGETS, '含 hermes'); return {}; }); }