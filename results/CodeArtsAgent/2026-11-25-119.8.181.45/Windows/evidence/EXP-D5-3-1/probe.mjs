// EXP-D5-3-1 CodeArtsAgent 插件清单发现加载（真实执行）
import { existsSync, readFileSync, readdirSync, ts } from '../../_runner/lib.mjs';
const root = 'C:/Users/Administrator/.workbuddy/huaweicloud-plugins';
const pkg = existsSync(root + '/package.json') ? JSON.parse(readFileSync(root + '/package.json', 'utf8')) : null;
const hooks = existsSync(root + '/hooks/hooks.json');
const skills = existsSync(root + '/skills') ? readdirSync(root + '/skills').length : 0;
const rules = existsSync(root + '/rules/huawei-agent-rules.mdc');
const ok = !!pkg && hooks && skills > 0 && rules;
console.log(JSON.stringify({ caseId: 'EXP-D5-3-1', status: ok ? 'PASS' : 'FAIL', why: 'CodeArtsAgent 插件清单：manifest=' + (!!pkg) + ' version=' + (pkg && pkg.version) + ' hooks=' + hooks + ' skills=' + skills + ' rules=' + rules, executedAt: ts(), result: { root, version: pkg && pkg.version, hooks, skills, rules } }, null, 2));
