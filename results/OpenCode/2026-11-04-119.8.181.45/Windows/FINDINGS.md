# FINDINGS — 缺陷发现清单（OpenCode-glm-5.2）

> **落盘路径**：`results/OpenCode/2026-11-04-119.8.181.45/Windows/FINDINGS.md`
> **生成时间**：2026-11-04 05:38:00（北京时间）
> **被测版本**：huaweicloud-devkit@1.1.13-next.3（gitHead: 7ad8a533）

---

## #1【P0】D1-39 Windows 升级检测链静默失败（parseDistTagsOutput 拒绝 npm 12 数组输出）

- **现象**：`huaweicloud_check_update` MCP 工具返回 `{latestStable:null, latestNext:null, targetVersion:null, result:"check_failed"}`。`queryDistTagsSync()` 返回 null。`npm view huaweicloud-devkit dist-tags --json` 实际输出 `[{latest:"1.1.12", next:"1.1.13-next.3"}]`（数组）。
- **断言**：`queryDistTagsSync()` 应返回 `{latest:"1.1.12", next:"1.1.13-next.3"}`；`huaweicloud_check_update` 应返回 `result:"up_to_date"` 或 `result:"update_available"`（非 `check_failed`）。
- **根因**：`plugins/huaweicloud-core/src/update-check.mjs:86` — `if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;` 拒绝数组形式。npm 12.1.0 `npm view <pkg> dist-tags --json` 对单包返回数组 `[{latest,next}]`（npm 单结果包数组行为），parseDistTagsOutput 直接返回 null。
- **影响**：升级检测链完全失效——用户无法得知有新版本；镜像 lag / 版本倒退防护（D1-40）也无法工作。影响所有 npm 12+ 用户。
- **证据**：`evidence/D1-39/stdout.log`（含 rawNpmOutput 数组形式 + parseDistTagsOutput 对 array 返回 null、对 object 返回正确结果）
- **修复建议**：parseDistTagsOutput 接受数组：`if (Array.isArray(parsed) && parsed.length > 0 && parsed[0] && typeof parsed[0] === 'object') parsed = parsed[0];`
- **状态**：待提单

## #2【P0】D1-40 镜像 lag 检测失效（同一根因：parseDistTagsOutput 拒绝数组）

- **现象**：在默认 registry 和官方 registry（`https://registry.npmjs.org`）下，`queryDistTagsSync()` 均返回 null。`judgeUpdate(current, null, ...)` 短路到 `check_failed`，无法比较版本。
- **断言**：镜像 lag 下 `queryDistTags` 应返回真实 tags，`judgeUpdate` 应正确判断版本倒退（远端 <= 本地不提示）；不得 `check_failed`。
- **根因**：同 #1 — `plugins/huaweicloud-core/src/update-check.mjs:86` parseDistTagsOutput 拒绝 Array.isArray。
- **影响**：镜像滞后/版本倒退检测不可能；用户可能被误导安装旧版本。
- **证据**：`evidence/D1-40/stdout.log`（defaultRegistryResult=null, officialRegistryResult=null）
- **状态**：待提单（与 #1 同一根因，提单时合并）

## #3【非产品缺陷】credentials.json 占位凭证导致真云写用例 BLOCKED

- **现象**：本机 `~/.config/huaweicloud/credentials.json` 内容为 `{ak:"test_ak_20char123456", sk:"test_sk_30char1234567890123456", ...}`（占位测试值），非真实华为云凭证。`huaweicloud_auth_status` 报 `credentialsConfigured:true` 但实际 `huaweicloud_run_readonly_command` 返回 `APIGW.0301 Unauthorized`。只读子账号 `credentials.readonly.json`（test001）凭证真实可用。
- **说明**：此为环境配置问题（credentials.json 被覆盖为测试值），非产品缺陷。导致 D3-C1/C2/C13/S2/S7 真云建删用例 BLOCKED。建议维护者检查 credentials.json 是否被误覆盖。
