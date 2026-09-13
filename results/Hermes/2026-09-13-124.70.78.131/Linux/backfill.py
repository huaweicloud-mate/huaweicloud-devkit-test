# -*- coding: utf-8 -*-
"""Hermes Linux 2026-09-13 每日测试执行状态回填。

诚实回填：将副本 CSV 的「执行状态」列重置为 NOT_RUN，仅对我今日真实执行、
且有证据落盘 evidence/<case-id>/ 的用例标记 PASS/FAIL/BLOCKED（禁虚报）。
"""
import csv, os, datetime

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
PACK = os.path.join(REPO, "results", "Hermes", "2026-09-13", "Linux")

# ---- 设计级回填映射 ----
DESIGN_RESULTS = {
    # PASS（黑盒/协议/安装实测，有证据）
    "D1-1":   ("PASS", "evidence/D1-1",   "全新环境 install --target hermes 隔离安装成功(29 skills+MCP+安全策略+hooks+allowlist)，status 确认已安装"),
    "D1-3":   ("PASS", "evidence/D1-3",   "doctor --target hermes 自检 11/11 pass"),
    "D1-5":   ("PASS", "evidence/D1-5",   "uninstall --target hermes 干净卸载，status 确认未安装，无功能残留"),
    "D2-4":   ("PASS", "evidence/D2-4",   "huaweicloud_show_profile_redacted / auth_status 均返回 <redacted>/指纹，无 AK/SK 泄露"),
    "D2-11":  ("PASS", "evidence/D2-11",  "persistCredentials() tools.mjs:985 拒绝 STS securityToken 落盘(R3)；auth-credentials.test.mjs 22/22"),
    "D3-B5":  ("PASS", "evidence/D3-B5",  "huaweicloud_detect_framework 工具已注册；detect-framework.test.mjs 20/20"),
    "D4-7":   ("PASS", "evidence/D4-7",   "hook 三工具(check_command/check_artifacts/check_deploy_plan) hook-plugin.test.mjs 9/9"),
    "D4-8":   ("PASS", "evidence/D4-8",   "Python/Node 策略一致：hook-node.test.mjs 5/5(附 hook-python 10/10)"),
    "D9-1":   ("PASS", "evidence/D9-1",   "tools/list 返回 39 工具，全部 JSON Schema 合法，无残留/重复"),
    "D9-3":   ("PASS", "evidence/D9-3",   "tools/call 成功返回 content 数组 + isError:false；失败返回 error 对象"),
    "D9-4":   ("PASS", "evidence/D9-4",   "initialize→tools/list→tools/call 标准时序正常，capabilities.tools 协商"),
    # FAIL（实测缺陷）
    "D9-2":   ("FAIL", "evidence/D9-2",   "未知 method 返回 -32603 而非 -32601；未知 tool 返回 -32603 而非 -32602（mcp-server.mjs:169 硬编码 -32603）"),
    # BLOCKED（环境阻塞）
    "D3-C1":  ("BLOCKED", "", "真云 ECS 生命周期 E2E：需付费资源/最小权限真云账号，单 Linux 终端无安全创建删除条件"),
    "D3-C3":  ("BLOCKED", "", "沙箱部署 E2E：需 DevStation 配额"),
    "D3-C6":  ("BLOCKED", "", "沙箱 7 隐式工具冒烟：需沙箱 DevStation 配额"),
    "D3-C8":  ("BLOCKED", "", "企业项目参数支持：需账号存在≥2 企业项目"),
    "D1-52":  ("BLOCKED", "", "真实升级安装与重启生效：需真实重启会话并验证 hdk 工具刷新"),
    "D1-13":  ("BLOCKED", "", "Windows 文件锁下清理：Linux 环境无法复现"),
    "D1-39":  ("BLOCKED", "", "Windows 升级检测链：Linux 环境无法复现"),
    "D7-3":   ("BLOCKED", "", "Windows better-sqlite3 缺口：Linux 环境无法复现"),
    "D5-6":   ("BLOCKED", "", "Windows 特有问题：Linux 环境无法复现"),
    "D9-6":   ("BLOCKED", "", "跨客户端互通：需 Inspector + 3 客户端并存环境"),
    "D10-1":  ("BLOCKED", "", "评测：需评测 harness + 预算（D10 评测集整体阻塞）"),
    "D10-2":  ("BLOCKED", "", "评测：需评测 harness + 预算"),
    "D10-3":  ("BLOCKED", "", "评测：需评测 harness + 预算"),
    "D10-4":  ("BLOCKED", "", "安全干预有效性评测：需评测 harness + 预算"),
    "D10-5":  ("BLOCKED", "", "多轮任务完成率评测：需评测 harness + 预算"),
}

def backfill_design():
    path = os.path.join(PACK, "用例矩阵-设计级.csv")
    with open(path, encoding="utf-8-sig") as f:
        rows = list(csv.reader(f))
    hdr = rows[0]
    i_id = hdr.index("ID")
    i_stat = hdr.index("执行状态")
    i_ev = hdr.index("evidencePath")
    i_reason = hdr.index("blockedReason")
    i_cur = hdr.index("用例当前状态")
    for r in rows[1:]:
        cid = r[i_id]
        # 重置为 NOT_RUN（今日诚实快照）
        r[i_stat] = "NOT_RUN"
        r[i_ev] = ""
        if cid in DESIGN_RESULTS:
            status, ev, note = DESIGN_RESULTS[cid]
            r[i_stat] = status
            r[i_ev] = ev
            if status == "BLOCKED":
                # 谨慎处理 blockedReason 空列
                if i_reason < len(r):
                    r[i_reason] = note
            elif status == "FAIL":
                if i_reason < len(r):
                    r[i_reason] = note
        # 同步「用例当前状态」为执行状态（保持副本自洽），NOT_RUN 保留为 UNASSESSED 更合适，但为一致性写成 NOT_RUN
        # 此处不修改「用例当前状态」，仅改执行状态列（guide 要求回填「执行状态」列）
    with open(path, "w", encoding="utf-8-sig", newline="") as f:
        csv.writer(f).writerows(rows)
    print("设计级回填完成:", os.path.basename(path))

def backfill_expanded():
    path = os.path.join(PACK, "用例矩阵-展开级.csv")
    with open(path, encoding="utf-8-sig") as f:
        rows = list(csv.reader(f))
    hdr = rows[0]
    i_id = hdr.index("ID") if "ID" in hdr else 0
    i_stat = hdr.index("execution_status")
    i_ev = hdr.index("evidencePath")
    for r in rows[1:]:
        r[i_stat] = "NOT_RUN"
        r[i_ev] = ""
    with open(path, "w", encoding="utf-8-sig", newline="") as f:
        csv.writer(f).writerows(rows)
    print("展开级回填完成(全部 NOT_RUN，今日未跑展开级矩阵):", os.path.basename(path))

if __name__ == "__main__":
    backfill_design()
    backfill_expanded()
    # 汇总
    from collections import Counter
    with open(os.path.join(PACK, "用例矩阵-设计级.csv"), encoding="utf-8-sig") as f:
        rows = list(csv.reader(f))
    print("设计级执行状态:", Counter(r[rows[0].index("执行状态")] for r in rows[1:]))