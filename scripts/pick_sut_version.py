# -*- coding: utf-8 -*-
"""选定「今日被测包」版本号并打印（供 CI 复用，避免取版规则出现第二份真源）。

规则与 `scripts/prepare_env.py::resolve_target()` 完全一致：
    --next 强制预发布 > --latest 强制正式 > 默认取 latest/next 中**版本号更高者**，
    其中 `_version_key()` 使**正式版 > 同 base 的预发布版**（1.1.8 > 1.1.8-next.3）。

用法:
    python scripts/pick_sut_version.py            # 打印版本号（如 1.1.8）
    python scripts/pick_sut_version.py --latest    # 强制 latest
    python scripts/pick_sut_version.py --next      # 强制 next

退出码: 0 成功 / 1 两次 npm view 都取不到版本（网络或包名问题）。
"""
import subprocess
import sys
import os
import shutil

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from prepare_env import _version_key  # noqa: E402  （唯一真源：每日测试同一条取版规则）

REGISTRY = "https://registry.npmjs.org"


def _npm():
    """Windows 上 npm 实为 npm.cmd，subprocess 不解析 PATHEXT，需显式解析。"""
    for cand in ("npm", "npm.cmd", "npm.exe"):
        p = shutil.which(cand)
        if p:
            return p
    return "npm"


def view(spec):
    r = subprocess.run(
        [_npm(), "view", spec, "version", "--registry", REGISTRY],
        capture_output=True, text=True,
    )
    return r.stdout.strip() if r.returncode == 0 else ""


def main():
    if "--next" in sys.argv:
        v = view("huaweicloud-devkit@next")
        if v:
            print(v)
            return 0
        print("[错误] 无法获取 next 版本", file=sys.stderr)
        return 1
    if "--latest" in sys.argv:
        v = view("huaweicloud-devkit")
        if v:
            print(v)
            return 0
        print("[错误] 无法获取 latest 版本", file=sys.stderr)
        return 1

    latest = view("huaweicloud-devkit")
    nxt = view("huaweicloud-devkit@next")
    if nxt and _version_key(nxt) > _version_key(latest):
        print(nxt)
    elif latest:
        print(latest)
    elif nxt:
        print(nxt)
    else:
        print("[错误] latest / next 均取不到版本", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
