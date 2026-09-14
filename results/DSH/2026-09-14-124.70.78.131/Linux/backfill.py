# -*- coding: utf-8 -*-
"""DSH/Linux 2026-09-14 daily 执行回填（v1.1.4-next.6）。只改本目录副本，不碰 test-cases 真源。"""
import csv, os
from datetime import datetime, timezone, timedelta
from collections import Counter

BASE = os.path.dirname(os.path.abspath(__file__))
CST = timezone(timedelta(hours=8))
TS = datetime.now(CST).strftime("%Y%m%d%H%M%S")

DESIGN_PASS = {
    "D1-1":"evidence/dsh-install","D1-3":"evidence/cli-readonly","D1-4":"evidence/cli-readonly",
    "D1-6":"evidence/cli-readonly","D1-26":"evidence/d1-upgrade","D1-27":"evidence/d1-upgrade",
    "D1-28":"evidence/d1-upgrade","D1-30":"evidence/d1-upgrade","D1-31":"evidence/d1-upgrade",
    "D1-33":"evidence/d1-upgrade","D1-40":"evidence/d1-upgrade","D1-41":"evidence/supplement",
    "D1-42":"evidence/d1-upgrade","D2-5":"evidence/supplement","D2-12":"evidence/supplement",
    "D2-13":"evidence/supplement","D2-16":"evidence/supplement","D3-A1":"evidence/supplement",
    "D3-B1":"evidence/supplement","D3-B5":"evidence/supplement","D4-1":"evidence/d4-security",
    "D4-3":"evidence/d4-security","D4-4":"evidence/d4-security","D4-5":"evidence/d4-security",
    "D4-6":"evidence/d4-security","D4-7":"evidence/d4-security","D4-9":"evidence/d4-security",
    "D4-21":"evidence/d4-security","D4-22":"evidence/d4-security","D5-1":"evidence/supplement",
    "D5-3":"evidence/d9-protocol","D8-7":"evidence/supplement","D9-1":"evidence/d9-protocol",
    "D9-3":"evidence/d9-protocol","D9-4":"evidence/d9-protocol","D9-8":"evidence/d9-protocol",
}
DESIGN_FAIL = {
    "D2-4":"evidence/d4-security","D4-2":"evidence/d4-security","D4-15":"evidence/d4-security",
    "D4-16":"evidence/d4-security","D4-17":"evidence/d4-security","D4-23":"evidence/dsh-install",
    "D9-2":"evidence/d9-protocol","D8-1":"evidence/supplement","D10-3":"evidence/supplement",
}
DESIGN_BLOCKED = {
    "D1-2":"需多 agent 共存环境探测，本机仅 DSH 单客户端",
    "D1-5":"uninstall 为破坏性操作（删除本机插件），headless 环境不做（需重装+重启）",
    "D1-39":"Windows 专属升级检测链（EINVAL/文件锁），本机 Linux",
    "D1-45":"需真实会话预热序列与竞态时序",
    "D1-58":"Claude/Cursor MCP 白名单 merge 语义，非 DSH 目标客户端",
    "D2-1":"需真云 AK/SK 三端（KooCLI/env/session）同步写入",
    "D2-2":"需多 auth 状态（未配置/已配置/过期）判定矩阵",
    "D2-10":"需真云 KooCLI current profile 多账号切换",
    "D2-11":"需真云 STS securityToken 轮换链路",
    "D3-B3":"需真云只读命令执行 + 输出脱敏回归",
    "D3-C4":"需真云多服务创建→删除→归零 E2E",
    "D3-C5":"需真云工具冒烟 E2E",
    "D4-8":"Python/Node 双钩子一致性，DSH 插件仅接 Node 钩子",
    "D4-10":"需规则库新增项回归基线",
    "D4-11":"需提示注入测试集",
    "D4-12":"需 npm 供应链安装期审计环境",
    "D4-13":"需真云最小权限账号矩阵",
    "D4-14":"需真实审批流日志审计链路",
    "D4-18":"需互动确认流（confirm-not-deny）+ 真云写操作",
    "D4-19":"需互动确认流 + 真云高危写",
    "D4-20":"需互动拒绝确认流 + 云资源验证",
    "D4-24":"需确认令牌过期/重复确认边界时序",
    "D6-1":"需检索响应延迟压测基准",
    "D6-3":"需 MCP 冷启动计时基准",
    "D6-4":"需并发调度压测环境",
    "D7-4":"需国内镜像源网络环境",
    "D8-4":"需引导步骤机械执行录屏/快照",
    "D8-6":"需中英文文档 diff 基线",
    "D9-5":"需 stdio 传输健壮性压测",
    "D9-6":"需多客户端互通环境",
    "D9-7":"需协议版本协商降级矩阵",
    "D9-9":"需构造超时场景",
    "D10-1":"需真实 Agent + 工具描述可选择性评测集",
    "D10-2":"需真实 Agent 技能激活率评测集",
    "D10-4":"需真实 Agent 安全干预评测集",
    "D10-5":"需真实 Agent 多轮任务完成率评测",
}

def backfill(kind, filename, pass_map, fail_map, blocked_fn=None, default_map=None):
    path = os.path.join(BASE, filename)
    with open(path, encoding="utf-8-sig", newline="") as f:
        rows = list(csv.DictReader(f))
    fn = list(rows[0].keys())
    if "blockedReason" not in fn:
        fn = fn + ["blockedReason"]
    for r in rows:
        cid = (r.get("ID") or "").strip()
        if cid in pass_map:
            r["执行状态"]="PASS"; r["evidencePath"]=pass_map[cid]; r["执行时间"]=TS; r["blockedReason"]=""
        elif cid in fail_map:
            r["执行状态"]="FAIL"; r["evidencePath"]=fail_map[cid]; r["执行时间"]=TS; r["blockedReason"]=""
        elif blocked_fn and blocked_fn(r):
            r["执行状态"]="BLOCKED"; r["evidencePath"]=""; r["执行时间"]=""; r["blockedReason"]=blocked_fn(r)
        elif cid in DESIGN_BLOCKED:
            r["执行状态"]="BLOCKED"; r["evidencePath"]=""; r["执行时间"]=""; r["blockedReason"]=DESIGN_BLOCKED[cid]
        elif default_map:
            r["执行状态"]=default_map(r); r["evidencePath"]=""; r["执行时间"]=""; r["blockedReason"]=""
        else:
            r["执行状态"]="NOT_RUN"; r["evidencePath"]=""; r["执行时间"]=""; r["blockedReason"]=""
    with open(path, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fn); w.writeheader(); w.writerows(rows)
    c = Counter(r["执行状态"] for r in rows)
    print(f"[{kind}] 共{len(rows)} | " + " ".join(f"{k}={v}" for k,v in sorted(c.items())))

backfill("设计级", "用例矩阵-设计级.csv", DESIGN_PASS, DESIGN_FAIL)

EXP_PASS = {"EXP-D5-6-1":"evidence/dsh-install","EXP-D5-6-3":"evidence/d9-protocol","EXP-NR3-02":"evidence/d1-upgrade"}
def exp_blocked(r):
    cid = (r.get("ID") or "").strip()
    if cid.startswith("EXP-C4"): return "需真云多服务创建→删除→归零 E2E"
    if cid in ("EXP-NR3-09","EXP-NR3-10","EXP-NR3-11"): return "Windows 专属升级检测链（D1-39），本机 Linux"
    if cid.startswith("EXP-D5-"): return "其他客户端终端矩阵（本机仅 DSH 客户端）"
    if cid.startswith("EXP-E"): return "需真实 Agent 评测集（路由准确率已设计级抽样 FAIL，15 行评测矩阵未全量）"
    if cid.startswith("EXP-NR3-"): return "需真实会话 dismiss 闭环/预热竞态序列"
    if cid.startswith("EXP-D1-58"): return "Claude/Cursor MCP 白名单 merge 语义，非 DSH 目标"
    return None

def exp_default(r):
    cid = (r.get("ID") or "").strip()
    reason = exp_blocked(r)
    return "BLOCKED" if reason else "NOT_RUN"

# backfill expanded BLOCKED then NOT_RUN handled via exp_default
path = os.path.join(BASE, "用例矩阵-展开级.csv")
with open(path, encoding="utf-8-sig", newline="") as f:
    rows = list(csv.DictReader(f))
fn = list(rows[0].keys())
if "blockedReason" not in fn:
    fn = fn + ["blockedReason"]
for r in rows:
    cid = (r.get("ID") or "").strip()
    if cid in EXP_PASS:
        r["执行状态"]="PASS"; r["evidencePath"]=EXP_PASS[cid]; r["执行时间"]=TS; r["blockedReason"]=""
    else:
        reason = exp_blocked(r)
        if reason:
            r["执行状态"]="BLOCKED"; r["evidencePath"]=""; r["执行时间"]=""; r["blockedReason"]=reason
        else:
            r["执行状态"]="NOT_RUN"; r["evidencePath"]=""; r["执行时间"]=""; r["blockedReason"]=""
with open(path, "w", encoding="utf-8-sig", newline="") as f:
    w = csv.DictWriter(f, fieldnames=fn); w.writeheader(); w.writerows(rows)
c = Counter(r["执行状态"] for r in rows)
print(f"[展开级] 共{len(rows)} | " + " ".join(f"{k}={v}" for k,v in sorted(c.items())))

# tracing 执行时间
executed = set(list(DESIGN_PASS.keys()) + list(DESIGN_FAIL.keys()))
path = os.path.join(BASE, "需求-设计-证据追踪表.csv")
with open(path, encoding="utf-8-sig", newline="") as f:
    rows = list(csv.DictReader(f))
fn = list(rows[0].keys())
if "执行时间" not in fn:
    fn = fn + ["执行时间"]
filled = 0
for r in rows:
    dc = (r.get("designCaseId") or "").strip()
    if dc in executed:
        r["执行时间"]=TS; filled+=1
    else:
        r["执行时间"]=""
with open(path, "w", encoding="utf-8-sig", newline="") as f:
    w = csv.DictWriter(f, fieldnames=fn); w.writeheader(); w.writerows(rows)
print(f"[追踪表] 共{len(rows)} 行 | 已执行(回填执行时间)={filled}")
print("回填完成。执行时间 =", TS)
