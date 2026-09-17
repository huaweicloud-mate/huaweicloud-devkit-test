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


def main():
    date = sys.argv[1] if len(sys.argv) > 1 else datetime.datetime.now().strftime("%Y-%m-%d")
    machine_dirs = find_machine_dirs(date)
    cols = [f"{c}-{ip}-{o}" for c, ip, o in machine_dirs]
    print(f"发现的机器目录: {machine_dirs}")
    build("设计级", ("test-cases", "daily", "用例矩阵-设计级.csv"), "ID", ["维度", "标题"], "执行状态", date, machine_dirs, cols)
    build("展开级", ("test-cases", "daily", "用例矩阵-展开级.csv"), "ID", ["展开类型", "枚举对象", "源用例"], "执行状态", date, machine_dirs, cols, na_judge=True)
    print("汇总完成。总报告(.md)请维护者按需生成。")


if __name__ == "__main__":
    main()