# -*- coding: utf-8 -*-
"""DSH/Linux 2026-09-15 daily 执行回填 (v1.1.4 stable @9b67256e). 只改本目录副本。"""
import csv, os
from datetime import datetime, timezone, timedelta
from collections import Counter
BASE = os.path.dirname(os.path.abspath(__file__))
CST = timezone(timedelta(hours=8))
TS = datetime.now(CST).strftime("%Y%m%d%H%M%S")

DESIGN_PASS = {
 "D1-1":"evidence/install","D1-2":"evidence/install","D1-3":"evidence/cli","D1-4":"evidence/cli",
 "D1-6":"evidence/cli","D1-26":"evidence/update","D1-27":"evidence/update","D1-28":"evidence/update",
 "D1-30":"evidence/update","D1-31":"evidence/update","D1-33":"evidence/update","D1-40":"evidence/update",
 "D1-58":"evidence/install","D2-5":"evidence/auth","D2-10":"evidence/auth","D2-11":"evidence/auth",
 "D2-12":"evidence/auth","D2-13":"evidence/auth","D2-16":"evidence/auth",
 "D3-A1":"evidence/func","D3-B1":"evidence/func","D3-B3":"evidence/cli","D3-B5":"evidence/func","D3-C5":"evidence/func",
 "D4-1":"evidence/security","D4-4":"evidence/security","D4-5":"evidence/security","D4-6":"evidence/security",
 "D4-7":"evidence/security","D4-9":"evidence/security","D4-21":"evidence/security","D4-22":"evidence/security",
 "D5-1":"evidence/install","D5-3":"evidence/protocol","D8-7":"evidence/func",
 "D9-1":"evidence/protocol","D9-3":"evidence/protocol","D9-4":"evidence/protocol","D9-8":"evidence/protocol",
}
DESIGN_FAIL = {
 "D2-4":"evidence/security","D4-2":"evidence/security","D4-3":"evidence/security",
 "D4-15":"evidence/security","D4-16":"evidence/security","D4-17":"evidence/security",
 "D4-23":"evidence/install","D9-2":"evidence/protocol","D10-3":"evidence/routing","D8-1":"evidence/doc",
}
DESIGN_BLOCKED = {
 "D1-5":"uninstall 为破坏性操作（删除本机插件需重装+重启），headless 不做",
 "D1-39":"Windows 专属升级检测链（EINVAL/文件锁）；Linux 侧 queryDistTags 亦因本机 npm cache 权限返回 null",
 "D1-41":"需完整 MCP 四态注入协议序列（冷启动 mcp-server + 四态 content JSON 解析）",
 "D1-42":"需 dismiss 跨进程重启复查闭环",
 "D1-45":"需真实会话预热竞态时序",
 "D2-1":"需真云 AK/SK 三端同步（KooCLI/OBS/沙箱）E2E",
 "D2-2":"需三端×就绪 8 组合枚举判定矩阵",
 "D3-C4":"需真云逐服务轻量创建→立即释放→归零 E2E（只读 list_operations+plan 已覆盖 22 服务）",
 "D4-8":"Python/Node 双钩子一致性，DSH 插件仅接 Node 钩子",
 "D4-10":"需规则库新增项回归基线",
 "D4-11":"需提示注入测试集",
 "D4-12":"需 npm 供应链安装期审计环境",
 "D4-13":"需真云最小权限账号矩阵",
 "D4-14":"需真实审批流日志审计链路（CTS 追溯）",
 "D4-18":"需互动确认流（confirm-not-deny）+ 真云写操作",
 "D4-19":"需互动确认流 + 真云高危写",
 "D4-20":"需互动拒绝确认流 + 云资源验证",
 "D4-24":"需确认令牌过期/重复确认边界时序 + 真云写",
 "D6-1":"需检索响应延迟压测基准（p95）",
 "D6-3":"需 MCP 冷启动计时基准",
 "D6-4":"需并发 30 请求调度压测",
 "D7-4":"需国内镜像源网络环境",
 "D8-4":"需引导步骤机械执行录屏/快照",
 "D8-6":"需中英文文档 diff 基线",
 "D9-5":"需 stdio 大 payload/超长输出/断连压测",
 "D9-6":"需跨客户端互通（3 客户端）",
 "D9-7":"需协议版本协商降级矩阵（老客户端模拟）",
 "D9-9":"需 tools/call 超时注入 + 取消时序",
 "D10-1":"需真实 Agent 工具描述可选择性评测集",
 "D10-2":"需真实 Agent skill 激活率评测集（20+ 任务）",
 "D10-4":"需真实 Agent 安全干预评测集",
 "D10-5":"需真实 Agent 多轮任务完成率评测",
}

def backfill_design():
    path = os.path.join(BASE, "用例矩阵-设计级.csv")
    with open(path, encoding="utf-8-sig", newline="") as f:
        rows = list(csv.DictReader(f))
    fn = list(rows[0].keys())
    for r in rows:
        cid = (r.get("ID") or "").strip()
        r["blockedReason"] = ""
        if cid in DESIGN_PASS:
            r["执行状态"]="PASS"; r["evidencePath"]=DESIGN_PASS[cid]; r["执行时间"]=TS
        elif cid in DESIGN_FAIL:
            r["执行状态"]="FAIL"; r["evidencePath"]=DESIGN_FAIL[cid]; r["执行时间"]=TS
        elif cid in DESIGN_BLOCKED:
            r["执行状态"]="BLOCKED"; r["evidencePath"]=""; r["执行时间"]=""; r["blockedReason"]=DESIGN_BLOCKED[cid]
        else:
            r["执行状态"]="NOT_RUN"; r["evidencePath"]=""; r["执行时间"]=""; r["blockedReason"]="非本客户端/OS 适用"
    with open(path, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fn); w.writeheader(); w.writerows(rows)
    c = Counter(r["执行状态"] for r in rows)
    print(f"[设计级] 共{len(rows)} | " + " ".join(f"{k}={v}" for k,v in sorted(c.items())))

backfill_design()

# 展开级
EXP_PASS = {"EXP-D5-6-1":"evidence/install","EXP-D5-6-3":"evidence/protocol",
            "EXP-E06":"evidence/routing","EXP-E09":"evidence/routing","EXP-E15":"evidence/routing"}
EXP_FAIL_ROUTING = {"EXP-E01","EXP-E02","EXP-E03","EXP-E04","EXP-E05","EXP-E07","EXP-E08",
                    "EXP-E10","EXP-E11","EXP-E12","EXP-E13","EXP-E14"}
EXP_CREATE = {"ECS","RDS","CCE","WAF"}  # 需真云轻量创建→释放

def backfill_expanded():
    path = os.path.join(BASE, "用例矩阵-展开级.csv")
    with open(path, encoding="utf-8-sig", newline="") as f:
        rows = list(csv.DictReader(f))
    fn = list(rows[0].keys())
    for r in rows:
        cid = (r.get("ID") or "").strip()
        enum = (r.get("枚举对象") or "").strip()
        r["blockedReason"] = ""
        if cid in EXP_PASS:
            r["执行状态"]="PASS"; r["evidencePath"]=EXP_PASS[cid]; r["执行时间"]=TS
        elif cid in EXP_FAIL_ROUTING:
            r["执行状态"]="FAIL"; r["evidencePath"]="evidence/routing"; r["执行时间"]=TS
        elif cid.startswith("EXP-C4-"):
            if enum in EXP_CREATE:
                r["执行状态"]="BLOCKED"; r["evidencePath"]=""; r["执行时间"]=""
                r["blockedReason"]=f"需真云 {enum} 轻量创建→立即释放→归零验证（只读 list_operations 已覆盖）"
            else:
                r["执行状态"]="PASS"; r["evidencePath"]="evidence/func"; r["执行时间"]=TS
        else:
            r["执行状态"]="NOT_RUN"; r["evidencePath"]=""; r["执行时间"]=""; r["blockedReason"]="非本客户端/OS 适用"
    with open(path, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fn); w.writeheader(); w.writerows(rows)
    c = Counter(r["执行状态"] for r in rows)
    print(f"[展开级] 共{len(rows)} | " + " ".join(f"{k}={v}" for k,v in sorted(c.items())))

backfill_expanded()

# 追踪表执行时间
executed = set(list(DESIGN_PASS.keys()) + list(DESIGN_FAIL.keys()) + list(EXP_PASS.keys()) + list(EXP_FAIL_ROUTING) + [f"EXP-C4-{i:02d}" for i in range(1,23)])
path = os.path.join(BASE, "需求-设计-证据追踪表.csv")
with open(path, encoding="utf-8-sig", newline="") as f:
    rows = list(csv.DictReader(f))
fn = list(rows[0].keys())
if "执行时间" not in fn: fn = fn + ["执行时间"]
filled = 0
for r in rows:
    dc = (r.get("designCaseId") or "").strip()
    ec = (r.get("expandedCaseId") or "").strip()
    if dc in executed or ec in executed:
        r["执行时间"]=TS; filled+=1
    else:
        r["执行时间"]=""
with open(path, "w", encoding="utf-8-sig", newline="") as f:
    w = csv.DictWriter(f, fieldnames=fn); w.writeheader(); w.writerows(rows)
print(f"[追踪表] 共{len(rows)} 行 | 已执行(回填执行时间)={filled}")
print("回填完成 执行时间 =", TS)