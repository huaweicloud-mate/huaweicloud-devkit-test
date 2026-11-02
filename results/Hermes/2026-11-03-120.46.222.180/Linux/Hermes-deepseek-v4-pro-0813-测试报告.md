# Hermes-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`Hermes-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-03 05:28:11（北京时间）
> **执行归档**：`results/Hermes/2026-11-03-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 4 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Hermes` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux` |
| 被测版本（SUT） | `v1.1.12`（npm `latest` 正式版，gitHead `4ed07801`） |
| daily 基础用例 | 设计级 107 / 展开级 43 |

> **执行方法**：源码级探针（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数并落 `stdout.log`；MCP 协议层 spawn `mcp-server.mjs` 真实握手；CLI（install/doctor/status/auth）真机执行；真云 E2E（ECS 生命周期 / OBS 静态站 / EIP 跨区域 / VPC 建删 / 只读子账号最小权限 / D10 eval-harness）真机建删资源并归零验证。证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `150`（设计级 107 + 展开级 43） |
| 已执行 | `149` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `125 / 18 / 3 / 3 / 1` |
| 通过率（分母 = PASS+FAIL = 143） | `87.4%` |
| P0 / P1 / P2 新增缺陷 | `4 / 10 / 4` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `本次建删资源已全部归零（ECS / VPC / 子网 / OBS 桶 / EIP 均删净并复验）；共享账号仍有少量历史泄漏（2 ACTIVE ECS + 3 VPC，非本次创建，见 §七）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `85` | 有证据且通过 PASS 门禁 |
| FAIL | `15` | 不符预期，根因见缺陷清单 |
| BLOCKED | `3` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `3` | 契约漂移 |
| NOT_RUN | `1` | 未执行 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `40` | 有证据且通过 PASS 门禁 |
| FAIL | `3` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`43`** | |

---

## 四、缺陷清单

> 21 项产品缺陷（FAIL 18 + SPEC-MISMATCH 3）经 `file_issue.py` 历史查重**全部命中上游仓已有 issue，均为 v1.1.12 历史在案缺陷复现**（源码未变）。完整根因（文件:行号）+ 证据见 `FINDINGS.md`，历史单号关联见 `HISTORY_LINKS.md`。本次不重复提单。

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏正确性（小写 ak=/sk= 与 JSON key 漏脱敏） | `safety-policy.mjs:45` 正则大小写敏感 / `:20` 键名不匹配裸 ak/sk | 历史在案 |
| 2 | P0 | `D4-2` | D4安全 | 凭证env打印拦截（裸 access_key/HW_ 前缀漏拦截） | `safety-policy.mjs` env-dump 正则未覆盖裸 key | 历史在案 |
| 3 | P0 | `D4-21` | D4安全 | hook_check_artifacts 具名回归（HCL/托管策略漏拦截） | `cloud-risk-rules.json` 仅匹配 JSON `Action:*` | 历史在案 |
| 4 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线（非法时序未拒绝） | `mcp-protocol.mjs` dispatch 无 initialize 前置状态机 | 历史在案 |
| 5 | P1 | `D1-70` | D1安装 | 代理配置与 WebSocket 代理（undici 导入即崩） | `undici` dep `decompress.js:78` createZstdDecompress undefined | 历史在案 |
| 6 | P1 | `D3-C4` | D3功能 | 服务创建类回归（DMS/DEW 无路由） | `tools.mjs` list_operations(DMS/DEW) 无 command/result | 历史在案 |
| 7 | P1 | `D3-S7` | D3功能 | 跨服务交付(Web+RDS)并归零（db.password 缺） | `tools.mjs` RDS CreateInstance 最小参数集缺 db.password | 历史在案 |
| 8 | P1 | `D4-4` | D4安全 | 写操作审批门（Change* 漏拦截） | `safety/policy.json:27` writeOperationPrefixes 缺 Change | 历史在案 |
| 9 | P1 | `D4-6` | D4安全 | adminPass回显警告（command 阶段未覆盖） | `cloud-risk-rules.json` stages 仅 artifact/deploy_plan | 历史在案 |
| 10 | P1 | `D4-17` | D4安全 | hook模糊 fail-closed（空/破坏性输入 fail-open） | `risk-rule-engine.mjs` 无规则命中默认 allow | 历史在案 |
| 11 | P1 | `D10-3` | D10评测 | 路由准确率+混淆矩阵（1 条 MISS） | `tools.mjs` routeMap 缺「云主机」 | 历史在案 |
| 12 | P1 | `EXP-C4-14` | 展开级 | DMS 服务矩阵 list_operations 无路由 | `tools.mjs` list_operations(DMS) 无 command/result | 历史在案 |
| 13 | P1 | `EXP-C4-18` | 展开级 | DEW 服务矩阵 list_operations 无路由 | `tools.mjs` list_operations(DEW) 无 command/result | 历史在案 |
| 14 | P1 | `EXP-E01` | 展开级 | 「云主机」中文意图路由 MISS | `tools.mjs` ECS routeMap 缺「云主机」 | 历史在案 |
| 15 | P2 | `D3-S5` | D3功能 | 场景-复合意图分层路由（多路命中失败） | `tools.mjs` routeMap 单意图匹配未分解 | 历史在案 |
| 16 | P2 | `D3-S6` | D3功能 | 场景-FunctionGraph定时任务（缺函数代码） | `tools.mjs` CreateFunction 缺 code | 历史在案 |
| 17 | P2 | `D4-25` | D4安全 | Python hook 事件遥测分类（写判 cli:invoke） | `huaweicloud-safety.py` WRITE_OPERATION_RE 前置捕获组 | 历史在案 |
| 18 | P2 | `D4-26` | D4安全 | findings 证据脱敏（JSON key 明文残留） | `risk-rule-engine.mjs` redactEvidence 不匹配 JSON key | 历史在案 |
| 19 | SPEC | `D10-4` | D10评测 | 安全干预-静态规则层（规则计数 16→19 契约滞后） | `cloud-risk-rules.json` 规则增量未同步用例断言 | 历史在案 |
| 20 | SPEC | `D9-9` | D9协议 | tools/call 超时语义与取消（cancellation 未声明） | `mcp-protocol.mjs` capabilities 仅 `{tools:{}}` | 历史在案 |
| 21 | SPEC | `D8-9` | D8文档 | 安装 ID 与遥测值脱敏（sanitizeValue 未脱敏敏感值） | `telemetry.mjs` sanitizeValue 无 AK/SK/token 脱敏 | 历史在案 |

> 逐条「期望 / 实际 / 根因（文件:行号）/ 证据」详见 `FINDINGS.md`（`file_issue.py` 解析输入，格式已严格遵循）。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | Windows 升级检测链 EINVAL 专属（OS 列标注「专属」），Linux 侧由展开级 EXP-NR3-10 代表覆盖 |

### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D3-C3` | D3功能 | 沙箱部署E2E | 华为云沙箱服务维护中(HDKIT_SANDBOX_MAINTENANCE：沙箱功能正在升级优化)，connect 无法建立会话(外部依赖) |
| `D3-C6` | D3功能 | 沙箱 7 隐式工具具名冒烟（check_user/credentials/sign_agreement/exec_one_shot/upload_file/close_session/deploy_check） | 华为云沙箱服务维护中(HDKIT_SANDBOX_MAINTENANCE)，7 隐式工具 check_user/connect 均无法执行(外部依赖) |
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | 华为云沙箱服务维护中(HDKIT_SANDBOX_MAINTENANCE)，check_user 返回 realnameVerified=undefined(外部依赖) |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：无（本次未发现新凭证明文泄漏；已有 D2-4/D4-2/D4-26 脱敏缺陷均为历史在案复现）
- [x] 写操作误判 read-only：无新增（D4-4 Change* / D4-17 fail-open / D4-25 遥测分类均为历史在案）
- [x] 红线（I 类）违规：0
- [x] 脱敏复核：探针输出已按 AK/SK 前缀脱敏后再落盘，无明文 SK 写入 evidence

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| OBS 桶（D3-C2） | `tctest-hermes-obs-*` | 已删 | 归零 OK（7/7 PASS） |
| EIP（D3-C7） | `tctest-*` 临时 EIP | 已删 | 归零 OK（7/7 PASS） |
| VPC（D4-14） | `tctest-hermes-20261006-*` 临时 VPC | 已删 | 归零 OK（Create→查CTS→删→ListVpcs 复验不含，5/5 PASS） |
| ECS/VPC/子网（D3-C1） | `tctest-hermes-ecs-*` ECS+VPC+子网 | 已删 | 归零 OK（ECS→subnet→VPC 顺序清理，8/8 PASS，复验无残留） |

> **共享账号历史泄漏（非本次创建，需维护者继续清理）**：cn-north-4 仍残留 3 个 VPC（`testbot3-hermes-e2e-*`、`tctest-tmr-*`、`hdk-s7-vpc-*`）+ 2 台 ACTIVE ECS（`testbot3-hermes-ecs-*`、`tctest-tmr-u1yrtd-srv`），较昨日（10 VPC + 3 ECS）已明显收敛，VPC 路由配额已释放，D4-14/D3-C1 真云 E2E 今日得以正常建删归零。建议维护者继续按 ECS→subnet→VPC 顺序清理剩余泄漏；另有其他 agent（testbot3）在并发执行 E2E，需全局协调防再次耗尽。

---

## 八、遗留与建议

- **真云配额治理（改善，仍需持续）**：共享账号 VPC 路由配额已于今日释放（泄漏从 10 VPC + 3 ECS 收敛至 3 VPC + 2 ECS），D4-14/D3-C1 真云 E2E 恢复正常建删归零；但仍有残留泄漏，建议维护者继续按 ECS→subnet→VPC 顺序清理，防止多 agent 并发 E2E 再次耗尽配额。
- **D1-70 探针污染链**：undici 崩溃仍会遗留 `~/.config/huaweicloud/proxy.json` 占位（proxy.example）。今日已在真云执行前预置空 proxy.json、并在 aux(D1-70) 跑完后再清一次，规避了级联污染；建议探针 finally 清理 proxy.json，或 fix undici 依赖崩溃（历史缺陷）。
- **SPEC-MISMATCH 待裁决**：D10-4（规则计数 16→19）、D9-9（cancellation 未声明）、D8-9（sanitizeValue 未脱敏敏感值）3 项契约漂移，需维护者裁决「改用例」或「改实现」。
- **历史缺陷修复跟踪**：18 FAIL + 3 SPEC 均为 v1.1.12 历史在案缺陷（见 HISTORY_LINKS.md 关联清单），建议维护者按 P0 优先级推进修复（D2-4/D4-2/D4-21/D9-12 四项 P0 安全缺陷优先）。
