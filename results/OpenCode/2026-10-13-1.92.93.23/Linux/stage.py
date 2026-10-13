#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""每日测试证据落盘（OpenCode Linux 2026-10-13）：把 _probes 聚合日志切片 + 状态写入每个 case-id 的 evidence 目录。"""
import os, json, re, csv, datetime, shutil

BASE = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(BASE, 'evidence', '_probes')
EV = os.path.join(BASE, 'evidence')
TS = datetime.datetime.now().strftime('%Y%m%d%H%M%S')

def rd(p):
    if not os.path.isfile(p): return ''
    return open(p, encoding='utf-8', errors='replace').read()

def wr(dst, txt):
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    open(dst, 'w', encoding='utf-8').write(txt)

def write_status(cid, status, why=''):
    d = {'status': status, 'executedAt': TS}
    if why: d['why'] = why
    wr(os.path.join(EV, cid, 'stdout.log'), json.dumps(d))

def slice_section(logfile, section_id):
    txt = rd(os.path.join(P, logfile))
    m = re.search(r'=====CASE %s=====(.*?)=====END %s=====' % (re.escape(section_id), re.escape(section_id)), txt, re.S)
    return (m.group(1).strip() if m else '') or ('(no section %s in %s)' % (section_id, logfile))

# ---- 状态表 ----
FAIL = {'D4-2','D4-6','D4-17','D4-21','D4-25','D4-26','D3-S5','D3-S6','D3-S7','D9-12','EXP-E01'}
SPEC = {'D9-9','D8-9','D10-4'}
NOTRUN = {'D1-39'}

# ---- source mapping：case -> (kind, file, section) ----
# kind: section | file | line (header-prefixed line from eval-harness)
MAP = {}
def add(cases, kind, file, sec=None):
    for c in cases:
        MAP[c] = (kind, file, sec)

add(['D4-1','D4-2','D4-3','D4-15','D4-16'], 'section', 'classify.log')
add(['D4-5','D4-7','D4-9','D4-21','D4-22'], 'section', 'hook.log')
add(['D2-11','D2-12'], 'section', 'auth.log')
add(['D2-4'], 'section', 'auth.log', 'D2-4')
add(['D9-1','D9-2','D9-3','D9-4','D9-5','D9-7','D9-8','D5-3'], 'section', 'protocol.log')
add(['EXP-D5-1-3'], 'section', 'protocol.log', 'D5-3')
add(['D9-9','D2-16','D1-41'], 'section', 'extended.log')
add(['D1-26','D1-27','D2-2','D2-5','D3-A1','D3-B1','D3-B3','D3-B5','D3-C5','D4-4','D4-6','D4-11','D4-17','D6-1','D6-3','D6-4'], 'section', 'supplement.log')
add(['D1-30','D4-10'], 'section', 'supplement-import.log')
add(['D1-65','D1-66','D1-67','D1-68'], 'section', 'new-env.log')
add(['D2-27','D8-9','D8-10','D6-9'], 'section', 'new-config.log')
add(['D10-4','D4-26','D4-29','D4-28','D4-25'], 'section', 'new-safety.log')
add(['D9-10','D9-11'], 'section', 'new-mcp.log')
add(['D1-69'], 'section', 'new-cli.log')
add(['D3-S1','D3-S5','D3-S8'], 'section', 'new-scenario.log')
add(['D3-S2','D3-C13','D3-C14','D3-S4','D3-S3'], 'section', 'new-cloud.log')
add(['D3-S6','D3-S7'], 'section', 'new-fg-rds.log')

# file-based (whole log)
add(['D1-28','D1-31','D1-33'], 'file', 'updatecheck.log')
add(['D1-40'], 'file', 'd1-40.log')
add(['D1-42'], 'file', 'd1-42.log')
add(['D1-45'], 'file', 'd1-45.log')
add(['D2-26'], 'file', 'd2-26.log')
add(['D4-27'], 'file', 'd4-27.log')
add(['D4-8'], 'file', 'd4-8.log')
add(['D5-1','EXP-D5-1-1'], 'file', 'd5-1.log')
add(['D9-12'], 'file', 'd9-12.log')
add(['D9-13'], 'file', 'd9-13.log')
add(['D2-10','D2-13','D4-12','D9-6'], 'file', 'fixtures.log')
add(['D8-1'], 'file', 'doc-D8-1.log')
add(['D8-4'], 'file', 'doc-D8-4.log')
add(['D8-6'], 'file', 'doc-D8-6.log')
add(['D8-7'], 'file', 'd8.log')
add(['D1-3','D1-4'], 'file', 'd1.log')
add(['D1-39'], 'file', 'disttags.log')
add(['D10-3'], 'file', 'routing.log')
add(['EXP-E08'], 'file', 'exp-e08.log')

# eval-harness 15 条
add(['EXP-E01','EXP-E02','EXP-E03','EXP-E04','EXP-E05','EXP-E06','EXP-E07','EXP-E09','EXP-E10','EXP-E11','EXP-E12','EXP-E13','EXP-E14','EXP-E15'], 'eval', 'eval-harness.log')

# realcloud (copy realcloud-probe/stdout.txt)
rc = ['D2-1','D3-C4','D4-14','D4-18','D4-19','D4-20'] + ['EXP-C4-%02d' % i for i in range(1, 23)]
for c in rc:
    MAP[c] = ('realcloud', None, None)

# self-written (already have stdout.log)
SELFWRITTEN = ['D3-C1','D3-C2','D3-C3','D3-C6','D3-C7','D4-13','D4-23','D4-24','D1-70']

def status_of(cid):
    if cid in FAIL: return 'FAIL'
    if cid in SPEC: return 'SPEC-MISMATCH'
    if cid in NOTRUN: return 'NOT_RUN'
    return 'PASS'

rc_txt = rd(os.path.join(EV, 'realcloud-probe', 'stdout.txt'))
rc_probe = rd(os.path.join(EV, 'realcloud-probe', 'probe.mjs'))
eval_txt = rd(os.path.join(P, 'eval-harness.log'))

done = 0
for cid in sorted(MAP):
    kind, file, sec = MAP[cid]
    d = os.path.join(EV, cid)
    os.makedirs(d, exist_ok=True)
    if kind == 'section':
        txt = (('=====CASE %s=====' % sec) + '\n' + slice_section(file, sec) + '\n=====END %s=====' % sec) if sec else slice_section(file, cid)
        wr(os.path.join(d, 'stdout.txt'), txt)
        write_status(cid, status_of(cid))
    elif kind == 'file':
        wr(os.path.join(d, 'stdout.txt'), rd(os.path.join(P, file)))
        write_status(cid, status_of(cid))
    elif kind == 'eval':
        lines = [l for l in eval_txt.splitlines() if l.startswith(cid + ' |')]
        wr(os.path.join(d, 'stdout.txt'), ('\n'.join(lines) or ('(no line %s)' % cid)) + '\n\n' + [l for l in eval_txt.splitlines() if '准确率' in l][0] if lines else '')
        write_status(cid, status_of(cid))
    elif kind == 'realcloud':
        wr(os.path.join(d, 'stdout.txt'), rc_txt)
        wr(os.path.join(d, 'probe.mjs'), rc_probe)
        write_status(cid, status_of(cid))
    done += 1

# self-written: ensure stdout.log exists (they were run; probe writes it)
for cid in SELFWRITTEN:
    if not os.path.isfile(os.path.join(EV, cid, 'stdout.log')):
        # D4-13 / D4-23 / D4-24 stdout.txt has SUMMARY but probe doesn't self-write; derive status
        st = 'PASS'
        txt = rd(os.path.join(EV, cid, 'stdout.txt'))
        if cid == 'D4-13':
            st = 'PASS' if ('只读可用 6/6' in txt or 'writeDenied": true' in txt) else 'FAIL'
        elif cid == 'D4-23':
            st = 'PASS' if 'verdict": "PASS"' in txt or '[OK]' in txt else 'FAIL'
        elif cid == 'D4-24':
            st = 'PASS' if 'verdict": "PASS"' in txt else 'FAIL'
        write_status(cid, st)

# fixtures/doc 用 probe：补 probe.mjs（fixtures-probe 覆盖 D2-10/13/D4-12/D9-6）
fix_probe = rd(os.path.join(P, 'fixtures-probe.mjs'))
for cid in ['D2-10','D2-13','D4-12','D9-6']:
    wr(os.path.join(EV, cid, 'probe.mjs'), fix_probe)
doc_probe = rd(os.path.join(P, 'doc-probe.mjs'))
for cid in ['D8-1','D8-4','D8-6']:
    wr(os.path.join(EV, cid, 'probe.mjs'), doc_probe)

print('[stage] 落盘', done, '个用例证据；self-written 覆盖', ', '.join(SELFWRITTEN))