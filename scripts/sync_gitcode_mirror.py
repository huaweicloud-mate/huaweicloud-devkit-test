# -*- coding: utf-8 -*-
"""把测试仓库从 GitHub 同步到 GitCode 镜像（国内拉取用）。

用法:
    python scripts/sync_gitcode_mirror.py

原理：git fetch github（GH_TOKEN 认证） + git push gitcode main（GITCODE_TOKEN 认证），
    把 GitHub 的 main 同步到 GitCode 镜像，供测试机从国内镜像拉取。

凭证：
    GitHub  —— HDK_GH_TOKEN/GH_TOKEN 环境变量 → gh auth token --user shuangheaven
    GitCode —— GITCODE_TOKEN 环境变量 → ~/.gitcode_token 文件（oauth2:TOKEN 格式）
"""
import os, sys, subprocess

GITHUB = "https://github.com/huaweicloud-mate/huaweicloud-devkit-test.git"
GITCODE = "https://gitcode.com/hd-vector/huaweicloud-devkit-test.git"


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True, shell=True)
    return r.returncode, (r.stdout or "").strip(), (r.stderr or "").strip()


def gh_token():
    t = os.environ.get("HDK_GH_TOKEN") or os.environ.get("GH_TOKEN")
    if t:
        return t.strip()
    rc, t, _ = run("gh auth token --user shuangheaven")
    return t if rc == 0 and t else ""


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


def main():
    gh = gh_token()
    gc = gitcode_token()
    if not gh:
        print("无 GitHub 凭证")
        sys.exit(2)
    if not gc:
        print("无 GITCODE_TOKEN（请设环境变量或写 ~/.gitcode_token）")
        sys.exit(2)

    gh_auth = GITHUB.replace("https://", f"https://x-access-token:{gh}@")
    rc, out, err = run(f"git fetch {gh_auth} main 2>&1")
    if rc != 0:
        print(f"fetch github 失败: {(out + err)[:250]}")
        sys.exit(1)

    gc_auth = GITCODE.replace("https://", f"https://oauth2:{gc}@")
    rc, out, err = run(f"git push {gc_auth} FETCH_HEAD:refs/heads/main 2>&1")
    if rc == 0:
        print(f"镜像同步成功: {(out.splitlines()[-1] if out else 'ok')}")
    else:
        print(f"镜像同步失败: {(out + err)[:300]}")
        sys.exit(1)


if __name__ == "__main__":
    main()