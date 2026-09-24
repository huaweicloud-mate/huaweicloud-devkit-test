# -*- coding: utf-8 -*-
"""执行包初始化：results/<客户端>/<日期>-<IP>/<OS>/ 建目录 + 复制用例 CSV + 追踪表。

用法:
    python init_day.py OpenCode Windows                     # daily 精选（默认）
    python init_day.py OpenCode Windows 2026-09-12          # 指定日期，daily
    python init_day.py OpenCode Windows --full              # 母版全量（design 179 + expanded 137）
    python init_day.py OpenCode Windows --version v1.1.3    # 版本冻结快照

模式（用例源）:
    daily（默认）      : test-cases/daily/ 精选子集（设计级 81 + 展开级 71）
    full               : test-cases/design/ + test-cases/expanded/ 母版全量（179 + 137）
    version <版本>     : test-cases/versions/<版本>/ 冻结快照（文件名带版本后缀）
    追踪表三种模式统一用 test-cases/tracing/（版本快照不含追踪表，用母版追踪表）。

展开级预筛（2026-09-15 起）: 复制展开级时按「本客户端 + 本 OS」过滤，只下发归本 agent 执行的行，
    不涉及本客户端的展开级不再下发（不再靠 agent 自己标 NOT_RUN）。设计级/追踪表保持全量下发。

机器标识（IP）来源：环境变量 HDK_MACHINE_IP > ~/.hdk_ip 文件 > socket 自动检测。
多台机器跑相同客户端时，靠 <日期>-<IP> 区分，避免 push 到同一仓库冲突。

复制到 results 副本时，为设计级/展开级追加「执行状态」+「执行时间」+「evidencePath」+「blockedReason」空列，
供 agent 执行后回填；追踪表追加「执行时间」列。blockedReason 承载 NOT_RUN/BLOCKED 的未执行原因（详情分类见报告 §五「未执行用例与原因」）。
"""
import os, sys, datetime, socket, csv, re

CLIENTS = ["OpenCode", "Codex", "CodeArtsAgent", "CodeArtsSpace", "WorkBuddy",
           "DSH", "OfficeAce", "Hermes", "OpenClaw", "AtomCode"]
OSES = ["Windows", "Linux"]

REPO = os.environ.get("HDK_TEST_REPO") or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 展开级「通用能力类」：所有客户端都跑（代表客户端 = 全体，服务/评测能力属通用验证）
GENERAL_TYPES = ("D3-C4服务矩阵", "D10评测集")


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


def _mine(client, os_name, row):
    """展开级预筛：该行是否归本客户端 + 本 OS 执行。

    判定规则（设计级/追踪表不走此筛选，保持全量下发）：
      1. OS 匹配：OS 列（Windows/Linux/macOS 或组合）需含本机 OS；不匹配则剔除。
      2. 通用能力类（D3-C4 服务矩阵 / D10 评测集）：所有客户端都跑，直接保留。
      3. 精确归属类（D5 客户端矩阵 / NR3 终端矩阵 / D1-58 白名单）：agent 列按 / ; , 分词后精确匹配本客户端。
    """
    os_ = (row.get("OS") or "").strip()
    if os_name not in os_:
        return False
    if (row.get("展开类型") or "").strip() in GENERAL_TYPES:
        return True
    agent = (row.get("agent") or "").strip()
    toks = {t.strip() for t in re.split(r"[/;,]", agent) if t.strip()}
    return client in toks


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


def parse_args(argv):
    """从 sys.argv[3:] 解析 mode / version / date（三者可任意顺序）。返回 (mode, version, date)。"""
    mode, version, date = "daily", None, None
    i = 0
    while i < len(argv):
        a = argv[i]
        if a == "--full":
            mode = "full"
        elif a == "--version":
            mode = "version"
            if i + 1 < len(argv) and not argv[i + 1].startswith("--"):
                version = argv[i + 1]
                i += 1
        elif not a.startswith("--") and date is None:
            date = a
        i += 1
    if mode == "version" and not version:
        print("【错误】--version 需指定版本号，如 --version v1.1.3")
        sys.exit(2)
    if date is None:
        date = datetime.datetime.now().strftime("%Y-%m-%d")
    return mode, version, date


def build_copies(mode, version):
    """按模式返回 [(目录1, 目录2, 源文件名, 目标文件名, 追加空列), ...]，目标文件名统一（验证脚本依赖标准名）。"""
    extra = ["执行状态", "执行时间", "evidencePath", "blockedReason"]
    trace_extra = ["执行时间"]
    if mode == "full":
        design = ("test-cases", "design", "用例矩阵-设计级.csv", "用例矩阵-设计级.csv", extra)
        expanded = ("test-cases", "expanded", "用例矩阵-展开级.csv", "用例矩阵-展开级.csv", extra)
    elif mode == "version":
        design = ("test-cases", f"versions/{version}", f"用例矩阵-设计级-{version}.csv", "用例矩阵-设计级.csv", extra)
        expanded = ("test-cases", f"versions/{version}", f"用例矩阵-展开级-{version}.csv", "用例矩阵-展开级.csv", extra)
    else:  # daily（默认）
        design = ("test-cases", "daily", "用例矩阵-设计级.csv", "用例矩阵-设计级.csv", extra)
        expanded = ("test-cases", "daily", "用例矩阵-展开级.csv", "用例矩阵-展开级.csv", extra)
    tracing = ("test-cases", "tracing", "需求-设计-证据追踪表.csv", "需求-设计-证据追踪表.csv", trace_extra)
    return [design, expanded, tracing]


def main():
    check_prereq()
    if len(sys.argv) < 3:
        print("用法: python init_day.py <客户端> <OS> [日期] [--full | --version <版本>]")
        print("客户端:", ", ".join(CLIENTS))
        print("OS:", ", ".join(OSES))
        print("模式: 默认 daily 精选 | --full 母版全量 | --version <版本> 版本冻结快照")
        sys.exit(2)
    client, os_name = sys.argv[1], sys.argv[2]
    if client not in CLIENTS:
        print(f"未知客户端 '{client}'，可选: {', '.join(CLIENTS)}")
        sys.exit(2)
    if os_name not in OSES:
        print(f"未知 OS '{os_name}'，可选: {', '.join(OSES)}")
        sys.exit(2)
    mode, version, date = parse_args(sys.argv[3:])
    ip = get_machine_ip()

    dst = os.path.join(REPO, "results", client, f"{date}-{ip}", os_name)
    os.makedirs(dst, exist_ok=True)

    for dir1, dir2, src_name, dst_name, extra_cols in build_copies(mode, version):
        src = os.path.join(REPO, dir1, dir2, src_name)
        if not os.path.isfile(src):
            print(f"【错误】测试用例缺失: {src}")
            sys.exit(3)
        dst_path = os.path.join(dst, dst_name)
        # 复制后追加执行态空列供 agent 回填（执行状态/执行时间/证据路径）。
        # 健壮处理：若源已含同名列（历史版本快照可能不规范地带执行态列），只追加缺失列 + 统一置空，
        # 避免 CSV 出现重复列，并确保执行态从零开始。
        with open(src, encoding="utf-8-sig") as f:
            drows = list(csv.DictReader(f))
        existing = set(drows[0].keys())
        new_cols = [c for c in extra_cols if c not in existing]
        fields = list(drows[0].keys()) + new_cols
        filtered = 0
        with open(dst_path, "w", encoding="utf-8-sig", newline="") as f:
            w = csv.DictWriter(f, fieldnames=fields)
            w.writeheader()
            for r in drows:
                # 展开级预筛：只保留归本客户端+本 OS 的执行行（设计级/追踪表全量下发）
                if "展开级" in dst_name and not _mine(client, os_name, r):
                    filtered += 1
                    continue
                for c in extra_cols:
                    r[c] = ""
                w.writerow(r)
        note = f"，预筛剔除 {filtered} 条非本客户端/OS" if (filtered and "展开级" in dst_name) else ""
        print("复制:", dst_name, "（源:", f"{dir1}/{dir2}/{src_name}", "）追加列:", extra_cols, note)

    print("执行包:", dst)
    print(f"模式: {mode}" + (f"（版本 {version}）" if version else ""))
    print("下一步: 逐条执行 -> 回填「执行状态」+「执行时间」列 -> 出测试报告(<Agent>-<模型>-测试报告.md)")


if __name__ == "__main__":
    main()