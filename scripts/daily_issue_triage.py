# -*- coding: utf-8 -*-
"""每日测试结果 → issue 分诊：测试侧完善（测试仓）+ 产品侧需求（产品仓）。

确定性脚本（不依赖 LLM），由 GitHub Actions daily-issue-triage 每天 20:45（北京）定时跑，
或维护者本机手动跑。

用法:
    python scripts/daily_issue_triage.py [--date 2026-09-21] [--dry-run | --live] [--repo both|test|product]

    --dry-run  默认：只生成 results/Summary/待提单-<日期>.md 预览，不真正开 issue。
    --live     真正向两仓开 issue（用 gh，中文一律 --body-file UTF-8）。
    --repo     只处理某一路（默认 both = 测试仓 + 产品仓）。

三路产物:
  A. 覆盖缺口（分析测试用例是否完善）        → 测试仓 issue（huaweicloud-mate/huaweicloud-devkit-test）
  B. 测试基建缺口（BLOCKED 里缺夹具/harness）→ 测试仓 issue（同上）
  C. 无单号跟踪的 FAIL/SPEC（真实待提单缺陷/需求）→ 产品仓合并单（huaweicloud/huaweicloud-devkit，复用 file_issue 查重）

策略: 每仓每天至多 1 张合并单（尊重「勿拆单」红线）；提单前查重，命中已跟踪单不重复开。
"""
import argparse
import csv
import datetime
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)  # 保证能 import 同目录的 verify_test_completeness / file_issue

import verify_test_completeness as vtc   # noqa: E402
import file_issue as fi                  # noqa: E402

REPO_ROOT = os.path.dirname(HERE)
REPO_TEST = "huaweicloud-mate/huaweicloud-devkit-test"
REPO_PRODUCT = "huaweicloud/huaweicloud-devkit"
SUMMARY_DIR = os.path.join(REPO_ROOT, "results", "Summary")

TEST_LABEL = "test-improvement"


# --------------------------------------------------------------------------- #
# 通用：markdown 表格解析
# --------------------------------------------------------------------------- #
def _table_rows(md, anchor, skip_header_first_col="ID"):
    idx = md.find(anchor)
    if idx < 0:
        return []
    rows = []
    for ln in md[idx:].splitlines()[1:]:
        s = ln.strip()
        if not s.startswith("|"):
            if rows:
                break
            continue
        cells = [c.strip() for c in s[1:-1].split("|")]
        if not cells:
            continue
        if set("".join(cells)) <= {"-", ":", " "}:
            continue  # 分隔行
        if cells[0] == skip_header_first_col:
            continue  # 表头
        rows.append(cells)
    return rows


def read_file(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


# --------------------------------------------------------------------------- #
# A. 覆盖缺口（分析测试用例是否完善）
# --------------------------------------------------------------------------- #
def coverage_gaps():
    """复刻 verify_test_completeness 的「找缺口」逻辑，但返回缺口清单而非 exit。"""
    gaps = []
    src_dir, _tag = vtc.resolve_hdk_src()
    rows = vtc.load_design_cases()
    texts = vtc.all_case_text(rows)

    if src_dir:
        tools = vtc.extract_tools(src_dir)
        tool_short = [t.replace("huaweicloud_", "", 1) for t in tools]
        covered = vtc.covered_short_names(rows)
        missing_tools = [t for t in tool_short if t not in covered]
        if missing_tools:
            gaps.append("工具覆盖缺口（源码工具未在任何用例「关联工具」列出现）: " + ", ".join(missing_tools))

        all_text = " ".join(texts.values())
        missing_cmds = [c for c in vtc.REQUIRED_CLI_SUBCMDS if c not in all_text]
        if missing_cmds:
            gaps.append("CLI 子命令覆盖缺口: " + ", ".join(missing_cmds))

        env_vars = vtc.extract_env_vars(src_dir)
        missing_envs = []
        for ev in env_vars:
            short = ev.replace("HUAWEICLOUD_", "").replace("DEVKIT_", "").lower()
            if not any(ev.lower() in t or short in t for t in texts.values()):
                missing_envs.append(ev)
        if missing_envs:
            gaps.append("环境变量覆盖缺口: " + ", ".join(missing_envs))

        # 导出函数文本覆盖 < 60% 时，列出未覆盖函数（被测源码新增/重命名后用例常滞后）
        exports = vtc.extract_exported_functions(src_dir)
        all_fns = [fn for fns in exports.values() for fn in fns]
        uncovered = [fn for fn in all_fns
                     if not any(fn.lower() in t for t in texts.values())]
        pct = 100 * (len(all_fns) - len(uncovered)) / len(all_fns) if all_fns else 0
        if pct < 60:
            gaps.append(f"导出函数文本覆盖率 {pct:.1f}% < 60% 阈值（{len(uncovered)}/{len(all_fns)} 未覆盖）: "
                        + ", ".join(uncovered[:40]) + ("…" if len(uncovered) > 40 else ""))
    else:
        gaps.append("⚠️ 无法定位被测源码，跳过覆盖扫描（不影响基建缺口）")

    empty_expand = [r["ID"] for r in rows if not (r.get("展开规则") or "").strip()]
    if empty_expand:
        gaps.append("展开规则空值用例: " + ", ".join(empty_expand[:20]))

    dim_p0 = {}
    for r in rows:
        if (r.get("优先级") or "").strip() == "P0":
            dim_p0[r["维度"]] = dim_p0.get(r["维度"], 0) + 1
    for dim in vtc.P0_REQUIRED_DIMS:
        if dim_p0.get(dim, 0) == 0:
            gaps.append(f"{dim} 缺少 P0 用例（安全/协议维度必须有 P0）")

    return gaps


# --------------------------------------------------------------------------- #
# B. 测试基建缺口（BLOCKED 里缺夹具/harness 的项）
# --------------------------------------------------------------------------- #
def test_infra_gaps(special_md):
    """从专项分析「BLOCKED 阻塞清单」里挑出「测试侧可自建夹具/harness」的项。
    判定：缺（阻塞点）包含 夹具/ harness / leak 环境 / 客户端宿主 等测试侧可控词，
    且非纯外部资源（真云资源 / 网络 / 软件源 / 凭据权限）。"""
    EXTERNAL = ["真云", "软件源", "网络", "凭据", "权限", "账号", "保证金", "破坏性", "不可逆"]
    rows = _table_rows(special_md, "### 阻塞清单明细")
    infra = []
    for cells in rows:
        if len(cells) < 6:
            continue
        cid, title, prio, level, clients, reason = cells[0], cells[1], cells[2], cells[3], cells[4], cells[5]
        if any(k in reason for k in EXTERNAL):
            continue
        infra.append({"id": cid, "title": title, "prio": prio, "level": level,
                      "clients": clients, "reason": reason})
    return infra


# --------------------------------------------------------------------------- #
# C. 无单号跟踪的 FAIL/SPEC（真实待提单缺陷/需求）
# --------------------------------------------------------------------------- #
def untracked_failures(special_md):
    rows = _table_rows(special_md, "### 无单号跟踪清单")
    return [{"id": c[0], "title": c[1], "prio": c[2], "level": c[3], "status": c[4]} for c in rows if len(c) >= 5]


def root_cause_map(summary_md):
    """从每日汇总「缺陷根因明细」表提取 用例号/关键字 → 根因（取第一条）。"""
    mapping = {}
    for cells in _table_rows(summary_md, "## 缺陷根因明细", skip_header_first_col="客户端"):
        if len(cells) < 4:
            continue
        title, root = cells[2], cells[3]
        # 用例号形态多样：EXP-C4-14 / D3-C4 / D3-S3 / D1-70 / D10-3 / D4-22 …
        ids = re.findall(r"\b(?:EXP-)?[A-Z]\d+-[A-Za-z0-9]+(?:-[A-Za-z0-9]+)?\b", title)
        for cid in ids:
            mapping.setdefault(cid.upper(), root)
    return mapping


def load_parent_children():
    """读展开级母版，建立 设计级父用例(源用例) -> 展开级子用例ID 映射。

    用于「父级聚合回退」：设计级用例（如 D3-C4 服务创建类回归）的 FAIL 由展开级子用例
    （如 EXP-C4-14 DMS / EXP-C4-18 DEW）解释时，查重应回退到子用例——子用例命中历史单
    （如 #732「KooCLI 缺少 DMS/DEW 服务映射」）即父用例亦判历史，避免父用例被误当新缺陷提单。
    """
    mapping = {}
    fp = os.path.join(REPO_ROOT, "test-cases", "expanded", "用例矩阵-展开级.csv")
    if not os.path.isfile(fp):
        return mapping
    with open(fp, encoding="utf-8-sig") as f:
        for r in csv.DictReader(f):
            src = (r.get("源用例") or "").strip().upper()
            cid = (r.get("ID") or "").strip().upper()
            if src and cid and src != cid:
                mapping.setdefault(src, []).append(cid)
    return mapping


# --------------------------------------------------------------------------- #
# 提单 / 查重
# --------------------------------------------------------------------------- #
def fetch_open_issues(repo, limit=300):
    r = subprocess.run(
        ["gh", "issue", "list", "-R", repo, "--state", "open", "--limit", str(limit),
         "--json", "number,title,body,state,url"],
        capture_output=True, text=True, encoding="utf-8", timeout=120,
    )
    if r.returncode != 0:
        print(f"  ⚠️ 拉取 {repo} issue 失败 rc={r.returncode}: {r.stderr.strip()[:200]}")
        return []
    import json
    try:
        return [d for d in json.loads(r.stdout) if "body" in d]
    except json.JSONDecodeError:
        return []


def _kw_hit(text_lower, kw):
    kl = (kw or "").lower()
    if not kl:
        return False
    if re.search(r"[a-z0-9]", kl):
        return bool(re.search(r"(?<![a-z0-9])" + re.escape(kl) + r"(?![a-z0-9])", text_lower))
    return kl in text_lower


def already_tracked(repo, title, keywords):
    """标题关键词命中既有 open issue → 视为已跟踪，跳过。"""
    issues = fetch_open_issues(repo)
    for iss in issues:
        t = (iss.get("title") or "").lower()
        if any(_kw_hit(t, k) for k in keywords):
            return iss
    return None


def gh_create(repo, title, body_file, label=None):
    args = ["gh", "issue", "create", "-R", repo,
            "--title", title, "--body-file", body_file]
    if label:
        args += ["--label", label]
    r = subprocess.run(args, capture_output=True, text=True, encoding="utf-8", timeout=90)
    return r.returncode == 0, (r.stdout.strip() if r.returncode == 0 else r.stderr.strip()[:300])


# --------------------------------------------------------------------------- #
# 主流程
# --------------------------------------------------------------------------- #
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--date", default=datetime.datetime.now().strftime("%Y-%m-%d"))
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--live", action="store_true")
    ap.add_argument("--repo", default="both", choices=["both", "test", "product"])
    args = ap.parse_args()

    d = args.date
    live = args.live and not args.dry_run
    do_test = args.repo in ("both", "test")
    do_product = args.repo in ("both", "product")

    special_md = read_file(os.path.join(SUMMARY_DIR, f"专项分析-{d}.md"))
    summary_md = read_file(os.path.join(SUMMARY_DIR, f"每日测试汇总-{d}.md"))
    version = ""
    m = re.search(r"被测版本[：:]\s*\*{0,2}([^*\s|]+)", special_md) or re.search(r"被测版本[：:]\s*\*{0,2}([^*\s|]+)", summary_md)
    if m:
        version = m.group(1)

    lines = []  # 报告
    lines.append(f"# 每日 issue 分诊待提单（预览）")
    lines.append("")
    lines.append(f"- 日期：{d} ｜ 被测版本：{version or '未指定'} ｜ 模式：{'LIVE 实际提单' if live else 'DRY-RUN 预览'}")
    lines.append("")
    created_any = False

    # ---------- A + B：测试侧完善 ----------
    if do_test:
        lines.append("## 一、测试侧完善（测试仓 huaweicloud-mate/huaweicloud-devkit-test）")
        lines.append("")
        cov = coverage_gaps()
        infra = test_infra_gaps(special_md)
        items = [("覆盖缺口", g) for g in cov] + \
                [(f"[{x['id']}] 缺夹具/harness", f"{x['title']}（{x['prio']}·{x['level']}，阻塞 {x['clients']}）缺：{x['reason']}")
                 for x in infra]
        if not items:
            lines.append("- 本轮无测试侧改进项（覆盖门禁全绿、BLOCKED 无测试侧可自建缺口）。")
        else:
            body_lines = ["## 覆盖缺口 / 测试基建缺口（每日自动扫描）", ""]
            for kind, txt in items:
                lines.append(f"- [{kind}] {txt}")
                body_lines.append(f"- **{kind}**：{txt}")
            body_lines += ["", f"> 来源：{d} 每日测试 + verify_test_completeness 覆盖门禁。"
                                "测试侧持续完善，维护者据此补用例/建夹具。"]

            # 查重：标题关键词（用本次缺口的用例号/工具名，避免与既有单重复）
            keywords = set()
            for kind, txt in items:
                keywords.update(re.findall(r"[A-Za-z]*[Dd]\d+-[A-Za-z0-9-]+", txt))
                keywords.update(re.findall(r"huaweicloud_[a-z_]+|[a-z]+_gap", txt.lower()))
            dup = already_tracked(REPO_TEST, "", keywords) if keywords else None
            if dup:
                lines.append(f"- 已跟踪（跳过）：#{dup['number']} {dup['title']}")
            else:
                title = f"[测试完善] {d} 测试侧改进项（{len(items)} 项）"
                body = "\n".join(body_lines) + "\n"
                lines.append(f"- 待提单 → 标题「{title}」")
                lines.append("")
                lines.append("```")
                lines.append(body)
                lines.append("```")
                if live:
                    with open(os.path.join(SUMMARY_DIR, f"_t_body.md"), "w", encoding="utf-8") as f:
                        f.write(body)
                    ok, out = gh_create(REPO_TEST, title,
                                        os.path.join(SUMMARY_DIR, "_t_body.md"), label=TEST_LABEL)
                    lines.append(f"- ✅ {'已开单: ' + out if ok else '开单失败: ' + out}")
                    created_any = ok
        lines.append("")

    # ---------- C：产品侧需求 ----------
    if do_product:
        lines.append("## 二、产品侧需求（产品仓 huaweicloud/huaweicloud-devkit）")
        lines.append("")
        fails = untracked_failures(special_md)
        rc_map = root_cause_map(summary_md)
        if not fails:
            lines.append("- 本轮「无单号跟踪」清单为空，无需提单。")
        else:
            upstream = fetch_open_issues(REPO_PRODUCT)
            parent_children = load_parent_children()
            new_items, hist = [], []
            for f in fails:
                root = rc_map.get(f["id"].upper(), "(未在根因明细中找到，见专项分析)")
                item = {"num": f["id"], "sev": f["prio"], "title": f"{f['id']} {f['title']}",
                        "现象": f["title"], "断言": "", "根因": root, "影响": "", "证据": ""}
                strong, weak = fi.match_history(item, upstream) if upstream else ([], [])
                # 父级聚合回退：设计级父用例未命中时，用其展开级子用例 ID 再查重
                # （D3-C4 的 EXP-C4-14/18 命中 #732 时，D3-C4 亦判历史，不误提单）
                if not strong and (f.get("level") or "") == "设计级":
                    children = parent_children.get(f["id"].upper(), [])
                    if children:
                        probe = {"num": f["id"], "sev": f["prio"],
                                 "title": f"{f['id']} {f['title']}（展开子用例：{'、'.join(children)}）",
                                 "现象": f["title"], "断言": "", "根因": root, "影响": "", "证据": ""}
                        strong, weak = fi.match_history(probe, upstream) if upstream else ([], [])
                (hist if strong else new_items).append((item, strong))
            for item, strong in hist:
                nums = ", ".join(f"#{h['number']}" for h in strong)
                lines.append(f"- 历史已跟踪（跳过）：{item['title']} → {nums}")
            if not new_items:
                lines.append("- 无新问题（全部命中历史单），不新开单。")
            else:
                body = fi.build_body(version, [it for it, _ in new_items],
                                     report_url=f"https://github.com/{REPO_TEST}/blob/main/results/Summary/每日测试汇总-{d}.md")
                title = f"[测试报告] huaweicloud-devkit {version} 每日测试缺陷合并单（{len(new_items)} 项）"
                lines.append(f"- 待提单（新问题 {len(new_items)} 项）→ 标题「{title}」")
                lines.append("")
                lines.append("```")
                lines.append(body)
                lines.append("```")
                if live:
                    with open(os.path.join(SUMMARY_DIR, f"_p_body.md"), "w", encoding="utf-8") as f:
                        f.write(body)
                    ok, out = gh_create(REPO_PRODUCT, title,
                                        os.path.join(SUMMARY_DIR, "_p_body.md"))
                    lines.append(f"- ✅ {'已开单: ' + out if ok else '开单失败: ' + out}")
                    created_any = created_any or ok
        lines.append("")

    # 落盘预览
    out_path = os.path.join(SUMMARY_DIR, f"待提单-{d}.md")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    print("\n".join(lines))
    print(f"\n[OK] 待提单预览已写: {out_path}  (mode={'LIVE' if live else 'DRY-RUN'})")


if __name__ == "__main__":
    main()