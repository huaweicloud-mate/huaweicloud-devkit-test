# -*- coding: utf-8 -*-
import os, sys, time, json
base = r"C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-11-12-119.8.181.45\Windows"
ev = os.path.join(base, "evidence")
now = time.time()
recent = []
for root, dirs, files in os.walk(ev):
    for f in files:
        p = os.path.join(root, f)
        try:
            m = os.path.getmtime(p)
        except OSError:
            continue
        recent.append((m, p))
recent.sort(reverse=True)
print("NOW", time.strftime("%H:%M:%S", time.localtime(now)))
for m, p in recent[:20]:
    print(time.strftime("%m-%d %H:%M:%S", time.localtime(m)), os.path.relpath(p, base))

dirs = [d for d in os.listdir(ev) if os.path.isdir(os.path.join(ev, d))]
withlog = [d for d in dirs if os.path.exists(os.path.join(ev, d, "stdout.log"))]
print("dirs", len(dirs), "with stdout.log", len(withlog))
missing = [d for d in dirs if d not in withlog]
print("missing", missing[:50])
