#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""生成 per-case stdout.log (JSON) 供 backfill_daily.py 读取。
只读今日 fresh 执行产物，不执行任何 probe，无副作用。
来源优先级: 独立 per-case stdout.txt (最精确) > 分组 grouped stdout.log > eval/协议 harness。
"""
import os, json, csv, re, datetime

BASE = "/home/zhangshuang/devkit-test/Hermes/huaweicloud-devkit-test"
EVID = os.path.join(BASE, "results/Hermes/2026-09-29-113.44.143.91/Linux/evidence")
PKG = os.path.join(BASE, "results/Hermes/2026-09-29-113.44.143.91/Linux")
NOW = datetime.datetime.now().strftime("%Y%m%d%H%M%S")

# 今日 145 case ids
design_ids = [r['ID'] for r in csv.DictReader(open(os.path.join(PKG, '用例矩阵-设计级.csv'), encoding='utf-8-sig'))]
expand_ids = [r['ID'] for r in csv.DictReader(open(os.path.join(PKG, '用例矩阵-展开级.csv'), encoding='utf-8-sig'))]
ALL = design_ids + expand_ids

status_map = {}   # caseId -> (status, why)
why_map = {}
def put(cid, status, why=""):
    status_map[cid] = status
    if why and cid not in why_map:
        why_map[cid] = why

# ---------- 1. grouped probes -> design cases ----------
groups = ["d4-security", "d2-auth", "d1-upgrade", "mcp-tools"]
for g in groups:
    p = os.path.join(EVID, g, "stdout.log")
    if not os.path.isfile(p):
        continue
    try:
        d = json.load(open(p, encoding='utf-8'))
    except Exception as e:
        print(f"[WARN] {g}/stdout.log 解析失败: {e}")
        continue
    by_id = {}
    for r in d.get("results", []):
        cid = r.get("id")
        if not cid:
            continue
        by_id.setdefault(cid, []).append(r)
    for cid, items in by_id.items():
        fails = [r for r in items if not r.get("pass", False)]
        status = "FAIL" if fails else "PASS"
        why = " | ".join(sorted(set(r.get("name") or "" for r in fails))) if fails else "grouped probe all assertions pass"
        put(cid, status, why)

# ---------- 2. c4-service-matrix -> EXP-C4-01..22 ----------
c4p = os.path.join(EVID, "c4-service-matrix", "stdout.log")
if os.path.isfile(c4p):
    d = json.load(open(c4p, encoding='utf-8'))
    services = d.get("results", [])
    # services order == EXP-C4-01..22
    for i, r in enumerate(services, 1):
        cid = f"EXP-C4-{i:02d}"
        ok = bool(r.get("pass", False))
        put(cid, "PASS" if ok else "FAIL", r.get("service", "") + " list_operations " + ("ok" if ok else "fail"))

# ---------- 3. per-case stdout.txt -> status ----------
def parse_stdout_txt(path):
    if not os.path.isfile(path):
        return None
    txt = open(path, encoding='utf-8').read()
    m = re.search(r"RESULT:\s*(PASS|FAIL|BLOCKED|SPEC-MISMATCH|NOT_RUN)", txt)
    if m:
        return m.group(1)
    # 兼容 === CASE id status ===
    m2 = re.search(r"^===\s*\S+\s+(\S+)\s+(PASS|FAIL|BLOCKED|SPEC-MISMATCH|NOT_RUN)", txt, re.M)
    if m2:
        return m2.group(2)
    return None

# 优先读独立 per-case stdout.txt
for cid in ALL:
    txt_path = os.path.join(EVID, cid, "stdout.txt")
    st = parse_stdout_txt(txt_path)
    if st:
        # 提取 why（RESULT 行后括号说明 / 根因行）
        txt = open(txt_path, encoding='utf-8').read()
        why = ""
        mm = re.search(r"RESULT:\s*\S+\s*(.+)", txt)
        if mm:
            why = mm.group(1).strip()
        put(cid, st, why)

# ---------- 4. eval harness -> EXP-E01..15 ----------
evalp = os.path.join(EVID, "eval-harness.txt")
if os.path.isfile(evalp):
    txt = open(evalp, encoding='utf-8').read()
    for mm in re.finditer(r"(EXP-E\d+)\s*\|\s*(HIT|MISS|N/A)\s*\|", txt):
        cid, verdict = mm.group(1), mm.group(2)
        if verdict == "HIT":
            put(cid, "PASS", "中文意图命中目标服务")
        elif verdict == "MISS":
            put(cid, "FAIL", "中文意图未命中目标服务(miss); 根因 routeMap 英文-only")
        else:
            put(cid, "NOT_RUN", "诊断意图需真实 Agent 会话行为, 源码级 routeMap 无诊断映射")

# ---------- 5. EXP 派生映射 (EXP-D5-8-x, EXP-NR3-xx) ----------
EXP_DERIVE = {
    "EXP-D5-8-1": "D5-1",
    "EXP-D5-8-3": "D5-3",
    "EXP-NR3-02": "D1-27",
    "EXP-NR3-04": "D1-42",
    "EXP-NR3-10": "D1-39",
    "EXP-NR3-24": "D1-45",
}
for exp, src in EXP_DERIVE.items():
    if src in status_map and exp not in status_map:
        put(exp, status_map[src], why_map.get(src, ""))

# ---------- 6. 缺口的从 grouped 的 stdout.log (D9/D10 协议可能由 protocol-probe 覆盖) ----------
# protocol-probe.txt 覆盖 D9 协议用例
protp = os.path.join(EVID, "protocol-probe.txt")
if os.path.isfile(protp):
    ptxt = open(protp, encoding='utf-8').read()
    # 粗略: 有 D9-* 判定行
    for mm in re.finditer(r"(D9-\d+[a-z]?)\s*[:：]\s*(PASS|FAIL|SPEC-MISMATCH|BLOCKED)", ptxt):
        put(mm.group(1), mm.group(2), "")

# ---------- 写 per-case stdout.log ----------
missing = [c for c in ALL if c not in status_map]
written = 0
for cid, status in status_map.items():
    d = os.path.join(EVID, cid)
    os.makedirs(d, exist_ok=True)
    why = why_map.get(cid, "")
    out = {"status": status, "why": why[:300], "executedAt": NOW}
    with open(os.path.join(d, "stdout.log"), "w", encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False)
    written += 1

print(f"覆盖 {written} cases, 写入 stdout.log")
print(f"缺失 {len(missing)} cases:")
for m in missing:
    print("  ", m)
# 状态分布
from collections import Counter
dist = Counter(status_map.get(c, "MISSING") for c in ALL)
print("状态分布(全部 145):", dict(dist))