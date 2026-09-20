# -*- coding: utf-8 -*-
"""每日测试批量回填：读 evidence/<case-id>/stdout.log → 批量回填 CSV 执行状态/时间/evidencePath。

用法:
    python scripts/backfill_daily.py <客户端> <OS> [--date YYYY-MM-DD] [--write]

设计目标（解决「工具调用上限」回填挤爆 max_turns 的问题）:
    每日流程第 3 步「逐条回填 CSV」原本靠 agent 逐条 read+write（上百次工具调用），
    本脚本把它压成 1 次脚本调用：agent 只需跑一句 `python scripts/backfill_daily.py <客户端> <OS> --write`。

安全边界（红线，硬编码）:
    1. 只读 evidence/<case-id>/stdout.log（探针执行后落盘的结果），绝不执行任何 probe.mjs，
       因此绝不触发真云建删资源等副作用。
    2. 无 stdout.log 的用例 → 跳过并保留 CSV 原值，绝不「无条件造 PASS」。
    3. stdout.log 内容无法判定状态时 → 跳过（宁可漏填，不可虚报）。

stdout.log 约定（配合「探针执行后写 stdout.log」约定，见 AGENTS.md）:
    JSON 对象，至少含 status 字段（PASS/FAIL/BLOCKED/SPEC-MISMATCH/NOT_RUN），
    可选 pass(bool)、why(str)、executedAt(14位)。
    松散解析：允许顶层是 {id: {...}} 映射，或直接 {...}。
"""
import os, sys, csv, json, datetime, socket

REPO = os.environ.get("HDK_TEST_REPO") or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CLIENTS = ["OpenCode", "Codex", "CodeArtsAgent", "CodeArtsWork", "WorkBuddy",
           "DSH", "OfficeAce", "Hermes", "OpenClaw", "AtomCode"]
OSES = ["Windows", "Linux"]
VALID_STATUS = {"PASS", "FAIL", "BLOCKED", "SPEC-MISMATCH", "NOT_RUN"}


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


def read_stdout_status(case_dir):
    """读 evidence/<case-id>/stdout.log → (status, why, executedAt)，不可判定返 None。"""
    p = os.path.join(case_dir, "stdout.log")
    if not os.path.isfile(p):
        return None
    try:
        raw = open(p, encoding="utf-8").read().strip()
    except Exception:
        return None
    if not raw:
        return None
    data = None
    try:
        data = json.loads(raw)
    except Exception:
        # 非 JSON：慵懒匹配一个状态词
        for s in ("SPEC-MISMATCH", "BLOCKED", "NOT_RUN", "FAIL", "PASS"):
            if s in raw.upper():
                return s, "", ""
        return None
    if isinstance(data, dict) and "status" not in data and len(data) == 1:
        # 顶层是 {id: {...}} 映射
        data = list(data.values())[0]
    if not isinstance(data, dict):
        return None
    status = (data.get("status") or "").strip().upper()
    if not status:
        # 兼容 pass 布尔
        if "pass" in data:
            status = "PASS" if data["pass"] else "FAIL"
    if status not in VALID_STATUS:
        return None
    why = str(data.get("why", "") or data.get("blockedReason", "") or "")
    ts = str(data.get("executedAt", "") or "")
    return status, why, ts


def backfill_csv(csv_path, status_map):
    """按 ID 回填一份 CSV；返回 (改了N条, 跳过N条)。"""
    if not os.path.isfile(csv_path):
        return 0, 0
    rows = list(csv.DictReader(open(csv_path, encoding="utf-8-sig")))
    if not rows:
        return 0, 0
    fields = list(rows[0].keys())
    changed = skipped = 0
    for r in rows:
        cid = (r.get("ID") or "").strip()
        if cid not in status_map:
            skipped += 1
            continue
        status, why, ts = status_map[cid]
        r["执行状态"] = status
        r["执行时间"] = ts or datetime.datetime.now().strftime("%Y%m%d%H%M%S")
        r["evidencePath"] = f"evidence/{cid}" if status in ("PASS", "FAIL", "SPEC-MISMATCH") else ""
        # blockedReason：若该字段存在且状态 BLOCKED 才写
        if "blockedReason" in fields:
            r["blockedReason"] = why if status == "BLOCKED" else ""
        changed += 1
    with open(csv_path, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)
    return changed, skipped


def main():
    if len(sys.argv) < 3:
        print("用法: python backfill_daily.py <客户端> <OS> [--date YYYY-MM-DD] [--write]")
        sys.exit(2)
    client, os_name = sys.argv[1], sys.argv[2]
    if client not in CLIENTS:
        print(f"未知客户端 '{client}'"); sys.exit(2)
    if os_name not in OSES:
        print(f"未知 OS '{os_name}'"); sys.exit(2)
    date = datetime.datetime.now().strftime("%Y-%m-%d")
    if "--date" in sys.argv:
        date = sys.argv[sys.argv.index("--date") + 1]
    write = "--write" in sys.argv

    ip = get_machine_ip()
    pack = find_pack_dir(client, date, ip, os_name)
    ev = os.path.join(pack, "evidence")
    if not os.path.isdir(ev):
        print(f"[ERROR] 结果目录不存在: {pack}")
        sys.exit(2)

    # 扫 evidence/<case-id>/stdout.log → status_map
    status_map = {}
    no_log = []
    for cid in sorted(os.listdir(ev)):
        case_dir = os.path.join(ev, cid)
        if not os.path.isdir(case_dir):
            continue
        got = read_stdout_status(case_dir)
        if got is None:
            no_log.append(cid)
        else:
            status_map[cid] = got

    print(f"[INFO] evidence 目录扫描: {len(status_map)} 个有 stdout.log, {len(no_log)} 个无(跳过)")
    if no_log:
        print(f"  无 stdout.log 的用例(保留 CSV 原值): {', '.join(no_log[:30])}{'...' if len(no_log)>30 else ''}")

    if write:
        total_changed = total_skipped = 0
        for kind in ("设计级", "展开级", "需求-设计-证据追踪表"):
            p = os.path.join(pack, f"用例矩阵-{kind}.csv") if kind != "需求-设计-证据追踪表" \
                else os.path.join(pack, "需求-设计-证据追踪表.csv")
            c, s = backfill_csv(p, status_map)
            total_changed += c
            total_skipped += s
            print(f"[{kind}] 回填 {c} 条, 跳过 {s} 条")
        print(f"\n[DONE] 共回填 {total_changed} 条（1 次脚本调用替代逐条回填）")
    else:
        print(f"\n[DRY-RUN] 将回填 {len(status_map)} 条用例（{client}/{os_name} 的 {date}-{ip}）。")
        print("  加 --write 才真正写盘。")


if __name__ == "__main__":
    main()