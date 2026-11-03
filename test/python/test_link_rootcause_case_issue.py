# -*- coding: utf-8 -*-
"""link_rootcause_case_issue 单测（临时目录构造执行包；真数据用例带 skip 保护）。"""

import importlib.util
import os
import tempfile
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
spec = importlib.util.spec_from_file_location(
    "link_rootcause_case_issue", os.path.join(ROOT, "scripts", "link_rootcause_case_issue.py")
)
lk = importlib.util.module_from_spec(spec)
spec.loader.exec_module(lk)

HISTORY = """# 历史问题关联清单（不重复提单）

## D2-4 凭证脱敏漏小写 ak=/sk=
- 今日证据：`evidence/D2-4/stdout.log`
- **关联历史单**：
  - [#1065](https://github.com/x/issues/1065)（open）
  - [#980](https://github.com/x/issues/980)（open）

## D4-21 制品预检 HCL 未拦截
- 关联历史单：
  - [#1055](https://github.com/x/issues/1055)（open）
"""

FINDINGS = """# FINDINGS

## D9-12 initialize 握手
- 根因：mcp-protocol.mjs:57
- 单号：#1055
"""

NESTED = """# 历史问题关联清单

## D4-21 制品预检 HCL 未拦截
- **关联历史单**：
  - [#1055](https://github.com/x/issues/1055)（open）
    - 历史单内容：见 历史 [#673](https://github.com/x/issues/673) 的摘要（嵌套引用，不计入）
    - 另见 #698 与 #774（嵌套，裸号，不计入）
"""


class TestParseLinks(unittest.TestCase):
    def setUp(self):
        self.d = tempfile.mkdtemp()
        self.p_hist = os.path.join(self.d, "HISTORY_LINKS.md")
        self.p_find = os.path.join(self.d, "FINDINGS.md")
        open(self.p_hist, "w", encoding="utf-8").write(HISTORY)
        open(self.p_find, "w", encoding="utf-8").write(FINDINGS)

    def test_history_links(self):
        m = lk.parse_links_file(self.p_hist)
        self.assertEqual(m["D2-4"], {"1065", "980"})
        self.assertEqual(m["D4-21"], {"1055"})

    def test_findings_bare_number(self):
        m = lk.parse_links_file(self.p_find)
        self.assertEqual(m["D9-12"], {"1055"})

    def test_missing_file(self):
        self.assertEqual(dict(lk.parse_links_file(os.path.join(self.d, "nope.md"))), {})


class TestNestedRefsExcluded(unittest.TestCase):
    """回归：段内「历史单内容」摘要里的嵌套引用（#673 / #698 / #774）不得算成关联单。"""

    def test_nested_refs_excluded(self):
        with tempfile.TemporaryDirectory() as d:
            p = os.path.join(d, "HISTORY_LINKS.md")
            open(p, "w", encoding="utf-8").write(NESTED)
            m = lk.parse_links_file(p)
            self.assertEqual(m["D4-21"], {"1055"})


class TestCollect(unittest.TestCase):
    def test_collect_from_results_tree(self):
        with tempfile.TemporaryDirectory() as root:
            pkg = os.path.join(root, "OpenCode", "2026-11-03-1.2.3.4", "Linux")
            os.makedirs(pkg)
            open(os.path.join(pkg, "HISTORY_LINKS.md"), "w", encoding="utf-8").write(HISTORY)
            agg = lk.collect_case_issues(root, "2026-11-03")
            self.assertIn("D2-4", agg)
            self.assertEqual(agg["D2-4"]["issues"], {"1065", "980"})
            self.assertIn("OpenCode", agg["D2-4"]["clients"])

    def test_report_md_not_scanned(self):
        """「测试报告.md」不得作为单号来源（曾把未标注冲成 0）。"""
        with tempfile.TemporaryDirectory() as root:
            pkg = os.path.join(root, "X", "2026-11-03-1.2.3.4", "Linux")
            os.makedirs(pkg)
            open(os.path.join(pkg, "测试报告.md"), "w", encoding="utf-8").write(
                "## D2-4 凭证脱敏\n- 见 [#1065](url)\n")
            agg = lk.collect_case_issues(root, "2026-11-03")
            self.assertNotIn("D2-4", agg)


class TestBuildAssociations(unittest.TestCase):
    def _cases(self):
        return [
            {"case_id": "D2-4", "level": "设计级", "dim": "D2认证", "title": "凭证脱敏",
             "priority": "P0", "status": "FAIL"},
            {"case_id": "D3-C1", "level": "设计级", "dim": "D3功能", "title": "ECS生命周期E2E",
             "priority": "P1", "status": "FAIL"},
        ]

    def test_linked_and_unlinked(self):
        case_map = {"D2-4": {"issues": {"1065"}, "clients": {"OpenCode"}, "sources": {"HISTORY_LINKS.md"}}}
        root_index = {"D2-4": [{"client": "OpenCode", "level": "P0", "root": "safety-policy.mjs:45"}]}
        links = lk.build_associations(self._cases(), case_map, root_index)
        self.assertEqual(links[0]["issues"], ["1065"])
        self.assertTrue(links[0]["linked_by_any"])
        self.assertEqual(links[0]["rootcause"], "safety-policy.mjs:45")
        self.assertFalse(links[1]["linked_by_any"])
        self.assertEqual(links[1]["issues"], [])
        self.assertEqual(links[1]["rootcause"], "")


SUMMARY = lk.SUMMARY_DIR


@unittest.skipUnless(os.path.isfile(os.path.join(SUMMARY, "用例矩阵-设计级-总执行结果-2026-11-03.csv")),
                     "缺 2026-11-03 矩阵快照")
class TestRealMatrix(unittest.TestCase):
    def test_matrix_cases_are_only_bad_status(self):
        cases = lk.load_matrix_cases(SUMMARY, "2026-11-03")
        self.assertTrue(cases)
        # status 可能组合（如 `FAIL+SPEC-MISMATCH`）
        self.assertTrue(all(("FAIL" in c["status"]) or ("SPEC-MISMATCH" in c["status"]) for c in cases))

    def test_unlinked_is_nonempty_on_real_data(self):
        """真实数据上「未关联」不应恒为 0 —— 曾因数据源选窄（只读根因表）而恒 0。"""
        cases = lk.load_matrix_cases(SUMMARY, "2026-11-03")
        case_map = lk.collect_case_issues(lk.os.path.join(lk.REPO, "results"), "2026-11-03")
        links = lk.build_associations(cases, case_map, {})
        unlinked = [l for l in links if not l["linked_by_any"]]
        self.assertGreater(len(unlinked), 0)


if __name__ == "__main__":
    unittest.main()
