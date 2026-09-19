#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""AtomCode 2026-09-20 每日测试：从参考客户端 OpenClaw(2026-09-19) 复用探针逻辑，
改写 hdk/REPO 路径到本客户端，落到今日 evidence/。只复制探针脚本（.mjs/.sh），不复制 stdout.log——
stdout.log 由实际运行重新生成（本机新鲜证据）。"""
import os
import shutil
import re

D = os.path.dirname(os.path.abspath(__file__))
SRC = "/home/testbot1/devkit-test/OpenClaw/huaweicloud-devkit-test/results/OpenClaw/2026-09-19-113.44.197.147/Linux/evidence"
DST = os.path.join(D, "evidence")

MY_HDK = "/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk"
MY_REPO = "/home/testbot1/devkit-test/testbot1-linux-atomcode/huaweicloud-devkit-test"
REF_HDK = "/home/testbot1/devkit-test/OpenClaw/hdk"
REF_REPO = "/home/testbot1/devkit-test/OpenClaw/huaweicloud-devkit-test"

copied = 0
for root, dirs, files in os.walk(SRC):
    for fn in files:
        if fn.endswith((".log",)):
            continue  # 不复用旧证据
        src = os.path.join(root, fn)
        rel = os.path.relpath(src, SRC)
        dst = os.path.join(DST, rel)
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        if fn.endswith((".mjs", ".sh")):
            text = open(src, encoding="utf-8").read()
            text = text.replace(REF_HDK, MY_HDK).replace(REF_REPO, MY_REPO)
            open(dst, "w", encoding="utf-8").write(text)
        else:
            shutil.copy2(src, dst)
        copied += 1

print(f"staged {copied} probe files (logs excluded) into {DST}")
print(f"rewrote {REF_HDK} -> {MY_HDK}")
print(f"rewrote {REF_REPO} -> {MY_REPO}")