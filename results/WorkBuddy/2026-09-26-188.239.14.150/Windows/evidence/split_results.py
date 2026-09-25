#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Split grouped probe stdout.log results into per-case evidence/<case-id>/stdout.log files.
Merge logic: if a case appears in multiple probes, FAIL takes priority over PASS.
"""
import json
import os
import shutil
from pathlib import Path

ev_dir = Path(__file__).parent

grouped = ["d4-security", "d2-auth", "d1-upgrade", "mcp-tools", "c4-service-matrix"]

now_compact = "20260926051000"

# Collect all results, merging by case ID (FAIL wins)
merged = {}  # case_id -> {pass, group, name, actual, expected, failMsg/passMsg}
for group in grouped:
    log = ev_dir / group / "stdout.log"
    if not log.exists():
        print(f"[skip] {group}/stdout.log not found")
        continue
    with open(log, encoding="utf-8") as f:
        data = json.load(f)
    results = data.get("results", data) if isinstance(data, dict) else data
    for r in results:
        case_id = r.get("id", "").strip()
        if not case_id:
            continue
        is_pass = r.get("pass", False)
        # Merge: FAIL wins
        if case_id in merged:
            if not is_pass:
                # Override with FAIL
                merged[case_id] = {
                    "pass": False,
                    "group": group,
                    "name": r.get("name", ""),
                    "actual": str(r.get("actual", ""))[:200],
                    "expected": str(r.get("expected", ""))[:200],
                    "why": r.get("failMsg", ""),
                }
            # If existing is FAIL, keep it; if both PASS, keep first
        else:
            merged[case_id] = {
                "pass": is_pass,
                "group": group,
                "name": r.get("name", ""),
                "actual": str(r.get("actual", ""))[:200],
                "expected": str(r.get("expected", ""))[:200],
                "why": r.get("failMsg", "") if not is_pass else "",
            }
    print(f"[scan] {group}: {len(results)} entries")

# Write per-case logs
for case_id, info in merged.items():
    case_dir = ev_dir / case_id
    case_dir.mkdir(parents=True, exist_ok=True)
    # Copy probe.mjs from source group if not present
    probe_src = ev_dir / info["group"] / "probe.mjs"
    if probe_src.exists():
        dst = case_dir / "probe.mjs"
        if not dst.exists():
            shutil.copy2(probe_src, dst)
    status = "PASS" if info["pass"] else "FAIL"
    entry = {
        "status": status,
        "executedAt": now_compact,
        "group": info["group"],
        "name": info["name"],
        "actual": info["actual"],
        "expected": info["expected"],
    }
    if status == "FAIL":
        entry["why"] = info["why"]
    with open(case_dir / "stdout.log", "w", encoding="utf-8") as f:
        json.dump(entry, f, ensure_ascii=False)

print(f"[done] Split {len(merged)} unique cases (merged FAIL-wins)")
