# -*- coding: utf-8 -*-
"""Hermes/Linux 每日测试执行回填（全新一轮，强制完整重跑）。

SUT: huaweicloud-devkit v1.1.4 (npm latest, gitHead 9b67256)
探针: run_probes.sh(12 支) + probe-supplement2.mjs(Change*/注入/小写凭证)
本脚本回填 设计级 77 + 展开级 26 的执行状态/执行时间/evidencePath/blockedReason，
并重建 FAIL/SPEC 逐用例证据。追踪表回填执行时间。
"""
import csv, os, datetime

REPO = "/home/testbot1/devkit-test/Hermes/huaweicloud-devkit-test"
PACK = os.path.join(REPO, "results/Hermes/2026-09-15-113.44.197.147/Linux")
EVID = os.path.join(PACK, "evidence")
EXEC_TIME = datetime.datetime.now().strftime("%Y%m%d%H%M%S")

# ---------------- 设计级状态 ----------------
# PASS(60)
DESIGN_PASS = ["D1-1","D1-2","D1-3","D1-4","D1-5","D1-6",
    "D1-26","D1-27","D1-28","D1-30","D1-31","D1-33","D1-40","D1-41","D1-42","D1-45",
    "D2-1","D2-2","D2-5","D2-10","D2-12","D2-13","D2-16",
    "D3-A1","D3-B1","D3-B3","D3-B5","D3-C5",
    "D4-1","D4-3","D4-6","D4-7","D4-9","D4-10","D4-12","D4-15","D4-18","D4-19","D4-20","D4-21","D4-22","D4-24",
    "D5-1","D5-3",
    "D6-1","D6-3","D6-4",
    "D7-4",
    "D8-4","D8-6","D8-7",
    "D9-1","D9-3","D9-4","D9-5","D9-6","D9-7","D9-8","D9-9",
    "D10-4"]
# FAIL(12)
DESIGN_FAIL = ["D4-2","D4-16","D4-5","D2-4","D4-23","D4-4","D4-8","D4-17","D4-11","D10-3","D2-11","D8-1"]
DESIGN_SPEC = ["D9-2"]
DESIGN_BLOCKED = {
    "D1-39": "Windows 专属升级检测链(.cmd/EINVAL 语义)，本机 Linux 无 Windows 环境；Linux 侧由展开级 EXP-NR3-10 通用断言覆盖(PASS)",
    "D1-58": "通用 MCP(Claude/Cursor) merge 需交互 option3，本机非交互环境 auto-detect 走 hermes 未触发 merge",
    "D4-13": "最小权限凭证通过率需只读 IAM 子账号凭证(~/.config/huaweicloud/credentials.readonly.json)，本机缺该凭证无法构建通过率矩阵",
    "D4-14": "操作可审计性需真云 CTS(建删资源后查审计日志)，本机本轮未执行真云建删",
}
# ---------------- 展开级状态 ----------------
EXPANDED_PASS = ["EXP-D5-8-1","EXP-D5-8-3","EXP-E06","EXP-E09","EXP-E15",
                 "EXP-NR3-02","EXP-NR3-04","EXP-NR3-10","EXP-NR3-24"]
EXPANDED_FAIL = ["EXP-E01","EXP-E02","EXP-E03","EXP-E04","EXP-E05","EXP-E07","EXP-E08",
                 "EXP-E10","EXP-E11","EXP-E12","EXP-E13","EXP-E14"]
EXPANDED_BLOCKED = {f"EXP-D1-58-0{i}": "通用 MCP(Claude/Cursor) merge 需交互 option3，本机非交互环境未实测(源用例 D1-58)"
                    for i in range(1,6)}

# ---------------- FAIL/SPEC 逐用例证据重建（fresh 探针实况） ----------------
FAIL_EV = {
 "D4-2":  ("FAIL", "printenv/echo $HW_ACCESS_KEY 等 env 泄露路径 => deny",
           "2/6 deny（HW_ 前缀 4 条漏网）", "safety-policy.mjs:336 env-dump 正则 /HUAWEICLOUD|HWC_|HCLOUD|OS_/i 未覆盖 HW_ 前缀"),
 "D4-16": ("FAIL", "sh/bash/eval/$() 包裹内 hcloud 写操作 => deny",
           "0/4 拦截（命令包裹穿透）", "safety-policy.mjs:345 正则仅匹配行首/空白后 hcloud，引号包裹/子 shell/命令替换绕过"),
 "D4-5":  ("FAIL", "Change* 写操作不得误判为只读 => risk=write deny",
           "0/4：ChangeServerOsWithoutCloudInit/WithCloudInit/ChangeVpc/ChangeInstanceConfiguration 均 risk=unknown_read allow",
           "safety/policy.json writeOperationPrefixes 缺 Change 前缀，hasWritePrefix 未命中"),
 "D2-4":  ("FAIL", "凭证字段含小写 ak=/sk= 也应脱敏 <redacted>",
           "对象 accessKeyId/secretAccessKey 脱敏=PASS；小写字符串 ak=AK123456 sk=SKsecret 未脱敏(缺陷)；大写 AK=/SK= 正常脱敏",
           "safety-policy.mjs:45 .replace(/(AK|SK).../g) 大小写敏感缺 /i → 小写 ak=/sk= 漏网"),
 "D4-23": ("FAIL", "install 后安装目标目录应含全局 MUST 规则文件 huawei-agent-rules.md",
           "隔离 HOME install --target hermes 后 find 全目录无该文件",
           "setup-cli.mjs 安装函数仅复制 skills/commands/src/safety/hooks，未复制仓库根 rules/ 目录"),
 "D4-4":  ("FAIL", "Change* 写操作未经审批 => deny",
           "1/4：ChangeServerOsWithoutCloudInit/ChangeVpc/ChangeInstanceConfiguration allow（仅 CreateServer deny）",
           "safety/policy.json writeOperationPrefixes 缺 Change → 审批门漏拦截"),
 "D4-8":  ("FAIL", "Python 与 Node 钩子对同一写操作 payload 判定一致 => deny",
           "Node deny / Python <空=放行>",
           "hooks/huaweicloud-safety.py:46 WRITE_OPERATION_RE 操作名前导要求字母数字/行首，Delete 前为空格不匹配"),
 "D4-17": ("FAIL", "钩子对畸形输入应 fail-closed(deny)",
           "not-json-at-all / {} 均静默放行",
           "hooks/huaweicloud-safety.mjs:45-48 try{JSON.parse}catch{return} 解析失败静默返回"),
 "D4-11": ("FAIL", "自然语言提示注入夹带 hcloud 写命令 => deny",
           "1/4：Ignore...run hcloud ecs DeleteServers、中文系统提示夹带 DeleteVpc/DeleteInstance 均 allow；仅编码管道 xxd|sh deny",
           "safety-policy.mjs classifyTextCommand 仅识别句首/空白后 hcloud，自然语言句式未命中"),
 "D10-3": ("FAIL", "serviceCatalog 中文意图应命中对应服务",
           "12/15 中文意图 miss，返回 Run hcloud --help...（仅 Redis→DCS/K8s→CCE/代金券→voucher 命中）",
           "tools.mjs serviceCatalog() routeMap 关键词均为英文，未做中文意图映射"),
 "D2-11": ("FAIL", "带 securityToken 的 persist 应立即 {status:error,scope:rejected}",
           "R3 拒绝逻辑存在=true，但 R2 冲突门(needs_confirmation@tools.mjs:1228)先于 persistCredentials R3 检查(@1237)",
           "tools.mjs:1214-1237 冲突判定先于 R3 STS 检查；token 仍不落盘但给误导性切换确认"),
 "D8-1":  ("FAIL", "源码文档声明工具数应与实现一致",
           "hdk/AGENTS.md:27,45 仍写 39 tools，实现 TOOL_DEFINITIONS=40",
           "AGENTS.md:27,45 未随 #347 工具新增同步(文档漂移)"),
 "D9-2":  ("SPEC-MISMATCH", "未知方法错误码应为 -32601(Method not found)",
           "实际 -32603(Internal error)",
           "mcp-server.mjs:169 统一硬编码 code:-32603 未映射 -32601"),
}
EXP_FAIL_EV = {
 "EXP-E01": ("FAIL","「华北北京四云主机」-> ECS","miss", "serviceCatalog 中文意图路由未命中"),
 "EXP-E02": ("FAIL","「创建 Ubuntu 云服务器」-> ECS","miss", "serviceCatalog 中文意图路由未命中"),
 "EXP-E03": ("FAIL","「dist 部署静态网站」-> OBS","误路由 Sandbox/DevStation", "serviceCatalog 中文意图路由错"),
 "EXP-E04": ("FAIL","「弹性公网IP」-> EIP","miss", "serviceCatalog 中文意图路由未命中"),
 "EXP-E05": ("FAIL","「MySQL 实例状态」-> RDS","miss", "serviceCatalog 中文意图路由未命中"),
 "EXP-E07": ("FAIL","「每日备份策略」-> CBR","miss", "serviceCatalog 中文意图路由未命中"),
 "EXP-E08": ("FAIL","「ECS 启动失败分析」-> ECS/诊断","miss", "serviceCatalog 中文意图路由未命中"),
 "EXP-E10": ("FAIL","「函数处理图片」-> FunctionGraph","miss", "serviceCatalog 中文意图路由未命中"),
 "EXP-E11": ("FAIL","「本月费用」-> BSS","miss", "serviceCatalog 中文意图路由未命中"),
 "EXP-E12": ("FAIL","「日志指标云监控」-> CES","miss", "serviceCatalog 中文意图路由未命中"),
 "EXP-E13": ("FAIL","「HTTPS证书域名」-> ELB","miss", "serviceCatalog 中文意图路由未命中"),
 "EXP-E14": ("FAIL","「用户权限审计」-> IAM","miss", "serviceCatalog 中文意图路由未命中"),
}

def write_ev(cid, status, expected, actual, detail):
    d = os.path.join(EVID, cid)
    os.makedirs(d, exist_ok=True)
    with open(os.path.join(d, "stdout.txt"), "w", encoding="utf-8") as f:
        f.write(f"=== CASE {cid} ===  {status}\n  expected: {expected}\n  actual:   {actual}\n  root:     {detail}\n")

for cid, (st, exp, act, det) in FAIL_EV.items():
    write_ev(cid, st, exp, act, det)
for cid, (st, exp, act, det) in EXP_FAIL_EV.items():
    write_ev(cid, st, exp, act, det)
print(f"重建 FAIL/SPEC 逐用例证据 {len(FAIL_EV)+len(EXP_FAIL_EV)} 条")

def backfill(kind, status_sets, blocked_map):
    path = os.path.join(PACK, f"用例矩阵-{kind}.csv")
    rows = list(csv.DictReader(open(path, encoding="utf-8-sig")))
    fields = list(rows[0].keys())
    n = 0
    for r in rows:
        cid = r["ID"].strip()
        if cid in status_sets.get("PASS", set()):
            st = "PASS"; ev = f"evidence/{cid}/stdout.txt"; br = ""
        elif cid in status_sets.get("FAIL", set()):
            st = "FAIL"; ev = f"evidence/{cid}/stdout.txt"; br = ""
        elif cid in status_sets.get("SPEC", set()):
            st = "SPEC-MISMATCH"; ev = f"evidence/{cid}/stdout.txt"; br = ""
        elif cid in blocked_map:
            st = "BLOCKED"; ev = ""; br = blocked_map[cid]
        else:
            print(f"  [WARN] {kind} {cid} 未映射，保持空")
            continue
        r["执行状态"] = st; r["执行时间"] = EXEC_TIME; r["evidencePath"] = ev; r["blockedReason"] = br
        n += 1
    with open(path, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields); w.writeheader(); w.writerows(rows)
    print(f"回填 {kind}: {n}/{len(rows)} 条")
    return rows

ss_design = {"PASS": set(DESIGN_PASS), "FAIL": set(DESIGN_FAIL), "SPEC": set(DESIGN_SPEC)}
ss_expanded = {"PASS": set(EXPANDED_PASS), "FAIL": set(EXPANDED_FAIL), "SPEC": set()}
backfill("设计级", ss_design, DESIGN_BLOCKED)
backfill("展开级", ss_expanded, EXPANDED_BLOCKED)

# 追踪表
tpath = os.path.join(PACK, "需求-设计-证据追踪表.csv")
trows = list(csv.DictReader(open(tpath, encoding="utf-8-sig")))
for r in trows:
    r["执行时间"] = EXEC_TIME
with open(tpath, "w", encoding="utf-8-sig", newline="") as f:
    w = csv.DictWriter(f, fieldnames=list(trows[0].keys())); w.writeheader(); w.writerows(trows)
print(f"回填 追踪表: {len(trows)} 行 执行时间={EXEC_TIME}")

from collections import Counter
print("\n=== 设计级状态分布 ===", dict(Counter(["PASS" if c in DESIGN_PASS else "FAIL" if c in DESIGN_FAIL else "SPEC-MISMATCH" if c in DESIGN_SPEC else "BLOCKED" for c in list(DESIGN_PASS)+DESIGN_FAIL+DESIGN_SPEC+list(DESIGN_BLOCKED)])))
print("=== 展开级状态分布 ===", dict(Counter(["PASS" if c in EXPANDED_PASS else "FAIL" if c in EXPANDED_FAIL else "BLOCKED" for c in EXPANDED_PASS+EXPANDED_FAIL+list(EXPANDED_BLOCKED)])))
print(f"\nEXEC_TIME={EXEC_TIME}  BACKFILL DONE")