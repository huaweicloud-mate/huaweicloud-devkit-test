# FINDINGS — 缺陷发现清单（AtomCode-deepseek-v4-pro-0813）

> **落盘路径**：`results/AtomCode/2026-11-22-120.46.222.180/Linux/FINDINGS.md`
> **生成时间**：2026-11-22（北京时间）
> **被测对象**：huaweicloud-devkit `1.1.15`（npm latest，gitHead `bf79b643`）
> **客户端**：AtomCode（deepseek-v4-pro-0813）| OS：Linux aarch64 | IP：120.46.222.180
> **执行归档**：`results/AtomCode/2026-11-22-120.46.222.180/Linux/`
>
> 本轮 SUT 与上一日（11-21）同版（`1.1.15` bf79b643），13 项 FAIL 全部与上一日同源；`file_issue.py` 已做历史查重，命中即关联既有单、不重复开单（详见 HISTORY_LINKS.md）。

## #1【P0】D2-4 凭证脱敏正确性 — redactSecrets 对 JSON 字符串凭证不脱敏

- **现象**：`redactSecrets('{"ak":"AKID123456","sk":"secret789","token":"TOKEN123"}')` 原样返回，`AKID123456` 明文未替换为占位符。
- **断言**：输出无明文凭证字段（AK 中段、SK 永不完整）。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:34-46` `redactString()` 的正则仅匹配 `key=value`/`key: value` 命令行形态，不覆盖 JSON `"ak":"...","sk":"...","token":"..."` 键值形态；字符串入参走 `redactString()` 而非对象路径的 `isSecretKeyName()`，JSON 凭证字段完全漏脱敏。
- **影响**：P0 安全红线，凭证可经字符串返回到对话上下文。
- **证据**：`evidence/D2-4/stdout.log`

## #2【P1】D4-27 双路径输出脱敏 — redactSecrets 不脱敏小写 ak=/sk= 简写

- **现象**：`redactSecrets("token=abc123 ak=AKID456 sk=secret789")` 返回 `token=<redacted> ak=AKID456 sk=secret789`，`ak=AKID456`、`sk=secret789` 明文未脱敏。
- **断言**：redactSecrets(策略正则) 与 redactOutput(CLI 输出) 双路径均替换明文凭证为占位符。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:42,45` 正则 `/(AK|SK)\s*[:=]/` 大小写敏感，且 `access.*key|secret.*key` 模式不覆盖小写缩写 `ak`/`sk`，导致常见简写形态漏脱敏。
- **影响**：凭证泄露风险（小写 AK/SK 简写常见于脚本与日志）。
- **证据**：`evidence/D4-27/stdout.log`

## #3【P2】D8-9 安装 ID 与遥测值脱敏 — sanitizeValue 不脱敏 AK/SK/token

- **现象**：`sanitizeValue("AK=ABC123XYZ")` 原样返回 `AK=ABC123XYZ`，`ABC123XYZ` 未替换。
- **断言**：sanitizeValue 移除 AK/SK/token 等敏感值与非法字符，不改变合法值。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:190-197` `sanitizeValue()` 仅做 `replace(/[\r\n\t]+/g,' ').trim()` 与超长截断，无任何凭证脱敏逻辑。
- **影响**：遥测事件（`value: sanitizeValue(raw.value)`）可能落盘明文凭证。
- **证据**：`evidence/D8-9/stdout.log`

## #4【P2】D4-25 Python hook 事件遥测分类 — 空格分隔写命令未命中断言为 cli:write

- **现象**：`hcloud ECS DeleteServers ...`（写操作、空格分隔）落 `cli:invoke` 而非 `cli:write`。
- **断言**：只读→cli:read、写→cli:write、其他→cli:invoke；事件含 key/value/capability。
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.py:46` `WRITE_OPERATION_RE` 的左边界 `(^|[A-Za-z0-9])` 要求写动词前是行首或字母数字，`hcloud ECS DeleteServers` 中 `Delete` 前是空格 → 不匹配；`:111-112` `is_write` 判定为 false 落入 `cli:invoke`。
- **影响**：写/破坏性命令误分类为 invoke，影响审计与安全告警。
- **证据**：`evidence/D4-25/stdout.log`

## #5【P1】D3-C7 跨区域资源操作引导 — 跨 region 创建 EIP 返回 VPC.0501（project/region 不匹配）

- **现象**：`huaweicloud_get_regional_availability(ecs, ap-southeast-3)` 返回 available=true，`plan 含 --cli-region` 通过，但实际创建 EIP 返回 `VPC.0501`（token 携带的 project `cn-north-4` 含 region 信息，与目标 `ap-southeast-3` 不匹配）。
- **断言**：跨区域命令含 `--cli-region` 且可执行；创建最小规格 EIP 成功后立即释放归零。
- **根因**：真云跨 region 执行时 IAM token 绑定 `cn-north-4` 项目，执行链未在目标 region 切换 project 上下文，导致 `ap-southeast-3` 的写操作被拒（`plugins/huaweicloud-core/src/tools.mjs` 跨区域执行/region 绑定逻辑）。
- **影响**：跨区域（香港/新加坡等）资源创建链路不可用。
- **证据**：`evidence/D3-C7/stdout.log`

## #6【P1】D3-S1 场景-只读查 ECS — serviceCatalog 意图路由未命中

- **现象**：`service_catalog({intent:'列出cn-north-4的ECS，只读不改'})` 返回 `recommendedServices=['Run hcloud --help to list available services.']`，未命中 ECS。
- **断言**：路由命中 ecs；只读命令返回实例清单；会话期间零写操作。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2574` `serviceCatalog()` 意图匹配为空 → `:2813,2827-2829` 空结果回落 `recommendedServices: ['Run hcloud --help to list available services.']`。
- **证据**：`evidence/D3-S1/stdout.log`

## #7【P1】D3-S2 场景-删 VPC 先确认 — serviceCatalog 意图路由未命中

- **现象**：`service_catalog({intent:'删除测试VPC，先列命令确认'})` 返回 `Run hcloud --help` 回落，未命中 VPC。
- **断言**：路由命中 huawei-vpc/VPC；先出命令块等待确认，确认后删除成功且归零。
- **根因**：同 #6，`tools.mjs:2574,2813,2827-2829` serviceCatalog 匹配为空。
- **证据**：`evidence/D3-S2/stdout.log`

## #8【P1】D3-S3 场景-沙箱预览出 URL — serviceCatalog 意图路由未命中

- **现象**：`service_catalog({intent:'部署当前项目到沙箱给我预览链接'})` 返回 `Run hcloud --help` 回落，未命中 Sandbox/DevStation。
- **断言**：路由命中 sandbox；check_user→sign_agreement→connect→deploy 返回公网 URL，无计费残留。
- **根因**：同 #6，`tools.mjs:2574,2813,2827-2829` serviceCatalog 匹配为空。
- **证据**：`evidence/D3-S3/stdout.log`

## #9【P2】D3-S5 场景-复合意图分层路由 — serviceCatalog 意图路由未命中

- **现象**：`service_catalog({intent:'物联网+时序数据+前端托管'})` 返回 `Run hcloud --help` 回落，未拆分命中多个 service。
- **断言**：复合意图拆分命中多个 service（DDS/GaussDB + OBS/ECS），分层推荐按预览/生产分流。
- **根因**：同 #6，`tools.mjs:2574,2813,2827-2829` serviceCatalog 匹配为空。
- **证据**：`evidence/D3-S5/stdout.log`

## #10【P1】D10-3 路由准确率+混淆矩阵 — serviceCatalog 路由准确率 0%（no-verdict）

- **现象**：eval-set 15 条中文意图逐条调 `huaweicloud_service_catalog`，无一条产生命中 verdict，`acc=0.0%`（no-verdict）。
- **断言**：路由准确率 ≥ 50%。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2574` `serviceCatalog()` 对中文意图的匹配规则（服务关键词表/意图解析）覆盖率不足，`matched` 为空 → 全量回落 `Run hcloud --help`。
- **影响**：中文自然语言意图→华为云服务路由整体失效，影响多 skill 能力发现。
- **证据**：`evidence/D10-3/stdout.log`

## #11【P1】EXP-E01 云主机查询意图路由 — serviceCatalog 意图路由未命中

- **现象**：`service_catalog({intent:'帮我查一下我账号在华北北京四有哪些云主机'})` 返回 `Run hcloud --help` 回落，未命中 ECS。
- **断言**：路由命中 ECS/云主机查询。
- **根因**：同 #6，`tools.mjs:2574,2813,2827-2829` serviceCatalog 匹配为空。
- **证据**：`evidence/EXP-E01/stdout.log`

## #12【P1】D3-C1 ECS 生命周期 E2E — 删除提交后轮询窗口未确认归零

- **现象**：真云 ECS（c6.large.2）创建成功（返回 serverIds）后，`DeleteServers` 提交删除，轮询窗口内仍显示「仍在/未确认」，脚本最终 FAIL；VPC/subnet 正常删除。本轮已二次人工删除（`DeleteServers --servers.1.id=4bc00a0f…`）并验证 `ListServersDetails` 中本次创建实例消失。
- **断言**：创建资源 100% 释放并归零验证通过。
- **根因**：ECS 异步删除确认窗口不足/删除未在轮询期内确认（真云清理时序），属真机执行链的归零确认健壮性问题；资源已在本轮人工补齐删除。
- **影响**：若无人值守可能遗留计费资源（红线）。
- **证据**：`evidence/D3-C1/stdout.log`

## #13【非产品缺陷】D3-C2 OBS 静态站部署 E2E — 建桶断言 exit-code 判据不一致（测试侧）

- **现象**：obs 建桶实际成功（输出 `Create bucket ... successfully` 且后续「删桶归零」成功），但 `realcloud_e2e.mjs` 的「OBS建桶」步 exit-code 判据判 false。
- **断言**：建桶→置静态站→读取验证→删桶归零全链路成功。
- **根因**：测试断言以 obs CLI exit code 为判据，与「successfully」文本成功不一致（测试侧判定问题，非产品缺陷）。
- **说明**：资源已归零（删桶成功），不计入产品缺陷提单。
- **证据**：`evidence/D3-C2/stdout.log`