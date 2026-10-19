# -*- coding: utf-8 -*-
"""UX（D11）体验专项数据生成器 —— 看板「UX 专项」页签的数据源。

做法：对每个被测源码树调用 `eval/harness/fixtures/run-ux.mjs --json`（内置宿主隔离 +
三态退出码），再调用 `eval/replay/ux-replay.mjs --json`（D11-39 体验回放 · 范式②，5 场景
文案语义分类），把结构化结果与被测包溯源合并，写出 `results/UX专项/UX专项-<日期>.json`。

用法:
    # 单/多列对照（label=路径 可重复）
    python scripts/gen_ux_special.py \
        --sut "1.1.8=C:/.../_sut/1.1.8/package/plugins/huaweicloud-core/src" \
        --sut "PR#905=C:/.../_wt_900/plugins/huaweicloud-core/src"

    # 不传 --sut 时按 run-ux.mjs 的解析顺序兜底：
    #   env HUAWEICLOUD_DEVKIT_HOME / HDK_PATH / sibling ../hdk

产物: results/UX专项/UX专项-<日期>.json（日期默认取本机当天，北京时间）

口径声明：本数据是**回归防退化门禁的趋势线**——`NOT_IMPLEMENTED` = 需求验收未达标
（已知缺口，非 harness 故障），`BLOCKED` = 宿主/环境不可判定。它证明不了"用户更快完成任务"，
不等价于体验验收（认知负荷/文案够不够新手用/视觉排版仍需人工 rubric）。
"""
import argparse
import datetime
import json
import os
import re
import subprocess
import sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RUNNER = os.path.join(REPO, "eval", "harness", "fixtures", "run-ux.mjs")
REPLAY_RUNNER = os.path.join(REPO, "eval", "replay", "ux-replay.mjs")
OUT_DIR = os.path.join(REPO, "results", "UX专项")

CAVEAT = (
    "红线基线口径：NOT_IMPLEMENTED = 需求验收未达标（已知缺口，非 harness 故障），"
    "BLOCKED = 宿主/环境不可判定（不计入 PASS/FAIL），"
    "NOT_RUN = 契约依赖待冻结（依赖字段未冻结，冻结前不可判 FAIL，不计入 PASS/FAIL/BLOCKED）。"
    "本数据是回归防退化门禁的趋势线，"
    "不等价于体验验收（认知负荷 / 文案是否够新手用 / 视觉排版仍需人工 rubric）。"
)


def _run(cmd, cwd=None):
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8",
                       errors="replace", shell=False, cwd=cwd)
    return r.returncode, (r.stdout or ""), (r.stderr or "")


def resolve_default_sut():
    """与 run-ux.mjs 一致：env HUAWEICLOUD_DEVKIT_HOME / HDK_PATH / sibling ../hdk。"""
    src_of = lambda root: os.path.join(root, "plugins", "huaweicloud-core", "src")  # noqa: E731
    for key in ("HUAWEICLOUD_DEVKIT_HOME", "HDK_PATH"):
        val = os.environ.get(key)
        if val and os.path.isfile(os.path.join(src_of(val), "tools.mjs")):
            return src_of(val)
    sib = os.path.join(os.path.dirname(REPO), "hdk")
    if os.path.isfile(os.path.join(src_of(sib), "tools.mjs")):
        return src_of(sib)
    return None


def detect_version(hdk_src):
    """从源码树反推被测包版本：<root>/package.json 或 <root>/plugins/huaweicloud-core/package.json。"""
    cands = [
        os.path.join(hdk_src, "..", "..", "..", "package.json"),
        os.path.join(hdk_src, "..", "..", "package.json"),
    ]
    for p in cands:
        if not os.path.isfile(p):
            continue
        try:
            with open(p, encoding="utf-8") as f:
                v = json.load(f).get("version")
            if v:
                return v
        except Exception:
            continue
    return ""


def run_one(label, hdk_src, evid, tmp_json):
    if not os.path.isfile(os.path.join(hdk_src, "tools.mjs")):
        raise SystemExit(f"[错误] 源码树无效（缺 tools.mjs）: {hdk_src}")
    cmd = ["node", str(RUNNER), hdk_src, "--json", tmp_json]
    if evid:
        cmd += ["--evid", evid]
    code, out, err = _run(cmd, cwd=REPO)
    if not os.path.isfile(tmp_json):
        sys.stderr.write(out + err)
        raise SystemExit(f"[错误] run-ux.mjs 未产出结构化结果（exit={code}）: {label}")
    with open(tmp_json, encoding="utf-8") as f:
        payload = json.load(f)
    used = os.path.abspath(payload.get("hdkSrc") or "")
    if used != os.path.abspath(hdk_src):
        raise SystemExit(f"[错误] 运行器实际使用的源码树与请求不符（防呆）：\n"
                         f"        请求 = {os.path.abspath(hdk_src)}\n        实际 = {used}")
    cases = []
    for fx in payload.get("fixtures", []):
        r = fx.get("result") or {}
        # NOT_RUN（契约依赖待冻结）时无 result sidecar → 用例号取运行器从设计矩阵回填的 fx["case"]
        cid = fx.get("case") or r.get("case") or ""
        cases.append({
            "file": fx.get("file"),
            "case": cid,
            "status": fx.get("status"),
            "frozen": bool(fx.get("frozen")),
            "exit": fx.get("exit"),
            "pass": r.get("pass"),
            "fail": r.get("fail"),
            "note": fx.get("note") or r.get("note") or "",
            "assertions": r.get("assertions") or [],
        })
    return {
        "label": label,
        "version": detect_version(hdk_src),
        "hdkSrc": hdk_src,
        "designGate": payload.get("designGate", {}) or {},
        "summary": payload.get("summary", {}),
        "cases": cases,
        "replay": run_replay(hdk_src, tmp_json + ".replay"),
    }


def run_replay(hdk_src, tmp_json):
    """D11-39 体验回放（独立专项 · 范式②）：跑 eval/replay/ux-replay.mjs，把 5 场景判定并入本数据源。

    退出码 0/1/2 都代表「拿到了结论」（1 = 存在体验退化，属已知缺口态；2 = 环境不可判定），
    因此**不作为生成失败**；只有拿不到结构化结果时才记 available=False（看板显示「未采集」）。
    """
    cmd = ["node", str(REPLAY_RUNNER), hdk_src, "--json", tmp_json]
    code, out, err = _run(cmd, cwd=REPO)
    if not os.path.isfile(tmp_json):
        tail = (err or out or "").strip().splitlines()
        return {"available": False, "exit": code, "error": (tail[-1] if tail else "无输出")[:200]}
    with open(tmp_json, encoding="utf-8") as f:
        payload = json.load(f)
    used = os.path.abspath(payload.get("hdkSrc") or "")
    if used and used != os.path.abspath(hdk_src):
        return {"available": False, "exit": code,
                "error": "运行器实际使用的源码树与请求不符（防呆）: 请求=" + os.path.abspath(hdk_src)
                         + " 实际=" + used}
    rec = payload.get("recording") or ""
    return {
        "available": True,
        "mode": payload.get("mode"),
        "sutVersion": payload.get("sutVersion") or "",
        "recording": os.path.relpath(rec, REPO).replace("\\", "/") if rec else "",
        "summary": payload.get("summary", {}) or {},
        "byVerdict": payload.get("byVerdict", {}) or {},
        "scenarios": payload.get("scenarios", []) or [],
        "exit": code,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--sut", action="append", default=[], metavar="LABEL=PATH",
                    help="被测源码树（plugins/huaweicloud-core/src），可重复以做多列对照")
    ap.add_argument("--date", default=None, help="日期（YYYY-MM-DD），默认本机当天")
    ap.add_argument("--evid", default=None, help="可选：逐夹具 stdout.txt 证据目录")
    ap.add_argument("--out", default=None, help="产物路径，默认 results/UX专项/UX专项-<日期>.json")
    args = ap.parse_args()

    suts = []
    for spec in args.sut:
        if "=" in spec:
            label, path = spec.split("=", 1)
        else:
            label, path = os.path.basename(os.path.dirname(os.path.dirname(os.path.dirname(spec)))), spec
        suts.append((label.strip(), os.path.abspath(path.strip())))
    if not suts:
        default = resolve_default_sut()
        if not default:
            raise SystemExit("[错误] 未指定 --sut，且无法定位 hdk 源码树（env HUAWEICLOUD_DEVKIT_HOME / HDK_PATH / sibling ../hdk）")
        suts = [("默认被测包", os.path.abspath(default))]

    date = args.date or datetime.datetime.now().strftime("%Y-%m-%d")
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    tmp_json = os.path.join(REPO, ".ux-special-tmp.json")
    results = []
    for label, path in suts:
        print(f"[UX] 运行夹具: {label}  <- {path}")
        results.append(run_one(label, path, args.evid, tmp_json))
    for p in (tmp_json, tmp_json + ".replay"):
        if os.path.isfile(p):
            os.remove(p)

    doc = {
        "date": date,
        "generatedAt": now,
        "timezone": "Asia/Shanghai",
        "scope": "UX（D11）体验专项 —— 可执行门禁夹具四态结果（PASS / NOT_IMPLEMENTED / BLOCKED / NOT_RUN）"
                 " + D11-39 体验回放差异分类（范式② · 独立专项，本轮已并入采集）",
        "caveat": CAVEAT,
        "suts": results,
    }
    out = args.out or os.path.join(OUT_DIR, f"UX专项-{date}.json")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, "w", encoding="utf-8", newline="\n") as f:
        json.dump(doc, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"[UX] 已写出 {out}")
    for s in results:
        sm = s["summary"]
        print(f"     - {s['label']} v{s['version'] or '?'}: "
              f"pass={sm.get('pass')} not_implemented={sm.get('not_implemented')} "
              f"blocked={sm.get('blocked')} not_run={sm.get('not_run', 0)} "
              f"/ {sm.get('total')} → exit {sm.get('exit')}")
        rp = s.get("replay") or {}
        if rp.get("available"):
            rs = rp.get("summary", {}) or {}
            print(f"       D11-39 回放 v{rp.get('sutVersion') or '?'}: "
                  f"pass={rs.get('pass')} ux_regression={rs.get('ux_regression')} "
                  f"blocked={rs.get('blocked')} harness_error={rs.get('harness_error')} "
                  f"/ {rs.get('total')} → exit {rs.get('exit')}")
        else:
            print(f"       D11-39 回放：未采集（{rp.get('error') or '—'}）")
    print(f"[UX] 提醒：{CAVEAT}")


if __name__ == "__main__":
    main()
