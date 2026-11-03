#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""失败自动处置（分诊 → 分支动作）。

把 `classify_failure.py` 的签名结果变成**处置计划**并按分支执行：
  resend          → 自动重发对应 autopilot 触发语（受限流保护）
  machine-alert   → 只产出机器侧告警条目（充值/装凭证/修守护，重发无用）
  manual          → 产出人工复核条目（如 fake-pass 需看证据）

安全默认：**默认 dry-run**（只出计划不触发）。真触发必须显式 `--live`。
防重复：台账 `metrics/remediation-ledger.csv` 限制「同一 autopilot 在窗口内最多重发 N 次」。

用法：
  python scripts/auto_remediator.py --scan --limit 2                    # dry-run：出处置计划
  python scripts/auto_remediator.py --scan --limit 2 --live --max-per-ap 1
  python scripts/auto_remediator.py --autopilot 93cc06ab --live
  python scripts/auto_remediator.py --scan --json

退出码：0 = 计划生成成功（dry-run 恒 0）；1 = 取数/执行期出现错误。
"""

import argparse
import csv
import importlib.util
import io
import json
import os
import subprocess
import sys
from datetime import datetime, timedelta, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
LEDGER_DEFAULT = os.path.join(os.path.dirname(HERE), "metrics", "remediation-ledger.csv")
LEDGER_HEADER = ["ts_utc", "autopilot_id", "title", "signature", "decision", "mode", "note"]

ACTION_MAP = {"resend": "resend", "machine-alert": "alert", "manual": "manual", "none": "none"}


def _load_classifier():
    spec = importlib.util.spec_from_file_location("classify_failure", os.path.join(HERE, "classify_failure.py"))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


cf = _load_classifier()


# --------------------------- 台账 ---------------------------

def load_ledger(path):
    if not os.path.isfile(path):
        return []
    with io.open(path, "r", encoding="utf-8-sig", newline="") as f:
        return [dict(r) for r in csv.DictReader(f)]


def recent_resends(ledger, autopilot_id, window_hours, now=None):
    now = now or datetime.now(timezone.utc)
    lo = now - timedelta(hours=window_hours)
    n = 0
    for r in ledger:
        if r.get("autopilot_id") != autopilot_id:
            continue
        if r.get("mode") != "live" or r.get("decision") != "execute":
            continue
        try:
            ts = datetime.fromisoformat(str(r["ts_utc"]).replace("Z", "+00:00"))
        except Exception:
            continue
        if ts >= lo:
            n += 1
    return n


def append_ledger(path, rows):
    if not rows:
        return
    new = not os.path.isfile(path)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with io.open(path, "a", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        if new:
            w.writerow(LEDGER_HEADER)
        for r in rows:
            w.writerow([r.get(k, "") for k in LEDGER_HEADER])


# --------------------------- 计划（纯函数，可单测） ---------------------------

def build_plan(records, ledger, max_per_ap=1, window_hours=12, now=None):
    """把分类结果变成处置计划。返回 [{autopilot_id,title,signature,action,decision,reason}]。

    decision:
      execute       - 允许执行（live 时真触发）
      skip_limited  - 命中限流（窗口内已重发过 N 次）
      alert_only    - 机器侧告警条目（不触发）
      manual        - 人工复核条目（不触发）
    """
    now = now or datetime.now(timezone.utc)
    plan = []
    seen_resend = set()
    for r in records:
        sig = r.get("signature")
        if sig in (None, "SKIPPED", "NORMAL"):
            continue
        act = cf.SIG_ACTION.get(sig, "manual")
        ap = r.get("autopilot_id") or r.get("id")
        entry = {"autopilot_id": ap, "title": r.get("title") or "", "signature": sig,
                 "action": act, "decision": "", "reason": ""}
        if act == "resend":
            used = recent_resends(ledger, ap, window_hours, now)
            planned = sum(1 for p in plan if p["autopilot_id"] == ap and p["decision"] == "execute")
            if (used + planned) >= max_per_ap:
                entry["decision"] = "skip_limited"
                entry["reason"] = "窗口 %dh 内已重发/计划重发 %d 次（上限 %d）" % (window_hours, used + planned, max_per_ap)
            else:
                entry["decision"] = "execute"
                entry["reason"] = "签名可重试，允许重发触发语"
        elif act == "machine-alert":
            entry["decision"] = "alert_only"
            entry["reason"] = "机器侧问题，重发无用（需充值/装凭证/修守护）"
        else:
            entry["decision"] = "manual"
            entry["reason"] = "需人工复核（如 fake-pass 需看证据）"
        plan.append(entry)
    return plan


# --------------------------- 执行 ---------------------------

def _multica_exe():
    from shutil import which
    return which("multica") or which("multica.exe")


def execute_plan(plan, live, timeout=120):
    exe = _multica_exe()
    results = []
    for p in plan:
        row = dict(p)
        if p["decision"] != "execute":
            row["result"] = "not-executed"
            results.append(row)
            continue
        if not live:
            row["result"] = "dry-run"
            results.append(row)
            continue
        if not exe:
            row["result"] = "error: multica not found"
            results.append(row)
            continue
        try:
            cp = subprocess.run([exe, "autopilot", "trigger", p["autopilot_id"], "--output", "json"],
                                capture_output=True, timeout=timeout)
            out = (cp.stdout or b"").decode("utf-8", "ignore") + (cp.stderr or b"").decode("utf-8", "ignore")
            row["result"] = "triggered" if cp.returncode == 0 else "trigger-failed: %s" % out.strip()[:120]
        except Exception as e:
            row["result"] = "error: %s" % str(e)[:120]
        results.append(row)
    return results


def build_alert_report(results, date_str):
    lines = ["# 失败处置计划与执行结果", "",
             "- 日期：%s ｜ 模式：%s" % (date_str, "LIVE（真触发）" if any(r.get("result") == "triggered" for r in results) else "DRY-RUN（仅计划）"),
             "- 来源：scripts/auto_remediator.py（签名由 classify_failure.py 判定）", ""]
    groups = {}
    for r in results:
        groups.setdefault(r["signature"], []).append(r)
    for sig, rows in sorted(groups.items(), key=lambda kv: -len(kv[1])):
        lines.append("## %s（%d）" % (sig, len(rows)))
        lines.append("")
        lines.append("| autopilot | 处置 | 执行结果 | 依据 |")
        lines.append("| --- | --- | --- | --- |")
        for r in rows:
            lines.append("| %s | %s | %s | %s |" % (r.get("title") or r["autopilot_id"], r["decision"],
                                                    r.get("result", ""), r["reason"]))
        lines.append("")
    return "\n".join(lines)


def main() -> int:
    ap = argparse.ArgumentParser(description="失败自动处置（分诊 → 分支动作）")
    src = ap.add_mutually_exclusive_group(required=True)
    src.add_argument("--scan", action="store_true", help="扫「每日测试-*」全部 autopilot")
    src.add_argument("--autopilot", help="单个 autopilot id")
    ap.add_argument("--limit", type=int, default=2, help="每个 autopilot 取最近 N 次运行")
    ap.add_argument("--filter", default="每日测试", help="--scan 标题过滤子串")
    ap.add_argument("--live", action="store_true", help="真触发重发（默认 dry-run）")
    ap.add_argument("--max-per-ap", type=int, default=1, help="窗口内同一 autopilot 最多重发次数（默认 1）")
    ap.add_argument("--window-hours", type=int, default=12, help="限流窗口小时数（默认 12）")
    ap.add_argument("--ledger", default=LEDGER_DEFAULT, help="处置台账 CSV 路径")
    ap.add_argument("--write-report", action="store_true", help="把处置计划写入 results/Summary/")
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()

    # 1) 取数 + 分类（复用 classify_failure）
    records = []
    targets = [{"id": args.autopilot, "title": args.autopilot}] if args.autopilot else cf.list_autopilots(args.filter)
    if not targets:
        print("没有匹配的 autopilot（filter=%s）" % args.filter)
        return 1
    for t in targets:
        try:
            runs = cf.fetch_runs(t["id"], args.limit)
        except Exception as e:
            print("取数失败 %s: %s" % (t["id"], e), file=sys.stderr)
            continue
        for run in runs:
            rec = cf.classify_run(run)
            rec["title"] = t["title"]
            rec["autopilot_id"] = t["id"]
            records.append(rec)

    # 2) 计划（纯函数）
    ledger = load_ledger(args.ledger)
    plan = build_plan(records, ledger, args.max_per_ap, args.window_hours)

    # 3) 执行
    results = execute_plan(plan, args.live)

    # 4) 落台账（只记 live 的真实触发/失败）
    if args.live:
        now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        append_ledger(args.ledger, [{
            "ts_utc": now, "autopilot_id": r["autopilot_id"], "title": r["title"],
            "signature": r["signature"], "decision": r["decision"], "mode": "live",
            "note": r.get("result", ""),
        } for r in results])

    # 5) 输出
    if args.json:
        print(json.dumps({"mode": "live" if args.live else "dry-run", "planned": len(plan), "results": results},
                         ensure_ascii=False, indent=2))
    else:
        print("== 失败处置（%s）==" % ("LIVE" if args.live else "DRY-RUN"))
        if not results:
            print("  无需要处置的项")
        for r in results:
            print("  [%-12s] %-34s %-14s %s" % (r["decision"], (r["title"] or r["autopilot_id"])[:34],
                                                r.get("result", ""), r["reason"][:60]))

    if args.write_report:
        date_str = datetime.now().strftime("%Y-%m-%d")
        out = os.path.join(os.path.dirname(HERE), "results", "Summary", "失败处置-%s.md" % date_str)
        os.makedirs(os.path.dirname(out), exist_ok=True)
        with io.open(out, "w", encoding="utf-8") as f:
            f.write(build_alert_report(results, date_str))
        print("报告已写入：%s" % out)

    return 0


if __name__ == "__main__":
    sys.exit(main())
