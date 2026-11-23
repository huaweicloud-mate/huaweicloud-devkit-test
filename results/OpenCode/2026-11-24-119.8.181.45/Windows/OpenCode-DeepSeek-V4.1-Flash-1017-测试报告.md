# OpenCode-DeepSeek-V4.1-Flash-1017 每日测试报告

> **报告名**：`OpenCode-DeepSeek-V4.1-Flash-1017-测试报告.md`
> **生成时间**：2026-11-24 05:30:00（北京时间）
> **执行归档**：`results/OpenCode/2026-11-24-119.8.181.45/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（存在 P0 产品缺陷 D1-39 / D4-19 与 P0 契约漂移 D10-4）

---

## 一、测试概况

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenCode` + `DeepSeek-V4.1-Flash-1017` |
| OS / 架构 | `Windows`（Windows Server，x86_64） |
| 被测版本（SUT） | `huaweicloud-devkit@1.1.15`（npm latest，hdk 源码 HEAD `bf79b643`，release-1.1.15） |
| Node / npm / Python | `Node v22.22.2` / `npm 10.x` / `Python 3.11.9` |
| hcloud / 依赖 | `hcloud 7.3.12`；KooCLI profile `deploy`（cn-north-4） |
| 真云凭证 | `cn-north-4`（管理 AK/SK + 只读子账号 test001 均已就绪） |
| 测试类型 | 源码级探针 / 真机 hcloud CLI / MCP stdio 协议 / 真云 E2E 建删 |
| 设计真源 | 设计级 107（daily）/ 展开级 39（daily，已按 OpenCode+Windows 预筛）/ 追踪表 216 行 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数与 MCP `callTool`，或真机 `hcloud` 调真实 API；结论与证据统一落 `evidence/<case-id>/stdout.log`，再由 `backfill_daily.py` 批量回填 CSV。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `128 / 10 / 6 / 2 / 0` |
| 通过率（分母 = PASS+FAIL+SPEC = 140） | `91.4%` |
| P0 / P1 / P2 新增缺陷 | `3 / 7 / 2`（含 2 项 SPEC-MISMATCH） |
| 红线（I 类）违规 | `0`（凭证无明文泄漏） |
| 资源释放 | `全部归零`（VPC/Subnet/ECS/EIP/FunctionGraph 均 0，仅删本次创建） |

---

## 三、状态汇总

### 3.1 设计级（107）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 91 | 有证据且通过 PASS 门禁 |
| FAIL | 8 | 不符预期，根因见缺陷清单（D1-39、D1-68、D2-10、D3-B3、D4-8、D4-19、D8-9、D10-3） |
| BLOCKED | 6 | 环境阻塞（D3-C2、D3-C3、D3-C6、D3-C14、D3-S3、D3-S7） |
| SPEC-MISMATCH | 2 | D10-4、D9-9 契约漂移 |
| NOT_RUN | 0 | — |
| **合计** | **107** | |

### 3.2 展开级（39）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 37 | D3-C4 服务矩阵 22 + D10 评测集 13 命中 + D5 2 |
| FAIL | 2 | EXP-E01、EXP-E08（serviceCatalog 未命中，与 D10-3 同源） |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **39** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 缺陷 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D1-39` | D1安装 | Windows 升级检测链 queryDistTagsSync 返回 null 静默降级 | `update-check.mjs:370-385` / `:84` | 待提交 |
| 2 | P0 | `D4-19` | D4安全 | 确认流程风险预检未生效，plan 未合并安全裁决 | `tools.mjs:1428` + `hcloud-cli.mjs:371` | 待提交 |
| 3 | P0 | `D10-4` | D10评测 | 风险规则库 9 deny+10 warn，契约要求 9+7（SPEC-MISMATCH） | `safety/rules/cloud-risk-rules.json` | 待提交 |
| 4 | P1 | `D2-10` | D2认证 | profile 以空格分隔传入，KooCLI 报 USE_ERROR | `tools.mjs:2132` / `:2196` | 待提交 |
| 5 | P1 | `D3-B3` | D3功能 | run_readonly_command 注入无效 S1 凭证，APIGW.0301 | `tools.mjs:1186/1430` + `hcloud-cli.mjs:300` | 待提交 |
| 6 | P1 | `D4-8` | D4安全 | hook 双路径判定不一致（源码 deny vs hook warn） | `tools.mjs:1447-1448` | 待提交 |
| 7 | P1 | `D10-3` | D10评测 | serviceCatalog 路由准确率 86.7% < 90% 门禁 | `tools.mjs:2574/2576/2805` | 待提交 |
| 8 | P1 | `EXP-E01` | D10评测 | 「华北北京四有哪些云主机」未命中 ECS | `tools.mjs:2576` | 待提交 |
| 9 | P1 | `EXP-E08` | D10评测 | ECS 创建失败解释未命中 explain_error | `tools.mjs:2576` | 待提交 |
| 10 | P1 | `D9-9` | D9协议 | initialize capabilities 未声明取消能力（SPEC-MISMATCH） | `mcp-protocol.mjs:60` | 待提交 |
| 11 | P2 | `D1-68` | D1安装 | HUAWEICLOUD_REGION 未优先于 HW_REGION | `auth/credentials.mjs:225`（同源 `:173/:339`） | 待提交 |
| 12 | P2 | `D8-9` | D8质量 | sanitizeValue 未移除 AK/SK/token 等敏感值 | `telemetry/telemetry.mjs:190` | 待提交 |

> 完整现象/断言/影响/证据见同目录 `FINDINGS.md`。本轮统一合 1 张缺陷单提交至 `huaweicloud/huaweicloud-devkit`。

### 本轮上轮 FAIL/BLOCKED 的收敛（真实执行）

- **D3-C1（上轮 FAIL→本轮 PASS）**：改用有效规格 `ac7.large.2` + `GPSSD` 系统盘，真实创建 VPC+子网+ECS → ACTIVE → 删除 → 归零闭环成功。
- **D3-S2（上轮 FAIL→本轮 PASS）**：重写探针为「plan=deny + 未确认 run 被拒 + 真机创建后未确认删除不生效 + 清理归零」，无残留。
- **D3-C7（上轮 FAIL→本轮 PASS）**：断言修正为「region 参数保留 + 真机返回确定性实例不存在」，区域路由正确。
- **D3-S4（上轮 BLOCKED→本轮 PASS）**：代金券 status→claim→status 返回结构连贯（限流已解除）。
- **D3-S6（上轮 BLOCKED→本轮 PASS）**：补齐 `timeout`/`memory_size`/`package`，真实创建 FunctionGraph → 调用 → 删除归零。
- **D4-13（上轮 FAIL→本轮 PASS）**：改用显式 `--cli-access-key/--cli-secret-key` 注入 test001，只读成功且写操作被 `VPC.0010 PolicyNotAuthorized` 拒绝。

---

## 五、未执行用例与原因

### BLOCKED（6，均为环境/上游依赖）

| 用例ID | 维度 | 标题 | 阻塞原因 | 分类 |
|---|---|---|---|---|
| `D3-C2` | D3功能 | OBS 静态站部署 E2E | 管理 AK 被 OBS 拒为 `InvalidAccessKeyId`；test001 `AccessDenied`；本机无 obsutil、KooCLI 无 OBS 服务。未创建任何桶，云端零残留 | 【补环境】下发 OBS 可写 AK/SK 或安装 obsutil |
| `D3-C3` | D3功能 | 沙箱部署 E2E | `HDKIT_UPSTREAM_ERROR: 查询实名状态失败` | 【补环境】HDKIT 服务恢复 |
| `D3-C6` | D3功能 | 沙箱 7 隐式工具具名冒烟 | 工具均已注册，`check_user` 上游 `HDKIT_UPSTREAM_ERROR` | 【补环境】HDKIT 服务恢复 |
| `D3-C14` | D3功能 | 沙箱 HDKit 服务参数/hwlink 凭证 | `sandbox_credentials` IAM 401 + `sandbox_connect` 25s 无响应 | 【补环境】HDKIT 服务恢复 |
| `D3-S3` | D3功能 | 场景-沙箱预览出 URL | `sandbox_connect` 25s 无响应 | 【补环境】HDKIT 服务恢复 |
| `D3-S7` | D3功能 | 场景-跨服务编排(Web应用+RDS)并归零 | 沙箱上游不可用 + test001 无 RDS 写权限（Pdp.0001） | 【补环境】HDKIT 恢复 + RDS 写权限凭证 |

### NOT_RUN（0）

无。本轮 146 条全部执行并回填。

---

## 六、安全红线与合规

- [x] 凭证泄漏检查：`show_profile_redacted` 等输出无明文 AK/SK（D2-4 PASS；多份证据未见 `secretAccessKey="..."`）。
- [x] 写操作审批门：plan=deny、未确认 run 被 `CONFIRM_TOKEN_NOT_FOUND` 拒绝（D4-4/D3-S2 PASS）。
- [x] 红线（I 类）违规：0。
- [x] 只读子账号最小权限：test001 只读成功、写 VPC 被 `PolicyNotAuthorized` 拒绝（D4-13 PASS）。
- [x] 本次创建的真云资源全部删除归零，仅删本次创建资源。

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC + 子网（D3-C1） | 创建成功 | 删除成功 | `ShowVpc`/`ShowSubnet` 均 404，`ListVpcs=[]` |
| ECS（D3-C1） | `ac7.large.2` / `GPSSD` 达 ACTIVE | 删除成功 | `ListServersDetails count=0` |
| VPC（D3-S2 确认流程验证） | 创建成功 | 未确认删除被拒 → 直接删除成功 | `ShowVpc` 404 |
| FunctionGraph（D3-S6） | 创建成功 | 删除成功 | `ListFunctions` 无 `tctest-fg-*` |
| OBS 桶（D3-C2） | 未创建（403） | 无需 | 无残留 |

> 收尾统一核查：`VPC=0 / Subnet=0 / ECS=0 / EIP=0 / FunctionGraph(tctest)=0`。

---

## 八、遗留与建议

1. **P0 优先修复**：D1-39（Windows 升级检测静默降级）、D4-19（确认流程未合并安全裁决）、D10-4（规则库契约漂移）。
2. **D10 路由**：补齐 ECS 中文同义词（云主机/实例/服务器）与诊断意图词（explain_error），将路由准确率提升至 ≥90%。
3. **D4-8 hook 一致性**：`hook_check_command` 应与 `classifyTextCommand` 合并取最严，避免 MCP 侧降级。
4. **D3-B3**：`run_readonly_command` 在 S1 占位凭证场景应回退到本机有效 KooCLI profile，或明确报错而非返回 Unauthorized。
5. **环境**：HDKIT 沙箱上游持续 502，建议维护者确认服务状态；OBS E2E 需可写 AK/SK 或 obsutil。