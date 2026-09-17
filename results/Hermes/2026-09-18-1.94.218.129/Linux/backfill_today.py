#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Hermes Linux 2026-09-18 daily test 回填脚本（一次性，幂等）。
执行状态 + evidencePath 回填：evidence 已由探针/协议/评测 harness 真实落盘。"""
import csv, json, os, datetime
from collections import defaultdict

REPO = "/home/testbot3/devkit-test/Hermes/huaweicloud-devkit-test"
DAY = "2026-09-18-1.94.218.129"
PACK = os.path.join(REPO, "results", "Hermes", DAY, "Linux")
EV = os.path.join(PACK, "evidence")
TS = datetime.datetime.now().strftime("%Y%m%d%H%M%S")

def load_group(name):
    p = os.path.join(EV, name, "stdout.log")
    if not os.path.isfile(p):
        return {}
    try:
        data = json.load(open(p, encoding="utf-8"))
    except Exception:
        return {}
    byid = defaultdict(list)
    for r in data.get("results", []):
        cid = r.get("id") or r.get("service")
        byid[cid].append(r)
    return byid

GROUPS = {
    "d4-security": load_group("d4-security"),
    "d2-auth": load_group("d2-auth"),
    "d1-upgrade": load_group("d1-upgrade"),
    "mcp-tools": load_group("mcp-tools"),
    "c4-service-matrix": load_group("c4-service-matrix"),
}

C4_SERVICES = ['ECS','VPC','OBS','RDS','GaussDB','CCE','FunctionGraph','IAM','CTS','CES',
               'DDS','DCS','SMN','DMS','WAF','CDN','ModelArts','DEW','CBR','EVS','EIP','ELB']
C4_MAP = {svc: f"EXP-C4-{i:02d}" for i, svc in enumerate(C4_SERVICES, 1)}

def S(status, src=None, reason=""):
    return {"status": status, "src": src, "reason": reason}

# ---- 设计级状态：first-group-wins + 覆盖 ----
DESIGN_STATUS = {}
for g in GROUPS:
    for cid in GROUPS[g]:
        if cid in DESIGN_STATUS:
            continue
        ok = all(r.get("pass") for r in GROUPS[g][cid])
        DESIGN_STATUS[cid] = S("PASS" if ok else "FAIL", g)

DESIGN_OVERRIDES = {
    "D1-39": S("NOT_RUN", None, "Windows 专属（升级检测链 EINVAL 语义），本机 Linux 无 .cmd/EINVAL；由展开级 EXP-NR3-10 代表覆盖（d1-upgrade queryDistTagsSync-no-EINVAL + 54 条通用断言 PASS）"),
    "D1-40": S("PASS", "self"),
    "D2-11": S("PASS", "self"),
    "D2-4":  S("FAIL", "d2-auth"),
    "D4-16": S("FAIL", "d4-security"),
    "D4-23": S("FAIL", "self"),
    "D4-27": S("FAIL", "self"),
    "D2-26": S("PASS", "self"),
    "D8-4":  S("FAIL", "self"),
    "D8-7":  S("PASS", "self"),
    "D4-13": S("PASS", "self"),
    "D9-2":  S("FAIL", "D9-protocol"),
    "D9-4":  S("PASS", "D9-protocol"),
    "D9-5":  S("PASS", "D9-protocol"),
    "D9-9":  S("SPEC-MISMATCH", "D9-protocol"),
    "D10-3": S("FAIL", "D10-eval"),
}
for k, v in DESIGN_OVERRIDES.items():
    DESIGN_STATUS[k] = v

# ---- 展开级状态 ----
EXPANDED_STATUS = {}
for svc, cid in C4_MAP.items():
    rs = GROUPS.get("c4-service-matrix", {}).get(svc, [])
    ok = bool(rs) and all(r.get("pass") for r in rs)
    EXPANDED_STATUS[cid] = S("PASS" if ok else "FAIL", "c4-service-matrix")

EXPANDED_STATUS["EXP-D5-8-1"] = S("PASS", "d1-upgrade")   # D5-1 core-tools
EXPANDED_STATUS["EXP-D5-8-3"] = S("PASS", "d1-upgrade")   # D5-3 tool-count
for cid in ["EXP-NR3-02", "EXP-NR3-04", "EXP-NR3-10", "EXP-NR3-24"]:
    EXPANDED_STATUS[cid] = S("PASS", "d1-upgrade")
for i in range(1, 6):
    EXPANDED_STATUS[f"EXP-D1-58-{i:02d}"] = S("PASS", "_probes")

EVAL_VERDICT = {
    "EXP-E01": "MISS", "EXP-E02": "MISS", "EXP-E03": "MISS", "EXP-E04": "MISS",
    "EXP-E05": "MISS", "EXP-E06": "HIT", "EXP-E07": "MISS", "EXP-E08": "N/A",
    "EXP-E09": "HIT", "EXP-E10": "MISS", "EXP-E11": "MISS", "EXP-E12": "MISS",
    "EXP-E13": "MISS", "EXP-E14": "MISS", "EXP-E15": "HIT",
}
for cid, v in EVAL_VERDICT.items():
    if v == "HIT":
        EXPANDED_STATUS[cid] = S("PASS", "D10-eval")
    elif v == "N/A":
        EXPANDED_STATUS[cid] = S("NOT_RUN", None, "诊断类意图(explain_error)不在 serviceCatalog 路由范围（harness 标记 N/A）；explain_error 工具路由需真实 LLM harness（serviceCatalog 路由层无法代理）")
    else:
        EXPANDED_STATUS[cid] = S("FAIL", "D10-eval")

def backfill_csv(fname, status_map, cid_key="ID"):
    path = os.path.join(PACK, fname)
    rows = list(csv.DictReader(open(path, encoding="utf-8-sig")))
    fields = list(rows[0].keys())
    dist = defaultdict(int)
    for r in rows:
        cid = r[cid_key]
        st = status_map.get(cid)
        if st is None:
            print(f"  [WARN] {fname} {cid} 无状态映射，标 BLOCKED")
            r["执行状态"] = "BLOCKED"
            r["blockedReason"] = "无静态可核对依据(回填脚本未覆盖)"
            dist["BLOCKED"] += 1
            continue
        r["执行状态"] = st["status"]
        r["执行时间"] = TS
        if st["status"] in ("PASS", "FAIL", "SPEC-MISMATCH"):
            src = st["src"]
            if not src or src == "self":
                src = cid
            r["evidencePath"] = f"evidence/{src}"
            r["blockedReason"] = ""
        elif st["status"] == "BLOCKED":
            r["evidencePath"] = ""
            r["blockedReason"] = st["reason"]
        else:
            r["evidencePath"] = ""
            r["blockedReason"] = st["reason"]
        dist[st["status"]] += 1
    w = csv.DictWriter(open(path, "w", encoding="utf-8-sig", newline=""), fieldnames=fields)
    w.writeheader()
    for r in rows:
        w.writerow(r)
    print(f"[{fname}] {dict(dist)}")

print("=== 回填设计级 ===")
backfill_csv("用例矩阵-设计级.csv", DESIGN_STATUS)
print("=== 回填展开级 ===")
backfill_csv("用例矩阵-展开级.csv", EXPANDED_STATUS)

# 追踪表：回填「执行时间」列（追踪表只有执行时间列，无执行状态）
trace_path = os.path.join(PACK, "需求-设计-证据追踪表.csv")
trows = list(csv.DictReader(open(trace_path, encoding="utf-8-sig")))
tfields = list(trows[0].keys())
for r in trows:
    ecid = (r.get("expandedCaseId") or "").strip()
    did = (r.get("designCaseId") or "").strip()
    if ecid in EXPANDED_STATUS and EXPANDED_STATUS[ecid]["status"] in ("PASS","FAIL","SPEC-MISMATCH"):
        r["执行时间"] = TS
    elif did in DESIGN_STATUS and DESIGN_STATUS[did]["status"] in ("PASS","FAIL","SPEC-MISMATCH"):
        r["执行时间"] = TS
    else:
        r["执行时间"] = ""
tw = csv.DictWriter(open(trace_path, "w", encoding="utf-8-sig", newline=""), fieldnames=tfields)
tw.writeheader()
tw.writerows(trows)
print(f"[需求-设计-证据追踪表] 已回填执行时间（PASS/FAIL/SPEC 关联行）")

print("\n=== 非 PASS 汇总 ===")
for label, m in [("设计级", DESIGN_STATUS), ("展开级", EXPANDED_STATUS)]:
    for cid, st in sorted(m.items()):
        if st["status"] != "PASS":
            print(f"  [{st['status']}] {label} {cid}: {(st['reason'] or st['src'] or '')[:80]}")
print("\n=== 完成 ===")