# FINDINGS — CodeArtsWork Windows 每日测试 2026-09-18

> **归档路径**：`results/CodeArtsWork/2026-09-18-120.46.40.202/Windows/FINDINGS.md`
> **生成时间**：2026-09-18 07:57:27（北京时间）
> **本清单是统一提单脚本的解析输入**，格式严格遵循 `templates/findings.md`。

---

## #1【P0】D4-2 凭证env打印拦截缺失 HW_ 前缀

- **现象**：`echo $HW_SECRET_KEY` 等命令未被 hook_check_command 拦截，HW_ 前缀环境变量可明文打印
- **断言**：`hook_check_command("echo $HW_SECRET_KEY")` 应返回 block，实际返回 allow
- **根因**：`plugins/huaweicloud-core/src/cloud-risk-rules.json` 规则 `hwc-command-env-dump` regex 缺 `HW_` 前缀
- **影响**：凭证泄露风险，HW_ACCESS_KEY/HW_SECRET_KEY 可被打印到日志
- **证据**：evidence/D4-2/probe.txt
- **状态**：待提单

## #2【P0】D4-3 明文secret API拦截缺失 ShowSecret 模式

- **现象**：`hcloud KMS ShowSecret` 等命令未被拦截，明文 secret 可读取
- **断言**：`hook_check_command("hcloud KMS ShowSecret --id xxx")` 应返回 block，实际返回 allow
- **根因**：`plugins/huaweicloud-core/src/cloud-risk-rules.json` 规则 `hwc-command-secret-value-read` regex 缺 `ShowSecret`
- **影响**：明文密钥读取风险
- **证据**：evidence/D4-3/probe.txt
- **状态**：待提单

## #3【P0】D1-39 Windows 升级检测链失败

- **现象**：Windows 下 check_update 无法获取 npm dist tags，升级检测链失效（EINVAL）
- **断言**：`check_update()` 在 Windows 应返回 {currentVersion, latestStable, updateAvailable}，实际返回兜底 false
- **根因**：`plugins/huaweicloud-core/src/update-check.mjs` queryDistTagsSync/queryDistTagsFetch Windows 下 spawn npm view 或 fetch 失败
- **影响**：Windows 用户无法收到升级提醒
- **证据**：evidence/D1-39/probe.txt
- **状态**：待提单

## #4【P1】D4-6 adminPass 参数回显无警告

- **现象**：adminPass 参数在命令回显中未被检测和警告，敏感密码可能泄露
- **断言**：`hook_check_command("hcloud ECS CreateServers --adminPass xxx")` 应返回 warn/block，实际返回 allow
- **根因**：`plugins/huaweicloud-core/src/cloud-risk-rules.json` 无 adminPass 参数检测规则
- **影响**：管理员密码泄露风险
- **证据**：evidence/D4-6/probe.txt
- **状态**：待提单

## #5【P1】D10-3 serviceCatalog 中文意图路由准确率 21.4%

- **现象**：serviceCatalog 中文意图路由准确率仅 21.4%（3/14 HIT），11 条中文意图未命中
- **断言**：`serviceCatalog("帮我查一下我账号在华北北京四有哪些云主机")` 应路由到 ECS 查询，实际返回兜底
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` serviceCatalog 中文关键词匹配覆盖不足
- **影响**：中文用户意图无法正确路由到对应云服务
- **证据**：evidence/D10-3/probe.txt
- **状态**：待提单

## #6【P1】EXP-E01~E14 中文意图路由 MISS（11 条）

- **现象**：eval harness 评测集 11/15 条中文意图路由 MISS，未命中期望服务
- **断言**：各条目应命中期望服务路由（ECS/OBS/EIP/RDS/CBR/FunctionGraph/BSS/CES/ELB/IAM），实际返回兜底
- **根因**：同 #5，`plugins/huaweicloud-core/src/tools.mjs` serviceCatalog 中文关键词匹配覆盖不足
- **影响**：中文用户意图路由准确率低
- **证据**：evidence/EXP-E01/probe.txt ~ evidence/EXP-E14/probe.txt
- **状态**：待提单
