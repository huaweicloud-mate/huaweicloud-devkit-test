#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""使命自主展开门禁（Layer 3 产物校验）。

校验 Worker agent 按使命自主展开的用例集是否合规：
  * 产物存在且列名与契约一致（9 列）
  * case_id 前缀为 AUTO-<mission-id>-（与母版 ID 空间隔离）
  * 条数在 3–8 之间
  * 判据强度列 ∈ {L1,L2,L3,L4}，且 L1 条数 ≤ 总数 1/3
  * 无「自证式」判据（自己输出自己 / 硬编码 PASS 之类）
  * 「关联工具」全部落在使命 affectedTools 内
  * 标 PASS 的用例必须有真实存在的证据目录且含非空输出

用法：
  python scripts/verify_mission_expansion.py <执行包目录> --mission mission-001
  python scripts/verify_mission_expansion.py <执行包目录> --mission mission-001 --json
  python scripts/verify_mission_expansion.py <执行包目录> --mission mission-001 --missions-dir test-cases/missions

退出码：0 = 全部通过；1 = 有失败项。
"""

import argparse
import csv
import io
import json
import os
import re
import sys

COLUMNS = ["case_id", "步骤", "输入", "预期结果", "判据", "判据强度", "关联工具", "结果", "证据路径"]
MIN_CASES, MAX_CASES = 3, 8
STRENGTHS = ("L1", "L2", "L3", "L4")
LEVELS = ("PASS", "FAIL", "BLOCKED", "NOT_RUN")

# 自证式判据的信号词（判据写成"自己证明自己"= 等于没断言）
SELF_PROOF = re.compile(
    r"自证|硬编码\s*(PASS|通过)|探针返回\s*PASS|固定输出|自己的(输出|返回)|命令执行成功即|status\s*[:=]\s*PASS",
    re.I,
)


def parse_mission_yaml(path):
    """轻量解析使命 yaml（不引入 pyyaml 依赖）：取 affectedTools / affectedCases 列表。"""
    out = {"affectedTools": [], "affectedCases": [], "scope": ""}
    if not os.path.isfile(path):
        return out
    with io.open(path, "r", encoding="utf-8-sig") as f:
        lines = f.read().splitlines()
    cur = None
    for raw in lines:
        line = raw.rstrip()
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        stripped = line.strip()
        if stripped in ("affectedTools:", "affectedCases:"):
            cur = stripped[:-1]
            continue
        if stripped.startswith("scope:"):
            cur = "scope"
            continue
        if re.match(r"^[A-Za-z_]+:", stripped) or stripped in ("spec:", "metadata:"):
            cur = None
            continue
        if cur and stripped.startswith("- "):
            item = stripped[2:].strip().strip('"').strip("'")
            if cur == "scope":
                out["scope"] += item + " "
            else:
                out[cur].append(item)
    return out


def read_cases(pkg_dir, mission_id):
    path = os.path.join(pkg_dir, "autocases", "%s.csv" % mission_id)
    if not os.path.isfile(path):
        return path, None, ["产物不存在：%s" % path]
    errors = []
    with io.open(path, "r", encoding="utf-8-sig", newline="") as f:
        rows = list(csv.reader(f))
    if not rows:
        return path, [], ["产物为空文件"]
    header = [c.strip() for c in rows[0]]
    if header != COLUMNS:
        errors.append("列名不符：期望 %s，实际 %s" % (COLUMNS, header))
    cases = []
    for r in rows[1:]:
        if not any(c.strip() for c in r):
            continue
        padded = list(r) + [""] * (len(COLUMNS) - len(r))
        cases.append(dict(zip(COLUMNS, [c.strip() for c in padded[:len(COLUMNS)]])))
    return path, cases, errors


def verify(pkg_dir, mission_id, missions_dir):
    checks = []

    def add(name, ok, detail=""):
        checks.append({"check": name, "ok": bool(ok), "detail": detail})

    mission_path = os.path.join(missions_dir, "%s.yaml" % mission_id)
    mission = parse_mission_yaml(mission_path)
    add("mission_file", os.path.isfile(mission_path),
        mission_path if os.path.isfile(mission_path) else "使命文件不存在：%s" % mission_path)

    path, cases, errs = read_cases(pkg_dir, mission_id)
    if cases is None:
        add("artifact", False, errs[0] if errs else "产物不可用：%s" % path)
        return checks
    add("artifact", True, path)
    if errs:
        for e in errs:
            add("header", False, e)
        return checks
    add("header", True, "列名与契约一致（%d 列）" % len(COLUMNS))

    n = len(cases)
    add("case_count", MIN_CASES <= n <= MAX_CASES, "%d 条（要求 %d–%d）" % (n, MIN_CASES, MAX_CASES))

    bad_prefix = [c["case_id"] for c in cases if not c["case_id"].startswith("AUTO-%s-" % mission_id)]
    add("case_id_prefix", not bad_prefix, "不合规：%s" % "、".join(bad_prefix) if bad_prefix else "%d 条前缀正确" % n)

    missing_fields = [c["case_id"] for c in cases
                      if not (c["步骤"] and c["输入"] and c["预期结果"] and c["判据"])]
    add("required_fields", not missing_fields,
        "缺 步骤/输入/预期/判据：%s" % "、".join(missing_fields) if missing_fields else "完整")

    bad_strength = [c["case_id"] for c in cases if c["判据强度"] not in STRENGTHS]
    add("judgement_strength", not bad_strength,
        "非法强度：%s" % "、".join(bad_strength) if bad_strength else "全部 ∈ %s" % (STRENGTHS,))

    l1 = [c["case_id"] for c in cases if c["判据强度"] == "L1"]
    add("l1_ratio", len(l1) <= max(1, n // 3),
        "L1 %d/%d 条（上限 %d）" % (len(l1), n, max(1, n // 3)))

    selfproof = [c["case_id"] for c in cases if SELF_PROOF.search(c["判据"])]
    add("no_self_proof", not selfproof,
        "疑似自证式判据：%s" % "、".join(selfproof) if selfproof else "无自证式判据")

    allowed = set(mission.get("affectedTools") or [])
    out_of_scope = []
    if allowed:
        for c in cases:
            tools = [t.strip() for t in re.split(r"[、,;；|\s]+", c["关联工具"]) if t.strip()]
            out_of_scope += ["%s:%s" % (c["case_id"], t) for t in tools if t not in allowed]
    add("tools_in_mission", not out_of_scope,
        "越界：%s" % "、".join(out_of_scope) if out_of_scope
        else ("命中使命工具集" if allowed else "使命未声明 affectedTools，跳过"))

    bad_result = [c["case_id"] for c in cases if c["结果"] not in LEVELS]
    add("result_enum", not bad_result,
        "非法结果：%s" % "、".join(bad_result) if bad_result else "全部 ∈ %s" % (LEVELS,))

    no_evidence = []
    for c in cases:
        if c["结果"] != "PASS":
            continue
        ev = c["证据路径"]
        if not ev:
            no_evidence.append("%s(空)" % c["case_id"])
            continue
        ev_abs = ev if os.path.isabs(ev) else os.path.join(pkg_dir, ev)
        if not os.path.isdir(ev_abs):
            no_evidence.append("%s(目录不存在)" % c["case_id"])
            continue
        files = [f for f in os.listdir(ev_abs) if os.path.isfile(os.path.join(ev_abs, f))]
        if not any(os.path.getsize(os.path.join(ev_abs, f)) > 0 for f in files):
            no_evidence.append("%s(无有效输出)" % c["case_id"])
    add("pass_evidence", not no_evidence,
        "PASS 缺证据：%s" % "、".join(no_evidence) if no_evidence else "PASS 均有证据")

    return checks


def main() -> int:
    ap = argparse.ArgumentParser(description="使命自主展开门禁")
    ap.add_argument("pkg_dir", help="执行包目录（含 autocases/）")
    ap.add_argument("--mission", required=True, help="使命 id，如 mission-001")
    ap.add_argument("--missions-dir", default="test-cases/missions", help="使命 yaml 目录")
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()

    checks = verify(args.pkg_dir, args.mission, args.missions_dir)
    failed = [c for c in checks if not c["ok"]]

    if args.json:
        print(json.dumps({"pkg_dir": args.pkg_dir, "mission": args.mission,
                          "checks": checks, "failed": len(failed)}, ensure_ascii=False, indent=2))
    else:
        print("使命：%s ｜ 执行包：%s" % (args.mission, args.pkg_dir))
        for c in checks:
            print("  [%s] %-18s %s" % ("OK  " if c["ok"] else "FAIL", c["check"], c["detail"]))
        print("结论：%s（%d/%d 项通过）" % ("PASS" if not failed else "FAIL",
                                         len(checks) - len(failed), len(checks)))
    return 0 if not failed else 1


if __name__ == "__main__":
    sys.exit(main())
