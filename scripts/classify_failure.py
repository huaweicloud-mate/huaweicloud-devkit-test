#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""失败签名分类器：把「人工逐台读 autopilot 的 result.output」变成确定性分类 + 处置分支。

八类签名（源自 2026-10-08 报告 §二「调度失败签名库」）：
  BALANCE_403         余额不足 403（machine-side，重发无用）
  MISSING_CREDENTIAL  模型凭证缺失 / 401 未认证
  SHIM_SECOND_EXIT    shim 秒退（initialize failed / gateway 未运行 / 0 token）
  PUSH_FAILED         push 失败（结果已落盘、差最后推送）
  TOOL_CALL_LIMIT     工具调用上限中断（completed 但收尾未做）
  FAKE_PASS           fake-pass 空壳探针（probe 硬编码 PASS / 零 stdout）
  DRIFT               执行偏离（跑了别的方向 / 未回填 results）
  EMPTY_RUN           空跑（读文档即退、零产出）

三类处置分支：
  resend          可自动重发对应触发语
  machine-alert   机器侧问题，重发无用，需人处理（充值 / 装凭证 / 修守护）
  manual          需人工判定（如 fake-pass 需复核证据）

用法：
  python scripts/classify_failure.py --text "..."              # 直接分类一段输出
  python scripts/classify_failure.py --file out.txt
  python scripts/classify_failure.py --autopilot 93cc06ab       # 拉该 autopilot 最近运行并分类
  python scripts/classify_failure.py --scan --limit 3           # 扫「每日测试-*」最近 3 次运行
  python scripts/classify_failure.py --scan --json

退出码：0 = 无 problem；1 = 有 problem（failed / 空跑 / fake-pass 等）。
"""

import argparse
import ast
import json
import re
import shutil
import subprocess
import sys
from datetime import datetime

# (签名, 中文名, 正则, 处置分支)  —— 顺序即优先级：先匹配先返回
RULES = [
    ("BALANCE_403", "余额不足 403",
     r"insufficient[_ ]?(balance|quota)|balance.*insufficient|\b402\b|403[^\n]{0,40}(balance|quota|余额)"
     r"|余额不足|欠费|欠款|充值", "machine-alert"),
    ("MISSING_CREDENTIAL", "模型凭证缺失 / 未认证",
     r"missing[_ ]?credential|credential.*(missing|not found|invalid)|api[_ ]?key.*(missing|invalid)"
     r"|unauthorized|\b401\b|token.*(expired|missing)|未认证|凭证.*(缺失|无效)", "machine-alert"),
    ("SHIM_SECOND_EXIT", "shim 秒退（初始化失败/守护未起）",
     r"initialize failed|process exited|spawn[^\n]{0,30}(ENOENT|ECONNREFUSED)|ECONNREFUSED[^\n]{0,30}gateway"
     r"|ACP|shim.*(exit|fail)", "machine-alert"),
    ("PUSH_FAILED", "push 失败（差最后推送）",
     r"(push|推送)[^\n]{0,40}(fail|reject|denied|403|refus)|failed to push|non-fast-forward"
     r"|remote:[^\n]{0,40}(Permission|denied)", "resend"),
    ("TOOL_CALL_LIMIT", "工具调用上限中断（收尾未做）",
     r"工具调用上限|(tool|call)[_ ]?(call[_ ]?)?limit|maximum number of (tool )?calls"
     r"|reached[^\n]{0,20}limit|max[_ ]?turns|轮数上限|步骤上限", "resend"),
    ("FAKE_PASS", "fake-pass 空壳探针",
     r"硬编码\s*PASS|hardcod[a-z]*\s*PASS|空壳探针|空壳\s*probe|stdout\s*(为)?空|零\s*stdout|no\s*stdout"
     r"|probe\s*without\s*output", "manual"),
    ("DRIFT", "执行偏离（未回填 results）",
     r"执行偏离|跑了别的方向|未回填|no results|未产出\s*results|跳过回填|只读文档|read.*doc.*exit", "resend"),
]

# 负向样例（回归断言用）：这些文本曾误报成 FAKE_PASS —— 门禁脚本名里含 "fake_pass" 但输出是「已通过」
FAKE_PASS_NEGATIVE = r"verify_no_fake_pass\.py"

SIG_LABEL = {s: lab for s, lab, _r, _a in RULES}
SIG_ACTION = {s: a for s, _l, _r, a in RULES}
SIG_LABEL["EMPTY_RUN"] = "空跑（零产出）"
SIG_ACTION["EMPTY_RUN"] = "resend"
SIG_LABEL["SKIPPED"] = "本次跳过"
SIG_ACTION["SKIPPED"] = "none"
SIG_LABEL["UNKNOWN_FAILED"] = "未分类失败"
SIG_ACTION["UNKNOWN_FAILED"] = "manual"


def RULES_ACTION(sig):
    """签名 → 处置分支（导出给调用方/单测用）。"""
    return SIG_ACTION.get(sig, "manual")

EMPTY_RUN_MAXLEN = 200      # completed 且输出短于此 → 判空跑
QUICK_EXIT_SEC = 90         # failed 且耗时短于此 → 判秒退
TIMEOUT_WINDOW = (800, 1000)  # failed 且耗时落在该秒区间 → 疑似超时/看门狗掐断（实测 900s 固定值）


def _iso(s):
    return datetime.fromisoformat(str(s).replace("Z", "+00:00"))


def duration_sec(run):
    try:
        return (_iso(run["completed_at"]) - _iso(run["triggered_at"])).total_seconds()
    except Exception:
        return None


def extract_text(run):
    """拼出用于匹配的文本：failure_reason + result.output（result 可能是 dict 或字符串化的 dict）。"""
    parts = [str(run.get("failure_reason") or "")]
    r = run.get("result")
    if isinstance(r, dict):
        parts.append(str(r.get("output") or ""))
    elif isinstance(r, str):
        txt = r
        try:
            d = ast.literal_eval(r)
            if isinstance(d, dict):
                txt = str(d.get("output") or "")
        except Exception:
            pass
        parts.append(txt)
    return "\n".join(p for p in parts if p)


def classify_text(text):
    """按规则分类一段文本，返回 (signature, label, action, evidence) 或 None。"""
    for sig, label, pat, action in RULES:
        m = re.search(pat, text, re.I)
        if m:
            lo = max(0, m.start() - 30)
            return sig, label, action, text[lo:m.end() + 40].replace("\n", " ")[:140]
    return None


def classify_run(run):
    """分类一条 run 记录。返回 dict。"""
    status = str(run.get("status") or "").lower()
    text = extract_text(run)
    dur = duration_sec(run)
    out = {"id": run.get("id"), "status": status, "duration_sec": dur,
           "triggered_at": run.get("triggered_at"), "source": run.get("source"),
           "failure_reason": str(run.get("failure_reason") or "")[:160]}

    if status == "skipped":
        out.update(signature="SKIPPED", label=SIG_LABEL["SKIPPED"], action="none", evidence="")
        return out

    hit = classify_text(text)
    if hit:
        sig, label, action, ev = hit
        out.update(signature=sig, label=label, action=action, evidence=ev)
        return out

    if status == "failed":
        if dur is not None and dur < QUICK_EXIT_SEC:
            out.update(signature="SHIM_SECOND_EXIT", label=SIG_LABEL["SHIM_SECOND_EXIT"],
                       action="machine-alert",
                       evidence="failed 且耗时 %.0fs < %ds（秒退特征）" % (dur, QUICK_EXIT_SEC))
        elif dur is not None and TIMEOUT_WINDOW[0] <= dur <= TIMEOUT_WINDOW[1]:
            out.update(signature="TIMEOUT_KILLED", label="疑似超时/看门狗掐断",
                       action="resend",
                       evidence="failed 且耗时 %.0fs 落在超时窗口 %s（重发通常可恢复）"
                                % (dur, list(TIMEOUT_WINDOW)))
        else:
            out.update(signature="UNKNOWN_FAILED", label=SIG_LABEL["UNKNOWN_FAILED"], action="manual",
                       evidence="failed 但未命中已知签名，需人工判")
        return out

    # completed 分支
    if len(text.strip()) < EMPTY_RUN_MAXLEN:
        out.update(signature="EMPTY_RUN", label=SIG_LABEL["EMPTY_RUN"], action="resend",
                   evidence="completed 但输出仅 %d 字符（零产出特征）" % len(text.strip()))
    else:
        out.update(signature=None, label="正常", action="none", evidence="")
    return out


# ------------------------- multica 取数 -------------------------

def _run_cli(args, timeout=120):
    exe = shutil.which("multica")
    if not exe:
        raise RuntimeError("找不到 multica CLI")
    p = subprocess.run([exe] + args, capture_output=True, timeout=timeout)
    return (p.stdout or b"").decode("utf-8", "ignore") + (p.stderr or b"").decode("utf-8", "ignore")


def _json_of(raw):
    i = raw.find("{")
    if i < 0:
        raise RuntimeError("无法从输出里取 JSON：%s" % raw.strip()[:200])
    obj, _ = json.JSONDecoder().raw_decode(raw[i:])
    return obj


def list_autopilots(filter_sub="每日测试"):
    raw = _run_cli(["autopilot", "list", "--output", "json"])
    data = _json_of(raw)
    items = data if isinstance(data, list) else (data.get("autopilots") or data.get("data") or [])
    res = []
    for a in items:
        title = str(a.get("title") or "")
        if filter_sub and filter_sub not in title:
            continue
        res.append({"id": a.get("id"), "title": title})
    return res


def fetch_runs(autopilot_id, limit=20):
    raw = _run_cli(["autopilot", "runs", autopilot_id, "--output", "json", "--limit", str(limit)])
    data = _json_of(raw)
    return data.get("runs") or data.get("data") or (data if isinstance(data, list) else [])


# ------------------------- 输出 -------------------------

def summarize(records):
    agg = {}
    for r in records:
        key = r["signature"] or "NORMAL"
        agg.setdefault(key, {"label": r["label"], "action": r["action"], "count": 0})
        agg[key]["count"] += 1
    return agg


def main() -> int:
    ap = argparse.ArgumentParser(description="失败签名分类器（八类签名 + 处置分支）")
    src = ap.add_mutually_exclusive_group(required=True)
    src.add_argument("--text", help="直接分类一段文本")
    src.add_argument("--file", help="从文件读取文本分类")
    src.add_argument("--autopilot", help="拉该 autopilot 最近运行并分类")
    src.add_argument("--scan", action="store_true", help="扫「每日测试-*」全部 autopilot 的最近运行")
    ap.add_argument("--limit", type=int, default=20, help="每个 autopilot 取最近 N 次运行（默认 20）")
    ap.add_argument("--filter", default="每日测试", help="--scan 的标题过滤子串（默认 每日测试）")
    ap.add_argument("--only-problems", action="store_true", help="只显示有问题的运行")
    ap.add_argument("--json", action="store_true", help="输出 JSON")
    args = ap.parse_args()

    records = []

    if args.text is not None or args.file is not None:
        text = args.text if args.text is not None else open(args.file, "r", encoding="utf-8", errors="ignore").read()
        hit = classify_text(text)
        if hit:
            sig, label, action, ev = hit
        else:
            sig, label, action, ev = ("EMPTY_RUN", SIG_LABEL["EMPTY_RUN"], "resend", "未命中规则且文本很短") \
                if len(text.strip()) < EMPTY_RUN_MAXLEN else (None, "正常", "none", "")
        records.append({"id": "(stdin)", "signature": sig, "label": label, "action": action,
                        "evidence": ev, "status": "-", "duration_sec": None, "source": "-"})
    else:
        targets = [{"id": args.autopilot, "title": args.autopilot}] if args.autopilot else list_autopilots(args.filter)
        if not targets:
            print("没有匹配的 autopilot（filter=%s）" % args.filter)
            return 1
        for t in targets:
            try:
                runs = fetch_runs(t["id"], args.limit)
            except Exception as e:
                records.append({"id": t["id"], "title": t["title"], "signature": "UNKNOWN_FAILED",
                                "label": "取数失败", "action": "manual", "evidence": str(e)[:120],
                                "status": "-", "duration_sec": None, "source": "-"})
                continue
            for r in runs:
                rec = classify_run(r)
                rec["title"] = t["title"]
                records.append(rec)

    problems = [r for r in records if r["signature"] not in (None, "SKIPPED")]

    if args.json:
        print(json.dumps({"total": len(records), "problems": len(problems),
                          "summary": summarize(records), "records": records},
                         ensure_ascii=False, indent=2))
    else:
        agg = summarize(records)
        print("== 失败签名汇总（扫描 %d 次运行）==" % len(records))
        for sig, v in sorted(agg.items(), key=lambda kv: -kv[1]["count"]):
            print("  %-18s %-28s %-14s ×%d" % (sig, v["label"], v["action"], v["count"]))
        print("\n== 明细（%s）==" % ("仅问题项" if args.only_problems else "全部"))
        for r in records:
            if args.only_problems and r["signature"] in (None, "SKIPPED"):
                continue
            dur = "%.0fs" % r["duration_sec"] if r.get("duration_sec") is not None else "-"
            print("  [%-16s] %-34s %-12s dur=%-6s %s" %
                  (r["signature"] or "NORMAL", str(r.get("title") or "")[:34], r["action"], dur,
                   (r.get("evidence") or "")[:80]))

    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
