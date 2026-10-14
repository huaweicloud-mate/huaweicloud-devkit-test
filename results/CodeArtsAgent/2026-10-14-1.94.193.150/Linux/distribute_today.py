# -*- coding: utf-8 -*-
"""CodeArtsAgent Linux 2026-10-14 证据分发(stdout) + 回填三 CSV。被测 1.1.8."""
import os, re, shutil, csv
from datetime import datetime, timezone, timedelta

BASE = os.path.dirname(os.path.abspath(__file__))
EVID = os.path.join(BASE, "evidence")
P = os.path.join(EVID, "_probes")
HDK = "/home/testbot2/devkit-test/testbot2-Linux-CodeArts CLI/hdk"
FX = "/home/testbot2/devkit-test/testbot2-Linux-CodeArts CLI/huaweicloud-devkit-test/eval/harness/fixtures"
BJT = timezone(timedelta(hours=8))
TS = datetime.now(BJT).strftime("%Y%m%d%H%M%S")

def read(n):
    with open(os.path.join(P, n), encoding="utf-8") as f:
        return f.read()

def write_case(cid, content, probe_src=None):
    d = os.path.join(EVID, cid)
    os.makedirs(d, exist_ok=True)
    with open(os.path.join(d, "stdout.txt"), "w", encoding="utf-8") as f:
        f.write(content)
    if probe_src and os.path.isfile(os.path.join(P, probe_src)):
        shutil.copy2(os.path.join(P, probe_src), os.path.join(d, "probe.mjs"))

def split_sections(text):
    out = {}
    for m in re.finditer(r"=====CASE ([^\n]+)=====\n(.*?)\n=====END \1=====", text, re.S):
        out[m.group(1)] = m.group(2).rstrip("\n") + "\n"
    return out

def distribute(logfile, probe_src, mapping):
    secs = split_sections(read(logfile))
    for cid in mapping:
        if cid in secs:
            write_case(cid, secs[cid], probe_src)
        else:
            print("  [WARN] %s 段未找到于 %s" % (cid, logfile))

# ===== 分发 .log -> case stdout =====
distribute("classify.log", "classify-probe.mjs", ["D4-1","D4-2","D4-3","D4-15","D4-16"])
distribute("hook.log", "hook-probe.mjs", ["D4-5","D4-7","D4-9","D4-21","D4-22"])
distribute("auth.log", "auth-probe.mjs", ["D2-4","D2-11","D2-12"])
distribute("protocol.log", "protocol-probe.mjs", ["D5-3","D9-1","D9-2","D9-3","D9-4","D9-5","D9-7","D9-8"])
distribute("extended.log", "extended-probe.mjs", ["D2-16","D9-9","D1-41"])
distribute("d4-8.log", "d4-8-probe.sh", ["D4-8"])
distribute("supplement.log", "supplement-probe.mjs", ["D1-26","D1-27","D2-2","D2-5","D3-A1","D3-B1","D3-B3","D3-B5","D3-C5","D4-4","D4-11","D4-17","D6-1","D6-3","D6-4"])
distribute("supplement-import.log", "supplement-import.mjs", ["D1-30","D4-10"])
distribute("new-env-probe.log", "new-env-probe.mjs", ["D1-65","D1-66","D1-67","D1-68"])
distribute("new-config-probe.log", "new-config-probe.mjs", ["D2-27","D1-70","D8-9","D8-10","D6-9"])
distribute("new-safety-probe.log", "new-safety-probe.mjs", ["D10-4","D4-26","D4-29","D4-28","D4-25"])
distribute("new-mcp.log", "new-mcp-probe.mjs", ["D9-10","D9-11"])
distribute("new-cli-probe.log", "new-cli-probe.mjs", ["D1-69"])
distribute("new-scenario-probe.log", "new-scenario-probe.mjs", ["D3-S1","D3-S5","D3-S8"])
distribute("new-cloud-probe.log", "new-cloud-probe.mjs", ["D3-S2","D3-C13","D3-C14","D3-S4","D3-S3"])
distribute("new-fg-rds-probe.log", "new-fg-rds-probe.mjs", ["D3-S6","D3-S7"])

for cid in ["D1-28","D1-31","D1-33"]:
    write_case(cid, read("updatecheck.log"), "updatecheck-probe.mjs")
for cid, log, src in [("D5-1","d5-1.log","D5-1-probe.mjs"),("D1-40","d1-40.log","D1-40-probe.mjs"),
                      ("D1-42","d1-42.log","D1-42-probe.mjs"),("D1-45","d1-45.log","D1-45-probe.mjs"),
                      ("D4-6","d4-6.log","D4-6-probe.mjs"),("D2-26","D2-26-probe.log","D2-26-probe.mjs"),
                      ("D4-27","D4-27-probe.log","D4-27-probe.mjs")]:
    write_case(cid, read(log), src)
write_case("D10-3", read("routing.log") + "\n===== eval-harness =====\n" + read("eval-harness.log"), "routing-probe.mjs")
write_case("EXP-E08", read("exp-e08.log"), "EXP-E08-probe.mjs")
write_case("D9-12", read("d9-12.log"), "D9-12-probe.mjs")
write_case("D9-13", read("d9-13.log"), "D9-13-probe.mjs")

d8secs = split_sections(read("d8.log"))
write_case("D8-7", "".join(d8secs.get(k, "") for k in sorted(d8secs)) + "\n=== DONE ===\n", "d8-probe.mjs")
d1 = read("d1.log")
def slice_steps(text, s, e=None):
    i = text.find(s)
    if i < 0: return ""
    j = text.find(e) if e else len(text)
    return text[i:j]
write_case("D1-3", slice_steps(d1, "########## STEP 3", "########## STEP 4"), "d1-probe.sh")
write_case("D1-4", slice_steps(d1, "########## STEP 4", "########## STEP 6"), "d1-probe.sh")

# fixtures 复制
for cid, fx in [("D2-10","d2-10-koocli-profile.mjs"),("D2-13","d2-13-s1-env.mjs"),
                ("D4-12","d4-12-supply-chain.mjs"),("D9-6","d9-6-cross-client.mjs"),
                ("D9-9","d9-9-delay-timeout.mjs")]:
    fx_abs = os.path.join(FX, fx)
    if os.path.isfile(fx_abs):
        os.makedirs(os.path.join(EVID, cid), exist_ok=True)
        shutil.copy2(fx_abs, os.path.join(EVID, cid, "probe.mjs"))

print("分发完成")
