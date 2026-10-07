#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""从昨日(2026-09-24) evidence 复制 probe.mjs 到今日(2026-09-25) evidence。
只改写输出路径中的日期串，SUT 路径/断言逻辑不动。stdout.log 不复制——由 node 重跑新鲜生成。"""
import os, shutil, sys

REPO = "/home/testbot3/devkit-test/Hermes/huaweicloud-devkit-test"
SRC = os.path.join(REPO, "results", "Hermes", "2026-09-24-1.94.218.129", "Linux", "evidence")
DST = os.path.join(REPO, "results", "Hermes", "2026-09-25-1.94.218.129", "Linux", "evidence")

os.makedirs(DST, exist_ok=True)

copied = []
skipped = []
for name in sorted(os.listdir(SRC)):
    src_probe = os.path.join(SRC, name, "probe.mjs")
    if not os.path.isfile(src_probe):
        # D9-protocol / D10-eval 由 harness 另跑，这里跳过
        skipped.append(name)
        print(f"[skip no-probe] {name}")
        continue
    text = open(src_probe, encoding="utf-8").read()
    new_text = text.replace("2026-09-24", "2026-09-25")
    dst_dir = os.path.join(DST, name)
    os.makedirs(dst_dir, exist_ok=True)
    open(os.path.join(dst_dir, "probe.mjs"), "w", encoding="utf-8").write(new_text)
    copied.append(name)
    print(f"[copy] {name} ({len(text)}->{len(new_text)} bytes)")

print(f"\n共复制 {len(copied)} 个探针，跳过(harness) {len(skipped)}: {skipped}")