# -*- coding: utf-8 -*-
"""每日执行包初始化：results/<客户端>/<日期>/<OS>/ 建目录 + 复制 3 份测试用例 CSV。

用法:
    python init_day.py OpenCode Windows             # 当天，Windows
    python init_day.py OpenCode Linux 2026-09-12    # 指定日期，Linux

前置条件：测试仓库已 clone 到 REPO（含 test-cases/），见 SKILL.md「前置条件」。
"""
import os, sys, shutil, datetime

CLIENTS = ["OpenCode", "Codex", "CodeArtsAgent", "CodeArtsWork", "WorkBuddy",
           "DSH", "OfficeAce", "Hermes", "OpenClaw", "AtomCode"]
OSES = ["Windows", "Linux"]

REPO = os.environ.get("HDK_TEST_REPO") or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def check_prereq():
    missing = []
    if not os.path.isdir(REPO):
        missing.append(f"测试仓库不存在: {REPO}")
    elif not os.path.isdir(os.path.join(REPO, "test-cases")):
        missing.append(f"仓库缺 test-cases/ 目录: {REPO}")
    if missing:
        print("【前置条件不满足，请先 prepare_env.py 准备环境】")
        for m in missing:
            print("  -", m)
        sys.exit(3)


def main():
    check_prereq()
    if len(sys.argv) < 3:
        print("用法: python init_day.py <客户端> <OS> [日期]")
        print("客户端:", ", ".join(CLIENTS))
        print("OS:", ", ".join(OSES))
        sys.exit(2)
    client, os_name = sys.argv[1], sys.argv[2]
    if client not in CLIENTS:
        print(f"未知客户端 '{client}'，可选: {', '.join(CLIENTS)}")
        sys.exit(2)
    if os_name not in OSES:
        print(f"未知 OS '{os_name}'，可选: {', '.join(OSES)}")
        sys.exit(2)
    date = sys.argv[3] if len(sys.argv) > 3 else datetime.datetime.now().strftime("%Y-%m-%d")

    dst = os.path.join(REPO, "results", client, date, os_name)
    os.makedirs(dst, exist_ok=True)

    copies = [
        ("test-cases", "design", "用例矩阵-设计级.csv"),
        ("test-cases", "expanded", "用例矩阵-展开级.csv"),
        ("test-cases", "tracing", "需求-设计-证据追踪表.csv"),
    ]
    for parts in copies:
        src = os.path.join(REPO, *parts)
        if not os.path.isfile(src):
            print(f"【错误】测试用例缺失: {src}")
            sys.exit(3)
        shutil.copy2(src, os.path.join(dst, parts[-1]))
        print("复制:", parts[-1])

    print("执行包:", dst)
    print("下一步: 逐条执行 -> 回填「执行状态」列 -> 出测试报告(<Agent>-<模型>-测试报告.md)")


if __name__ == "__main__":
    main()