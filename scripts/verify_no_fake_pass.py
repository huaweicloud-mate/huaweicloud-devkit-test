# -*- coding: utf-8 -*-
"""PASS 门禁校验：标 PASS 的用例如无 evidencePath 证据即判虚报。

用法:
    python verify_no_fake_pass.py <客户端> <OS> [日期]

规则：PASS 用例必须满足 evidencePath 非空 + 该证据路径在当日执行包内存在。
    未执行(NOT_RUN)/无结果/无证据却标 PASS → 报虚报，exit 1。
"""
import os, sys, csv, datetime, socket

REPO = os.environ.get("HDK_TEST_REPO") or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
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


def check(kind, status_key, ev_key, pack_dir):
    src = os.path.join(pack_dir, f"用例矩阵-{kind}.csv")
    if not os.path.isfile(src):
        print(f"[跳过] 缺 {kind} 副本: {src}")
        return []
    fake = []
    with open(src, encoding="utf-8-sig") as f:
        for r in csv.DictReader(f):
            if (r.get(status_key) or r.get("execution_status") or "").strip().upper() == "PASS":
                ev = (r.get(ev_key) or "").strip()
                if not ev:
                    fake.append((r.get("ID", "?"), "标 PASS 但 evidencePath 为空"))
                elif not os.path.exists(os.path.join(pack_dir, ev)):
                    fake.append((r.get("ID", "?"), f"evidencePath 指向不存在: {ev}"))
    return fake


def main():
    if len(sys.argv) < 3:
        print("用法: python verify_no_fake_pass.py <客户端> <OS> [日期]")
        sys.exit(2)
    client, os_name = sys.argv[1], sys.argv[2]
    if client not in CLIENTS:
        print(f"未知客户端 '{client}'，可选: {', '.join(CLIENTS)}"); sys.exit(2)
    if os_name not in OSES:
        print(f"未知 OS '{os_name}'，可选: {', '.join(OSES)}"); sys.exit(2)
    date = sys.argv[3] if len(sys.argv) > 3 else datetime.datetime.now().strftime("%Y-%m-%d")
    pack_dir = os.path.join(REPO, "results", client, f"{date}-{get_machine_ip()}", os_name)

    fakes = check("设计级", "执行状态", "evidencePath", pack_dir) + \
            check("展开级", "执行状态", "evidencePath", pack_dir)
    if fakes:
        print(f"【虚报 PASS 门禁】发现 {len(fakes)} 条疑似虚报（标 PASS 但无证据）:")
        for cid, reason in fakes:
            print(f"  - {cid}: {reason}")
        print("请补证据或改为 NOT_RUN/BLOCKED，不得虚报。")
        sys.exit(1)
    print("PASS 门禁校验通过：所有 PASS 用例均有 evidencePath 且证据存在。")


if __name__ == "__main__":
    main()