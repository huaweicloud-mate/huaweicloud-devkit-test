#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""派发 / 开工前置探活（preflight probe）。

用途：在每日测试派发前（或客户端 agent 开工第一步）探活三类前置，任一类不可用即
**提前暴露**，避免「空跑一轮、次日汇总才发现余额 / 凭证断了」。

探针：
  P1 credential_file  ~/.config/huaweicloud/credentials.json 存在且含 ak/sk/region（只报是否齐全，不打印密钥）
  P2 cloud_identity   hcloud STS GetCallerIdentity  → 凭证有效 + 网络可达（最轻量只读调用）
  P3 account_balance  hcloud BSS ShowCustomerAccountBalances（全局服务，region 固定 cn-north-1）→ 余额 / 欠费

退出码：
  0 = 全部 OK
  1 = 有 WARN（如余额低于阈值）
  2 = 有 FAIL（凭证 / 网络 / CLI 不可用）

用法：
  python scripts/preflight_probe.py
  python scripts/preflight_probe.py --json
  python scripts/preflight_probe.py --region cn-north-4 --balance-threshold 1
  python scripts/preflight_probe.py --skip-balance          # 跳过余额探针（无 BSS 权限时）
  python scripts/preflight_probe.py --cred ~/.config/huaweicloud/credentials.readonly.json

判定纪律（hcloud 坑）：
  * hcloud 退出码**永远为 0**（连参数错 / 权限错也是）→ 判成败必须解析输出文本。
  * 输出可能带 UTF-8 BOM，且前面有「可执行 hcloud update ...」提示行 → 从第一个 '{' 起解析。
"""

import argparse
import json
import os
import shutil
import subprocess
import sys
from datetime import datetime

BSS_REGION = "cn-north-1"  # BSS 是全局服务，用 cn-north-4 会报「cli-region的值不支持」
ERROR_MARKERS = ("[USE_ERROR]", "OPENAPI_ERROR", "[错误码]", "缺少必填", "APIGW.", "not found")


def now_str() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def run_cmd(cmd, timeout=90):
    """跑一条命令，返回 (rc, stdout+stderr 文本)。rc 不可信，仅作参考。"""
    try:
        p = subprocess.run(cmd, capture_output=True, timeout=timeout, shell=False)
        out = (p.stdout or b"").decode("utf-8", "ignore") + (p.stderr or b"").decode("utf-8", "ignore")
        return p.returncode, out
    except FileNotFoundError:
        return 127, "command not found: %s" % cmd[0]
    except subprocess.TimeoutExpired:
        return 124, "timeout after %ss" % timeout


def looks_error(out: str) -> str:
    """返回命中的错误标记，未命中返回空串。"""
    for m in ERROR_MARKERS:
        if m in out:
            return m
    return ""


def parse_json(out: str):
    """从 hcloud 输出里抠第一个 JSON 对象（跳过 BOM / 前置提示行 / 尾部附加文本）。失败返回 None。"""
    i = out.find("{")
    if i < 0:
        return None
    try:
        obj, _ = json.JSONDecoder().raw_decode(out[i:])
        return obj
    except Exception:
        return None


# ----------------------------- 探针 -----------------------------

def probe_credential_file(path: str) -> dict:
    p = os.path.expanduser(path)
    if not os.path.isfile(p):
        return {"name": "credential_file", "status": "FAIL",
                "detail": "凭证文件不存在：%s" % p}
    try:
        with open(p, "r", encoding="utf-8-sig") as f:
            d = json.load(f)
    except Exception as e:
        return {"name": "credential_file", "status": "FAIL",
                "detail": "凭证文件无法解析：%s" % e}
    missing = [k for k in ("ak", "sk", "region") if not str(d.get(k) or "").strip()]
    if missing:
        return {"name": "credential_file", "status": "FAIL",
                "detail": "凭证缺少字段：%s（不打印值）" % ",".join(missing)}
    extra = []
    if str(d.get("securityToken") or "").strip():
        extra.append("含 securityToken")
    if d.get("configuredBySession"):
        extra.append("configuredBySession=true")
    return {"name": "credential_file", "status": "OK",
            "detail": "%s（ak/sk/region 齐全%s）" % (p, "，" + "/".join(extra) if extra else "")}


def probe_cloud_identity(region: str, hcloud: str) -> dict:
    rc, out = run_cmd([hcloud, "STS", "GetCallerIdentity", "--cli-region=" + region])
    err = looks_error(out)
    data = parse_json(out)
    if err or not isinstance(data, dict) or not data.get("account_id"):
        return {"name": "cloud_identity", "status": "FAIL",
                "detail": "STS GetCallerIdentity 失败（region=%s）：%s" % (region, (out.strip().splitlines() or ["无输出"])[0][:160])}
    urn = str(data.get("principal_urn") or "")
    user = urn.split("user:")[-1] if "user:" in urn else urn
    return {"name": "cloud_identity", "status": "OK",
            "detail": "%s @ %s（account_id=%s）" % (user or "?", region, data.get("account_id"))}


def probe_balance(threshold: float, hcloud: str) -> dict:
    rc, out = run_cmd([hcloud, "BSS", "ShowCustomerAccountBalances", "--cli-region=" + BSS_REGION])
    err = looks_error(out)
    data = parse_json(out)
    if err or not isinstance(data, dict) or "account_balances" not in data:
        return {"name": "account_balance", "status": "WARN",
                "detail": "余额查询不可用（region=%s）：%s —— 若账号无 BSS 只读权限可加 --skip-balance"
                          % (BSS_REGION, (out.strip().splitlines() or ["无输出"])[0][:140])}
    rows = data.get("account_balances") or []
    main = [r for r in rows if int(r.get("account_type") or 0) == 1] or rows
    if not main:
        return {"name": "account_balance", "status": "WARN", "detail": "余额返回为空"}
    r = main[0]
    amount = float(r.get("amount") or 0)
    cur = r.get("currency") or "CNY"
    status = "WARN" if amount < threshold else "OK"
    return {"name": "account_balance", "status": status, "amount": amount, "currency": cur,
            "detail": "%s %.2f（阈值 %.2f）%s" % (cur, amount, threshold,
                                                 "← 低于阈值，真云用例前请充值" if status == "WARN" else "")}


# ----------------------------- 主流程 -----------------------------

def main() -> int:
    ap = argparse.ArgumentParser(description="每日测试前置探活（凭证 / 云端身份 / 余额）")
    ap.add_argument("--region", default="cn-north-4", help="探活用区域（默认 cn-north-4）")
    ap.add_argument("--cred", default="~/.config/huaweicloud/credentials.json", help="凭证文件路径")
    ap.add_argument("--balance-threshold", type=float, default=1.0, help="余额告警阈值（默认 1.0）")
    ap.add_argument("--skip-balance", action="store_true", help="跳过余额探针")
    ap.add_argument("--json", action="store_true", help="输出 JSON")
    args = ap.parse_args()

    hcloud = shutil.which("hcloud") or shutil.which("hcloud.exe")
    probes = [probe_credential_file(args.cred)]

    if not hcloud:
        probes.append({"name": "cloud_identity", "status": "FAIL",
                       "detail": "找不到 hcloud（KooCLI），无法探活云端"})
        if not args.skip_balance:
            probes.append({"name": "account_balance", "status": "SKIP", "detail": "hcloud 不可用"})
    else:
        probes.append(probe_cloud_identity(args.region, hcloud))
        if args.skip_balance:
            probes.append({"name": "account_balance", "status": "SKIP", "detail": "按 --skip-balance 跳过"})
        else:
            probes.append(probe_balance(args.balance_threshold, hcloud))

    n_ok = sum(1 for p in probes if p["status"] == "OK")
    n_warn = sum(1 for p in probes if p["status"] == "WARN")
    n_fail = sum(1 for p in probes if p["status"] == "FAIL")
    conclusion = "FAIL" if n_fail else ("WARN" if n_warn else "OK")

    result = {
        "ts": now_str(),
        "region": args.region,
        "balance_threshold": args.balance_threshold,
        "hcloud": hcloud or "",
        "probes": probes,
        "summary": {"ok": n_ok, "warn": n_warn, "fail": n_fail},
        "conclusion": conclusion,
    }

    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print("[preflight] %s（北京时间）" % result["ts"])
        for p in probes:
            print("  [%-4s] %-18s %s" % (p["status"], p["name"], p["detail"]))
        print("结论：%s（ok %d / warn %d / fail %d）" % (conclusion, n_ok, n_warn, n_fail))
        if conclusion == "FAIL":
            print("提示：FAIL 项未解除前，本轮派发/执行不要开始（避免空跑一轮）。")

    return {"OK": 0, "WARN": 1, "FAIL": 2}[conclusion]


if __name__ == "__main__":
    sys.exit(main())
