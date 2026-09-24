# -*- coding: utf-8 -*-
"""覆盖率门禁：拦截 NOT_RUN/空列大面积出现 + P0 铁律。

用法:
    python verify_coverage.py <客户端> <OS> [日期]

规则（违反 1/2/3 即 exit 1，4 仅警告）：
1. P0 铁律：P0 用例标 NOT_RUN 或留空 → FAIL（P0 必测，P0 不得 NOT_RUN/空）；唯一豁免 = OS 专属 P0 用例在非对应 OS 上标 NOT_RUN（OS 列含「专属」且本机 OS 非主 OS）。
2. 覆盖率门禁：NOT_RUN + 空列 总占比 > 15% → FAIL（执行覆盖率不达标，需补齐重跑）。
3. BLOCKED 无原因：标 BLOCKED 但 blockedReason 为空 → FAIL（BLOCKED 必写原因，空即变相跳过）。
4. BLOCKED 高占比：BLOCKED 占比 > 50% → WARN（需人工核查是否环境确否）。
exit 0 = 通过 / 1 = 违反规则 1/2/3。
"""
import os, sys, csv, datetime, socket
from collections import Counter

REPO = os.environ.get("HDK_TEST_REPO") or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CLIENTS = ["OpenCode", "Codex", "CodeArtsAgent", "CodeArtsSpace", "WorkBuddy",
           "DSH", "OfficeAce", "Hermes", "OpenClaw", "AtomCode"]
OSES = ["Windows", "Linux"]
NOTRUN_EMPTY_LIMIT = 0.15   # NOT_RUN + 空列 占比上限（daily 是通用基础集，15% 已很宽松）
BLOCKED_WARN_RATIO = 0.50   # BLOCKED 占比超此 → WARN


def get_machine_ip():
    ip = os.environ.get("HDK_MACHINE_IP")
    if ip:
        return ip.strip()
    p = os.path.expanduser("~/.hdk_ip")
    if os.path.isfile(p):
        ip = open(p).read().strip()
        if ip:
            return ip
    try:
        return socket.gethostbyname(socket.gethostname())
    except Exception:
        return "unknown"


def status_of(r):
    return (r.get("执行状态") or r.get("execution_status") or "").strip()


def _os_scoped_out(r, os_name):
    """OS 专属用例在非对应 OS 上豁免 NOT_RUN：OS 列含「专属」且本机 OS 非主 OS（如 D1-39 Windows 专属，Linux 走 NR3 展开级）。"""
    os_col = (r.get("OS") or "").strip()
    if "专属" not in os_col:
        return False
    primary = os_col.split("（")[0].split("；")[0].strip()
    return os_name not in primary


def check(kind, pack_dir, os_name):
    src = os.path.join(pack_dir, f"用例矩阵-{kind}.csv")
    if not os.path.isfile(src):
        print(f"[跳过] 缺 {kind} 副本: {src}")
        return None
    rows = list(csv.DictReader(open(src, encoding="utf-8-sig")))
    total = len(rows)
    notrun, empty, blocked = 0, 0, 0
    blocked_no_reason = 0
    p0_bad = []  # P0 标 NOT_RUN 或空
    os_scoped = 0  # OS 专属用例在非对应 OS：结构性不适用，完全不计入覆盖率
    for r in rows:
        prio = (r.get("优先级") or "").strip()
        st = status_of(r)
        if _os_scoped_out(r, os_name):
            os_scoped += 1
            continue
        if not st:
            empty += 1
            if prio == "P0":
                p0_bad.append((r.get("ID", "?"), "空"))
        elif st.upper() == "NOT_RUN":
            notrun += 1
            if prio == "P0":
                p0_bad.append((r.get("ID", "?"), "NOT_RUN"))
        elif st.upper() == "BLOCKED":
            blocked += 1
            br = (r.get("blockedReason") or "").strip()
            if not br:
                blocked_no_reason += 1
    eff_total = total - os_scoped
    ratio = (notrun + empty) / eff_total if eff_total else 0
    blocked_ratio = blocked / eff_total if eff_total else 0
    return dict(kind=kind, total=eff_total, notrun=notrun, empty=empty,
                blocked=blocked, blocked_no_reason=blocked_no_reason, os_scoped=os_scoped,
                ratio=ratio, blocked_ratio=blocked_ratio, p0_bad=p0_bad)


def main():
    if len(sys.argv) < 3:
        print("用法: python verify_coverage.py <客户端> <OS> [日期]")
        sys.exit(2)
    client, os_name = sys.argv[1], sys.argv[2]
    if client not in CLIENTS:
        print(f"未知客户端 '{client}'，可选: {', '.join(CLIENTS)}"); sys.exit(2)
    if os_name not in OSES:
        print(f"未知 OS '{os_name}'，可选: {', '.join(OSES)}"); sys.exit(2)
    date = sys.argv[3] if len(sys.argv) > 3 else datetime.datetime.now().strftime("%Y-%m-%d")
    pack_dir = os.path.join(REPO, "results", client, f"{date}-{get_machine_ip()}", os_name)

    results = [r for r in (check("设计级", pack_dir, os_name), check("展开级", pack_dir, os_name)) if r]
    if not results:
        print(f"[ERROR] 未找到任何执行副本 CSV: {pack_dir}")
        sys.exit(2)

    fail = False
    warn = []
    for r in results:
        print(f"[{r['kind']}] 共 {r['total']} 条(OS专属豁免 {r['os_scoped']}) | NOT_RUN={r['notrun']} 空={r['empty']} "
              f"BLOCKED={r['blocked']}(无原因 {r['blocked_no_reason']}) | NOT_RUN+空占比 {r['ratio']:.1%}")
        # 规则1：P0 铁律
        if r["p0_bad"]:
            fail = True
            print(f"  [FAIL] P0 用例出现 {len(r['p0_bad'])} 条 NOT_RUN/空:")
            for cid, why in r["p0_bad"]:
                print(f"    - {cid}: {why}")
        # 规则2：覆盖率
        if r["ratio"] > NOTRUN_EMPTY_LIMIT:
            fail = True
            print(f"  [FAIL] NOT_RUN+空 占比 {r['ratio']:.1%} 超过 {NOTRUN_EMPTY_LIMIT:.0%}（执行覆盖率不达标）")
        # 规则3：BLOCKED 无原因 → FAIL（红线：BLOCKED 必写 blockedReason 四要素，空即变相跳过）
        if r["blocked_no_reason"]:
            fail = True
            print(f"  [FAIL] {r['kind']} 有 {r['blocked_no_reason']} 条 BLOCKED 未写 blockedReason（BLOCKED 必写原因，不得留空）")
        # 规则4：BLOCKED 高占比
        if r["blocked_ratio"] > BLOCKED_WARN_RATIO:
            warn.append(f"{r['kind']} BLOCKED 占比 {r['blocked_ratio']:.0%} 过高（需人工核查是否环境确否）")

    for w in warn:
        print(f"  [WARN] {w}")

    if fail:
        print("\n【覆盖率门禁】执行不达标：需补齐被跳过的用例（P0 必测 + NOT_RUN/空降至 15% 以内）再重跑。")
        sys.exit(1)
    print("\n覆盖率门禁通过：P0 无 NOT_RUN/空，NOT_RUN+空 占比在阈值内。")


if __name__ == "__main__":
    main()