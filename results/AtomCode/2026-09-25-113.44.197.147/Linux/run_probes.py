#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""AtomCode 2026-09-25 Linux 每日测试探针重跑编排器。

复用昨日(2026-09-24)已构建的确定性探针脚本(.mjs)，仅改写输出日期路径
(2026-09-24-113.44.197.147 -> 2026-09-25-113.44.197.147)，SUT 源码 import 路径
(/home/.../hdk/...) 保持不变（hdk 已 checkout 到今日 npm 包对应 commit 7456d059），
然后用 node 逐个大真执行，把控制台输出捕获到 <group>/probe*.run.log，
探针自身 writeFileSync 产生的 <group>/stdout.log 也会落到今日目录。

只重跑探针、不复制昨日 stdout.log —— 保证今日证据新鲜真实。
"""
import os, subprocess, sys, glob, shutil

BASE = os.path.dirname(os.path.abspath(__file__))
YDAY = BASE.replace("2026-09-25", "2026-09-24")
EV = os.path.join(BASE, "evidence")
YEV = os.path.join(YDAY, "evidence")

SKIP_GROUPS = {"realcloud"}  # 真云 E2E 单独编排，避免误跑建删资源

def main():
    if not os.path.isdir(YEV):
        print(f"[ERROR] 昨日 evidence 不存在: {YEV}")
        sys.exit(3)
    os.makedirs(EV, exist_ok=True)

    # 1) 复制全部 .mjs 探针（改写日期路径）
    copied = []
    for mjs in sorted(glob.glob(os.path.join(YEV, "**", "*.mjs"), recursive=True)):
        rel = os.path.relpath(mjs, YEV)
        parts = rel.split(os.sep)
        group = parts[0] if len(parts) > 1 else "_top"
        if group in SKIP_GROUPS:
            print(f"[skip] {rel} (真云 E2E 单独编排)")
            continue
        text = open(mjs, encoding="utf-8").read()
        text = text.replace("2026-09-24-113.44.197.147", "2026-09-25-113.44.197.147")
        dst = os.path.join(EV, rel)
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        open(dst, "w", encoding="utf-8").write(text)
        copied.append(rel)

    print(f"[copy] 复制 {len(copied)} 个探针脚本到今日 evidence/")

    # 2) 按 group 依次 node 执行
    groups = {}
    for rel in copied:
        g = rel.split(os.sep)[0]
        groups.setdefault(g, []).append(os.path.join(EV, rel))

    fails = []
    for g in sorted(groups):
        for mjs in sorted(groups[g]):
            run_log = mjs[:-4] + ".run.log"
            print(f"[run] node {os.path.relpath(mjs, EV)}")
            with open(run_log, "w", encoding="utf-8") as f:
                f.write(f"$ node {os.path.relpath(mjs, EV)}\n")
                f.write(f"$ executed at (BJ) 2026-09-25\n\n")
                try:
                    r = subprocess.run(["node", mjs], capture_output=True, text=True,
                                       timeout=180, cwd=BASE)
                    f.write((r.stdout or "") + ("\n[stderr]\n" + r.stderr if r.stderr else ""))
                    f.write(f"\n[exit={r.returncode}]\n")
                    if r.returncode != 0:
                        fails.append(rel)
                except subprocess.TimeoutExpired:
                    f.write("\n[TIMEOUT 180s]\n")
                    fails.append(rel)
        print(f"  ... group {g} 完成")

    print(f"\n[done] 探针执行完成。exit!=0 的探针: {fails if fails else '无'}")


if __name__ == "__main__":
    main()