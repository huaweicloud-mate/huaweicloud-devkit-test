#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把 grouped probe stdout.log (含多条 results) 拆分到每个 case-id/stdout.log。

用法: python scripts/distribute_group_logs.py <客户端> <OS> [--date YYYY-MM-DD]

读取 evidence/<group>/stdout.log（如 d1-upgrade, d2-auth, d4-security, mcp-tools,
c4-service-matrix, D9-13, D10-4），按 results[].id 分组，写入 evidence/<case-id>/stdout.log。
若某 case-id 目录已有 stdout.log 且 source 字段指向 source-inspect，不覆盖。
"""
import os, sys, json, datetime, socket, csv

CLIENTS = ["OpenCode", "Codex", "CodeArtsAgent", "CodeArtsSpace", "WorkBuddy",
           "DSH", "OfficeAce", "Hermes", "OpenClaw", "AtomCode"]
OSES = ["Windows", "Linux"]

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
    repo = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(repo, "results", client, f"{date}-{ip}", os_name)

def distribute_group_log(group_dir, group_name, ev_dir):
    """读 group_dir/stdout.log, 按 results[].id 拆到 case-id 目录。"""
    p = os.path.join(group_dir, "stdout.log")
    if not os.path.isfile(p):
        return 0, []
    try:
        data = json.loads(open(p, encoding="utf-8").read())
    except Exception as e:
        print(f"  [WARN] {group_name}/stdout.log JSON 解析失败: {e}")
        return 0, []
    results = data.get("results", [])
    if not results:
        return 0, []
    # group by id
    by_id = {}
    for r in results:
        cid = r.get("id", "").strip()
        if not cid:
            continue
        by_id.setdefault(cid, []).append(r)
    written = []
    for cid, items in by_id.items():
        case_dir = os.path.join(ev_dir, cid)
        os.makedirs(case_dir, exist_ok=True)
        out_p = os.path.join(case_dir, "stdout.log")
        # 若已有 source-inspect 写的 stdout.log，不覆盖
        if os.path.isfile(out_p):
            try:
                old = json.loads(open(out_p, encoding="utf-8").read())
                if old.get("source", "").startswith("source-inspect"):
                    continue
            except Exception:
                pass
        all_pass = all(it.get("pass", False) for it in items)
        output = {
            "case": cid,
            "status": "PASS" if all_pass else "FAIL",
            "total": len(items),
            "passed": sum(1 for it in items if it.get("pass", False)),
            "results": items,
            "source": f"{group_name}/probe.mjs",
        }
        with open(out_p, "w", encoding="utf-8") as f:
            json.dump(output, f, ensure_ascii=False, indent=2)
        written.append(cid)
    return len(written), written

def main():
    if len(sys.argv) < 3:
        print("用法: python distribute_group_logs.py <客户端> <OS> [--date YYYY-MM-DD]")
        sys.exit(2)
    client, os_name = sys.argv[1], sys.argv[2]
    if client not in CLIENTS:
        print(f"未知客户端 '{client}'"); sys.exit(2)
    if os_name not in OSES:
        print(f"未知 OS '{os_name}'"); sys.exit(2)
    date = datetime.datetime.now().strftime("%Y-%m-%d")
    if "--date" in sys.argv:
        date = sys.argv[sys.argv.index("--date") + 1]
    ip = get_machine_ip()
    pack = find_pack_dir(client, date, ip, os_name)
    ev = os.path.join(pack, "evidence")
    if not os.path.isdir(ev):
        print(f"[ERROR] evidence 目录不存在: {ev}")
        sys.exit(2)
    total = 0
    for name in sorted(os.listdir(ev)):
        gd = os.path.join(ev, name)
        if not os.path.isdir(gd):
            continue
        # 只处理 group 目录（有 probe.mjs 且 stdout.log 含 results 数组）
        if not os.path.isfile(os.path.join(gd, "probe.mjs")):
            continue
        n, written = distribute_group_log(gd, name, ev)
        if n:
            print(f"  [{name}] 分发 {n} 条: {', '.join(written[:10])}{'...' if len(written)>10 else ''}")
            total += n
    print(f"\n[DONE] 共分发 {total} 条 case-id stdout.log")

if __name__ == "__main__":
    main()
