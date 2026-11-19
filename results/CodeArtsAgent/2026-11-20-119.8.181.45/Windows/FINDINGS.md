# FINDINGS — 缺陷发现清单（CodeArtsAgent-deepseek-v4.1-flash-1017）

> **生成时间**：2026-11-20 05:21:31（北京时间）
> **被测版本**：huaweicloud-devkit@2.0.0-next.4（gitHead 16a24814）
> **执行包**：results/CodeArtsAgent/2026-11-20-119.8.181.45/Windows

## #1【P0】D1-39 Windows 升级检测链 queryDistTagsSync 静默返回 null（npm 12 dist-tags 数组格式未解析）

- **现象**：Windows 12 上直调 queryDistTagsSync() 与 queryDistTags() 均返回 
ull；
pm view huaweicloud-devkit dist-tags --json 在 npm 12.1.0 下输出数组 [{"latest":"1.1.14","next":"2.0.0-next.4"}]，未抛 EINVAL 但检测链静默失败。
- **断言**：Windows 下 queryDistTagsSync/queryDistTags 返回 {latest,next} 非 null，check_update 不得静默失效。
- **根因**：plugins/huaweicloud-core/src/update-registry.ts:28-29 的 toDistTags 对 Array.isArray(value) 直接 eturn null；parseDistTagsOutput（:37）因此把 npm 12 的数组输出判为失败。
- **影响**：Windows 客户端升级提醒/check_update 全链失效，用户无法获知新版本。
- **证据**：evidence/D1-39/stdout.log

## #2【P0】D4-21 hook_check_artifacts 对 HCL AdministratorFullAccess 仅 warn 未 deny

- **现象**：hook_check_artifacts 对宽泛 JSON IAM（Action:*）返回 deny，但对 HCL 制品 AdministratorFullAccess 仅返回 warn(hwc-sandbox-missing-ttl)，未拦截。
- **断言**：broad IAM 制品（JSON Action:* 与 HCL 内置 AdministratorFullAccess 引用）均 decision=deny。
- **根因**：plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:289 的 hwc-iam-admin-policy 其 match.all 强制要求 Effect: Allow 文本（:302 附近），HCL 内置策略引用不含 Effect/Statement → 规则不命中。
- **影响**：以 HCL 引用高权策略的部署制品可绕过制品预检。
- **证据**：evidence/D4-21/stdout.log

## #3【P2】D4-26 findings.evidence 未脱敏空格分隔的 admin-pass 明文

- **现象**：evaluateCommandRisk('hcloud ecs DeleteServer --force --admin-pass Secret123') 返回的 findings.evidence 原样包含 Secret123。
- **断言**：findings.evidence 中 admin-pass/AK/SK/token 均被 <redacted> 替换，不泄露明文。
- **根因**：plugins/huaweicloud-core/src/risk-rule-engine.ts:136-146 的 redactEvidence 正则只匹配 key=value/key:value，不匹配命令行空格分隔形式 --admin-pass Secret123；excerpt（:201）调用后仍泄露。
- **影响**：安全 findings 回显给 agent 时泄露口令。
- **证据**：evidence/D4-26/stdout.log

## #4【P2】D8-9 sanitizeValue 不脱敏 AK/SK/token

- **现象**：sanitizeValue('AK=AKID1234567890 token=abc123') 原样返回，未替换敏感值。
- **断言**：输入含 AK/SK/token 时输出 <redacted>，合法值不被改动。
- **根因**：plugins/huaweicloud-core/src/telemetry/telemetry-values.ts:27-34 的 sanitizeValue 只做换行压缩与 255 长度截断，未实现敏感值脱敏。
- **影响**：遥测/hook 事件可能把凭证写入本地 spool 与上报。
- **证据**：evidence/D8-9/stdout.log

## #5【P1】EXP-E01 意图“华北北京四有哪些云主机”路由 MISS

- **现象**：huaweicloud_service_catalog({intent:'帮我查一下我账号在华北北京四有哪些云主机'}) 返回 Run hcloud --help to list available services.，recommendedServices 不含 ECS。
- **断言**：该意图 recommendedServices 必须包含 ECS。
- **根因**：plugins/huaweicloud-core/src/capability-catalog.ts:23-34 ECS routeMap 的 keywords 含“云服务器/弹性云服务器”但缺口语词“云主机”，意图未命中任何 route。
- **影响**：中文口语化查询路由准确率下降（EXP 评测集 MISS）。
- **证据**：evidence/EXP-E01/stdout.log

## #6【非产品缺陷】真云 AK/SK 失效导致 13 条真云 E2E 标 BLOCKED

- **现象**：vault 凭证与只读子账号调用均返回 Unauthorized/APIGW.0301；沙箱连接返回 HDKIT_UPSTREAM_ERROR；VPC/OBS/ECS 建删与 CTS 审计无法真机执行。
- **说明**：环境/凭证外部依赖失效，非被测产品缺陷；已用真实 hcloud 调用取证实测。解除条件：下发有效 AK/SK 与实名沙箱账号后重跑 D2-1/D3-C1/C2/C3/C6/C7/C13/S2/S3/S4/D3-B3/D4-13/D4-14。
- **证据**：evidence/D3-C1/stdout.log、evidence/D3-B3/stdout.log 等 13 个目录