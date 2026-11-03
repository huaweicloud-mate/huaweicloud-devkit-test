# -*- coding: utf-8 -*-
"""cluster_rootcauses 同根因聚类单测（不依赖网络/真实汇总）。

关键点：根因单元格里含 `|`（正则 `(AK|SK)`），列切分必须把多余段并回第 4 列。
"""

import importlib.util
import os
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
spec = importlib.util.spec_from_file_location(
    "cluster_rootcauses", os.path.join(ROOT, "scripts", "cluster_rootcauses.py")
)
cc = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cc)

SAMPLE = """
## 缺陷根因明细（来自各 agent FINDINGS.md）

| 客户端 | 级别 | 标题 | 根因 |
| --- | --- | --- | --- |
| AtomCode | P0 | D2-4 凭证脱敏正确性 | `safety-policy.mjs:42` 正则 `(AK|SK)\\s*[:=]` 缺 `/i`，小写 ak= 漏脱敏 |
| DSH | P0 | D2-4 凭证脱敏漏小写 ak=/sk= | `safety-policy.mjs:45` 第三段缺 `i` 标志 |
| OpenCode | P1 | EXP-E01 云主机意图路由 MISS | `tools.mjs:2195` routeMap 缺 云主机→ECS |
| Hermes | P1 | D10-3 路由准确率 | `tools.mjs` serviceCatalog routeMap 缺同义词 |
| Hermes | P2 | D8-1 文档与能力漂移 | `AGENTS.md:27` 硬编码 43 tools，新增工具后文档未同步 |

## 下一节
| a | b | c | d |
"""


class TestParse(unittest.TestCase):
    def setUp(self):
        self.rows = cc.parse_rootcause_rows(SAMPLE)

    def test_row_count_and_stop(self):
        self.assertEqual(len(self.rows), 5)  # 下一节的行不计入

    def test_pipe_inside_rootcell_kept(self):
        # 第 1 行的根因含 (AK|SK)，必须完整保留
        self.assertIn("(AK|SK)", self.rows[0]["root"])
        self.assertIn("safety-policy.mjs:42", self.rows[0]["root"])

    def test_header_and_separator_skipped(self):
        self.assertNotIn("客户端", [r["client"] for r in self.rows])


class TestTopicAndKey(unittest.TestCase):
    def test_topic_hit(self):
        key, label = cc.topic_of("`safety-policy.mjs:45` 正则缺 i，ak= 漏脱敏")
        self.assertEqual(key, "secret-redaction")

    def test_topic_route(self):
        self.assertEqual(cc.topic_of("routeMap 缺 云主机→ECS")[0], "route-map")

    def test_topic_fallback_to_file(self):
        key, label = cc.cluster_key({"root": "proxy-agent.mjs 某处逻辑错误"})
        self.assertEqual(key, "file:proxy-agent.mjs")

    def test_topic_fallback_misc(self):
        self.assertEqual(cc.cluster_key({"root": "完全无法归类的描述"})[0], "misc")


class TestClusters(unittest.TestCase):
    def test_cross_client_merge(self):
        rows = cc.parse_rootcause_rows(SAMPLE)
        clusters = cc.build_clusters(rows)
        redaction = [c for c in clusters if c["key"] == "secret-redaction"][0]
        self.assertEqual(redaction["client_count"], 2)   # AtomCode + DSH
        self.assertIn("D2-4", redaction["cases"])
        route = [c for c in clusters if c["key"] == "route-map"][0]
        self.assertEqual(route["client_count"], 2)       # OpenCode + Hermes

    def test_sorted_by_client_count(self):
        clusters = cc.build_clusters(cc.parse_rootcause_rows(SAMPLE))
        counts = [c["client_count"] for c in clusters]
        self.assertEqual(counts, sorted(counts, reverse=True))

    def test_doc_drift_topic(self):
        rows = cc.parse_rootcause_rows(SAMPLE)
        self.assertTrue(any(c["key"] == "doc-tool-drift" for c in cc.build_clusters(rows)))


if __name__ == "__main__":
    unittest.main()
