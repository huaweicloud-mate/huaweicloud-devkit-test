# -*- coding: utf-8 -*-
"""refresh-dashboard 工作流推送竞态修复的契约单测（标准库 unittest）。

覆盖 Issue #31：`Commit & push dashboard` step 在 main 被并发更新时
应自动 `git pull --rebase` 后重试 push（≤2 次重试），而非直接失败。

测试策略：从 `.github/workflows/refresh-dashboard.yml` 提取该 step 的
`run:` 脚本原文，在本地裸仓库（模拟 origin/main）+ 双克隆（work/racer）
沙箱中真实执行，用 PATH 上的 git 包装器在 push 瞬间注入「远端被其他
提交更新」的竞态，验证各分支行为。

运行：
    python -m unittest discover -s test/python -p 'test_*.py'
"""
import os
import re
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
WORKFLOW = REPO_ROOT / ".github" / "workflows" / "refresh-dashboard.yml"
STEP_NAME = "Commit & push dashboard"


def _fix_applied() -> bool:
    """workflow 是否已应用 #31 修复（rebase + retry 标记同时存在）。"""
    text = WORKFLOW.read_text(encoding="utf-8")
    return "git pull --rebase origin main" in text and "for attempt in 1 2 3" in text


FIX_APPLIED = _fix_applied()
SKIP_REASON = (
    "#31 workflow 修复尚未应用：.github/workflows/refresh-dashboard.yml 仍为旧版"
    "（推送 workflow 文件需带 workflow scope 的凭据，bot token 缺该 scope，"
    "修复以 docs/issue-31/workflow-fix.patch 随本 PR 交付）。"
    "应用补丁后本组用例自动激活。"
)

BASELINE_HTML = "<html><body>dashboard baseline</body></html>\n"

WRAPPER = """\
#!/bin/bash
# git push 竞态模拟包装器：在 push 前让 racer 向远端推进 n 次（模拟 main 被其他提交更新）
if [ "$1" = "push" ] && [ -n "${RACE_BEFORE_PUSH:-}" ]; then
  n=$(cat "$WRAP_DIR/push_count" 2>/dev/null || echo 0)
  n=$((n + 1))
  echo "$n" > "$WRAP_DIR/push_count"
  if [ "$RACE_BEFORE_PUSH" = "always" ] || [ "$n" -le "$RACE_BEFORE_PUSH" ]; then
    "$REAL_GIT" -C "$RACER_DIR" commit --allow-empty -q -m "race-commit-$n"
    "$REAL_GIT" -C "$RACER_DIR" push -q origin HEAD:main
  fi
fi
exec "$REAL_GIT" "$@"
"""


def extract_step_script():
    """从 workflow YAML 提取指定 step 的 run: 脚本（按缩进去块）。"""
    lines = WORKFLOW.read_text(encoding="utf-8").splitlines()
    step_idx = None
    for i, line in enumerate(lines):
        if line.strip() == f"- name: {STEP_NAME}":
            step_idx = i
            break
    if step_idx is None:
        raise AssertionError(f"workflow 中未找到 step「{STEP_NAME}」")

    run_idx = None
    indent = 0
    for j in range(step_idx + 1, len(lines)):
        s = lines[j]
        if re.match(r"^\s+run: \|$", s):
            run_idx = j
            indent = len(s) - len(s.lstrip())
            break
        if s.strip() and (len(s) - len(s.lstrip())) <= (len(lines[step_idx]) - len(lines[step_idx].lstrip())):
            break  # 已进入下一个 step
    if run_idx is None:
        raise AssertionError(f"step「{STEP_NAME}」缺少 run: | 块")

    body_indent = indent + 2
    script_lines = []
    for line in lines[run_idx + 1:]:
        if not line.strip():
            script_lines.append("")
            continue
        if not line.startswith(" " * body_indent):
            break
        script_lines.append(line[body_indent:])
    while script_lines and not script_lines[-1].strip():
        script_lines.pop()
    return "\n".join(script_lines) + "\n"


class Playground:
    """本地 git 沙箱：bare origin + work 克隆 + racer 克隆（模拟并发提交者）。"""

    def __init__(self, root: Path):
        self.root = root
        self.origin = root / "origin.git"
        self.work = root / "work"
        self.racer = root / "racer"
        self.wrap = root / "wrap"
        self.real_git = shutil.which("git") or "git"

        self._run(["git", "init", "--bare", "-b", "main", str(self.origin)])
        self._run(["git", "clone", str(self.origin), str(self.work)])
        self._git(self.work, "config", "user.name", "ci-test")
        self._git(self.work, "config", "user.email", "ci-test@example.com")
        (self.work / "dashboard.html").write_text(BASELINE_HTML, encoding="utf-8")
        self._git(self.work, "add", "dashboard.html")
        self._git(self.work, "commit", "-m", "baseline dashboard")
        self._git(self.work, "push", "-q", "-u", "origin", "HEAD:main")

        self._run(["git", "clone", "-q", str(self.origin), str(self.racer)])
        self._git(self.racer, "config", "user.name", "racer")
        self._git(self.racer, "config", "user.email", "racer@example.com")

        self.wrap.mkdir()
        wrapper = self.wrap / "git"
        wrapper.write_text(WRAPPER, encoding="utf-8")
        wrapper.chmod(0o755)
        self.baseline_rev = self.origin_main()

    # ---- 基础操作 ----
    def _run(self, cmd):
        p = subprocess.run(cmd, capture_output=True, text=True, errors="replace")
        if p.returncode != 0:
            raise AssertionError(f"命令失败 {cmd}: {p.stderr}")
        return p

    def _git(self, cwd, *args):
        return self._run(["git", "-C", str(cwd), *args])

    def origin_main(self):
        p = self._run(["git", "--git-dir", str(self.origin), "rev-parse", "main"])
        return p.stdout.strip()

    def origin_count(self):
        p = self._run(["git", "--git-dir", str(self.origin), "rev-list", "--count", "main"])
        return int(p.stdout.strip())

    def origin_top_subject(self):
        p = self._run(["git", "--git-dir", str(self.origin), "log", "-1", "--format=%s"])
        return p.stdout.strip()

    def race_remote(self, msg):
        """让 racer 直接向远端推进一个提交（push 前已发生的远端更新）。"""
        self._git(self.racer, "commit", "--allow-empty", "-m", msg)
        self._git(self.racer, "push", "-q", "origin", "HEAD:main")

    def run_step(self, race_before_push=None, step_path=None):
        """执行被测 step 脚本；race_before_push=N 表示前 N 次 push 前注入竞态。"""
        step = step_path or (self.root / "step.sh")
        if not step.exists():
            step.write_text(extract_step_script(), encoding="utf-8")
        env = dict(os.environ)
        if race_before_push is not None:
            env["PATH"] = f"{self.wrap}{os.pathsep}{env.get('PATH', '')}"
            env["REAL_GIT"] = self.real_git
            env["RACER_DIR"] = str(self.racer)
            env["WRAP_DIR"] = str(self.wrap)
            env["RACE_BEFORE_PUSH"] = str(race_before_push)
        p = subprocess.run(
            ["bash", "-e", str(step)], cwd=str(self.work),
            capture_output=True, text=True, errors="replace", env=env,
        )
        return p.returncode, p.stdout + "\n" + p.stderr, self.push_count()

    def push_count(self):
        f = self.wrap / "push_count"
        return int(f.read_text().strip()) if f.exists() else 0


@unittest.skipUnless(FIX_APPLIED, SKIP_REASON)
class WorkflowStructureTest(unittest.TestCase):
    """静态结构契约：step 脚本内容与 workflow 触发/并发配置。"""

    def setUp(self):
        self.yaml_text = WORKFLOW.read_text(encoding="utf-8")
        self.script = extract_step_script()

    def test_script_syntax_valid(self):
        p = subprocess.run(["bash", "-n", "/dev/stdin"], input=self.script,
                           capture_output=True, text=True)
        self.assertEqual(p.returncode, 0, f"step 脚本语法错误: {p.stderr}")

    def test_pull_rebase_before_push(self):
        self.assertIn("git pull --rebase origin main", self.script)
        self.assertIn("git push origin HEAD:main", self.script)
        self.assertLess(
            self.script.index("git pull --rebase origin main"),
            self.script.index("git push origin HEAD:main"),
            "pull --rebase 必须出现在首次 push 之前",
        )

    def test_retry_at_most_2(self):
        self.assertIn("for attempt in 1 2 3", self.script,
                      "重试循环必须为 3 次尝试（首推 + ≤2 次重试）")

    def test_rebase_conflict_fails_loudly(self):
        self.assertIn("::error::rebase 失败", self.script,
                      "rebase 冲突必须以明确 ::error:: 信息失败")

    def test_no_change_still_skips_commit(self):
        self.assertIn("dashboard 无变动，跳过提交", self.script)

    def test_triggers_and_concurrency_unchanged(self):
        for needle in ("workflow_dispatch:", "schedule:", "workflow_run:",
                       "group: refresh-dashboard", "cancel-in-progress: false"):
            self.assertIn(needle, self.yaml_text, f"workflow 配置缺失: {needle}")


@unittest.skipUnless(FIX_APPLIED, SKIP_REASON)
class StepBehaviorTest(unittest.TestCase):
    """行为契约：真实 git 沙箱中执行 step 脚本。"""

    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.pg = Playground(Path(self._tmp.name))
        self.addCleanup(self._tmp.cleanup)

    def _modify_dashboard(self, content):
        (self.pg.work / "dashboard.html").write_text(content, encoding="utf-8")

    def test_no_change_skips_commit_and_push(self):
        rc, out, pushes = self.pg.run_step()
        self.assertEqual(rc, 0, out)
        self.assertIn("dashboard 无变动，跳过提交", out)
        self.assertEqual(pushes, 0)
        self.assertEqual(self.pg.origin_main(), self.pg.baseline_rev, "无变动时不得推进远端")

    def test_push_success_first_attempt(self):
        self._modify_dashboard("<html><body>v2</body></html>\n")
        rc, out, pushes = self.pg.run_step()
        self.assertEqual(rc, 0, out)
        self.assertIn("push 成功（第 1 次尝试）", out)
        self.assertNotIn("push 失败", out)
        self.assertEqual(self.pg.origin_count(), 2)
        self.assertTrue(self.pg.origin_top_subject().startswith("chore: 自动刷新看板"))

    def test_remote_advanced_before_push_rebases_then_succeeds(self):
        # checkout 后、push 前，远端 main 已被其他提交推进
        self.pg.race_remote("remote-change-before-push")
        self._modify_dashboard("<html><body>v2</body></html>\n")
        rc, out, _ = self.pg.run_step()
        self.assertEqual(rc, 0, out)
        self.assertIn("push 成功（第 1 次尝试）", out)
        self.assertEqual(self.pg.origin_count(), 3)
        # 看板提交必须 rebase 到远端新提交之上（顶端为看板提交）
        self.assertTrue(self.pg.origin_top_subject().startswith("chore: 自动刷新看板"))

    def test_push_rejected_once_retries_and_succeeds(self):
        # 第 1 次 push 瞬间远端被推进（非 fast-forward 被拒），rebase 后第 2 次成功
        self._modify_dashboard("<html><body>v2</body></html>\n")
        rc, out, pushes = self.pg.run_step(race_before_push=1)
        self.assertEqual(rc, 0, out)
        self.assertIn("push 失败（第 1 次尝试）", out)
        self.assertIn("push 成功（第 2 次尝试）", out)
        self.assertEqual(pushes, 2)
        self.assertEqual(self.pg.origin_count(), 3)

    def test_push_rejected_twice_succeeds_third_attempt(self):
        self._modify_dashboard("<html><body>v2</body></html>\n")
        rc, out, pushes = self.pg.run_step(race_before_push=2)
        self.assertEqual(rc, 0, out)
        self.assertIn("push 失败（第 1 次尝试）", out)
        self.assertIn("push 失败（第 2 次尝试）", out)
        self.assertIn("push 成功（第 3 次尝试）", out)
        self.assertEqual(pushes, 3)
        self.assertEqual(self.pg.origin_count(), 4)

    def test_push_rejected_beyond_retry_limit_fails_with_error(self):
        # 远端持续推进（每次 push 前都被推进）→ 3 次尝试耗尽后明确失败
        self._modify_dashboard("<html><body>v2</body></html>\n")
        rc, out, pushes = self.pg.run_step(race_before_push="always")
        self.assertEqual(rc, 1, out)
        self.assertIn("push 失败（第 1 次尝试）", out)
        self.assertIn("push 失败（第 2 次尝试）", out)
        self.assertIn("::error::git push 连续 3 次被拒", out)
        self.assertEqual(pushes, 3, "重试必须封顶：首推 + ≤2 次重试 = 3 次尝试")

    def test_rebase_conflict_fails_with_clear_error(self):
        # racer 与本端对 dashboard.html 做出冲突修改 → pull --rebase 冲突 → 明确报错
        (self.pg.racer / "dashboard.html").write_text(
            "<html><body>racer-version</body></html>\n", encoding="utf-8")
        self.pg._git(self.pg.racer, "add", "dashboard.html")
        self.pg._git(self.pg.racer, "commit", "-m", "racer conflicting change")
        self.pg._git(self.pg.racer, "push", "-q", "origin", "HEAD:main")
        self._modify_dashboard("<html><body>work-version</body></html>\n")
        rc, out, _ = self.pg.run_step()
        self.assertEqual(rc, 1, out)
        self.assertIn("::error::rebase 失败：dashboard 与远端 main 冲突，需人工介入解决", out)
        # 远端保持 racer 的提交，未被半成品覆盖
        self.assertEqual(self.pg.origin_top_subject(), "racer conflicting change")


if __name__ == "__main__":
    unittest.main()
