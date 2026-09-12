#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""一次性初始化 agent 机器：设 HDK_GH_TOKEN + clone 测试仓库/源码 + 装 next 包 + 验证环境。

用法（在每台 agent 机器跑一次）:
    python init_agent.py --token <fine-grained-token>    # 脚本化（token 会进命令行历史）
    python init_agent.py                                  # 交互输入（推荐，token 不回显）

fine-grained token 要求：只授权 huaweicloud-mate/huaweicloud-devkit-test 的 Contents: Read/Write。
"""
import os, sys, subprocess, getpass

WORK = os.environ.get("HDK_WORKDIR") or os.path.join(os.path.expanduser("~"), "devkit-test")
REPO = os.path.join(WORK, "huaweicloud-devkit-test")
SRC = os.path.join(WORK, "hdk")
TEST_REPO_URL = "https://github.com/huaweicloud-mate/huaweicloud-devkit-test.git"
SRC_URL = "https://github.com/huaweicloud/huaweicloud-devkit.git"


def run(cmd, cwd=None):
    r = subprocess.run(cmd, capture_output=True, text=True, shell=True, cwd=cwd)
    return r.returncode, (r.stdout or "").strip(), (r.stderr or "").strip()


def main():
    # 1. token：--token 参数 > 环境变量 > 交互输入
    token = None
    if "--token" in sys.argv:
        i = sys.argv.index("--token")
        token = sys.argv[i + 1] if i + 1 < len(sys.argv) else None
    token = token or os.environ.get("HDK_GH_TOKEN")
    if not token:
        token = getpass.getpass("请输入 fine-grained token（不回显）: ").strip()
    if not token:
        print("未提供 token，退出。")
        sys.exit(2)
    os.environ["HDK_GH_TOKEN"] = token
    os.environ["GH_TOKEN"] = token
    clone_cmd = 'git -c credential.helper="!gh auth git-credential" clone'

    # 2. clone 测试仓库 + 源码仓库
    os.makedirs(WORK, exist_ok=True)
    if os.path.isdir(os.path.join(REPO, ".git")):
        print("[已存在] 测试仓库:", REPO)
    else:
        rc, out, err = run(f'{clone_cmd} {TEST_REPO_URL} {REPO}')
        print("[clone 测试仓库]", "OK" if rc == 0 else f"失败 {(out or err)[:200]}")

    if os.path.isdir(os.path.join(SRC, ".git")):
        print("[已存在] 源码仓库:", SRC)
    else:
        rc, out, err = run(f'{clone_cmd} {SRC_URL} {SRC}')
        print("[clone 源码]", "OK" if rc == 0 else f"失败 {(out or err)[:200]}")

    # 3. 安装被测 next 包
    rc, out, err = run("npm install -g huaweicloud-devkit@next")
    print("[安装 next 包]", "OK" if rc == 0 else f"失败 {(out or err)[:200]}")

    # 4. 验证环境
    if os.path.isdir(REPO):
        rc, out, err = run("python scripts/prepare_env.py", cwd=REPO)
        print("[环境检查]", "就绪" if rc == 0 else "请按输出补齐缺失项")
    else:
        print("[环境检查] 测试仓库 clone 失败，跳过")

    # 5. 持久化提示
    print("\n=== 请持久化 token 到环境变量（否则重启会话会丢） ===")
    print('  Windows:  setx HDK_GH_TOKEN "%s"' % token)
    print('  Linux:    echo \'export HDK_GH_TOKEN="%s"\' >> ~/.bashrc && source ~/.bashrc' % token)
    print("\n初始化完成。之后每天只需说「读 AGENTS.md 执行测试」即可。")


if __name__ == "__main__":
    main()