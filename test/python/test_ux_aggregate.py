# -*- coding: utf-8 -*-
"""ux_aggregate_3samples 契约单测（标准库 unittest，无第三方依赖）。

覆盖：文件名解析 / 中位取值 / 判定口径（含 tokens 不作硬性不劣化项）/ 端到端落盘 / 缺数据退出码。

运行任一：
    python -m unittest discover -s test/python -p 'test_*.py'
    python -m unittest test.python.test_ux_aggregate
"""
import contextlib
import io
import json
import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), os.pardir, os.pardir, "scripts"))

from ux_aggregate_3samples import (  # noqa: E402
    METRIC_KEYS,
    judge,
    load_runs,
    main,
    medians,
)

SUM = dict(zip(METRIC_KEYS, (10, 100000, 0, 5)))


def _summary(steps, tokens, fails, clarifications):
    return {"steps": steps, "tokens": tokens, "fails": fails,
            "clarifications": clarifications, "cases": 10}


def write_run(directory, version, round_no, **kw):
    values = dict(SUM, **kw)
    path = os.path.join(directory, f"ux-loop-{version}-r{round_no}.json")
    with open(path, "w", encoding="utf-8") as fh:
        json.dump({"summary": _summary(**values)}, fh)
    return path


class TestLoadRuns(unittest.TestCase):
    def test_parses_version_and_round_from_filename(self):
        with tempfile.TemporaryDirectory() as d:
            write_run(d, "1.1.8-next.3", 1)
            write_run(d, "1.1.8", 2)
            with open(os.path.join(d, "ux-loop-1.1.8.json"), "w", encoding="utf-8") as fh:
                json.dump({"summary": _summary(**SUM)}, fh)      # 无轮次后缀 -> 忽略
            with open(os.path.join(d, "notes.json"), "w", encoding="utf-8") as fh:
                json.dump({}, fh)                               # 非采样文件 -> 忽略

            runs = load_runs(d)

        self.assertEqual(sorted(runs), ["1.1.8", "1.1.8-next.3"])
        self.assertEqual(runs["1.1.8-next.3"][1]["steps"], 10)
        self.assertEqual(runs["1.1.8"][2]["steps"], 10)


class TestMedians(unittest.TestCase):
    def test_median_not_mean(self):
        runs = {"v": {1: _summary(10, 1, 0, 0), 2: _summary(12, 1, 0, 0), 3: _summary(11, 1, 0, 0)}}
        self.assertEqual(medians(runs, "v")["steps"], 11)

    def test_median_of_even_count(self):
        runs = {"v": {1: _summary(10, 1, 0, 0), 2: _summary(12, 1, 0, 0)}}
        self.assertEqual(medians(runs, "v")["steps"], 11)


class TestJudge(unittest.TestCase):
    def test_met_when_better_and_nothing_worse(self):
        base = dict(zip(METRIC_KEYS, (10, 100000, 0, 5)))
        cur = dict(zip(METRIC_KEYS, (8, 90000, 0, 5)))
        verdicts, verdict = judge(base, cur)
        self.assertEqual(verdict, "MET")
        self.assertEqual(verdicts["steps"], "改善")
        self.assertEqual(verdicts["tokens"], "改善")
        self.assertEqual(verdicts["clarifications"], "持平")

    def test_not_met_when_clarifications_worse(self):
        base = dict(zip(METRIC_KEYS, (10, 100000, 0, 5)))
        cur = dict(zip(METRIC_KEYS, (9, 95000, 0, 7)))
        verdicts, verdict = judge(base, cur)
        self.assertEqual(verdict, "NOT_MET")
        self.assertEqual(verdicts["clarifications"], "劣化")

    def test_not_met_when_nothing_improves(self):
        same = dict(zip(METRIC_KEYS, (10, 100000, 0, 5)))
        verdicts, verdict = judge(same, dict(same))
        self.assertEqual(verdict, "NOT_MET")
        self.assertEqual(set(verdicts.values()), {"持平"})

    def test_tokens_worse_is_not_a_hard_failure(self):
        """tokens 属成本项：其劣化不和 steps/fails/clarifications 一样作硬性阻断（与文档 §五 口径一致）。"""
        base = dict(zip(METRIC_KEYS, (10, 100000, 0, 5)))
        cur = dict(zip(METRIC_KEYS, (8, 130000, 0, 5)))
        verdicts, verdict = judge(base, cur)
        self.assertEqual(verdicts["tokens"], "劣化")
        self.assertEqual(verdict, "MET")


class TestMain(unittest.TestCase):
    def test_end_to_end_writes_medians_and_returns_zero(self):
        with tempfile.TemporaryDirectory() as d:
            for r, steps in ((1, 10), (2, 12), (3, 11)):
                write_run(d, "base", r, steps=steps)
                write_run(d, "cur", r, steps=7)
            with contextlib.redirect_stdout(io.StringIO()) as buf:
                code = main(["--dir", d])
            with open(os.path.join(d, "ux-loop-3samples-medians.json"), encoding="utf-8") as fh:
                out = json.load(fh)

        self.assertEqual(code, 0)
        self.assertEqual(out["verdict"], "MET")
        self.assertEqual(out["samples"], {"base": 3, "cur": 3})
        self.assertEqual(out["medians"]["base"]["steps"], 11)
        self.assertIn("判定: MET", buf.getvalue())

    def test_explicit_baseline_and_current_flip_direction(self):
        with tempfile.TemporaryDirectory() as d:
            write_run(d, "old", 1, steps=10)
            write_run(d, "new", 1, steps=8)
            with contextlib.redirect_stdout(io.StringIO()):
                main(["--dir", d, "--baseline", "new", "--current", "old"])
            with open(os.path.join(d, "ux-loop-3samples-medians.json"), encoding="utf-8") as fh:
                out = json.load(fh)

        self.assertEqual((out["baseline"], out["current"]), ("new", "old"))
        self.assertEqual(out["verdicts"]["steps"], "劣化")

    def test_returns_two_when_insufficient_versions(self):
        with tempfile.TemporaryDirectory() as d:
            write_run(d, "only", 1)
            with contextlib.redirect_stderr(io.StringIO()) as err:
                code = main(["--dir", d])

        self.assertEqual(code, 2)
        self.assertIn("至少 2 个版本", err.getvalue())


if __name__ == "__main__":
    unittest.main()
