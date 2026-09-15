# -*- coding: utf-8 -*-
"""消解 2026-09-15 BLOCKED 用例（补测回填）——Hermes Linux
三类假阻塞实际执行后回填：
  D10 评测集 EXP-E01~E15：eval/harness/run-eval.mjs 确定性路由（HIT=3/MISS=11/N/A=1）
  D1-42 dismiss / D1-45 兜底 / D1-40 反向下发防护 / D5-1 清单发现 / D4-6 adminPass 脱敏：源码级直调
真·外部依赖保留 BLOCKED 并升级四要素 blockedReason。
"""
import csv, datetime, io, os

BASE = os.path.dirname(os.path.abspath(__file__))
# 北京时间紧凑 14 位
TS = (datetime.datetime.utcnow() + datetime.timedelta(hours=8)).strftime('%Y%m%d%H%M%S')

# ---- 展开级 ----
EXP_PATH = os.path.join(BASE, '用例矩阵-展开级.csv')
HARNESS_EV = 'evidence/D10-3'
# 确定性路由结论（run-eval.mjs 实测 2026-09-15）：HIT=3 MISS=11 N/A=1
HIT = {'EXP-E06', 'EXP-E09', 'EXP-E15'}
MISS = {'EXP-E01', 'EXP-E02', 'EXP-E03', 'EXP-E04', 'EXP-E05', 'EXP-E07',
        'EXP-E10', 'EXP-E11', 'EXP-E12', 'EXP-E13', 'EXP-E14'}
E08 = 'EXP-E08'

exp_updates = {}
for cid in HIT:
    exp_updates[cid] = ('PASS', HARNESS_EV, '')
for cid in MISS:
    exp_updates[cid] = ('FAIL', HARNESS_EV, '')
exp_updates[E08] = ('PASS', 'evidence/EXP-E08', '')
exp_updates['EXP-NR3-04'] = ('PASS', 'evidence/D1-42', '')   # D1-42 dismiss
exp_updates['EXP-NR3-24'] = ('PASS', 'evidence/D1-45', '')   # D1-45 兜底
exp_updates['EXP-D5-8-1'] = ('PASS', 'evidence/D5-1', '')    # D5-1 清单发现

# ---- 设计级 ----
DES_PATH = os.path.join(BASE, '用例矩阵-设计级.csv')
des_updates = {
    'D1-40': ('PASS', 'evidence/D1-40', ''),   # 反向下发防护（源码级）
    'D1-42': ('PASS', 'evidence/D1-42', ''),
    'D1-45': ('PASS', 'evidence/D1-45', ''),
    'D5-1':  ('PASS', 'evidence/D5-1', ''),
    'D4-6':  ('PASS', 'evidence/D4-6', ''),    # 源码级脱敏断言（adminPass=xxx→<redacted>）
}

def patch(base, path, updates, status='执行状态', ts='执行时间', ev='evidencePath', br='blockedReason', idcol='ID'):
    with open(path, encoding='utf-8-sig', newline='') as f:
        rows = list(csv.DictReader(f))
    for r in rows:
        cid = r.get(idcol)
        if cid in updates:
            st, evp, brv = updates[cid]
            r[status] = st
            r[ts] = TS
            r[ev] = evp
            r[br] = brv
    with open(path, 'w', encoding='utf-8', newline='') as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)
    print(f'[patch] {path}: {len(updates)} 条更新')

patch(BASE, EXP_PATH, exp_updates)
patch(BASE, DES_PATH, des_updates)

# ---- 设计级 剩余 BLOCKED：升级四要素 blockedReason ----
FOUR = '实测时间 2026-09-15 晚(北京时间)'
reason_upgrades = {
    'D1-2':  f'{FOUR}；缺「多客户端并存环境」(单机仅 Hermes)；影响=无法验证 install 省略 --target 的 auto-detect 多客户端全覆盖；解除=多客户端共存测试机。',
    'D1-6':  f'{FOUR}；缺 KooCLI 下载源/国内镜像网络；影响=无法实测 install-hcloud 完成 KooCLI 安装引导+镜像/沙箱提示；解除=镜像源网络+下载通道可用。',
    'D1-39': f'{FOUR}；缺 Windows 10 测试机(升级检测链 EINVAL 为 Windows 专属)；影响=无法实测 npm.cmd spawnSync 无 shell:true 的 EINVAL 是否静默失败；解除=Windows 测试机(注: Linux 侧已由展开级 EXP-NR3-10 探针 PASS)。',
    'D2-10': f'{FOUR}；缺 KooCLI 多 profile 夹具(current=deploy 切换)；影响=无法实测 R7 current 档跟随 resolveManagedProfile；解除=多 profile config.json 夹具。',
    'D2-13': f'{FOUR}；缺 env 凭证 + session 切换夹具(configuredBySession 标记写入 S1 会污染统一账号凭证库)；影响=无法实测 R9 configuredBySession 优先 env 且清除后 env 兜底恢复；解除=隔离 S1 + HW_ACCESS_KEY env 夹具。',
    'D4-18': f'{FOUR}；缺真云凭证 valid + 标准客户端交互确认流；影响=无法实测 confirm-not-deny 审批语义(真云高危写操作进入确认流)；解除=真云 AK/SK + 交互确认客户端。',
    'D4-19': f'{FOUR}；缺真云高危操作进入确认流的场景；影响=无法实测确认流下预检仍生效；解除=真云写操作+确认流。',
    'D4-20': f'{FOUR}；缺审批拒绝流 + 真云资源变更计数(需真实拒绝后的零操作验证)；影响=无法实测拒绝后零操作；解除=真云+审批拒绝流。',
    'D2-1':  f'{FOUR}；缺「污染隔离的真云凭证库」(auth init 三端同步会写入真云凭证)；影响=无法安全实测六条同步规则；解除=一次性可丢弃的统一账号凭证库。',
    'D4-12': f'{FOUR}；缺 npm 安装期抓包/SBOM 审计通道；影响=无法实测供应链安装期安全；解除=安装期抓包/SBOM 审计。',
    'D4-13': f'{FOUR}；缺只读 IAM 子账号凭证 credentials.readonly.json；影响=无法实测最小权限凭证通过率(全量 D3 只读用例)；解除=下发只读子账号凭证文件(不写管理员凭证)。',
    'D4-14': f'{FOUR}；缺 CTS 命令执行审计日志回执；影响=无法实测操作可审计性；解除=CTS 审计日志通道。',
    'D4-23': f'{FOUR}；缺 11 个 Agent 多机安装目标 + 包内未见 huawei-agent-rules.md 制品(grep 全包无命中)；影响=无法实测全局规则注入生效性/孤儿文件；解除=11 安装目标 + 制品入包。',
    'D4-24': f'{FOUR}；缺审批流 + 可注入时钟(令牌过期/重复确认边界)；影响=无法实测确认令牌过期与重复确认边界；解除=审批流夹具+时钟注入。',
    'D9-9':  f'{FOUR}；缺 inspector 夹具注入 30s 挂起(capabilities.cancellation 实测未声明)；影响=无法实测 tools/call 超时协议语义与取消；解除=inspector 超时夹具。',
    'D7-4':  f'{FOUR}；缺 GitCode/国内镜像网络 + GITCODE_TOKEN；影响=无法实测国内镜像源安装；解除=镜像网络+GITCODE_TOKEN。',
    'D9-6':  f'{FOUR}；缺多客户端并存环境(跨客户端互通需 MCP Inspector/多客户端)；影响=无法实测跨客户端互通；解除=多客户端并存环境。',
    'D10-4': f'{FOUR}；缺 LLM 评测 harness + 预算门禁(安全干预有效性需真实 Agent 安全场景评测，run-eval.mjs 无法代理该层)；影响=无法实测 D10-4 安全干预有效性；解除=LLM 评测 harness+预算。',
}

with open(DES_PATH, encoding='utf-8-sig', newline='') as f:
    rows = list(csv.DictReader(f))
fields = list(rows[0].keys())
cnt = 0
for r in rows:
    cid = r.get('ID')
    if r.get('执行状态', '').strip() == 'BLOCKED' and cid in reason_upgrades:
        r['blockedReason'] = reason_upgrades[cid]
        cnt += 1
with open(DES_PATH, 'w', encoding='utf-8', newline='') as f:
    w = csv.DictWriter(f, fieldnames=fields)
    w.writeheader()
    w.writerows(rows)
print(f'[reason] 设计级 BLOCKED 四要素升级: {cnt} 条')

print(f'\n完成，执行时间戳 {TS}')