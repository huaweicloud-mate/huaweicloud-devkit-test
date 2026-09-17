#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""复用参考客户端探针：自动 path-rewrite + 落本客户端 evidence（无需 agent 手写 stage 脚本）。

用法:
    python scripts/reuse_probes.py <客户端> <OS> [--ref OpenCode] [--dry]

自动完成（agent 无需手改路径，避免手写 stage 脚本出错）:
  1. 找参考客户端最近一次完整 run 的 grouped 探针
     （d4-security / d2-auth / d1-upgrade / mcp-tools / c4-service-matrix）。
  2. 自动检测本机 hdk 源码路径（测试仓库 ../hdk）。
  3. 改写探针的 SUT import 路径（覆盖所有变体：file:// 前缀 / pkgRoot / 反斜杠 /
     node_modules 前缀 / 4 斜杠坑）+ 输出路径。
  4. 跳过「硬编码 JSON」探针（真云实机类，重跑=虚报，留待真机重做）。
  5. 复制到 results/<客户端>/<日期>-<IP>/<OS>/evidence/。

注意: 复制的是探针逻辑（probe.mjs），不复制参考 stdout.log——stdout.log 由 agent 实际
     运行 `node <dir>/probe.mjs` 重新生成（本机新鲜证据），复制旧证据 = 虚报。
"""
import os
import re
import sys
import glob
import datetime
import shutil

CLIENTS = ["OpenCode", "Codex", "CodeArtsAgent", "CodeArtsWork", "WorkBuddy",
           "DSH", "OfficeAce", "Hermes", "OpenClaw", "AtomCode"]

# grouped 探针（真实断言逻辑，可重跑）
GROUPED = ["d4-security", "d2-auth", "d1-upgrade", "mcp-tools", "c4-service-matrix"]

# 硬编码探针特征：主体是 const x = {...fingerprint/sourceIP/vpcId...}; console.log(x)
HARDCODE_HINTS = ["fingerprint", "sourceIP", "vpcId", "const xResults", "console.log(xResults)"]


def parse_args():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    flags = [a for a in sys.argv[1:] if a.startswith("--")]
    if len(args) < 2:
        print(__doc__)
        sys.exit(2)
    client = args[0]
    os_name = args[1]
    ref = None
    for f in flags:
        if f.startswith("--ref="):
            ref = f.split("=", 1)[1]
    return client, os_name, ref, ("--dry" in flags)


def repo_root():
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def detect_hdk_path():
    """检测 hdk 源码根：优先 ../hdk（AGENTS.md 约定），否则 $HDK_HOME，否则找不到报错。"""
    candidates = [
        os.path.join(repo_root(), "..", "hdk"),
        os.environ.get("HDK_HOME", ""),
    ]
    for c in candidates:
        if c and os.path.isdir(os.path.join(c, "plugins", "huaweicloud-core", "src")):
            return os.path.abspath(c)
    print("[reuse_probes] 找不到 hdk 源码（期望 <repo>/../hdk 且含 plugins/huaweicloud-core/src）")
    sys.exit(3)


def find_ref_evidence(ref_client, os_name):
    """在 results/<ref_client>/ 下找最新一次含 grouped 探针的 evidence 目录。"""
    if ref_client:
        bases = [os.path.join(repo_root(), "results", ref_client)]
    else:
        bases = [os.path.join(repo_root(), "results", c) for c in CLIENTS]
        ref_client = "<自动>"
    best = None
    best_ts = ""
    for base in bases:
        if not os.path.isdir(base):
            continue
        for d in sorted(os.listdir(base), reverse=True):
            ev = os.path.join(base, d, os_name, "evidence")
            if os.path.isdir(ev) and any(os.path.isfile(os.path.join(ev, g, "probe.mjs")) for g in GROUPED):
                # 目录名 <日期>-<IP>，取日期部分比较
                ts = d.split("-")[0] if "-" in d else d
                if ts > best_ts:
                    best_ts, best = ts, ev
                break  # 该客户的最近一次
    if not best:
        print(f"[reuse_probes] 参考客户端 {ref_client} 在 {os_name} 无 grouped 探针（results/<ref>/*/{os_name}/evidence/{GROUPED}）。")
        sys.exit(4)
    return best


def find_out_dir(client, os_name):
    """本客户端本日结果目录（init_day 已建）。取最新 <日期>-<IP>/<OS>。"""
    base = os.path.join(repo_root(), "results", client)
    if not os.path.isdir(base):
        print(f"[reuse_probes] 本客户端 results/{client} 不存在，先跑 init_day。")
        sys.exit(5)
    dirs = sorted([d for d in os.listdir(base) if os.path.isdir(os.path.join(base, d, os_name))], reverse=True)
    if not dirs:
        print(f"[reuse_probes] results/{client} 下无 {os_name} 结果目录，先跑 init_day <客户端> <OS> --full。")
        sys.exit(6)
    return os.path.join(base, dirs[0], os_name)


def to_file_url(path, os_name):
    p = os.path.abspath(path).replace("\\", "/")
    if os_name == "Windows" and re.match(r"^[A-Za-z]:", p):
        return "file:///" + p
    return "file://" + p


def rewrite_probe(text, hdk_path, out_evidence_dir, os_name, client):
    """改写探针：SUT import 路径 + 输出路径。分段确定性替换（避免整段 file:// 正则残留）。"""
    hdk_url = to_file_url(os.path.join(hdk_path), os_name)   # file:///C:/...hdk 或 file:///home/...hdk
    hdk_abs = os.path.abspath(hdk_path)

    # 1) SUT import：file://<任意>/node_modules/huaweicloud-devkit → file://<hdk>（先带 file 前缀，避免 4 斜杠）
    text = re.sub(
        r"file:///(?:[A-Za-z]:)?[^'\"\s]*?node_modules[\\/]huaweicloud-devkit(?=[\\/'\"):]|$)",
        hdk_url,
        text,
    )
    # 2) pkgRoot/反斜杠变量（无 file:// 前缀）：.../node_modules/huaweicloud-devkit → <hdk 绝对路径>
    text = re.sub(
        r"(?:[A-Za-z]:[\\/])?[^'\"\s]*?node_modules[\\/]huaweicloud-devkit(?=[\\/'\"):]|$)",
        lambda m: hdk_abs.replace("\\", "/"),
        text,
    )

    # 3) 输出路径：先提取探针里所有「绝对 results evidence 前缀」，再逐个精确替换（不依赖 clone 目录名=client 假设）
    prefixes = set()
    for m in re.finditer(
        r"(?:file:///)?[A-Za-z]:[\\/][^'\"\s]*?results[\\/][^\\/\"']+[\\/]\d{4}-\d{2}-\d{2}-[\d.]+[\\/](?:Windows|Linux)[\\/]evidence",
        text,
    ):
        prefixes.add(m.group(0))
    out_furl = to_file_url(out_evidence_dir, os_name)
    out_abs = os.path.abspath(out_evidence_dir).replace("\\", "/")
    for p in prefixes:
        text = text.replace(p, out_furl if p.startswith("file://") else out_abs)
    return text


def is_hardcoded(text):
    """硬编码 JSON 探针（真云实机类）→ 重跑=虚报，跳过。"""
    return all(h in text for h in HARDCODE_HINTS[:1]) and any(h in text for h in HARDCODE_HINTS[1:])


def main():
    client, os_name, ref, dry = parse_args()
    hdk = detect_hdk_path()
    ref_ev = find_ref_evidence(ref, os_name)
    out_dir = find_out_dir(client, os_name)
    out_ev = os.path.join(out_dir, "evidence")

    print(f"[reuse_probes] hdk = {hdk}")
    print(f"[reuse_probes] 参考探针源 = {ref_ev}")
    print(f"[reuse_probes] 目标 = {out_ev}")

    copied, skipped = 0, 0
    for g in GROUPED:
        src = os.path.join(ref_ev, g, "probe.mjs")
        if not os.path.isfile(src):
            continue
        text = open(src, encoding="utf-8").read()
        if is_hardcoded(text):
            print(f"  [跳过-硬编码] {g}/probe.mjs（真云实机类，留待真机重做）")
            skipped += 1
            continue
        new_text = rewrite_probe(text, hdk, out_ev, os_name, client)
        dst = os.path.join(out_ev, g, "probe.mjs")
        if not dry:
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            open(dst, "w", encoding="utf-8").write(new_text)
        print(f"  [复制] {g}/probe.mjs")
        copied += 1

    print(f"[reuse_probes] 完成：复制 {copied} 个 grouped 探针，跳过 {skipped} 个硬编码。")
    if not dry:
        print("  下一步：逐个 `node results/<客户端>/<日期>-<IP>/<OS>/evidence/<group>/probe.mjs` 重跑生成 stdout.log（本机新鲜证据）。")
    else:
        print("  （dry-run，未写盘）")


if __name__ == "__main__":
    main()