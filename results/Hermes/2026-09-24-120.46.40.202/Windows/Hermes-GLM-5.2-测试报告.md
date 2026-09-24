# Hermes-GLM-5.2 每日测试报告

> **报告名**：`Hermes-GLM-5.2-测试报告.md`
> **生成时间**：2026-09-24 21:00:00（北京时间）
> **执行归档**：`results/Hermes/2026-09-24-120.46.40.202/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 4 个 P0 FAIL + 11 个 P1 路由 FAIL）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Hermes + GLM-5.2 |
| OS / 架构 | Windows 10 (x86_64) |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.11.15 |
| 被测版本（SUT） | `v1.1.7-next.1`（npm @next） |
| 工具全集 | 40（MCP tools/list 实测） |
| hcloud / 依赖 | hcloud 7.2.12 / doctor 10 pass 0 fail |
| 真云凭证 | cn-north-4（AKSK 已配置） |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议 / eval harness |
| daily 基础用例 | 设计级 100 / 展开级 43 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；CLI 真机执行记录日志；MCP 协议测试通过 stdio 通信；eval harness 跑 serviceCatalog 路由准确率。证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 143（设计级 100 + 展开级 43） |
| 已执行 | 142 |
| PASS / FAIL / BLOCKED / NOT_RUN | 127 / 15 / 0 / 1 |
| 通过率（分母 = PASS+FAIL = 142） | 89.4% |
| P0 新增缺陷 | 4（D4-2, D4-3, D4-16, D10-4） |
| P1 新增缺陷 | 11（EXP-E01~E07,E10~E14 路由 MISS） |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（无真云资源创建） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 96 | 有证据且通过 PASS 门禁 |
| FAIL | 4 | 不符预期，根因见缺陷清单 |
| BLOCKED | 0 | 无环境阻塞 |
| NOT_RUN | 0 | 全部覆盖 |
| **合计** | **100** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 31 | 有证据且通过 PASS 门禁 |
| FAIL | 11 | serviceCatalog 路由 MISS |
| BLOCKED | 0 | 无环境阻塞 |
| NOT_RUN | 1 | EXP-E08 诊断类 N/A（非产品缺陷） |
| **合计** | **43** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望结果 | 实际结果 | 根因 | 状态 |
|---|---|---|---|---|---|---|---|
| 1 | P0 | D4-2 | 凭证env打印拦截不完整 | `env\|grep HW_` → deny | allow | safety-policy.mjs:243 env-dump正则缺HW_前缀 | 待提单 |
| 2 | P0 | D4-3 | ShowServerPassword未拦截 | ShowServerPassword → deny/warn | allow(read_only) | safety-policy.mjs Show*统一判read_only | 待提单 |
| 3 | P0 | D4-16 | shell包裹命令穿透 | `bash -c "hcloud..."` → deny | allow | safety-policy.mjs:261 hcloud正则不穿透引号 | 待提单 |
| 4 | P0 | D10-4 | 风险规则env-dump缺HW_ | `evaluateCommandRisk('printenv HW_SECRET_KEY')` → deny | allow | cloud-risk-rules.json hwc-command-env-dump缺HW_ | 待提单 |
| 5 | P1 | EXP-E01~E15 | serviceCatalog中文路由21.4% | 中文意图正确路由到云服务 | 11/15 MISS | mcp-server.mjs serviceCatalog中文匹配不足 | 待提单 |

### 根因详情

**#1 [P0] D4-2 凭证env打印拦截不完整**
- 期望：`env | grep HW_` → `deny`
- 实际：返回 `allow`
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:243` — env-dump正则 `/HUAWEICLOUD|HWC_|HCLOUD|OS_/i` 未覆盖 `HW_` 前缀
- 证据：`evidence/D4-2/stdout.log`

**#2 [P0] D4-3 ShowServerPassword未拦截**
- 期望：`classifyHcloudArgs(['ECS','ShowServerPassword',...])` → `deny`/`warn`
- 实际：`allow, risk=read_only`
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs` — `Show*` 操作统一判 `read_only`，未区分返回明文密钥的操作
- 证据：`evidence/D4-3/stdout.log`

**#3 [P0] D4-16 命令包裹穿透**
- 期望：`classifyTextCommand('bash -c "hcloud ECS DeleteServer ..."')` → `deny`
- 实际：`allow`（4/4 shell包裹全部绕过）
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:261` — hcloud检测正则 `/(^|\s)hcloud(\.exe)?\s+/i` 不穿透引号
- 证据：`evidence/D4-16/stdout.log`

**#4 [P0] D10-4 风险规则env-dump缺HW_前缀**
- 期望：`evaluateCommandRisk('printenv HW_SECRET_KEY')` → `deny`
- 实际：`allow`
- 根因：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` — `hwc-command-env-dump` 的 `match.all[1].regex` 缺 `HW_`
- 证据：`evidence/D10-4/stdout.log`

**#5 [P1] EXP-E01~E15 serviceCatalog路由准确率低**
- 期望：15条中文意图正确路由（如「帮我查云主机」→ECS）
- 实际：3 HIT / 11 MISS / 1 N/A = 21.4%准确率
- 根因：`plugins/huaweicloud-core/src/mcp-server.mjs` — serviceCatalog中文关键词匹配不足
- 证据：`evidence/EXP-E01~E15/stdout.log`，`eval/results/eval-run-20260923212844.csv`

---

## 五、未执行用例与原因

| ID | 层级 | 优先级 | 状态 | 分类 | 原因 | 建议 |
|---|---|---|---|---|---|---|
| EXP-E08 | 展开级 | P1 | NOT_RUN | 非产品缺陷 | 评测用例期望路由为「诊断」类，不属于具体云服务路由，serviceCatalog设计上不覆盖。verdict=N/A是harness正确判定 | 无需改用例，N/A判定合理 |

---

## 六、安全/红线

- **真云用例**：未创建真云资源（本轮测试以源码级探针+CLI验证为主，未执行真云E2E建删资源用例）
- **凭证安全**：测试过程中未泄露AK/SK，所有探针使用脱敏测试数据
- **PASS门禁**：通过 `verify_no_fake_pass.py` 校验，所有PASS用例均有evidencePath且证据存在
- **覆盖率门禁**：通过 `verify_coverage.py` 校验，P0无NOT_RUN，NOT_RUN+空占比 2.3% ≤ 15%
- **红线违规**：0

---

## 七、资源释放

- 无真云资源创建，无需清理
- 探针脚本临时文件已清理（skip file test 使用 tmpdir 并已删除）
- evidence 目录保留在 results pack 内

---

## 八、遗留建议

1. **D4-2/D10-4 HW_前缀缺失**：建议统一在 safety-policy.mjs env-dump 正则和 cloud-risk-rules.json hwc-command-env-dump 规则中添加 `HW_` 前缀，保持两层一致
2. **D4-3 ShowServerPassword**：建议在 classifyHcloudArgs 中对 `ShowServerPassword`/`ShowKeyVersion` 等返回明文密钥的操作添加 secret 风险标记
3. **D4-16 命令包裹穿透**：建议在 classifyTextCommand 中增加引号内 hcloud 命令检测，或使用更通用的命令解析器
4. **EXP-E01~E15 路由准确率**：建议扩充 serviceCatalog 的中文关键词字典，覆盖更多云服务的中文名称/别名
