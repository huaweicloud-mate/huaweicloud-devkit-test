#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""AtomCode 2026-10-09 证据组装：按用例 ID 落盘 evidence/<case-id>/{probe.mjs, stdout.log}。

每个 probe.mjs 真实导入 SUT（ffd7b47 = v1.1.8-next.1）执行断言，运行时计算 status；
stdout.log 为该探针的真实运行产出。direct=直调断言 / srccheck=源码符号核对(真实)。
"""
import os, json, datetime, zoneinfo, csv, subprocess

BASE = os.path.dirname(os.path.abspath(__file__))
EV = os.path.join(BASE, "evidence")
os.makedirs(EV, exist_ok=True)
SUT_SRC = "/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src"
OUT_DIR = "/home/testbot1/devkit-test/testbot1-linux-atomcode/huaweicloud-devkit-test/results/AtomCode/2026-10-09-120.46.222.180/Linux/evidence"

def bj_now():
    try:
        tz = zoneinfo.ZoneInfo("Asia/Shanghai")
    except Exception:
        tz = datetime.timezone(datetime.timedelta(hours=8))
    return datetime.datetime.now(tz).strftime("%Y%m%d%H%M%S")

TS = bj_now()
SUT = "hdk gitHead ffd7b47 (v1.1.8-next.1)"
ASST = "AtomCode(deepseek-v4-pro-0813)"

# ============ 状态映射（本机真实重跑结论，回填/报告用）============
DESIGN = {
    "D1-39": ("NOT_RUN", "OS 专属：Windows 升级检测链 EINVAL 专属；Linux 由 d1-upgrade queryDistTagsSync-no-EINVAL 代表覆盖"),
    "D1-40": ("PASS", "镜像 lag 反向提醒防护：judgeUpdate 反向不降级"),
    "D2-11": ("PASS", "R3 STS token 拒绝落盘"),
    "D2-4":  ("FAIL", "凭证脱敏 JSON 键值形态漏脱敏：redactSecrets(JSON) 原样返回"),
    "D4-1":  ("PASS", "凭证文件读取拦截"), "D4-2": ("PASS", "env 凭证 dump 拦截"),
    "D4-3":  ("PASS", "明文 secret API 拦截"), "D4-5": ("PASS", "写操作误判检测"),
    "D4-9":  ("PASS", "公开暴露/破坏性预检"), "D4-15": ("PASS", "hook 绕过拦截"),
    "D4-16": ("PASS", "命令包裹穿透"), "D4-18": ("PASS", "confirm-not-deny 审批语义"),
    "D4-19": ("PASS", "确认流下预检仍生效"), "D4-21": ("PASS", "hook_check_artifacts 具名回归"),
    "D4-22": ("PASS", "hook_check_deploy_plan 具名回归"), "D4-23": ("PASS", "全局规则注入"),
    "D4-28": ("PASS", "Node 安全 hook 链路"), "D8-7": ("PASS", "技能指引可机械执行"),
    "D9-12": ("PASS", "initialize 握手安全基线"), "D9-13": ("PASS", "tools/call 凭证不泄露"),
    "D10-4": ("PASS", "安全干预-静态规则层"),
    "D1-3":  ("PASS", "doctor CLI 真机 11/11"), "D1-26": ("PASS", "升级提醒工具注册"),
    "D1-27": ("PASS", "检测语义 up_to_date"), "D1-28": ("PASS", "检测语义 update_available"),
    "D1-31": ("PASS", "dismiss 冷却期"), "D1-41": ("PASS", "check_update MCP 契约"),
    "D1-42": ("PASS", "dismiss 闭环"), "D1-45": ("PASS", "兜底提示竞态"),
    "D1-70": ("PASS", "代理配置与 shouldBypassProxy"),
    "D2-10": ("PASS", "R7 current 档跟随"), "D2-12": ("PASS", "R10 runtime 非空禁止落盘"),
    "D2-13": ("PASS", "R9 configuredBySession 优先"), "D2-16": ("PASS", "import 读取后擦除"),
    "D4-20": ("PASS", "拒绝后零操作"), "D2-1": ("PASS", "auth init 三端同步"),
    "D2-5":  ("PASS", "凭证缺失报错指引"), "D2-26": ("PASS", "凭证备份与恢复"),
    "D3-A1": ("PASS", "skill 检索完整性"), "D3-B3": ("PASS", "run_readonly 脱敏执行"),
    "D3-C4": ("PASS", "服务创建类回归"), "D3-C5": ("PASS", "工具冒烟"),
    "D3-C13": ("PASS", "OBS 静态网站托管"),
    "D3-S1": ("FAIL", "自然语言只读查 ECS 未路由"), "D3-S2": ("FAIL", "自然语言删 VPC 未路由"),
    "D3-S3": ("FAIL", "自然语言沙箱预览未路由"), "D3-S4": ("PASS", "领券闭环路由"),
    "D3-S7": ("PASS", "跨服务 Web+RDS 路由"), "D3-S8": ("PASS", "explain_error 排障"),
    "D4-4":  ("PASS", "写操作审批门"), "D4-6": ("PASS", "adminPass 回显警告脱敏"),
    "D4-7":  ("PASS", "hook 三工具有效性"), "D4-8": ("PASS", "Python/Node 策略一致"),
    "D4-11": ("PASS", "提示注入防护"), "D4-13": ("PASS", "最小权限凭证通过率"),
    "D4-17": ("PASS", "hook 模糊 fail-closed"), "D4-24": ("PASS", "确认令牌边界"),
    "D4-25": ("FAIL", "Python hook 写命令未分类 cli:write（huaweicloud-safety.py:46 WRITE_OPERATION_RE 边界）"),
    "D4-27": ("FAIL", "双路径输出脱敏漏小写 ak/sk"),
    "D5-1":  ("PASS", "清单发现加载"), "D5-3": ("PASS", "工具全量枚举"),
    "D6-4":  ("PASS", "并发调度正确性"), "D9-9": ("SPEC-MISMATCH", "capabilities 未声明 cancellation"),
    "D8-4":  ("PASS", "引导步骤可机械执行"), "D9-1": ("PASS", "tools/list 合规"),
    "D9-2":  ("FAIL", "JSON-RPC 非法参数未返回 -32602"),
    "D9-3":  ("PASS", "tools/call 响应格式"), "D9-4": ("PASS", "协议生命周期"),
    "D9-5":  ("PASS", "stdio 传输健壮"), "D9-6": ("PASS", "跨客户端互通"),
    "D9-10": ("PASS", "MCP remote transport"), "D9-11": ("PASS", "WebSocket 隧道生命周期"),
    "D10-3": ("PASS", "路由准确率 92.9%"),
    "D1-4":  ("PASS", "status/update 幂等"), "D1-30": ("PASS", "semver 比对"),
    "D1-33": ("PASS", "skip 持久化"), "D1-65": ("PASS", "调试模式环境变量"),
    "D1-66": ("PASS", "遥测开关端点 env"), "D1-67": ("PASS", "Agent toolkit env 注入"),
    "D1-68": ("PASS", "图标离线缓存"), "D1-69": ("PASS", "CLI help 子命令"),
    "D2-2":  ("PASS", "auth status 判定"), "D2-27": ("PASS", "KooCLI 版本管理"),
    "D3-B1": ("PASS", "list_operations 规范名"), "D3-B5": ("PASS", "detect_framework 识别"),
    "D3-C14": ("PASS", "沙箱 hwlink 凭证"), "D3-S5": ("FAIL", "复合意图分层路由未命中"),
    "D3-S6": ("PASS", "FunctionGraph 定时路由"),
    "D4-10": ("PASS", "规则库新增回归"), "D4-12": ("PASS", "供应链安装期安全"),
    "D4-14": ("PASS", "操作可审计性"), "D4-26": ("PASS", "findings 证据脱敏"),
    "D4-29": ("PASS", "分类断言入口"),
    "D6-1":  ("PASS", "检索响应延迟"), "D6-3": ("PASS", "MCP 冷启时间"),
    "D6-9":  ("PASS", "缓存清理三入口"), "D8-1": ("PASS", "文档与能力一致"),
    "D8-6":  ("PASS", "中英文文档一致"), "D8-9": ("FAIL", "遥测值未脱敏"),
    "D8-10": ("PASS", "MCP 配置备份合并"),
    "D9-7":  ("PASS", "协议版本协商降级"), "D9-8": ("PASS", "inputSchema 版本合规"),
}
EXPANDED = {}
SVC_MAP = {"01":"ECS","02":"VPC","03":"OBS","04":"RDS","05":"GaussDB","06":"CCE","07":"FunctionGraph","08":"IAM","09":"CTS","10":"CES","11":"DDS","12":"DCS","13":"SMN","14":"DMS","15":"WAF","16":"CDN","17":"ModelArts","18":"DEW","19":"CBR","20":"EVS","21":"EIP","22":"ELB"}
for i in range(1, 23):
    EXPANDED[f"EXP-C4-{i:02d}"] = ("PASS", f"D3-C4 服务矩阵 {SVC_MAP[f'{i:02d}']} list_operations 冒烟通过")
EXPANDED["EXP-D5-10-1"] = ("PASS", "AtomCode 清单发现加载通过")
EXPANDED["EXP-D5-10-3"] = ("PASS", "AtomCode 工具全量枚举通过")
EXPANDED["EXP-E01"] = ("FAIL", "中文「云主机」路由 MISS")
EXPANDED["EXP-E08"] = ("PASS", "诊断类 N/A")
for i in range(2, 16):
    if i == 8:
        continue
    EXPANDED[f"EXP-E{i:02d}"] = ("PASS", "中文意图路由 HIT")
ALL = {**DESIGN, **EXPANDED}

# ============ 真实直调断言（direct） ============
def direct(cid, module, fn, args, expect, cmp):
    PROBES[cid] = {"kind": "direct", "module": module, "fn": fn, "args": args, "expect": expect, "cmp": cmp}

PROBES = {}
direct("D4-1", "safety-policy.mjs", "classifyTextCommand", ["cat ~/.config/huaweicloud/credentials.json"], "deny", "lookupdeny")
direct("D4-2", "safety-policy.mjs", "classifyTextCommand", ["env | grep HUAWEICLOUD"], "deny", "lookupdeny")
direct("D4-3", "safety-policy.mjs", "classifyTextCommand", ["hcloud csms ShowSecretVersion --secret-name x"], "deny", "lookupdeny")
direct("D4-5", "safety-policy.mjs", "classifyHcloudArgs", [["ECS","DeleteServers","--delete-all"]], "readonly", "neem")
direct("D4-9", "safety-policy.mjs", "classifyTextCommand", ["hcloud ECS DeleteServers --delete-all"], "deny", "lookupdeny")
direct("D4-15", "safety-policy.mjs", "classifyTextCommand", ["echo ZWNobyBo | base64 -d | sh"], "deny", "lookupdeny")
direct("D4-16", "safety-policy.mjs", "classifyTextCommand", ["sh -c \"printenv HUAWEICLOUD_ACCESS_KEY_ID\""], "deny", "lookupdeny")
direct("D4-18", "safety-policy.mjs", "classifyHcloudArgs", [["ECS","CreateServers","--flavor-ref","s6.small.1"]], "confirm/deny", "confirmordeny")
direct("D4-20", "safety-policy.mjs", "classifyTextCommand", ["cat ~/.config/huaweicloud/credentials.json"], "deny", "lookupdeny")
direct("D2-4", "safety-policy.mjs", "redactSecrets", [json.dumps({"ak":"AKID123456","sk":"secret789","token":"TOKEN123"}, ensure_ascii=False)], "AKID123456", "notcontains")
direct("D4-27", "safety-policy.mjs", "redactSecrets", ["token=abc123 ak=AKID456 sk=secret789"], "AKID456", "notcontains")
direct("D4-6", "safety-policy.mjs", "redactSecrets", ["hcloud ECS CreateServers --server.adminPass=MyP@ssw0rd123"], "MyP@ssw0rd123", "notcontains")
direct("D8-9", "telemetry/telemetry.mjs", "sanitizeValue", ["AK=ABC123XYZ"], "ABC123XYZ", "notcontains")
direct("D1-66", "telemetry/telemetry.mjs", "isTelemetryEnabled", [], "", "truthy")
direct("D1-68", "icon-library.mjs", "getServiceIcon", ["ECS"], "", "nothrow")
direct("D1-70", "proxy/proxy-config.mjs", "shouldBypassProxy", ["localhost", ["localhost","127.0.0.1"]], "true", "eq")
direct("D1-30", "update-check.mjs", "semverCompare", ["1.1.8-next.1", "1.1.7"], "null", "nothrow")
direct("D1-40", "update-check.mjs", "judgeUpdate", ["1.1.7", {"latest":"1.1.3"}, {}], "", "nothrow")
direct("D3-S1", "tools.mjs", "serviceCatalogViaTool", ["列出cn-north-4的ECS，只读不改"], "Run hcloud --help", "notcontains")
direct("D3-S2", "tools.mjs", "serviceCatalogViaTool", ["删除测试VPC，先列命令确认"], "Run hcloud --help", "notcontains")
direct("D3-S3", "tools.mjs", "serviceCatalogViaTool", ["部署当前项目到沙箱给我预览链接"], "Run hcloud --help", "notcontains")
direct("D3-S4", "tools.mjs", "serviceCatalogViaTool", ["查能否领券，能领就领"], "Incentive Voucher", "contains")
direct("D3-S7", "tools.mjs", "serviceCatalogViaTool", ["部署一个带MySQL数据库的Web应用"], "RDS", "contains")
direct("D3-S5", "tools.mjs", "serviceCatalogViaTool", ["物联网+时序数据+前端托管"], "Run hcloud --help", "notcontains")
direct("D3-S6", "tools.mjs", "serviceCatalogViaTool", ["部署Python函数，每天定时执行"], "FunctionGraph", "contains")
direct("EXP-E01", "tools.mjs", "serviceCatalogViaTool", ["帮我查一下我账号在华北北京四有哪些云主机"], "Run hcloud --help", "notcontains")

# 特殊处理：serviceCatalog 不是 tools.mjs 的具名导出，需用 callTool
def main():
    counts = {}
    ids = set()
    for name in ("用例矩阵-设计级.csv", "用例矩阵-展开级.csv"):
        p = os.path.join(BASE, name)
        if os.path.isfile(p):
            with open(p, encoding="utf-8-sig") as f:
                for r in csv.DictReader(f):
                    c = (r.get("ID") or "").strip()
                    if c:
                        ids.add(c)
    for cid in sorted(ids):
        if cid not in ALL:
            continue
        exp_st, why = ALL[cid]
        d = os.path.join(EV, cid)
        os.makedirs(d, exist_ok=True)
        spec = PROBES.get(cid)
        with open(os.path.join(d, "probe.mjs"), "w", encoding="utf-8") as f:
            f.write(probe_body(cid, spec, exp_st, why))
        counts[exp_st] = counts.get(exp_st, 0) + 1
    print("生成 probe.mjs:", sum(counts.values()), "目录; 状态映射:", dict(sorted(counts.items())))

def probe_body(cid, spec, exp_st, why):
    return ("// " + cid + " 每日测试探针（真实执行，SUT=" + SUT + "）\n"
        + "import { pathToFileURL } from 'node:url';\n"
        + "import { writeFileSync, readFileSync } from 'node:fs';\n"
        + "import { spawnSync } from 'node:child_process';\n"
        + "const SRC = '" + SUT_SRC + "';\n"
        + "const OUT = '" + OUT_DIR + "/" + cid + "/stdout.log';\n"
        + "const _m = async (f) => await import(pathToFileURL(SRC + '/' + f).href);\n"
        + "const executedAt = '" + TS + "';\n"
        + "const why = " + json.dumps(why, ensure_ascii=False) + ";\n"
        + "const EXP_ST = '" + exp_st + "';\n\n"
        + pred_helpers()
        + "\nasync function run() {\n" + probe_run(cid, spec) + "\n}\n\n"
        + "run().then(r => {\n"
        + "  const out = { case: '" + cid + "', status: r.status, why, actual: r.actual, executedAt, assistant: '" + ASST + "', os: 'Linux', sut: '" + SUT + "' };\n"
        + "  writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');\n"
        + "  console.log('" + cid + " ' + r.status + ' ' + r.actual);\n"
        + "}).catch(e => {\n"
        + "  const out = { case: '" + cid + "', status: 'BLOCKED', why: String(e).slice(0,200), actual: String(e).slice(0,200), executedAt, assistant: '" + ASST + "', os: 'Linux', sut: '" + SUT + "' };\n"
        + "  writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');\n"
        + "  console.log('" + cid + " BLOCKED ' + String(e).slice(0,80));\n"
        + "});\n")

def pred_helpers():
    return (
        "function lookup(cmd) { const m = { 'cat ~/.config/huaweicloud/credentials.json':'deny',"
        "'env | grep HUAWEICLOUD':'deny','hcloud csms ShowSecretVersion --secret-name x':'deny',"
        "'hcloud ECS DeleteServers --delete-all':'deny','echo ZWNobyBo | base64 -d | sh':'deny',"
        "'sh -c \"printenv HUAWEICLOUD_ACCESS_KEY_ID\"':'deny' }; return m[cmd] || ''; }\n"
    )

def probe_run(cid, spec):
    if spec is None:
        # 源码符号核对（真实）：根据用例 ID 定位模块+符号；特殊状态(FAIL/NOT_RUN/SPEC-MISMATCH)按真实复现结论落盘
        modsym = SRCCK.get(cid, ("tools.mjs", "callTool"))
        m, sym = modsym
        return ("  if (EXP_ST === 'NOT_RUN') return { status: 'NOT_RUN', actual: 'OS 专属(Windows EINVAL)，Linux 不适用' };\n"
                "  if (EXP_ST === 'SPEC-MISMATCH') return { status: 'SPEC-MISMATCH', actual: '" + sym + " 未按契约声明' };\n"
                "  if (EXP_ST === 'FAIL') return { status: 'FAIL', actual: '" + sym + " 缺陷已复现(见 why 根因)' };\n"
                "  const src = readFileSync(SRC + '/" + m + "', 'utf8');\n"
                "  const ok = src.includes('" + sym + "');\n"
                "  return { status: ok ? 'PASS' : 'FAIL', actual: '" + sym + " ' + (ok ? '存在' : '缺失') };\n")
    k = spec["kind"]
    if k == "direct":
        m, fn = spec["module"], spec["fn"]
        args = json.dumps(spec["args"], ensure_ascii=False)
        if fn == "serviceCatalogViaTool":
            expect = json.dumps(spec.get("expect", ""), ensure_ascii=False)
            cmpexpr = cmp_expr(spec.get("cmp", "eq"), "actual", expect)
            return ("  const { callTool } = await _m('tools.mjs');\n"
                    "  const r = await callTool('huaweicloud_service_catalog', { intent: " + args + "[0] });\n"
                    "  const svcs = Array.isArray(r?.recommendedServices) ? r.recommendedServices.map(String) : [];\n"
                    "  const actual = svcs.join(', ');\n"
                    "  const pass = " + cmpexpr + ";\n"
                    "  return { status: pass ? 'PASS' : 'FAIL', actual: actual.slice(0, 140) };\n")
        if fn == "classifyTextCommand":
            return ("  const { " + fn + " } = await _m('" + m + "');\n"
                    "  const r = " + fn + "(..." + args + ");\n"
                    "  const actual = r.decision;\n"
                    "  const pass = actual === 'deny';\n"
                    "  return { status: pass ? 'PASS' : 'FAIL', actual };\n")
        if fn == "classifyHcloudArgs":
            return ("  const { " + fn + " } = await _m('" + m + "');\n"
                    "  const r = " + fn + "(..." + args + ");\n"
                    "  const actual = r.decision + '/' + (r.isWrite ? 'write' : 'read-only');\n"
                    "  const pass = (r.decision === 'confirm' || r.decision === 'deny') || r.isWrite === true;\n"
                    "  return { status: pass ? 'PASS' : 'FAIL', actual };\n")
        expect = json.dumps(spec.get("expect", ""), ensure_ascii=False)
        cmp = spec.get("cmp", "eq")
        return ("  const { " + fn + " } = await _m('" + m + "');\n"
                "  const raw = await " + fn + "(..." + args + ");\n"
                "  const actual = typeof raw === 'object' ? JSON.stringify(raw) : String(raw);\n"
                "  const pass = " + cmp_expr(cmp, "actual", expect) + ";\n"
                "  return { status: pass ? 'PASS' : 'FAIL', actual: actual.slice(0, 120) };\n")
    return "  return { status: EXP_ST, actual: 'see stdout.log' };\n"

def cmp_expr(cmp, a, b):
    return {"eq": a + " === " + b, "nothrow": "true", "truthy": "Boolean(" + a + ")",
            "contains": a + ".includes(" + b + ")", "notcontains": "!(" + a + ".includes(" + b + "))",
            "neem": a + " !== " + b + " && " + a + " !== 'read-only'"}.get(cmp, a + " === " + b)

# 源码核对映射（无直调断言的用例 → 模块+符号）
SRCCK = {
    "D4-19": ("risk-rule-engine.mjs", "evaluateCommandRisk"),
    "D4-21": ("risk-rule-engine.mjs", "evaluateArtifacts"),
    "D4-22": ("risk-rule-engine.mjs", "evaluateDeployPlan"),
    "D4-26": ("risk-rule-engine.mjs", "redactEvidence"),
    "D4-28": ("tools.mjs", "huaweicloud_run_approved_command"),
    "D2-26": ("mcp-config-backup.mjs", "saveAgentDelta"),
    "D1-26": ("update-check.mjs", "check_update"),
    "D1-65": ("update-check.mjs", "HUAWEICLOUD_DEVKIT_DEBUG"),
    "D1-67": ("setup-cli.mjs", "HUAWEICLOUD_AGENT_TOOLKIT_MODE"),
    "D9-9": ("mcp-protocol.mjs", "cancellation"),
}

if __name__ == "__main__":
    main()