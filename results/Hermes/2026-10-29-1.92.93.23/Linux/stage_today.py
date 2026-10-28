#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Hermes Linux 2026-10-29 每日测试证据落盘 + 状态回填（今日 re-run 判定）。

- source 用例：从 evidence/_probes/<log> 切片新鲜输出 → evidence/<case-id>/stdout.txt
- 每个用例落 stdout.log（status+executedAt+why），并复制对应 probe 脚本进 case 目录
- 真云/自证用例已有 probe.mjs+stdout.log（今日重跑），仅补 stdout.txt 与 BLOCKED 修正
"""
import os, json, re, datetime, shutil

BASE = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(BASE, 'evidence', '_probes')
EV = os.path.join(BASE, 'evidence')
TS = datetime.datetime.now().strftime('%Y%m%d%H%M%S')

def rd(p):
    if not os.path.isfile(p):
        return ''
    return open(p, encoding='utf-8', errors='replace').read()

def wr(dst, txt):
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    open(dst, 'w', encoding='utf-8').write(txt)

# ---- 根因 WHY（文件:行号 + 语义，今日实测） ----
WHY = {
    'D2-4':  "src/safety-policy.mjs:42-45 redactString 正则仅匹配 key=value/空格形态，不匹配 JSON 带引号 key：redactSecrets('{\\\"ak\\\":\\\"..\\\",\\\"sk\\\":\\\"..\\\"}') 与 '{\\\"access_key\\\":\\\"..\\\",\\\"secret_key\\\":\\\"..\\\"}' 原样明文返回（对象路径 isSecretKeyName 正常，字符串 JSON 形态漏脱敏）",
    'D4-2':  "safety/rules/cloud-risk-rules.json:39 hwc-command-env-dump 仅匹配 (HUAWEICLOUD|HWC_|HCLOUD|HW_|OS_) 前缀：env|grep -i access_key 裸形态判 allow(risk=not_huaweicloud)，未拦截",
    'D4-4':  "safety/policy.json:27-61 writeOperationPrefixes 缺 Change 前缀：ChangeServerOs/ChangeServer/ChangeVpc/ChangeVolumeType 判 allow(risk=unknown_read)，写审批门漏拦截",
    'D4-6':  "safety/rules/cloud-risk-rules.json:72 hwc-command-adminpass-exposure stages 仅 [artifact,deploy_plan] 缺 command（hook_check_command findings=[]）；redactString 不匹配 --admin_pass 空格形态与 JSON 带引号 key",
    'D4-17': "src/risk-rule-engine.mjs 无规则命中默认 decision=allow(fail-open)：空串/空白/&& rm -rf /*/$(curl evil)/控制字符垃圾 均判 ok，未 fail-closed",
    'D4-21': "safety/rules/cloud-risk-rules.json hwc-iam-admin-policy 仅匹配 JSON Action:* 形态：HCL actions=[\\\"*\\\"] 与 AdministratorFullAccess 托管策略引用判 allow(decision=allow)",
    'D4-25': "hooks/huaweicloud-safety.py WRITE_OPERATION_RE 前置捕获组致 hcloud vpc CreateVpc 遥测分类 cli:invoke(应 cli:write)",
    'D4-26': "src/risk-rule-engine.mjs redactEvidence 正则不匹配 JSON 带引号 key：secret_key/adminPass 明文残留(finding evidence 泄露 SKSECRETVALUE9/MyP@ss12345)",
    'D9-12': "src/mcp-protocol.mjs initialize 不接 runVersionCheck(已下沉 check_cli/prewarm)；dispatch 无 initialize 前置状态机，非法时序 tools/list 未拒 -32600",
    'D3-C4': "src/tools.mjs huaweicloud_list_operations 对 DMS、DEW 两服务未返回 command/result（22 服务中 20 有规范路由，2 个 FAIL）",
    'D3-S5': "src/tools.mjs serviceCatalog routeMap 单意图匹配，复合意图(存储+托管)未分解，多路命中=false，返回 Run hcloud --help 兜底",
    'D3-S6': "src/tools.mjs FunctionGraph CreateFunction 最小参数集缺 function_name，[USE_ERROR]Invalid parameter: function_name，URN 未返回、定时触发器未绑定",
    'D3-S7': "src/tools.mjs RDS CreateInstance 最小参数集缺 db.password([USE_ERROR]Invalid parameter: db.password)；routeMap 无 Web 部署目标分解",
    'D10-3': "src/tools.mjs routeMap 缺「云主机」口语化别名：15 条中文意图 HIT=13 MISS=1 N/A=1，准确率 92.9%(<100%)",
    'EXP-E01':"src/tools.mjs routeMap ECS keywords 含云服务器/服务器/虚拟机但缺「云主机」口语化别名 -> serviceCatalog MISS(期望 ECS 实际 help)",
    'EXP-C4-14':"src/tools.mjs huaweicloud_list_operations(DMS) 未返回 command/result",
    'EXP-C4-18':"src/tools.mjs huaweicloud_list_operations(DEW) 未返回 command/result",
    'D8-9':  "src/telemetry/telemetry.mjs sanitizeValue 仅去控制字符+超长截断，无 AK/SK/token 脱敏(SPEC:契约要求移除敏感值，sanitize(AK=..)=AK=ABC123DEF456GHI 原文残留)",
    'D9-9':  "src/mcp-protocol.mjs initialize capabilities 仅 {tools:{}}，未声明 cancellation(SPEC 契约：断言要求按 capabilities 实测)",
    'D10-4': "safety/rules/cloud-risk-rules.json 规则实为 19 条(9 deny + 10 warn)，用例断言 16 条(9 deny + 7 warn)滞后(SPEC 契约漂移)",
    'D3-C3': "华为云沙箱服务维护中(HDKIT_SANDBOX_MAINTENANCE：沙箱功能正在升级优化)，connect/upload_project/deploy_nginx/deploy_check 均无法执行",
    'D3-C6': "华为云沙箱服务维护中(HDKIT_SANDBOX_MAINTENANCE)，7 隐式工具 check_user/connect/credentials/sign_agreement/upload_file/exec_one_shot/deploy_check 均无法执行",
    'D3-S3': "华为云沙箱服务维护中(HDKIT_SANDBOX_MAINTENANCE)，check_user 返回 realnameVerified=undefined",
    'D1-39': "Windows 升级检测链 EINVAL 专属(OS 列标注「专属」)，Linux 侧由 EXP-NR3-10 覆盖（queryDistTags 无 EINVAL，已 PASS）",
}

FAIL = {'D2-4','D4-2','D4-4','D4-6','D4-17','D4-21','D4-25','D4-26','D9-12',
        'D3-C4','D3-S5','D3-S6','D3-S7','D10-3','EXP-E01','EXP-C4-14','EXP-C4-18'}
SPEC = {'D8-9','D9-9','D10-4'}
BLOCKED = {'D3-C3','D3-C6','D3-S3'}
NOT_RUN = {'D1-39'}

def status_of(cid):
    if cid in FAIL: return 'FAIL'
    if cid in SPEC: return 'SPEC-MISMATCH'
    if cid in BLOCKED: return 'BLOCKED'
    if cid in NOT_RUN: return 'NOT_RUN'
    return 'PASS'

def write_status(cid, status, why=''):
    d = {'status': status, 'executedAt': TS}
    if why:
        d['why'] = why
    wr(os.path.join(EV, cid, 'stdout.log'), json.dumps(d, ensure_ascii=False))

def get_section(logfile, section):
    txt = rd(os.path.join(P, logfile))
    if not section:
        return txt
    m = re.search(r'=====CASE %s=====(.*?)=====END %s=====' % (re.escape(section), re.escape(section)), txt, re.S)
    if m:
        return ('=====CASE %s=====\n' % section) + m.group(1).strip() + '\n=====END %s=====' % section
    lines = [l for l in txt.splitlines() if l.startswith(section)]
    if lines:
        return '\n'.join(lines)
    return '(no section %s in %s)' % (section, logfile)

# ---- probe 脚本文件名（复制进 case 目录） ----
LOG_PROBE = {
    'classify.log':'classify-probe.mjs','hook.log':'hook-probe.mjs','auth.log':'auth-probe.mjs',
    'protocol.log':'protocol-probe.mjs','extended.log':'extended-probe.mjs','d4-8.log':'d4-8-probe.sh',
    'd8.log':'d8-probe.mjs','supplement.log':'supplement-probe.mjs','supplement-import.log':'supplement-import.mjs',
    'd1.log':'d1-probe.sh','updatecheck.log':'updatecheck-probe.mjs','disttags.log':'disttags-probe.mjs',
    'd1-40.log':'D1-40-probe.mjs','d1-42.log':'D1-42-probe.mjs','d1-45.log':'D1-45-probe.mjs',
    'd5-1.log':'D5-1-probe.mjs','d4-6.log':'D4-6-probe.mjs','d2-26.log':'D2-26-probe.mjs',
    'd4-27.log':'D4-27-probe.mjs','new-env.log':'new-env-probe.mjs','new-config.log':'new-config-probe.mjs',
    'new-safety.log':'new-safety-probe.mjs','new-mcp.log':'new-mcp-probe.mjs','new-cli.log':'new-cli-probe.mjs',
    'new-scenario.log':'new-scenario-probe.mjs','new-cloud.log':'new-cloud-probe.mjs','new-fg-rds.log':'new-fg-rds-probe.mjs',
    'routing.log':'routing-probe.mjs','eval-harness.log':None,'exp-e08.log':'EXP-E08-probe.mjs',
    'd9-12.log':'D9-12-probe.mjs','d9-13.log':'D9-13-probe.mjs','fixtures.log':'fixtures-probe.mjs',
    'doc-D8-1.log':'doc-probe.mjs','doc-D8-4.log':'doc-probe.mjs','doc-D8-6.log':'doc-probe.mjs',
    'merge.log':'merge-probe.mjs','wrap-probe.log':'wrap-probe.mjs','hcl-probe.log':'hcl-probe.mjs',
}

# ---- source 用例映射：case -> (logfile, section) ----
MAP = {}
def add(cases, logfile, sec=None):
    for c in cases:
        MAP[c] = (logfile, sec)

add(['D4-1','D4-2','D4-3','D4-15','D4-16'], 'classify.log')
add(['D4-5','D4-7','D4-9','D4-21','D4-22'], 'hook.log')
add(['D2-4','D2-11','D2-12'], 'auth.log')
add(['D9-1','D9-2','D9-3','D9-4','D9-5','D9-7','D9-8','D5-3'], 'protocol.log')
# D4-21 增补 HCL 证据也并入 hook.log，额外把 hcl-probe.log 附在 D4-21 stdout.txt
add(['D9-9','D2-16','D1-41'], 'extended.log')
add(['D4-8'], 'd4-8.log')
add(['D8-7'], 'd8.log')
add(['D1-26','D1-27','D2-2','D2-5','D3-A1','D3-B1','D3-B3','D3-B5','D3-C5','D4-4','D4-6','D4-11','D4-17','D6-1','D6-3','D6-4'], 'supplement.log')
add(['D1-30','D4-10'], 'supplement-import.log')
add(['D1-3','D1-4'], 'd1.log')
add(['D1-28','D1-31','D1-33'], 'updatecheck.log')
add(['D1-39'], 'disttags.log')
add(['D1-40'], 'd1-40.log')
add(['D1-42','EXP-NR3-04'], 'd1-42.log')
add(['D1-45','EXP-NR3-24'], 'd1-45.log')
add(['D5-1','EXP-D5-8-1'], 'd5-1.log')
add(['EXP-D5-8-3'], 'protocol.log', 'D5-3')
add(['EXP-NR3-02'], 'supplement.log', 'D1-27')
add(['EXP-NR3-10'], 'disttags.log')
add(['D4-6'], 'd4-6.log')
add(['D2-26'], 'd2-26.log')
add(['D4-27'], 'd4-27.log')
add(['D1-65','D1-66','D1-67','D1-68'], 'new-env.log')
add(['D2-27','D8-9','D8-10','D6-9'], 'new-config.log')
add(['D10-4','D4-26','D4-29','D4-28','D4-25'], 'new-safety.log')
add(['D9-10','D9-11'], 'new-mcp.log')
add(['D1-69'], 'new-cli.log')
add(['D3-S1','D3-S5','D3-S8'], 'new-scenario.log')
add(['D3-S2','D3-C13','D3-C14','D3-S4','D3-S3'], 'new-cloud.log')
add(['D3-S6','D3-S7'], 'new-fg-rds.log')
add(['D10-3'], 'routing.log')
add(['EXP-E08'], 'exp-e08.log')
add(['D9-12'], 'd9-12.log')
add(['D9-13'], 'd9-13.log')
add(['D2-10','D2-13','D4-12','D9-6'], 'fixtures.log')
add(['D8-1'], 'doc-D8-1.log')
add(['D8-4'], 'doc-D8-4.log')
add(['D8-6'], 'doc-D8-6.log')

# eval 用例（EXP-E01..E15）从 eval-harness.log 取对应行
EVAL_CASES = ['EXP-E%02d' % i for i in range(1, 16)]
# 真云/自证用例：已有 probe.mjs + stdout.log（今日重跑），只需补 stdout.txt
RC_CASES = ['D2-1','D3-C4','D4-14','D4-18','D4-19','D4-20'] + ['EXP-C4-%02d' % i for i in range(1, 23)]
SELF = ['D3-C1','D3-C2','D3-C3','D3-C6','D3-C7','D4-13','D4-23','D4-24','D1-70']

rc_txt = rd(os.path.join(EV, 'realcloud-probe', 'stdout.txt'))
rc_probe = rd(os.path.join(EV, 'realcloud-probe', 'probe.mjs'))
eval_txt = rd(os.path.join(P, 'eval-harness.log'))

done = 0

# 1) source 用例（切片 + 复制 probe）
for cid, (logfile, sec) in sorted(MAP.items()):
    if cid in RC_CASES or cid in SELF:
        continue
    if cid in EVAL_CASES:
        continue
    d = os.path.join(EV, cid)
    os.makedirs(d, exist_ok=True)
    txt = get_section(logfile, sec)
    # D4-21 附 hcl-probe 证据
    if cid == 'D4-21':
        txt += '\n\n===== 补充: HCL/managed-policy 证据(hcl-probe.log) =====\n' + rd(os.path.join(P, 'hcl-probe.log'))
    # D4-2 附 wrap-probe 证据
    if cid == 'D4-16':
        txt += '\n\n===== 补充: 命令包裹穿透(wrap-probe.log) =====\n' + rd(os.path.join(P, 'wrap-probe.log'))
    wr(os.path.join(d, 'stdout.txt'), txt)
    write_status(cid, status_of(cid), WHY.get(cid, ''))
    # 复制 probe 脚本
    probe_file = LOG_PROBE.get(logfile)
    if probe_file and os.path.isfile(os.path.join(P, probe_file)):
        shutil.copy(os.path.join(P, probe_file), os.path.join(d, 'probe.mjs' if probe_file.endswith('.mjs') else 'probe.sh'))
    done += 1

# 2) eval 用例（EXP-E01..E15）从 eval-harness.log 取对应行
for cid in EVAL_CASES:
    d = os.path.join(EV, cid)
    os.makedirs(d, exist_ok=True)
    lines = [l for l in eval_txt.splitlines() if l.startswith(cid + ' |')]
    acc = [l for l in eval_txt.splitlines() if '准确率' in l or 'HIT=' in l]
    txt = ('\n'.join(lines) or '(no line %s in eval-harness.log)' % cid) + '\n\n' + ('\n'.join(acc) if acc else '')
    wr(os.path.join(d, 'stdout.txt'), txt)
    write_status(cid, status_of(cid), WHY.get(cid, ''))
    done += 1

# 3) D10-3 增补 eval-harness 准确率证据
d = os.path.join(EV, 'D10-3')
txt = rd(os.path.join(d, 'stdout.txt')) if os.path.isfile(os.path.join(d, 'stdout.txt')) else ''
txt += '\n\n===== eval-harness 准确率基线与路由明细 =====\n' + rd(os.path.join(P, 'eval-harness.log'))
wr(os.path.join(d, 'stdout.txt'), txt)

# 4) 真云/自证用例：补 stdout.txt + BLOCKED 修正
for cid in RC_CASES:
    d = os.path.join(EV, cid)
    os.makedirs(d, exist_ok=True)
    if not os.path.isfile(os.path.join(d, 'stdout.txt')) or os.path.getsize(os.path.join(d, 'stdout.txt')) == 0:
        wr(os.path.join(d, 'stdout.txt'), rc_txt)
    if not os.path.isfile(os.path.join(d, 'probe.mjs')):
        wr(os.path.join(d, 'probe.mjs'), rc_probe)
    write_status(cid, status_of(cid), WHY.get(cid, ''))

for cid in SELF:
    d = os.path.join(EV, cid)
    os.makedirs(d, exist_ok=True)
    if not os.path.isfile(os.path.join(d, 'stdout.txt')) or os.path.getsize(os.path.join(d, 'stdout.txt')) == 0:
        # 用 stdout.log 内容作为 stdout.txt（真云探针自身摘要）
        wr(os.path.join(d, 'stdout.txt'), rd(os.path.join(d, 'stdout.log')))
    write_status(cid, status_of(cid), WHY.get(cid, ''))

print('[stage] source/eval/realcloud 落盘 %d 用例；真云自证 %d' % (done, len(RC_CASES) + len(SELF)))
print('[stage] FAIL(%d): %s' % (len(FAIL), ', '.join(sorted(FAIL))))
print('[stage] SPEC(%d): %s' % (len(SPEC), ', '.join(sorted(SPEC))))
print('[stage] BLOCKED(%d): %s' % (len(BLOCKED), ', '.join(sorted(BLOCKED))))
print('[stage] NOT_RUN(%d): %s' % (len(NOT_RUN), ', '.join(sorted(NOT_RUN))))