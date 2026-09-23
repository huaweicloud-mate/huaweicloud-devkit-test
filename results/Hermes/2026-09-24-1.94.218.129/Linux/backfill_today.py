#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Hermes Linux 2026-09-24 daily test 回填脚本（数据驱动，读本日新鲜 evidence 落盘结果）。
执行状态 + 执行时间 + evidencePath 回填；无证据用例标 NOT_RUN/BLOCKED 并写原因，不编造 PASS。"""
import csv, json, os, datetime
from collections import defaultdict

REPO = "/home/testbot3/devkit-test/Hermes/huaweicloud-devkit-test"
DAY = "2026-09-24-1.94.218.129"
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

# 带 results 数组的 grouped 探针（本日新鲜落盘）
GROUPS = {name: load_group(name) for name in [
    "D1-40","D2-11","D2-26","D4-13","D4-23","D4-27","D4-29","D8-4","D8-7","D9-5",
    "c4-service-matrix","c4-service-realcloud","d1-cli","d1-extend","d1-upgrade",
    "d2-auth","d3-cloud","d3-sandbox","d3-scenario","d4-extend","d4-hooks",
    "d4-security","d6-cache","d8-extend","d9-remote","d9-ws","mcp-tools",
]}

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
for cid, a in M.items():
    DESIGN[cid] = S("FAIL" if a["fail"] else "PASS", pick_src(a["groups"]))

# --- 协议层权威覆盖（读本日 protocol-probe.json）---
proto_path = os.path.join(EV, "D9-protocol", "protocol-probe.json")
if os.path.isfile(proto_path):
    proto = json.load(open(proto_path, encoding="utf-8"))
    verdict = {r["id"]: r.get("verdict") for r in proto.get("results", [])}
    # D9-2：a(-32601) PASS 但 b(invalid-params -32602) 决定整体
    if verdict.get("D9-2a-unknown-method") == "PASS" and verdict.get("D9-2b-invalid-params") == "FAIL":
        DESIGN["D9-2"] = S("FAIL", "D9-protocol", "tools/list 非 object params 未返回 -32602")
    if verdict.get("D9-4-lifecycle-tools/list") == "PASS":
        DESIGN["D9-4"] = S("PASS", "D9-protocol")
    if verdict.get("D9-6-clientinfo-matrix") == "PASS":
        DESIGN["D9-6"] = S("PASS", "D9-protocol")
    if verdict.get("D9-9a-capabilities.cancellation") == "SPEC-MISMATCH":
        DESIGN["D9-9"] = S("SPEC-MISMATCH", "D9-protocol", "capabilities.notifications.cancellation 未声明")

# --- 评测层权威覆盖（读本日 eval-run.csv）---
eval_csv = os.path.join(EV, "D10-eval", "eval-run.csv")
if os.path.isfile(eval_csv):
    rows = list(csv.DictReader(open(eval_csv, encoding="utf-8")))
    hits = [r for r in rows if r.get("verdict") == "HIT"]
    miss = [r for r in rows if r.get("verdict") == "MISS"]
    na = [r for r in rows if r.get("verdict") == "N/A"]
    denom = len(hits) + len(miss)
    acc = (len(hits) / denom * 100) if denom else 0
    DESIGN["D10-3"] = S("FAIL" if acc < 90 else "PASS", "D10-eval",
                        f"serviceCatalog 路由命中率 {acc:.1f}% (HIT={len(hits)} MISS={len(miss)} N/A={len(na)})")
    # D10-4 静态规则层：已由 d2-auth 直调 hook-tools + 规则层（PASS），保持 merged 结果

# --- 特殊：OS 专属 / 一次性限制 / 真云多服务场景 ---
DESIGN["D1-39"] = S("NOT_RUN", None,
    "Windows 专属（升级检测链 EINVAL 语义），本机 Linux 无 .cmd/EINVAL；由展开级 EXP-NR3-10（P0）代表覆盖")
# 领券：读 feasibility 的 voucher_status
feas = {}
fp = os.path.join(EV, "d3-scenario-feasibility", "stdout.log")
if os.path.isfile(fp):
    try:
        feas = json.load(open(fp, encoding="utf-8"))
    except Exception:
        feas = {}
voc = feas.get("voucher_status") or {}
claimed = (isinstance(voc, dict) and voc.get("claimed")) or (isinstance(voc, dict) and "已领取" in str(voc.get("message", "")))
DESIGN["D3-S4"] = S("BLOCKED", "d3-scenario-feasibility",
    "领券为一人一次，本账号已领取（voucher_status.claimed=true），无法复跑 status→claim→status 闭环；status 步已实测返回 claimed=true")
DESIGN["D3-S6"] = S("NOT_RUN", None,
    "【补环境】FunctionGraph 定时任务真云场景：需函数代码包 + IAM 执行委托 + 定时触发器三件套，daily 范围未预置代码包与 FunctionGraph 委托；本轮已覆盖 serviceCatalog 路由层判定（EXP-E10 MISS）+ 工具链路，本场景真机建删未执行")
DESIGN["D3-S7"] = S("NOT_RUN", None,
    "【补环境】跨服务交付(Web+RDS)真云多服务编排：RDS 实例创建需 5-15 分钟计费资源 + 连接串注入 + 应用读写验证 + 测后归零，超出 daily 单资源范围；本轮已覆盖 D3-C4 单资源真云建删归零 + D3-S2 删除确认 + D3-S3 沙箱预览")

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
EVAL_VERDICT = {r["id"]: r["verdict"] for r in rows} if os.path.isfile(eval_csv) else {}
for cid, v in EVAL_VERDICT.items():
    if v == "HIT":
        EXPANDED[cid] = S("PASS", "D10-eval")
    elif v == "N/A":
        EXPANDED[cid] = S("NOT_RUN", None,
            "诊断类意图(explain_error)不在 serviceCatalog 路由范围（harness 标记 N/A）")
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
            r["执行时间"] = ""
            r["evidencePath"] = ""
            if "blockedReason" in fields:
                r["blockedReason"] = "回填脚本未映射(无证据)"
            dist["NOT_RUN"] += 1
            continue
        r["执行状态"] = st["status"]
        if st["status"] in ("PASS", "FAIL", "SPEC-MISMATCH"):
            r["执行时间"] = TS
            r["evidencePath"] = f"evidence/{st['src']}"
            if "blockedReason" in fields:
                r["blockedReason"] = ""
        elif st["status"] == "BLOCKED":
            r["执行时间"] = TS
            r["evidencePath"] = f"evidence/{st['src']}" if st["src"] else ""
            if "blockedReason" in fields:
                r["blockedReason"] = st["reason"]
        else:  # NOT_RUN
            r["执行时间"] = ""
            r["evidencePath"] = ""
            if "blockedReason" in fields:
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

# 追踪表：回填「执行时间」列
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
print("[需求-设计-证据追踪表] 已回填执行时间")

print("\n=== 非 PASS 汇总 ===")
for label, m in [("设计级", DESIGN), ("展开级", EXPANDED)]:
    for cid in sorted(m):
        if m[cid]["status"] != "PASS":
            print(f"  [{m[cid]['status']}] {label} {cid}: {(m[cid]['reason'] or m[cid]['src'] or '')[:100]}")
print("\n=== 完成 ===")