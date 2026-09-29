# -*- coding: utf-8 -*-
"""维护者统一汇总：遍历所有 results/<客户端>/<日期>-<IP>/<OS> 执行结果，生成 Summary 总矩阵。

用法（维护者，所有 agent 提交后跑一次）:
    python build_summary.py [日期]

说明：方案3——agent 只提交自己 results/<客户端>/<日期>-<IP>/<OS>/ 目录，不碰 Summary；
     Summary 由本脚本统一汇总生成，矩阵列动态生成（<客户端>-<IP>-<OS>）。

不涉及(NA)口径（展开级）：
    展开级母版含结构化 agent / OS 两列（agent 用 / 分隔多客户端，如 Hermes/Codex/OpenCode；
    OS 如 Windows/Linux）。某客户端+OS 不涉及该展开用例时，该列标「NA」，统计为「不涉及」，
    与「未回填」（涉及但没填）区分开。设计级 agent 列为描述性文字且各客户端均测，不套用 NA。
"""
import os, sys, csv, datetime, re

REPO = os.environ.get("HDK_TEST_REPO") or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OSES = ["Windows", "Linux"]
SKIP_DIRS = {"Summary", "Regression", "version", "history"}


def summarize(statuses):
    """统计各状态数量，如 'PASS:4 FAIL:1 不涉及:65 未回填:1'。
    空列单列「未回填」；「NA」显示为「不涉及」（对应 agent 不涉及的展开用例）。"""
    order = ["PASS", "FAIL", "BLOCKED", "SPEC-MISMATCH", "NOT_RUN", "NA"]
    cnt = {}
    unfilled = 0
    for s in statuses:
        s = (s or "").strip()
        if not s:
            unfilled += 1
        else:
            cnt[s] = cnt.get(s, 0) + 1
    parts = []
    for s in order:
        if cnt.get(s):
            parts.append(f"不涉及:{cnt[s]}" if s == "NA" else f"{s}:{cnt[s]}")
    for s in sorted(cnt):
        if s not in order:
            parts.append(f"{s}:{cnt[s]}")
    if unfilled:
        parts.append(f"未回填:{unfilled}")
    return " ".join(parts) if parts else f"未回填:{len(statuses)}"


def _split_cell(cell):
    return [x.strip() for x in re.split(r"[/;；,，]", cell or "") if x.strip()]


def is_involved(agent_cell, os_cell, client, os_name):
    """判断某客户端+OS 是否「涉及」该用例（基于展开级母版的结构化 agent/OS 列）。"""
    agents = _split_cell(agent_cell)
    oses = _split_cell(os_cell)
    return client in agents and os_name in oses


def find_machine_dirs(date):
    """遍历 results/<client>/<date>-<ip>/<os>，返回 [(client, ip, os)]，只含实际有设计级 CSV 的 OS。"""
    results_dir = os.path.join(REPO, "results")
    found = []
    if not os.path.isdir(results_dir):
        return found
    for client in sorted(os.listdir(results_dir)):
        if client in SKIP_DIRS:
            continue
        cdir = os.path.join(results_dir, client)
        if not os.path.isdir(cdir):
            continue
        for sub in sorted(os.listdir(cdir)):
            if not sub.startswith(date + "-"):
                continue
            sdir = os.path.join(cdir, sub)
            if not os.path.isdir(sdir):
                continue
            ip = sub[len(date) + 1:] if sub.startswith(date + "-") else sub
            for os_name in OSES:
                if os.path.isfile(os.path.join(sdir, os_name, "用例矩阵-设计级.csv")):
                    found.append((client, ip, os_name))
    return found


def build(kind, src_rel, id_key, name_keys, status_key, date, machine_dirs, cols, na_judge=False):
    src = os.path.join(REPO, *src_rel)
    with open(src, encoding="utf-8-sig") as f:
        base_rows = list(csv.DictReader(f))

    summary = []
    for r in base_rows:
        row = {"层级": "设计级" if kind == "设计级" else "展开级", "ID": r[id_key]}
        for k in name_keys:
            row[k] = r.get(k, "")
        row["优先级"] = r.get("优先级", "")
        if na_judge:
            row["_agent"] = r.get("agent", "")
            row["_os"] = r.get("OS", "")
        for c in cols:
            row[c] = ""
        row["当日总执行状态"] = r.get(status_key, "")
        row["当日总执行时间"] = ""
        summary.append(row)

    for client, ip, os_name in machine_dirs:
        pack_csv = os.path.join(REPO, "results", client, f"{date}-{ip}", os_name, f"用例矩阵-{kind}.csv")
        if not os.path.isfile(pack_csv):
            continue
        with open(pack_csv, encoding="utf-8-sig") as f:
            rows = list(csv.DictReader(f))
        cmap = {r.get(id_key): (r.get(status_key) or r.get("execution_status") or "").strip() for r in rows}
        tmap = {r.get(id_key): (r.get("执行时间") or "").strip() for r in rows}
        col = f"{client}-{ip}-{os_name}"
        for row in summary:
            # 展开级：不涉及该客户端+OS 的用例标 NA（不据回填、不参与未回填）
            if na_judge and not is_involved(row.get("_agent", ""), row.get("_os", ""), client, os_name):
                row[col] = "NA"
                continue
            st = cmap.get(row["ID"], "")
            if st:
                row[col] = st
            t = tmap.get(row["ID"], "")
            if t:
                prev = row["当日总执行时间"]
                row["当日总执行时间"] = t if not prev else (t if t > prev else prev)

    for row in summary:
        vals = [row[c] for c in cols]
        row["当日总执行状态"] = summarize(vals)

    out = os.path.join(REPO, "results", "Summary", f"用例矩阵-{kind}-总执行结果-{date}.csv")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    fields = ["层级", "ID"] + name_keys + ["优先级"] + cols + ["当日总执行状态", "当日总执行时间"]
    with open(out, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
        w.writeheader()
        w.writerows(summary)
    filled = sum(1 for r in summary if any(r[c] for c in cols))
    na_count = sum(1 for r in summary if any(r.get(c) == "NA" for c in cols))
    print(f"[{kind}] {os.path.basename(out)}：{len(summary)} 行，{len(cols)} 列，已填 {filled} 条，不涉及(NA) {na_count} 条")


def _is_shell_probe_text(txt):
    """空壳探针文本：非空行全是注释（// 或 #），无任何实际执行代码。"""
    lines = [l for l in txt.splitlines() if l.strip()]
    if not lines:
        return True
    code_lines = [l for l in lines if not l.strip().startswith(("//", "#"))]
    return len(code_lines) == 0


def _dir_has_output(d):
    """目录（递归）是否有非空执行输出文件。"""
    for root, _dirs, files in os.walk(d):
        for fn in files:
            low = fn.lower()
            if low.endswith((".txt", ".log", ".json", ".out", ".stdout", ".stderr")) or "stdout" in low or "stderr" in low:
                fp = os.path.join(root, fn)
                try:
                    if os.path.getsize(fp) > 0:
                        return True
                except OSError:
                    pass
    return False


def _dir_probes_all_shell(d):
    """目录（递归）内是否存在 .mjs 探针且全部为空壳注释。"""
    probes = []
    for root, _dirs, files in os.walk(d):
        for fn in files:
            if fn.lower().endswith(".mjs"):
                fp = os.path.join(root, fn)
                try:
                    probes.append(open(fp, encoding="utf-8", errors="replace").read())
                except OSError:
                    pass
    return bool(probes) and all(_is_shell_probe_text(t) for t in probes)


def audit_client_evidence(machine_dirs, date):
    """证据诚信审计：按 evidence 用例子目录判定虚报。

    虚报目录 = 目录内 .mjs 探针全空壳注释 且 无非空执行输出（stdout 等）。
    返回 [(client, ip, os_name, pass_count, shell_dir, total_dir, fabricated)]。
    """
    results = []
    for client, ip, os_name in machine_dirs:
        pack_dir = os.path.join(REPO, "results", client, f"{date}-{ip}", os_name)
        ev_dir = os.path.join(pack_dir, "evidence")
        total_dir = 0
        shell_dir = 0
        if os.path.isdir(ev_dir):
            subs = [os.path.join(ev_dir, x) for x in os.listdir(ev_dir) if os.path.isdir(os.path.join(ev_dir, x))]
            if not subs:
                subs = [ev_dir]
            for d in subs:
                total_dir += 1
                if _dir_probes_all_shell(d) and not _dir_has_output(d):
                    shell_dir += 1
        pass_count = 0
        for kind in ("设计级", "展开级"):
            csvp = os.path.join(pack_dir, f"用例矩阵-{kind}.csv")
            if os.path.isfile(csvp):
                with open(csvp, encoding="utf-8-sig") as f:
                    for r in csv.DictReader(f):
                        if (r.get("执行状态") or r.get("execution_status") or "").strip().upper() == "PASS":
                            pass_count += 1
        shell_ratio = (shell_dir / total_dir) if total_dir else 0.0
        fabricated = pass_count > 0 and total_dir > 0 and shell_ratio >= 0.8
        results.append((client, ip, os_name, pass_count, shell_dir, total_dir, fabricated))
    return results


def main():
    date = sys.argv[1] if len(sys.argv) > 1 else datetime.datetime.now().strftime("%Y-%m-%d")
    machine_dirs = find_machine_dirs(date)
    cols = [f"{c}-{ip}-{o}" for c, ip, o in machine_dirs]
    print(f"发现的机器目录: {machine_dirs}")
    build("设计级", ("test-cases", "daily", "用例矩阵-设计级.csv"), "ID", ["维度", "标题"], "执行状态", date, machine_dirs, cols)
    build("展开级", ("test-cases", "daily", "用例矩阵-展开级.csv"), "ID", ["展开类型", "枚举对象", "源用例"], "执行状态", date, machine_dirs, cols, na_judge=True)

    # 证据诚信审计：识别虚报嫌疑客户端，落注记文件
    audits = audit_client_evidence(machine_dirs, date)
    fabricated = [a for a in audits if a[-1]]
    if fabricated:
        print("\n[证据审计] 发现疑似虚报客户端（PASS 回填但证据目录空壳率 >= 80%）：")
        for client, ip, os_name, pc, sd, td, _fab in fabricated:
            print(f"  ⚠ {client} ({ip}-{os_name}): PASS={pc} 空壳目录={sd}/{td} -> 虚报嫌疑")
        out = os.path.join(REPO, "results", "Summary", f"客户端证据审计-{date}.md")
        lines = [f"# 客户端证据诚信审计（{date}）", "",
                 "> 由 build_summary.py 自动生成：按 evidence 用例子目录判定虚报（.mjs 探针全空壳 且 无非空执行输出），",
                 "> 识别「有 PASS 回填但证据目录空壳率 >= 80%」的虚报嫌疑客户端。", "",
                 "## 虚报嫌疑客户端（结果不可信，不纳入通过率统计口径）", ""]
        for client, ip, os_name, pc, sd, td, _fab in fabricated:
            lines += [f"- **{client}**（{ip}-{os_name}）：PASS 回填 {pc} 条，但 {td} 个证据目录中 {sd} 个为空壳"
                      f"（.mjs 探针全注释且无 stdout 输出）——当日结果不可信，需该客户端重跑真探针。"]
        lines += ["", "## 全量审计明细", "",
                  "| 客户端 | IP | OS | PASS 回填 | 空壳目录 | 目录总数 | 判定 |",
                  "| --- | --- | --- | --- | --- | --- | --- |"]
        for client, ip, os_name, pc, sd, td, fab in audits:
            lines.append(f"| {client} | {ip} | {os_name} | {pc} | {sd} | {td} | {'⚠ 虚报嫌疑' if fab else 'OK'} |")
        with open(out, "w", encoding="utf-8") as f:
            f.write("\n".join(lines) + "\n")
        print(f"  已写审计注记: {os.path.basename(out)}")
    print("汇总完成。总报告(.md)请维护者按需生成。")


if __name__ == "__main__":
    main()