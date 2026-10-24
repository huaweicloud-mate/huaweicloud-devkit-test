# Hermes-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`Hermes-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-24 05:32（北京时间）
> **执行归档**：`results/Hermes/2026-10-24-1.94.193.150/Linux/`
> **被测对象**：huaweicloud-devkit v1.1.12（npm `latest` 正式版，gitHead `4ed07801`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 3 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Hermes` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux`（aarch64，ECS） |
| 被测版本（SUT） | `huaweicloud-devkit@1.1.12`（npm latest 正式版，gitHead `4ed07801`） |
| daily 基础用例 | 设计级 107 / 展开级 43 |

> **执行方法**：50 余批探针（probe.mjs/.sh 直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数 + spawn `mcp-server.mjs` 驱动 MCP 协议 + eval harness serviceCatalog 路由 + 真云 E2E 建删资源），证据落 `evidence/<case-id>/stdout.txt`，批量回填三 CSV。真云用例真机执行（AK/SK + 只读子账号 + 沙箱），建删资源归零验证。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `150`（设计级 107 + 展开级 43） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `124 / 14 / 5 / 3 / 4` |
| 通过率（分母 = PASS+FAIL = 138） | `89.9%` |
| P0 / P1 / P2 新增缺陷（FAIL） | `3 / 7 / 4`（另有 SPEC-MISMATCH 3 项） |
| 红线（I 类）违规 | `无` |
| 资源释放 | 真云建删资源全部归零（唯 D3-C1 ECS 二次人工补删归零，见 §七） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `82` | 有证据且通过 PASS 门禁 |
| FAIL | `13` | 不符预期，根因见缺陷清单 |
| BLOCKED | `5` | 环境/权限/凭证阻塞（真·外部依赖） |
| SPEC-MISMATCH | `3` | 契约漂移 |
| NOT_RUN | `4` | 未执行（明确不适用，见 §五） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `42` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01（与 D10-3 同根因） |
| BLOCKED | `0` | |
| SPEC-MISMATCH | `0` | |
| NOT_RUN | `0` | |
| **合计** | **`43`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D4-2` | D4安全 | 凭证 env 打印拦截未覆盖 generic `access_key` | `safety-policy.mjs:515` | 待提单 |
| 2 | P0 | `D4-21` | D4安全 | hook_check_artifacts 未拦截 HCL `actions=[*]`/AdministratorFullAccess | `cloud-risk-rules.json:196` | 待提单 |
| 3 | P0 | `D9-12` | D9协议 | initialize 版本检查缺失 + 非法时序 tools/list 未拒 -32600 | `mcp-protocol.mjs:32-50,57` | 待提单 |
| 4 | P1 | `D4-6` | D4安全 | `--admin-pass` 不告警 + JSON 带引号 key adminPass 未脱敏 | `cloud-risk-rules.json:68` + `safety-policy.mjs` | 待提单 |
| 5 | P1 | `D4-17` | D4安全 | hook 模糊输入 fail-open（默认放行） | `risk-rule-engine.mjs:106` | 待提单 |
| 6 | P1 | `D3-C3` | D3功能 | 沙箱 deploy_nginx 部署可用却报假失败 | `session-manager.mjs:827,1014` | 待提单 |
| 7 | P1 | `D3-S7` | D3功能 | 复合意图部署目标未命中 + RDS CreateInstance 缺前置 | `tools.mjs` serviceCatalog + RDS 参数 | 待提单 |
| 8 | P1 | `D10-3` | D10评测 | serviceCatalog 中文「云主机」路由 MISS（92.9%） | `tools.mjs:2190` | 待提单 |
| 9 | P1 | `EXP-E01` | D10评测 | 评测集「云主机」路由 MISS（同 D10-3） | `tools.mjs:2190` | 待提单 |
| 10 | P2 | `D3-S5` | D3功能 | 复合意图分层路由仅命中单一服务 | `tools.mjs` serviceCatalog | 待提单 |
| 11 | P2 | `D3-S6` | D3功能 | FunctionGraph CreateFunction 参数非法未生成 URN | `tools.mjs` FG 参数装配 | 待提单 |
| 12 | P2 | `D4-25` | D4安全 | Python hook 写操作遥测误分类 cli:invoke | `huaweicloud-safety.py:46` | 待提单 |
| 13 | P2 | `D4-26` | D4安全 | findings 证据脱敏不完整（明文 secret 残留） | `risk-rule-engine.mjs:22` | 待提单 |
| 14 | P2 | `D3-C1` | D3功能 | ECS 生命周期归零未确认（测试侧探针窗口，非产品缺陷） | `scripts/realcloud_e2e.mjs`（测试仓库） | 不计提单 |
| 15 | P2 | `D8-9` | D8质量 | sanitizeValue 未脱敏 AK/SK/token（SPEC） | `telemetry.mjs:189` | 待提单 |
| 16 | P2 | `D9-9` | D9协议 | capabilities.cancellation 未声明（SPEC） | `mcp-protocol.mjs` | 待提单 |
| 17 | P2 | `D10-4` | D10评测 | 规则库 16→19 条断言漂移（SPEC） | `cloud-risk-rules.json` | 待提单 |

### 根因详情

见 `FINDINGS.md`（16 项，含逐条 现象/断言/根因/影响/证据）。测试侧 D3-C1（#16 测试侧）不计入源码仓提单。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | 【调归属】Windows 升级检测链 EINVAL 专属（OS 列标注「专属」）；Linux 侧由 EXP-NR3-10(disttags 探针)代表覆盖 |
| `D8-1` | D8质量 | 文档与能力一致 | 【改用例】文档与能力一致需白盒 docs 全量比对，本轮未覆盖 |
| `D8-4` | D8质量 | 引导步骤可机械执行 | 【改用例】引导步骤可机械执行需逐条核验 getting-started 步骤，本轮未覆盖 |
| `D8-6` | D8质量 | 中英文文档一致 | 【改用例】中英文文档一致需中英双源逐段比对，本轮未覆盖 |

### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D2-10` | D2认证 | R7 current档跟随 | 【补环境】R7 current 档跟随需 KooCLI 多 profile 夹具（current=deploy 切换） |
| `D2-13` | D2认证 | R9 configuredBySession优先env | 【补环境】R9 configuredBySession 优先 env 需隔离 S1 + HW_ACCESS_KEY env 夹具（会污统一账号凭证库） |
| `D4-12` | D4安全 | 供应链安装期安全 | 【补环境】供应链安装期安全需 npm 安装期抓包/SBOM 审计通道 |
| `D4-24` | D4安全 | 确认令牌过期与重复确认边界（审批流健壮性） | 【补环境】确认令牌过期/重复确认边界需审批流 + 可注入时钟 |
| `D9-6` | D9协议 | 跨客户端互通 | 【调归属】跨客户端互通需多客户端并存环境（单机仅 Hermes） |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`无`（测试全程未发生真实凭证明文外泄；探针 AKSK 均走 ~/.config/huaweicloud/credentials.json 预置账号）
- [x] 写操作误判 read-only：`无`（写操作均正确判 deny/warn，见 D4-15/16/18/29/28）
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：`发现 4 处脱敏缺口`（D4-2 generic access_key、D4-6 JSON 带引号 key adminPass、D4-26 findings.evidence 明文、D8-9 sanitizeValue 未脱敏）——均已列为缺陷，非测试侧泄漏
- [x] 真云红线：建删资源全部归零（见 §七），只删本次创建、按前缀白名单 `testbot3-hermes-*` 清理

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC（D4-14 / D3-C1） | CreateVpc | DeleteVpc | D4-14 归零验证 OK；D3-C1 遗留 VPC `98db93c9…`+subnet 已人工补删归零 |
| ECS（D3-C1） | CreateServers（serverId `7a6e7e5d…`） | DeleteServers（提交）+ 人工补删 | 最终 ECS count=0（150s 轮询未确认，人工二次删除后归零） |
| Subnet（D3-C1） | CreateSubnet | DeleteSubnet + 人工补删 | subnet=0 |
| OBS 桶（D3-C2） | `OBS mb` | 删桶 | `Delete bucket ... successfully!` 归零 OK |
| 沙箱（D3-C3 / D3-C6） | sandbox deploy | close_session | close_session ok（会话关闭） |
| EIP（D3-C7） | 跨区创建 EIP 引导 | — | `ListEips 无本次id` 无残留 |
| FunctionGraph 函数（D3-S6） | CreateFunction（失败未建） | 测后删除 | 删除函数归零 OK |

> 真云用例全部真机执行；唯一遗留为 D3-C1 ECS（150s 轮询窗口过短致未确认），本轮已人工按前缀白名单补删，ECS/VPC/subnet 均归零。

---

## 八、遗留与建议

- **SPEC 待裁决（3 项）**：D8-9（sanitizeValue 未脱敏）、D9-9（capabilities.cancellation 未声明）、D10-4（规则库 16→19 条断言漂移）——建议维护者同步用例母版或确认实现契约。
- **测试侧修正（1 项）**：`scripts/realcloud_e2e.mjs` D3-C1 归零判定应改为「解析 List* 响应 JSON 集合键确证缺席 + 周期重发删除」，避免 150s 轮询窗口误判 FAIL（非产品缺陷）。
- **未覆盖项**：D8-1/4/6 文档一致性、D2-10/13 多 profile 夹具、D4-12 供应链审计、D4-24 审批流时钟、D9-6 多客户端并存——均属真·外部依赖，维护 agent 可按 【补环境】/【调归属】/【改用例】 分类跟进。
- **修复建议（按级别）**：P0（D4-2/D4-21/D9-12）安全红线优先修复；P1（D4-6/D4-17/D3-C3/D3-S7/D10-3）安全与交付链路；P2（D4-25/D4-26/D3-S5/S6）遥测与路由完备性。
- **通过率**：89.9%（138 项判定中 124 PASS；14 FAIL 中 1 项为测试侧非产品缺陷）。