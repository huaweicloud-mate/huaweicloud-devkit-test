// DSH/Linux daily probe — D9-12 initialize 握手 + D9-13 tools/call 凭证不泄露 (v1.1.7)
import { spawn } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { add, flush, CORE, SUT } from './_util.mjs';
const COREP = fileURLToPath(CORE);

const { dispatch, _decorateResult, _resetHintConsumption, _isHintConsumed } = await import(CORE + '/mcp-protocol.mjs');
const { TOOL_DEFINITIONS, callTool, classifyRawCommand, listSkillDirs, findSkillsRoot } = await import(CORE + '/tools.mjs');
const { setRuntimeCredentials, clearRuntimeCredentials, hasRuntimeCredentials, resolveCredentialsWithRuntime,
        readGlobalCredentials, writeGlobalCredentials, isPlaceholder, globalCredentialsPath, obsConfigPath, writeObsConfig } = await import(CORE + '/auth/credentials.mjs');
const { loadPolicy, classifyHcloudArgs, redactSecrets } = await import(CORE + '/safety-policy.mjs');
const { loadRiskRules, evaluateCommandRisk, evaluateArtifacts, evaluateDeployPlan, mergeRiskDecision } = await import(CORE + '/risk-rule-engine.mjs');
const { hashArgs, createApprovalToken, consumeApprovalToken, readServiceCatalogs, classifyUnsupported, planHcloudCommand, redactOutput } = await import(CORE + '/hcloud-cli.mjs');

const esc = (s) => (typeof s === 'string' ? s : JSON.stringify(s));
const MSP = join(SUT, 'plugins', 'huaweicloud-core', 'src', 'mcp-server.mjs');

// ==================== D9-12 initialize 握手协议安全基线 ====================
{
  // ① initialize 返回 protocolVersion + capabilities + serverInfo
  const init = await dispatch('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'dsh-probe', version: '1' } });
  add('D9-12', 'initialize 返回 protocolVersion', init && init.protocolVersion === '2024-11-05', JSON.stringify(init));
  add('D9-12', 'initialize 返回 capabilities(对象)', !!(init && init.capabilities && typeof init.capabilities === 'object'), JSON.stringify(init && init.capabilities));
  add('D9-12', 'initialize 返回 serverInfo.name', !!(init && init.serverInfo && init.serverInfo.name === 'huaweicloud-devkit'), JSON.stringify(init && init.serverInfo));
  add('D9-12', 'initialize 返回 serverInfo.version(语义化)', !!(init && init.serverInfo && /^\d+\.\d+\.\d+/.test(init.serverInfo.version)), JSON.stringify(init && init.serverInfo));

  // ② callTool 路由到 tools.mjs callTool
  let routed = false, routedErr = null;
  try {
    const rr = await dispatch('tools/call', { name: 'huaweicloud_list_operations', arguments: { service: 'VPC' } });
    routed = !!(rr && Array.isArray(rr.content));
  } catch (e) { routedErr = String(e.message); }
  add('D9-12', 'callTool 路由到 tools.mjs(tools/call 正常返回 content)', routed, 'err=' + routedErr);

  // ③ runVersionCheck 在 initialize 阶段触发版本检查（设计步骤③）
  {
    const proto = readFileSync(join(COREP, 'mcp-protocol.mjs'), 'utf8');
    const tools = readFileSync(join(COREP, 'tools.mjs'), 'utf8');
    const wired = /runVersionCheck|update-check|check_update|versionCheck/i.test(proto.slice(proto.indexOf('method === \'initialize\''), proto.indexOf('if (method === \'tools/list\')')));
    const hasRunVersionCheck = /runVersionCheck/i.test(tools);
    add('D9-12', 'initialize 阶段触发版本检查(runVersionCheck)', wired, 'initialize 块内版本检查=' + wired + '；tools.mjs 存在 runVersionCheck=' + hasRunVersionCheck);
  }

  // ④ _decorateResult 包装（无副作用 + hint 消费标记可复位）
  {
    const bare = { ok: true };
    const dec = _decorateResult('sessA', 'huaweicloud_list_operations', bare);
    add('D9-12', '_decorateResult 包装无副作用(不抛异常)', dec !== undefined, JSON.stringify(dec));
    _resetHintConsumption();
    add('D9-12', '_resetHintConsumption 后 _isHintConsumed=false', _isHintConsumed('sessA') === false, String(_isHintConsumed('sessA')));
  }

  // ⑤ listSkillDirs / findSkillsRoot 返回有效技能目录
  {
    const skillsRoot = join(process.env.HOME || '', '.dsh', 'skills');
    const dirs = listSkillDirs(skillsRoot);
    const found = findSkillsRoot([skillsRoot]);
    add('D9-12', 'listSkillDirs 返回有效技能目录(>0)', Array.isArray(dirs) && dirs.length > 0, 'count=' + dirs.length);
    add('D9-12', 'findSkillsRoot 命中根目录', !!found, String(found));
  }

  // ⑥ 非法时序（未 initialize 先 tools/list）被拒 -32600
  {
    const child = spawn(process.execPath, [MSP], { stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' } });
    let buf = Buffer.alloc(0);
    let resp = null;
    const gotResp = new Promise((resolve) => {
      child.stdout.on('data', (d) => {
        buf = Buffer.concat([buf, d]);
        const h = buf.indexOf('\r\n\r\n');
        if (h >= 0) {
          const m = /Content-Length:\s*(\d+)/i.exec(buf.slice(0, h).toString());
          if (m) {
            const n = +m[1];
            if (buf.length >= h + 4 + n) {
              const body = buf.slice(h + 4, h + 4 + n).toString();
              try { resp = JSON.parse(body); } catch {}
              resolve();
            }
          }
        }
      });
    });
    const req = JSON.stringify({ jsonrpc: '2.0', id: 99, method: 'tools/list', params: {} });
    child.stdin.write(`Content-Length: ${Buffer.byteLength(req)}\r\n\r\n${req}`);
    const outcome = await Promise.race([gotResp, new Promise((r) => setTimeout(() => r(null), 8000))]);
    const rejected = !!(resp && resp.error && resp.error.code === -32600);
    add('D9-12', '非法时序 tools/list 未 initialize 被拒(-32600)', rejected, 'resp=' + JSON.stringify(resp).slice(0, 160));
    child.kill();
  }
}

// ==================== D9-13 tools/call 凭证不泄露与权限校验 ====================
{
  const real = readGlobalCredentials() || {};
  const realAk = real.ak || '';
  const realSk = real.sk || '';

  // ① setRuntimeCredentials + hasRuntimeCredentials + resolveCredentialsWithRuntime
  setRuntimeCredentials('AKRT913', 'SKRT913', '', 'cn-north-4');
  const hasRt = hasRuntimeCredentials();
  const rt = resolveCredentialsWithRuntime({ allowMissing: true });
  add('D9-13', 'setRuntimeCredentials 注入后 hasRuntimeCredentials=true', hasRt === true, String(hasRt));
  add('D9-13', 'resolveCredentialsWithRuntime 解析运行时凭证', rt && rt.ak === 'AKRT913' && rt.sk === 'SKRT913', JSON.stringify(rt));

  // ② loadPolicy + classifyHcloudArgs 分类
  const policy = loadPolicy();
  const cWrite = classifyHcloudArgs(['VPC', 'CreateVpc']);
  const cRead = classifyHcloudArgs(['VPC', 'ListVpcs']);
  add('D9-13', 'loadPolicy 返回策略对象', !!(policy && typeof policy === 'object'), JSON.stringify(policy).slice(0, 120));
  add('D9-13', 'classifyHcloudArgs 写命令→deny/warn', !!(cWrite && /deny|warn/.test(cWrite.decision || '')), 'decision=' + cWrite.decision + ' risk=' + cWrite.risk);
  add('D9-13', 'classifyHcloudArgs 只读命令→allow', !!(cRead && cRead.decision === 'allow'), 'decision=' + cRead.decision + ' risk=' + cRead.risk);

  // ③ evaluateArtifacts/evaluateDeployPlan + mergeRiskDecision
  const artRisk = evaluateArtifacts({ artifacts: [{ type: 'image', source: 'docker.io/evil:latest' }] }) || {};
  const planRisk = evaluateDeployPlan({ resources: [{ type: 'ECS', name: 'x' }] }) || {};
  add('D9-13', 'evaluateArtifacts 返回决策对象', typeof artRisk === 'object' && 'decision' in artRisk, JSON.stringify(artRisk).slice(0, 120));
  // 合并取最严：deny 风险(带 findings)覆盖 warn 基线
  const hostile = { decision: 'deny', risk: 'secret', findings: [{ ruleId: 'D13-merge', category: 'secret', message: 'credential leak' }] };
  const merged = mergeRiskDecision({ decision: 'warn', risk: 'write' }, hostile) || {};
  add('D9-13', 'mergeRiskDecision 合并取最严', merged.decision === 'deny', JSON.stringify(merged));

  // ④ hashArgs + 审批令牌生命周期（不可重放）
  const h1 = hashArgs(['VPC', 'CreateVpc']);
  const h2 = hashArgs(['VPC', 'CreateVpc']);
  const h3 = hashArgs(['VPC', 'DeleteVpc']);
  add('D9-13', 'hashArgs 确定性(相同参数同哈希)', h1 === h2, 'h1=' + h1 + ' h2=' + h2);
  add('D9-13', 'hashArgs 不同参数不同哈希', h1 !== h3, 'h1=' + h1 + ' h3=' + h3);
  const token = createApprovalToken(['VPC', 'CreateVpc']);
  const first = consumeApprovalToken(token);
  const second = consumeApprovalToken(token);
  add('D9-13', 'createApprovalToken 返回令牌', typeof token === 'string' && token.length > 0, String(token));
  add('D9-13', 'consumeApprovalToken 首次消费命中', !!first, JSON.stringify(first));
  add('D9-13', '审批令牌不可重放(二次消费 null)', first !== null && second === null, 'first=' + !!first + ' second=' + !!second);

  // ⑤ readServiceCatalogs / classifyUnsupported / planHcloudCommand
  const catalogs = readServiceCatalogs();
  const unsup = classifyUnsupported('NOT_A_REAL_SVC', undefined);
  const plan = planHcloudCommand(['VPC', 'CreateVpc'], { allowWrites: false });
  add('D9-13', 'readServiceCatalogs 返回服务目录', !!(catalogs && typeof catalogs === 'object'), JSON.stringify(catalogs).slice(0, 120));
  add('D9-13', 'classifyUnsupported 返回判定', typeof unsup === 'string' || typeof unsup === 'object', JSON.stringify(unsup).slice(0, 120));
  add('D9-13', 'planHcloudCommand 写命令需审批(safeToRun=false)', !!(plan && plan.safeToRun === false && plan.approvalToken), 'safeToRun=' + plan.safeToRun + ' hasToken=' + !!plan.approvalToken);

  // ⑥ tools/call 返回核对无 AK/SK/token 明文
  const authStatus = await callTool('huaweicloud_auth_status', { target: 'all' }).catch((e) => ({ error: String(e.message) }));
  const authStr = JSON.stringify(authStatus);
  const leakAk = realAk && realAk.length >= 10 && authStr.includes(realAk);
  const leakSk = realSk && realSk.length >= 10 && authStr.includes(realSk);
  add('D9-13', 'tools/call(auth_status) 返回不含 AK 明文', !leakAk, 'akLeak=' + leakAk);
  add('D9-13', 'tools/call(auth_status) 返回不含 SK 明文', !leakSk, 'skLeak=' + leakSk);

  // ⑦ clearRuntimeCredentials 清理
  clearRuntimeCredentials();
  add('D9-13', 'clearRuntimeCredentials 后不留运行时凭证(hasRuntimeCredentials=false)', hasRuntimeCredentials() === false, String(hasRuntimeCredentials()));
  const afterClear = resolveCredentialsWithRuntime({ allowMissing: true });
  add('D9-13', '清理后 resolveCredentialsWithRuntime 回落持久凭证(非运行时 AKRT913)', afterClear && afterClear.ak !== 'AKRT913', JSON.stringify(afterClear && afterClear.ak));

  // ⑧ readGlobalCredentials/writeGlobalCredentials 持久化一致 + isPlaceholder
  const origBefore = readGlobalCredentials();
  writeGlobalCredentials({ ak: 'AKTEST913', sk: 'SKTEST913', region: 'cn-north-4' });
  const persisted = readGlobalCredentials();
  add('D9-13', 'writeGlobalCredentials 持久化后读回一致', !!(persisted && persisted.ak === 'AKTEST913'), JSON.stringify(persisted && persisted.ak));
  add('D9-13', 'isPlaceholder 识别占位(模板/掩码)', isPlaceholder('<HW_ACCESS_KEY>') === true && isPlaceholder('abc****') === true && isPlaceholder('AKTEST913') === false, 'checked');
  // 还原持久凭证
  if (origBefore) writeGlobalCredentials(origBefore);

  // ⑨ globalCredentialsPath / obsConfigPath / writeObsConfig
  const gp = globalCredentialsPath();
  const op = obsConfigPath();
  writeObsConfig({ ak: 'AKOBS913', sk: 'SKOBS913', region: 'cn-north-4' });
  const obsOk = existsSync(op);
  add('D9-13', 'globalCredentialsPath 返回 .config/huaweicloud 路径', typeof gp === 'string' && gp.includes('huaweicloud'), gp);
  add('D9-13', 'writeObsConfig 写出 obs 配置(路径存在)', obsOk, 'op=' + op);
}

flush();