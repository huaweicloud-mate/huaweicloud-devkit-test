# -*- coding: utf-8 -*-
"""auto_remediator 处置计划与限流单测（纯函数，不依赖 multica / 网络）。"""

import importlib.util
import os
import unittest
from datetime import datetime, timedelta, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
spec = importlib.util.spec_from_file_location(
    "auto_remediator", os.path.join(ROOT, "scripts", "auto_remediator.py")
)
ar = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ar)

NOW = datetime(2026, 11, 3, 12, 0, 0, tzinfo=timezone.utc)


def rec(sig, ap="ap-1", title="每日测试-x"):
    return {"signature": sig, "autopilot_id": ap, "title": title}


def led(ts, ap="ap-1", mode="live", decision="execute"):
    return {"ts_utc": ts.strftime("%Y-%m-%dT%H:%M:%SZ"), "autopilot_id": ap,
            "decision": decision, "mode": mode, "signature": "PUSH_FAILED"}


class TestBuildPlan(unittest.TestCase):
    def test_resend_executes_when_no_ledger(self):
        plan = ar.build_plan([rec("PUSH_FAILED")], [], now=NOW)
        self.assertEqual(plan[0]["decision"], "execute")

    def test_resend_limited_by_recent_live(self):
        ledger = [led(NOW - timedelta(hours=1))]
        plan = ar.build_plan([rec("PUSH_FAILED")], ledger, max_per_ap=1, window_hours=12, now=NOW)
        self.assertEqual(plan[0]["decision"], "skip_limited")

    def test_resend_allowed_after_window(self):
        ledger = [led(NOW - timedelta(hours=13))]
        plan = ar.build_plan([rec("PUSH_FAILED")], ledger, max_per_ap=1, window_hours=12, now=NOW)
        self.assertEqual(plan[0]["decision"], "execute")

    def test_dry_run_ledger_does_not_count(self):
        ledger = [led(NOW - timedelta(hours=1), mode="dry")]
        plan = ar.build_plan([rec("PUSH_FAILED")], ledger, max_per_ap=1, now=NOW)
        self.assertEqual(plan[0]["decision"], "execute")

    def test_same_batch_respects_cap(self):
        plan = ar.build_plan([rec("PUSH_FAILED"), rec("TOOL_CALL_LIMIT")], [], max_per_ap=1, now=NOW)
        decisions = sorted(p["decision"] for p in plan)
        self.assertEqual(decisions, ["execute", "skip_limited"])

    def test_machine_alert_is_alert_only(self):
        plan = ar.build_plan([rec("BALANCE_403")], [], now=NOW)
        self.assertEqual(plan[0]["decision"], "alert_only")
        self.assertEqual(plan[0]["action"], "machine-alert")

    def test_manual_signature(self):
        plan = ar.build_plan([rec("FAKE_PASS")], [], now=NOW)
        self.assertEqual(plan[0]["decision"], "manual")

    def test_normal_and_skipped_ignored(self):
        plan = ar.build_plan([{"signature": None, "autopilot_id": "a", "title": "t"},
                              {"signature": "SKIPPED", "autopilot_id": "a", "title": "t"}], [], now=NOW)
        self.assertEqual(plan, [])


class TestLedger(unittest.TestCase):
    def test_recent_resends_counts_only_live_execute(self):
        ledger = [
            led(NOW - timedelta(hours=1)),
            led(NOW - timedelta(hours=1), mode="dry"),
            led(NOW - timedelta(hours=1), decision="skip_limited"),
            led(NOW - timedelta(hours=1), ap="other-ap"),
        ]
        self.assertEqual(ar.recent_resends(ledger, "ap-1", 12, NOW), 1)

    def test_roundtrip_append_and_load(self):
        import tempfile
        with tempfile.TemporaryDirectory() as d:
            p = os.path.join(d, "led.csv")
            ar.append_ledger(p, [{"ts_utc": "2026-11-03T12:00:00Z", "autopilot_id": "ap-1",
                                  "title": "t", "signature": "PUSH_FAILED", "decision": "execute",
                                  "mode": "live", "note": "triggered"}])
            rows = ar.load_ledger(p)
            self.assertEqual(len(rows), 1)
            self.assertEqual(rows[0]["autopilot_id"], "ap-1")


class TestReport(unittest.TestCase):
    def test_report_groups_by_signature(self):
        res = [
            {"signature": "PUSH_FAILED", "autopilot_id": "a", "title": "T-A", "decision": "execute",
             "result": "dry-run", "reason": "r1"},
            {"signature": "BALANCE_403", "autopilot_id": "b", "title": "T-B", "decision": "alert_only",
             "result": "not-executed", "reason": "r2"},
        ]
        md = ar.build_alert_report(res, "2026-11-03")
        self.assertIn("## PUSH_FAILED（1）", md)
        self.assertIn("## BALANCE_403（1）", md)


if __name__ == "__main__":
    unittest.main()
