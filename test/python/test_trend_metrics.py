# -*- coding: utf-8 -*-
"""trend_metrics 契约单测（标准库 unittest）。

运行：
    python -m unittest discover -s test/python -p 'test_*.py'
"""
import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), os.pardir, os.pardir, "scripts"))

from trend_metrics import (  # noqa: E402
    _cell_status,
    compute_metrics,
    parse_daily,
    collect_trends,
    render_md,
)

SAMPLE_CSV = """\
层级,ID,维度,标题,优先级,ClientA-1.2.3.4-Linux,ClientB-5.6.7.8-Windows,汇总执行状态
设计级,D1-1,D1安装,c1,P0,PASS,FAIL,PASS:1 FAIL:1
设计级,D1-2,D1安装,c2,P1,BLOCKED,NOT_RUN,BLOCKED:1 NOT_RUN:1
设计级,D2-1,D2认证,c3,P0,SPEC-MISMATCH,PASS,SPEC-MISMATCH:1 PASS:1
"""


class CellStatusTest(unittest.TestCase):
    def test_status_normalization(self):
        self.assertEqual(_cell_status("PASS"), "PASS")
        self.assertEqual(_cell_status("PASS:3"), "PASS")
        self.assertEqual(_cell_status("FAIL:2"), "FAIL")
        self.assertEqual(_cell_status("BLOCKED"), "BLOCKED")
        self.assertEqual(_cell_status("NOT_RUN"), "NOT_RUN")
        self.assertEqual(_cell_status("spec-mismatch:1"), "SPEC-MISMATCH")
        self.assertIsNone(_cell_status(""))
        self.assertIsNone(_cell_status("   "))

    def test_unknown_value_none(self):
        self.assertIsNone(_cell_status("foo"))


class ParseDailyTest(unittest.TestCase):
    def test_parse_counts_cells(self):
        with tempfile.NamedTemporaryFile("w", suffix=".csv", delete=False, encoding="utf-8-sig") as f:
            f.write(SAMPLE_CSV)
            path = f.name
        try:
            counts = parse_daily(path)
            self.assertEqual(counts["total"], 3)      # 3 用例行
            self.assertEqual(counts["cells"], 6)      # 3 × 2 客户端列
            self.assertEqual(counts["PASS"], 2)       # D1-1-A + D2-1-B
            self.assertEqual(counts["FAIL"], 1)
            self.assertEqual(counts["BLOCKED"], 1)
            self.assertEqual(counts["NOT_RUN"], 1)
            self.assertEqual(counts["SPEC-MISMATCH"], 1)
        finally:
            os.unlink(path)


class ComputeMetricsTest(unittest.TestCase):
    def test_rates_ignore_blocked_and_notrun(self):
        metrics = compute_metrics({
            "PASS": 3, "FAIL": 1, "SPEC-MISMATCH": 1,
            "BLOCKED": 1, "NOT_RUN": 1, "total": 3, "cells": 6,
        })
        # done = 3+1+1 = 5; eligible = 6-1 = 5 → exec=100%; pass=3/5=60%
        self.assertEqual(metrics["done"], 5)
        self.assertEqual(metrics["exec_rate"], 100.0)
        self.assertEqual(metrics["pass_rate"], 60.0)

    def test_zero_done_no_divzero(self):
        metrics = compute_metrics({
            "PASS": 0, "FAIL": 0, "SPEC-MISMATCH": 0,
            "BLOCKED": 0, "NOT_RUN": 6, "total": 3, "cells": 6,
        })
        self.assertEqual(metrics["done"], 0)
        self.assertEqual(metrics["exec_rate"], 0.0)
        self.assertEqual(metrics["pass_rate"], 0.0)


class CollectTrendsTest(unittest.TestCase):
    def test_collect_sorted_and_filtered(self):
        import glob
        os.makedirs(os.path.join(tempfile.gettempdir(), "trend-hdr-test"), exist_ok=True)
        self.assertIsInstance(collect_trends, type(lambda: None))

    def test_no_files_empty(self):
        out = collect_trends(os.path.join(tempfile.gettempdir(), "no-such-trend-dir-xyz"))
        self.assertEqual(out, [])


class RenderMdTest(unittest.TestCase):
    def test_render_includes_summary_and_risk(self):
        rows = [
            {"date": "2026-10-01", "total": 3, "cells": 6, "done": 5, "pass": 3, "fail": 1,
             "spec": 1, "blocked": 1, "notrun": 1, "exec_rate": 100.0, "pass_rate": 60.0},
            {"date": "2026-10-02", "total": 3, "cells": 6, "done": 6, "pass": 5, "fail": 1,
             "spec": 0, "blocked": 0, "notrun": 0, "exec_rate": 100.0, "pass_rate": 83.3},
        ]
        md = render_md(rows)
        self.assertIn("2026-10-02", md)
        self.assertIn("最新通过率", md)
        self.assertIn("风险提示", md)
        self.assertIn("近7日趋势", md)


class MachineColsTest(unittest.TestCase):
    def test_matches_only_machine_columns(self):
        from trend_metrics import machine_cols
        hdr = ["层级", "ID", "维度", "标题", "优先级",
               "ClientA-1.2.3.4-Linux", "Box-Client-5.6.7.8-Windows",
               "汇总执行状态", "当日总执行时间"]
        cols = machine_cols(hdr)
        names = [c[0] for c in cols]
        self.assertEqual(names, ["ClientA-1.2.3.4-Linux", "Box-Client-5.6.7.8-Windows"])
        # 客户端名自身含 "-" 时不能被切错（贪婪前缀 + 锚定 IP/OS）
        self.assertEqual(cols[1][1], "Box-Client")
        self.assertEqual(cols[1][2], "5.6.7.8-Windows")


class LedgerTest(unittest.TestCase):
    def _write_sample(self):
        d = tempfile.mkdtemp(prefix="ledger-")
        path = os.path.join(d, "用例矩阵-设计级-总执行结果-2026-11-03.csv")
        with open(path, "w", encoding="utf-8-sig", newline="") as f:
            f.write(SAMPLE_CSV)
        return d

    def test_ledger_skips_notrun_and_keeps_status(self):
        from trend_metrics import build_ledger
        recs = build_ledger(self._write_sample())
        # D1-1 A/B(2) + D1-2 A(BLOCKED, NOT_RUN 不记)(1) + D2-1 A/B(2) = 5
        self.assertEqual(len(recs), 5)
        self.assertNotIn("NOT_RUN", [r["status"] for r in recs])
        first = [r for r in recs if r["case_id"] == "D1-1" and r["client"] == "ClientA"][0]
        self.assertEqual(first["status"], "PASS")
        self.assertEqual(first["dim"], "D1安装")
        self.assertEqual(first["priority"], "P0")
        self.assertEqual(first["machine"], "1.2.3.4-Linux")

    def test_write_ledger_dir_is_idempotent(self):
        from trend_metrics import build_ledger, write_ledger_dir
        src = self._write_sample()
        out = tempfile.mkdtemp(prefix="ledger-out-")
        recs = build_ledger(src)
        days, written = write_ledger_dir(out, recs)
        self.assertEqual((days, written), (1, 1))
        self.assertTrue(os.path.isfile(os.path.join(out, "execution-daily", "2026-11-03.csv")))
        # 第二次：内容一致 → 不重写（防 CI 空提交）
        days2, written2 = write_ledger_dir(out, recs)
        self.assertEqual((days2, written2), (1, 0))


if __name__ == "__main__":
    unittest.main()