#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""将 grouped 探针 stdout.log 展开为 per-case evidence/<case-id>/stdout.log（供 backfill_daily.py 读取）。
不执行任何 probe，只读已有 grouped stdout.log 结果，机器可读落盘。
"""
import os, json, datetime

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EVID = "results/Hermes/2026-09-28-113.44.143.91/Linux/evidence"
GROUPS = ["d4-security", "d2-auth", "d1-upgrade", "mcp-tools", "c4-service-matrix"]
NOW = datetime.datetime.now().strftime("%Y%m%d%H%M%S")

def main():
    cases = {}  # caseId -> list of (groupId, result)
    for g in GROUPS:
        p = os.path.join(REPO, EVID, g, "stdout.log")
        if not os.path.isfile(p):
            continue
        data = json.load(open(p, encoding="utf-8"))
        for r in data.get("results", []):
            cid = r.get("id")
            if not cid:
                continue
            cases.setdefault(cid, []).append((g, r))

    written = 0
    for cid, entries in cases.items():
        # 任一断言失败即 FAIL；否则 PASS
        fails = [r for _, r in entries if not r.get("pass")]
        if fails:
            status = "FAIL"
            why = " | ".join(f"{r.get('name')}" for r in fails)
        else:
            status = "PASS"
            why = "grouped probe all assertions pass"
        d = os.path.join(REPO, EVID, cid)
        os.makedirs(d, exist_ok=True)
        out = {"status": status, "why": why[:200], "executedAt": NOW}
        with open(os.path.join(d, "stdout.log"), "w", encoding="utf-8") as f:
            json.dump(out, f, ensure_ascii=False)
        written += 1
    print(f"expanded {written} per-case stdout.log from {len(GROUPS)} grouped probes")

if __name__ == "__main__":
    main()