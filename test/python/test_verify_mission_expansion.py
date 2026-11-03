# -*- coding: utf-8 -*-
"""verify_mission_expansion 门禁单测（不依赖网络 / 真云；全用临时目录）。"""

import importlib.util
import io
import os
import tempfile
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
spec = importlib.util.spec_from_file_location(
    "verify_mission_expansion", os.path.join(ROOT, "scripts", "verify_mission_expansion.py")
)
vm = importlib.util.module_from_spec(spec)
spec.loader.exec_module(vm)

MISSION_YAML = """apiVersion: test.huaweicloud.com/v1
kind: TestMission
metadata:
  id: "mission-001"
  priority: P0
spec:
  scope: |
    测试安全策略模块
  affectedTools:
    - huaweicloud_hook_check_command
    - huaweicloud_run_readonly_command
  affectedCases:
    - D4-1
  qualityCriteria:
    - "输出不得包含 AK/SK 明文"
"""

HEADER = ",".join(vm.COLUMNS)


def row(case_id, strength="L2", tool="huaweicloud_hook_check_command", result="PASS", ev="evidence/%s"):
    return ",".join([
        case_id, "step", "input", "expected", "judgement", strength, tool, result, ev % case_id
    ])


class Base(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        self.md = os.path.join(self.tmp, "missions")
        os.makedirs(self.md)
        with io.open(os.path.join(self.md, "mission-001.yaml"), "w", encoding="utf-8") as f:
            f.write(MISSION_YAML)
        self.pkg = os.path.join(self.tmp, "pkg")
        self.ac = os.path.join(self.pkg, "autocases")
        os.makedirs(self.ac)

    def write_csv(self, body):
        with io.open(os.path.join(self.ac, "mission-001.csv"), "w", encoding="utf-8", newline="") as f:
            f.write(body)

    def make_evidence(self, ids):
        for cid in ids:
            d = os.path.join(self.pkg, "evidence", cid)
            os.makedirs(d, exist_ok=True)
            with io.open(os.path.join(d, "stdout.log"), "w", encoding="utf-8") as f:
                f.write("real output\n")

    def run_checks(self):
        self.raw = vm.verify(self.pkg, "mission-001", self.md)
        return {c["check"]: c for c in self.raw}

    def all_ok(self, checks):
        return all(c["ok"] for c in checks.values())


GOOD_IDS = ["AUTO-mission-001-1", "AUTO-mission-001-2", "AUTO-mission-001-3"]


class TestHappyPath(Base):
    def test_valid_package_passes(self):
        self.write_csv("\n".join([HEADER] + [row(c) for c in GOOD_IDS]))
        self.make_evidence(GOOD_IDS)
        checks = self.run_checks()
        self.assertTrue(self.all_ok(checks), {k: v["detail"] for k, v in checks.items() if not v["ok"]})


class TestFailures(Base):
    def test_too_few_cases(self):
        self.write_csv("\n".join([HEADER, row(GOOD_IDS[0])]))
        self.make_evidence(GOOD_IDS[:1])
        self.assertFalse(self.run_checks()["case_count"]["ok"])

    def test_bad_case_id_prefix(self):
        self.write_csv("\n".join([HEADER] + [row(c) for c in ["D3-S1", "AUTO-mission-001-2", "AUTO-mission-001-3"]]))
        self.make_evidence(GOOD_IDS[1:])
        self.assertFalse(self.run_checks()["case_id_prefix"]["ok"])

    def test_wrong_columns(self):
        self.write_csv("\n".join(["case_id,步骤,输入", "x,y,z"]))
        checks = self.run_checks()
        self.assertTrue(checks["artifact"]["ok"])      # 文件在
        self.assertFalse(checks["header"]["ok"])       # 但列名不符 → 报 header
        # 不重复记账：verify 返回的原始列表里 artifact 只出现一次
        self.assertEqual(len([c for c in self.raw if c["check"] == "artifact"]), 1)

    def test_self_proof_judgement(self):
        body = "\n".join([HEADER] + [row(GOOD_IDS[0]), row(GOOD_IDS[1]),
                                     row(GOOD_IDS[2]).replace("judgement", "探针返回 PASS 即通过")])
        self.write_csv(body)
        self.make_evidence(GOOD_IDS)
        self.assertFalse(self.run_checks()["no_self_proof"]["ok"])

    def test_tool_out_of_mission(self):
        body = "\n".join([HEADER] + [row(GOOD_IDS[0]),
                                     row(GOOD_IDS[1]),
                                     row(GOOD_IDS[2], tool="huaweicloud_not_in_mission")])
        self.write_csv(body)
        self.make_evidence(GOOD_IDS)
        self.assertFalse(self.run_checks()["tools_in_mission"]["ok"])

    def test_pass_without_evidence(self):
        self.write_csv("\n".join([HEADER] + [row(c) for c in GOOD_IDS]))
        # 不建证据目录
        self.assertFalse(self.run_checks()["pass_evidence"]["ok"])

    def test_empty_evidence_file(self):
        self.write_csv("\n".join([HEADER] + [row(c) for c in GOOD_IDS]))
        for cid in GOOD_IDS:
            d = os.path.join(self.pkg, "evidence", cid)
            os.makedirs(d)
            open(os.path.join(d, "stdout.log"), "w").close()   # 空文件
        self.assertFalse(self.run_checks()["pass_evidence"]["ok"])

    def test_l1_ratio_exceeded(self):
        rows = [row(c, strength="L1") for c in GOOD_IDS]
        self.write_csv("\n".join([HEADER] + rows))
        self.make_evidence(GOOD_IDS)
        self.assertFalse(self.run_checks()["l1_ratio"]["ok"])

    def test_missing_artifact(self):
        checks = self.run_checks()
        self.assertFalse(checks["artifact"]["ok"])


class TestMissionParsing(Base):
    def test_affected_tools_parsed(self):
        m = vm.parse_mission_yaml(os.path.join(self.md, "mission-001.yaml"))
        self.assertEqual(m["affectedTools"], ["huaweicloud_hook_check_command", "huaweicloud_run_readonly_command"])
        self.assertIn("D4-1", m["affectedCases"])

    def test_missing_mission_file(self):
        m = vm.parse_mission_yaml(os.path.join(self.md, "nope.yaml"))
        self.assertEqual(m["affectedTools"], [])


if __name__ == "__main__":
    unittest.main()
