# FINDINGS — CodeArtsWork Windows 每日测试 2026-09-18

> 被测版本：huaweicloud-devkit v1.1.5（gitHead e7ed6f66）
> 测试时间：2026-09-18 07:57:27（北京时间）
> 执行归档：results/CodeArtsWork/2026-09-18-120.46.40.202/Windows/

---

## FINDING-1: P0 凭证env打印拦截缺失 HW_ 前缀

- **级别**：P0
- **用例**：D4-2
- **描述**：凭证环境变量打印拦截规则未覆盖 `HW_` 前缀（`HW_ACCESS_KEY`/`HW_SECRET_KEY`/`HW_SECURITY_TOKEN`），`echo $HW_SECRET_KEY` 等命令未被 `hook_check_command` 拦截。
- **断言**：`hook_check_command("echo $HW_SECRET_KEY")` 应返回 `block`，实际返回 `allow`。
- **根因**：`plugins/huaweicloud-core/src/cloud-risk-rules.json` 规则 `hwc-command-env-dump` 的 regex 未包含 `HW_` 前缀模式。
- **证据**：`evidence/D4-2/probe.txt`

## FINDING-2: P0 明文secret API拦截缺失 ShowSecret 模式

- **级别**：P0
- **用例**：D4-3
- **描述**：明文 secret 读取拦截规则未覆盖 `ShowSecret` 模式，`hcloud KMS ShowSecret` 等命令未被拦截。
- **断言**：`hook_check_command("hcloud KMS ShowSecret --id xxx")` 应返回 `block`，实际返回 `allow`。
- **根因**：`plugins/huaweicloud-core/src/cloud-risk-rules.json` 规则 `hwc-command-secret-value-read` 的 regex 缺 `ShowSecret` 模式。
- **证据**：`evidence/D4-3/probe.txt`

## FINDING-3: P0 Windows 升级检测链失败

- **级别**：P0
- **用例**：D1-39
- **描述**：Windows 下 `check_update` 无法获取 npm dist tags，升级检测链失效（EINVAL 错误）。
- **断言**：`check_update()` 在 Windows 应返回 `{currentVersion, latestStable, updateAvailable}` 结构，实际返回 `updateAvailable=false`（兜底，未真正获取 dist tags）。
- **根因**：`plugins/huaweicloud-core/src/update-check.mjs` `queryDistTagsSync`/`queryDistTagsFetch` 在 Windows 下 spawn `npm view` 或 fetch 失败（EINVAL）。
- **证据**：`evidence/D1-39/probe.txt`

## FINDING-4: P1 adminPass 参数回显无警告

- **级别**：P1
- **用例**：D4-6
- **描述**：`adminPass` 参数在命令回显中未被检测和警告，敏感密码可能泄露到日志。
- **断言**：`hook_check_command("hcloud ECS CreateServers --adminPass xxx")` 应返回 `warn` 或 `block`，实际返回 `allow`。
- **根因**：`plugins/huaweicloud-core/src/cloud-risk-rules.json` 无 `adminPass` 参数检测规则。
- **证据**：`evidence/D4-6/probe.txt`

## FINDING-5: P1 serviceCatalog 中文意图路由准确率 21.4%

- **级别**：P1
- **用例**：D10-3
- **描述**：`serviceCatalog` 中文意图路由准确率仅 21.4%（3/14 HIT），11 条中文意图未命中正确服务。
- **断言**：`serviceCatalog("帮我查一下我账号在华北北京四有哪些云主机")` 应路由到 ECS 查询，实际返回 "Run hcloud --help" 兜底。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` `serviceCatalog` 中文关键词匹配覆盖不足。
- **证据**：`evidence/D10-3/probe.txt`

## FINDING-6: P1 EXP-E01~E14 中文意图路由 MISS（11 条）

- **级别**：P1
- **用例**：EXP-E01, EXP-E02, EXP-E03, EXP-E04, EXP-E05, EXP-E07, EXP-E10, EXP-E11, EXP-E12, EXP-E13, EXP-E14
- **描述**：eval harness 评测集中 11/15 条中文意图路由 MISS，未命中期望服务。
- **断言**：各条目应命中期望服务路由（ECS/OBS/EIP/RDS/CBR/FunctionGraph/BSS/CES/ELB/IAM），实际返回 "Run hcloud --help" 兜底或错误服务。
- **根因**：同 FINDING-5，`serviceCatalog` 中文关键词匹配覆盖不足。
- **证据**：`evidence/EXP-E01/probe.txt` ~ `evidence/EXP-E14/probe.txt`
