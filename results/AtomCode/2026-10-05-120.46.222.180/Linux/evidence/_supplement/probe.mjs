// supplement-probe.mjs — 直调/源码核对类用例真实执行（今日新鲜证据）
// 覆盖：D4-6 / D4-27 / D8-9 / D6-9 / D1-68 / D1-65 / D1-67 / D1-70 / D4-25 / D4-26
//       D3-S1 / D3-S2 / D3-S3 / D3-S4 / D3-S5 / D3-S6 / D3-S7 / D3-S8
import { pathToFileURL } from 'node:url';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const HDK = '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src';

const { redactSecrets, loadPolicy } = await import(pathToFileURL(join(HDK, 'safety-policy.mjs')).href);
const telemetry = await import(pathToFileURL(join(HDK, 'telemetry', 'telemetry.mjs')).href);
const icon = await import(pathToFileURL(join(HDK, 'icon-library.mjs')).href);
const tools = await import(pathToFileURL(join(HDK, 'tools.mjs')).href);

const R = {}; // case -> {status, why, actual}
function rec(id, status, why, actual) { R[id] = { status, why, actual: String(actual).slice(0, 300) }; }

const now = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' }).replace(/\D/g, '').slice(0, 14);

// ---- D4-6 adminPass 回显脱敏 ----
{
  const out = redactSecrets('hcloud --server.adminPass=Secret123! create');
  const ok = !out.includes('Secret123!');
  rec('D4-6', ok ? 'PASS' : 'FAIL',
    ok ? 'adminPass 值脱敏为 <redacted>' : 'adminPass 明文残留',
    out);
}

// ---- D4-27 双路径输出脱敏（小写 ak=/sk= 短形） ----
{
  const out = redactSecrets('token=abc123 ak=AKID456 sk=secret789');
  const akRedacted = !out.includes('AKID456');
  const skRedacted = !out.includes('secret789');
  rec('D4-27', (akRedacted && skRedacted) ? 'PASS' : 'FAIL',
    (akRedacted && skRedacted) ? 'ak=/sk= 均脱敏' : 'ak=/sk= 小写短形仍明文',
    out);
}

// ---- D8-9 遥测值脱敏 ----
{
  const out = telemetry.sanitizeValue('AK=ABC123XYZ');
  const redacted = typeof out === 'string' && !out.includes('ABC123XYZ');
  rec('D8-9', redacted ? 'PASS' : 'FAIL',
    redacted ? '遥测值凭证已脱敏' : 'sanitizeValue 未脱敏凭证值',
    String(out));
}

// ---- D6-9 缓存清理三入口（clearIconCache 幂等） ----
{
  let ok = true, err = '';
  try { for (let i = 0; i < 3; i++) icon.clearIconCache(); }
  catch (e) { ok = false; err = String(e); }
  rec('D6-9', ok ? 'PASS' : 'FAIL', ok ? 'clearIconCache 连续 3 次幂等不抛错' : err, ok ? 'ok' : err);
}

// ---- D1-68 getServiceIcon ----
{
  const r = await icon.getServiceIcon('ECS', 'compute').catch(e => ({ __err: String(e) }));
  rec('D1-68', r && !r.__err ? 'PASS' : 'FAIL',
    r && !r.__err ? 'getServiceIcon 返回图标信息' : String(r.__err || r), JSON.stringify(r).slice(0, 200));
}

// ---- D3-S* 场景路由 (service_catalog) ----
async function route(intent, expect) {
  const r = await tools.callTool('huaweicloud_service_catalog', { intent });
  const services = Array.isArray(r.recommendedServices) ? r.recommendedServices.join(' ') : '';
  const skills = Array.isArray(r.recommendedSkills) ? r.recommendedSkills.join(' ') : '';
  const fallback = services.includes('Run hcloud --help') && skills.includes('huaweicloud-core to route intent');
  const hit = !fallback && services.includes(expect);
  return { r, txt: services, hit };
}

{
  const { r, txt, hit } = await route('列出cn-north-4的ECS，只读不改', 'ECS');
  rec('D3-S1', hit ? 'PASS' : 'FAIL', hit ? '命中 ECS' : '未命中 ECS（路由退化 help）', txt);
}
{
  const { r, txt, hit } = await route('删除测试VPC，先列命令确认', 'VPC');
  rec('D3-S2', hit ? 'PASS' : 'FAIL', hit ? '命中 VPC' : '未命中 VPC', txt);
}
{
  const { r, txt, hit } = await route('部署当前项目到沙箱给我预览链接', 'Sandbox');
  rec('D3-S3', hit ? 'PASS' : 'FAIL', hit ? '命中 Sandbox' : '未命中 Sandbox', txt);
}
{
  const { r, txt, hit } = await route('查一下能否领券，能领就领', 'Voucher');
  rec('D3-S4', hit ? 'PASS' : 'FAIL', hit ? '命中领券' : '未命中领券', txt);
}
{
  const { r, txt, hit } = await route('物联网+时序数据+前端托管', 'OBS');
  rec('D3-S5', hit ? 'PASS' : 'FAIL', hit ? '命中多服务' : '复合意图未命中', txt);
}
{
  const { r, txt, hit } = await route('部署Python函数，每天定时执行', 'FunctionGraph');
  rec('D3-S6', hit ? 'PASS' : 'FAIL', hit ? '命中 FunctionGraph' : '未命中 FunctionGraph', txt);
}
{
  const { r, txt, hit } = await route('部署一个带MySQL数据库的Web应用', 'RDS');
  rec('D3-S7', hit ? 'PASS' : 'FAIL', hit ? '命中 RDS' : '未命中 RDS', txt);
}

// ---- D3-S8 explain_error ----
{
  const r = await tools.callTool('huaweicloud_explain_error', { errorCode: 'APIGW.0301' }).catch(e => ({ __err: String(e) }));
  const txt = JSON.stringify(r);
  const ok = !r.__err && txt.length > 20;
  rec('D3-S8', ok ? 'PASS' : 'FAIL', ok ? 'explain_error 返回可执行建议' : '裸报错/未识别', txt);
}

// ---- 源码核对类（grep 语义由探针实际读文件判定） ----
import { readFileSync, existsSync } from 'node:fs';
function hasText(fp, needle) { try { return existsSync(fp) && readFileSync(fp, 'utf8').includes(needle); } catch { return false; } }
{
  const ok = hasText(join(HDK, 'update-check.mjs'), 'HUAWEICLOUD_DEVKIT_DEBUG');
  rec('D1-65', ok ? 'PASS' : 'FAIL', ok ? 'update-check.mjs 含 HUAWEICLOUD_DEVKIT_DEBUG 门控' : '缺 DEBUG 门控', ok);
}
{
  const s = join(HDK, 'setup-cli.mjs');
  const a = hasText(s, 'HUAWEICLOUD_AGENT_TOOLKIT_MODE');
  const b = hasText(s, 'SKIP_DSH');
  rec('D1-67', (a && b) ? 'PASS' : 'FAIL', (a && b) ? 'setup-cli.mjs 含 AGENT_TOOLKIT_MODE + SKIP_DSH' : `缺标志 a=${a} b=${b}`, `${a}/${b}`);
}
{
  const p = join(HDK, 'proxy', 'proxy-config.mjs');
  const ok = hasText(p, 'shouldBypassProxy') && hasText(p, 'getProxySettings');
  rec('D1-70', ok ? 'PASS' : 'FAIL', ok ? 'proxy-config.mjs 含 getProxySettings + shouldBypassProxy' : '代理模块缺失', ok);
}
{
  const ok = hasText(join(HDK, '..', 'hooks', 'huaweicloud-safety.py'), 'record_cli_event');
  rec('D4-25', ok ? 'PASS' : 'FAIL', ok ? 'python hook record_cli_event 存在' : '缺 record_cli_event', ok);
}
{
  const ok = hasText(join(HDK, 'risk-rule-engine.mjs'), 'redactEvidence');
  rec('D4-26', ok ? 'PASS' : 'FAIL', ok ? 'risk-rule-engine 含 redactEvidence' : '缺 redactEvidence', ok);
}

// 落盘
writeFileSync(join(__dirname, 'stdout.log'), JSON.stringify({ executedAt: now, sut: 'hdk gitHead ffd7b47 (v1.1.8-next.1)', results: R }, null, 2));
console.log(JSON.stringify({ executedAt: now, count: Object.keys(R).length, statuses: Object.fromEntries(Object.entries(R).map(([k, v]) => [k, v.status])) }, null, 2));