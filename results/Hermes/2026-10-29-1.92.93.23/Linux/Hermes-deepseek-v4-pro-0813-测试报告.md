# Hermes-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`Hermes-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-29 05:20（北京时间）
> **执行归档**：`results/Hermes/2026-10-29-1.92.93.23/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：**FAIL**（P0 缺陷 4 项 + P0 SPEC 1 项，安全层存在凭证脱敏/审批门/协议握手缺口）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Hermes + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64（Ubuntu 6.8.0-106） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | v1.1.12（npm latest 正式版，gitHead `4ed07801`） |
| 工具全集 | 46（`tools/list` 实测枚举） |
| hcloud / 依赖 | hcloud 7.2.12（plugin 配对 7.3.12，提示 install-hcloud） |
| 真云凭证 | cn-north-4（AKSK 管理员 hw018619646 + test001 只读子账号） |
| 测试类型 | 源码级探针 / 真机 CLI（install/help/status）/ MCP 协议 / 真云 E2E |
| daily 用例 | 设计级 107 / 展开级 43 |

> **执行方法**：探针脚本（.mjs/.sh）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数与 MCP 服务，决策/结果落 `stdout.log`；真机 CLI 隔离 HOME 安装/doctor；真云 E2E 最低配置建删资源并归零验证（tctest-hermes-* 前缀）；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 150（设计级 107 + 展开级 43） |
| 已执行 | 150 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 126 / 17 / 3 / 3 / 1 |
| 通过率（分母 = PASS+FAIL+SPEC，不含 BLOCKED/NOT_RUN） | **86.3%**（126/146） |
| P0 / P1 / P2 缺陷 | P0×4（FAIL）/ P1×9 / P2×4（FAIL）；SPEC×3（P0×1 + P1×1 + P2×1） |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（ECS/VPC/子网/OBS/EIP 均删除并 List 归零确认，零残留） |

---

## 三、状态汇总

### 3.1 设计级（107）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 86 | 有证据且通过 PASS 门禁 |
| FAIL | 14 | 不符预期，根因见缺陷清单 |
| BLOCKED | 3 | 沙箱服务维护（外部依赖） |
| SPEC-MISMATCH | 3 | 契约漂移，待裁决 |
| NOT_RUN | 1 | D1-39 Windows 专属（OS 列标注「专属」） |
| **合计** | **107** | |

### 3.2 展开级（43）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 40 | 有证据且通过 PASS 门禁 |
| FAIL | 3 | EXP-E01 / EXP-C4-14 / EXP-C4-18 |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **43** | |

---

## 四、缺陷清单（详见表）

| # | 级别 | 用例ID | 缺陷描述 | 根因（文件:行号） |
|---|---|---|---|---|
| 1 | P0 | D2-4 | JSON 带引号 key 凭证脱敏失效 | `src/safety-policy.mjs:42-45` redactString 不匹配 JSON 带引号 key |
| 2 | P0 | D4-2 | 裸 access_key/HW_ 前缀 env 打印漏拦截 | `safety/rules/cloud-risk-rules.json:39` env-dump 仅匹配带前缀 |
| 3 | P0 | D4-21 | HCL actions=["*"]/托管策略引用漏拦截 | `safety/rules/cloud-risk-rules.json` hwc-iam-admin-policy 仅匹配 JSON Action:* |
| 4 | P0 | D9-12 | 非法时序未拒绝(-32600) + initialize 不接版本检查 | `src/mcp-protocol.mjs` 无 initialize 前置状态机 |
| 5 | P1 | D4-4 | Change* 变更类动词漏拦截 | `safety/policy.json:27-61` writeOperationPrefixes 缺 Change |
| 6 | P1 | D4-6 | admin-pass command 阶段未覆盖 | `safety/rules/cloud-risk-rules.json:72` stages 缺 command |
| 7 | P1 | D4-17 | hook 模糊输入 fail-open | `src/risk-rule-engine.mjs` 无规则命中默认 allow |
| 8 | P1 | D3-C4 | DMS/DEW list_operations 无路由 | `src/tools.mjs` list_operations DMS/DEW 无 command/result |
| 9 | P1 | D3-S7 | RDS db.password 缺失+部署目标分解缺失 | `src/tools.mjs` CreateInstance 缺 db.password |
| 10 | P1 | D10-3 | 路由准确率 92.9%(1 MISS) | `src/tools.mjs` routeMap 缺「云主机」 |
| 11 | P1 | EXP-E01 | 「云主机」中文意图路由 MISS | `src/tools.mjs` ECS routeMap 缺「云主机」 |
| 12 | P1 | EXP-C4-14 | DMS list_operations 无路由 | `src/tools.mjs` |
| 13 | P1 | EXP-C4-18 | DEW list_operations 无路由 | `src/tools.mjs` |
| 14 | P2 | D3-S5 | 复合意图多路命中失败 | `src/tools.mjs` serviceCatalog 单意图匹配 |
| 15 | P2 | D3-S6 | CreateFunction 缺 function_name | `src/tools.mjs` FunctionGraph 最小参数集 |
| 16 | P2 | D4-25 | 写操作遥测分类 cli:invoke | `hooks/huaweicloud-safety.py` WRITE_OPERATION_RE |
| 17 | P2 | D4-26 | findings.evidence 明文残留 | `src/risk-rule-engine.mjs` redactEvidence |
| S1 | P0 | D10-4 | 规则计数契约滞后(16→19) | `safety/rules/cloud-risk-rules.json`(SPEC) |
| S2 | P1 | D9-9 | 取消能力未声明(SPEC) | `src/mcp-protocol.mjs` capabilities 仅 {tools:{}} |
| S3 | P2 | D8-9 | sanitizeValue 未脱敏 AK/SK/token(SPEC) | `src/telemetry/telemetry.mjs` |

> 根因详情（文件:行号 + 现象 + 断言 + 证据）见 `FINDINGS.md`（file_issue.py 解析输入）。

---

## 五、未执行用例与原因（供维护 agent 修改用例）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D1-39 | 设计级 | P0 | NOT_RUN | 调归属 | Windows 升级检测链 EINVAL 专属（OS 列标注「专属」），Linux 侧由展开级 EXP-NR3-10 覆盖（本轮 EXP-NR3-10 已 PASS：queryDistTags 无 EINVAL/异常） | — |
| D3-C3 | 设计级 | P1 | BLOCKED | 补环境 | 华为云沙箱服务维护中（HDKIT_SANDBOX_MAINTENANCE：「沙箱功能正在升级优化」），connect 无法建立会话；解除条件=沙箱服务恢复 | — |
| D3-C6 | 设计级 | P1 | BLOCKED | 补环境 | 同上，7 隐式工具 check_user/connect/credentials/sign_agreement/upload_file/exec_one_shot/deploy_check 均无法执行；解除条件=沙箱服务恢复 | — |
| D3-S3 | 设计级 | P1 | BLOCKED | 补环境 | 同上，check_user 返回 realnameVerified=undefined；解除条件=沙箱服务恢复 | — |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：0（探查过程无真实 AK/SK 明文写入证据，探针统一脱敏）
- [x] 写操作误判 read-only：0（DeleteServer/CreateVpc 等写操作均被判 write/deny 或需审批）
- [x] 红线（I 类）违规：无
- [x] 脱敏复核：真云 E2E 证据输出经 redact 处理，无原始 AK/SK/token 残留

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC（D3-C1/D3-S2/D4-14） | 是 | 已删 | ListVpcs 不含本次资源（containsOwn=false） |
| 子网（D3-C1） | 是 | 已删 | 随 VPC 删除归零 |
| ECS（D3-C1） | 是 | 已删 | ListServersDetails 不含本次资源，删除含磁盘(delete_volume=true) |
| OBS（D3-C2/D3-C13） | 是 | 已删 | bucket removed 确认 + rm -rf 清对象 |
| EIP（D3-C7） | 是 | 已删 | DeletePublicip 释放 |
| FunctionGraph/RDS（D3-S6/D3-S7） | 未建（参数报错） | — | CreateFunction/CreateInstance 报 [USE_ERROR] 未产生资源，零残留 |
| 沙箱 | 未建 | — | 服务维护中，无会话可建 |

> 真云只删本次创建资源（tctest-hermes-* 前缀），删除前盘点 + 白名单，零残留。

---

## 八、遗留与建议

- 待裁决 SPEC：D9-9（取消能力未声明）、D8-9（sanitizeValue 脱敏）、D10-4（规则计数口径 16→19）。
- 本轮覆盖范围：源码级探针（安全/协议/安装/认证/功能/性能）+ 真机 CLI + MCP 协议 + 真云 E2E（ECS/OBS/VPC/EIP 建删归零）；沙箱类用例（D3-C3/C6/S3）因服务维护 BLOCKED。
- 备注：D4-13「最小权限凭证通过率」本轮实测 readPassRate=100%（6/6，含 CES ListMetrics），写操作 PolicyNotAuthorized 拒绝、归零确认；较上轮 CES 只读被拒已有改善。
- 建议：D10-4/D6-4 等用例断言存在计数口径滞后，建议维护 agent 同步规则库/工具数口径，避免测试断言与实现漂移。