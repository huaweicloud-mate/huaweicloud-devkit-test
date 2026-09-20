import urllib.request
import json
import os
import ssl

token = os.environ.get('HDK_GH_TOKEN', '').strip()
if not token:
    with open(os.path.expanduser('~/.hdk_token'), 'r') as f:
        token = f.read().strip()

# Read FINDINGS.md
findings_path = r'C:\Users\Administrator\devkit-test\testbot5-win-Codearts-IDE\huaweicloud-devkit-test\results\CodeArtsWork\2026-09-21-120.46.40.202\Windows\FINDINGS.md'
with open(findings_path, 'r', encoding='utf-8') as f:
    findings_content = f.read()

# Create issue body
body = f"""## 每日测试缺陷汇总 — CodeArtsWork Windows 2026-09-21

**客户端**: CodeArtsWork (GLM-5.2)
**OS**: Windows
**包版本**: huaweicloud-devkit@1.1.5
**测试日期**: 2026-09-21
**总用例**: 139 (PASS=121, FAIL=16, BLOCKED=2)

---

{findings_content}

---

## 修复建议

1. **F-001 (D4-2)**: safety-policy.mjs:418 正则增加 `SECRET_ACCESS_KEY` 备选
2. **F-002 (D4-3)**: safety-policy.mjs:432 正则增加 `ShowSecret` 或 `KMS.*Secret` 模式
3. **F-003 (D4-23)**: package.json `files` 数组添加 `"rules"`
4. **F-004 (D10-3)**: 扩展 serviceCatalog 中文意图匹配规则

## 证据路径

所有证据已落盘 `results/CodeArtsWork/2026-09-21-120.46.40.202/Windows/evidence/` 并 push 至测试仓库。
"""

# Create issue on source repo
url = 'https://api.github.com/repos/huaweicloud/huaweicloud-devkit/issues'
data = json.dumps({
    'title': '[daily-test] CodeArtsWork Windows 2026-09-21: 4 defects (3 P0 + 1 P1)',
    'body': body,
    'labels': ['bug', 'daily-test', 'CodeArtsWork']
}).encode('utf-8')

req = urllib.request.Request(url, data=data, method='POST')
req.add_header('Authorization', f'token {token}')
req.add_header('Accept', 'application/vnd.github+json')
req.add_header('Content-Type', 'application/json')

ctx = ssl.create_default_context()
try:
    with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
        result = json.loads(resp.read().decode('utf-8'))
        print(f'Issue created: #{result["number"]}')
        print(f'URL: {result["html_url"]}')
except urllib.error.HTTPError as e:
    print(f'HTTP Error {e.code}: {e.read().decode("utf-8")[:500]}')
except Exception as e:
    print(f'Error: {e}')
