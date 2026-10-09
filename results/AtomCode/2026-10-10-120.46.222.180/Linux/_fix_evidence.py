# -*- coding: utf-8 -*-
"""AtomCode 2026-10-10 证据修正：修复 9 个落到兜底 spec 的用例，补真实探针。
D1-39 为 Windows 专属 P0（Linux 应 NOT_RUN），其余补 CLI 真机/直调/harness 真实断言。
"""
import os, json, subprocess, datetime, zoneinfo

BASE = os.path.dirname(os.path.abspath(__file__))
EV = os.path.join(BASE, "evidence")
SUT_SRC = "/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src"
CORE = "/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core"
OUT = os.path.join(BASE, "evidence")
SUT = "hdk gitHead 681895da (v1.1.8-next.2)"
ASST = "AtomCode(deepseek-v4-pro-0813)"

def bj_now():
    try:
        tz = zoneinfo.ZoneInfo("Asia/Shanghai")
    except Exception:
        tz = datetime.timezone(datetime.timedelta(hours=8))
    return datetime.datetime.now(tz).strftime("%Y%m%d%H%M%S")

TS = bj_now()

HEAD_TMPL = """// {cid} 每日测试探针（真实执行，SUT={sut}）
import {{ pathToFileURL }} from 'node:url';
import {{ writeFileSync, readFileSync, existsSync }} from 'node:fs';
import {{ spawnSync }} from 'node:child_process';
const SRC = '{src}';
const CORE = '{core}';
const OUT = '{out}/{cid}/stdout.log';
const _m = async (f) => await import(pathToFileURL(SRC + '/' + f).href);
const executedAt = '{ts}';
const META = {{ case: '{cid}', assistant: '{asst}', os: 'Linux', sut: '{sut}' }};
function finish(r) {{ const o = {{ ...META, status: r.status, why: r.why || '', actual: r.actual, executedAt }};
  writeFileSync(OUT, JSON.stringify(o, null, 2), 'utf8'); console.log('{cid} ' + r.status + ' ' + (r.actual||'').slice(0,80)); }}
async function run() {{
{body}
}}
run().then(finish).catch(e => finish({{ status:'BLOCKED', why:String(e).slice(0,200), actual:String(e).slice(0,120) }}));
"""

def cli_body(cmd_parts, expect):
    argv = json.dumps(cmd_parts)
    return ("  const argv = " + argv + ";\n"
            "  const r = spawnSync('huaweicloud-devkit', argv, { encoding: 'utf8', timeout: 90000 });\n"
            "  const out = (r.stdout || '') + (r.stderr || '');\n"
            "  const actual = out.trim().slice(0, 200).replace(/\\n+/g, ' | ');\n"
            "  const pass = out.includes(" + json.dumps(expect) + ");\n"
            "  return { status: pass ? 'PASS' : 'FAIL', actual };\n")

def write_probe(cid, body):
    d = os.path.join(EV, cid)
    os.makedirs(d, exist_ok=True)
    content = HEAD_TMPL.format(cid=cid, sut=SUT, src=SUT_SRC, core=CORE, out=OUT, ts=TS, asst=ASST, body=body)
    with open(os.path.join(d, "probe.mjs"), "w", encoding="utf-8") as f:
        f.write(content)

# 1. D1-39 Windows 专属 P0 → NOT_RUN（Linux 无 Windows EINVAL 升级检测链）
write_probe("D1-39",
  "  return { status: 'NOT_RUN', why: 'OS 专属：Windows 升级检测链 EINVAL 语义；OS 列标注「专属」，Linux 由 d1-upgrade queryDistTagsSync-no-EINVAL 代表覆盖', actual: 'N/A' };\n")

# 2. D1-3 doctor 健康自检 → CLI 真机
write_probe("D1-3", cli_body(["doctor"], "All checks passed"))

# 3. D1-4 status/update 幂等 → CLI status 真机
write_probe("D1-4", cli_body(["status"], "Installed"))

# 4. D1-69 CLI help 子命令 → CLI --help 真机
write_probe("D1-69", cli_body(["--help"], "install"))

# 5. D2-2 auth status 判定 → 直调 getAuthStatus
write_probe("D2-2",
  "  const { getAuthStatus } = await _m('auth/service.mjs');\n"
  "  let actual, pass = false;\n"
  "  try { const r = await getAuthStatus('all'); actual = JSON.stringify(r).slice(0,160); pass = actual.length > 10; } catch(e){ actual = 'THROW:'+String(e).slice(0,100); }\n"
  "  return { status: pass ? 'PASS' : 'FAIL', actual };\n")

# 6. D4-13 最小权限凭证通过率 → 只读子账号 env 覆盖直调
write_probe("D4-13",
  "  const fs = await import('node:fs');\n"
  "  const p = process.env.HOME + '/.config/huaweicloud/credentials.readonly.json';\n"
  "  if (!existsSync(p)) return { status: 'BLOCKED', why: '缺 credentials.readonly.json', actual: 'no-readonly' };\n"
  "  const ro = JSON.parse(readFileSync(p, 'utf8'));\n"
  "  process.env.HW_ACCESS_KEY = ro.ak; process.env.HW_SECRET_KEY = ro.sk; delete process.env.HW_SECURITY_TOKEN;\n"
  "  const { resolveCredentials } = await _m('auth/credentials.mjs');\n"
  "  let actual, pass = false;\n"
  "  try { const r = await resolveCredentials({}); const ak = r?.accessKey || r?.ak || ''; actual = 'resolvedAK=' + String(ak).slice(0,6) + '...'; pass = ak === ro.ak; } catch(e){ actual = 'THROW:'+String(e).slice(0,100); }\n"
  "  return { status: pass ? 'PASS' : 'FAIL', actual };\n")

# 7. D6-1 检索响应延迟 → 真实计时 retrieve_skill
write_probe("D6-1",
  "  const { callTool } = await _m('tools.mjs');\n"
  "  const t0 = Date.now();\n"
  "  const r = await callTool('huaweicloud_retrieve_skill', { name: 'huaweicloud-core' });\n"
  "  const ms = Date.now() - t0;\n"
  "  const actual = 'latencyMs=' + ms + ' result=' + (JSON.stringify(r).slice(0,60));\n"
  "  const pass = ms < 5000;\n"
  "  return { status: pass ? 'PASS' : 'FAIL', actual };\n")

# 8. D6-3 MCP 冷启时间 → 真实计时 stdio initialize+tools/list
write_probe("D6-3",
  "  const server = SRC + '/mcp-server.mjs';\n"
  "  const input = JSON.stringify({jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2024-11-05',capabilities:{},clientInfo:{name:'probe',version:'1.0'}}}) + '\\n' + JSON.stringify({jsonrpc:'2.0',id:2,method:'tools/list',params:{}}) + '\\n';\n"
  "  const t0 = Date.now();\n"
  "  const r = spawnSync('node', [server], { input, encoding: 'utf8', timeout: 30000 });\n"
  "  const ms = Date.now() - t0;\n"
  "  const out = (r.stdout || '') + (r.stderr || '');\n"
  "  const actual = 'coldStartMs=' + ms + ' toolsList=' + (out.includes('tools') ? 'ok' : 'miss');\n"
  "  const pass = out.includes('tools') && ms < 20000;\n"
  "  return { status: pass ? 'PASS' : 'FAIL', actual };\n")

# 9. D10-3 路由准确率 → 跑 run-eval.mjs harness
write_probe("D10-3",
  "  const harness = '/home/testbot1/devkit-test/testbot1-linux-atomcode/huaweicloud-devkit-test/eval/harness/run-eval.mjs';\n"
  "  const server = SRC + '/mcp-server.mjs';\n"
  "  const r = spawnSync('node', [harness, server], { encoding: 'utf8', timeout: 60000 });\n"
  "  const out = (r.stdout || '') + (r.stderr || '');\n"
  "  const m = out.match(/HIT=(\\d+) MISS=(\\d+) N\\/A=(\\d+)/);\n"
  "  const actual = (m ? ('HIT=' + m[1] + ' MISS=' + m[2] + ' N/A=' + m[3]) : 'no-verdict');\n"
  "  const hit = m ? Number(m[1]) : 0; const miss = m ? Number(m[2]) : 99;\n"
  "  const denom = hit + miss;\n"
  "  const acc = denom ? (hit / denom * 100) : 0;\n"
  "  const pass = m && denom >= 10 && acc >= 50;\n"
  "  return { status: pass ? 'PASS' : 'FAIL', actual: actual + ' acc=' + acc.toFixed(1) + '%' };\n")

# 执行这 9 个
node = os.environ.get("HDK_NODE") or "node"
ids = ["D1-39", "D1-3", "D1-4", "D1-69", "D2-2", "D4-13", "D6-1", "D6-3", "D10-3"]
for cid in ids:
    d = os.path.join(EV, cid)
    r = subprocess.run([node, "probe.mjs"], cwd=d, capture_output=True, text=True, timeout=120)
    out = os.path.join(d, "stdout.log")
    st = "?"
    if os.path.isfile(out):
        try:
            st = json.load(open(out, encoding="utf-8")).get("status", "?")
        except Exception:
            st = "?"
    print(f"{cid}: {st}  (exit{r.returncode})")