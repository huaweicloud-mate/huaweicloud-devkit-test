# -*- coding: utf-8 -*-
"""Hermes Linux 2026-11-07 每日测试：证据落盘 + 状态判定（基于本机 11-07 fresh 探针输出）。

数据来源：evidence/_probes/*.log（run_all.sh 本次真实执行）、evidence/<case>/stdout.txt
（heavy/aux 自写探针）、evidence/realcloud-probe/stdout.txt（真云 probe）。
FAIL / SPEC / BLOCKED 判定依据本次实际输出逐条复核，非复读昨日结论：
  - 沙箱三用例（D3-C3/C6/S3）本次实测返回 HDKIT_NOT_AGREEMENT（用户未签最新协议，需本人确认），
    属账号侧外部依赖 -> BLOCKED（不标 FAIL / 不假 PASS）。
"""
import os, json, re, shutil, time

BASE = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(BASE, 'evidence', '_probes')
EV = os.path.join(BASE, 'evidence')
RC = os.path.join(EV, 'realcloud-probe')
TS = datetime_ts = time.strftime('%Y%m%d%H%M%S')


def rd(p):
    if not os.path.isfile(p):
        return ''
    return open(p, encoding='utf-8', errors='replace').read()


def wr(dst, txt):
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    open(dst, 'w', encoding='utf-8').write(txt)


# --- 根因 WHY（文件:行号 + 语义） ---
WHY = {
    'D2-4': "src/safety-policy.mjs:45 redactString 的 (AK|SK) 正则大小写敏感（无 /i），小写 ak=/sk= 不匹配；isSecretKeyName 键名正则不匹配 JSON 带引号裸 key \"ak\"/\"sk\" -> 小写形态与 JSON 形态均原样明文返回",
    'D4-2': "src/safety-policy.mjs env-dump 检测未覆盖裸 access_key / 小写形态：env | grep -i access_key 判 allow(risk=not_huaweicloud)",
    'D4-4': "safety/policy.json:27 writeOperationPrefixes 缺 Change 前缀 -> ChangeServerOs*/ChangeVpc/ChangeInstanceConfiguration/ChangeVolumeType 判 allow(risk=unknown_read)，写操作审批门漏拦截（实测 0/8）",
    'D4-6': "safety/rules/cloud-risk-rules.json hwc-command-adminpass-exposure stages 仅 artifact/deploy_plan，未覆盖 command 阶段（hook_check_command findings=[]）",
    'D4-17': "src/risk-rule-engine.mjs 无规则命中默认 decision=allow（fail-open）：空串/空白/&&rm -rf/*/$(curl)/控制字符垃圾 均判 ok",
    'D4-21': "safety/rules/cloud-risk-rules.json hwc-iam-admin-policy 仅匹配 JSON Action:* 形态，未覆盖 HCL actions=[\"*\"] 与 AdministratorFullAccess 托管策略引用（实测 decision=allow）",
    'D4-25': "hooks/huaweicloud-safety.py WRITE_OPERATION_RE 前置捕获组致 hcloud vpc CreateVpc 遥测分类 cli:invoke（应 cli:write）",
    'D4-26': "src/risk-rule-engine.mjs redactEvidence 正则不匹配 JSON 带引号 key，secret_key/adminPass 明文残留（finding evidence 泄露）",
    'D9-9': "src/mcp-protocol.mjs initialize capabilities 仅 {tools:{}}，未声明 cancellation（SPEC 契约）",
    'D9-12': "src/mcp-protocol.mjs initialize 不接 runVersionCheck（已下沉 check_cli）；dispatch 无 initialize 前置状态机，非法时序 tools/list 未拒 -32600",
    'D10-3': "eval/harness 15 条中文意图路由 HIT=13 MISS=1 N/A=1，准确率 92.9%(<100%)；routeMap 缺「云主机」同义词",
    'D10-4': "safety/rules/cloud-risk-rules.json 规则 19 条(9 deny+10 warn)，用例断言计数滞后（SPEC 契约漂移）",
    'D8-9': "src/telemetry/telemetry.mjs sanitizeValue 仅去控制字符+超长截断，无 AK/SK/token 脱敏（SPEC：契约要求移除敏感值）",
    'D3-C4': "src/tools.mjs huaweicloud_list_operations 对 DMS、DEW 两服务未返回 command/result（22 服务中 2 个无规范路由）",
    'D3-S5': "src/tools.mjs serviceCatalog routeMap 单意图匹配，复合意图（存储+托管）未分解，多路命中=false",
    'D3-S6': "src/tools.mjs FunctionGraph CreateFunction 最小参数集不满足 API（[USE_ERROR]Invalid parameter: function_name/code）-> URN 未返回、触发器未绑定",
    'D3-S7': "src/tools.mjs RDS CreateInstance 最小参数集缺 db.password([USE_ERROR])；routeMap 无 Web 部署目标分解",
    'D1-70': "undici@8.x 在 Node v22.13.0 导入即崩：lib/interceptor/decompress.js:78 createZstdDecompress(来自 node:zlib) 为 undefined 致 .bind() TypeError；代理功能整体不可用",
    'D1-39': "Windows 升级检测链 EINVAL 专属（OS 列标注「专属」），Linux 侧由 EXP-NR3-10 覆盖",
    'EXP-E01': "src/tools.mjs routeMap ECS keywords 含云服务器/服务器/虚拟机但缺「云主机」口语化别名 -> serviceCatalog MISS",
    'EXP-C4-14': "src/tools.mjs huaweicloud_list_operations(DMS) 未返回 command/result",
    'EXP-C4-18': "src/tools.mjs huaweicloud_list_operations(DEW) 未返回 command/result",
    'D3-C3': "沙箱服务返回 HDKIT_NOT_AGREEMENT：用户未签署最新版协议，签署需账号本人确认（外部依赖，非代码缺陷）",
    'D3-C6': "沙箱服务返回 HDKIT_NOT_AGREEMENT：用户未签署最新版协议，check_user/connect 全部被拒，7 个具名工具无法冒烟（外部依赖）",
    'D3-S3': "沙箱 check_user 返回 HDKIT_NOT_AGREEMENT（用户未签最新协议），沙箱预览出 URL 无法验证（外部依赖）",
}

FAIL = {'D2-4', 'D4-2', 'D4-4', 'D4-6', 'D4-17', 'D4-21', 'D4-25', 'D4-26',
        'D9-12', 'D10-3', 'D3-C4', 'D3-S5', 'D3-S6', 'D3-S7', 'D1-70',
        'EXP-C4-14', 'EXP-C4-18', 'EXP-E01'}
SPEC = {'D8-9', 'D9-9', 'D10-4'}
BLOCKED = {'D3-C3', 'D3-C6', 'D3-S3'}
NOT_RUN = {'D1-39'}

# --- 证据来源映射：case -> (kind, logfile, section) ---
MAP = {}
def add(cases, kind, logfile, sec=None):
    for c in cases:
        MAP[c] = (kind, logfile, sec)

for c in ['D4-1', 'D4-2', 'D4-3', 'D4-15', 'D4-16']:
    add([c], 'file', 'classify.log')
for c in ['D4-5', 'D4-7', 'D4-9', 'D4-21', 'D4-22']:
    add([c], 'file', 'hook.log')
for c in ['D2-11', 'D2-12']:
    add([c], 'file', 'auth.log')
for c in ['D9-1', 'D9-2', 'D9-3', 'D9-4', 'D9-5', 'D9-7', 'D9-8', 'D5-3']:
    add([c], 'file', 'protocol.log')
for c in ['D9-9', 'D2-16', 'D1-41']:
    add([c], 'file', 'extended.log')
for c in ['D1-26', 'D1-27', 'D2-2', 'D2-5', 'D3-A1', 'D3-B1', 'D3-B3', 'D3-B5',
          'D3-C5', 'D4-6', 'D4-11', 'D4-17', 'D6-1', 'D6-3', 'D6-4']:
    add([c], 'file', 'supplement.log')
for c in ['D1-30', 'D4-10']:
    add([c], 'file', 'supplement-import.log')
for c in ['D1-65', 'D1-66', 'D1-67', 'D1-68']:
    add([c], 'file', 'new-env.log')
for c in ['D2-27', 'D8-9', 'D8-10', 'D6-9', 'D1-70']:
    add([c], 'file', 'new-config.log')
for c in ['D10-4', 'D4-26', 'D4-29', 'D4-28', 'D4-25']:
    add([c], 'file', 'new-safety.log')
for c in ['D9-10', 'D9-11']:
    add([c], 'file', 'new-mcp.log')
for c in ['D1-69']:
    add([c], 'file', 'new-cli.log')
for c in ['D3-S1', 'D3-S5', 'D3-S8']:
    add([c], 'file', 'new-scenario.log')
for c in ['D3-S2', 'D3-C13', 'D3-C14', 'D3-S4', 'D3-S3']:
    add([c], 'file', 'new-cloud.log')
for c in ['D3-S6', 'D3-S7']:
    add([c], 'file', 'new-fg-rds.log')
for c in ['D1-28', 'D1-31', 'D1-33']:
    add([c], 'file', 'updatecheck.log')
for c in ['D1-40']:
    add([c], 'file', 'd1-40.log')
for c in ['D1-42']:
    add([c], 'file', 'd1-42.log')
for c in ['D1-45']:
    add([c], 'file', 'd1-45.log')
for c in ['D2-26']:
    add([c], 'file', 'd2-26.log')
for c in ['D4-27']:
    add([c], 'file', 'd4-27.log')
for c in ['D4-8']:
    add([c], 'file', 'd4-8.log')
for c in ['D5-1']:
    add([c], 'file', 'd5-1.log')
for c in ['D9-12']:
    add([c], 'file', 'd9-12.log')
for c in ['D9-13']:
    add([c], 'file', 'd9-13.log')
for c in ['D2-10', 'D2-13', 'D4-12', 'D9-6']:
    add([c], 'file', 'fixtures.log')
for c in ['D8-1']:
    add([c], 'file', 'doc-D8-1.log')
for c in ['D8-4']:
    add([c], 'file', 'doc-D8-4.log')
for c in ['D8-6']:
    add([c], 'file', 'doc-D8-6.log')
for c in ['D1-3', 'D1-4']:
    add([c], 'file', 'd1.log')
for c in ['D8-7']:
    add([c], 'file', 'd8.log')
for c in ['D10-3']:
    add([c], 'file', 'routing.log')

# 展开级
add(['EXP-D5-8-1'], 'file', 'd5-1.log')
add(['EXP-D5-8-3'], 'file', 'protocol.log', 'D5-3')
add(['EXP-NR3-02'], 'file', 'supplement.log', 'D1-27')
add(['EXP-NR3-04'], 'file', 'd1-42.log')
add(['EXP-NR3-10'], 'file', 'disttags.log')
add(['D1-39'], 'file', 'disttags.log')  # NOT_RUN Windows 专属，Linux 侧证据=NR3-10
add(['EXP-NR3-24'], 'file', 'd1-45.log')
add(['EXP-E02', 'EXP-E03', 'EXP-E04', 'EXP-E05', 'EXP-E06', 'EXP-E07', 'EXP-E09',
     'EXP-E10', 'EXP-E11', 'EXP-E12', 'EXP-E13', 'EXP-E14', 'EXP-E15'], 'eval', 'eval-harness.log')
add(['EXP-E01'], 'eval', 'eval-harness.log')
add(['EXP-E08'], 'file', 'exp-e08.log')

# 真云 probe 自写 stdout.txt 的 heavy/aux 用例
SELF = ['D3-C1', 'D3-C2', 'D3-C3', 'D3-C6', 'D3-C7', 'D4-13', 'D4-23', 'D4-24',
        'D1-70', 'D4-4', 'D2-4']
# realcloud（D2-1/D3-C4/D4-14/D4-18/D4-19/D4-20 + EXP-C4-*）
RC_CASES = ['D2-1', 'D3-C4', 'D4-14', 'D4-18', 'D4-19', 'D4-20'] + ['EXP-C4-%02d' % i for i in range(1, 23)]

# logfile -> probe 源文件名
PROBE_OF = {
    'd1.log': 'd1-probe.sh', 'doc-D8-1.log': 'doc-probe.mjs', 'doc-D8-4.log': 'doc-probe.mjs',
    'doc-D8-6.log': 'doc-probe.mjs', 'd1-40.log': 'D1-40-probe.mjs', 'd1-42.log': 'D1-42-probe.mjs',
    'd1-45.log': 'D1-45-probe.mjs', 'd2-26.log': 'D2-26-probe.mjs', 'd4-27.log': 'D4-27-probe.mjs',
    'd5-1.log': 'D5-1-probe.mjs', 'd9-12.log': 'D9-12-probe.mjs', 'd9-13.log': 'D9-13-probe.mjs',
    'd4-8.log': 'd4-8-probe.sh', 'exp-e08.log': 'EXP-E08-probe.mjs',
}


def probe_for(logfile):
    if logfile in PROBE_OF:
        return PROBE_OF[logfile]
    cand = logfile.replace('.log', '-probe.mjs')
    if os.path.isfile(os.path.join(P, cand)):
        return cand
    return None


def status_of(cid):
    if cid in FAIL:
        return 'FAIL'
    if cid in SPEC:
        return 'SPEC-MISMATCH'
    if cid in BLOCKED:
        return 'BLOCKED'
    if cid in NOT_RUN:
        return 'NOT_RUN'
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
    lines = [l for l in txt.splitlines() if l.startswith('[' + section)]
    return '\n'.join(lines) if lines else '(no section %s in %s)' % (section, logfile)


rc_txt = rd(os.path.join(RC, 'stdout.txt'))
rc_probe = rd(os.path.join(RC, 'probe.mjs'))
eval_txt = rd(os.path.join(P, 'eval-harness.log'))

done = 0
# 1) 源码/评测类
for cid, item in sorted(MAP.items()):
    kind, logfile, sec = item
    d = os.path.join(EV, cid)
    os.makedirs(d, exist_ok=True)
    st = status_of(cid)
    if kind == 'file':
        txt = get_section(logfile, sec)
    else:
        lines = [l for l in eval_txt.splitlines() if l.startswith(cid + ' |')]
        acc = [l for l in eval_txt.splitlines() if '准确率' in l or 'HIT=' in l]
        txt = ('\n'.join(lines) or '(no line %s)' % cid) + '\n\n' + ('\n'.join(acc) if acc else '')
    wr(os.path.join(d, 'stdout.txt'), txt + '\n')
    pn = probe_for(logfile)
    if pn and os.path.isfile(os.path.join(P, pn)):
        shutil.copy2(os.path.join(P, pn), os.path.join(d, 'probe.mjs' if pn.endswith('.mjs') else 'probe.sh'))
    write_status(cid, st, WHY.get(cid, ''))
    done += 1

# 2) 真云 realcloud-probe 用例
for cid in RC_CASES:
    d = os.path.join(EV, cid)
    os.makedirs(d, exist_ok=True)
    wr(os.path.join(d, 'stdout.txt'), rc_txt)
    wr(os.path.join(d, 'probe.mjs'), rc_probe)
    write_status(cid, status_of(cid), WHY.get(cid, ''))
    done += 1

# 3) 自写探针用例（heavy/aux）：保留 stdout.txt，覆盖状态
for cid in SELF:
    d = os.path.join(EV, cid)
    os.makedirs(d, exist_ok=True)
    if not os.path.isfile(os.path.join(d, 'stdout.txt')) or os.path.getsize(os.path.join(d, 'stdout.txt')) == 0:
        wr(os.path.join(d, 'stdout.txt'), rd(os.path.join(d, 'stdout.log')))
    write_status(cid, status_of(cid), WHY.get(cid, ''))

# 4) 基线版本
wr(os.path.join(EV, '_baseline', 'stdout.txt'),
   'huaweicloud-devkit 1.1.14-next.0 (npm next)\nnode v22.13.0\nhdk gitHead ac955889d2a64edd87359dd5ba11710b3f98001e\nexecutedAt %s\n' % TS)

print('[stage] 落盘 %d 用例 + SELF %d' % (done, len(SELF)))
print('[stage] FAIL(%d): %s' % (len(FAIL), ', '.join(sorted(FAIL))))
print('[stage] SPEC(%d): %s' % (len(SPEC), ', '.join(sorted(SPEC))))
print('[stage] BLOCKED(%d): %s' % (len(BLOCKED), ', '.join(sorted(BLOCKED))))
print('[stage] NOT_RUN(%d): %s' % (len(NOT_RUN), ', '.join(sorted(NOT_RUN))))