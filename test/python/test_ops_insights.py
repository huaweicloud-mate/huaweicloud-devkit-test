# -*- coding: utf-8 -*-
"""ops_insights 单测：运维视角聚合的结构、降级与转义。

关键纪律：任何一节失败都不得抛异常（日报主报告不许被拖垮），只能降级为说明文字。
"""

import importlib.util
import os
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
spec = importlib.util.spec_from_file_location(
    "ops_insights", os.path.join(ROOT, "scripts", "ops_insights.py")
)
ops = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ops)


class TestStructure(unittest.TestCase):
    def test_md_has_all_sections(self):
        md = ops.build_md("2026-11-03", top_n=3, include_signature=False)
        self.assertIn("## 运维视角（自动生成）", md)
        for t in ["根因簇", "跨端一致性", "单号关联", "自主产物"]:
            self.assertIn("### %s" % t, md)

    def test_md_excludes_signature_when_disabled(self):
        md = ops.build_md("2026-11-03", include_signature=False)
        self.assertNotIn("失败签名分布", md)

    def test_signature_section_degrades_without_multica(self):
        """CI 无 multica → 该节返回说明文字，不抛异常（mock 掉 which，避免真调平台拖慢单测）。"""
        import unittest.mock as mock
        with mock.patch.object(ops.shutil, "which", return_value=None):
            out = ops.signature_section(5)
        self.assertIsInstance(out, list)
        self.assertTrue(any("跳过" in x for x in out))


class TestDegradation(unittest.TestCase):
    def test_unknown_date_does_not_raise(self):
        md = ops.build_md("1900-01-01", include_signature=False)
        self.assertIn("运维视角", md)
        self.assertIn("跳过", md)          # 缺数据 → 明确说明，而不是静默消失

    def test_failing_section_is_caught(self):
        """人为让某节抛异常 → 被降级为一行说明，整体仍返回。"""
        orig = ops.SECTIONS
        try:
            ops.SECTIONS = [("总会炸的一节", lambda date, top_n: (_ for _ in ()).throw(RuntimeError("boom")))]
            md = ops.build_md("2026-11-03", include_signature=False)
            self.assertIn("生成失败", md)
            self.assertIn("boom", md)
        finally:
            ops.SECTIONS = orig

    def test_html_escapes_markup(self):
        h = ops.build_html("2026-11-03", top_n=2, include_signature=False)
        self.assertIn("<section", h)
        self.assertIn("运维视角", h)
        self.assertNotIn("**", h)          # markdown 粗体已被清洗


class TestRealData(unittest.TestCase):
    @unittest.skipUnless(os.path.isfile(os.path.join(ops.SUMMARY_DIR, "每日测试汇总-2026-11-03.md")),
                         "缺 2026-11-03 汇总快照")
    def test_real_data_sections_populated(self):
        md = ops.build_md("2026-11-03", top_n=3, include_signature=False)
        self.assertIn("根因记录 **94** 条", md)
        self.assertIn("孤例 PASS（假绿嫌疑）9 条", md)
        self.assertIn("FAIL/SPEC 用例 **37** 条", md)


if __name__ == "__main__":
    unittest.main()
