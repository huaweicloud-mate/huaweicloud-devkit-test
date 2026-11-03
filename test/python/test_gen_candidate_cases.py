# -*- coding: utf-8 -*-
"""gen_candidate_cases 单测（读真 module-map + 真母版；不依赖网络/git）。"""

import importlib.util
import os
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
spec = importlib.util.spec_from_file_location(
    "gen_candidate_cases", os.path.join(ROOT, "scripts", "gen_candidate_cases.py")
)
gc = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gc)


class TestModuleMap(unittest.TestCase):
    def setUp(self):
        self.entries = gc.parse_module_map()
        self.by_dim = {e["dim"]: e for e in self.entries}

    def test_parsed_dimensions(self):
        self.assertGreaterEqual(len(self.entries), 10)
        self.assertIn("D4", self.by_dim)

    def test_d4_modules_and_risk(self):
        d4 = self.by_dim["D4"]
        self.assertEqual(d4["risk"], "high")
        self.assertIn("safety-policy", d4["modules"])

    def test_note_captured(self):
        self.assertTrue(any(e["note"] for e in self.entries))


class TestMatching(unittest.TestCase):
    def setUp(self):
        self.entries = gc.parse_module_map()

    def test_safety_policy_hits_d4(self):
        hits = gc.match_dimensions(["hdk/plugins/huaweicloud-core/src/safety-policy.mjs"], self.entries)
        self.assertIn("D4", [e["dim"] for e, _ in hits])

    def test_tools_hits_multiple_dims(self):
        hits = gc.match_dimensions(["src/tools.mjs"], self.entries)
        dims = {e["dim"] for e, _ in hits}
        self.assertTrue({"D3", "D10"} & dims)   # tools 同时挂在 D3 与 D10

    def test_unrelated_file_no_hit(self):
        hits = gc.match_dimensions(["docs/README.md"], self.entries)
        self.assertEqual(hits, [])


class TestCandidates(unittest.TestCase):
    def setUp(self):
        self.entries = gc.parse_module_map()

    def test_id_prefix_and_priority(self):
        cands = gc.build_candidates(["src/safety-policy.mjs"], self.entries)
        self.assertTrue(cands)
        c = cands[0]
        self.assertTrue(c["candidate_id"].startswith("CAND-"))
        self.assertEqual(c["优先级"], "P0")          # risk=high → P0
        self.assertEqual(c["状态"], "候选")
        self.assertIn("safety-policy", c["生成依据"])

    def test_no_candidates_for_unrelated(self):
        self.assertEqual(gc.build_candidates(["docs/x.md"], self.entries), [])


class TestCoverage(unittest.TestCase):
    def test_existing_coverage_nonempty(self):
        cov = gc.existing_coverage()
        self.assertGreater(sum(cov.values()), 100)   # 设计级母版 212 条

    def test_coverage_keys_normalised_and_matched(self):
        """回归：母版维度列是 `D4安全`，候选维度是 `D4` —— 必须能对上（曾整列显示 0）。"""
        cov = gc.existing_coverage()
        self.assertIn("D4", cov)
        self.assertGreater(cov["D4"], 0)

    def test_norm_dim(self):
        self.assertEqual(gc.norm_dim("D4安全"), "D4")
        self.assertEqual(gc.norm_dim(" D10评测 "), "D10")
        self.assertEqual(gc.norm_dim(""), "")


if __name__ == "__main__":
    unittest.main()
