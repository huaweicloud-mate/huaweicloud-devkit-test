# OpenCode-DeepSeek-V4.1-Flash-1017 每日测试报告
> **报告名**：`OpenCode-DeepSeek-V4.1-Flash-1017-测试报告.md`
> **生成时间**：2026-11-22 05:10:30（北京时间）
> **执行归档**：`results/OpenCode/2026-11-22-119.8.181.45/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 2 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenCode` + `DeepSeek-V4.1-Flash-1017` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `huaweicloud-devkit@1.1.15`（hdk 源码 @ `bf79b643`，与 origin/main 一致） |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：按 daily 精确用例逐条执行，证据按 `evidence/<case-id>/{probe.mjs,stdout.log}` 落盘。源级直调（import hdk `plugins/huaweicloud-core/src/*.mjs`）、MCP JSON-RPC（spawn `mcp-server.mjs` 调 40 个 `huaweicloud_*` 工具）、CLI 真机（`hcloud`/`npx`）、真云 E2E（ECS/VPC 真实建删并归零）四类混合；每个 PASS 均实际执行 + 证据落盘 + evidencePath 回填。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `122 / 14 / 8 / 2 / 0` |
| 通过率（分母 = PASS+FAIL = 136） | `89.7%` |
| P0 / P1 / P2 新增缺陷 | `2 / 10 / 2`（其中真实产品缺陷 P0 2 / P1 5 / P2 2） |
| 红线（I 类）违规 | `0`（无凭证明文泄漏、无假 PASS、无未清理残留） |
| 资源释放 | `已归零`（本次 D3-S2 创建 tctest-s2 VPC 已删除；ECS/EIP/SG/EVS 复核无本次残留） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `85` | 有证据且通过 PASS 门禁 |
| FAIL | `12` | 不符预期，根因见缺陷清单 |
| BLOCKED | `8` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `2` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `37` | 有证据且通过 PASS 门禁 |
| FAIL | `2` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D1-39` | D1安装 | Windows 升级检测链可用性 | `update-check.mjs:81` 解析 npm.cmd banner 失败→`116/120` check_failed | 历史问题 |
| 2 | P0 | `D4-19` | D4安全 | 确认流下预检仍生效 | `tools.mjs:1428`/`hcloud-cli.mjs:371` 未合并 `evaluateCommandRisk` | 历史问题 |
| 3 | P1 | `D2-10` | D2认证 | profile 参数格式 | `tools.mjs:2132`（`--cli-profile` 空格两参，应 `=default`） | 历史问题 |
| 4 | P1 | `D3-B3` | D3功能 | run_readonly 凭证来源 | `tools.mjs:1186` + `hcloud-cli.mjs:300` 占位 S1 覆盖 profile | 历史问题 |
| 5 | P1 | `D4-8` | D4安全 | Python/Node 策略一致 | `tools.mjs:1448` 仅跑风险引擎，未合并 classifyTextCommand | 历史问题 |
| 6 | P1 | `D10-3` | D10评测 | 路由准确率 86.7% | `tools.mjs:2574/2576/2805` 同义词/排障意图缺失 | 历史问题 |
| 7 | P1 | `EXP-E01` | D10展开 | 云主机意图未命中 ECS | 并入 #6（`tools.mjs:2576` routeMap 缺「云主机」） | 历史问题 |
| 8 | P1 | `EXP-E08` | D10展开 | 启动失败排障未命中 explain_error | 并入 #6（routeMap 缺排障意图词） | 历史问题 |
| 9 | P1 | `D9-9` | D9协议 | capabilities 取消能力（SPEC） | `mcp-protocol.mjs:60` capabilities 仅 `tools` | 契约确认 |
| 10 | P2 | `D1-68` | D1安装 | 区域环境变量优先级 | `credentials.mjs:225`（`HW_REGION` 先于 `HUAWEICLOUD_REGION`） | 历史问题 |
| 11 | P2 | `D8-9` | D8质量 | 遥测值脱敏 | `telemetry/telemetry.mjs:190` 仅去控制字符 | 历史问题 |
| 12 | 非产品 | `D3-C7` | D3功能 | 不存在实例错误码 | 外源 ECS API 返回 fault 文本，非 devkit | 非产品缺陷 |
| 13 | 非产品 | `D3-C1` | D3功能 | ECS 生命周期 E2E | 用例测试数据 flavor `as7.medium.2` 已废弃（Ecs.0019） | 非产品缺陷 |
| 14 | 非产品 | `D3-S2` | D3功能 | 删 VPC 先确认 | 探针 `HW_*` env 未生效→回退管理员 profile 创建成功（已清理） | 非产品缺陷 |
| 15 | 非产品 | `D4-13` | D4安全 | 最小权限凭证通过率 | 写操作被 flavor 校验拦截（Ecs.0019），未证 IAM 拒绝 | 非产品缺陷 |
| 16 | 非产品 | `D10-4` | D10评测 | 规则库计数（SPEC） | 实为 9 deny+10 warn，用例契约 9+7 漂移 | 契约确认 |

### 根因详情

| 用例 | 期望 | 实际 | 证据 |
|---|---|---|---|
| `D1-39` | `judgeUpdate().result ∈ {update_available,up_to_date}` | `distTags=null, result=check_failed` | `evidence/D1-39/stdout.log` |
| `D4-19` | 22 端口对 0.0.0.0/0 返回 deny finding | `classification.deny` 但 `sgFindings=[]` | `evidence/D4-19/stdout.log` |
| `D2-10` | `args=["--cli-profile=default"]` 退出码 0 | 两参数传入，KooCLI `USE_ERROR` | `evidence/D2-10/stdout.log` |
| `D3-B3` | `run_readonly_command` ok=true 返回清单 | `ok=false APIGW.0301`，直连 hcloud count=1 | `evidence/D3-B3/stdout.log` |
| `D4-8` | 两路径 decision 一致 | 源码 `deny` vs MCP 工具 `warn` | `evidence/D4-8/stdout.log` |
| `D10-3` | 路由准确率 ≥90% | 86.7%（13/15，miss EXP-E01/E08） | `evidence/D10-3/stdout.log` |
| `D9-9` | capabilities 声明取消能力 | `capabilities={"tools":{}}` | `evidence/D9-9/stdout.log` |
| `D1-68` | `HUAWEICLOUD_REGION` 优先 | 取到 `HW_REGION=cn-north-4` | `evidence/D1-68/stdout.log` |
| `D8-9` | token/password 脱敏为占位符 | `abc123`/`Passw0rd` 原样保留 | `evidence/D8-9/stdout.log` |
| `D3-C7` | 精确错误码 `Ecs.0200` | `fault: could not be found`（外源） | `evidence/D3-C7/stdout.log` |
| `D3-C1` | ECS 创建→删除→归零 | flavor 废弃 `Ecs.0019`，未创建，零残留 | `evidence/D3-C1/stdout.log` |
| `D3-S2` | 只读凭证拒绝 + 无残留 | 管理员 profile 创建成功，已清理 | `evidence/D3-S2/stdout.log` |
| `D4-13` | 写操作被 IAM 拒绝 `Pdp.0001` | `Ecs.0019` flavor 废弃，未证拒绝 | `evidence/D4-13/stdout.log` |
| `D10-4` | 9 deny + 7 warn | 9 deny + 10 warn | `evidence/D10-4/stdout.log` |

---

## 五、未执行用例与原因


### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D3-C2` | D3功能 | OBS静态站部署E2E | OBS 凭证同步成功，但静态站部署闭环无法执行：KooCLI 无 OBS 建桶命令（OBS 非 KooCLI 服务，需 obsutil） + 本机无 obsutil 可执行文件（where obsutil 未找到，OBS 桶创建/上传/public-read/curl 200/清理无法真实执行） + 现有唯一可用凭证为只读 IAM 用户 test001（写操作 Pdp.0001），未创建任何桶、云端零残留。解除条件：安装 obsutil 并下发具备 OBS 写权限的 AK/SK |
| `D3-C3` | D3功能 | 沙箱部署E2E | DevStation 沙箱上游不可用：HDKIT_UPSTREAM_ERROR: 查询实名状态失败 [trace: 1dd93323496d40dd9778f67d0c4d2f55]；解除条件：HDKIT 服务恢复实名状态查询 |
| `D3-C6` | D3功能 | 沙箱 7 隐式工具具名冒烟（check_user/credentials/sign_agreement/exec_one_shot/upload_file/close_session/deploy_check） | 7 个沙箱工具均已注册，但 check_user 上游失败：HDKIT_UPSTREAM_ERROR: 查询实名状态失败 [trace: 782f175385874d1ab60436290c21f3fa]；解除条件：HDKIT 服务恢复 |
| `D3-C14` | D3功能 | 沙箱 HDKit 服务参数与 hwlink 凭证 | 沙箱上游不可用："Credential validation failed before injection: IAM rejected the credentials (HTTP 401: {\"error_msg\":\"Incorrect IAM authentication information: Unauthorized\",\"error_code\":\"APIGW.0301\",\"request_id\":\"64ec64b83b35c097ca7747b7819955de\"}\n). The AK/SK is invalid - check the SK for typos or expired security tokens." / "timeout-25s: sandbox_connect 无响应"；解除条件：HDKIT 服务恢复 |
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | 沙箱不可用，无法产出公网 URL："timeout-25s: sandbox_connect 无响应"；解除条件：HDKIT 服务恢复 |
| `D3-S4` | D3功能 | 场景-领券闭环 | 代金券接口依赖有效 AK/SK，本机凭证被拒：HDKIT_CRED_INVALID AK/SK 无效或不匹配，请检查配置 |
| `D3-S6` | D3功能 | 场景-FunctionGraph定时任务 | FunctionGraph 创建请求缺必填参数（memory_size/package/timeout），未创建函数；解除条件：补齐创建参数并具备写权限 |
| `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | 多服务编排前置阻塞：沙箱上游不可用 + test001 无 RDS 写权限（Pdp.0001），无法完成建库+部署+清理闭环 |

---

### SPEC-MISMATCH

| 用例ID | 维度 | 标题 | 漂移点 |
|---|---|---|---|
| `D9-9` | D9协议 | initialize capabilities 取消能力 | 实测 `capabilities={"tools":{}}`，设计要求声明取消/超时能力，实现无依据 |
| `D10-4` | D10评测 | 规则库计数 | 实测 9 deny + 10 warn，用例契约 9 deny + 7 warn（warn 多 3 条） |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（D2-4 `show_profile_redacted` 实测 `plaintext_leak=false`；D8-9 发现遥测脱敏缺口已列缺陷，但本次无实际明文外泄）
- [x] 写操作误判 read-only：`0`（写操作均要求 plan+approvalToken，D4-19/D4-8 为漏拦截已列缺陷）
- [x] 红线（I 类）违规：`0`（无 mock 假跑、无假 PASS、无未清理资源）
- [x] 脱敏复核：D3-B3 工具报错信息与 hcloud 输出未见 AK/SK 明文；D8-9 记为待修脱敏缺口

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC `tctest-s2`（D3-S2） | 1（`ef50a52b-…`，探针 env 未生效误创建） | 1（`hcloud VPC DeleteVpc`，exit=0） | `ListVpcs` 复核已消失，无 `tctest` 残留 |
| ECS（D3-C1/D4-13） | 0（两次均 `Ecs.0019` flavor 废弃，未创建） | 0 | `ListServersDetails` 仅剩其他测试机实例，无 `tctest`/`tctest-ro13` |
| EIP / EVS / SecurityGroup | 0 | 0 | `ListPublicips=0`、`ListVolumes=0`、`ListSecurityGroups` 仅 `default` |
| OBS 桶（D3-C2） | 0（无 obsutil，`No such command: CreateBucket`） | 0 | `no bucket created` |
| FunctionGraph（D3-S6） | 0（缺 `memory_size/package/timeout`，API 拒绝） | 0 | 无函数创建成功 |
| RDS（D3-S7） | 0（只读，未创建） | 0 | `total_count=0` |

> 结论：本次真云用例全部实际发起 API 调用，创建/删除闭环后云端无本次测试残留（仅保留其他 agent 并发运行的 `testbot3-hermes-*`/`testbot2-dsh-*` 资源，非本客户端创建，未触碰）。

---

## 八、遗留与建议

- **P0 优先修**：D1-39（Windows npm 升级检测解析）、D4-19（plan 未合并安全组风险裁定）——影响升级通知与高危端口防护，建议下个版本前修复。
- **P1**：D2-10 profile 参数格式、D3-B3 只读凭证来源、D4-8 双路径判定一致、D10-3 路由同义词/排障意图、D9-9 capabilities 取消能力（需契约确认）。
- **P2**：D1-68 区域变量优先级、D8-9 遥测脱敏。
- **用例/环境治理**：D3-C1 flavor `as7.medium.2` 已废弃需更新测试数据；D3-S2/D4-13 探针 `HW_*` env 注入 KooCLI 不生效，需改用 `run-as-readonly.py` 或 `--cli-access-key/--cli-secret-key` 注入；D3-C7 错误码断言建议改为 `fault` 文本匹配；D10-4 契约计数需与 `cloud-risk-rules.json` 对齐。
- **环境阻塞**：8 条沙箱/凭证类 BLOCKED，待 DevStation HDKIT 上游与 obsutil/写权限恢复后补测（见 §五）。
