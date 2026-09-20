#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Hermes Linux 2026-09-20 daily test 回填脚本（一次性，幂等）。
执行状态 + 执行时间 + evidencePath 回填：evidence 由探针/协议/评测 harness 真实落盘。
本脚本不编造：无证据用例标 NOT_RUN/BLOCKED 并写原因。"""
import csv, json, os, datetime
from collections import defaultdict

REPO = "/home/testbot3/devkit-test/Hermes/huaweicloud-devkit-test"
DAY = "2026-09-20-1.94.218.129"
PACK = os.path.join(REPO, "results", "Hermes", DAY, "Linux")
EV = os.path.join(PACK, "evidence")
TS = datetime.datetime.now().strftime("%Y%m%d%H%M%S")

def load_group(name):
    p = os.path.join(EV, name, "stdout.log")
    if not os.path.isfile(p):
        return []
    try:
        data = json.load(open(p, encoding="utf-8"))
    except Exception:
        return []
    return data.get("results", [])

GROUPS = {name: load_group(name) for name in [
    "D1-40","D2-11","D2-26","D4-13","D4-23","D4-27","D8-4","D8-7",
    "c4-service-matrix","c4-service-realcloud","d1-cli","d1-extend","d1-upgrade",
    "d2-auth","d3-cloud","d3-sandbox","d3-scenario","d4-extend","d4-hooks",
    "d4-security","d6-cache","d8-extend","d9-remote","d9-ws","mcp-tools",
]}

# 合并所有探针结果：case-id -> 是否有 FAIL
def merge(groups):
    agg = {}
    for g, rs in groups.items():
        for r in rs:
            cid = r.get("id") or r.get("service")
            if not cid:
                continue
            a = agg.setdefault(cid, {"fail": False, "groups": set()})
            if not r.get("pass"):
                a["fail"] = True
            a["groups"].add(g)
    return agg

M = merge(GROUPS)

# ---- 设计级状态映射（供应商单源，special cases 显式覆盖）----
# 默认：证据全 PASS -> PASS；任一 FAIL -> FAIL；证据目录即 source
# 指定 source 的优先级顺序（多组命中时取第一个非空）
SRC_PRIORITY = ["D4-23","D8-4","D4-27","D2-26","D2-11","D1-40","D4-13",
                "c4-service-realcloud","d4-security","d4-hooks","d4-extend",
                "d8-extend","d3-cloud","d3-sandbox","d3-scenario","d6-cache",
                "d9-remote","d9-ws","d2-auth","d1-upgrade","d1-extend","d1-cli","mcp-tools"]

def pick_src(groups):
    for s in SRC_PRIORITY:
        if s in groups:
            return s
    return sorted(groups)[0] if groups else None

def S(status, src=None, reason=""):
    return {"status": status, "src": src, "reason": reason}

DESIGN = {}
# 先按证据自动推导
for cid, a in M.items():
    DESIGN[cid] = S("FAIL" if a["fail"] else "PASS", pick_src(a["groups"]))

# 协议层（D9-protocol/protocol-probe.json）与评测（D10-eval/eval-run.csv）权威覆盖
DESIGN["D9-2"] = S("FAIL", "D9-protocol")            # D9-2b invalid-params 无 -32602
DESIGN["D9-4"] = S("PASS", "D9-protocol")            # lifecycle tools/list=40
DESIGN["D9-6"] = S("PASS", "D9-protocol")            # 10/10 clientInfo 互通
DESIGN["D9-9"] = S("SPEC-MISMATCH", "D9-protocol", "capabilities.notifications.cancellation 未声明")  # D9-9a
DESIGN["D10-3"] = S("FAIL", "D10-eval")              # 路由 HIT=3/14 (21.4%) < 90%
DESIGN["D10-4"] = S("PASS", "d2-auth")               # hook-tools + run_approved_command + 规则层 deny/allow

# 特殊：OS 专属 / 无证据 / 一次性限制
DESIGN["D1-39"] = S("NOT_RUN", None,
    "Windows 专属（升级检测链 EINVAL 语义），本机 Linux 无 .cmd/EINVAL；由展开级 EXP-NR3-10（P0）代表覆盖（d1-upgrade queryDistTagsSync-no-EINVAL PASS）")
DESIGN["D3-S4"] = S("BLOCKED", "d3-scenario-feasibility",
    "领券为一人一次，本账号已领取（huaweicloud_voucher_status=claimed=true），无法复跑 status→claim→status 闭环；status 步已实测返回 claimed=true")
DESIGN["D3-S6"] = S("NOT_RUN", None,
    "FunctionGraph 定时任务真云场景本轮未执行（收尾前工具调用上限中断，无证据落盘）；需真云最低配置创建→定时触发器绑定→测后删除归零")
DESIGN["D3-S7"] = S("NOT_RUN", None,
    "跨服务交付(Web应用+RDS)真云多服务编排本轮未执行（同上中断）；需先建库后部署+连接串注入+读写验证+测后归零")
DESIGN["D4-29"] = S("NOT_RUN", None,
    "classifyRawCommand 分类入口本轮未单独探测（d4-hooks 已覆盖 D4-25 遥测分类、d4-security 覆盖 D4-10 规则加载，D4-29 入口断言未跑）")
DESIGN["D9-5"] = S("NOT_RUN", None,
    "stdio 传输健壮专项本轮未执行（D9-protocol 探针已覆盖 D9-2/4/6/9，D9-5 未覆盖）")

# ---- 展开级状态 ----
C4_SERVICES = ['ECS','VPC','OBS','RDS','GaussDB','CCE','FunctionGraph','IAM','CTS','CES',
               'DDS','DCS','SMN','DMS','WAF','CDN','ModelArts','DEW','CBR','EVS','EIP','ELB']
C4_MAP = {svc: f"EXP-C4-{i:02d}" for i, svc in enumerate(C4_SERVICES, 1)}
c4res = {r["service"]: r.get("pass") for r in GROUPS["c4-service-matrix"]}

EXPANDED = {}
for svc, cid in C4_MAP.items():
    EXPANDED[cid] = S("PASS" if c4res.get(svc) else "FAIL", "c4-service-matrix")
EXPANDED["EXP-D5-8-1"] = S("PASS", "d1-upgrade")
EXPANDED["EXP-D5-8-3"] = S("PASS", "d1-upgrade")
for cid in ["EXP-NR3-02", "EXP-NR3-04", "EXP-NR3-10", "EXP-NR3-24"]:
    EXPANDED[cid] = S("PASS", "d1-upgrade")

# D10-eval 权威路由结论：HIT -> PASS, MISS -> FAIL, N/A -> NOT_RUN
EVAL_VERDICT = {
    "EXP-E01":"MISS","EXP-E02":"MISS","EXP-E03":"MISS","EXP-E04":"MISS","EXP-E05":"MISS",
    "EXP-E06":"HIT","EXP-E07":"MISS","EXP-E08":"N/A","EXP-E09":"HIT","EXP-E10":"MISS",
    "EXP-E11":"MISS","EXP-E12":"MISS","EXP-E13":"MISS","EXP-E14":"MISS","EXP-E15":"HIT",
}
for cid, v in EVAL_VERDICT.items():
    if v == "HIT":
        EXPANDED[cid] = S("PASS", "D10-eval")
    elif v == "N/A":
        EXPANDED[cid] = S("NOT_RUN", None,
            "诊断类意图(explain_error)不在 serviceCatalog 路由范围（harness 标记 N/A）；explain_error 工具路由需真实 LLM harness（serviceCatalog 路由层无法代理）")
    else:
        EXPANDED[cid] = S("FAIL", "D10-eval", "serviceCatalog 路由未命中期望服务（MISS）")

def backfill_csv(fname, status_map, cid_key="ID"):
    path = os.path.join(PACK, fname)
    rows = list(csv.DictReader(open(path, encoding="utf-8-sig")))
    fields = list(rows[0].keys())
    dist = defaultdict(int)
    missing = []
    for r in rows:
        cid = r[cid_key]
        st = status_map.get(cid)
        if st is None:
            missing.append(cid)
            r["执行状态"] = "NOT_RUN"
            r["blockedReason"] = "回填脚本未映射(无证据)"
            dist["NOT_RUN"] += 1
            continue
        r["执行状态"] = st["status"]
        if st["status"] in ("PASS", "FAIL", "SPEC-MISMATCH"):
            r["执行时间"] = TS
            r["evidencePath"] = f"evidence/{st['src']}"
            r["blockedReason"] = ""
        elif st["status"] == "BLOCKED":
            r["执行时间"] = TS
            r["evidencePath"] = f"evidence/{st['src']}" if st["src"] else ""
            r["blockedReason"] = st["reason"]
        else:  # NOT_RUN
            r["执行时间"] = ""
            r["evidencePath"] = ""
            r["blockedReason"] = st["reason"]
        dist[st["status"]] += 1
    w = csv.DictWriter(open(path, "w", encoding="utf-8-sig", newline=""), fieldnames=fields)
    w.writeheader()
    w.writerows(rows)
    print(f"[{fname}] {dict(dist)}")
    if missing:
        print(f"  [WARN] 未映射(标 NOT_RUN): {missing}")

print("=== 回填设计级 ===")
backfill_csv("用例矩阵-设计级.csv", DESIGN)
print("=== 回填展开级 ===")
backfill_csv("用例矩阵-展开级.csv", EXPANDED)

# 追踪表：回填「执行时间」列（仅 PASS/FAIL/SPEC-MISMATCH 关联行）
trace_path = os.path.join(PACK, "需求-设计-证据追踪表.csv")
trows = list(csv.DictReader(open(trace_path, encoding="utf-8-sig")))
tfields = list(trows[0].keys())
for r in trows:
    ecid = (r.get("expandedCaseId") or "").strip()
    did = (r.get("designCaseId") or "").strip()
    if ecid in EXPANDED and EXPANDED[ecid]["status"] in ("PASS","FAIL","SPEC-MISMATCH"):
        r["执行时间"] = TS
    elif did in DESIGN and DESIGN[did]["status"] in ("PASS","FAIL","SPEC-MISMATCH"):
        r["执行时间"] = TS
    else:
        r["执行时间"] = ""
tw = csv.DictWriter(open(trace_path, "w", encoding="utf-8-sig", newline=""), fieldnames=tfields)
tw.writeheader()
tw.writerows(trows)
print("[需求-设计-证据追踪表] 已回填执行时间（PASS/FAIL/SPEC 关联行）")

print("\n=== 非 PASS 汇总 ===")
for label, m in [("设计级", DESIGN), ("展开级", EXPANDED)]:
    for cid in sorted(m):
        if m[cid]["status"] != "PASS":
            print(f"  [{m[cid]['status']}] {label} {cid}: {(m[cid]['reason'] or m[cid]['src'] or '')[:90]}")
print("\n=== 完成 ===")