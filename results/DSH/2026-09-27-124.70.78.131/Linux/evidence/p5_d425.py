#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# D4-25 Python hook 事件遥测分类 — 真实直调 record_cli_event，输出路径重定向到临时目录
import importlib.util
import json
import os
import sys
import tempfile
import time
from pathlib import Path

HOOK = "/home/testbot2/nodejs/lib/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/hooks/huaweicloud-safety.py"
EV = sys.argv[1] if len(sys.argv) > 1 else "."

spec = importlib.util.spec_from_file_location("huaweicloud_safety", HOOK)
hs = importlib.util.module_from_spec(spec)
spec.loader.exec_module(hs)

# 重定向 hook-events.jsonl 到临时目录，避免污染安装包
tmpdir = Path(tempfile.mkdtemp(prefix="hdktest-d425-"))
hs.HOOK_EVENTS_PATH = tmpdir / "hook-events.jsonl"

checks = []

def record(text, expected_key):
    hs.record_cli_event(text)
    events = []
    if hs.HOOK_EVENTS_PATH.exists():
        events = [json.loads(l) for l in hs.HOOK_EVENTS_PATH.read_text(encoding="utf-8").splitlines() if l.strip()]
    # 取最后一条（本次 record 产生的）
    key = events[-1]["key"] if events else None
    ok = key == expected_key
    checks.append((f"record_cli_event({text!r}) -> {expected_key}", ok, f"actual={key}, events={json.dumps(events, ensure_ascii=False)[:200]}"))
    return key

# 只读命令 → cli:read
record("hcloud ECS ListServersDetails --cli-region=cn-north-4", "cli:read")
# 写命令 → cli:write（关键断言：WRITE_OPERATION_RE 对「VPC CreateVpc」应命中）
record("hcloud VPC CreateVpc --vpc.name=x", "cli:write")
# 非 hcloud 命令 → 不记录（无事件）
events_before = hs.HOOK_EVENTS_PATH.read_text(encoding="utf-8").splitlines() if hs.HOOK_EVENTS_PATH.exists() else []
hs.record_cli_event("npm run build")
events_after = hs.HOOK_EVENTS_PATH.read_text(encoding="utf-8").splitlines() if hs.HOOK_EVENTS_PATH.exists() else []
no_extra = len(events_after) == len(events_before)
checks.append(("非 hcloud 命令不产生遥测事件", no_extra, f"before={len(events_before)} after={len(events_after)}"))

# 判定
fails = [c for c in checks if not c[1]]
status = "FAIL" if fails else "PASS"
why = "; ".join(c[0] for c in fails) if fails else ""

detail = "\n".join(f"[{'PASS' if c[1] else 'FAIL'}] D4-25 {c[0]} => {c[2]}" for c in checks)
out = {"status": status}
if why:
    out["why"] = why
out["executedAt"] = time.strftime("%Y%m%d%H%M%S")

os.makedirs(os.path.join(EV, "D4-25"), exist_ok=True)
with open(os.path.join(EV, "D4-25", "stdout.log"), "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False)
with open(os.path.join(EV, "D4-25", "detail.log"), "w", encoding="utf-8") as f:
    f.write(detail)

print(f"[flush] D4-25: {status} ({len(checks)} checks, {len(fails)} fail)")
print(detail)