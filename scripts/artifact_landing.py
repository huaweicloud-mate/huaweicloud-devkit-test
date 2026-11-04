#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""产物落地校验：任务报「成功」≠ 产物真落地。

补 `classify_failure.py` 抓不到的**「假完成」**——2026-11-04 实测 OfficeAce 的 autopilot 每天报
`completed`、输出里甚至写着「已 push commit 597709259」，但该 commit 在仓库里**不存在**、
远端最新执行包还停在 2 天前。分类器只看任务状态/输出，这类情况完全抓不到。

判据（全部可追证）：
  * 任务侧：例行 autopilot 的 `last_run_at`（任务确实跑过）
  * 产物侧：`results/<客户端>/` 下最新执行包日期（产物确实落地）
  * 滞后 = 任务最后运行日 − 产物最新日；≥ 阈值即标记

退出码：0 = 无滞后（或未达阈值）；1 = 存在滞后项（配合 `--fail-on-lag`，可用于巡检门禁）。

依赖 multica CLI（故仅在维护者本机可算；CI 环境自动跳过 —— 与 `classify_failure` 同类）。

用法：
    python scripts/artifact_landing.py --scan
    python scripts/artifact_landing.py --scan --write-report
    python scripts/artifact_landing.py --scan --fail-on-lag 2      # 滞后 ≥2 天即退出码 1
"""

import argparse
import datetime
import io
import json
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.environ.get("HDK_TEST_REPO") or os.path.dirname(HERE)
RESULTS = os.path.join(REPO, "results")
SUMMARY_DIR = os.path.join(RESULTS, "Summary")
BEIJING = datetime.timezone(datetime.timedelta(hours=8))

ONESHOT = ("重发", "收尾", "重写", "重跑", "快进", "继续", "最后", "补测", "bugfix", "重试")
DATE_RE = re.compile(r"(\d{4}-\d{2}-\d{2})")
CLIENTS = ("Hermes", "DSH", "OpenCode", "WorkBuddy", "OfficeAce", "CodeArtsSpace",
           "Codearts IDE", "CodeArts CLI", "AtomCode", "Openclaw", "Codex")


def load_autopilots():
    """平台 autopilot 列表（真实结构 {"autopilots": [...]}）。"""
    cp = subprocess.run(["multica", "autopilot", "list", "--output", "json"],
                        capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=180)
    if cp.returncode != 0:
        raise RuntimeError("multica 取数失败: %s" % (cp.stderr or cp.stdout or "")[:160])
    d = json.loads(cp.stdout)
    if isinstance(d, list):
        return d
    return d.get("autopilots") or d.get("data") or []


def bj_date(ts):
    """UTC ISO → 北京日期。"""
    if not ts:
        return None
    try:
        return datetime.datetime.fromisoformat(str(ts).replace("Z", "+00:00")).astimezone(BEIJING).date()
    except Exception:
        return None


def machine_of(title):
    m = re.search(r"(testbot[0-9a-zA-Z\-]*)", title or "", re.I)
    return m.group(1) if m else "（未标注）"


def client_of(title):
    for c in CLIENTS:
        if c.lower() in (title or "").lower():
            return c
    return "（未识别）"


def routine_autopilots(aps, max_age_days=14):
    """筛出「例行任务」：标题不含一次性动词，且近期确实跑过。"""
    out = []
    today = datetime.datetime.now(BEIJING).date()
    for a in aps:
        t = a.get("title") or ""
        if "每日测试" not in t:
            continue
        if any(k in t for k in ONESHOT) or "v2迁移" in t:
            continue
        d = bj_date(a.get("last_run_at"))
        if d is None or (today - d).days > max_age_days:
            continue
        out.append(a)
    return out


def latest_pkg(client, results_dir=RESULTS):
    """results/ 下匹配该客户端目录的最新执行包日期 → (date, dirname)。"""
    if not os.path.isdir(results_dir) or client == "（未识别）":
        return None, None
    key = client.lower().replace(" ", "")
    dirs = [d for d in os.listdir(results_dir) if os.path.isdir(os.path.join(results_dir, d))]
    cands = [d for d in dirs if key and (key in d.lower().replace(" ", "") or d.lower().replace(" ", "") in key)]
    best = (None, None)
    for d in cands:
        sub = os.path.join(results_dir, d)
        try:
            entries = os.listdir(sub)
        except OSError:
            continue
        for e in entries:
            m = DATE_RE.match(e)
            if m and os.path.isdir(os.path.join(sub, e)):
                try:
                    day = datetime.date.fromisoformat(m.group(1))
                except ValueError:
                    continue
                if best[0] is None or day > best[0]:
                    best = (day, d)
    return best


def build_rows(aps, results_dir=RESULTS):
    """例行任务 → 落地核查行（纯函数，便于单测）。"""
    rows = []
    for a in routine_autopilots(aps):
        t = a.get("title") or ""
        d = bj_date(a.get("last_run_at"))
        client = client_of(t)
        pkg_day, pkg_dir = latest_pkg(client, results_dir)
        lag = (d - pkg_day).days if (pkg_day and d) else None
        rows.append({
            "machine": machine_of(t), "client": client, "title": t,
            "task_date": d, "task_status": a.get("last_run_status") or "—",
            "pkg_date": pkg_day, "pkg_dir": pkg_dir, "lag": lag,
            "verdict": "LANDED" if (lag is None or lag < 2) else "NOT_LANDED",
        })
    rows.sort(key=lambda r: (-(r["lag"] if r["lag"] is not None else -99), r["machine"]))
    return rows


def render_report(rows, date_str):
    L = ["# 产物落地校验（任务报成功 ≠ 产物落地）", "",
         "- 日期：%s ｜ 来源：`scripts/artifact_landing.py`（依赖 multica，维护者本机可算）" % date_str,
         "- 判据：滞后 = 任务最后运行日 − `results/<客户端>/` 最新包日；≥2 天记为 **未落地**", ""]
    bad = [r for r in rows if r["verdict"] == "NOT_LANDED"]
    L += ["| 机器 | 客户端 | 任务最后运行 | 任务状态 | 产物最新 | 滞后 | 判定 |",
          "| --- | --- | --- | --- | --- | --- | --- |"]
    for r in rows:
        L.append("| %s | %s | %s | %s | %s | %s | %s |"
                 % (r["machine"], r["client"], r["task_date"] or "—", r["task_status"],
                    r["pkg_date"] or "—", ("%d 天" % r["lag"]) if r["lag"] is not None else "—",
                    "⚠️ 未落地" if r["verdict"] == "NOT_LANDED" else "已落地"))
    L += ["", "## 结论", ""]
    if bad:
        L.append("**%d 项「任务在跑、产物滞后」**：" % len(bad))
        L += ["", "| 机器 | 客户端 | 滞后 | 任务状态 | 性质 |", "| --- | --- | --- | --- | --- |"]
        for r in bad:
            kind = "显性失败（分类器可抓）" if r["task_status"] != "completed" else "**隐性假完成（分类器抓不到）**"
            L.append("| %s | %s | %d 天 | %s | %s |" % (r["machine"], r["client"], r["lag"], r["task_status"], kind))
        L += ["", "> 处置：显性失败 → 修机器（充值/凭证/守护）；隐性假完成 → 派**自查任务**给对应客户端"
              "（维护者不代跑/代回填，属「客户端自主能力」维度的观察项）。"]
    else:
        L.append("未发现「任务在跑但产物滞后」的项。")
    L += ["", "> 只读校验，未改动平台或仓库任何状态。", ""]
    return "\n".join(L)


def main():
    ap = argparse.ArgumentParser(description="产物落地校验（任务报成功 ≠ 产物落地）")
    ap.add_argument("--scan", action="store_true", help="扫「每日测试-*」例行任务（必选）")
    ap.add_argument("--write-report", action="store_true", help="写入 results/Summary/产物落地-<日期>.md")
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--fail-on-lag", type=int, default=None, help="存在滞后 ≥ N 天的项时返回退出码 1")
    args = ap.parse_args()
    if not args.scan:
        ap.error("需要 --scan")

    try:
        aps = load_autopilots()
    except Exception as e:  # noqa: BLE001
        print("[BLOCKED] %s" % e)
        return 2

    rows = build_rows(aps)
    bad = [r for r in rows if r["verdict"] == "NOT_LANDED"]
    if args.json:
        print(json.dumps({"total": len(rows), "not_landed": len(bad),
                          "rows": [{k: (str(v) if isinstance(v, datetime.date) else v) for k, v in r.items()}
                                   for r in rows]}, ensure_ascii=False, indent=2))
    else:
        print("== 产物落地校验 ==  例行任务 %d ｜ 未落地 %d" % (len(rows), len(bad)))
        for r in rows:
            mark = "⚠️" if r["verdict"] == "NOT_LANDED" else "  "
            print("  %s %-28s %-14s 任务 %s(%s) ｜ 产物 %s ｜ 滞后 %s"
                  % (mark, r["machine"], r["client"], r["task_date"],
                     r["task_status"], r["pkg_date"],
                     ("%d天" % r["lag"]) if r["lag"] is not None else "—"))

    if args.write_report:
        date_str = datetime.datetime.now(BEIJING).strftime("%Y-%m-%d")
        os.makedirs(SUMMARY_DIR, exist_ok=True)
        out = os.path.join(SUMMARY_DIR, "产物落地-%s.md" % date_str)
        with io.open(out, "w", encoding="utf-8") as f:
            f.write(render_report(rows, date_str))
        print("报告已写入：%s" % out)

    if args.fail_on_lag is not None and any((r["lag"] or 0) >= args.fail_on_lag for r in bad):
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
