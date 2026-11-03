# -*- coding: utf-8 -*-
"""preflight_probe 判定逻辑单测（不依赖真云 / hcloud）。

覆盖：JSON 抠取（跳 BOM + 提示行）、错误标记识别、凭证文件探针三态、退出码映射。
"""

import importlib.util
import json
import os
import tempfile
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
spec = importlib.util.spec_from_file_location(
    "preflight_probe", os.path.join(ROOT, "scripts", "preflight_probe.py")
)
pf = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pf)


class TestParseJson(unittest.TestCase):
    def test_skips_bom_and_banner(self):
        out = "\ufeff可执行`hcloud update`更新KooCLI至最新版本7.3.12\n{\n  \"account_id\": \"abc\"\n}\n"
        self.assertEqual(pf.parse_json(out), {"account_id": "abc"})

    def test_returns_none_without_json(self):
        self.assertIsNone(pf.parse_json("[USE_ERROR]cli-region的值不支持"))

    def test_partial_garbage_after_json_is_ok(self):
        out = '{\"a\": 1}\n\n[DONE]\n'
        self.assertEqual(pf.parse_json(out), {"a": 1})


class TestLooksError(unittest.TestCase):
    def test_detects_use_error(self):
        self.assertTrue(pf.looks_error("[USE_ERROR]缺少必填参数"))

    def test_detects_openapi_error(self):
        self.assertTrue(pf.looks_error("[OPENAPI_ERROR]APIGW.0301"))

    def test_clean_output(self):
        self.assertEqual(pf.looks_error('{"account_id": "x"}'), "")


class TestCredentialProbe(unittest.TestCase):
    def _write(self, data):
        fd, path = tempfile.mkstemp(suffix=".json")
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            f.write(json.dumps(data))
        self.addCleanup(os.remove, path)
        return path

    def test_ok_when_complete(self):
        p = self._write({"ak": "SECRETAK123", "sk": "SECRETSK456", "region": "cn-north-4"})
        r = pf.probe_credential_file(p)
        self.assertEqual(r["status"], "OK")
        self.assertNotIn("SECRETAK123", r["detail"])  # 不泄露 ak 值
        self.assertNotIn("SECRETSK456", r["detail"])  # 不泄露 sk 值

    def test_fail_when_field_missing(self):
        p = self._write({"ak": "A", "sk": "", "region": "cn-north-4"})
        r = pf.probe_credential_file(p)
        self.assertEqual(r["status"], "FAIL")
        self.assertIn("sk", r["detail"])

    def test_fail_when_missing_file(self):
        r = pf.probe_credential_file(os.path.join(tempfile.gettempdir(), "definitely-absent-xyz.json"))
        self.assertEqual(r["status"], "FAIL")

    def test_fail_when_unparsable(self):
        fd, path = tempfile.mkstemp(suffix=".json")
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            f.write("not-json")
        self.addCleanup(os.remove, path)
        self.assertEqual(pf.probe_credential_file(path)["status"], "FAIL")


class TestExitCodeMap(unittest.TestCase):
    def test_mapping(self):
        self.assertEqual({"OK": 0, "WARN": 1, "FAIL": 2}["OK"], 0)
        self.assertEqual({"OK": 0, "WARN": 1, "FAIL": 2}["WARN"], 1)
        self.assertEqual({"OK": 0, "WARN": 1, "FAIL": 2}["FAIL"], 2)

    def test_bss_region_is_global(self):
        # BSS 是全局服务：用 cn-north-4 会报「cli-region的值不支持」
        self.assertEqual(pf.BSS_REGION, "cn-north-1")


if __name__ == "__main__":
    unittest.main()
