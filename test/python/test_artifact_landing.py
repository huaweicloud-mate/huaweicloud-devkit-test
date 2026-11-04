# -*- coding: utf-8 -*-
"""artifact_landing 单测：产物落地校验（抓「假完成」）。

核心回归点：**任务报 completed 但产物没落地** 必须被标记为 NOT_LANDED
（这正是 classify_failure 抓不到、而本工具存在的理由）。
"""

import datetime
import importlib.util
import os
import sys
import tempfile
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
spec = importlib.util.spec_from_file_location(
    "artifact_landing", os.path.join(ROOT, "scripts", "artifact_landing.py"))
al = importlib.util.module_from_spec(spec)
spec.loader.exec_module(al)

TODAY = datetime.datetime.now(al.BEIJING).date()


def ap(title, days_ago=0, status="completed"):
    ts = datetime.datetime.combine(TODAY - datetime.timedelta(days=days_ago),
                                   datetime.time(5, 0), tzinfo=al.BEIJING)
    return {"title": title, "last_run_at": ts.astimezone(datetime.timezone.utc).isoformat(),
            "last_run_status": status, "status": "active"}


def make_results(entries):
    """entries: [(客户端目录, 最新日期)] → 临时 results 目录。"""
    d = tempfile.mkdtemp(prefix="landing-")
    for client, day in entries:
        os.makedirs(os.path.join(d, client, "%s-1.2.3.4" % day, "Windows"), exist_ok=True)
    return d


class RoutineFilterTest(unittest.TestCase):
    def test_oneshot_and_stale_excluded(self):
        aps = [ap("每日测试-testbot1-Linux-Hermes"),
               ap("每日测试重发-testbot1-Linux-Hermes"),          # 一次性
               ap("每日测试-officeace最后收尾"),                    # 一次性
               ap("每日测试-testbot9-Linux-Hermes", days_ago=30)]  # 停滞
        got = [a["title"] for a in al.routine_autopilots(aps)]
        self.assertEqual(got, ["每日测试-testbot1-Linux-Hermes"])

    def test_non_fleet_excluded(self):
        self.assertEqual(al.routine_autopilots([ap("别的任务-testbot1-Hermes")]), [])


class LatestPkgTest(unittest.TestCase):
    def test_picks_latest_date_and_dir(self):
        d = make_results([("Hermes", "2026-11-01"), ("Hermes", "2026-11-03"), ("OpenCode", "2026-10-30")])
        day, dirname = al.latest_pkg("Hermes", d)
        self.assertEqual(str(day), "2026-11-03")
        self.assertEqual(dirname, "Hermes")
        self.assertEqual(al.latest_pkg("（未识别）", d), (None, None))
        self.assertEqual(al.latest_pkg("Nope", d), (None, None))


class BuildRowsTest(unittest.TestCase):
    def test_completed_but_missing_artifact_is_not_landed(self):
        """回归：completed + 产物滞后 → NOT_LANDED（「假完成」）。"""
        d = make_results([("OfficeAce", (TODAY - datetime.timedelta(days=2)).isoformat())])
        rows = al.build_rows([ap("每日测试-testbot4-win-officeace", days_ago=0, status="completed")], d)
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["verdict"], "NOT_LANDED")
        self.assertEqual(rows[0]["lag"], 2)
        self.assertEqual(rows[0]["task_status"], "completed")

    def test_fresh_artifact_is_landed(self):
        d = make_results([("Hermes", (TODAY - datetime.timedelta(days=1)).isoformat())])
        rows = al.build_rows([ap("每日测试-testbot1-Linux-Hermes")], d)
        self.assertEqual(rows[0]["verdict"], "LANDED")
        self.assertEqual(rows[0]["lag"], 1)


class RenderTest(unittest.TestCase):
    def test_marks_fake_completion_distinctly(self):
        d = make_results([("OfficeAce", (TODAY - datetime.timedelta(days=5)).isoformat())])
        rows = al.build_rows([ap("每日测试-testbot4-win-officeace", days_ago=0, status="completed")], d)
        md = al.render_report(rows, TODAY.isoformat())
        self.assertIn("隐性假完成", md)
        self.assertIn("未落地", md)

    def test_healthy_report_says_none(self):
        d = make_results([("Hermes", (TODAY - datetime.timedelta(days=1)).isoformat())])
        rows = al.build_rows([ap("每日测试-testbot1-Linux-Hermes")], d)
        md = al.render_report(rows, TODAY.isoformat())
        self.assertIn("未发现", md)


if __name__ == "__main__":
    unittest.main()
