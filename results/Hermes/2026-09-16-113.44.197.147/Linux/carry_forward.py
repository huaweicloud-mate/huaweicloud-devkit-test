# -*- coding: utf-8 -*-
"""Carry forward 09-15 results (status/time/evidence/blockedReason) into 09-16 package by ID match."""
import csv, os, shutil

OLD = os.path.expanduser('~/devkit-test/Hermes/huaweicloud-devkit-test/results/Hermes/2026-09-15-113.44.197.147/Linux')
NEW = os.path.expanduser('~/devkit-test/Hermes/huaweicloud-devkit-test/results/Hermes/2026-09-16-113.44.197.147/Linux')

# 1. copy evidence dir
src_ev = os.path.join(OLD, 'evidence')
dst_ev = os.path.join(NEW, 'evidence')
if os.path.isdir(src_ev):
    if os.path.isdir(dst_ev):
        shutil.rmtree(dst_ev)
    shutil.copytree(src_ev, dst_ev)
    print('copied evidence dir:', os.path.basename(src_ev))
else:
    print('WARN no evidence dir in old package')

STATUS_COLS = ['执行状态', '执行时间', 'evidencePath', 'blockedReason']

def carry(fname):
    old_path = os.path.join(OLD, fname)
    new_path = os.path.join(NEW, fname)
    with open(new_path, encoding='utf-8-sig') as f:
        rows = list(csv.DictReader(f))
    fieldnames = list(rows[0].keys()) if rows else []
    with open(old_path, encoding='utf-8-sig') as f:
        old_rows = {r['ID']: r for r in csv.DictReader(f)}
    carried = 0
    for r in rows:
        o = old_rows.get(r['ID'])
        if o is None:
            continue
        for c in STATUS_COLS:
            if c in r:
                r[c] = o.get(c, '')
        carried += 1
    with open(new_path, 'w', encoding='utf-8-sig', newline='') as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        for r in rows:
            w.writerow(r)
    print(f'{fname}: carried {carried}/{len(rows)} rows')

carry('用例矩阵-设计级.csv')
carry('用例矩阵-展开级.csv')
print('DONE carry-forward')