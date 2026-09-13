# ITER-002-2026-09-08 D3-C2 OBS 静态网站托管验证（全自动，2026-09-08）

## 结果：✅ 完整验证通过（无需人工控制台——SDK/REST 可自动化）

| 步骤 | 结果 |
|---|---|
| 建桶（hcloud `mb -acl=public-read`——桶级公共读关键） | ✅ |
| 上传 index.html（public-read） | ✅ |
| `SetBucketWebsite`（SDK：indexDocument=index.html） | ✅ OK（Get 回读 200 index.html） |
| **验证托管 URL**（`http://<桶>.obs.../`） | ✅ **HTTP 200**（匿名访问首页生效） |
| 清理（对象+桶删除+复核） | ✅ 自建自删零残留 |

## 关键经验（记录）

1. **hcloud OBS CLI 无 SetBucketWebsite**（已知缺口）——但 **esdk-obs-python 的 `setBucketWebsiteConfiguration` 可自动化**（之前误判"需人工控制台"，已纠正）
2. **桶级 ACL 是匿名访问关键**：仅设托管配置 → 匿名访问 **403**；需桶 `public-read`（建桶 `-acl=public-read`）+ 对象 public-read → **200**
3. SDK API 版本差异提示：`createBucket`/`setBucketAcl` 不接受 canned 字符串/无 acl 参数（本 SDK 版本），桶 ACL 走 `hcloud mb -acl` 最顺

## 状态更新

- **人工待办 B（OBS 托管开关）→ ✅ 已完成（自动化）**
- 人工剩余：A（7 客户端 GUI 清单）+ C/D（Windows 机可选 GUI）

## 复现

- test-cases/obs-website.py / obs-website2.py / obs-website3.py（SDK 直调，uv run --with esdk-obs-python）