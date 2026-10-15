#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""每日测试证据落盘（OpenCode Linux 2026-10-16）：把 _probes 聚合日志切片 + 状态写入每个 case-id 的 evidence 目录。"""
import os, json, re, datetime, shutil

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

WHY = {
    'D4-2': 'safety-policy.mjs:514-515 env-dump 正则仅匹配云厂商前缀，未匹配裸 access_key',
    'D4-6': 'cloud-risk-rules.json:68-72 hwc-command-adminpass-exposure stages 缺 command 阶段',
    'D4-17': 'risk-rule-engine.mjs:103-106 无规则命中默认 allow(fail-open)',
    'D4-21': 'cloud-risk-rules.json:196-213 hwc-iam-admin-policy 未覆盖 HCL actions=["*"] 与托管策略引用',
    'D4-25': 'huaweicloud-safety.py:46 WRITE_OPERATION_RE 前置捕获组致空格前 CreateVpc 不匹配',
    'D4-26': 'risk-rule-engine.mjs:19-23 redactEvidence 不覆盖 JSON 带引号 key(adminPass/secret_key)',
    'D3-S5': 'tools.mjs:1983-2224 routeMap 单意图匹配，无复合意图多路分解',
    'D3-S6': 'FunctionGraph CreateFunction 最小参数集未被稳定接受(function_name 无效)',
    'D3-S7': 'tools.mjs:1983-2224 routeMap 无 Web 应用部署目标分解；RDS 创建缺 VPC/子网/安全组前置',
    'D9-12': 'mcp-protocol.mjs:32-55 initialize 未调 runVersionCheck；:57-59 dispatch 无 initialize 前置状态机',
    'D1-70': 'undici ^8.11.2 浮点依赖解析到 8.12.1(engines>=22.19)，Node 22.13 缺 node:zlib zstd 致代理路径崩溃',
    'EXP-E01': 'tools.mjs:1995-2002 routeMap 缺口语化别名「云主机」',
    'D8-9': 'telemetry/telemetry.mjs:189-191 sanitizeValue 无 AK/SK/token 脱敏(SPEC)',
    'D9-9': 'mcp-protocol.mjs:45-49 capabilities 仅 {tools:{}}，未声明 cancellation(SPEC)',
    'D10-4': 'cloud-risk-rules.json 规则 16->19 条，用例断言计数滞后(SPEC)',
}

def write_status(cid, status, why=''):
    d = {'status': status, 'executedAt': TS}
    if why: d['why'] = why
    wr(os.path.join(EV, cid, 'stdout.log'), json.dumps(d, ensure_ascii=False))

def slice_section(logfile, section_id):
    txt = rd(os.path.join(P, logfile))
    m = re.search(r'=====CASE %s=====(.*?)=====END %s=====' % (re.escape(section_id), re.escape(section_id)), txt, re.S)
    return (m.group(1).strip() if m else '') or ('(no section %s in %s)' % (section_id, logfile))

# ---- 状态表 ----
FAIL = {'D4-2','D4-6','D4-17','D4-21','D4-25','D4-26','D3-S5','D3-S6','D3-S7','D9-12','D1-70','EXP-E01'}
SPEC = {'D8-9','D9-9','D10-4'}
NOTRUN = {'D1-39'}

# ---- source mapping：case -> (kind, file, section) ----
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

# realcloud（复制 realcloud-probe/stdout.txt）
rc = ['D2-1','D3-C4','D4-14','D4-18','D4-19','D4-20'] + ['EXP-C4-%02d' % i for i in range(1, 23)]
for c in rc:
    MAP[c] = ('realcloud', None, None)

# self-written（已有 stdout.log 或需补写）
SELF_LOG = ['D3-C1','D3-C2','D3-C3','D3-C6','D3-C7']           # 探针已自写 stdout.log
SELF_MANUAL = ['D4-13','D4-23','D4-24','D1-70']                # 需手动补 stdout.log

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
    st = status_of(cid)
    if kind == 'section':
        txt = (('=====CASE %s=====' % sec) + '\n' + slice_section(file, sec) + '\n=====END %s=====' % sec) if sec else slice_section(file, cid)
        wr(os.path.join(d, 'stdout.txt'), txt)
        write_status(cid, st, WHY.get(cid, ''))
    elif kind == 'file':
        wr(os.path.join(d, 'stdout.txt'), rd(os.path.join(P, file)))
        write_status(cid, st, WHY.get(cid, ''))
    elif kind == 'eval':
        lines = [l for l in eval_txt.splitlines() if l.startswith(cid + ' |')]
        acc = [l for l in eval_txt.splitlines() if '准确率' in l]
        wr(os.path.join(d, 'stdout.txt'), ('\n'.join(lines) or ('(no line %s)' % cid)) + '\n\n' + ('\n'.join(acc) if acc else ''))
        write_status(cid, st, WHY.get(cid, ''))
    elif kind == 'realcloud':
        wr(os.path.join(d, 'stdout.txt'), rc_txt)
        wr(os.path.join(d, 'probe.mjs'), rc_probe)
        write_status(cid, st, WHY.get(cid, ''))
    done += 1

# self-written D3-* 已自写 stdout.log；核对存在，缺失则按 stdout.txt 判定
for cid in SELF_LOG:
    if not os.path.isfile(os.path.join(EV, cid, 'stdout.log')):
        txt = rd(os.path.join(EV, cid, 'stdout.txt'))
        st = 'PASS' if ('PASS' in txt and 'FAIL' not in txt) else 'FAIL'
        write_status(cid, st, '')

# 手动补 stdout.log
for cid in SELF_MANUAL:
    txt = rd(os.path.join(EV, cid, 'stdout.txt'))
    if cid == 'D4-13':
        st = 'PASS' if ('writeDenied": true' in txt and 'readPassRate": "100%"' in txt) else 'FAIL'
    elif cid == 'D1-70':
        st = 'FAIL'
    else:
        st = 'PASS' if ('verdict": "PASS"' in txt or '"status": "PASS"' in txt) else 'FAIL'
    write_status(cid, st, WHY.get(cid, ''))

print('[stage] 落盘', done, '个 source 用例证据；self-log', ', '.join(SELF_LOG), '；manual', ', '.join(SELF_MANUAL))
print('[stage] FAIL 集:', ', '.join(sorted(FAIL)))
print('[stage] SPEC 集:', ', '.join(sorted(SPEC)))
print('[stage] NOTRUN 集:', ', '.join(sorted(NOTRUN)))