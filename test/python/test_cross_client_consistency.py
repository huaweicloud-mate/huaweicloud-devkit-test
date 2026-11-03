# -*- coding: utf-8 -*-
"""cross_client_consistency 单测（纯函数，用构造矩阵）。"""

import importlib.util
import os
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
spec = importlib.util.spec_from_file_location(
    "cross_client_consistency", os.path.join(ROOT, "scripts", "cross_client_consistency.py")
)
cc = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cc)

HEADER = ["层级", "ID", "维度", "标题", "优先级",
          "A-1.1.1.1-Linux", "B-2.2.2.2-Linux", "C-3.3.3.3-Linux",
          "当日总执行状态", "当日总执行时间"]


def row(cid, title, *states):
    return ["设计级", cid, "D4安全", title, "P0", *states, "x", "t"]


class TestColumns(unittest.TestCase):
    def test_station_columns_excludes_summary_cols(self):
        start, stations = cc.station_columns(HEADER)
        self.assertEqual(start, 5)
        self.assertEqual(stations, ["A-1.1.1.1-Linux", "B-2.2.2.2-Linux", "C-3.3.3.3-Linux"])

    def test_client_of(self):
        self.assertEqual(cc.client_of("Hermes-1.92.93.23-Linux"), "Hermes")
        self.assertEqual(cc.client_of("CodeArtsAgent-119.8.181.45-Windows"), "CodeArtsAgent")


class TestAnalyze(unittest.TestCase):
    def setUp(self):
        rows = [
            row("D4-1", "多数 PASS 孤例 FAIL", "PASS", "PASS", "FAIL"),        # → outlier_fail
            row("D4-2", "多数 FAIL 孤例 PASS", "FAIL", "FAIL", "PASS"),        # → outlier_pass
            row("D4-3", "全体一致", "PASS", "PASS", "PASS"),                    # → 无
            row("D4-4", "票数不足", "PASS", "FAIL", "NOT_RUN"),                 # → 跳过（judged=2 < 3）
        ]
        self.res = cc.analyze(HEADER, rows, min_peers=2)

    def test_outlier_pass_detected(self):
        ids = [r["id"] for r in self.res["outlier_pass"]]
        self.assertEqual(ids, ["D4-2"])

    def test_outlier_fail_detected(self):
        ids = [r["id"] for r in self.res["outlier_fail"]]
        self.assertEqual(ids, ["D4-1"])

    def test_insufficient_votes_skipped(self):
        all_ids = {r["id"] for r in self.res["outlier_pass"] + self.res["outlier_fail"]}
        self.assertNotIn("D4-4", all_ids)
        self.assertNotIn("D4-3", all_ids)

    def test_profile_outlier_counts(self):
        prof = {p["station"]: p for p in self.res["profile"]}
        self.assertEqual(prof["C-3.3.3.3-Linux"]["outlier"], 2)   # D4-1 FAIL + D4-2 PASS
        self.assertEqual(prof["A-1.1.1.1-Linux"]["outlier"], 0)

    def test_report_contains_sections(self):
        md = cc.build_report(self.res, "2026-11-03")
        self.assertIn("孤例 PASS", md)
        self.assertIn("机位一致性画像", md)


if __name__ == "__main__":
    unittest.main()
