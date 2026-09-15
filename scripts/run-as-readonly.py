#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""用只读 IAM 子账号凭证执行命令（HW_ACCESS_KEY/HW_SECRET_KEY env 注入，不带 token）。

用途：D4-13「最小权限凭证通过率」。默认凭证是管理员（~/.config/huaweicloud/credentials.json），
需要验证「只读凭证下写被拒」时，用本脚本临时切只读子账号（不碰 credentials.json，纯 env 覆盖）。

机制：huaweicloud-devkit `resolveCredentials` 默认读 HW_ACCESS_KEY/HW_SECRET_KEY env；
仅当 env 提供 AK+SK+Token「完整三元组」且文件有凭证时才让文件优先（credentials.mjs:165-172）。
只读子账号是长期凭证（无 token），故 env 注入的只读 AK/SK 会覆盖文件里的管理员 → 动态切换。

用法:
    python scripts/run-as-readonly.py <命令...>
    例: python scripts/run-as-readonly.py node evidence/D4-13/probe.mjs

凭证来源: ~/.config/huaweicloud/credentials.readonly.json（只读 IAM 子账号，不提交仓库）
"""
import json
import os
import subprocess
import sys


def main():
    if len(sys.argv) < 2:
        print(__doc__.strip())
        sys.exit(2)
    p = os.path.expanduser("~/.config/huaweicloud/credentials.readonly.json")
    if not os.path.isfile(p):
        print(f"[FAIL] 只读子账号凭证不存在: {p}（需先配置 credentials.readonly.json）")
        sys.exit(1)
    d = json.load(open(p, encoding="utf-8"))
    env = dict(os.environ)
    env["HW_ACCESS_KEY"] = d["ak"]
    env["HW_SECRET_KEY"] = d["sk"]
    # 关键：不设 HW_SECURITY_TOKEN（pop 掉可能残留的 token），确保 env 优先而非文件优先
    env.pop("HW_SECURITY_TOKEN", None)
    if d.get("region"):
        env.setdefault("HW_REGION", d["region"])
    sys.exit(subprocess.run(sys.argv[1:], env=env).returncode)


if __name__ == "__main__":
    main()