#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""评审角色中性化迁移：Hermes-Codex -> Hermes-OpenCode（评审者 CLI 可替换）

幂等：可反复执行，已迁移的文件不会二次改写。
用法：python scripts/migrate_reviewer_role.py [--dry]

改动范围（只改「评审者」语境，不动「被测客户端」语境里的 Codex）：
  1) docs/ 闭环规范、README、测试体系总览 —— 文件名引用 + 角色名
  2) templates/ 交接状态模板
  3) 状态机 CODEX_REVIEWING -> REVIEWER_REVIEWING；产物目录 codex/ -> reviewer/

不动的：results/**（历史归档只增不改）、技能里 codex 作为被测客户端的段落。
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DRY = "--dry" in sys.argv

# 受保护行：Codex 在此处是「被测客户端」而非「评审者」，禁止替换
PROTECT_PATTERNS = [
    re.compile(r"Agent/宿主端\s*\|"),                    # 终端维度表：Hermes/Codex/OpenCode/...
    re.compile(r"Hermes、Codex、OpenCode"),
    re.compile(r"Hermes/Codex/OpenCode"),
]

TARGETS = [
    "docs/06-Hermes-OpenCode测试设计评审闭环.md",
    "README.md",
    "docs/测试体系全貌与测试策略.md",
    "templates/hermes-codex-test-design-status.md",
]

# 顺序敏感：先处理多词短语，再处理单词
RULES = [
    ("Hermes-Codex 测试设计评审闭环", "Hermes-OpenCode 测试设计评审闭环"),
    ("Hermes-Codex", "Hermes-OpenCode"),
    ("hermes-codex-test-design-status", "hermes-codex-test-design-status"),  # 模板文件名保留，仅内容改
    ("CODEX_REVIEWING", "REVIEWER_REVIEWING"),
    ("`codex/`", "`reviewer/`"),
    ("codex/review-round", "reviewer/review-round"),
    ("reviews/<iter>/codex/", "reviews/<iter>/reviewer/"),
    ("codex/review-round-NN", "reviewer/review-round-NN"),
    ("codex/opencode-run", "reviewer/opencode-run"),
    ("codex/prompt-round", "reviewer/prompt-round"),
]


def convert_line(line: str) -> str:
    if any(p.search(line) for p in PROTECT_PATTERNS):
        # 保护行里只允许做状态/目录替换，不做 Codex->OpenCode
        for old, new in RULES:
            if "Codex" in old:
                continue
            line = line.replace(old, new)
        return line
    for old, new in RULES:
        line = line.replace(old, new)
    line = line.replace("codex/", "reviewer/")  # 兜底：评审产物目录中性化
    line = line.replace("Codex", "OpenCode")
    return line


def main() -> int:
    changed = []
    for rel in TARGETS:
        p = ROOT / rel
        if not p.exists():
            print(f"[skip] 不存在 {rel}")
            continue
        raw = p.read_bytes()
        text = raw.decode("utf-8")
        new_lines = [convert_line(ln) for ln in text.splitlines(keepends=True)]
        new_text = "".join(new_lines)
        if new_text == text:
            print(f"[same] {rel}")
            continue
        if not DRY:
            p.write_bytes(new_text.encode("utf-8"))
        changed.append(rel)
        print(f"[{'dry' if DRY else 'done'}] {rel}")
    print(f"\n共 {len(changed)} 个文件{'将' if DRY else '已'}改写")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())