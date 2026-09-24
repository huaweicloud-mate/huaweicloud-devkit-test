#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""一次性初始化 agent 机器：设 HDK_GH_TOKEN + 在专属目录 clone 两个仓库 + 装 next 包 + 验证。

用法:
    python init_agent.py <客户端> [--token <fine-grained-token>]
    python init_agent.py OpenCode              # 交互输入 token（推荐，不回显）

每个客户端一个专属工作目录 ~/devkit-test/<客户端>/（含测试仓库 + 源码仓库），
避免本机多个 agent 共用同一仓库出现冲突。可用 HDK_WORKDIR 覆盖根目录。

镜像 fallback：GitHub clone 失败时，自动 fallback 到 GitCode 镜像（国内拉取更快）；
clone 成功后 origin 仍是 GitHub，push 结果仍回官方仓。
"""
import os, sys, subprocess, getpass

CLIENTS = ["OpenCode", "Codex", "CodeArtsAgent", "CodeArtsSpace", "WorkBuddy",
           "DSH", "OfficeAce", "Hermes", "OpenClaw", "AtomCode"]
TEST_REPO_URL = "https://github.com/huaweicloud-mate/huaweicloud-devkit-test.git"
SRC_URL = "https://github.com/huaweicloud/huaweicloud-devkit.git"
# GitHub clone 失败时 fallback 到 GitCode 镜像（源码仓库已有独立同步工作流，不在此 fallback）
GITCODE_MIRROR = {
    TEST_REPO_URL: "https://gitcode.com/hd-vector/huaweicloud-devkit-test.git",
}


def run(cmd, cwd=None):
    r = subprocess.run(cmd, capture_output=True, text=True, shell=True, cwd=cwd)
    return r.returncode, (r.stdout or "").strip(), (r.stderr or "").strip()


def gitcode_token():
    t = os.environ.get("GITCODE_TOKEN")
    if t:
        return t.strip()
    p = os.path.expanduser("~/.gitcode_token")
    if os.path.isfile(p):
        t = open(p).read().strip()
        if t:
            return t
    return ""


def auth_url(url):
    """把 GitHub URL 转成带 token 的认证 URL（不依赖 gh CLI）。"""
    t = os.environ.get("HDK_GH_TOKEN") or os.environ.get("GH_TOKEN")
    if t and url.startswith("https://github.com/"):
        return url.replace("https://github.com/", f"https://x-access-token:{t}@github.com/")
    return url


def clone_with_fallback(url, dest, name, clone_cmd):
    """先 GitHub clone，失败 fallback 到 GitCode 镜像；成功后 origin 统一指回 GitHub。"""
    rc, out, err = run(f'{clone_cmd} {auth_url(url)} {dest}')
    if rc == 0:
        print(f"[clone {name}] OK (GitHub)")
        return True
    mirror = GITCODE_MIRROR.get(url)
    gc = gitcode_token()
    if mirror and gc:
        auth_mirror = mirror.replace("https://", f"https://oauth2:{gc}@")
        rc2, out2, err2 = run(f'git clone {auth_mirror} {dest}')
        if rc2 == 0:
            run(f'git remote set-url origin {url}', cwd=dest)  # 后续 pull/push 仍走 GitHub
            print(f"[clone {name}] OK (GitCode 镜像 fallback)")
            return True
        print(f"[clone {name}] GitHub+镜像都失败: {(out2 or err2)[:150]}")
        return False
    print(f"[clone {name}] GitHub 失败（无镜像或无 GITCODE_TOKEN）: {(out or err)[:150]}")
    return False


def main():
    # 1. 客户端（专属目录名）
    client = sys.argv[1] if len(sys.argv) > 1 else None
    if client not in CLIENTS:
        print("用法: python init_agent.py <客户端> [--token <token>]")
        print("客户端:", ", ".join(CLIENTS))
        sys.exit(2)

    # 2. token：--token 参数 > 环境变量 > 交互输入
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

    # 3. 专属工作目录 ~/devkit-test/<客户端>/
    root = os.environ.get("HDK_WORKDIR") or os.path.join(os.path.expanduser("~"), "devkit-test")
    WORK = os.path.join(root, client)
    REPO = os.path.join(WORK, "huaweicloud-devkit-test")
    SRC = os.path.join(WORK, "hdk")
    clone_cmd = 'git clone'

    print(f"工作目录: {WORK}")

    # 4. clone 测试仓库 + 源码仓库（带 GitCode 镜像 fallback）
    os.makedirs(WORK, exist_ok=True)
    if os.path.isdir(os.path.join(REPO, ".git")):
        print("[已存在] 测试仓库:", REPO)
    else:
        clone_with_fallback(TEST_REPO_URL, REPO, "测试仓库", clone_cmd)

    if os.path.isdir(os.path.join(SRC, ".git")):
        print("[已存在] 源码仓库:", SRC)
    else:
        rc, out, err = run(f'{clone_cmd} {auth_url(SRC_URL)} {SRC}')
        print("[clone 源码]", "OK" if rc == 0 else f"失败 {(out or err)[:200]}")

    # 5. 安装被测 next 包（全局，与目录无关）
    rc, out, err = run("npm install -g huaweicloud-devkit@next")
    print("[安装 next 包]", "OK" if rc == 0 else f"失败 {(out or err)[:200]}")

    # 6. 验证环境
    if os.path.isdir(REPO):
        rc, out, err = run("python scripts/prepare_env.py", cwd=REPO)
        print("[环境检查]", "就绪" if rc == 0 else "请按输出补齐缺失项")
    else:
        print("[环境检查] 测试仓库 clone 失败，跳过")

    # 7. 持久化提示
    print("\n=== 请持久化 token 到环境变量（否则重启会话会丢） ===")
    print('  Windows:  setx HDK_GH_TOKEN "%s"' % token)
    print('  Linux:    echo \'export HDK_GH_TOKEN="%s"\' >> ~/.bashrc && source ~/.bashrc' % token)
    print(f"\n初始化完成。专属目录: {WORK}。之后每天在 {REPO} 里执行「读 AGENTS.md 执行测试」。")

    # 8. 只读 IAM 子账号凭证提示（D4-13 最小权限用例专用，可选）
    print("\n=== 只读 IAM 子账号凭证（D4-13 最小权限用例专用，可选） ===")
    print("  真云 E2E 用管理员凭证 credentials.json；D4-13 最小权限需只读子账号，")
    print("  独立手配到 ~/.config/huaweicloud/credentials.readonly.json（格式 {ak, sk, region}），")
    print("  执行时用 scripts/run-as-readonly.py 动态切（只用只读子账号，不替换管理员凭证）。")


if __name__ == "__main__":
    main()