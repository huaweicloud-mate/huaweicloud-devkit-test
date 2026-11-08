# FINDINGS — 缺陷发现清单（AtomCode-deepseek-v4-pro-0813）

> **落盘路径**：`results/AtomCode/2026-11-09-120.46.222.180/Linux/FINDINGS.md`
> **生成时间**：2026-11-09 05:24:09（北京时间）
> **被测对象**：huaweicloud-devkit `v1.1.14-next.0`（npm @next，gitHead `ac955889`，PR #1111）
> **执行归档**：`results/AtomCode/2026-11-09-120.46.222.180/Linux/`

---

## #1【P0】D2-4 凭证脱敏正确性：JSON 字符串形式凭证（含小写键 ak/sk/token）不被脱敏，原始 AK/SK/token 完整泄露

- **现象**：`redactSecrets('{"ak":"AKID123456","sk":"secret789","token":"TOKEN123"}')` 返回原文，`AKID123456`/`secret789`/`TOKEN123` 全部未脱敏（证据 stdout.log `actual` 字段）。
- **断言**：输入含 `AKID123456` 的凭据后，输出不得包含 `AKID123456`（应被 `<redacted>` 替换）。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:34-47` `redactString()` 只匹配**未加引号键**的 `key=value` / `key: value` 形式（:42），且 `(AK|SK)` 正则未加 `i` 标志、仅覆盖大写键名（:45）。JSON 对象字符串 `{"ak":"..."}` 的引号键 + 小写 `ak`/`sk` 均不在覆盖范围内，故整串原样返回。
- **影响**：凭证脱敏能力对 JSON 序列化凭据失效，存在 AK/SK/token 泄露风险（P0）。
- **证据**：`evidence/D2-4/stdout.log`、`evidence/D2-4/probe.mjs`

## #2【P1】D4-27 双路径输出脱敏：小写 `ak=`/`sk=` 不被脱敏，仅 `token=` 被脱敏

- **现象**：`redactSecrets("token=abc123 ak=AKID456 sk=secret789")` 输出 `token=<redacted> ak=AKID456 sk=secret789`，`AKID456`/`secret789` 泄露。
- **断言**：输入含 `ak=AKID456` 后，输出不得包含 `AKID456`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:45` `/(AK|SK)\s*[:=]\s*(...)/g` 未加 `i` 标志，仅匹配大写 `AK=`/`SK=`，小写 `ak=`/`sk=` 不命中。
- **影响**：同一输出 `token` 被脱敏而 AK/SK 裸奔，双路径（对象/字符串）脱敏行为不一致，残留凭证泄露风险。
- **证据**：`evidence/D4-27/stdout.log`、`evidence/D4-27/probe.mjs`

## #3【P2】D8-9 安装 ID 与遥测值脱敏：`sanitizeValue` 完全不脱敏任何键值（仅截断空白/长度）

- **现象**：`sanitizeValue("AK=ABC123XYZ")` 返回 `AK=ABC123XYZ` 原样，`ABC123XYZ` 泄露。
- **断言**：遥测 sanitize 含 `AK=...`/`SK=...` 时，输出不得包含明文值。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:190-199` `sanitizeValue()` 仅做 `[\r\n\t]+`→空格 与 `MAX_VALUE_LENGTH` 截断，未实现任何 `AK`/`SK`/secret 键名脱敏。
- **影响**：遥测上报路径对敏感键值不脱敏，存在凭证/安装 ID 泄露风险。
- **证据**：`evidence/D8-9/stdout.log`、`evidence/D8-9/probe.mjs`

## #4【P2】D4-25 Python hook 事件遥测分类：空格分隔写命令未被分类为 `cli:write`

- **现象**：命令 `hcloud ECS DeleteServers --delete-all ...` 经 Python hook 后遥测事件未归类为 `cli:write`（实测无 `cli:write` key）。
- **断言**：`hcloud ECS DeleteServers`（写操作）应被 `WRITE_OPERATION_RE` 命中并分类为 `cli:write`。
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.py:46` `WRITE_OPERATION_RE` 的前向边界 `(^|[A-Za-z0-9])` 在空格分隔命令 token 场景未命中，分类落到 `cli:invoke`。
- **影响**：Python hook 侧写命令遥测分类不准确，影响安全审计/分类统计口径。
- **证据**：`evidence/D4-25/stdout.log`、`evidence/D4-25/probe.mjs`

## #5【P1】D3-S1/D3-S2/D3-S3/D3-S5 + EXP-E01 serviceCatalog 中文意图含英文服务名（ECS/VPC 等）时路由 miss，返回 fallback

- **现象**：意图「列出cn-north-4的ECS，只读不改」「帮我查一下我账号在华北北京四有哪些云主机」「删VPC先确认」「沙箱预览出URL」等经 `huaweicloud_service_catalog` 后返回 `Run hcloud --help to list available services.`（未命中路由）。
- **断言**：含 ECS/VPC/沙箱等明确服务语义的中文意图应命中对应服务，不得返回 fallback。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2546` 分词 `it.split(/[\s,./-]+/)` 对「中文+英文无空格」不切分英文 token，英文关键词仅按 `tokens.has(kw)` 全等匹配（非 CJK 关键词不走 `it.includes` 子串匹配，见 :2550-2554）；叠加关键词覆盖缺口（如 `云主机` 缺失）。命中为空 → fallback `tools.mjs:2572`。
- **影响**：评测/场景用例中文意图路由准确率下降，真实 Agent 会话无法路由到正确 skill。
- **证据**：`evidence/D3-S1/stdout.log`、`evidence/D3-S2/stdout.log`、`evidence/D3-S3/stdout.log`、`evidence/D3-S5/stdout.log`、`evidence/EXP-E01/stdout.log` 及各自 `probe.mjs`

## #6【P1】D9-9 tools/call 超时协议语义与取消：`mcp-protocol.mjs` 未声明 cancellation/notifications/cancel

- **现象**：`mcp-protocol.mjs` 源码不包含 `cancellation`/`notifications`/`cancel` 任一能力声明。
- **断言**：MCP 协议实现应在协议能力面声明取消/超时语义。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs` 未实现/未声明 tools/call 超时与取消语义（SPEC-MISMATCH，契约漂移待裁决）。
- **影响**：tools/call 长时间调用无法由客户端取消，超时协议语义缺失。
- **证据**：`evidence/D9-9/stdout.log`、`evidence/D9-9/probe.mjs`

## #7【P1】D3-C7 跨区域资源操作引导：目标区域写操作因 IAM token 项目绑定不匹配失败，引导未提前预警

- **现象**：`get_regional_availability(ecs,ap-southeast-3)` 返回 `available=true`、`plan` 带 `--cli-region=ap-southeast-3`，但最小 EIP 创建返回 `VPC.0501`（token 项目 cn-north-4 与目标区域不匹配）创建失败。
- **断言**：跨区域写操作前，产品应识别目标区域与 token 项目不匹配并引导切换，而非直接放行失败。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs`（`huaweicloud_get_regional_availability`/`huaweicloud_plan_cli_command`）仅校验服务级可用性（静态 cache 声明 ecs available），未校验目标区域 IAM 项目绑定。
- **影响**：跨区域资源创建/引导场景失败，用户按 `available=true` 继续会得到 backend 报错。
- **证据**：`evidence/D3-C7/stdout.log`、`evidence/D3-C7/probe.mjs`

## #8【测试侧】D3-C1 真云 ECS 生命周期 E2E：finally 归零轮询未确认 ECS 删除，遗留 ACTIVE ECS（本次已人工补删归零）

- **现象**：`finally归零(校验真实删除)` 返回 false，detail=`ECS:提交删除 ECS轮询:仍在/未确认 subnet:OK vpc:OK`；实测账号残留 ACTIVE ECS（`testbot3-hermes-ecs-4172095704`，id `573a8a02-e019-4b39-a5c6-4e53986299ed`）。
- **说明**：`scripts/realcloud_e2e.mjs` finally 归零在有限轮询窗口（150s）内未确认 ECS 进入 DELETED 即判失败；属测试脚本清理/判停缺陷，非产品缺陷。**资源已由测试侧人工补删并归零验证通过**（ECS id 经 `hcloud ECS ListServersDetails` 核查不存在，VPC/subnet 已删除）。
- **证据**：`evidence/D3-C1/stdout.log`、`evidence/D3-C1/probe.mjs`

## #9【测试侧】D3-C2 OBS 静态站部署 E2E：「OBS建桶」步骤断言误判 false（建桶实际成功，后续 set/get/删桶归零均 PASS）

- **现象**：`OBS建桶` `pass=false`，但 detail 明确返回 `Create bucket [...] successfully`（request id 非空），`set静态站`/`get静态站`/`删桶归零` 均 `pass=true`，桶最终成功删除。
- **说明**：`scripts/realcloud_e2e.mjs`「OBS建桶」断言对返回结构/关键字匹配有误，属测试脚本断言缺陷，非产品缺陷。
- **证据**：`evidence/D3-C2/stdout.log`、`evidence/D3-C2/probe.mjs`
