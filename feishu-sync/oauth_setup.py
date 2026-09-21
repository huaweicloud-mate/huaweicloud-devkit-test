# -*- coding: utf-8 -*-
"""
oauth_setup.py - 飞书 OAuth 授权：获取 user_access_token（以用户身份读写文档）

背景：文档协作者机制不支持"应用"对象，改用 OAuth 以用户(文档owner)身份调用 API。
流程：本机起回调服务 -> 打印授权链接 -> 用户浏览器同意 -> code 换 token -> DPAPI 保存

前置：应用后台「安全设置 -> 重定向 URL」需添加 http://localhost:8765/callback
用法：python oauth_setup.py
"""
import json
import os
import secrets
import sys
import threading
import time
import urllib.parse
import webbrowser
from http.server import BaseHTTPRequestHandler, HTTPServer

import requests

from feishu_core import CredentialStore, FeishuClient, dpapi_encrypt

HERE = os.path.dirname(os.path.abspath(__file__))
TOKEN_FILE = os.path.join(HERE, ".user_token.json")
PORT = 8765
REDIRECT = f"http://localhost:{PORT}/callback"


class OAuthHandler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"
    code = None
    state = None
    error = None

    def do_GET(self):
        q = urllib.parse.urlparse(self.path)
        body = b""
        if q.path == "/callback":
            params = urllib.parse.parse_qs(q.query)
            print(f"[oauth] 收到回调: {self.path}", flush=True)
            if params.get("state", [""])[0] != OAuthHandler.state:
                OAuthHandler.error = "state 不匹配(CSRF)"
                print(f"[oauth] state 不匹配: {params.get('state')} != {OAuthHandler.state}", flush=True)
            elif "code" in params:
                OAuthHandler.code = params["code"][0]
            else:
                OAuthHandler.error = params.get("error", ["未知错误"])[0]
        msg = "✅ 授权成功，可以关闭此页面" if OAuthHandler.code else f"❌ 授权失败: {OAuthHandler.error}"
        body = f"<html><body style='font-family:sans-serif;padding:40px'><h2>{msg}</h2></body></html>".encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Connection", "close")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *a):
        pass


def obtain_user_token():
    store = CredentialStore.load()
    tenant_client = FeishuClient(store.app_id, store.app_secret)
    tenant_client.tenant_token()  # 预热 tenant token

    OAuthHandler.state = secrets.token_hex(8)
    server = HTTPServer(("127.0.0.1", PORT), OAuthHandler)
    threading.Thread(target=server.serve_forever, daemon=True).start()

    params = {
        "app_id": store.app_id,
        "redirect_uri": REDIRECT,
        # 最小 scope 验证格式；验证通过后再全量
        "scope": "sheets:spreadsheet",
        "state": OAuthHandler.state,
    }
    auth_url = "https://open.feishu.cn/open-apis/authen/v1/authorize?" + urllib.parse.urlencode(params)
    print("=" * 70)
    print("请在浏览器打开以下链接并同意授权（将跳转回 localhost:8765）:")
    print(auth_url)
    print("=" * 70)
    try:
        webbrowser.open(auth_url)
    except Exception:
        pass

    deadline = time.time() + 240
    while time.time() < deadline:
        if OAuthHandler.code:
            break
        if OAuthHandler.error:
            raise SystemExit(f"授权失败: {OAuthHandler.error}")
        time.sleep(1)
    server.shutdown()
    if not OAuthHandler.code:
        raise SystemExit("等待授权超时(4分钟)，请重新运行")

    # code -> user_access_token
    r = requests.post(
        "https://open.feishu.cn/open-apis/authen/v1/oidc/access_token",
        params={"grant_type": "authorization_code", "code": OAuthHandler.code},
        headers={"Authorization": f"Bearer {tenant_client.tenant_token()}"},
        timeout=20)
    data = r.json()
    if data.get("code") != 0:
        raise RuntimeError(f"换取 token 失败: code={data.get('code')} msg={data.get('msg')}")
    user_token = data["data"]["access_token"]
    refresh_token = data["data"]["refresh_token"]
    expires_in = data["data"].get("expires_in", 7200)
    print(f"✅ user_access_token 获取成功 (有效期 {expires_in}s)")

    # DPAPI 加密保存
    payload = {
        "user_access_token_enc": dpapi_encrypt(user_token),
        "refresh_token_enc": dpapi_encrypt(refresh_token),
        "expires_at": time.time() + expires_in - 300,
    }
    with open(TOKEN_FILE, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    print(f"✅ token 已加密保存: {TOKEN_FILE} (DPAPI)")

    # 立即验证：用 user token 读电子表格（spreadsheet token 经环境变量注入，勿硬编码入公开仓库）
    ss_token = os.environ.get("FEISHU_SS_TOKEN", "")
    r = requests.get(
        f"https://open.feishu.cn/open-apis/sheets/v3/spreadsheets/{ss_token}",
        headers={"Authorization": f"Bearer {user_token}"}, timeout=20)
    d = r.json()
    if d.get("code") == 0:
        print("✅ 权限验证通过：user token 可读写全景图电子表格")
    else:
        print(f"⚠️ 验证异常: {d.get('code')} {d.get('msg')}")
    return user_token


if __name__ == "__main__":
    obtain_user_token()