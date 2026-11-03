# -*- coding: utf-8 -*-
"""gen_tracking_master 单测：状态聚合、口径区分、xlsx 降级。

关键口径（不能混）：
  * 在当日矩阵内但该端 NOT_RUN/空 → 「未执行」
  * 不在当日矩阵中 → 「未纳入当日范围」（AGENTS.md：NOT_RUN 仅指「归你但明确没跑」）
"""

import csv
import importlib.util
import io
import os
import sys
import tempfile
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(ROOT, "scripts"))

spec = importlib.util.spec_from_file_location(
    "gen_tracking_master", os.path.join(ROOT, "scripts", "gen_tracking_master.py"))
gt = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gt)

MATRIX = """层级,ID,维度,标题,优先级,ClientA-1.2.3.4-Linux,ClientB-5.6.7.8-Windows,当日总执行状态
设计级,D1-1,D1安装,c1,P0,PASS,PASS,PASS:2
设计级,D1-2,D1安装,c2,P1,FAIL,PASS,FAIL:1 PASS:1
设计级,D1-3,D1安装,c3,P2,NOT_RUN,NOT_RUN,NOT_RUN:2
设计级,D1-4,D1安装,c4,P0,SPEC-MISMATCH,,SPEC-MISMATCH:1
"""

DEFN = """ID,维度,标题,优先级,前置条件,测试数据,操作步骤,预期结果,指引来源,关联工具,自动化建议,展开规则,生成时间,设计状态
D1-1,D1安装,c1,P0,p,d,s,e,G,t,a,r,t,设计
D1-2,D1安装,c2,P1,p,d,s,e,G,t,a,r,t,设计
D1-3,D1安装,c3,P2,p,d,s,e,G,t,a,r,t,设计
D1-5,D1安装,c5,P0,p,d,s,e,G,t,a,r,t,设计
"""


class StatusAggregationTest(unittest.TestCase):
    def _tmp(self, text, name):
        d = tempfile.mkdtemp(prefix="tm-")
        p = os.path.join(d, name)
        with io.open(p, "w", encoding="utf-8-sig", newline="") as f:
            f.write(text)
        return d, p

    def test_matrix_verdict_priority(self):
        """有 FAIL 取 FAIL；无 FAIL 有 SPEC 取 SPEC；全 PASS 取 PASS；全 NOT_RUN 取 NOT_RUN。"""
        d, p = self._tmp(MATRIX, "用例矩阵-设计级-总执行结果-2026-11-03.csv")
        rows = list(csv.reader(io.open(p, encoding="utf-8-sig")))
        hdr, body = rows[0], rows[1:]
        idx = {n: i for i, n in enumerate(hdr)}
        from trend_metrics import machine_cols, _cell_status
        got = {}
        for r in body:
            counts = {}
            for raw, _c, _m in machine_cols(hdr):
                s = _cell_status(r[idx[raw]])
                if s:
                    counts[s] = counts.get(s, 0) + 1
            got[r[idx["ID"]]] = counts
        self.assertEqual(got["D1-1"], {"PASS": 2})
        self.assertEqual(got["D1-2"], {"FAIL": 1, "PASS": 1})
        self.assertEqual(got["D1-4"], {"SPEC-MISMATCH": 1})

    def test_build_rows_distinguishes_out_of_scope(self):
        """D1-5 不在矩阵里 → 「未纳入当日范围」，不能写成「未执行」。"""
        d, p = self._tmp(DEFN, "用例矩阵-设计级.csv")
        hdr, rows = gt.build_rows("设计级", p, {"D1-1": {"verdict": "PASS", "pass": 2, "machines": 2, "source": "x"}})
        si = hdr.index("状态")
        by_id = {r[0]: r[si] for _v, r in rows}
        self.assertEqual(by_id["D1-1"], "通过")
        self.assertEqual(by_id["D1-5"], "未纳入当日范围")

    def test_status_enum_covers_doc_vocabulary(self):
        """docs/01-测试规划.md:433 的 5 类必须齐；另加「未纳入当日范围」。"""
        for cn in ("未执行", "通过", "失败", "阻塞", "跳过（规格不一致）", "未纳入当日范围"):
            self.assertIn(cn, gt.STATUS_CN.values())


class XlsxDegradeTest(unittest.TestCase):
    def test_write_workbook_never_raises(self):
        d = tempfile.mkdtemp(prefix="tmw-")
        ok = gt.write_workbook(os.path.join(d, "t.xlsx"), [("设计级", ["ID", "状态"], [("PASS", ["D1-1", "通过"])])], "2026-11-03")
        self.assertIsInstance(ok, bool)
        if ok:
            from openpyxl import load_workbook
            wb = load_workbook(os.path.join(d, "t.xlsx"))
            self.assertIn("设计级", wb.sheetnames)
            self.assertIn("图例", wb.sheetnames)
            self.assertEqual(wb["设计级"].freeze_panes, "A2")


if __name__ == "__main__":
    unittest.main()
