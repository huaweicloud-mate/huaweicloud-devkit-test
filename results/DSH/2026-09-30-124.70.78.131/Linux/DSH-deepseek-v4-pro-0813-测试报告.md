# DSH-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`DSH-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-09-30 12:24:49（北京时间）
> **执行归档**：`results/DSH/2026-09-30-124.70.78.131/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 7 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `DSH` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux` |
| 被测版本（SUT） | `1.1.7 (gitHead 7456d05, npm latest 正式版)` |
| daily 基础用例 | 设计级 102 / 展开级 39 |

> **执行方法**：源码级探针直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数（`judgeUpdate`/`redactSecrets`/`evaluateCommandRisk`/`callTool` 等）+ MCP stdio 协议探针（initialize/tools/list/call/非法时序）+ 真机 CLI（hcloud KooCLI/OBS）+ 真云 E2E（OBS 建删桶、VPC 建删、只读子账号）。结果统一落 `evidence/<case-id>/stdout.log`（JSON：status/why/executedAt）

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `141`（设计级 102 + 展开级 39） |
| 已执行 | `140` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `113 / 25 / 1 / 1 / 1` |
| 通过率（分母 = PASS+FAIL = 138） | `81.9%` |
| P0 / P1 / P2 新增缺陷 | `7 / 15 / 3` |
| 红线（I 类）违规 | `0`（真云建删均按「最小配置创建 → 测后删除归零」执行） |
| 资源释放 | `全部归零`（OBS 桶 2 次建删、VPC 1 次建删，均已删除验证；无 tctest- 残留） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `85` | 有证据且通过 PASS 门禁 |
| FAIL | `14` | 不符预期，根因见缺陷清单 |
| BLOCKED | `1` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `1` | 契约漂移 |
| NOT_RUN | `1` | 未执行 |
| **合计** | **`102`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `28` | 有证据且通过 PASS 门禁 |
| FAIL | `11` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏正确性 | TODO: 待补根因 | 待提单 |
| 2 | P2 | `D3-S5` | D3功能 | 场景-复合意图分层路由 | TODO: 待补根因 | 待提单 |
| 3 | P2 | `D3-S6` | D3功能 | 场景-FunctionGraph定时任务 | TODO: 待补根因 | 待提单 |
| 4 | P1 | `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | TODO: 待补根因 | 待提单 |
| 5 | P0 | `D4-2` | D4安全 | 凭证env打印拦截 | TODO: 待补根因 | 待提单 |
| 6 | P0 | `D4-3` | D4安全 | 明文secret API拦截 | TODO: 待补根因 | 待提单 |
| 7 | P0 | `D4-16` | D4安全 | 命令包裹穿透 | TODO: 待补根因 | 待提单 |
| 8 | P1 | `D4-17` | D4安全 | hook模糊fail-closed | TODO: 待补根因 | 待提单 |
| 9 | P0 | `D4-21` | D4安全 | hook_check_artifacts 具名回归（代码/IaC/策略制品预检） | TODO: 待补根因 | 待提单 |
| 10 | P0 | `D4-23` | D4安全 | 全局规则 huawei-agent-rules.md 注入生效性（11 安装目标） | TODO: 待补根因 | 待提单 |
| 11 | P1 | `D4-24` | D4安全 | 确认令牌过期与重复确认边界（审批流健壮性） | TODO: 待补根因 | 待提单 |
| 12 | P2 | `D8-9` | D8质量 | 安装 ID 与遥测值脱敏 | TODO: 待补根因 | 待提单 |
| 13 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线 | TODO: 待补根因 | 待提单 |
| 14 | P1 | `D10-3` | D10评测 | 路由准确率+混淆矩阵 | TODO: 待补根因 | 待提单 |
| 15 | P1 | `EXP-E01` |  |  | TODO: 待补根因 | 待提单 |
| 16 | P1 | `EXP-E02` |  |  | TODO: 待补根因 | 待提单 |
| 17 | P1 | `EXP-E03` |  |  | TODO: 待补根因 | 待提单 |
| 18 | P1 | `EXP-E04` |  |  | TODO: 待补根因 | 待提单 |
| 19 | P1 | `EXP-E05` |  |  | TODO: 待补根因 | 待提单 |
| 20 | P1 | `EXP-E07` |  |  | TODO: 待补根因 | 待提单 |
| 21 | P1 | `EXP-E10` |  |  | TODO: 待补根因 | 待提单 |
| 22 | P1 | `EXP-E11` |  |  | TODO: 待补根因 | 待提单 |
| 23 | P1 | `EXP-E12` |  |  | TODO: 待补根因 | 待提单 |
| 24 | P1 | `EXP-E13` |  |  | TODO: 待补根因 | 待提单 |
| 25 | P1 | `EXP-E14` |  |  | TODO: 待补根因 | 待提单 |

### 根因详情

完整「现象/断言/根因(文件:行号)/证据」见同目录 `FINDINGS.md`（15 项缺陷，其中 14 项 + 1 SPEC-MISMATCH）。要点：

1. **D2-4**【P0】凭证脱敏漏小写 `ak=`/`sk=` → `safety-policy.mjs:45`
2. **D4-2**【P0】env-dump 拦截缺 `HW_` 前缀 → `safety-policy.mjs:398-424`
3. **D4-3**【P0】明文 secret API 拦截漏 `kms DecryptData/Decrypt` → `safety-policy.mjs:240,432`
4. **D4-16**【P0】env-dump 被 `sh -c/bash -c/eval` 包裹穿透 → `safety-policy.mjs:398`
5. **D4-17**【P1】hook 模糊输入 fail-open → `risk-rule-engine.mjs evaluateCommandRisk`
6. **D4-21**【P0】broad IAM 制品漏 HCL/Terraform 形态 → IAM admin policy 规则
7. **D4-23**【P0】全局规则 `rules/` 未发布注入 → `package.json:8-18 files`
8. **D4-24**【P1】审批令牌过期/重复未返回结构化 code → `hcloud-cli.mjs:85-92` / `tools.mjs:1260`
9. **D8-9**【P2】`sanitizeValue` 未脱敏 AK/SK/token → `telemetry/telemetry.mjs:189`
10. **D9-12**【P0】未 initialize 先 tools/list 未拒 -32600 → `mcp-protocol.mjs:32-59`
11. **D10-3**【P1】中文意图路由命中率仅 21.4%（EXP-E01~E14 共 11 MISS）→ `tools.mjs:1815-1947 routeMap`
12. **D3-S7**【P1】跨服务复合意图仅命中 RDS → `tools.mjs:1947`
13. **D3-S5**【P2】复合意图分层路由未拆分 → `tools.mjs:1947`
14. **D3-S6**【P2】FunctionGraph 路由 MISS → `tools.mjs:1947`
15. **D1-68**【SPEC】region 优先级 `HW_REGION` 优先，契约期望 `HUAWEICLOUD_REGION` 优先 → `auth/credentials.mjs:171,222,352`

> 对比 09-29 基线：D4-26（findings.evidence 脱敏）与 D4-25（Python hook cli:write 分类）本轮源码级复核为已修复/已具备，不再列入；D1-65 更新域 DEBUG 支持 `1||true`（复核 PASS），遥测域仍仅接受 `'true'`（跨域不一致，遗留建议见 §八）。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | 【调归属】Windows 专属用例(OS 列标注「专属」)，本机为 Linux，不适用；Linux 侧由展开级终端矩阵按负面/环境验证覆盖 |

### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | 沙箱 connect/upload/deploy 依赖 DevStation 配额与 devbridge_tunnel(历史 D3-S3 隧道 FAIL) |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（真云 AK/SK 未明文落日志；探针输出已脱敏）
- [x] 写操作误判 read-only：`0`（D4-5 复核 PASS：DeleteVpc 判写操作非只读）
- [x] 红线（I 类）违规：`0`——真云建删均最小配置+测后归零；D2-11 STS persist 拒绝落盘（R3 生效）；D2-4 脱敏缺口已如实标 FAIL 提单
- [x] 脱敏复核：`redactSecrets`（大小写 AK/SK/adminPass）与 `redactOutput` 双路径已直调验证（小写 `ak=`/`sk=` 缺口见 D2-4）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| OBS 桶 testbot2-dsh-obs-* | 2 次（D3-C13 set/get） | `OBS rm -f`（2 桶） | `OBS ls` 无 testbot2-dsh 残留 ✅ |
| VPC testbot2-dsh-vpc-* | 1 次（D3-S2） | `DeleteVpc` | `ListVpcs` 无 testbot2-dsh 残留 ✅ |

> 真云用例均「最小配置创建 → 测后删除 → 归零验证」；本次仅建删 OBS 桶与 VPC，无付费 ECS/RDS 创建。

---

## 八、遗留与建议

- **待裁决 SPEC**：D1-68 region 优先级（`HW_REGION` vs `HUAWEICLOUD_REGION` 谁优先）；D9-9 cancellation capabilities 未声明（fixture 判定，基线注释）。
- **跨域不一致**：`HUAWEICLOUD_DEVKIT_DEBUG` 更新域支持 `1||true`，遥测域仅 `'true'`（`telemetry/telemetry.mjs:81`），建议统一。
- **核心修复建议**：serviceCatalog `routeMap`（`tools.mjs:1815-1947`）补 CJK 关键字是中文意图路由 21.4%→90%+ 的唯一杠杆，覆盖 D10-3/D3-S5/S6/S7/EXP-E01~14 共 15 条用例；env-dump/secret 读取拦截规则补 `HW_` 前缀、`kms Decrypt`、shell 包裹透传三处缺口。
- **未覆盖项**：D3-S3 沙箱预览 URL（DevStation 配额/隧道），D1-39 Windows 专属（本机 Linux）。
