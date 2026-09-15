# -*- coding: utf-8 -*-
"""Hermes Linux 2026-09-15 每日回归：证据分发（把主探针日志按 CASE 切到 evidence/<case-id>/）。

读取 _probes/ 下日志，按 `=====CASE <id>=====` / `=====END <id>=====` 切段写入 evidence/<case-id>/stdout.log，
并复制探针源为 probe 文件。D1 安装探针按 STEP 切片。D4-16 / D4-21 另附补充探针日志。
"""
import os, re, shutil

BASE = os.path.dirname(os.path.abspath(__file__))
EVID = os.path.join(BASE, "evidence")
P = os.path.join(EVID, "_probes")

def read(n):
    with open(os.path.join(P, n), encoding="utf-8") as f:
        return f.read()

def write_case(cid, content, probe_src=None, probe_name="probe.mjs"):
    d = os.path.join(EVID, cid)
    os.makedirs(d, exist_ok=True)
    with open(os.path.join(d, "stdout.log"), "w", encoding="utf-8") as f:
        f.write(content)
    if probe_src and os.path.isfile(os.path.join(P, probe_src)):
        shutil.copy2(os.path.join(P, probe_src), os.path.join(d, probe_name))

def append_case(cid, content, probe_src=None, probe_name="probe.mjs"):
    d = os.path.join(EVID, cid)
    os.makedirs(d, exist_ok=True)
    with open(os.path.join(d, "stdout.log"), "a", encoding="utf-8") as f:
        f.write("\n" + content)
    if probe_src and os.path.isfile(os.path.join(P, probe_src)):
        shutil.copy2(os.path.join(P, probe_src), os.path.join(d, probe_name))

def split_sections(text):
    out = {}
    for m in re.finditer(r"=====CASE ([^\n]+)=====\n(.*?)\n=====END \1=====", text, re.S):
        out[m.group(1)] = m.group(2).rstrip("\n") + "\n"
    return out

def distribute(logfile, probe_src, mapping, probe_name="probe.mjs"):
    text = read(logfile)
    secs = split_sections(text)
    for cid in mapping:
        if cid in secs:
            write_case(cid, secs[cid], probe_src, probe_name)
            print(f"  {cid}: {len(secs[cid])} bytes")
        else:
            print(f"  [WARN] {cid} 段未找到于 {logfile}")

print("== classify (D4-1/2/3/15/16) ==")
distribute("classify.log", "classify-probe.mjs", ["D4-1", "D4-2", "D4-3", "D4-15", "D4-16"])

print("== hook (D4-5/7/9/21/22) ==")
distribute("hook.log", "hook-probe.mjs", ["D4-5", "D4-7", "D4-9", "D4-21", "D4-22"])

print("== auth (D2-4/11/12) ==")
distribute("auth.log", "auth-probe.mjs", ["D2-4", "D2-11", "D2-12"])

print("== protocol (D5-3/D9-*) ==")
distribute("protocol.log", "protocol-probe.mjs", ["D5-3", "D9-1", "D9-2", "D9-3", "D9-4", "D9-5", "D9-7", "D9-8"])

print("== extended (D2-16/D9-9/D1-41) ==")
distribute("extended.log", "extended-probe.mjs", ["D2-16", "D9-9", "D1-41"])

print("== d4-8 (D4-8) ==")
distribute("d4-8.log", "d4-8-probe.sh", ["D4-8"], probe_name="probe.sh")

print("== D4-16 补充：env-dump 包裹穿透 (wrap-probe) ==")
append_case("D4-16", read("wrap-probe.log"), "wrap-probe.mjs", "wrap-probe.mjs")
print("   D4-16 + wrap-probe.log")

print("== D4-21 补充：Terraform HCL broad IAM (hcl-probe) ==")
append_case("D4-21", read("hcl-probe.log"), "hcl-probe.mjs", "hcl-probe.mjs")
print("   D4-21 + hcl-probe.log")

print("== d8 (D8-7, 合并 7 技能段) ==")
d8 = read("d8.log")
d8secs = split_sections(d8)
merged = "".join(d8secs.get(k, "") for k in sorted(d8secs))
write_case("D8-7", merged + "\n=== DONE ===\n", "d8-probe.mjs")
print(f"  D8-7: {len(merged)} bytes (7 技能段合并)")

print("== D1 安装域（按 STEP 切片） ==")
d1 = read("d1.log")

def slice_steps(text, start_hdr, end_hdr=None):
    i = text.find(start_hdr)
    if i < 0:
        return ""
    j = text.find(end_hdr) if end_hdr else len(text)
    return text[i:j]

d1_1 = slice_steps(d1, "########## STEP 1", "########## STEP 3")
d1_3 = slice_steps(d1, "########## STEP 3", "########## STEP 4")
d1_4 = slice_steps(d1, "########## STEP 4", "########## STEP 7")
d1_5 = slice_steps(d1, "########## STEP 7", None)
for cid, content in [("D1-1", d1_1), ("D1-3", d1_3), ("D1-4", d1_4), ("D1-5", d1_5)]:
    write_case(cid, content, "d1-probe.sh", "probe.sh")
    print(f"  {cid}: {len(content)} bytes")

print("== 基线 version ==")
write_case("_baseline", "huaweicloud-devkit v1.1.4\n", None)
print("== 完成 ==")