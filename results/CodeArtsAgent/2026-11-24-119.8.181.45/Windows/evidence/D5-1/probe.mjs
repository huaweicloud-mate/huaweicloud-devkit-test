// Real probe for D5-1: 清单发现加载
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE, existsSync, readFileSync, readdirSync } from '../../_runner/lib.mjs'; // LIBIMPORT-FIXED
const run = async () => {
  const root = HOME + '/.workbuddy/huaweicloud-plugins';
  const pkg = existsSync(root + '/package.json') ? JSON.parse(readFileSync(root + '/package.json', 'utf8')) : null;
  const hooks = existsSync(root + '/hooks/hooks.json');
  const skills = existsSync(root + '/skills') ? readdirSync(root + '/skills').length : 0;
  const rules = existsSync(root + '/rules/huawei-agent-rules.mdc');
  const ok = !!pkg && hooks && skills > 0 && rules;
  return { status: ok ? 'PASS' : 'FAIL', why: 'manifest=' + (!!pkg) + ' version=' + (pkg && pkg.version) + ' hooks=' + hooks + ' skills=' + skills + ' rules=' + rules, result: { root, pkg, hooks, skills, rules } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
