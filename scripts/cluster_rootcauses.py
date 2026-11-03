#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""同根因自动聚类：把「同一根因被 N 个客户端各记一遍」在汇总层合并成根因簇。

数据源：`results/Summary/每日测试汇总-<日期>.md` 的「缺陷根因明细（来自各 agent FINDINGS.md）」表
（列：客户端 | 级别 | 标题 | 根因）。

为什么需要：跨客户端复现的**同一根因**（如 D2-4 大小写脱敏）会被 5~6 个客户端各自记录一遍，
汇总层不聚类就只能靠人眼看；聚类后「一簇 = 一次结论 / 一张单」，并给出跨端复现度（客户端数）。

聚类键优先级：
  1) 命中根因主题词典（TOPICS）→ 用主题键
  2) 否则用根因里出现最多的源码文件名（file:<basename>）
  3) 再否则归 misc

用法：
  python scripts/cluster_rootcauses.py                          # 自动取最新一天的汇总
  python scripts/cluster_rootcauses.py --date 2026-11-02
  python scripts/cluster_rootcauses.py --min-clients 2 --json
  python scripts/cluster_rootcauses.py --fail-on-cross          # 存在跨客户端簇则退出码 1（可作门禁）
"""

import argparse
import glob
import io
import json
import os
import re
import sys
from collections import Counter

# 根因主题词典：(key, 中文名, 正则)  —— 顺序即优先级，具体在前
TOPICS = [
    ("secret-redaction", "凭证脱敏（大小写/短键/带引号 key）", r"脱敏|redact|secret.?key 正则|isSecretKeyName|ak=|sk=|access_key"),
    ("mcp-initialize", "MCP 握手 / 协议时序", r"initialize|握手|tools/list|dispatch|mcp-protocol|capabilities"),
    ("route-map", "服务目录路由（关键词/别名缺失）", r"routeMap|serviceCatalog|服务目录|云主机|路由"),
    ("vendor-gate", "厂商确认门（vendor gate）", r"vendor.?gate|vendorConfirmed|厂商确认"),
    ("fail-open", "写拦截 fail-open / 默认放行", r"fail.?open|默认\s*(allow|放行)|无(规则)?命中|无 finding|hasDeny"),
    ("artifact-iac", "制品预检（HCL / Terraform / 宽 IAM）", r"hook_check_artifacts|iam-admin-policy|HCL|Terraform|制品预检|AdministratorFullAccess"),
    ("doc-tool-drift", "文档工具数 / 能力漂移", r"AGENTS\.md[^\n]*工具|硬编码\s*\d+\s*tools|工具数未同步|文档未同步|tools 未同步|新增\s*\d+\s*工具后"),
    ("approval-write-prefix", "审批门写动词前缀缺失", r"writeOperationPrefixes|Change\*|审批门|confirm-not-deny|变更类"),
    ("rules-count-drift", "安全规则条目数漂移", r"规则(库)?条目|规则集\s*\d+|16\s*→\s*19|\d+\s*→\s*\d+\s*条"),
    ("env-dump-guard", "凭证 env 打印拦截", r"env.?dump|printenv|凭证 env|access_key.*env|HWC_"),
    ("kms-decrypt", "KMS 明文解密未拦截", r"DecryptData|DecryptDatakey|KMS"),
    ("py-hook-regex", "Python hook 写动词正则失配", r"WRITE_OPERATION_RE|huaweicloud-safety\.py|Python hook"),
    ("telemetry-sanitize", "遥测 sanitize 未脱敏", r"sanitizeValue|telemetry"),
    ("region-priority", "region 读取优先级漂移", r"HW_REGION|HUAWEICLOUD_REGION|region.*优先级"),
    ("adminpass-exposure", "adminPass 回显 / 脱敏", r"adminPass|admin.?pass"),
    ("obs-signature", "OBS 签名 / 静态站托管", r"SignedHeaders|x-amz-security-token|obsSignedRequest|OBS 静态"),
    ("rds-params", "RDS 实例参数装配", r"RDS.*(CreateInstance|参数)|db\.password|db_password"),
    ("fg-params", "FunctionGraph 参数 / URN", r"FunctionGraph|func_urn|func_name|func_code"),
    ("cmd-wrapping", "命令包裹 / 引号穿透", r"sh -c|命令包裹|ANSI-C|命令替换|\$\(|反引号"),
    ("update-check", "update-check / DEBUG 开关", r"update-check|DEBUG|HUAWEICLOUD_DEVKIT_DEBUG"),
]

FILE_RE = re.compile(r"[\w./@$-]+\.(?:mjs|ts|js|py|json|yaml|yml|md)\b")
CASE_RE = re.compile(r"\b(?:D\d+-[A-Za-z0-9-]+|EXP-[A-Za-z0-9-]+)\b")
LEVEL_RE = re.compile(r"\b(P0|P1|P2)\b")


def latest_summary(summary_dir):
    files = sorted(glob.glob(os.path.join(summary_dir, "每日测试汇总-*.md")),
                   key=os.path.getmtime)
    return files[-1] if files else None


def parse_rootcause_rows(text):
    """解析「缺陷根因明细」表 → [{client, level, title, root}]。

    注意：根因单元格里含 `|`（如正则 `(AK|SK)`），不能简单按 `|` 切 4 列 —— 多出的段要并回第 4 列。
    """
    lines = text.splitlines()
    start = None
    for i, l in enumerate(lines):
        if "缺陷根因明细" in l:
            start = i
            break
    if start is None:
        return []
    rows = []
    for l in lines[start + 1:]:
        s = l.strip()
        if s.startswith("## ") and rows:      # 下一节开始
            break
        if not s.startswith("|"):
            continue
        cells = [c.strip() for c in s.strip("|").split("|")]
        if len(cells) < 4:
            continue
        if set("".join(cells[:4])) <= set("-: "):   # 分隔行
            continue
        if cells[0] in ("客户端",):
            continue
        client, level, title = cells[0], cells[1], cells[2]
        root = "|".join(cells[3:])            # 多余的 `|` 段并回根因
        if not client or not root:
            continue
        rows.append({"client": client, "level": level, "title": title, "root": root})
    return rows


def topic_of(root):
    for key, label, pat in TOPICS:
        if re.search(pat, root, re.I):
            return key, label
    return None, None


def file_of(root):
    hits = [os.path.basename(h) for h in FILE_RE.findall(root)]
    ban = {"policy.json", "cloud-risk-rules.json", "AGENTS.md", "README.md"}
    hits = [h for h in hits if h not in ban]
    if not hits:
        return None
    return Counter(hits).most_common(1)[0][0]


def cluster_key(row):
    # 主题判定同时看「标题 + 根因」：客户端根因常写得简略（`…第三段缺 i 标志`），
    # 而语义主题往往在标题里（`D2-4 凭证脱敏漏小写 ak=/sk=`）——只看 root 会漏归簇。
    blob = "%s %s" % (row.get("title", ""), row["root"])
    key, label = topic_of(blob)
    if key:
        return key, label
    f = file_of(row["root"])
    if f:
        return "file:" + f, "文件：" + f
    return "misc", "其他（未归类）"


def build_clusters(rows):
    buckets = {}
    for r in rows:
        key, label = cluster_key(r)
        b = buckets.setdefault(key, {"key": key, "label": label, "members": []})
        b["members"].append(r)
    clusters = []
    for b in buckets.values():
        ms = b["members"]
        clients = sorted({m["client"] for m in ms})
        cases = sorted({c for m in ms for c in CASE_RE.findall(m["title"])})
        levels = Counter(LEVEL_RE.findall(" ".join(m["level"] for m in ms)))
        # 代表根因：最短且信息量足够的那条（多客户端复现时通常最短的最干净）
        rep = min((m["root"] for m in ms), key=lambda s: (len(s) < 20, len(s)))
        clusters.append({
            "key": b["key"], "label": b["label"],
            "count": len(ms), "client_count": len(clients), "clients": clients,
            "cases": cases, "levels": dict(levels),
            "representative": rep, "members": ms,
        })
    clusters.sort(key=lambda c: (-c["client_count"], -c["count"], c["key"]))
    return clusters


def load_rows(args):
    if args.summary:
        path = args.summary
    else:
        path = latest_summary(args.summary_dir)
        if not path:
            raise SystemExit("找不到汇总文件：%s/每日测试汇总-*.md" % args.summary_dir)
        if args.date:
            cand = os.path.join(args.summary_dir, "每日测试汇总-%s.md" % args.date)
            if not os.path.exists(cand):
                raise SystemExit("找不到指定日期汇总：%s" % cand)
            path = cand
    with io.open(path, "r", encoding="utf-8-sig") as f:
        rows = parse_rootcause_rows(f.read())
    return path, rows


def main() -> int:
    ap = argparse.ArgumentParser(description="同根因自动聚类（汇总层根因簇）")
    ap.add_argument("--summary", help="直接指定汇总 md 路径")
    ap.add_argument("--summary-dir", default="results/Summary", help="汇总目录（默认 results/Summary）")
    ap.add_argument("--date", help="指定日期 YYYY-MM-DD（默认取最新）")
    ap.add_argument("--min-clients", type=int, default=1, help="只显示客户端数 ≥ N 的簇（默认 1=全部）")
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--fail-on-cross", action="store_true", help="存在跨客户端簇时退出码 1（门禁用）")
    args = ap.parse_args()

    path, rows = load_rows(args)
    clusters = build_clusters(rows)
    shown = [c for c in clusters if c["client_count"] >= args.min_clients]
    cross = [c for c in clusters if c["client_count"] >= 2]

    if args.json:
        print(json.dumps({"source": path, "rows": len(rows), "clusters": len(clusters),
                          "cross_client_clusters": len(cross), "detail": shown},
                         ensure_ascii=False, indent=2))
    else:
        print("源：%s" % path)
        print("根因记录 %d 条 → 聚成 %d 簇（其中跨客户端簇 %d 个）\n" % (len(rows), len(clusters), len(cross)))
        for c in shown:
            tag = "★" if c["client_count"] >= 2 else " "
            print("%s [%s] %d 条 / %d 客户端 · %s" % (tag, c["key"], c["count"], c["client_count"], c["label"]))
            print("    客户端：%s" % "、".join(c["clients"]))
            if c["cases"]:
                print("    用例　：%s" % "、".join(c["cases"]))
            print("    代表根因：%s" % c["representative"][:150])
            print()

    if args.fail_on_cross and cross:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
