# -*- coding: utf-8 -*-
"""把测试仓库从 GitHub 同步到 GitCode 镜像（国内拉取用）。

用法（在有 GitHub 仓库最新 clone + 能访问 GitCode 的机器上运行）:
    python scripts/sync_gitcode_mirror.py

原理：在已 clone 的测试仓库里，git fetch github + git push gitcode main，
    把 GitHub 的 main 同步到 GitCode 镜像，供测试机从国内镜像拉取。

认证：GitCode 用 GITCODE_TOKEN 环境变量 或 ~/.gitcode_token 文件（oauth2:TOKEN 格式）。
"""
import os, sys, subprocess

GITHUB = "https://github.com/huaweicloud-mate/huaweicloud-devkit-test.git"
GITCODE = "https://gitcode.com/hd-vector/huaweicloud-devkit-test.git"


def load_token():
    t = os.environ.get("GITCODE_TOKEN")
    if t:
        return t.strip()
    p = os.path.expanduser("~/.gitcode_token")
    if os.path.isfile(p):
        t = open(p).read().strip()
        if t:
            return t
    return ""


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True, shell=True)
    return r.returncode, (r.stdout or "").strip(), (r.stderr or "").strip()


def main():
    t = load_token()
    if not t:
        print("无 GITCODE_TOKEN（请设环境变量或写 ~/.gitcode_token）")
        sys.exit(2)

    # 拉 GitHub 最新（本地已有的 origin 即 GitHub）
    rc, out, err = run(f"git fetch {GITHUB} main")
    if rc != 0:
        print(f"fetch github 失败: {(out + err)[:200]}")
        sys.exit(1)

    # push 到 GitCode 镜像（oauth2 格式认证）
    auth_remote = GITCODE.replace("https://", f"https://oauth2:{t}@")
    rc, out, err = run(f"git push {auth_remote} FETCH_HEAD:refs/heads/main 2>&1")
    if rc == 0:
        print(f"镜像同步成功: {(out.splitlines()[-1] if out else 'ok')}")
    else:
        print(f"镜像同步失败: {(out + err)[:300]}")
        sys.exit(1)


if __name__ == "__main__":
    main()