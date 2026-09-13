# -*- coding: utf-8 -*-
"""每日执行包初始化：results/<客户端>/<日期>-<IP>/<OS>/ 建目录 + 复制 daily 精选用例 CSV + 追踪表。

用法:
    python init_day.py OpenCode Windows             # 当天，Windows
    python init_day.py OpenCode Linux 2026-09-12    # 指定日期，Linux

机器标识（IP）来源：环境变量 HDK_MACHINE_IP > ~/.hdk_ip 文件 > socket 自动检测。
多台机器跑相同客户端时，靠 <日期>-<IP> 区分，避免 push 到同一仓库冲突。

daily（test-cases/daily/）为每日精选子集（纯设计定义、无执行态）；复制到 results 副本时，
为设计级/展开级追加「执行状态」+「执行时间」+「evidencePath」空列，供 agent 执行后回填；追踪表追加「执行时间」列。
"""
import os, sys, datetime, socket, csv

CLIENTS = ["OpenCode", "Codex", "CodeArtsAgent", "CodeArtsWork", "WorkBuddy",
           "DSH", "OfficeAce", "Hermes", "OpenClaw", "AtomCode"]
OSES = ["Windows", "Linux"]

REPO = os.environ.get("HDK_TEST_REPO") or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


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
    ip = get_machine_ip()

    dst = os.path.join(REPO, "results", client, f"{date}-{ip}", os_name)
    os.makedirs(dst, exist_ok=True)

    copies = [
        ("test-cases", "daily", "用例矩阵-设计级.csv", ["执行状态", "执行时间", "evidencePath"]),
        ("test-cases", "daily", "用例矩阵-展开级.csv", ["执行状态", "执行时间", "evidencePath"]),
        ("test-cases", "tracing", "需求-设计-证据追踪表.csv", ["执行时间"]),
    ]
    for parts in copies:
        src = os.path.join(REPO, *parts[:3])
        if not os.path.isfile(src):
            print(f"【错误】测试用例缺失: {src}")
            sys.exit(3)
        dst_path = os.path.join(dst, parts[2])
        extra_cols = parts[3]
        # 复制后追加执行态空列供 agent 回填（执行状态/执行时间/证据路径）
        with open(src, encoding="utf-8-sig") as f:
            drows = list(csv.DictReader(f))
        fields = list(drows[0].keys()) + extra_cols
        with open(dst_path, "w", encoding="utf-8-sig", newline="") as f:
            w = csv.DictWriter(f, fieldnames=fields)
            w.writeheader()
            for r in drows:
                for c in extra_cols:
                    r[c] = ""
                w.writerow(r)
        print("复制:", parts[2], "追加列:", extra_cols)

    print("执行包:", dst)
    print("下一步: 逐条执行 -> 回填「执行状态」+「执行时间」列 -> 出测试报告(<Agent>-<模型>-测试报告.md)")


if __name__ == "__main__":
    main()