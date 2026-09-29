# -*- coding: utf-8 -*-
"""PASS 门禁校验：标 PASS 的用例如无 evidencePath 证据即判虚报。

用法:
    python verify_no_fake_pass.py <客户端> <OS> [日期]

规则：PASS 用例必须满足 evidencePath 非空 + 该证据路径在当日执行包内存在 + 证据真实（有非空执行输出、probe 非空壳）。
    未执行(NOT_RUN)/无结果/无证据/空壳证据却标 PASS → 报虚报，exit 1。
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


def _is_shell_probe_text(txt):
    """空壳探针文本：非空行全是注释（// 或 #），无任何实际执行代码。"""
    lines = [l for l in txt.splitlines() if l.strip()]
    if not lines:
        return True
    code_lines = [l for l in lines if not l.strip().startswith(("//", "#"))]
    return len(code_lines) == 0


def _probe_state(ev_dir):
    """evidence 目录探针状态：'empty_shell'(全空壳) / 'real'(有真实探针) / 'no_probe'(无 .mjs)。"""
    if not os.path.isdir(ev_dir):
        return "no_probe"
    probes = []
    for fn in os.listdir(ev_dir):
        if fn.lower().endswith(".mjs"):
            fp = os.path.join(ev_dir, fn)
            try:
                with open(fp, encoding="utf-8", errors="replace") as f:
                    probes.append(f.read())
            except OSError:
                continue
    if not probes:
        return "no_probe"
    return "empty_shell" if all(_is_shell_probe_text(t) for t in probes) else "real"


def _has_output_file(ev_dir):
    """evidence 目录是否存在非空执行输出（.log/.txt/.json/.out/stdout/stderr 等）。"""
    if not os.path.isdir(ev_dir):
        return False
    for fn in os.listdir(ev_dir):
        fp = os.path.join(ev_dir, fn)
        if not os.path.isfile(fp):
            continue
        low = fn.lower()
        if low.endswith((".log", ".txt", ".json", ".out", ".stdout", ".stderr")) or "stdout" in low or "stderr" in low:
            try:
                if os.path.getsize(fp) > 0:
                    return True
            except OSError:
                pass
    return False


def check(kind, status_key, ev_key, pack_dir):
    src = os.path.join(pack_dir, f"用例矩阵-{kind}.csv")
    if not os.path.isfile(src):
        print(f"[跳过] 缺 {kind} 副本: {src}")
        return []
    fake = []
    with open(src, encoding="utf-8-sig") as f:
        for r in csv.DictReader(f):
            if (r.get(status_key) or r.get("execution_status") or "").strip().upper() != "PASS":
                continue
            cid = r.get("ID", "?")
            ev = (r.get(ev_key) or "").strip()
            if not ev:
                fake.append((cid, "标 PASS 但 evidencePath 为空"))
                continue
            ev_path = os.path.join(pack_dir, ev)
            if not os.path.exists(ev_path):
                fake.append((cid, f"evidencePath 指向不存在: {ev}"))
                continue
            ev_dir = ev_path if os.path.isdir(ev_path) else os.path.dirname(ev_path)
            state = _probe_state(ev_dir)
            if state == "empty_shell":
                fake.append((cid, "证据为空壳探针（.mjs 全注释、硬编码 Status: PASS、无执行逻辑），疑似虚报"))
            elif state == "no_probe" and not _has_output_file(ev_dir):
                fake.append((cid, "证据目录无 .mjs 探针也无执行输出文件，疑似未真实执行"))
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