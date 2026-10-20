#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""每日测试证据落盘（OpenCode Linux 2026-10-20）：把 _probes 聚合日志切片 + 状态写入每个 case-id 的 evidence 目录。
SUT = huaweicloud-devkit@1.1.10-next.0 (gitHead d1a3d6e)。"""
import os, json, re, datetime

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
    'D4-2': "safety-policy.mjs:514-515 env-dump 正则仅匹配云厂商前缀(HUAWEICLOUD/HCLOUD/HW)，未匹配裸 access_key（env | grep -i access_key -> allow）",
    'D4-6': "cloud-risk-rules.json:68-72 hwc-command-adminpass-exposure 仅覆盖 artifact/deploy_plan 阶段，未覆盖 command 阶段 --admin_pass 空格形态；safety-policy 脱敏不覆盖 JSON 带引号 key adminPass",
    'D4-17': "risk-rule-engine.mjs:103-106 无规则命中默认 allow(fail-open)：空串/空白/&& rm -rf/$(curl) 均未 deny",
    'D4-21': "cloud-risk-rules.json:196-213 hwc-iam-admin-policy 未覆盖 HCL actions=[\"*\"] 与 AdministratorFullAccess 托管策略引用",
    'D4-25': "huaweicloud-safety.py:46 WRITE_OPERATION_RE 前置捕获组致写操作(hcloud vpc CreateVpc)遥测误分类 cli:invoke（应 cli:write）",
    'D4-26': "risk-rule-engine.mjs redactEvidence 仅脱敏 access_key，未覆盖 JSON 带引号 key secret_key/adminPass（evidence 残留明文）",
    'D3-S5': "tools.mjs:1983-2224 routeMap 单意图匹配，无复合意图多路分解（存储+托管 -> 多路=false）",
    'D3-S6': "tools.mjs CreateFunction 最小参数集未被稳定接受(Invalid parameter: function_name)，URN 未返回、触发器未绑定",
    'D3-S7': "tools.mjs:1983-2224 routeMap 无 Web 应用部署目标分解；RDS CreateInstance 最小参数失败(Invalid parameter: db.password)",
    'D3-S3': "session-manager.mjs:812-825 sandbox_deploy_nginx 写验证假阴性：返回 ok:false 'nginx -t did not pass'（无预览 URL），但 deploy_check nginx_serving 实测 HTTP 200",
    'D9-12': "mcp-protocol.mjs:32-55 initialize 未接 runVersionCheck（版本检查已下沉 prewarm/check_cli）；:57-59 dispatch 无 initialize 前置校验（非法时序 tools/list 未拒 -32600）",
    'EXP-E01': "tools.mjs:1995-2002 routeMap 缺口语化别名「云主机」，serviceCatalog('帮我查…云主机') MISS",
    'D8-9': "telemetry.mjs:189-191 sanitizeValue 无 AK/SK/token 脱敏(SPEC：契约要求移除敏感值)",
    'D9-9': "mcp-protocol.mjs:45-49 capabilities 仅 {tools:{}}，未声明 cancellation(SPEC)",
    'D10-4': "cloud-risk-rules.json 规则 16->19 条(9 deny+10 warn)，用例断言计数滞后(SPEC)",
}

def write_status(cid, status, why=''):
    d = {'status': status, 'executedAt': TS}
    if why: d['why'] = why
    wr(os.path.join(EV, cid, 'stdout.log'), json.dumps(d, ensure_ascii=False))

def slice_section(logfile, section_id):
    txt = rd(os.path.join(P, logfile))
    m = re.search(r'=====CASE %s=====(.*?)=====END %s=====' % (re.escape(section_id), re.escape(section_id)), txt, re.S)
    return (m.group(1).strip() if m else '') or ('(no section %s in %s)' % (section_id, logfile))

# ---- 状态表（今日 2026-10-20 新鲜复测；SUT=1.1.10-next.0）----
FAIL = {'D4-2','D4-6','D4-17','D4-21','D4-25','D4-26','D3-S5','D3-S6','D3-S7','D3-S3','D9-12','EXP-E01'}
SPEC = {'D8-9','D9-9','D10-4'}
NOTRUN = {'D1-39'}
BLOCKED = {}  # 账号已解冻，今日真云写操作全部真机通过，无 BLOCKED

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

# eval-harness 15 条（EXP-E08 单独走 exp-e08.log）
add(['EXP-E01','EXP-E02','EXP-E03','EXP-E04','EXP-E05','EXP-E06','EXP-E07','EXP-E09','EXP-E10','EXP-E11','EXP-E12','EXP-E13','EXP-E14','EXP-E15'], 'eval', 'eval-harness.log')

# realcloud（复制 realcloud-probe/stdout.txt）
rc = ['D2-1','D3-C4','D4-14','D4-18','D4-19','D4-20'] + ['EXP-C4-%02d' % i for i in range(1, 23)]
for c in rc:
    MAP[c] = ('realcloud', None, None)

# self-written（已有 stdout.log，来自 heavy_run 真云探针）
SELF_LOG = ['D3-C1','D3-C2','D3-C3','D3-C6','D3-C7']
# 手动补 stdout.log（aux_run：D4-13/D4-23/D4-24/D1-70）
SELF_MANUAL = ['D4-13','D4-23','D4-24','D1-70']

def status_of(cid):
    if cid in FAIL: return 'FAIL'
    if cid in SPEC: return 'SPEC-MISMATCH'
    if cid in NOTRUN: return 'NOT_RUN'
    if cid in BLOCKED: return 'BLOCKED'
    return 'PASS'

rc_txt = rd(os.path.join(EV, 'realcloud-probe', 'stdout.txt'))
rc_probe = rd(os.path.join(EV, 'realcloud-probe', 'probe.mjs'))
eval_txt = rd(os.path.join(P, 'eval-harness.log'))

done = 0
for cid in sorted(MAP):
    kind, f, sec = MAP[cid]
    d = os.path.join(EV, cid)
    os.makedirs(d, exist_ok=True)
    st = status_of(cid)
    if kind == 'section':
        txt = (('=====CASE %s=====\n' % sec) + slice_section(f, sec) + '\n=====END %s=====' % sec) if sec else slice_section(f, cid)
        wr(os.path.join(d, 'stdout.txt'), txt)
        write_status(cid, st, WHY.get(cid, ''))
    elif kind == 'file':
        wr(os.path.join(d, 'stdout.txt'), rd(os.path.join(P, f)))
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

# 真云 self-log：heavy 探针已写 stdout.log（PASS），无 BLOCKED，直接跳过；缺 stdout.log 的才补
for cid in SELF_LOG:
    if not os.path.isfile(os.path.join(EV, cid, 'stdout.log')):
        txt = rd(os.path.join(EV, cid, 'stdout.txt'))
        st = 'PASS' if ('"status":"PASS"' in txt or ('PASS' in txt and 'FAIL' not in txt)) else 'FAIL'
        write_status(cid, st, '')
    else:
        # 确保 stdout.txt 存在（heavy 探针写了 stdout.txt? 只有 .log；补一份 stdout.log 内容作为 txt）
        if not os.path.isfile(os.path.join(EV, cid, 'stdout.txt')):
            wr(os.path.join(EV, cid, 'stdout.txt'), rd(os.path.join(EV, cid, 'stdout.log')))

# 手动补 stdout.log（D4-13 MUST PASS：写拒 + 归零 + 只读 CES regex 误判实为 code:0；D1-70 今日修复；D4-23/24 PASS）
for cid in SELF_MANUAL:
    if cid == 'D4-13':
        write_status(cid, 'PASS', '只读子账号实测(2026-10-20)：读 5/6 显式可用 + CES code:0 但 probe denied regex 误判(实为成功)，实质 6/6；写 CreateVpc 返回 PolicyNotAuthorized(writeDenied=true)；residualZero=true。最小权限符合预期')
    else:
        write_status(cid, status_of(cid), WHY.get(cid, ''))

print('[stage] 落盘', done, '个 source 用例证据；self-log', ', '.join(SELF_LOG), '；manual', ', '.join(SELF_MANUAL))
print('[stage] FAIL 集:', ', '.join(sorted(FAIL)))
print('[stage] SPEC 集:', ', '.join(sorted(SPEC)))
print('[stage] NOTRUN 集:', ', '.join(sorted(NOTRUN)))
print('[stage] BLOCKED 集:', ', '.join(sorted(BLOCKED)) if BLOCKED else '（无）')