# -*- coding: utf-8 -*-
"""补充证据分发：把 supplement.log / supplement-import.log 按 CASE 切到 evidence/<case-id>/。"""
import os, re, shutil

BASE = os.path.dirname(os.path.abspath(__file__))
EVID = os.path.join(BASE, "evidence")
P = os.path.join(EVID, "_probes")

def read(n):
    with open(os.path.join(P, n), encoding="utf-8") as f:
        return f.read()

def write_case(cid, content, probe_src, probe_name="probe.mjs"):
    d = os.path.join(EVID, cid)
    os.makedirs(d, exist_ok=True)
    with open(os.path.join(d, "stdout.log"), "w", encoding="utf-8") as f:
        f.write(content)
    if probe_src and os.path.isfile(os.path.join(P, probe_src)):
        shutil.copy2(os.path.join(P, probe_src), os.path.join(d, probe_name))

def split_sections(text):
    out = {}
    for m in re.finditer(r"=====CASE ([^\n]+)=====\n(.*?)\n=====END \1=====", text, re.S):
        out[m.group(1)] = m.group(2).rstrip("\n") + "\n"
    return out

# supplement-probe (MCP) -> 16 cases
sup = read("supplement.log")
secs = split_sections(sup)
for cid in ["D1-26","D1-27","D2-2","D2-5","D3-A1","D3-B1","D3-B3","D3-B5","D3-C5","D4-4","D4-6","D4-11","D4-17","D6-1","D6-3","D6-4"]:
    if cid in secs:
        write_case(cid, secs[cid], "supplement-probe.mjs")
        print(f"  {cid}: {len(secs[cid])} bytes")
    else:
        print(f"  [WARN] {cid} 段未找到")

# supplement-import (direct) -> 2 cases
imp = read("supplement-import.log")
secs2 = split_sections(imp)
for cid in ["D1-30","D4-10"]:
    if cid in secs2:
        write_case(cid, secs2[cid], "supplement-import.mjs")
        print(f"  {cid}: {len(secs2[cid])} bytes")
    else:
        print(f"  [WARN] {cid} 段未找到")

print("== 完成 ==")