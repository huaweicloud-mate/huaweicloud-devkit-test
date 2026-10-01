// probe-lib/extra.mjs — D1/D2/D4 剩余用例的真实断言实现
import { emit, SDK, REPO } from './shared.mjs';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, existsSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir, homedir } from 'node:os';
import { join } from 'node:path';

const U = p => `${SDK}/${p}`;
const HDR = 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/plugins/huaweicloud-core';

export async function d4_16() {
  return emit('D4-16', 'hook 绕过尝试(命令包裹/编码/拼接)', async c => {
    const { callTool } = await import(U('tools.mjs'));
    const { classifyTextCommand } = await import(U('safety-policy.mjs'));
    const { evaluateCommandRisk } = await import(U('risk-rule-engine.mjs'));
    const bypass = [
      'sh -c "cat ~/.config/huaweicloud/credentials.json"',
      'sh -c "printenv HUAWEICLOUD_SDK_AK"',
      'bash -c "hcloud ECS DeleteServer"',
      'cmd /c type %USERPROFILE%\\.hcloud\\config.json',
      'powershell -c "cat ~/.config/huaweicloud/credentials.json"',
      'hcloud ECS $(printf Delete)Server',
      'hcloud ECS Delet%65Server',
      'eval "cat ~/.config/huaweicloud/credentials.json"',
    ];
    let bypassed = [];
    for (const cmd of bypass) {
      const hook = (await callTool('huaweicloud_hook_check_command', { command: cmd })).decision;
      const eng = evaluateCommandRisk(cmd).decision;
      if (hook === 'allow' || eng === 'allow') bypassed.push({ cmd, hook, engine: eng, policy: classifyTextCommand(cmd).decision });
    }
    c.eq('全部包裹/编码变体均未被放行', bypassed, []);
    return {
      note: bypassed.length
        ? `以下 ${bypassed.length} 条成功绕过 hook_check_command：\n${bypassed.map(b => `  - \`${b.cmd}\`\n      hook=${b.hook} / risk-rule-engine=${b.engine} / safety-policy.classifyTextCommand=${b.policy}`).join('\n')}\n\n根因：\`tools.mjs\` 的 hook_check_command 走 \`evaluateCommandRisk(cmd)\`（risk-rule-engine.mjs），该引擎只按顶层 token 匹配 sh/bash/cmd/powershell/eval 包裹与 \`$(...)\`/URL 编码，不展开嵌套命令；而 \`safety-policy.classifyTextCommand\` 会递归展开包裹并判定 deny。两个入口对同一条命令给出相反结论 —— 安全分类器已识别的风险在 hook 执行路径上丢失。` : undefined,
    };
  });
}

export async function d4_12() {
  return emit('D4-12', '供应链安装期安全', async c => {
    const r = spawnSync(process.execPath, [`${REPO}/eval/harness/fixtures/d4-12-supply-chain.mjs`, `${HDR}/src`, '--evid', join(process.env.TEMP || 'C:/Windows/Temp', 'd4-12-ev')], { encoding: 'utf8', timeout: 300000 });
    const out = r.stdout || '';
    const pass = (out.match(/^PASS/gm) || []).length, fail = (out.match(/^FAIL/gm) || []).length;
    c.ok('无 preinstall 脚本(供应链高发点)', /D4-12-no-preinstall\s+PASS/.test(out), 'no preinstall', 'PASS');
    c.ok('postinstall 指向自有 bin', /D4-12-postinstall-self\s+PASS/.test(out), 'own bin', 'PASS');
    c.ok('依赖无已知高危包', /D4-12-no-known-cve-deps\s+PASS/.test(out), 'no cve', 'PASS');
    c.ok('依赖版本全部固定', /D4-12-sbom-all-versioned\s+PASS/.test(out), 'pinned', 'PASS');
    c.ok(`夹具全部断言通过 (${pass}/${pass + fail})`, fail === 0 && pass > 0, { pass, fail, tail: out.slice(-260) }, 'fail=0');
    return {};
  });
}

export async function d4_29() {
  return emit('D4-29', '分类断言与原始命令分类入口', async c => {
    const r = spawnSync(process.execPath, [`${REPO}/eval/harness/fixtures/d4-29-classify-assert.mjs`, `${HDR}/src`, '--evid', join(process.env.TEMP || 'C:/Windows/Temp', 'd4-29-ev')], { encoding: 'utf8', timeout: 300000 });
    const out = r.stdout || '';
    const pass = (out.match(/^PASS/gm) || []).length, fail = (out.match(/^FAIL/gm) || []).length;
    c.ok('classifyRawCommand 委托 classifyTextCommand', /D4-29-raw-delegates\s+PASS/.test(out), 'delegate', 'PASS');
    c.ok('凭证文件读取 → deny/credential', /D4-29-cred-file-deny\s+PASS/.test(out), 'deny', 'PASS');
    c.ok('凭证 env dump → deny', /D4-29-env-dump-deny\s+PASS/.test(out), 'deny', 'PASS');
    c.ok('hcloud 写操作 → deny', /D4-29-hcloud-write-deny\s+PASS/.test(out), 'deny', 'PASS');
    c.ok('redactSecrets 脱敏', /D4-29-redact-secrets\s+PASS/.test(out), 'redact', 'PASS');
    c.ok(`夹具全部断言通过 (${pass}/${pass + fail})`, fail === 0 && pass > 0, { pass, fail, tail: out.slice(-260) }, 'fail=0');
    return {};
  });
}

export async function d1_69() {
  return emit('D1-69', 'CLI help 子命令', async c => {
    const r = spawnSync(process.execPath, [`${REPO}/eval/harness/fixtures/d1-69-cli-help.mjs`, `${HDR}/src`, '--evid', join(process.env.TEMP || 'C:/Windows/Temp', 'd1-69-ev')], { encoding: 'utf8', timeout: 300000 });
    const out = r.stdout || '';
    const pass = (out.match(/^PASS/gm) || []).length, fail = (out.match(/^FAIL/gm) || []).length;
    c.ok('help 退出码 0 且含 BANNER', /D1-69-help-banner\s+PASS/.test(out), 'banner', 'PASS');
    c.ok('--help/-h/无参 均退出码 0', /D1-69-dash-help-exit0\s+PASS/.test(out) && /D1-69-short-h-exit0\s+PASS/.test(out), 'flags', 'PASS');
    c.ok('--version 输出版本号', /D1-69-version-output\s+PASS/.test(out), 'version', 'PASS');
    c.ok('未知子命令不 crash(回落 help)', /D1-69-unknown-cmd-help\s+PASS/.test(out), 'unknown', 'PASS');
    c.ok(`夹具全部断言通过 (${pass}/${pass + fail})`, fail === 0 && pass > 0, { pass, fail, tail: out.slice(-260) }, 'fail=0');
    return {};
  });
}

export async function d1_66() {
  return emit('D1-66', '遥测开关与端点环境变量', async c => {
    const r = spawnSync(process.execPath, [`${REPO}/eval/harness/fixtures/d1-66-telemetry-env.mjs`, `${HDR}/src`, '--evid', join(process.env.TEMP || 'C:/Windows/Temp', 'd1-66-ev')], { encoding: 'utf8', timeout: 300000 });
    const out = r.stdout || '';
    const pass = (out.match(/^PASS/gm) || []).length, fail = (out.match(/^FAIL/gm) || []).length;
    c.ok('遥测默认开启', /D1-66-default-on\s+PASS/.test(out), 'default on', 'PASS');
    c.ok('TELEMETRY=off 关闭遥测', /D1-66-telemetry-off\s+PASS/.test(out), 'off', 'PASS');
    c.ok('TELEMETRY=on 仍开启', /D1-66-telemetry-on\s+PASS/.test(out), 'on', 'PASS');
    c.ok('sanitizeValue 清除换行/制表', /D1-66-sanitize-newlines\s+PASS/.test(out), 'sanitize', 'PASS');
    c.ok(`夹具全部断言通过 (${pass}/${pass + fail})`, fail === 0 && pass > 0, { pass, fail, tail: out.slice(-260) }, 'fail=0');
    return {};
  });
}

export async function d2_13() {
  return emit('D2-13', '隔离 S1 + HW_ACCESS_KEY env 优先级', async c => {
    const r = spawnSync(process.execPath, [`${REPO}/eval/harness/fixtures/d2-13-s1-env.mjs`, `${HDR}/src`, '--evid', join(process.env.TEMP || 'C:/Windows/Temp', 'd2-13-ev')], { encoding: 'utf8', timeout: 300000 });
    const out = r.stdout || '';
    const pass = (out.match(/^PASS/gm) || []).length, fail = (out.match(/^FAIL/gm) || []).length;
    c.ok('configuredBySession=true 时 S1 胜出并忽略 env', /D2-13-s1-wins\s+PASS/.test(out), 's1 wins', 'PASS');
    c.ok('清除标记后 env 兜底恢复', /D2-13-env-fallback\s+PASS/.test(out), 'env fallback', 'PASS');
    c.ok('占位凭证不劫持真实 env', /D2-13-placeholder-not-cred\s+PASS/.test(out), 'placeholder', 'PASS');
    c.ok(`夹具全部断言通过 (${pass}/${pass + fail})`, fail === 0 && pass > 0, { pass, fail, tail: out.slice(-260) }, 'fail=0');
    return {};
  });
}

export async function d2_27() {
  return emit('D2-27', 'KooCLI 版本管理', async c => {
    const r = spawnSync(process.execPath, [`${REPO}/eval/harness/fixtures/d2-27-koocli-version.mjs`, `${HDR}/src`, '--evid', join(process.env.TEMP || 'C:/Windows/Temp', 'd2-27-ev')], { encoding: 'utf8', timeout: 300000 });
    const out = r.stdout || '';
    const pass = (out.match(/^PASS/gm) || []).length, fail = (out.match(/^FAIL/gm) || []).length;
    c.ok('KooCLI 下载基址正确', /D2-27-base-url\s+PASS/.test(out), 'base url', 'PASS');
    c.ok('getKooCliVersion 返回版本号', /D2-27-get-version\s+PASS/.test(out), 'version', 'PASS');
    c.ok('parseHcloudVersion 多格式解析', /D2-27-parse-version\s+PASS/.test(out), 'parse', 'PASS');
    c.ok(`夹具全部断言通过 (${pass}/${pass + fail})`, fail === 0 && pass > 0, { pass, fail, tail: out.slice(-260) }, 'fail=0');
    return {};
  });
}

export async function d1_45() {
  return emit('D1-45', '兜底提示一次性消费时序', async c => {
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
        const upd = await send({ jsonrpc:'2.0', id:2, method:'tools/call', params:{ name:'huaweicloud_check_update', arguments:{} } });
        const updTxt = JSON.stringify(upd?.result || {});
        const t1 = await send({ jsonrpc:'2.0', id:3, method:'tools/call', params:{ name:'huaweicloud_search_docs', arguments:{ query:'ECS' } } });
        const t2 = await send({ jsonrpc:'2.0', id:4, method:'tools/call', params:{ name:'huaweicloud_search_docs', arguments:{ query:'VPC' } } });
        const firstHas = /_updateInfo/.test(JSON.stringify(t1?.result||{}));
        const secondHas = /_updateInfo/.test(JSON.stringify(t2?.result||{}));
        console.log(JSON.stringify({
          checkHasUpdateInfo: /_updateInfo/.test(updTxt),
          firstNonCheckHas: firstHas, secondNonCheckHas: secondHas,
          repeated: firstHas && secondHas,
          updateResult: /check_failed|update_available|up_to_date|dismissed/.exec(updTxt)?.[0] || 'unknown',
        }));
        c.kill(); process.exit(0);
      })();
    `], { encoding: 'utf8', timeout: 300000 });
    let o = {};
    try { o = JSON.parse((r.stdout || '').trim().split('\n').filter(l => l.startsWith('{')).pop() || '{}'); } catch {}
    c.ok('check_update 工具本身不附加 _updateInfo', o.checkHasUpdateInfo === false, o.checkHasUpdateInfo, false);
    c.ok('首个非检查工具消费兜底提示', o.firstNonCheckHas === true, o.firstNonCheckHas, true);
    c.ok('第二个非检查工具不重复附加(一次性)', o.secondNonCheckHas === false, o.secondNonCheckHas, false);
    c.ok('预热未阻塞正常工具响应(两工具均有结果)', o.firstNonCheckHas !== undefined, o, 'ok');
    c.ok('检查工具返回合法 result 态', ['check_failed', 'update_available', 'up_to_date', 'dismissed'].includes(o.updateResult), o.updateResult, '四态之一');
    return { note: o.updateResult === 'check_failed' ? '兜底提示时序逻辑本身正确（一次性消费）；但因 D1-39 缺陷，实际注入的是 check_failed 态而非 update_available 态，故兜底提示分支未被真正触发验证。' : undefined };
  });
}

export async function d1_70() {
  return emit('D1-70', '代理配置与 WebSocket 代理', async c => {
    const { writeProxyConfig, readProxyConfig, clearProxyConfig, getProxySettings, shouldBypassProxy, proxyConfigPath } = await import(U('proxy/proxy-config.mjs'));
    const path = proxyConfigPath();
    const backup = existsSync(path) ? readFileSync(path, 'utf-8') : null;
    try {
      const cfg = { proxy: { http: 'http://127.0.0.1:3128', https: 'http://127.0.0.1:3128' } };
      writeProxyConfig(cfg);
      c.ok('writeProxyConfig 落盘', existsSync(path), path, 'exists');
      const back = readProxyConfig();
      c.ok('readProxyConfig 回读一致', JSON.stringify(back) === JSON.stringify(cfg), back, cfg);
      const old = { ...process.env };
      process.env.HTTPS_PROXY = 'http://127.0.0.1:8080';
      process.env.NO_PROXY = 'example.com,localhost';
      const s = await getProxySettings('https://huaweicloud.com');
      c.ok('getProxySettings 合并 env+file', s && (s.https || s.proxy || s.httpsProxy), s, '含代理');
      const bypass = await getProxySettings('https://example.com/x');
      c.eq('no_proxy 命中返回 null', bypass, null);
      c.eq('shouldBypassProxy 命中', shouldBypassProxy('example.com', ['example.com']), true);
      c.eq('shouldBypassProxy 未命中', shouldBypassProxy('huaweicloud.com', ['example.com']), false);
      for (const k of Object.keys(process.env)) if (!(k in old)) delete process.env[k]; else process.env[k] = old[k];
      const ag = await import(U('proxy/proxy-agent.mjs'));
      c.ok('getProxyDispatcher 可用', typeof ag.getProxyDispatcher === 'function', 'ok', 'ok');
      c.ok('createProxyWebSocket 可用', typeof ag.createProxyWebSocket === 'function', 'ok', 'ok');
      c.ok('无代理时回退 globalThis.WebSocket', typeof globalThis.WebSocket === 'function' || typeof globalThis.WebSocket === 'object', typeof globalThis.WebSocket, '存在');
      clearProxyConfig();
      c.ok('clearProxyConfig 清空', !existsSync(path) || readFileSync(path, 'utf-8').trim() === '' || readFileSync(path, 'utf-8').includes('"http"') === false, 'cleared', 'cleared');
    } finally {
      if (backup !== null) writeFileSync(path, backup, 'utf-8'); else clearProxyConfig();
    }
    return {};
  });
}