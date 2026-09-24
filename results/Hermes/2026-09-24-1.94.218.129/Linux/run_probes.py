#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""逐个运行 probe.mjs（node 子进程），超时控制，报告 pass/fail。"""
import os, sys, subprocess, json, time

EVID = "/home/testbot3/devkit-test/Hermes/huaweicloud-devkit-test/results/Hermes/2026-09-24-1.94.218.129/Linux/evidence"
ENV = dict(os.environ)
ENV["PATH"] = os.path.expanduser("~/nodejs/bin") + ":" + os.path.expanduser("~/bin") + ":" + ENV.get("PATH", "")

def run_group(name, timeout=180):
    d = os.path.join(EVID, name)
    probe = os.path.join(d, "probe.mjs")
    if not os.path.isfile(probe):
        print(f"[SKIP] {name} (no probe.mjs)")
        return None
    t0 = time.time()
    try:
        r = subprocess.run(["node", probe], env=ENV, capture_output=True, text=True, timeout=timeout, cwd=d)
    except subprocess.TimeoutExpired:
        print(f"[TIMEOUT] {name} > {timeout}s")
        return None
    dt = time.time() - t0
    # 读取落盘的 stdout.log 摘要
    log = os.path.join(d, "stdout.log")
    summary = ""
    if os.path.isfile(log):
        try:
            data = json.load(open(log, encoding="utf-8"))
            if isinstance(data, dict):
                summary = f"total={data.get('total')} passed={data.get('passed')} failed={data.get('failed')}"
                if 'results' in data:
                    fails = [x.get('id') for x in data['results'] if not x.get('pass')]
                    if fails:
                        summary += f" FAIL_ids={fails[:8]}"
            else:
                summary = f"log_non_dict_keys={list(data.keys()) if isinstance(data,dict) else type(data)}"
        except Exception:
            summary = "log_parse_err"
    print(f"[{'OK' if r.returncode==0 else 'ERR'+str(r.returncode)}] {name} ({dt:.1f}s) {summary}")
    if r.returncode != 0:
        print("   STDERR:", (r.stderr or "")[-500:].replace("\n", " | "))
    return r.returncode

if __name__ == "__main__":
    groups = sys.argv[1:] or []
    if not groups:
        groups = sorted(os.listdir(EVID))
    for g in groups:
        run_group(g)