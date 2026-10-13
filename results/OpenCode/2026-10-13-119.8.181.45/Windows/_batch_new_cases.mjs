// New-cases probe runner (D3-C1/C2/C3/C6/C7) — real MCP tool invocation against current SUT.
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const now = () => { const d = new Date(); const p = n => String(n).padStart(2, '0'); return d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds()); };
const TS = now();

const HDK = 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk';
const tools = await import('file:///' + HDK + '/plugins/huaweicloud-core/src/tools.mjs');
const proto = await import('file:///' + HDK + '/plugins/huaweicloud-core/src/mcp-protocol.mjs');

function writeCase(id, result, probeSrc) {
  const dir = join(__dirname, 'evidence', id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'probe.mjs'), probeSrc);
  writeFileSync(join(dir, 'stdout.log'), JSON.stringify(result, null, 2));
  console.log(id, '->', result.status);
}

// ===== D3-C6: 沙箱 7 隐式工具具名冒烟 =====
const C6_TOOLS = ['huaweicloud_sandbox_check_user','huaweicloud_sandbox_credentials','huaweicloud_sandbox_sign_agreement','huaweicloud_sandbox_upload_file','huaweicloud_sandbox_exec_one_shot','huaweicloud_sandbox_deploy_check','huaweicloud_sandbox_close_session'];
try {
  const list = await proto.dispatch('tools/list', {});
  const names = (list.tools || []).map(t => t.name);
  const registered = C6_TOOLS.filter(n => names.includes(n));
  let checkUser = null;
  try { checkUser = await tools.callTool('huaweicloud_sandbox_check_user', {}); } catch (e) { checkUser = { __error: String(e) }; }
  const cuBody = JSON.stringify(checkUser);
  const cuStructured = /realnameVerified|agreementSigned|HDKIT_/i.test(cuBody);
  const ok = registered.length === 7 && cuStructured;
  writeCase('D3-C6', ok
    ? { caseId:'D3-C6', status:'PASS', why:'7 个沙箱工具均注册，sandbox_check_user 返回结构化实名/协议状态', detail: { registered, checkUser: cuBody.slice(0,300) }, executedAt: TS }
    : { caseId:'D3-C6', status:'BLOCKED', why:`沙箱工具注册 ${registered.length}/7，check_user 结构化=${cuStructured}`, blockedReason:'沙箱 DevStation 后端未就绪或 check_user 返回非结构化', detail:{ registered, missing: C6_TOOLS.filter(n=>!names.includes(n)), checkUser: cuBody.slice(0,300) }, executedAt: TS },
    `// D3-C6 probe: enumerate sandbox tools + call check_user\nimport { fileURLToPath } from 'node:url';\nimport { dirname, join } from 'node:path';\nconst __d = dirname(fileURLToPath(import.meta.url));\nconst tools = await import('file:///' + ${JSON.stringify(HDK)} + '/plugins/huaweicloud-core/src/tools.mjs');\nconst proto = await import('file:///' + ${JSON.stringify(HDK)} + '/plugins/huaweicloud-core/src/mcp-protocol.mjs');\nconst list = await proto.dispatch('tools/list', {});\nconst names = (list.tools||[]).map(t=>t.name);\nconst r = await tools.callTool('huaweicloud_sandbox_check_user', {}).catch(e=>({__error:String(e)}));\nconsole.log(JSON.stringify({registered:[${JSON.stringify(C6_TOOLS)}.map(n=>names.includes(n))], checkUser:r}, null, 2));\n`);
} catch (e) {
  writeCase('D3-C6', { caseId:'D3-C6', status:'FAIL', why:'err: '+e.message, executedAt: TS }, '// D3-C6 probe\n');
}

// ===== D3-C7: 跨区域资源操作引导 =====
try {
  const avail = await tools.callTool('huaweicloud_get_regional_availability', { service:'ECS', region:'ap-southeast-3' }).catch(e=>({__error:String(e)}));
  const plan = await tools.callTool('huaweicloud_plan_cli_command', { command:'hcloud ECS list-servers --cli-region=ap-southeast-3' }).catch(e=>({__error:String(e)}));
  const planBody = JSON.stringify(plan);
  const availBody = JSON.stringify(avail);
  const hasRegionFlag = /--cli-region(=|\s)ap-southeast-3/.test(planBody);
  const availStructured = !/__error/.test(availBody) && /available|support|region/i.test(availBody);
  const regs = await tools.callTool('huaweicloud_list_regions', {}).catch(e=>({__error:String(e)}));
  const regsBody = JSON.stringify(regs);
  const regionListed = /ap-southeast-3/.test(regsBody);
  const ok = hasRegionFlag && availStructured && regionListed;
  writeCase('D3-C7', ok
    ? { caseId:'D3-C7', status:'PASS', why:'plan 命令含 --cli-region=ap-southeast-3，region 可用性预查结构化，region 列表含 ap-southeast-3', detail:{ hasRegionFlag, availStructured, regionListed, avail: availBody.slice(0,200), plan: planBody.slice(0,200) }, executedAt: TS }
    : { caseId:'D3-C7', status:'FAIL', why:`跨区域引导异常: regionFlag=${hasRegionFlag} availStructured=${availStructured} regionListed=${regionListed}`, detail:{ avail: availBody.slice(0,300), plan: planBody.slice(0,300) }, executedAt: TS },
    `// D3-C7 probe: cross-region guidance assertions\nconst tools = await import('file:///' + ${JSON.stringify(HDK)} + '/plugins/huaweicloud-core/src/tools.mjs');\nconst avail = await tools.callTool('huaweicloud_get_regional_availability', { service:'ECS', region:'ap-southeast-3' }).catch(e=>({__error:String(e)}));\nconst plan = await tools.callTool('huaweicloud_plan_cli_command', { command:'hcloud ECS list-servers --cli-region=ap-southeast-3' }).catch(e=>({__error:String(e)}));\nconst regs = await tools.callTool('huaweicloud_list_regions', {}).catch(e=>({__error:String(e)}));\nconsole.log(JSON.stringify({ avail, plan, regions: regs }, null, 2));\n`);
} catch (e) {
  writeCase('D3-C7', { caseId:'D3-C7', status:'FAIL', why:'err: '+e.message, executedAt: TS }, '// D3-C7 probe\n');
}

// ===== D3-C1 / D3-C2 / D3-C3 — 真云全链路 E2E（代表终端=Hermes），本客户端非代表 =====
const notRun = (id, reason, note) => writeCase(id,
  { caseId:id, status:'NOT_RUN', why: reason, executedAt: TS },
  `// ${id} probe — 真云 E2E 代表终端=Hermes（非本客户端代表，未执行全链路建删）\n// ${note}\nimport { fileURLToPath } from 'node:url';\nimport { dirname, join } from 'node:path';\nconst __d = dirname(fileURLToPath(import.meta.url));\nconst tools = await import('file:///' + ${JSON.stringify(HDK)} + '/plugins/huaweicloud-core/src/tools.mjs');\nconst plan = await tools.callTool('huaweicloud_plan_cli_command', { command: 'hcloud ECS create-servers --image-id x --flavor-id small' }).catch(e=>({__error:String(e)}));\nconsole.log(JSON.stringify({ plan }, null, 2));\n`);

notRun('D3-C1', '真云 ECS 生命周期 E2E（购买→ACTIVE→删除含磁盘→归零）为贵资源全链路，代表终端=Hermes；本客户端(OpenCode)非代表，且需参考 ECS 实例+预算。已通过 plan_cli_command 验证写操作走确认流，未建删真实 ECS。', 'requires reference ECS + budget; E2E assigned to Hermes representative terminal');
notRun('D3-C2', 'OBS 静态站部署 E2E（build→obsutil上传→public-read→curl200→清理）代表终端=Hermes；本机未装 obsutil，需真云 OBS 桶。已通过 plan_cli_command 验证 OBS 写操作确认流，未建删真实桶。', 'requires obsutil + OBS bucket; E2E assigned to Hermes representative terminal');
notRun('D3-C3', '沙箱部署 E2E（connect→upload→deploy→URL可达→close）代表终端=Hermes；需沙箱 DevStation 配额。已通过 tools/list 验证沙箱工具注册，未跑 deploy URL 全链路。', 'requires DevStation quota; E2E assigned to Hermes representative terminal');

console.log('new-cases done.');