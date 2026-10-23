# FINDINGS — 缺陷发现清单（AtomCode-deepseek-v4-pro-0813）

> **落盘路径**：`results/AtomCode/2026-10-23-120.46.222.180/Linux/FINDINGS.md`
> **生成时间**：2026-10-23 05:40（北京时间）
> **被测版本**：huaweicloud-devkit `1.1.12`（gitHead `4ed07801`）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，格式严格遵循。

---

## #1【P0】D2-4 凭证脱敏正确性（JSON 键值形态漏脱敏）

- **现象**：`redactSecrets('{"ak":"AKID123456","sk":"secret789","token":"TOKEN123"}')` 原样返回，明文凭证未脱敏。
- **断言**：JSON 字符串中的凭证值应被 `<redacted>` 替换，输出不得含明文 `AKID123456`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:34-62` —— `redactString()` 的正则只匹配无引号键形态 `key[:=]value`，第 42 行 token 正则、第 45 行 `(AK|SK)` 正则均未处理 JSON 引号键 `"ak":"..."`（键与分隔符 `:` 之间多了引号，导致 `\s*[:=]` 不命中）；对象路径的 `isSecretKeyName` 仅对 JS 对象生效，字符串形态裸奔。
- **影响**：I 类红线违规，凭证明文可能进入对话/日志外泄。
- **证据**：`evidence/D2-4/stdout.log`

## #2【P1】D4-27 双路径输出脱敏（小写 ak/sk 漏脱敏）

- **现象**：`redactSecrets("token=abc123 ak=AKID456 sk=secret789")` 返回 `token=<redacted> ak=AKID456 sk=secret789`，`token` 被脱敏但 `ak`/`sk` 漏脱敏。
- **断言**：输出不得含明文 `AKID456`/`secret789`，应全部 `<redacted>`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:45` —— `replace(/(AK|SK)\s*[:=]\s*(...)/g, ...)` 缺少 `/i` 大小写不敏感修饰，仅匹配大写 `AK`/`SK`，小写 `ak=`/`sk=` 不命中（`token` 因第 42 行带 `/gi` 而被正确脱敏）。
- **影响**：小写键形式的 AK/SK 明文外泄。
- **证据**：`evidence/D4-27/stdout.log`

## #3【P1】D3-S1 场景-只读查ECS（中文意图未路由）

- **现象**：「查我账号在北京四有哪些云主机」→ `huaweicloud_service_catalog` 返回 `Run hcloud --help to list available services.`（MISS）。
- **断言**：中文只读 ECS 意图应路由到 `ECS`，不得回落 help。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2188-2443` —— `serviceCatalog()` 关键词路由表仅含英文 token（`ecs`/`server`/`vm`…），中文语段无同义词/分词命中，回落第 2443 行 `Run hcloud --help`。
- **影响**：中文用户只读查询意图无法路由，功能不可用。
- **证据**：`evidence/D3-S1/stdout.log`

## #4【P1】D3-S2 场景-删VPC先确认（中文意图未路由）

- **现象**：「删除测试VPC，先列命令确认」意图路由 MISS，返回 `Run hcloud --help`。
- **断言**：删除 VPC 意图应路由到 `VPC` 并触发确认审批语义。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2188-2443` —— 同 #3，CJK 语段粘连未命中英文 `vpc` token。
- **影响**：中文删除类高危意图无法进入审批流，存在误操作风险。
- **证据**：`evidence/D3-S2/stdout.log`

## #5【P1】D3-S3 场景-沙箱预览出URL（中文意图未路由）

- **现象**：沙箱预览类中文意图路由 MISS，返回 `Run hcloud --help`。
- **断言**：沙箱预览意图应路由到 `Sandbox`/`DevStation`。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2188-2443` —— 同 #3，`sandbox` 中文同义词缺失。
- **影响**：中文沙箱预览部署意图不可用。
- **证据**：`evidence/D3-S3/stdout.log`

## #6【P1】EXP-E01 评测-中文「云主机」意图未路由

- **现象**：「帮我查一下我账号在华北北京四有哪些云主机」→ `service_catalog` 返回 `Run hcloud --help`（MISS）。
- **断言**：中文「云主机」意图应命中 `ECS查询` 路由，不得 MISS。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2188-2443` —— 同 #3，中文「云主机」无英文 `ecs` token 同义词映射。
- **影响**：评测集路由准确率下降。
- **证据**：`evidence/EXP-E01/stdout.log`

## #7【P1】D9-9 tools/call 取消能力未声明（SPEC-MISMATCH）

- **现象**：`mcp-protocol.mjs` initialize 响应 capabilities 仅声明 `tools: {}`，无 `cancellation`/超时语义。
- **断言**：capabilities 应按协议声明取消能力；超时应返回 `{code:-32000, message 含 'timeout'}`。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:47-49` —— `capabilities` 对象缺失 `cancellation` 声明，实现与设计契约漂移。
- **影响**：客户端无法探知取消能力，协议语义不完整。
- **证据**：`evidence/D9-9/stdout.log`

## #8【P2】D3-S5 场景-复合意图分层路由（中文复合意图未路由）

- **现象**：中文复合意图（存储+托管分层推荐）路由 MISS，返回 `Run hcloud --help`。
- **断言**：复合意图应命中多个 service 并按预览/生产分层推荐，不得回落 help。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2188-2443` —— 同 #3，中文复合意图无法拆分命中。
- **影响**：中文复合场景路由失败。
- **证据**：`evidence/D3-S5/stdout.log`

## #9【P2】D4-25 Python hook 事件遥测分类（写命令边界未命中）

- **现象**：空格分隔的写命令未命中 `WRITE_OPERATION_RE`，事件被分类为 `cli:invoke` 而非 `cli:write`。
- **断言**：写命令应分类为 `cli:write`（事件 key 正确）。
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.py:46` —— `WRITE_OPERATION_RE` 的边界锚 `(^|[A-Za-z0-9])` 要求写前缀前是行首或字母数字，空格分隔导致前缀前是空格时不命中；结合第 111-112 行分类逻辑落入 `cli:invoke`。
- **影响**：写操作遥测分类错误，安全监控漏判。
- **证据**：`evidence/D4-25/stdout.log`

## #10【P2】D8-9 安装ID与遥测值脱敏（sanitizeValue 未脱敏 AK/SK）

- **现象**：`sanitizeValue("AK=ABC123XYZ")` 原样返回 `AK=ABC123XYZ`，未脱敏。
- **断言**：sanitizeValue 应移除 AK/SK/token 等敏感值，输出不得含明文。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:189-196` —— `sanitizeValue()` 仅做 `[\r\n\t]+` 去空白、trim、长度截断，未实现 AK/SK/token 敏感值剔除。
- **影响**：遥测上报含明文 AK，凭证泄露风险。
- **证据**：`evidence/D8-9/stdout.log`

## #11【测试侧】D3-C1 ECS生命周期E2E（归零验证窗口不足，资源已归零）

- **现象**：ECS/VPC/子网创建及审批分类均通过，但 `finally归零` 在轮询窗口内未确认 ECS 删除（`ECS轮询:仍在/未确认`）；经补删 `DeleteServers`（serverId `3a5fb502-c380-4b0a-a0ad-68644ca8903e`）后已用 `ListServersDetails` 确认该 ECS 消失，VPC/子网已删，账号内无残留（剩余 ECS 均为其他 agent 归属）。
- **说明**：真云 ECS 异步删除延迟超探针轮询窗口；非源码缺陷，测试侧轮询窗口偏短。
- **证据**：`evidence/D3-C1/stdout.log`

## #12【测试侧】D3-C2 OBS静态站部署E2E（建桶 exit-code 假阴性，建删成功）

- **现象**：「OBS建桶」一步 `pass:false`，但 stdout 显示 `Create bucket [...] successfully`，且后续 set/get/删桶均通过、删桶归零成功。
- **说明**：`hcloud OBS mb` 成功建桶但返回非零 exit-code，`mb.ok` 断言误判；桶已实际建立并删除归零。测试侧断言问题，非产品缺陷。
- **证据**：`evidence/D3-C2/stdout.log`

## #13【测试侧】D3-C3 沙箱部署E2E（deploy_nginx 端口占用 8080→8083）

- **现象**：`deploy_nginx` 请求端口 8080，返回 `static:8083` 且 `ok:false`，但 `deploy_check` 显示 nginx 已服务（PASS）。
- **说明**：沙箱内 8080 被上传文件服务器占用导致端口漂移；部署与 URL 验证实际通过。测试侧环境端口冲突，非产品缺陷。
- **证据**：`evidence/D3-C3/stdout.log`

## #14【测试侧】D3-C7 跨区域资源操作引导（跨区域创建需多区域项目，账号仅 cn-north-4）

- **现象**：`get_regional_availability`/`plan含--cli-region`/只读查询均通过，但创建 EIP 在 `ap-southeast-3` 返回 `VPC.0501`（token 项目为 `cn-north-4` 与目标区域不匹配，4/5 通过）。
- **说明**：跨区域创建需目标区域项目，当前统一账号仅 `cn-north-4` 项目，环境限制；`get_regional_availability` 已声明「service-level availability only」不含账号项目绑定。非产品缺陷。
- **证据**：`evidence/D3-C7/stdout.log`