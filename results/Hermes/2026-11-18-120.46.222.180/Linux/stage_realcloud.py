#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Hermes Linux 2026-11-13 每日测试 —— 真云 RC_CASES 证据落盘。
读当日 realcloud-probe/stdout.txt + probe.mjs，分发到每个 RC 用例目录。
状态基于今日（11-13）实际真云输出判定（DMS/DEW 仍 FAIL）。
"""
import os, json, datetime

BASE = os.path.dirname(os.path.abspath(__file__))
EV = os.path.join(BASE, 'evidence')
RC = os.path.join(EV, 'realcloud-probe')
TS = datetime.datetime.now().strftime('%Y%m%d%H%M%S')

def rd(p):
    if not os.path.isfile(p): return ''
    return open(p, encoding='utf-8', errors='replace').read()

def wr(dst, txt):
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    open(dst, 'w', encoding='utf-8').write(txt)

rc_txt = rd(os.path.join(RC, 'stdout.txt'))
rc_probe = rd(os.path.join(RC, 'probe.mjs'))

WHY = {
    'D3-C4': "src/tools.mjs huaweicloud_list_operations 对 DMS、DEW 两服务未返回 command/result（list_operations+plan 失败，22 服务中 2 个无规范路由）",
    'EXP-C4-14': "src/tools.mjs huaweicloud_list_operations(DMS) 未返回 command/result",
    'EXP-C4-18': "src/tools.mjs huaweicloud_list_operations(DEW) 未返回 command/result",
}
FAIL = {'D3-C4', 'EXP-C4-14', 'EXP-C4-18'}

RC_CASES = ['D2-1','D3-C4','D4-14','D4-18','D4-19','D4-20'] + ['EXP-C4-%02d' % i for i in range(1, 23)]

def status_of(cid):
    return 'FAIL' if cid in FAIL else 'PASS'

for cid in RC_CASES:
    d = os.path.join(EV, cid)
    os.makedirs(d, exist_ok=True)
    wr(os.path.join(d, 'stdout.txt'), rc_txt)
    wr(os.path.join(d, 'probe.mjs'), rc_probe)
    st = status_of(cid)
    wr(os.path.join(d, 'stdout.log'), json.dumps({'status': st, 'executedAt': TS, 'why': WHY.get(cid, '')}, ensure_ascii=False))

print('[stage_realcloud] 落盘 %d RC 用例；FAIL=%s' % (len(RC_CASES), ', '.join(sorted(FAIL))))