#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Hermes Linux 2026-10-31 每日测试证据落盘 + 状态。
把 probe 聚合日志切片写入每个 case-id 的 evidence/ 目录（stdout.txt + stdout.log(status)）。
状态基于今天（10-29）实际 re-run 的 probe 输出逐条判定，非复读昨日结论。
D4-13 今日已修复（只读子账号 CES ListMetrics 已放行，readPassRate=100%），故今日 PASS。
"""
import os, json, re, datetime

BASE = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(BASE, 'evidence', '_probes')
EV = os.path.join(BASE, 'evidence')
RC = os.path.join(EV, 'realcloud-probe')
TS = datetime.datetime.now().strftime('%Y%m%d%H%M%S')

def rd(p):
    if not os.path.isfile(p): return ''
    return open(p, encoding='utf-8', errors='replace').read()

def wr(dst, txt):
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    open(dst, 'w', encoding='utf-8').write(txt)

# --- 根因 WHY（文件:行号 + 语义） ---
WHY = {
    'D2-4':  "src/safety-policy.mjs:49 redactSecrets 键名正则仅匹配 key=value/空格形态，不匹配 JSON 带引号 key 形态：redactSecrets('{\"ak\":\"...\",\"sk\":\"...\"}') 与 '{\"access_key\":\"...\",\"secret_key\":\"...\"}' 均原样明文返回",
    'D4-2':  "src/safety-policy.mjs env-dump 检测未匹配裸 access_key/HW_ACCESS_KEY 形态：env|grep access_key 判 allow(risk=not_huaweicloud)",
    'D4-21': "safety/rules/cloud-risk-rules.json hwc-iam-admin-policy 仅匹配 JSON Action:* 形态，未覆盖 HCL actions=[\"*\"] 与 AdministratorFullAccess 托管策略引用(decision=allow)",
    'D9-12': "src/mcp-protocol.mjs initialize 不接 runVersionCheck(已下沉 check_cli)；dispatch 无 initialize 前置状态机，非法时序 tools/list 未拒 -32600",
    'D4-4':  "safety/policy.json:27 writeOperationPrefixes 缺 Change 前缀，ChangeServerOs/ChangeServer/ChangeVpc/ChangeInstanceConfiguration/ChangeVolumeType 判 allow(risk=unknown_read)",
    'D4-6':  "safety/rules/cloud-risk-rules.json hwc-command-adminpass-exposure stages 仅 artifact/deploy_plan，未覆盖 command 阶段(hook_check_command findings=[])；redactString 不匹配 --admin_pass 空格形态与 JSON 带引号 key",
    'D4-17': "src/risk-rule-engine.mjs 无规则命中默认 decision=allow(fail-open)：空串/空白/&&rm -rf/*/$(curl)/控制字符垃圾 均判 ok",
    'D3-C4': "src/tools.mjs huaweicloud_list_operations 对 DMS、DEW 两服务未返回 command/result（list_operations+plan 失败，22 服务中 2 个无规范路由）",
    'D3-S5': "src/tools.mjs serviceCatalog routeMap 单意图匹配，复合意图(存储+托管)未分解，多路命中=false",
    'D3-S6': "src/tools.mjs FunctionGraph CreateFunction 最小参数集缺 code(函数代码)，[USE_ERROR]Invalid parameter: code.zip_file，URN 未返回、触发器未绑定",
    'D3-S7': "src/tools.mjs RDS CreateInstance 最小参数集缺 db.password([USE_ERROR])；routeMap 无 Web 部署目标分解(部署目标命中=false)",
    'D4-25': "hooks/huaweicloud-safety.py WRITE_OPERATION_RE 前置捕获组致 hcloud vpc CreateVpc 遥测分类 cli:invoke(应 cli:write)",
    'D4-26': "src/risk-rule-engine.mjs redactEvidence 正则不匹配 JSON 带引号 key，secret_key/adminPass 明文残留(finding evidence 泄露)",
    'D10-3': "eval/harness 15 条中文意图路由 HIT=13 MISS=1 N/A=1，准确率 92.9%(<100%)；routeMap 缺「云主机」同义词",
    'EXP-E01':"src/tools.mjs routeMap ECS keywords 含云服务器/服务器/虚拟机但缺「云主机」口语化别名 -> serviceCatalog MISS",
    'EXP-C4-14':"src/tools.mjs huaweicloud_list_operations(DMS) 未返回 command/result",
    'EXP-C4-18':"src/tools.mjs huaweicloud_list_operations(DEW) 未返回 command/result",
    'D8-9':  "src/telemetry/telemetry.mjs sanitizeValue 仅去控制字符+超长截断，无 AK/SK/token 脱敏(SPEC:契约要求移除敏感值)",
    'D9-9':  "src/mcp-protocol.mjs initialize capabilities 仅 {tools:{}}，未声明 cancellation(SPEC)",
    'D10-4': "safety/rules/cloud-risk-rules.json 规则 16->19 条(9 deny+10 warn)，用例断言计数滞后(SPEC 契约漂移)",
    'D3-C3': "华为云沙箱服务维护中(HDKIT_SANDBOX_MAINTENANCE：沙箱功能正在升级优化)，connect 无法建立会话(外部依赖)",
    'D3-C6': "华为云沙箱服务维护中(HDKIT_SANDBOX_MAINTENANCE)，7 隐式工具 check_user/connect 均无法执行(外部依赖)",
    'D3-S3': "华为云沙箱服务维护中(HDKIT_SANDBOX_MAINTENANCE)，check_user 返回 realnameVerified=undefined(外部依赖)",
    'D1-39': "Windows 升级检测链 EINVAL 专属(OS 列标注「专属」)，Linux 侧由 EXP-NR3-10 覆盖",
    'D1-70': "undici@8.12.3 在 Node v22.13.0(arm64) 导入即崩：lib/interceptor/decompress.js:78 createZstdDecompress(来自 node:zlib)为 undefined 致 .bind() 报 TypeError；且 import('node:undici') 非 Node22.13 内建模块→回退裸 undici 崩溃。代理功能(有代理时走 undici ProxyAgent)整体不可用，探针崩溃遗留 proxy.json 污染",
}

FAIL = {'D2-4','D4-2','D4-21','D9-12','D4-4','D4-6','D4-17','D3-C4','D3-S5',
        'D3-S6','D3-S7','D4-25','D4-26','D10-3','EXP-E01','EXP-C4-14','EXP-C4-18',
        'D1-70'}
SPEC = {'D8-9','D9-9','D10-4'}
BLOCKED = {'D3-C3','D3-C6','D3-S3'}
NOT_RUN = {'D1-39'}

# --- 证据来源映射：case -> (kind, logfile, section) ---
MAP = {}
def add(cases, kind, logfile, sec=None):
    for c in cases:
        MAP[c] = (kind, logfile, sec)

for c in ['D4-1','D4-2','D4-3','D4-15','D4-16']: add([c], 'file', 'classify.log')
for c in ['D4-5','D4-7','D4-9','D4-21','D4-22']: add([c], 'file', 'hook.log')
for c in ['D2-11','D2-12']: add([c], 'file', 'auth.log')
for c in ['D9-1','D9-2','D9-3','D9-4','D9-5','D9-7','D9-8','D5-3']: add([c], 'file', 'protocol.log')
for c in ['D9-9','D2-16','D1-41']: add([c], 'file', 'extended.log')
for c in ['D1-26','D1-27','D2-2','D2-5','D3-A1','D3-B1','D3-B3','D3-B5','D3-C5','D4-6','D4-11','D4-17','D6-1','D6-3','D6-4']: add([c], 'file', 'supplement.log')
for c in ['D1-30','D4-10']: add([c], 'file', 'supplement-import.log')
for c in ['D1-65','D1-66','D1-67','D1-68']: add([c], 'file', 'new-env.log')
for c in ['D2-27','D8-9','D8-10','D6-9','D1-70']: add([c], 'file', 'new-config.log')
for c in ['D10-4','D4-26','D4-29','D4-28','D4-25']: add([c], 'file', 'new-safety.log')
for c in ['D9-10','D9-11']: add([c], 'file', 'new-mcp.log')
for c in ['D1-69']: add([c], 'file', 'new-cli.log')
for c in ['D3-S1','D3-S5','D3-S8']: add([c], 'file', 'new-scenario.log')
for c in ['D3-S2','D3-C13','D3-C14','D3-S4','D3-S3']: add([c], 'file', 'new-cloud.log')
for c in ['D3-S6','D3-S7']: add([c], 'file', 'new-fg-rds.log')
for c in ['D1-28','D1-31','D1-33']: add([c], 'file', 'updatecheck.log')
for c in ['D1-40']: add([c], 'file', 'd1-40.log')
for c in ['D1-42']: add([c], 'file', 'd1-42.log')
for c in ['D1-45']: add([c], 'file', 'd1-45.log')
for c in ['D2-26']: add([c], 'file', 'd2-26.log')
for c in ['D4-27']: add([c], 'file', 'd4-27.log')
for c in ['D4-8']: add([c], 'file', 'd4-8.log')
for c in ['D5-1']: add([c], 'file', 'd5-1.log')
for c in ['D9-12']: add([c], 'file', 'd9-12.log')
for c in ['D9-13']: add([c], 'file', 'd9-13.log')
for c in ['D2-10','D2-13','D4-12','D9-6']: add([c], 'file', 'fixtures.log')
for c in ['D8-1']: add([c], 'file', 'doc-D8-1.log')
for c in ['D8-4']: add([c], 'file', 'doc-D8-4.log')
for c in ['D8-6']: add([c], 'file', 'doc-D8-6.log')
for c in ['D1-3','D1-4']: add([c], 'file', 'd1.log')
for c in ['D8-7']: add([c], 'file', 'd8.log')
for c in ['D10-3']: add([c], 'file', 'routing.log')

# 展开级
add(['EXP-D5-8-1'], 'file', 'd5-1.log')
add(['EXP-D5-8-3'], 'file', 'protocol.log', 'D5-3')
add(['EXP-NR3-02'], 'file', 'supplement.log', 'D1-27')
add(['EXP-NR3-04'], 'file', 'd1-42.log')
add(['EXP-NR3-10'], 'file', 'disttags.log')
add(['D1-39'], 'file', 'disttags.log')  # NOT_RUN Windows专属，Linux 侧证据=NR3-10(disttags)
add(['EXP-NR3-24'], 'file', 'd1-45.log')
add(['EXP-E01','EXP-E02','EXP-E03','EXP-E04','EXP-E05','EXP-E06','EXP-E07','EXP-E09','EXP-E10','EXP-E11','EXP-E12','EXP-E13','EXP-E14','EXP-E15'], 'eval', 'eval-harness.log')
add(['EXP-E08'], 'file', 'exp-e08.log')

# 真云 probe 写入自身 stdout.log 的 heavy/aux
SELF = ['D3-C1','D3-C2','D3-C3','D3-C6','D3-C7','D4-13','D4-23','D4-24','D1-70','D4-4','D2-4']
# realcloud（D2-1/D3-C4/D4-14/D4-18/D4-19/D4-20 + EXP-C4-*）
RC_CASES = ['D2-1','D3-C4','D4-14','D4-18','D4-19','D4-20'] + ['EXP-C4-%02d' % i for i in range(1, 23)]

def status_of(cid):
    if cid in FAIL: return 'FAIL'
    if cid in SPEC: return 'SPEC-MISMATCH'
    if cid in BLOCKED: return 'BLOCKED'
    if cid in NOT_RUN: return 'NOT_RUN'
    return 'PASS'

def write_status(cid, status, why=''):
    d = {'status': status, 'executedAt': TS}
    if why: d['why'] = why
    wr(os.path.join(EV, cid, 'stdout.log'), json.dumps(d, ensure_ascii=False))

def get_section(logfile, section):
    txt = rd(os.path.join(P, logfile))
    if not section:
        return txt
    m = re.search(r'=====CASE %s=====(.*?)=====END %s=====' % (re.escape(section), re.escape(section)), txt, re.S)
    if m: return ('=====CASE %s=====\n' % section) + m.group(1).strip() + '\n=====END %s=====' % section
    # fallback: 也兼容 [c] 前缀行
    lines = [l for l in txt.splitlines() if l.startswith('[' + section)]
    return '\n'.join(lines) if lines else '(no section %s in %s)' % (section, logfile)

rc_txt = rd(os.path.join(RC, 'stdout.txt'))
rc_probe = rd(os.path.join(RC, 'probe.mjs'))
eval_txt = rd(os.path.join(P, 'eval-harness.log'))

done = 0
# 1) source/eval cases
for cid, item in sorted(MAP.items()):
    kind, logfile, sec = item
    d = os.path.join(EV, cid)
    os.makedirs(d, exist_ok=True)
    st = status_of(cid)
    if kind == 'file':
        txt = get_section(logfile, sec)
        wr(os.path.join(d, 'stdout.txt'), txt)
        write_status(cid, st, WHY.get(cid, ''))
    elif kind == 'eval':
        lines = [l for l in eval_txt.splitlines() if l.startswith(cid + ' |')]
        acc = [l for l in eval_txt.splitlines() if '准确率' in l or 'HIT=' in l]
        txt = ('\n'.join(lines) or '(no line %s)' % cid) + '\n\n' + ('\n'.join(acc) if acc else '')
        wr(os.path.join(d, 'stdout.txt'), txt)
        write_status(cid, st, WHY.get(cid, ''))
    done += 1

# 2) realcloud cases
for cid in RC_CASES:
    d = os.path.join(EV, cid)
    os.makedirs(d, exist_ok=True)
    wr(os.path.join(d, 'stdout.txt'), rc_txt)
    wr(os.path.join(d, 'probe.mjs'), rc_probe)
    write_status(cid, status_of(cid), WHY.get(cid, ''))
    done += 1

# 3) self-done cases (heavy/aux): 确保 stdout.txt 存在，stdout.log 用判定后的状态覆盖
for cid in SELF:
    d = os.path.join(EV, cid)
    os.makedirs(d, exist_ok=True)
    if not os.path.isfile(os.path.join(d, 'stdout.txt')):
        wr(os.path.join(d, 'stdout.txt'), rd(os.path.join(d, 'stdout.log')))
    write_status(cid, status_of(cid), WHY.get(cid, ''))

print('[stage] source/eval/realcloud 落盘 %d 用例；self-done %d' % (done, len(SELF)))
print('[stage] FAIL(%d): %s' % (len(FAIL), ', '.join(sorted(FAIL))))
print('[stage] SPEC(%d): %s' % (len(SPEC), ', '.join(sorted(SPEC))))
print('[stage] BLOCKED(%d): %s' % (len(BLOCKED), ', '.join(sorted(BLOCKED))))
print('[stage] NOT_RUN(%d): %s' % (len(NOT_RUN), ', '.join(sorted(NOT_RUN))))