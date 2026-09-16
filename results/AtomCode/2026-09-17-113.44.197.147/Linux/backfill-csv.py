# -*- coding: utf-8 -*-
"""AtomCode Linux 每日测试回填脚本：执行状态 + 执行时间 + evidencePath + blockedReason。
基于 2026-09-17 全量复跑探针的实际结果回填。"""
import csv, os, datetime

BASE = os.path.dirname(os.path.abspath(__file__))

# 北京时间 14 位紧凑时间戳
def beijing_now():
    import zoneinfo
    try:
        tz = zoneinfo.ZoneInfo("Asia/Shanghai")
    except Exception:
        tz = datetime.timezone(datetime.timedelta(hours=8))
    return datetime.datetime.now(tz).strftime("%Y%m%d%H%M%S")

TS = beijing_now()

# 设计级：case_id -> (状态, evidencePath, blockedReason)
# 状态取自当日实际复跑结果；FAIL/SPEC 根因落 FINDINGS.md
DESIGN = {
    "D1-1":  ("BLOCKED", "", "环境阻塞：破坏性全局安装/卸载/改源/多客户端覆盖，run-only 每日测试不执行"),
    "D1-2":  ("BLOCKED", "", "环境阻塞：破坏性全局安装/卸载/改源/多客户端覆盖，run-only 每日测试不执行"),
    "D1-3":  ("PASS", "evidence/cli/stdout.log", ""),
    "D1-4":  ("PASS", "evidence/cli/stdout.log", ""),
    "D1-5":  ("BLOCKED", "", "环境阻塞：破坏性全局改源/卸载（切换 npm 源），run-only 不执行"),
    "D1-6":  ("BLOCKED", "", "环境阻塞：install-hcloud 为破坏性命令引导，run-only 不执行"),
    "D1-26": ("PASS", "evidence/d2-auth/probe.mjs", ""),
    "D1-27": ("PASS", "evidence/d1-upgrade/stdout-probe.log", ""),
    "D1-28": ("PASS", "evidence/d1-upgrade/stdout-probe.log", ""),
    "D1-30": ("PASS", "evidence/d1-upgrade/stdout-probe.log", ""),
    "D1-31": ("PASS", "evidence/d1-upgrade/stdout-probe.log", ""),
    "D1-33": ("PASS", "evidence/d1-extend/stdout-probe.log", ""),
    "D1-39": ("NOT_RUN", "", "OS 专属：Windows 升级检测链 EINVAL；Linux 由展开级 EXP-NR3-09/10 代表覆盖"),
    "D1-40": ("PASS", "evidence/d1-upgrade/stdout-probe.log", ""),
    "D1-41": ("PASS", "evidence/d1-extend/stdout-probe.log", ""),
    "D1-42": ("PASS", "evidence/d1-extend/stdout-probe.log", ""),
    "D1-45": ("PASS", "evidence/d1-upgrade/stdout-probe.log", ""),
    "D1-58": ("BLOCKED", "", "环境阻塞：需交互式 install 菜单 option3 白名单探测（PTY），run-only 无 PTY"),
    "D2-10": ("PASS", "evidence/d2-extend/stdout-probe.log", ""),
    "D2-11": ("PASS", "evidence/d2-auth/stdout-probe-d2auth.log", ""),
    "D2-12": ("PASS", "evidence/d2-extend/stdout-probe.log", ""),
    "D2-13": ("PASS", "evidence/d2-auth/stdout-probe.log", ""),
    "D2-16": ("PASS", "evidence/d2-auth/stdout-probe-d2auth.log", ""),
    "D4-18": ("PASS", "evidence/d4-approval/stdout-probe-d4-approval.log", ""),
    "D4-19": ("PASS", "evidence/d4-approval/stdout-probe-d4-approval.log", ""),
    "D4-20": ("PASS", "evidence/d4-approval/stdout-probe-d4-approval.log", ""),
    "D2-1":  ("PASS", "evidence/d2-auth/stdout-probe-d2-1.log", ""),
    "D2-2":  ("PASS", "evidence/d2-auth/stdout-probe-d2-auth.log", ""),
    "D2-4":  ("PASS", "evidence/d2-auth/stdout-probe-d2-auth.log", ""),
    "D2-5":  ("PASS", "evidence/d2-auth/stdout-probe.log", ""),
    "D3-A1": ("PASS", "evidence/d5-tools/stdout-probe.log", ""),
    "D3-B1": ("PASS", "evidence/d5-tools/stdout-probe.log", ""),
    "D3-B3": ("PASS", "evidence/d3-misc/stdout-probe-d3-b3.log", ""),
    "D3-B5": ("PASS", "evidence/d5-tools/stdout-probe.log", ""),
    "D3-C4": ("FAIL", "evidence/real-cloud/stdout.log", ""),
    "D3-C5": ("PASS", "evidence/d3misc/stdout-probe.log", ""),
    "D4-1":  ("PASS", "evidence/d4-security/stdout.log", ""),
    "D4-2":  ("FAIL", "evidence/d4-security/stdout.log", ""),
    "D4-3":  ("PASS", "evidence/d4-security/stdout.log", ""),
    "D4-4":  ("PASS", "evidence/d4-security/stdout.log", ""),
    "D4-5":  ("PASS", "evidence/d4-security/stdout.log", ""),
    "D4-6":  ("PASS", "evidence/d4-extend/stdout-probe.log", ""),
    "D4-7":  ("PASS", "evidence/d4-extend/stdout-probe.log", ""),
    "D4-8":  ("BLOCKED", "", "环境阻塞：Python hook 路径本机未携带，无法做 Python/Node 同源策略对比"),
    "D4-9":  ("PASS", "evidence/d4-security/stdout.log", ""),
    "D4-10": ("PASS", "evidence/d4-extend/stdout-probe.log", ""),
    "D4-11": ("PASS", "evidence/d4-extend/stdout-probe.log", ""),
    "D4-12": ("BLOCKED", "", "环境阻塞：供应链/依赖锁定/SBOM 审计需独立 CI + npm audit 全量核对"),
    "D4-13": ("PASS", "evidence/real-cloud/stdout.log", ""),
    "D4-14": ("PASS", "evidence/real-cloud/stdout.log", ""),
    "D4-15": ("PASS", "evidence/d4-security/stdout.log", ""),
    "D4-16": ("FAIL", "evidence/d4-security/stdout.log", ""),
    "D4-17": ("PASS", "evidence/d4-extend/stdout-probe.log", ""),
    "D4-21": ("FAIL", "evidence/d4-security-core/stdout-probe-p0-security.log", ""),
    "D4-22": ("PASS", "evidence/d4-security-core/stdout-probe-p0-security.log", ""),
    "D4-23": ("FAIL", "evidence/d4-rules/stdout-probe.log", ""),
    "D4-24": ("PASS", "evidence/d4-extend/stdout-probe.log", ""),
    "D5-1":  ("PASS", "evidence/d5-tools/stdout-probe.log", ""),
    "D5-3":  ("PASS", "evidence/d5-tools/stdout-probe.log", ""),
    "D6-1":  ("PASS", "evidence/d3misc/stdout-probe.log", ""),
    "D6-3":  ("PASS", "evidence/d3misc/stdout-probe.log", ""),
    "D6-4":  ("PASS", "evidence/d3misc/stdout-probe.log", ""),
    "D9-9":  ("SPEC-MISMATCH", "evidence/protocol/stdout.log", ""),
    "D7-4":  ("BLOCKED", "", "环境阻塞：国内镜像源安装需切换全局 npm 源（破坏性），run-only 不执行"),
    "D8-1":  ("PASS", "evidence/d3misc/stdout-probe.log", ""),
    "D8-4":  ("PASS", "evidence/d3misc/stdout-probe.log", ""),
    "D8-6":  ("PASS", "evidence/d3misc/stdout-probe.log", ""),
    "D8-7":  ("PASS", "evidence/d8-skills/stdout-probe.log", ""),
    "D9-1":  ("PASS", "evidence/d9-protocol/stdout-probe.log", ""),
    "D9-2":  ("FAIL", "evidence/protocol/stdout.log", ""),
    "D9-3":  ("PASS", "evidence/d9-protocol/stdout-probe.log", ""),
    "D9-4":  ("PASS", "evidence/d9-protocol/stdout-probe.log", ""),
    "D9-5":  ("BLOCKED", "", "环境阻塞：stdio 大 payload/断连恢复需真实 MCP 传输子进程压测，现有 protocol-probe 不覆盖"),
    "D9-6":  ("PASS", "evidence/protocol/stdout.log", ""),
    "D9-7":  ("PASS", "evidence/d9-protocol/stdout-probe.log", ""),
    "D9-8":  ("PASS", "evidence/d9-protocol/stdout-probe-d9-8.log", ""),
    "D10-3": ("FAIL", "evidence/eval/stdout.log", ""),
    "D10-4": ("PASS", "evidence/d8-skills/stdout-probe.log", ""),
}

# 展开级：EXP-E01..15 由 eval 路由评测分解，其余按探针分组
EXP_E_FAIL = {"EXP-E01","EXP-E02","EXP-E03","EXP-E04","EXP-E05","EXP-E07","EXP-E08","EXP-E10","EXP-E11","EXP-E12","EXP-E13","EXP-E14"}
EXP_E_PASS = {"EXP-E06","EXP-E09","EXP-E15"}

def design_status(row):
    cid = row["ID"].strip()
    s = DESIGN.get(cid)
    if s is None:
        print(f"  [WARN] 设计级未映射: {cid}")
        return ("", "", "")
    return s

def expanded_status(row):
    cid = row["ID"].strip()
    if cid.startswith("EXP-C4") or cid.startswith("EXP-D5-10"):
        return ("PASS", "evidence/expanded/stdout-probe.log" if cid.startswith("EXP-C4") else "evidence/d5-tools/stdout-probe.log", "")
    if cid in EXP_E_PASS:
        return ("PASS", "evidence/eval/stdout.log", "")
    if cid in EXP_E_FAIL:
        return ("FAIL", "evidence/eval/stdout.log", "")
    print(f"  [WARN] 展开级未映射: {cid}")
    return ("", "", "")

def backfill(path, resolver):
    rows = list(csv.DictReader(open(path, encoding="utf-8-sig")))
    flds = list(rows[0].keys()) if rows else []
    out = open(path, "w", encoding="utf-8-sig", newline="")
    w = csv.DictWriter(out, fieldnames=flds)
    w.writeheader()
    for r in rows:
        st, ev, br = resolver(r)
        r["执行状态"] = st
        r["执行时间"] = TS
        r["evidencePath"] = ev
        r["blockedReason"] = br
        w.writerow(r)
    out.close()
    return len(rows)

n1 = backfill(os.path.join(BASE, "用例矩阵-设计级.csv"), design_status)
n2 = backfill(os.path.join(BASE, "用例矩阵-展开级.csv"), expanded_status)
print(f"回填完成：设计级 {n1} 行、展开级 {n2} 行，时间戳 {TS}")