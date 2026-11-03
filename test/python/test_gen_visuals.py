# -*- coding: utf-8 -*-
"""gen_visuals 单测：维度×客户端热力、配对清理、SVG 合法性、xlsx 可选依赖降级。

两个回归重点（都是实现过程中真踩过的坑）：
  1. `heat_dim_client` 的列索引曾误用 `c[0]`（列名首字符）→ 维度列定位失败、热力图全空
  2. `prune` 曾按"文件总数"保留 → 把 HTML/XLSX 配对拆散（保留 xlsx、删掉 html）
"""

import glob
import importlib.util
import os
import sys
import tempfile
import unittest
import xml.etree.ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(ROOT, "scripts"))

spec = importlib.util.spec_from_file_location("gen_visuals", os.path.join(ROOT, "scripts", "gen_visuals.py"))
g = importlib.util.module_from_spec(spec)
spec.loader.exec_module(g)

HDR = ["层级", "ID", "维度", "标题", "优先级",
       "ClientA-1.2.3.4-Linux", "ClientB-5.6.7.8-Windows", "当日总执行状态"]


class HeatDimClientTest(unittest.TestCase):
    def test_locates_dim_column_and_counts(self):
        """回归：维度列必须按列名定位（曾用列名首字符当 key → 结果恒为空）。"""
        rows = [["设计级", "D1-1", "D1安装", "c1", "P0", "PASS", "FAIL", ""],
                ["设计级", "D1-2", "D1安装", "c2", "P1", "BLOCKED", "", ""]]
        heat = g.heat_dim_client(HDR, rows)
        self.assertIn("D1", heat)
        self.assertEqual(heat["D1"]["ClientA"]["PASS"], 1)
        self.assertEqual(heat["D1"]["ClientA"]["BLOCKED"], 1)
        self.assertEqual(heat["D1"]["ClientB"]["FAIL"], 1)
        self.assertEqual(heat["D1"]["ClientB"]["total"], 1)

    def test_skips_empty_and_unknown_cells(self):
        rows = [["设计级", "D2-1", "D2认证", "c", "P0", "", "foo", ""]]
        heat = g.heat_dim_client(HDR, rows)
        self.assertEqual(heat, {})          # 空/未知状态不产生记录


class PruneTest(unittest.TestCase):
    def _mk(self, d, stamp, ext):
        p = os.path.join(d, "X-2026-11-03-%s%s" % (stamp, ext))
        open(p, "w", encoding="utf-8").close()
        return p

    def test_keeps_pair_by_timestamp_group(self):
        """回归：必须按时间戳**分组**保留，HTML/XLSX 不能拆散。"""
        d = tempfile.mkdtemp(prefix="prune-")
        self._mk(d, "20261103141140", ".html")
        self._mk(d, "20261103141140", ".xlsx")
        self._mk(d, "20261103141141", ".html")
        self._mk(d, "20261103141141", ".xlsx")
        removed, locked = g.prune(d, "X-", 1, [".html", ".xlsx"])
        self.assertEqual(len(removed), 2)
        self.assertEqual(locked, [])
        left = sorted(os.path.basename(p) for p in glob.glob(os.path.join(d, "X-*")))
        self.assertEqual(left, ["X-2026-11-03-20261103141141.html", "X-2026-11-03-20261103141141.xlsx"])

    def test_keep_zero_keeps_all(self):
        d = tempfile.mkdtemp(prefix="prune0-")
        self._mk(d, "20261103141140", ".html")
        self._mk(d, "20261103141141", ".html")
        removed, _ = g.prune(d, "X-", 99, [".html"])
        self.assertEqual(removed, [])

    def test_missing_file_goes_to_locked(self):
        """删除失败（被 WPS/Excel 占用）→ 记入 locked，不抛异常。"""
        d = tempfile.mkdtemp(prefix="prunelock-")
        self._mk(d, "20261103141140", ".html")
        self._mk(d, "20261103141141", ".html")
        orig = os.remove
        try:
            def boom(p):
                raise OSError("locked")
            os.remove = boom
            removed, locked = g.prune(d, "X-", 1, [".html"])
            self.assertEqual(removed, [])
            self.assertEqual(len(locked), 1)
        finally:
            os.remove = orig


class SvgTest(unittest.TestCase):
    def test_generated_svgs_are_wellformed(self):
        rows = [["设计级", "D1-1", "D1安装", "c1", "P0", "PASS", "FAIL", ""]]
        heat = g.heat_dim_client(HDR, rows)
        for svg in (g.svg_pyramid("snap", 147, 144, 107),
                    g.svg_heatmap(heat, ["D1"], ["ClientA", "ClientB"], "2026-11-03"),
                    g.svg_framework("2026-11-03", ["tm-plan", "ops_insights"])):
            ET.fromstring(svg)      # 非法 XML 会抛异常


class XlsxOptionalTest(unittest.TestCase):
    def test_returns_bool_never_raises(self):
        d = tempfile.mkdtemp(prefix="xlsx-")
        ok = g.write_xlsx(os.path.join(d, "t.xlsx"), [], [], {}, {})
        self.assertIsInstance(ok, bool)
        if ok:
            self.assertTrue(os.path.isfile(os.path.join(d, "t.xlsx")))
        # 不可用时必须是 False（→ 上层只提示跳过 xlsx，不影响 HTML/SVG）


if __name__ == "__main__":
    unittest.main()
