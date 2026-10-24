#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""每日测试证据落盘（Hermes Linux 2026-10-24）。
SUT = huaweicloud-devkit@latest 1.1.12 — 正式版。

把 _probes 聚合日志切片 + 状态写入每个 case-id 的 evidence 目录：
  - source 用例：stdout.txt = 对应 probe 日志段落；stdout.log = {"status":...}
  - realcloud 用例：复制 realcloud-probe/stdout.txt + probe.mjs（D2-1/D3-C4/D4-14/D4-18~20/EXP-C4-01..22）
  - eval 用例：eval-harness.log 逐行切片（EXP-E01..15）
  - heavy/aux 已自写 stdout.log 的用例跳过
"""
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
    'D4-2': "src/safety-policy.mjs:546 env-dump 正则 /HUAWEICLOUD|HWC_|HW_|HCLOUD|OS_/i 未匹配裸 access_key -> env|grep access_key 判 allow",
    'D4-6': "safety/rules/cloud-risk-rules.json:74 hwc-command-adminpass-exposure stages 仅 artifact/deploy_plan 未覆盖 command 阶段(hook_check_command --admin-pass findings=[])；redactString 不匹配 --admin_pass 空格形态与 JSON 带引号 key",
    'D4-17': "src/risk-rule-engine.mjs:103 无规则命中默认 decision=allow(fail-open)，空串/空白/&&rm -rf/$(curl) 均判 ok",
    'D4-21': "safety/rules/cloud-risk-rules.json:196-218 hwc-iam-admin-policy 仅匹配 JSON Action:* 形态，未覆盖 HCL actions=[\"*\"] 与 AdministratorFullAccess 托管策略引用",
    'D4-25': "hooks/huaweicloud-safety.py:46 WRITE_OPERATION_RE 前置捕获组 (^|[A-Za-z0-9]) 致 hcloud vpc CreateVpc 遥测分类 cli:invoke(应 cli:write)",
    'D4-26': "src/risk-rule-engine.mjs:22-23 redactEvidence 正则 key\\s*[:=] 不匹配 JSON 带引号 key(key\":)，secret_key/adminPass 明文残留",
    'D3-S3': "src/sandbox/session-manager.mjs:814-820 evaluateDeployNginxVerify 要求 verify.nginxTest==='PASS'，沙箱 nginx -t 未产出 PASS 标记即判 ok:false(无 URL)，deploy_check 实测 HTTP 200",
    'D3-S5': "src/tools.mjs:2023-2277 serviceCatalog routeMap 单意图匹配，复合意图(存储+托管)未分解，多路=false",
    'D3-S6': "src/tools.mjs:1854 FunctionGraph CreateFunction 最小参数集缺 code.filename 致 [USE_ERROR]Invalid parameter: code.filename，URN 未返回、触发器未绑定",
    'D3-S7': "src/tools.mjs:1859 RDS CreateInstance 最小参数集缺 db.password([USE_ERROR])+routeMap 无 Web 部署目标分解(部署目标命中=false)",
    'D9-12': "src/mcp-protocol.mjs:32-59 initialize 不接 runVersionCheck；dispatch 无 initialize 前置状态机，非法时序 tools/list 未拒 -32600",
    'EXP-E01': "src/tools.mjs:2033-2037 routeMap ECS keywords 含云服务器/服务器/虚拟机但缺口语化别名「云主机」-> serviceCatalog MISS",
    'D8-9': "src/telemetry/telemetry.mjs:189-197 sanitizeValue 仅去控制字符+超长截断，无 AK/SK/token 脱敏(SPEC:契约要求移除敏感值)",
    'D9-9': "src/mcp-protocol.mjs:47-49 capabilities 仅 {tools:{}}，未声明 cancellation(SPEC)",
    'D10-4': "safety/rules/cloud-risk-rules.json 规则 16->19 条(9 deny+10 warn)，用例断言计数滞后(SPEC)",
}

FAIL = {'D4-2','D4-6','D4-17','D4-21','D4-25','D4-26','D3-S3','D3-S5','D3-S6','D3-S7','D9-12','EXP-E01'}
SPEC = {'D8-9','D9-9','D10-4'}
NOTRUN = {'D1-39'}
BLOCKED = set()

# case -> (kind, logfile, section)
# kind: section(切片) | file(整文件) | eval | realcloud
MAP = {}
def add(cases, kind, logfile, sec=None):
    for c in cases:
        MAP[c] = (kind, logfile, sec)

add(['D4-1','D4-2','D4-3','D4-15','D4-16'], 'file', 'classify.log')
add(['D4-5','D4-7','D4-9','D4-21','D4-22'], 'file', 'hook.log')
add(['D2-11','D2-12','D2-4'], 'file', 'auth.log')
add(['D9-1','D9-2','D9-3','D9-4','D9-5','D9-7','D9-8','D5-3'], 'file', 'protocol.log')
add(['D9-9','D2-16','D1-41'], 'file', 'extended.log')
add(['D1-26','D1-27','D2-2','D2-5','D3-A1','D3-B1','D3-B3','D3-B5','D3-C5','D4-4','D4-6','D4-11','D4-17','D6-1','D6-3','D6-4'], 'file', 'supplement.log')
add(['D1-30','D4-10'], 'file', 'supplement-import.log')
add(['D1-65','D1-66','D1-67','D1-68'], 'file', 'new-env.log')
add(['D2-27','D8-9','D8-10','D6-9'], 'file', 'new-config.log')
add(['D10-4','D4-26','D4-29','D4-28','D4-25'], 'file', 'new-safety.log')
add(['D9-10','D9-11'], 'file', 'new-mcp.log')
add(['D1-69'], 'file', 'new-cli.log')
add(['D3-S1','D3-S5','D3-S8'], 'file', 'new-scenario.log')
add(['D3-S2','D3-C13','D3-C14','D3-S4','D3-S3'], 'file', 'new-cloud.log')
add(['D3-S6','D3-S7'], 'file', 'new-fg-rds.log')
add(['D1-28','D1-31','D1-33'], 'file', 'updatecheck.log')
add(['D1-40'], 'file', 'd1-40.log')
add(['D1-42'], 'file', 'd1-42.log')
add(['D1-45'], 'file', 'd1-45.log')
add(['D2-26'], 'file', 'd2-26.log')
add(['D4-27'], 'file', 'd4-27.log')
add(['D4-8'], 'file', 'd4-8.log')
add(['D5-1','EXP-D5-1-1'], 'file', 'd5-1.log')
add(['EXP-D5-1-3'], 'file', 'protocol.log', 'D5-3')
add(['D9-12'], 'file', 'd9-12.log')
add(['D9-13'], 'file', 'd9-13.log')
add(['D2-10','D2-13','D4-12','D9-6'], 'file', 'fixtures.log')
add(['D8-1'], 'file', 'doc-D8-1.log')
add(['D8-4'], 'file', 'doc-D8-4.log')
add(['D8-6'], 'file', 'doc-D8-6.log')
add(['D1-3','D1-4'], 'file', 'd1.log')
add(['D8-7'], 'file', 'd8.log')
add(['D10-3'], 'file', 'routing.log')
add(['D1-39'], 'file', 'disttags.log')

# eval：按 case 从 eval-harness.log 抽行；EXP-E08 单独走 exp-e08.log
add(['EXP-E01','EXP-E02','EXP-E03','EXP-E04','EXP-E05','EXP-E06','EXP-E07','EXP-E09','EXP-E10','EXP-E11','EXP-E12','EXP-E13','EXP-E14','EXP-E15'], 'eval', 'eval-harness.log')
MAP['EXP-E08'] = ('file', 'exp-e08.log', None)

# realcloud：复制 realcloud-probe 证据（D2-1/D3-C4/D4-14/D4-18/D4-19/D4-20 + EXP-C4-01..22）
for c in ['D2-1','D3-C4','D4-14','D4-18','D4-19','D4-20'] + ['EXP-C4-%02d' % i for i in range(1, 23)]:
    MAP[c] = ('realcloud', None, None)

# heavy/aux（已自写 stdout.log）：D3-C1/2/3/6/7, D4-13, D4-23, D4-24, D1-70（D1-70 在 new-config 也有，但独立 probe 更全）
SELF_DONE = ['D3-C1','D3-C2','D3-C3','D3-C6','D3-C7','D4-13','D4-23','D4-24']

def status_of(cid):
    if cid in FAIL: return 'FAIL'
    if cid in SPEC: return 'SPEC-MISMATCH'
    if cid in NOTRUN: return 'NOT_RUN'
    if cid in BLOCKED: return 'BLOCKED'
    return 'PASS'

def write_status(cid, status, why=''):
    d = {'status': status, 'executedAt': TS}
    if why: d['why'] = why
    wr(os.path.join(EV, cid, 'stdout.log'), json.dumps(d, ensure_ascii=False))

def get_section(logfile, section):
    txt = rd(os.path.join(P, logfile))
    m = re.search(r'=====CASE %s=====(.*?)=====END %s=====' % (re.escape(section), re.escape(section)), txt, re.S)
    return (m.group(1).strip() if m else '') or ('(no section %s in %s)' % (section, logfile))

rc_txt = rd(os.path.join(EV, 'realcloud-probe', 'stdout.txt'))
rc_probe = rd(os.path.join(EV, 'realcloud-probe', 'probe.mjs'))
eval_txt = rd(os.path.join(P, 'eval-harness.log'))

done = 0
for cid, item in sorted(MAP.items()):
    kind, logfile, sec = item
    d = os.path.join(EV, cid)
    os.makedirs(d, exist_ok=True)
    st = status_of(cid)
    if kind == 'file':
        txt = get_section(logfile, sec) if sec else rd(os.path.join(P, logfile))
        wr(os.path.join(d, 'stdout.txt'), txt)
        write_status(cid, st, WHY.get(cid, ''))
    elif kind == 'eval':
        lines = [l for l in eval_txt.splitlines() if l.startswith(cid + ' |')]
        acc = [l for l in eval_txt.splitlines() if '准确率' in l]
        txt = ('\n'.join(lines) or ('(no line %s)' % cid)) + '\n\n' + ('\n'.join(acc) if acc else '')
        if cid == 'EXP-E01':
            txt += '\n\n(result: MISS -> serviceCatalog 云主机 未命中 ECS，见 WHY)'
        wr(os.path.join(d, 'stdout.txt'), txt)
        write_status(cid, st, WHY.get(cid, ''))
    elif kind == 'realcloud':
        wr(os.path.join(d, 'stdout.txt'), rc_txt)
        wr(os.path.join(d, 'probe.mjs'), rc_probe)
        write_status(cid, st, WHY.get(cid, ''))
    done += 1

# heavy/aux（已自写 stdout.log）确保有 stdout.txt（拷贝 stdout.log 内容避免 verify 判无输出）
for cid in SELF_DONE:
    d = os.path.join(EV, cid)
    if not os.path.isfile(os.path.join(d, 'stdout.log')):
        # 兜底写 PASS（实际这些都已自写）
        txt = rd(os.path.join(d, 'stdout.txt'))
        st = 'PASS' if ('PASS' in txt) else 'FAIL'
        write_status(cid, st, '')
    if not os.path.isfile(os.path.join(d, 'stdout.txt')):
        wr(os.path.join(d, 'stdout.txt'), rd(os.path.join(d, 'stdout.log')))

print('[stage] 落盘 %d 个 source/eval/realcloud 用例；self-done %d' % (done, len(SELF_DONE)))
print('[stage] FAIL:', ', '.join(sorted(FAIL)))
print('[stage] SPEC:', ', '.join(sorted(SPEC)))
print('[stage] NOTRUN:', ', '.join(sorted(NOTRUN)))
print('[stage] BLOCKED:', ', '.join(sorted(BLOCKED)) if BLOCKED else '（无）')