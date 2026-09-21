# -*- coding: utf-8 -*-
"""
feishu_core.py - 飞书开放平台核心封装（凭证 DPAPI 加密 + token 缓存 + API 客户端）

安全设计：
- app_id / app_secret 不落明文：用 Windows DPAPI（当前用户级）加密后存本地 JSON
- tenant_access_token 内存缓存（TTL 90 分钟，飞书有效期为 2 小时）
- 所有 API 调用仅发往 open.feishu.cn 官方域名

用法：
    from feishu_core import FeishuClient, CredentialStore
    cred = CredentialStore.load()            # 首次: CredentialStore.setup() 交互式录入
    client = FeishuClient(cred.app_id, cred.app_secret)
    token = client.tenant_token()
"""
import base64
import ctypes
import json
import os
import sys
import time

# 强制 stdout UTF-8（每日同步经 PowerShell 重定向落日志，GBK 会让 «»/emoji 崩溃）
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

import requests

# 官方 API 域名（中国大陆版飞书）
BASE = "https://open.feishu.cn/open-apis"
CRED_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".credentials.json")


# ---------------------------------------------------------------- DPAPI
def dpapi_encrypt(plaintext: str) -> str:
    """Windows DPAPI 加密（仅在当前 Windows 用户下可解密），返回 base64。"""
    if sys.platform != "win32":
        raise RuntimeError("DPAPI 仅支持 Windows；请在 Windows 上运行本工具")
    blob_in = ctypes.create_string_buffer(plaintext.encode("utf-8"), len(plaintext))
    class DATA_BLOB(ctypes.Structure):
        _fields_ = [("cbData", ctypes.c_ulong), ("pbData", ctypes.c_void_p)]
    data_in = DATA_BLOB(len(plaintext), ctypes.cast(blob_in, ctypes.c_void_p))
    data_out = DATA_BLOB()
    ctypes.windll.crypt32.CryptProtectData.argtypes = [
        ctypes.POINTER(DATA_BLOB), ctypes.c_wchar_p, ctypes.c_void_p,
        ctypes.c_void_p, ctypes.c_void_p, ctypes.c_uint32, ctypes.POINTER(DATA_BLOB)]
    ctypes.windll.crypt32.CryptProtectData.restype = ctypes.c_int
    if not ctypes.windll.crypt32.CryptProtectData(
        ctypes.byref(data_in), None, None, None, None, 0, ctypes.byref(data_out)
    ):
        raise RuntimeError("CryptProtectData failed")
    raw = ctypes.string_at(data_out.pbData, data_out.cbData)
    ctypes.windll.kernel32.LocalFree.argtypes = [ctypes.c_void_p]
    ctypes.windll.kernel32.LocalFree.restype = ctypes.c_void_p
    ctypes.windll.kernel32.LocalFree(data_out.pbData)
    return base64.b64encode(raw).decode()


def dpapi_decrypt(b64: str) -> str:
    """解密 DPAPI 密文（base64 输入）。"""
    raw = base64.b64decode(b64)
    class DATA_BLOB(ctypes.Structure):
        _fields_ = [("cbData", ctypes.c_ulong), ("pbData", ctypes.c_void_p)]
    buf = ctypes.create_string_buffer(raw, len(raw))
    data_in = DATA_BLOB(len(raw), ctypes.cast(buf, ctypes.c_void_p))
    data_out = DATA_BLOB()
    ctypes.windll.crypt32.CryptUnprotectData.argtypes = [
        ctypes.POINTER(DATA_BLOB), ctypes.POINTER(ctypes.c_wchar_p), ctypes.c_void_p,
        ctypes.c_void_p, ctypes.c_void_p, ctypes.c_uint32, ctypes.POINTER(DATA_BLOB)]
    ctypes.windll.crypt32.CryptUnprotectData.restype = ctypes.c_int
    if not ctypes.windll.crypt32.CryptUnprotectData(
        ctypes.byref(data_in), None, None, None, None, 0, ctypes.byref(data_out)
    ):
        raise RuntimeError("CryptUnprotectData failed (当前 Windows 用户与加密时不一致?)")
    out = ctypes.string_at(data_out.pbData, data_out.cbData)
    ctypes.windll.kernel32.LocalFree.argtypes = [ctypes.c_void_p]
    ctypes.windll.kernel32.LocalFree.restype = ctypes.c_void_p
    ctypes.windll.kernel32.LocalFree(data_out.pbData)
    return out.decode("utf-8")


# ---------------------------------------------------------------- 凭证
USER_TOKEN_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".user_token.json")


def load_user_identity() -> dict:
    """读取 OAuth 用户令牌（DPAPI 解密）。返回 {user_token, refresh_token} 或空 dict"""
    if not os.path.exists(USER_TOKEN_FILE):
        return {}
    with open(USER_TOKEN_FILE, "r", encoding="utf-8") as f:
        p = json.load(f)
    return {
        "user_token": dpapi_decrypt(p["user_access_token_enc"]),
        "refresh_token": dpapi_decrypt(p.get("refresh_token_enc", "")),
    }


def save_user_identity(user_token: str, refresh_token: str, expires_in: int = 7200):
    payload = {
        "user_access_token_enc": dpapi_encrypt(user_token),
        "refresh_token_enc": dpapi_encrypt(refresh_token),
        "expires_at": time.time() + expires_in - 300,
    }
    with open(USER_TOKEN_FILE, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)


def make_authed_client() -> "FeishuClient":
    """构建带身份的应用客户端：存在 OAuth 用户令牌则用用户身份，否则应用身份"""
    s = CredentialStore.load()
    ident = load_user_identity()
    if ident:
        return FeishuClient(s.app_id, s.app_secret, **ident)
    return FeishuClient(s.app_id, s.app_secret)


class CredentialStore:
    def __init__(self, app_id: str, app_secret: str):
        self.app_id = app_id
        self.app_secret = app_secret

    @classmethod
    def load(cls, path: str = CRED_FILE) -> "CredentialStore":
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return cls(data["app_id"], dpapi_decrypt(data["app_secret_enc"]))

    def save(self, path: str = CRED_FILE):
        payload = {"app_id": self.app_id,
                   "app_secret_enc": dpapi_encrypt(self.app_secret),
                   "saved_by": os.environ.get("USERNAME", "?")}
        with open(path, "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)
        os.chmod(path, 0o600) if sys.platform != "win32" else None
        print(f"[cred] 凭证已加密保存: {path} (DPAPI, 仅当前 Windows 用户可读)")

    @classmethod
    def setup(cls, path: str = CRED_FILE) -> "CredentialStore":
        print("== 飞书自建应用凭证配置 ==")
        app_id = input("App ID    : ").strip()
        app_secret = input("App Secret: ").strip()
        if not app_id or not app_secret:
            raise SystemExit("App ID / Secret 不能为空")
        store = cls(app_id, app_secret)
        store.save(path)
        # 立即验证
        try:
            token = FeishuClient(app_id, app_secret).tenant_token()
            print(f"[cred] 验证通过 ✓ tenant_access_token 获取成功")
        except Exception as e:
            print(f"[cred] 验证失败: {e}")
            raise SystemExit("凭证无效或应用未启用，请检查 open.feishu.cn")
        return store


# ---------------------------------------------------------------- API 客户端
class FeishuClient:
    def __init__(self, app_id: str, app_secret: str,
                 user_token: str = None, refresh_token: str = None):
        self.app_id = app_id
        self.app_secret = app_secret
        self._token = None
        self._token_ts = 0.0
        # user 身份模式（OAuth）：优先用于文档读写（文档协作者不支持应用）
        self.user_token = user_token
        self.refresh_token = refresh_token

    def tenant_token(self, force: bool = False) -> str:
        """获取 tenant_access_token（内存缓存，提前 30 分钟过期刷新）。"""
        if not force and self._token and (time.time() - self._token_ts) < 90 * 60:
            return self._token
        r = requests.post(f"{BASE}/auth/v3/tenant_access_token/internal",
                          json={"app_id": self.app_id, "app_secret": self.app_secret},
                          timeout=15)
        data = r.json()
        if data.get("code") != 0:
            raise RuntimeError(f"token 获取失败: code={data.get('code')} msg={data.get('msg')}")
        self._token = data["tenant_access_token"]
        self._token_ts = time.time()
        return self._token

    def auth_token(self) -> str:
        """选择调用身份：user token 优先（文档读写），否则 tenant token"""
        return self.user_token or self.tenant_token()

    def refresh_user_token(self) -> bool:
        """用 refresh_token 换取新的 user_access_token（飞书 refresh_token 轮换）。
        返回是否成功；成功则更新 self.user_token/refresh_token 并返回新值。"""
        if not self.refresh_token:
            return False
        try:
            r = requests.post(f"{BASE}/authen/v1/oidc/refresh_access_token",
                              params={"grant_type": "refresh_token",
                                      "refresh_token": self.refresh_token},
                              headers={"Authorization": f"Bearer {self.tenant_token()}"},
                              timeout=20)
            data = r.json()
            if data.get("code") != 0:
                print(f"[auth] refresh 失败: {data.get('code')} {data.get('msg')}")
                return False
            self.user_token = data["data"]["access_token"]
            self.refresh_token = data["data"]["refresh_token"]
            print("[auth] user_access_token 已刷新")
            try:
                save_user_identity(self.user_token, self.refresh_token)
            except Exception:
                pass
            return True
        except Exception as e:
            print(f"[auth] refresh 异常: {e}")
            return False

    def _h(self) -> dict:
        return {"Authorization": f"Bearer {self.auth_token()}",
                "Content-Type": "application/json"}

    def _request(self, method: str, path: str, _retry_auth: bool = True, **kw):
        r = requests.request(method, f"{BASE}{path}", headers=self._h(), timeout=30, **kw)
        try:
            data = r.json()
        except Exception:
            raise RuntimeError(f"非 JSON 响应 {r.status_code}: {r.text[:200]}")
        # user token 过期/失效 -> 尝试刷新一次后重试
        if _retry_auth and self.user_token and data.get("code") in (99991663, 99991668, 99991679, 10003, 99991665, 99991677):
            print("[auth] user token 失效，尝试刷新...")
            if self.refresh_user_token():
                return self._request(method, path, _retry_auth=False, **kw)
        if data.get("code") != 0:
            raise RuntimeError(f"API 错误 [{method} {path}]: code={data.get('code')} msg={data.get('msg')}\n{json.dumps(data, ensure_ascii=False)[:400]}")
        return data.get("data", {})

    # ---- 多维表格 (Bitable) ----
    def bitable_create(self, name: str) -> str:
        """创建多维表格，返回 app_token"""
        d = self._request("POST", "/bitable/v1/apps", json={"name": name, "folder_token": ""})
        return d["app"]["app_token"]

    def bitable_tables(self, app_token: str) -> list:
        d = self._request("GET", f"/bitable/v1/apps/{app_token}/tables", params={"page_size": 100})
        return d.get("items", [])

    def table_create(self, app_token: str, table_name: str, fields: list) -> str:
        """建数据表。fields: [{"field_name","type"}] type 1=文本,3=单选"""
        body = {"table": {"name": table_name, "fields": fields}}
        d = self._request("POST", f"/bitable/v1/apps/{app_token}/tables", json=body)
        return d["table_id"]

    def table_records(self, app_token: str, table_id: str, page_size: int = 500) -> list:
        """全量拉记录。返回 [{record_id, fields}]"""
        items, token = [], ""
        while True:
            params = {"page_size": page_size}
            if token:
                params["page_token"] = token
            d = self._request("GET", f"/bitable/v1/apps/{app_token}/tables/{table_id}/records",
                              params=params)
            items += d.get("items", [])
            if d.get("has_more"):
                token = d.get("page_token", "")
            else:
                break
        return items

    def records_create(self, app_token: str, table_id: str, records: list, batch: int = 100):
        """批量建记录。records: [{"fields": {...}}]，自动分批。"""
        total = len(records)
        for i in range(0, total, batch):
            chunk = records[i:i + batch]
            self._request("POST", f"/bitable/v1/apps/{app_token}/tables/{table_id}/records/batch_create",
                          json={"records": chunk})
            print(f"  [bitable] 创建 {i + len(chunk)}/{total} 条")
        return total

    def records_update(self, app_token: str, table_id: str, updates: list, batch: int = 100):
        """批量更新。updates: [{"record_id","fields"}]"""
        total = len(updates)
        for i in range(0, total, batch):
            chunk = updates[i:i + batch]
            self._request("POST", f"/bitable/v1/apps/{app_token}/tables/{table_id}/records/batch_update",
                          json={"records": chunk})
            print(f"  [bitable] 更新 {i + len(chunk)}/{total} 条")
        return total

    def records_delete(self, app_token: str, table_id: str, record_ids: list, batch: int = 100):
        total = len(record_ids)
        for i in range(0, total, batch):
            chunk = record_ids[i:i + batch]
            self._request("POST", f"/bitable/v1/apps/{app_token}/tables/{table_id}/records/batch_delete",
                          json={"records": chunk})
            print(f"  [bitable] 删除 {i + len(chunk)}/{total} 条")
        return total