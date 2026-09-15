# -*- coding: utf-8 -*-
"""AtomCode Linux 每日测试执行状态回填脚本（latest v1.1.4 / gitHead 9b67256e）。
回填三份 CSV：设计级 / 展开级（执行状态 + blockedReason + 执行时间 + evidencePath），追踪表（执行时间）。
母版为 2026-09-15 latest daily 精选（设计级 77 + 展开级 17，建包已按 agent/OS 预筛）。
"""
import csv, datetime, collections, os

D = os.path.dirname(os.path.abspath(__file__))
TS = datetime.datetime.now().astimezone(datetime.timezone(datetime.timedelta(hours=8))).strftime("%Y%m%d%H%M%S")

BLK_INSTALL = "环境阻塞：run-only 每日测试不执行破坏性全局安装/卸载/改源/多客户端覆盖"
BLK_REALCLOUD = "环境阻塞：需真实华为云资源创建/销毁或只读子账号（红线：最低配置创建→测后删除）"
BLK_LLM = "环境阻塞：需 LLM 评测/多轮自主执行环境，run-only 无法代理"
BLK_OTHER = "环境阻塞：需其他客户端/Inspector/多机环境"

DESIGN = {
    # P0 全量覆盖（18 条：14 PASS + 4 FAIL）
    "D1-39": ("PASS", "evidence/d1-upgrade-detect/stdout.log", ""),
    "D1-40": ("PASS", "evidence/d1-upgrade/stdout.log", ""),
    "D2-11": ("PASS", "evidence/d2-auth/stdout-d2-auth.log", ""),
    "D4-18": ("PASS", "evidence/d4-confirm/stdout.log", ""),
    "D4-19": ("PASS", "evidence/d4-confirm/stdout.log", ""),
    "D2-4":  ("PASS", "evidence/d2-auth/stdout-d2-auth.log", ""),
    "D4-1":  ("PASS", "evidence/d4-security/stdout.log", ""),
    "D4-2":  ("FAIL", "evidence/d4-security/stdout.log", ""),
    "D4-3":  ("PASS", "evidence/d4-security/stdout.log", ""),
    "D4-5":  ("PASS", "evidence/d4-security/stdout.log", ""),
    "D4-9":  ("PASS", "evidence/d4-security/stdout.log", ""),
    "D4-15": ("PASS", "evidence/d4-security/stdout.log", ""),
    "D4-16": ("FAIL", "evidence/d4-security/stdout.log", ""),
    "D4-21": ("FAIL", "evidence/d4-security-core/stdout.log", ""),
    "D4-22": ("PASS", "evidence/d4-security-core/stdout.log", ""),
    "D4-23": ("FAIL", "evidence/d4-rules/stdout.log", ""),
    "D8-7":  ("PASS", "evidence/d8-skills/stdout.log", ""),
    "D10-4": ("PASS", "evidence/d8-skills/stdout.log", ""),
    # 安装/生命周期（阻塞：破坏性/交互）
    "D1-1":  ("BLOCKED", "", BLK_INSTALL),
    "D1-2":  ("BLOCKED", "", BLK_INSTALL),
    "D1-5":  ("BLOCKED", "", BLK_INSTALL),
    "D1-6":  ("BLOCKED", "", "环境阻塞：install-hcloud 为破坏性命令引导，run-only 不执行"),
    "D1-58": ("BLOCKED", "", "环境阻塞：需交互式 install 菜单 option3 白名单探测（PTY）"),
    "D7-4":  ("BLOCKED", "", "环境阻塞：国内镜像源安装需切换全局 npm 源（破坏性）"),
    # D1 升级检测链
    "D1-3":  ("PASS", "evidence/cli/stdout.log", ""),
    "D1-4":  ("PASS", "evidence/cli/stdout.log", ""),
    "D1-26": ("PASS", "evidence/d2-auth/stdout.log", ""),
    "D1-27": ("PASS", "evidence/d1-upgrade/stdout.log", ""),
    "D1-28": ("PASS", "evidence/d1-upgrade/stdout.log", ""),
    "D1-30": ("PASS", "evidence/d1-upgrade/stdout.log", ""),
    "D1-31": ("PASS", "evidence/d1-upgrade/stdout.log", ""),
    "D1-33": ("PASS", "evidence/d1-extend/stdout.log", ""),
    "D1-41": ("PASS", "evidence/d1-extend/stdout.log", ""),
    "D1-42": ("PASS", "evidence/d1-extend/stdout.log", ""),
    "D1-45": ("PASS", "evidence/d1-upgrade/stdout.log", ""),
    # D2 认证
    "D2-1":  ("PASS", "evidence/d2-auth/stdout-d2-1.log", ""),
    "D2-2":  ("PASS", "evidence/d2-auth/stdout-d2-auth.log", ""),
    "D2-5":  ("PASS", "evidence/d2-auth/stdout.log", ""),
    "D2-10": ("PASS", "evidence/d2-extend/stdout.log", ""),
    "D2-12": ("PASS", "evidence/d2-extend/stdout.log", ""),
    "D2-13": ("PASS", "evidence/d2-auth/stdout.log", ""),
    "D2-16": ("PASS", "evidence/d2-extend/stdout.log", ""),
    # D3 工具/技能
    "D3-A1": ("PASS", "evidence/d5-tools/stdout.log", ""),
    "D3-B1": ("PASS", "evidence/d5-tools/stdout.log", ""),
    "D3-B3": ("BLOCKED", "", BLK_REALCLOUD),
    "D3-B5": ("PASS", "evidence/d5-tools/stdout.log", ""),
    "D3-C5": ("PASS", "evidence/d3misc/stdout.log", ""),
    # D4 安全（P0 在上，P1/P2 在此）
    "D4-4":  ("PASS", "evidence/d4-security/stdout.log", ""),
    "D4-6":  ("PASS", "evidence/d4-extend/stdout.log", ""),
    "D4-7":  ("PASS", "evidence/d4-extend/stdout.log", ""),
    "D4-8":  ("BLOCKED", "", "环境阻塞：Python hook 路径本机未携带，无法做 Python/Node 同源策略对比"),
    "D4-10": ("PASS", "evidence/d4-extend/stdout.log", ""),
    "D4-11": ("PASS", "evidence/d4-extend/stdout.log", ""),
    "D4-12": ("BLOCKED", "", "环境阻塞：供应链/依赖锁定/SBOM 审计需独立 CI + npm audit 全量核对"),
    "D4-13": ("BLOCKED", "", "环境阻塞：缺只读 IAM 子账号凭证 ~/.config/huaweicloud/credentials.readonly.json（本机未配置）"),
    "D4-14": ("BLOCKED", "", "环境阻塞：操作可审计性需真云命令执行后查询 CTS 审计记录"),
    "D4-17": ("PASS", "evidence/d4-extend/stdout.log", ""),
    "D4-20": ("PASS", "evidence/d4-extend/stdout.log", ""),
    "D4-24": ("PASS", "evidence/d4-extend/stdout.log", ""),
    # D5 / D6 / D8 / D9 / D10
    "D5-1":  ("PASS", "evidence/d5-tools/stdout.log", ""),
    "D5-3":  ("PASS", "evidence/d5-tools/stdout.log", ""),
    "D6-1":  ("PASS", "evidence/d3misc/stdout.log", ""),
    "D6-3":  ("PASS", "evidence/d3misc/stdout.log", ""),
    "D6-4":  ("PASS", "evidence/d3misc/stdout.log", ""),
    "D9-9":  ("BLOCKED", "", "环境阻塞：需可注入延迟/取消的 MCP 客户端夹具做 tools/call 30s 挂起→超时 -32000 与取消通知 2s 中止的精确协议断言"),
    "D8-1":  ("PASS", "evidence/d3misc/stdout.log", ""),
    "D8-4":  ("PASS", "evidence/d3misc/stdout.log", ""),
    "D8-6":  ("PASS", "evidence/d3misc/stdout.log", ""),
    "D9-1":  ("PASS", "evidence/d9-protocol/stdout.log", ""),
    "D9-2":  ("FAIL", "evidence/d9-protocol/stdout-d9-mcp-protocol.log", ""),
    "D9-3":  ("PASS", "evidence/d9-protocol/stdout.log", ""),
    "D9-4":  ("PASS", "evidence/d9-protocol/stdout.log", ""),
    "D9-5":  ("BLOCKED", "", "环境阻塞：stdio 大 payload/断连恢复需真实 MCP 传输子进程压测"),
    "D9-6":  ("BLOCKED", "", BLK_OTHER),
    "D9-7":  ("PASS", "evidence/d9-protocol/stdout.log", ""),
    "D9-8":  ("PASS", "evidence/d9-protocol/stdout-d9-8.log", ""),
    "D10-3": ("BLOCKED", "", BLK_LLM),
}

EXPANDED = {
    # AtomCode 自身 D5 客户端矩阵（2 行）
    "EXP-D5-10-1": ("PASS", "evidence/d5-tools/stdout.log", ""),
    "EXP-D5-10-3": ("PASS", "evidence/d5-tools/stdout.log", ""),
}
# D10 评测集（15 行，需 LLM 评测环境）
for n in range(1, 16):
    EXPANDED[f"EXP-E{n:02d}"] = ("BLOCKED", "", BLK_LLM)

# ---- 回填 ----
def backfill_case_csv(path, mapping, kind):
    rows = list(csv.DictReader(open(path, encoding="utf-8-sig")))
    fields = list(rows[0].keys())
    br_col = "blockedReason"
    if br_col not in fields:
        fields.append(br_col)
    for r in rows:
        cid = r.get("ID") or r.get("expandedCaseId") or ""
        rec = mapping.get(cid)
        if rec:
            status, ev, reason = rec
            r["执行状态"] = status
            r["执行时间"] = TS
            r["evidencePath"] = ev
            r[br_col] = reason
        else:
            r[br_col] = ""
            if not (r.get("执行状态") or "").strip():
                r["执行状态"] = "NOT_RUN"
    with open(path, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        for r in rows:
            w.writerow(r)
    c = collections.Counter((r.get("执行状态") or "").strip() or "(空)" for r in rows)
    print(f"[{kind}] 回填 {len(rows)} 行 -> {dict(c)}")

backfill_case_csv(os.path.join(D, "用例矩阵-设计级.csv"), DESIGN, "设计级")
backfill_case_csv(os.path.join(D, "用例矩阵-展开级.csv"), EXPANDED, "展开级")

# 追踪表：executed(PASS/FAIL) 的设计级用例回填执行时间
executed = {cid for cid, (st, ev, _) in DESIGN.items() if st in ("PASS", "FAIL")}
tp = os.path.join(D, "需求-设计-证据追踪表.csv")
trows = list(csv.DictReader(open(tp, encoding="utf-8-sig")))
tfields = list(trows[0].keys())
for r in trows:
    dc = (r.get("designCaseId") or "").strip()
    if dc in executed:
        r["执行时间"] = TS
    else:
        r["执行时间"] = ""
with open(tp, "w", encoding="utf-8-sig", newline="") as f:
    w = csv.DictWriter(f, fieldnames=tfields)
    w.writeheader()
    for r in trows:
        w.writerow(r)
filled = sum(1 for r in trows if (r.get("执行时间") or "").strip())
print(f"[追踪表] 执行时间回填 {filled}/{len(trows)} 行（executed 设计级 {len(executed)} 用例）")
print("回填完成，执行时间:", TS)