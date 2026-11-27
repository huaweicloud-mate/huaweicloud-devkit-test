import {
  mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson,
  writeEvidence, writeProbe, VC_QUOTE, DIST, HOME, PKG, PATHS,
} from './lib.mjs';
import { existsSync, readFileSync, readdirSync, statSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const cases = [
  { id: 'D1-39', title: 'Windows ????????', fn: async () => {
    const fs = await import('node:fs');
    const ur = await import('file:///' + DIST + '/update-registry.js');
    const syncRes = ur.queryDistTagsSync();
    const fetchRes = await ur.queryDistTagsFetch();
    const syncOk = !!(syncRes && (syncRes.latest || syncRes.next));
    return {
      status: syncOk ? 'PASS' : 'FAIL',
      why: syncOk ? 'queryDistTagsSync ?? dist-tags' : 'queryDistTagsSync ?? null?npm view dist-tags ??? JSON ???parseDistTagsOutput/toDistTags ??????check_update ?? check_failed?fetch ????',
      result: { syncRes, fetchRes, npmRaw: (await import('node:child_process')).spawnSync('npm.cmd view huaweicloud-devkit dist-tags --json', { encoding: 'utf8', shell: true, timeout: 15000 }).stdout.slice(0, 200) },
    };
  } },
  { id: 'D1-40', title: '?? lag ??????(??????)', fn: async () => {
    const uc = await import('file:///' + DIST + '/update-check.js');
    const older = uc.judgeUpdate('1.1.14', { latest: '1.1.13', next: null }, null);
    const newer = uc.judgeUpdate('1.1.14', { latest: '1.1.15', next: null }, null);
    const same = uc.judgeUpdate('1.1.14', { latest: '1.1.14', next: null }, null);
    const ok = older.updateAvailable === false && same.updateAvailable === false && newer.updateAvailable === true;
    return { status: ok ? 'PASS' : 'FAIL', why: ok ? '??<=?????????>??????????????' : 'judgeUpdate ????', result: { older, same, newer } };
  } },
  { id: 'D2-4', title: '???????', fn: async () => {
    const r = await mcpTool('huaweicloud_show_profile_redacted', { vendorConfirmed: VC_QUOTE }, 60000);
    const text = JSON.stringify(r.parsed || r.text || '');
    const leakedSk = /"secretAccessKey"\s*:\s*"(?!<redacted>)[^"]{10,}"/.test(text);
    const leakedAk = /"accessKeyId"\s*:\s*"(?!<redacted>)[^"]{10,}"/.test(text);
    const ok = r.ok && !leakedSk && !leakedAk && /redacted/i.test(text);
    return { status: ok ? 'PASS' : 'FAIL', why: ok ? 'AK/SK/token ?? <redacted>?? redaction pipeline?' : '????????????', result: { text: text.slice(0, 700), leakedAk, leakedSk } };
  } },
  { id: 'D2-11', title: 'R3 STS token????', fn: async () => {
    const os = await import('node:os');
    const fs = await import('node:fs');
    const tmp = join(os.tmpdir(), 'hdk-iso-home-d211-' + Date.now());
    fs.mkdirSync(join(tmp, '.config', 'huaweicloud'), { recursive: true });
    const r = await mcpTool('huaweicloud_auth_switch', {
      vendorConfirmed: VC_QUOTE, mode: 'memory', action: 'persist',
      ak: 'test_ak_20char123456', sk: 'test_sk_40char_aaaaaaaaaaaaaaaaaaaaaaaa', securityToken: 'STS-TOKEN-SHOULD-NEVER-PERSIST', region: 'cn-north-4',
    }, 60000, { USERPROFILE: tmp, HOME: tmp });
    const credPath = join(tmp, '.config', 'huaweicloud', 'credentials.json');
    const onDisk = fs.existsSync(credPath) ? fs.readFileSync(credPath, 'utf8') : '';
    const tokenOnDisk = onDisk.includes('STS-TOKEN-SHOULD-NEVER-PERSIST');
    const parsed = r.parsed || {};
    const rejected = /reject|error|token/i.test(String(parsed.status || parsed.scope || r.text || ''));
    return {
      status: (!tokenOnDisk && rejected) ? 'PASS' : 'FAIL',
      why: tokenOnDisk ? 'STS token ???????????' : (rejected ? 'STS token ????????/??' : 'STS token ???????????'),
      result: { parsed, textHead: (r.text || '').slice(0, 500), tokenOnDisk, onDiskHasCreds: !!onDisk },
    };
  } },
  { id: 'D4-1', title: '????????', fn: async () => {
    const r = await mcpTool('huaweicloud_hook_check_command', { command: 'type C://Users//Administrator//.hcloud//config.json' }, 45000);
    const d = r.parsed && r.parsed.decision;
    return { status: d === 'deny' ? 'PASS' : 'FAIL', why: 'decision=' + d + ' findings=' + ((r.parsed && r.parsed.findings || []).map((f) => f.ruleId).join(',')), result: r.parsed };
  } },
  { id: 'D4-2', title: '??env????', fn: async () => {
    const r = await mcpTool('huaweicloud_hook_check_command', { command: 'set HW_SECRET_KEY' }, 45000);
    const d = r.parsed && r.parsed.decision;
    return { status: d === 'deny' ? 'PASS' : 'FAIL', why: 'decision=' + d + ' findings=' + ((r.parsed && r.parsed.findings || []).map((f) => f.ruleId).join(',')), result: r.parsed };
  } },
  { id: 'D4-3', title: '??secret API??', fn: async () => {
    const a = await mcpTool('huaweicloud_hook_check_command', { command: 'hcloud KMS DecryptData --cipher_text=abc' }, 45000);
    const b = await mcpTool('huaweicloud_hook_check_command', { command: 'hcloud CSMS ShowSecretVersion --secret_name=x' }, 45000);
    const ok = (a.parsed && a.parsed.decision) === 'deny' && (b.parsed && b.parsed.decision) === 'deny';
    return { status: ok ? 'PASS' : 'FAIL', why: 'KMS=' + (a.parsed && a.parsed.decision) + ' CSMS=' + (b.parsed && b.parsed.decision), result: { kms: a.parsed, csms: b.parsed } };
  } },
  { id: 'D4-5', title: '???????', fn: async () => {
    const w = await mcpTool('huaweicloud_plan_cli_command', { vendorConfirmed: VC_QUOTE, args: ['ECS', 'DeleteServers', '--server_id=abc'], allowWrites: false }, 60000);
    const rd = await mcpTool('huaweicloud_plan_cli_command', { vendorConfirmed: VC_QUOTE, args: ['ECS', 'ListServersDetails'], allowWrites: false }, 60000);
    const wr = (w.parsed && w.parsed.classification) || {};
    const rr = (rd.parsed && rd.parsed.classification) || {};
    const ok = wr.risk === 'write' && wr.decision !== 'allow' && rr.risk === 'read_only' && rr.decision === 'allow';
    return { status: ok ? 'PASS' : 'FAIL', why: ok ? 'DeleteServers?write(deny)?ListServersDetails?read_only(allow)' : '????: write=' + JSON.stringify(wr) + ' read=' + JSON.stringify(rr), result: { write: wr, read: rr } };
  } },
  { id: 'D4-9', title: '????/?????', fn: async () => {
    const pub = await mcpTool('huaweicloud_hook_check_command', { command: 'hcloud VPC CreateSecurityGroupRule --security_group_rule.remote_ip_prefix=0.0.0.0/0 --security_group_rule.direction=ingress' }, 45000);
    const plan = await mcpTool('huaweicloud_hook_check_deploy_plan', { plan: { service: 'FunctionGraph', exposure: 'public', auth: 'none', cleanup: false, resources: [{ type: 'FunctionGraph', name: 'fn1' }] } }, 45000);
    const del = await mcpTool('huaweicloud_hook_check_command', { command: 'hcloud RDS DeleteInstance --instance_id=x' }, 45000);
    const dv = (x) => (x.parsed && x.parsed.decision) || '';
    const ok = ['deny', 'warn'].includes(dv(pub)) && ['deny', 'warn'].includes(dv(plan)) && ['deny', 'warn'].includes(dv(del));
    return { status: ok ? 'PASS' : 'FAIL', why: 'publicSG=' + dv(pub) + ' deployPlan=' + dv(plan) + ' destructive=' + dv(del), result: { pub: pub.parsed, plan: plan.parsed, del: del.parsed } };
  } },
  { id: 'D4-15', title: 'hook????', fn: async () => {
    const variants = ['hcloud ECS DELETESERVERS --server_id=x', 'hcloud ECS DeleteServers%20--server_id=x', 'hcloud ECS "Delete""Servers" --server_id=x', 'hcloud ECS DeleteServers --server_id=x; hcloud KMS DecryptData --cipher_text=abc'];
    const out = [];
    for (const v of variants) { const r = await mcpTool('huaweicloud_hook_check_command', { command: v }, 45000); out.push({ v, decision: (r.parsed && r.parsed.decision) || 'none', rules: (r.parsed && r.parsed.findings || []).map((f) => f.ruleId) }); }
    const bypass = out.some((x) => x.decision === 'allow' || x.decision === 'none');
    return { status: bypass ? 'FAIL' : 'PASS', why: bypass ? '????????: ' + JSON.stringify(out.filter((x) => x.decision === 'allow' || x.decision === 'none')) : '????????????', result: out };
  } },
  { id: 'D4-16', title: '??????', fn: async () => {
    const variants = ['cmd /c hcloud ECS DeleteServers --server_id=x', 'sh -c "hcloud ECS DeleteServers --server_id=x"', 'powershell -Command "hcloud KMS DecryptData --cipher_text=abc"', 'echo $(hcloud CSMS ShowSecretVersion --secret_name=x)'];
    const out = [];
    for (const v of variants) { const r = await mcpTool('huaweicloud_hook_check_command', { command: v }, 45000); out.push({ v, decision: (r.parsed && r.parsed.decision) || 'none', rules: (r.parsed && r.parsed.findings || []).map((f) => f.ruleId) }); }
    const bypass = out.some((x) => x.decision === 'allow' || x.decision === 'none');
    return { status: bypass ? 'FAIL' : 'PASS', why: bypass ? '??????????' : '???????????', result: out };
  } },
  { id: 'D4-18', title: 'confirm-not-deny????', fn: async () => {
    const r = await mcpTool('huaweicloud_plan_cli_command', { vendorConfirmed: VC_QUOTE, args: ['VPC', 'DeleteVpc', '--vpc_id=abc'], allowWrites: false }, 60000);
    const p = r.parsed || {};
    const ok = p.classification && p.classification.decision === 'deny' + '' && p.userConfirmation && p.userConfirmation.needed === true && !!p.approvalToken && p.safeToRun === false;
    return { status: ok ? 'PASS' : 'FAIL', why: ok ? '????? deny+approvalToken+userConfirmation.needed=true????????????/?????' : '??????: ' + JSON.stringify(p).slice(0, 400), result: p };
  } },
  { id: 'D4-19', title: '?????????', fn: async () => {
    const plan = await mcpTool('huaweicloud_plan_cli_command', { vendorConfirmed: VC_QUOTE, args: ['VPC', 'DeleteVpc', '--vpc_id=abc'], allowWrites: false }, 60000);
    const hook = await mcpTool('huaweicloud_hook_check_command', { command: 'hcloud VPC DeleteVpc --vpc_id=abc' }, 45000);
    const art = await mcpTool('huaweicloud_hook_check_artifacts', { artifacts: [{ path: 'policy.json', content: JSON.stringify({ Version: '1.1', Statement: [{ Effect: 'Allow', Action: '*', Resource: '*' }] }) }] }, 45000);
    const ok = (plan.parsed && plan.parsed.userConfirmation && plan.parsed.userConfirmation.needed === true)
      && (hook.parsed && ['deny', 'warn'].includes(hook.parsed.decision))
      && (art.parsed && art.parsed.decision === 'deny');
    return { status: ok ? 'PASS' : 'FAIL', why: ok ? '?????????/??????' : '?????', result: { plan: plan.parsed, hook: hook.parsed, art: art.parsed } };
  } },
  { id: 'D4-21', title: 'hook_check_artifacts ???????/IaC/???????', fn: async () => {
    const r = await mcpTool('huaweicloud_hook_check_artifacts', { artifacts: [{ path: 'iam-policy.json', content: JSON.stringify({ Version: '1.1', Statement: [{ Effect: 'Allow', Action: '*', Resource: '*' }] }) }] }, 45000);
    const ok = (r.parsed && r.parsed.decision) === 'deny' && (r.parsed.findings || []).some((f) => f.ruleId === 'hwc-iam-admin-policy');
    return { status: ok ? 'PASS' : 'FAIL', why: 'decision=' + (r.parsed && r.parsed.decision) + ' rules=' + ((r.parsed && r.parsed.findings || []).map((f) => f.ruleId).join(',')), result: r.parsed };
  } },
  { id: 'D4-22', title: 'hook_check_deploy_plan ????????????', fn: async () => {
    const r = await mcpTool('huaweicloud_hook_check_deploy_plan', { plan: { service: 'FunctionGraph', exposure: 'public', cleanup: false, resources: [{ type: 'FunctionGraph', name: 'fn1' }] } }, 45000);
    const ok = ['deny', 'warn'].includes((r.parsed && r.parsed.decision) || '') && (r.parsed.findings || []).some((f) => f.category === 'public_exposure');
    return { status: ok ? 'PASS' : 'FAIL', why: 'decision=' + (r.parsed && r.parsed.decision) + ' rules=' + ((r.parsed && r.parsed.findings || []).map((f) => f.ruleId).join(',')), result: r.parsed };
  } },
  { id: 'D4-23', title: '???? huawei-agent-rules.md ??????11 ?????', fn: async () => {
    const fs = await import('node:fs');
    const found = [];
    const targets = fs.readdirSync(HOME, { withFileTypes: true }).filter((d) => d.isDirectory() && !d.name.startsWith('.')).map((d) => d.name);
    const dirs = ['opencode', 'codearts', 'codearts-work', 'workbuddy', 'dsh', 'officeace', 'hermes', 'openclaw', 'atomcode', 'atomcode', 'codearts'];
    const roots = [];
    for (const n of fs.readdirSync(HOME)) { const p = join(HOME, n, 'huaweicloud-plugins', 'rules'); if (fs.existsSync(p)) roots.push(p); }
    for (const p of fs.readdirSync(join(HOME, '.workbuddy', 'huaweicloud-plugins'), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => join(HOME, '.workbuddy', 'huaweicloud-plugins', d.name))) {
      if (fs.existsSync(join(p, 'rules'))) roots.push(join(p, 'rules'));
    }
    const uniq = [...new Set(roots.filter((p) => fs.existsSync(p)))];
    for (const root of uniq) {
      const files = fs.readdirSync(root).filter((f) => /agent-rules/.test(f));
      for (const f of files) { const st = fs.statSync(join(root, f)); found.push({ root, file: f, size: st.size, nonEmpty: st.size > 0 }); }
    }
    const ok = found.length > 0 && found.every((x) => x.nonEmpty);
    return { status: ok ? 'PASS' : 'FAIL', why: ok ? '????? rules ?????' + found.length + ' ????; ????=' + dirs.join('/') + '???????????????????? install ??' : '???????/? agent-rules ??', result: { found, scannedRoots: uniq } };
  } },
  { id: 'D4-28', title: 'Node ??? hook ??', fn: async () => {
    const bad = runNode(PATHS.hookScript, [], 30000, null, JSON.stringify({ tool_name: 'Bash', tool_input: { command: 'type C://Users//Administrator//.hcloud//config.json' } }));
    const good = runNode(PATHS.hookScript, [], 30000, null, JSON.stringify({ tool_name: 'Bash', tool_input: { command: 'hcloud ECS ListServersDetails' } }));
    const arrInput = runNode(PATHS.hookScript, [], 30000, null, JSON.stringify({ tool_name: 'Bash', tool_input: { args: ['hcloud', 'ECS', 'DeleteServers'] } }));
    const badOut = safeJson(bad.stdout);
    const arrOut = safeJson(arrInput.stdout);
    const deny = badOut && badOut.hookSpecificOutput && badOut.hookSpecificOutput.permissionDecision === 'deny';
    const noDenyForGood = !/permissionDecision/.test(good.stdout);
    const argsExtracted = arrOut && arrOut.hookSpecificOutput && arrOut.hookSpecificOutput.permissionDecision === 'deny';
    const hooks = readFileSync(PATHS.hooksJson, 'utf8');
    const registered = /huaweicloud-safety\.mjs/.test(hooks);
    const ok = deny && noDenyForGood && argsExtracted && registered;
    return { status: ok ? 'PASS' : 'FAIL', why: 'deny=' + deny + ' goodNoDeny=' + noDenyForGood + ' argsExtracted=' + argsExtracted + ' hooksRegistered=' + registered, result: { badStdout: bad.stdout.slice(0, 600), goodStdout: good.stdout.slice(0, 200), argsStdout: arrInput.stdout.slice(0, 400), hooks: hooks.slice(0, 500) } };
  } },
  { id: 'D8-7', title: '7 ? meta/?????????????', fn: async () => {
    const ls = await mcpTool('huaweicloud_list_skills', {}, 45000);
    const names = ((ls.parsed && ls.parsed.skills) || []).map((s) => s.name);
    const meta = names.filter((n) => /getting-started|troubleshoot|iac|ecs|cli|auth|billing|safety|capability|api|core/i.test(n)).slice(0, 7);
    const loaded = [];
    for (const n of meta) { const r = await mcpTool('huaweicloud_retrieve_skill', { name: n }, 45000); loaded.push({ name: n, ok: !!(r.parsed && r.parsed.ok), len: (r.text || '').length, head: (r.text || '').slice(0, 160) }); }
    const ok = loaded.length >= 7 && loaded.every((x) => x.ok && x.len > 500);
    return { status: ok ? 'PASS' : 'FAIL', why: '?? ' + loaded.length + '/' + loaded.length + ' ?????? ok=' + loaded.every((x) => x.ok) + '???=' + meta.join(','), result: { total: names.length, loaded } };
  } },
  { id: 'D9-12', title: 'initialize ????????', fn: async () => {
    const good = await mcpSession([
      { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'probe', version: '1.0' } } },
    ], 20000);
    const initRes = (good.responses.find((r) => r.id === 1) || {}).result || {};
    const bad = await mcpSession([
      { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} },
    ], 20000);
    const badResp = bad.responses.find((r) => r.id === 2) || {};
    const badCode = badResp.error && badResp.error.code;
    const ok = initRes.protocolVersion === '2024-11-05' && !!initRes.capabilities && !!initRes.serverInfo && (badCode === -32600 || badResp.error);
    return { status: ok ? 'PASS' : 'FAIL', why: 'initialize protocolVersion=' + initRes.protocolVersion + ' serverInfo=' + JSON.stringify(initRes.serverInfo) + '????? error.code=' + badCode, result: { initRes, badResp, badRaw: bad.raw.slice(0, 600) } };
  } },
  { id: 'D9-13', title: 'tools/call ??????????', fn: async () => {
    const os = await import('node:os');
    const fs = await import('node:fs');
    const tmp = join(os.tmpdir(), 'hdk-iso-d913-' + Date.now());
    fs.mkdirSync(tmp, { recursive: true });
    const cred = await import('file:///' + DIST + '/auth/credentials.js');
    cred.setRuntimeCredentials({ ak: 'AKID_D913_1234567890', sk: 'SK_D913_SECRET_abcdefghij', region: 'cn-north-4' });
    const has = cred.hasRuntimeCredentials();
    const resolved = cred.resolveCredentialsWithRuntime ? !!cred.resolveCredentialsWithRuntime() : null;
    cred.clearRuntimeCredentials();
    const afterClear = cred.hasRuntimeCredentials();
    const prof = await mcpTool('huaweicloud_show_profile_redacted', { vendorConfirmed: VC_QUOTE }, 60000);
    const text = JSON.stringify(prof.parsed || prof.text || '');
    const noLeak = !/AKID_D913|SK_D913_SECRET|secretAccessKey"\s*:\s*"(?!<redacted>)/.test(text);
    const plan = await mcpTool('huaweicloud_plan_cli_command', { vendorConfirmed: VC_QUOTE, args: ['ECS', 'DeleteServers', '--server_id=x'], allowWrites: false }, 60000);
    const token = plan.parsed && plan.parsed.approvalToken;
    const c1 = await mcpTool('huaweicloud_auth_confirm', { token, decision: 'approve' }, 45000);
    const c2 = await mcpTool('huaweicloud_auth_confirm', { token, decision: 'approve' }, 45000);
    const replayBlocked = !!(c1.ok !== undefined) && !(c2.parsed && c2.parsed.ok === true && c2.parsed.status === 'approved');
    const ok = has === true && afterClear === false && noLeak && !!token && replayBlocked;
    return { status: ok ? 'PASS' : 'FAIL', why: 'runtimeSet=' + has + ' cleared=' + (afterClear === false) + ' noLeak=' + noLeak + ' tokenIssued=' + !!token + ' replayBlocked=' + replayBlocked, result: { has, afterClear, resolved, noLeak, token: token ? token.slice(0, 8) + '...' : null, confirm1: c1.parsed || c1.text, confirm2: c2.parsed || c2.text } };
  } },
  { id: 'D10-4', title: '????-?????', fn: async () => {
    const rr = await import('file:///' + DIST + '/risk-rule-engine.js');
    const raw = rr.loadRiskRules();
    const rules = Array.isArray(raw) ? raw : (raw && raw.rules) || [];
    const deny = rules.filter((r) => r.severity === 'deny').length;
    const warn = rules.filter((r) => r.severity === 'warn').length;
    const del = rr.evaluateCommandRisk('hcloud ECS DeleteServers --server_id=x');
    const read = rr.evaluateCommandRisk('hcloud ECS ListServersDetails');
    const cat = rr.evaluateCommandRisk('type C://Users//Administrator//.hcloud//config.json');
    const ok = deny > 0 && warn > 0 && del.decision === 'warn' && read.decision === 'allow' && cat.decision === 'deny';
    const spec = ok && rules.length === 16 && deny === 9 && warn === 7;
    return {
      status: spec ? 'PASS' : (ok ? 'SPEC-MISMATCH' : 'FAIL'),
      why: '???=' + rules.length + ' ??deny=' + deny + ' warn=' + warn + '????? 16=9+7??delete=' + del.decision + ' read=' + read.decision + ' catCredential=' + cat.decision,
      result: { ruleCount: rules.length, deny, warn, del: del.decision, read: read.decision, credentialRead: cat.decision, version: raw && raw.version },
    };
  } },
];

for (const c of cases) {
  const t0 = Date.now();
  let r;
  try {
    r = await c.fn();
  } catch (e) {
    r = { status: 'FAIL', why: 'probe exception: ' + (e && e.message), result: { stack: String((e && e.stack) || '').slice(0, 800) } };
  }
  writeEvidence(c.id, r);
  try { writeProbe(c.id, c.title, c.fn); } catch (e) { /* probe already written on best effort */ }
  console.log(c.id.padEnd(8), r.status.padEnd(13), String(Date.now() - t0).padStart(6), 'ms |', String(r.why || '').slice(0, 140));
}
