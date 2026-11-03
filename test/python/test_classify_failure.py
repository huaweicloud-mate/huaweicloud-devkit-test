# -*- coding: utf-8 -*-
"""classify_failure 失败签名分类器单测（不依赖 multica / 网络）。

关键回归：`verify_no_fake_pass.py` 是门禁脚本名，输出里出现它**不得**被判成 FAKE_PASS
（2026-11-03 实测误报 24/60 —— 全机队扫描时把「门禁通过」当成空壳探针）。
"""

import importlib.util
import json
import os
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
spec = importlib.util.spec_from_file_location(
    "classify_failure", os.path.join(ROOT, "scripts", "classify_failure.py")
)
cf = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cf)


class TestRuleHits(unittest.TestCase):
    CASES = [
        ("BALANCE_403", "OpenAI API error: 403 insufficient balance"),
        ("MISSING_CREDENTIAL", "llm-deepseek: no API key for provider (401 unauthorized)"),
        ("SHIM_SECOND_EXIT", "hermes initialize failed: hermes process exited"),
        ("PUSH_FAILED", "fatal: failed to push some refs (remote: Permission denied)"),
        ("TOOL_CALL_LIMIT", "已达到工具调用上限，收尾未做"),
        ("FAKE_PASS", "probe 硬编码 PASS，stdout 为空"),
        ("DRIFT", "只读文档，未回填 results 即退出"),
    ]

    def test_expected_signatures(self):
        for want, text in self.CASES:
            with self.subTest(want=want):
                hit = cf.classify_text(text)
                self.assertIsNotNone(hit, "no rule matched: %s" % text)
                self.assertEqual(hit[0], want)

    def test_action_map(self):
        self.assertEqual(cf.RULES_ACTION("BALANCE_403"), "machine-alert")
        self.assertEqual(cf.RULES_ACTION("PUSH_FAILED"), "resend")


class TestNegativeFakePass(unittest.TestCase):
    """门禁脚本名不得触发 FAKE_PASS。"""

    NEGATIVES = [
        "双门禁通过：verify_no_fake_pass.py 与 verify_coverage.py 均 exit 0",
        "- verify_no_fake_pass.py：PASS 门禁通过（所有 PASS 用例均有 evidencePath）",
        "尚未运行 verify_no_fake_pass.py 与 verify_coverage.py 双门禁。",
    ]

    def test_not_fake_pass(self):
        for text in self.NEGATIVES:
            with self.subTest(text=text[:30]):
                hit = cf.classify_text(text)
                self.assertNotEqual(hit[0] if hit else None, "FAKE_PASS")


class TestRunLevel(unittest.TestCase):
    def _run(self, status, dur_s, output="", failure_reason=""):
        t0 = "2026-10-25T21:00:00Z"
        t1 = "2026-10-25T21:%02d:%02dZ" % (dur_s // 60, dur_s % 60) if dur_s < 3600 else "2026-10-25T22:15:00Z"
        r = {"status": status, "triggered_at": t0, "completed_at": t1,
             "result": ({"output": output} if output else None), "failure_reason": failure_reason}
        return cf.classify_run(r)

    def test_quick_exit(self):
        self.assertEqual(self._run("failed", 10, failure_reason="unknown")["signature"], "SHIM_SECOND_EXIT")

    def test_timeout_window(self):
        rec = self._run("failed", 900, failure_reason="unknown")
        self.assertEqual(rec["signature"], "TIMEOUT_KILLED")
        self.assertEqual(rec["action"], "resend")

    def test_empty_run(self):
        self.assertEqual(self._run("completed", 10, output="开始执行。")["signature"], "EMPTY_RUN")

    def test_normal_completed(self):
        self.assertIsNone(self._run("completed", 1000, output="x" * 400)["signature"])

    def test_skipped(self):
        self.assertEqual(self._run("skipped", 0)["signature"], "SKIPPED")

    def test_result_as_stringified_dict(self):
        r = {"status": "failed", "triggered_at": "2026-10-25T21:00:00Z",
             "completed_at": "2026-10-25T21:00:05Z",
             "result": "{'output': 'insufficient balance'}", "failure_reason": ""}
        self.assertEqual(cf.classify_run(r)["signature"], "BALANCE_403")


class TestExtractText(unittest.TestCase):
    def test_dict_result(self):
        self.assertIn("hello", cf.extract_text({"result": {"output": "hello"}}))

    def test_stringified_result(self):
        self.assertIn("hello", cf.extract_text({"result": "{'output': 'hello'}"}))

    def test_result_none(self):
        self.assertEqual(cf.extract_text({"result": None, "failure_reason": "boom"}).strip(), "boom")

    def test_json_string_result(self):
        self.assertIn("hi", cf.extract_text({"result": json.dumps({"output": "hi"})}))


if __name__ == "__main__":
    unittest.main()
