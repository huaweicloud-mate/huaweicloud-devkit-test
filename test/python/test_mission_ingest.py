# -*- coding: utf-8 -*-
"""mission_ingest 契约单测（标准库 unittest，无第三方依赖）。

运行任一：
    python -m unittest discover -s test/python -p 'test_*.py'
    python -m unittest test.python.test_mission_ingest
"""
import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), os.pardir, os.pardir, "scripts"))

from mission_ingest import (  # noqa: E402
    parse_mission,
    filter_mission_for,
    merge_mission,
    to_mission_csv,
    load_missions_dirs,
    MISSION_COL,
    MISSION_PRIORITY_COL,
)

MISSION_YAML = """\
apiVersion: test.huaweicloud.com/v1
kind: TestMission
metadata:
  id: "mission-001"
  domain: "D4 安全与风险护栏"
  priority: P0
  estimatedDuration: "30m"
spec:
  scope: |
    D4 安全与风险护栏 回归
  affectedTools:
    - huaweicloud_hook_check_command
  affectedCases:
    - D4-5
    - D4-15
  constraints:
    - "P0 用例不得 NOT_RUN"
  qualityCriteria:
    - "9 条相关用例全部执行"
"""


class ParseMissionTest(unittest.TestCase):
    def test_parse_mission_full(self):
        m = parse_mission(MISSION_YAML)
        self.assertIsNotNone(m)
        self.assertEqual(m["id"], "mission-001")
        self.assertEqual(m["priority"], "P0")
        self.assertIn("D4-5", m["affectedCases"])
        self.assertIn("D4-15", m["affectedCases"])
        self.assertIn("huaweicloud_hook_check_command", m["affectedTools"])

    def test_parse_mission_missing_id(self):
        self.assertIsNone(parse_mission("spec:\n  affectedCases:\n    - D1-1\n"))

    def test_parse_mission_missing_cases(self):
        self.assertIsNone(parse_mission("metadata:\n  id: mission-x\n"))

    def test_parse_mission_quoted_values(self):
        m = parse_mission('metadata:\n  id: "mission-002"\n  priority: P1\nspec:\n  affectedCases:\n    - D2-3\n')
        self.assertEqual(m["id"], "mission-002")
        self.assertEqual(m["priority"], "P1")


class FilterMissionTest(unittest.TestCase):
    def test_generic_mission_all_clients(self):
        m = parse_mission(MISSION_YAML)
        self.assertTrue(filter_mission_for(m, "Codex"))
        self.assertTrue(filter_mission_for(m, "Hermes"))

    def test_client_specific_tool_restricted(self):
        m = parse_mission(
            'metadata:\n  id: m1\n  priority: P1\nspec:\n  affectedTools:\n    - hook_check_command\n'
            '  affectedCases:\n    - D4-1\n'
        )
        self.assertTrue(filter_mission_for(m, "Hermes"))
        self.assertFalse(filter_mission_for(m, "Codex"))


class MergeMissionTest(unittest.TestCase):
    def test_merge_tags_hit_rows(self):
        m = parse_mission(MISSION_YAML)
        rows = [{"ID": "D4-5"}, {"ID": "D1-1"}, {"ID": "D4-15"}]
        tagged = merge_mission(rows, m)
        by_id = {r["ID"]: r for r in tagged}
        self.assertEqual(by_id["D4-5"][MISSION_COL], "mission-001")
        self.assertEqual(by_id["D4-5"][MISSION_PRIORITY_COL], "P0")
        self.assertEqual(by_id["D4-15"][MISSION_COL], "mission-001")
        self.assertFalse(by_id["D1-1"].get(MISSION_COL))

    def test_merge_does_not_mutate_input(self):
        m = parse_mission(MISSION_YAML)
        rows = [{"ID": "D4-5"}]
        merge_mission(rows, m)
        self.assertNotIn(MISSION_COL, rows[0])

    def test_merge_empty_target_no_change(self):
        m = parse_mission('metadata:\n  id: m2\nspec:\n  affectedCases:\n    - D9-99-UNKNOWN\n')
        rows = [{"ID": "D1-1"}]
        tagged = merge_mission(rows, m)
        self.assertEqual(len(tagged), 1)
        self.assertNotIn(MISSION_COL, tagged[0])


class ToMissionCsvTest(unittest.TestCase):
    def test_csv_rows_include_exec_cols(self):
        m = parse_mission(MISSION_YAML)
        rows = [{"ID": "D4-5", "title": "x"}, {"ID": "D1-1"}, {"ID": "D4-15"}]
        headers, mrows = to_mission_csv(rows, m)
        self.assertEqual(len(mrows), 2)
        for col in ("ID", "执行状态", "执行时间", "evidencePath", "blockedReason"):
            self.assertIn(col, headers)
        for r in mrows:
            self.assertEqual(r["执行状态"], "")
            self.assertEqual(r[MISSION_COL], "mission-001")

    def test_csv_empty_when_no_hit(self):
        m = parse_mission('metadata:\n  id: m3\nspec:\n  affectedCases:\n    - D9-99-UNKNOWN\n')
        headers, mrows = to_mission_csv([{"ID": "D1-1"}], m)
        self.assertEqual(mrows, [])
        self.assertEqual(headers, [])


class LoadMissionsDirsTest(unittest.TestCase):
    def test_load_from_dir(self):
        import tempfile
        with tempfile.TemporaryDirectory() as d:
            p = os.path.join(d, "a.yaml")
            with open(p, "w", encoding="utf-8") as f:
                f.write('metadata:\n  id: m1\nspec:\n  affectedCases:\n    - D1-5\n')
            found, errs = load_missions_dirs([d])
            self.assertEqual(len(found), 1)
            self.assertEqual(errs, [])
            self.assertEqual(found[0]["id"], "m1")

    def test_load_skips_non_yaml(self):
        import tempfile
        with tempfile.TemporaryDirectory() as d:
            with open(os.path.join(d, "note.txt"), "w", encoding="utf-8") as f:
                f.write("not a mission")
            found, errs = load_missions_dirs([d])
            self.assertEqual(found, [])


if __name__ == "__main__":
    unittest.main()