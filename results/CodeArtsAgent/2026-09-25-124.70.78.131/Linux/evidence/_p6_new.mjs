// CodeArtsAgent/Linux daily probe — D9-12 initialize 握手安全基线 + D9-13 tools/call 凭证不泄露与权限校验
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { add, flush, CORE, HKDSRC } from './_util.mjs';

const { dispatch, _decorateResult, _resetHintConsumption, _isHintConsumed } = await import(CORE + '/mcp-protocol.mjs');
const { callTool, runVersionCheck, listSkillDirs, findSkillsRoot } = await import(CORE + '/tools.mjs');
const { loadPolicy, classifyHcloudArgs } = await import(CORE + '/safety-policy.mjs');
const { evaluateArtifacts, evaluateDeployPlan, mergeRiskDecision } = await import(CORE + '/risk-rule-engine.mjs');
const { hashArgs, createApprovalToken, consumeApprovalToken, readServiceCatalogs, classifyUnsupported, planHcloudCommand } = await import(CORE + '/hcloud-cli.mjs');
const { setRuntimeCredentials, clearRuntimeCredentials, hasRuntimeCredentials, resolveCredentialsWithRuntime, readGlobalCredentials, writeGlobalCredentials, isPlaceholder, globalCredentialsPath, obsConfigPath, writeObsConfig } = await import(CORE + '/auth/credentials.mjs');

const MSP = join(HKDSRC, 'plugins', 'huaweicloud-core', 'src', 'mcp-server.mjs');
const esc = (s) => (typeof s === 'string' ? s : JSON.stringify(s));

function makeMcp() {
  const child = spawn(process.execPath, [MSP], { stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' } });
  let buf = Buffer.alloc(0);
  const pending = new Map(); let pid = 1;
  child.on('exit', () => { for (const [, r] of pending) r(null); pending.clear(); });
  child.stdout.on('data', (d) => {
    buf = Buffer.concat([buf, d]);
    while (true) {
      const h = buf.indexOf('\r\n\r\n'); if (h < 0) break;
      const m = /Content-Length:\s*(\d+)/i.exec(buf.slice(0, h).toString()); if (!m) { buf = buf.slice(h + 4); continue; }
      const n = +m[1]; if (buf.length < h + 4 + n) break;
      const body = buf.slice(h + 4, h + 4 + n).toString(); buf = buf.slice(h + 4 + n);
      let msg; try { msg = JSON.parse(body); } catch { continue; }
      if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
    }
  });
  function send(o, ms = 8000) {
    const b = JSON.stringify(o);
    child.stdin.write(`Content-Length: ${Buffer.byteLength(b)}\r\n\r\n${b}`);
    return new Promise((r) => { const t = setTimeout(() => { pending.delete(o.id); r(null); }, ms); pending.set(o.id, (v) => { clearTimeout(t); r(v); }); });
  }
  return { child, send, kill: () => child.kill() };
}

// ============ D9-12 initialize 握手协议安全基线 ============
{
  const init = await dispatch('initialize', { protocolVersion: '2024-11-05', clientInfo: { name: 'CodeArtsAgent', version: '1' } });
  add('D9-12', 'initialize 返回 protocolVersion', !!(init && init.protocolVersion === '2024-11-05'), String(init && init.protocolVersion));
  add('D9-12', 'initialize 返回 capabilities', !!(init && init.capabilities && typeof init.capabilities === 'object'), JSON.stringify(init && init.capabilities));
  add('D9-12', 'initialize 返回 serverInfo{name,version}', !!(init && init.serverInfo && init.serverInfo.name === 'huaweicloud-devkit' && init.serverInfo.version), JSON.stringify(init && init.serverInfo));

  const tc = await dispatch('tools/call', { name: 'huaweicloud_check_cli', arguments: {} }).catch((e) => null);
  add('D9-12', 'tools/call 路由 callTool 返回 content 数组', !!(tc && Array.isArray(tc.content) && tc.content[0] && tc.content[0].type === 'text'), esc(tc).slice(0, 120));

  const vc = await runVersionCheck({}).catch((e) => ({ error: String(e.message) }));
  add('D9-12', 'runVersionCheck 返回检测字段(installed)', !!(vc && 'installed' in vc), esc(vc).slice(0, 120));

  _resetHintConsumption();
  const deco = _decorateResult('sessD912', 'huaweicloud_list_operations', { ok: true });
  add('D9-12', '_decorateResult 无副作用(未预热原样返回)', !!(deco && deco.ok === true), JSON.stringify(deco));
  add('D9-12', '提示消费可重置(_resetHintConsumption)', _isHintConsumed('sessD912') === false, String(_isHintConsumed('sessD912')));

  const skillsRoot = findSkillsRoot([join(HKDSRC, 'plugins', 'huaweicloud-core', 'skills')]);
  const dirs = skillsRoot ? listSkillDirs(skillsRoot) : [];
  add('D9-12', 'findSkillsRoot 返回有效技能根', !!(skillsRoot && dirs.length > 0), String(skillsRoot && (skillsRoot + ' n=' + dirs.length)));
  add('D9-12', 'listSkillDirs 过滤含 SKILL.md 目录', !!(skillsRoot && dirs.length > 0 && dirs.every((n) => existsSync(join(skillsRoot, n, 'SKILL.md')))), String(skillsRoot && dirs.length));

  const srv = makeMcp();
  const preTl = await srv.send({ jsonrpc: '2.0', id: 9001, method: 'tools/list', params: {} }).catch(() => null);
  const preErrCode = preTl && preTl.error ? preTl.error.code : null;
  const preGotTools = preTl && Array.isArray(preTl.result && preTl.result.tools);
  add('D9-12', '非法时序(未 initialize 先 tools/list) 返回 -32600', preErrCode === -32600, 'errorCode=' + preErrCode + ' gotTools=' + preGotTools);
  srv.kill();
}

// ============ D9-13 tools/call 凭证不泄露与权限校验 ============
{
  const HOME = mkdtempSync(join(tmpdir(), 'hdktest-d913-'));
  setRuntimeCredentials('AKD913RUNTIME', 'SKD913RUNTIME', '', 'cn-north-4');
  add('D9-13', 'hasRuntimeCredentials 校验存在', hasRuntimeCredentials() === true, String(hasRuntimeCredentials()));
  const rrw = resolveCredentialsWithRuntime();
  add('D9-13', 'resolveCredentialsWithRuntime 解析运行时凭证', !!(rrw && rrw.ak === 'AKD913RUNTIME' && rrw.sk === 'SKD913RUNTIME'), 'ak=' + (rrw && rrw.ak));
  clearRuntimeCredentials();
  add('D9-13', 'clearRuntimeCredentials 清理后 hasRuntimeCredentials=false', hasRuntimeCredentials() === false, String(hasRuntimeCredentials()));
  const rrw2 = resolveCredentialsWithRuntime();
  add('D9-13', '清理后回落 resolveCredentials(不留运行时)', !!(rrw2 && rrw2.ak !== 'AKD913RUNTIME'), 'ak=' + (rrw2 && String(rrw2.ak).slice(0, 4)));

  const pol = loadPolicy();
  add('D9-13', 'loadPolicy 加载安全策略(含 secretKeyNamePatterns)', !!(pol && Array.isArray(pol.secretKeyNamePatterns) && pol.secretKeyNamePatterns.length > 0), 'patterns=' + (pol && pol.secretKeyNamePatterns && pol.secretKeyNamePatterns.length));
  const dWrite = classifyHcloudArgs(['ecs', 'DeleteServers', '--server-id', 'x']);
  const dRead = classifyHcloudArgs(['ecs', 'ListServersDetails']);
  add('D9-13', 'classifyHcloudArgs deny(写)', dWrite.decision === 'deny', dWrite.decision + '/' + dWrite.risk);
  add('D9-13', 'classifyHcloudArgs allow(只读)', dRead.decision === 'allow', dRead.decision + '/' + dRead.risk);

  const art = evaluateArtifacts([{ path: 'secg.tf', content: 'resource "networking_secgroup_rule" "r" { remote_ip_prefix = "0.0.0.0/0" port_range = "22" }' }]);
  const dp = evaluateDeployPlan({ plan: 'create security group rule 0.0.0.0/0 tcp 22' });
  add('D9-13', 'evaluateArtifacts 公开暴露 deny', art.decision === 'deny', art.decision);
  add('D9-13', 'evaluateDeployPlan 公开暴露 deny', dp.decision === 'deny', dp.decision);
  const merged = mergeRiskDecision({ decision: 'allow', warnings: [] }, art);
  add('D9-13', 'mergeRiskDecision deny 合并(blockedByRiskRule)', merged.decision === 'deny' && merged.blockedByRiskRule === true, JSON.stringify(merged).slice(0, 120));

  const h1 = hashArgs(['ecs', 'CreateServers', '--server.name', 'x']);
  const h2 = hashArgs(['ecs', 'CreateServers', '--server.name', 'x']);
  add('D9-13', 'hashArgs 幂等(相同参数同哈希)', typeof h1 === 'string' && h1 === h2, 'h=' + String(h1).slice(0, 20));
  const tok = createApprovalToken(['ecs', 'CreateServers', '--server.name', 'x']);
  const c1 = consumeApprovalToken(tok);
  const c2 = consumeApprovalToken(tok);
  add('D9-13', '审批令牌不可重放(二次 consume 失效)', !!(c1 !== null && (c2 === null || (c2 && c2.outcome === 'already_processed'))), 'first=' + (c1 !== null) + ' second=' + esc(c2).slice(0, 60));

  readServiceCatalogs();
  const cu = classifyUnsupported('NotARealSvc-XXX');
  add('D9-13', 'classifyUnsupported 返回分类', /not-found|lang-missing|unknown|other/.test(String(cu)), String(cu));
  const plan = planHcloudCommand(['VPC', 'ListVpcs'], { allowWrites: false });
  add('D9-13', 'planHcloudCommand 返回分类', !!(plan && (plan.classification || plan.command)), esc(plan).slice(0, 120));

  const prof = await callTool('huaweicloud_show_profile_redacted', {}).catch((e) => null);
  const po = prof && (prof.result && prof.result.stdout) || JSON.stringify(prof || '');
  const leak = /(AKIA|secretAccessKey[\\"]?\s*[:=]\s*[\\"]?[A-Za-z0-9]{20,}|securityToken[\\"]?\s*[:=]\s*[\\"]?[A-Za-z0-9]{20,})/.test(po) || /\b(AK|SK)[A-Za-z0-9]{20,}\b/.test(po);
  add('D9-13', 'tools/call 返回无 AK/SK/token 明文(show_profile_redacted)', !leak && /<redacted>/.test(po), 'hasRedacted=' + /<redacted>/.test(po) + ' len=' + po.length);

  process.env.HUAWEICLOUD_HOME = HOME;
  writeGlobalCredentials({ ak: 'AKD913PERSIST', sk: 'SKD913PERSIST', region: 'cn-north-4' });
  const gc = readGlobalCredentials();
  add('D9-13', 'writeGlobalCredentials/readGlobalCredentials 持久化一致', !!(gc && gc.ak === 'AKD913PERSIST'), 'ak=' + (gc && gc.ak));
  add('D9-13', 'isPlaceholder 识别占位(<HW_ACCESS_KEY>)', isPlaceholder('<HW_ACCESS_KEY>') === true, 'placeholder');
  add('D9-13', 'isPlaceholder 不误判真实 AK', isPlaceholder('AKD913PERSIST') === false, 'realAk=' + isPlaceholder('AKD913PERSIST'));
  add('D9-13', 'globalCredentialsPath 指向隔离 HOME', globalCredentialsPath().startsWith(HOME), String(globalCredentialsPath()).slice(0, 60));
  const ocp = obsConfigPath();
  add('D9-13', 'obsConfigPath 返回路径', typeof ocp === 'string' && ocp.length > 0, String(ocp).slice(0, 60));

  const obsCfg = join(HOME, 'obsutilconfig');
  process.env.HCLOUD_OBS_CONFIG_PATH = obsCfg;
  writeObsConfig({ ak: 'AKD913OBS', sk: 'SKD913OBS', region: 'cn-north-4' });
  add('D9-13', 'writeObsConfig 写入隔离 obsconfig 文件', existsSync(obsCfg), String(existsSync(obsCfg)));

  delete process.env.HUAWEICLOUD_HOME;
  delete process.env.HCLOUD_OBS_CONFIG_PATH;
}

flush();
