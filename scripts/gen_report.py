# -*- coding: utf-8 -*-
"""每日测试报告自动生成：读回填后的 3 份 CSV → 统计各状态 + 生成测试报告骨架。

用法:
    python scripts/gen_report.py <客户端> <OS> --model <模型名> [--date YYYY-MM-DD] [--write]

设计目标（解决「模型手写长文报告易断」的问题）:
    每日流程第 6 步「出测试报告」原本靠模型手工拼一份几百行 markdown，弱执行模型极容易断在此处。
    本脚本把「能从回填 CSV 自动算出来的部分」（执行摘要/状态汇总/FAIL 清单/NOT_RUN 清单/通过率）
    一次性生成报告骨架，模型只需补「缺陷根因（文件:行号）+ 真云资源 + 安全红线」这类必须人工判定的内容。

安全边界:
    只读 results/<客户端>/<日期>-<IP>/<OS>/ 下的 CSV，绝不执行任何探针/真云操作，无副作用。

报告名: <客户端>-<模型>-测试报告.md（与 AGENTS.md 完成标准一致）。
"""
import os, sys, csv, datetime, socket

REPO = os.environ.get("HDK_TEST_REPO") or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CLIENTS = ["OpenCode", "Codex", "CodeArtsAgent", "CodeArtsSpace", "WorkBuddy",
           "DSH", "OfficeAce", "Hermes", "OpenClaw", "AtomCode"]
OSES = ["Windows", "Linux"]
VALID_STATUS = ["PASS", "FAIL", "BLOCKED", "SPEC-MISMATCH", "NOT_RUN"]


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


def find_pack_dir(client, date, ip, os_name):
    return os.path.join(REPO, "results", client, f"{date}-{ip}", os_name)


def load_csv(path):
    """读 CSV，返回 (行列表, 字段列表)。行列表为空或文件不存在返回 ([], [])。"""
    if not os.path.isfile(path):
        return [], []
    rows = list(csv.DictReader(open(path, encoding="utf-8-sig")))
    return rows, (list(rows[0].keys()) if rows else [])


def stats(rows):
    """统计各执行状态数量 + 分组收集用例。"""
    cnt = {s: 0 for s in VALID_STATUS}
    fails = []       # (优先级, ID, 维度, 标题)
    not_run = []     # (ID, 维度, 标题, blockedReason)
    blocked = []
    for r in rows:
        st = (r.get("执行状态") or "").strip().upper()
        if not st:
            st = "NOT_RUN"
        if st not in VALID_STATUS:
            st = "NOT_RUN"
        cnt[st] = cnt.get(st, 0) + 1
        cid = (r.get("ID") or "").strip()
        dim = (r.get("维度") or "").strip()
        title = (r.get("标题") or "").strip()
        prio = (r.get("优先级") or "").strip()
        if st == "FAIL":
            fails.append((prio or "-", cid, dim, title))
        elif st == "NOT_RUN":
            not_run.append((cid, dim, title, (r.get("blockedReason") or "").strip()))
        elif st == "BLOCKED":
            blocked.append((cid, dim, title, (r.get("blockedReason") or "").strip()))
    return cnt, fails, not_run, blocked


def pass_rate(cnt):
    denom = cnt.get("PASS", 0) + cnt.get("FAIL", 0)
    if denom == 0:
        return 0.0
    return round(cnt.get("PASS", 0) * 100.0 / denom, 1)


def _table_status(cnt):
    return (
        f"| PASS | `{cnt.get('PASS', 0)}` | 有证据且通过 PASS 门禁 |\n"
        f"| FAIL | `{cnt.get('FAIL', 0)}` | 不符预期，根因见缺陷清单 |\n"
        f"| BLOCKED | `{cnt.get('BLOCKED', 0)}` | 环境/权限/凭证阻塞 |\n"
        f"| SPEC-MISMATCH | `{cnt.get('SPEC-MISMATCH', 0)}` | 契约漂移 |\n"
        f"| NOT_RUN | `{cnt.get('NOT_RUN', 0)}` | 未执行 |\n"
    )


def build_report(client, os_name, date, ip, model, sut=""):
    pack = find_pack_dir(client, date, ip, os_name)
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    design_rows, _ = load_csv(os.path.join(pack, "用例矩阵-设计级.csv"))
    exp_rows, _ = load_csv(os.path.join(pack, "用例矩阵-展开级.csv"))

    d_cnt, d_fails, d_notrun, d_blocked = stats(design_rows)
    e_cnt, e_fails, e_notrun, e_blocked = stats(exp_rows)

    total_planned = len(design_rows) + len(exp_rows)
    all_cnt = {s: d_cnt.get(s, 0) + e_cnt.get(s, 0) for s in VALID_STATUS}
    p0 = sum(1 for f in d_fails + e_fails if f[0] == "P0")
    p1 = sum(1 for f in d_fails + e_fails if f[0] == "P1")
    p2 = sum(1 for f in d_fails + e_fails if f[0] == "P2")
    rate = pass_rate(all_cnt)
    concl = "PARTIAL" if all_cnt.get("FAIL", 0) > 0 else ("PASS" if all_cnt.get("NOT_RUN", 0) == 0 and all_cnt.get("BLOCKED", 0) == 0 else "PARTIAL")

    fails_all = d_fails + e_fails
    notrun_all = d_notrun + e_notrun
    blocked_all = d_blocked + e_blocked

    L = []
    L.append(f"# {client}-{model} 每日测试报告\n")
    L.append(f"> **报告名**：`{client}-{model}-测试报告.md`\n")
    L.append(f"> **生成时间**：{now}（北京时间）\n")
    L.append(f"> **执行归档**：`results/{client}/{date}-{ip}/{os_name}/`\n")
    L.append(f"> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）\n")
    L.append(f"> **结论**：`{concl}`（{ '有 FAIL 缺陷，P0 ' + str(p0) + ' 项' if p0 else '无 P0 缺陷' }）\n\n---\n\n")

    L.append("## 一、测试概述\n\n")
    L.append("| 项 | 值 |\n|---|---|\n")
    L.append(f"| 客户端 / Agent | `{client}` + `{model}` |\n")
    L.append(f"| OS / 架构 | `{os_name}` |\n")
    L.append(f"| 被测版本（SUT） | `{sut or 'TODO: 待填（npm 包版本 + gitHead）'}` |\n")
    L.append(f"| daily 基础用例 | 设计级 {len(design_rows)} / 展开级 {len(exp_rows)} |\n\n")
    L.append("> **执行方法**：TODO: 待 agent 补充（探针直调 / MCP 真机 / 真云 E2E 等）\n\n---\n\n")

    L.append("## 二、执行摘要\n\n")
    L.append("| 项 | 值 |\n|---|---|\n")
    L.append(f"| 计划用例（daily） | `{total_planned}`（设计级 {len(design_rows)} + 展开级 {len(exp_rows)}） |\n")
    executed = total_planned - all_cnt.get("NOT_RUN", 0)
    L.append(f"| 已执行 | `{executed}` |\n")
    L.append(f"| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `{all_cnt['PASS']} / {all_cnt['FAIL']} / {all_cnt['BLOCKED']} / {all_cnt['SPEC-MISMATCH']} / {all_cnt['NOT_RUN']}` |\n")
    L.append(f"| 通过率（分母 = PASS+FAIL = {all_cnt['PASS'] + all_cnt['FAIL']}） | `{rate}%` |\n")
    L.append(f"| P0 / P1 / P2 新增缺陷 | `{p0} / {p1} / {p2}` |\n")
    L.append("| 红线（I 类）违规 | `TODO: 待填` |\n")
    L.append("| 资源释放 | `TODO: 待填` |\n\n---\n\n")

    L.append("## 三、状态汇总\n\n")
    L.append("### 3.1 设计级\n\n")
    L.append("| 状态 | 数量 | 说明 |\n|---|---|---|\n")
    L.append(_table_status(d_cnt))
    L.append(f"| **合计** | **`{len(design_rows)}`** | |\n\n")
    L.append("### 3.2 展开级\n\n")
    L.append("| 状态 | 数量 | 说明 |\n|---|---|---|\n")
    L.append(_table_status(e_cnt))
    L.append(f"| **合计** | **`{len(exp_rows)}`** | |\n\n---\n\n")

    L.append("## 四、缺陷清单\n\n")
    if fails_all:
        L.append("| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |\n|---|---|---|---|---|---|---|\n")
        for i, (prio, cid, dim, title) in enumerate(fails_all, 1):
            L.append(f"| {i} | {prio} | `{cid}` | {dim} | {title} | TODO: 待补根因 | 待提单 |\n")
        L.append("\n### 根因详情\n\n")
        L.append("> TODO: 每个 FAIL 用例的「期望 / 实际 / 根因（文件:行号）/ 证据」需由 agent 依据 evidence/<case-id>/stdout.log 补充。\n")
    else:
        L.append("本轮无 FAIL 用例。\n")
    L.append("\n---\n\n")

    L.append("## 五、未执行用例与原因\n\n")
    if notrun_all or blocked_all:
        if notrun_all:
            L.append("### NOT_RUN\n\n")
            L.append("| 用例ID | 维度 | 标题 | 原因 |\n|---|---|---|---|\n")
            for cid, dim, title, why in notrun_all:
                L.append(f"| `{cid}` | {dim} | {title} | {why or 'TODO: 待补原因'} |\n")
        if blocked_all:
            L.append("\n### BLOCKED\n\n")
            L.append("| 用例ID | 维度 | 标题 | 阻塞原因 |\n|---|---|---|---|\n")
            for cid, dim, title, why in blocked_all:
                L.append(f"| `{cid}` | {dim} | {title} | {why or 'TODO: 待补原因'} |\n")
    else:
        L.append("无未执行用例。全部用例均已执行并回填。\n")
    L.append("\n---\n\n")

    L.append("## 六、安全与红线合规\n\n")
    L.append("- [ ] 凭证泄漏事件：`TODO: 待填`\n")
    L.append("- [ ] 写操作误判 read-only：`TODO: 待填`\n")
    L.append("- [ ] 红线（I 类）违规：`TODO: 待填`\n")
    L.append("- [ ] 脱敏复核：`TODO: 待填`\n\n---\n\n")

    L.append("## 七、资源释放\n\n")
    L.append("| 资源 | 创建 | 销毁 | 归零验证 |\n|---|---|---|---|\n")
    L.append("| TODO | TODO | TODO | TODO |\n\n> TODO: 真云用例的资源创建/销毁/归零情况由 agent 依据执行过程补充。\n\n---\n\n")

    L.append("## 八、遗留与建议\n\n")
    L.append("- TODO: 待裁决 SPEC / 未覆盖项 / 修复建议由 agent 补充。\n")

    return pack, "".join(L)


def main():
    args = sys.argv[1:]
    if len(args) < 3 or args[0] not in CLIENTS or args[1] not in OSES:
        print("用法: python gen_report.py <客户端> <OS> --model <模型名> [--date YYYY-MM-DD] [--sut <版本>] [--write]")
        sys.exit(2)
    client, os_name = args[0], args[1]
    model = args[args.index("--model") + 1] if "--model" in args else "unknown"
    date = args[args.index("--date") + 1] if "--date" in args else datetime.datetime.now().strftime("%Y-%m-%d")
    sut = args[args.index("--sut") + 1] if "--sut" in args else ""
    write = "--write" in args

    ip = get_machine_ip()
    pack, report = build_report(client, os_name, date, ip, model, sut)

    print("=" * 60)
    print(report)
    print("=" * 60)

    if write:
        out = os.path.join(pack, f"{client}-{model}-测试报告.md")
        with open(out, "w", encoding="utf-8", newline="\n") as f:
            f.write(report)
        print(f"\n[DONE] 测试报告已写入: {out}")
    else:
        print(f"\n[DRY-RUN] 未写盘。加 --write 才写入 {pack}/{client}-{model}-测试报告.md")


if __name__ == "__main__":
    main()