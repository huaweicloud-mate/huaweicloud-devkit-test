# AtomCode-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`AtomCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-19 06:47:24（北京时间）
> **执行归档**：`results/AtomCode/2026-11-19-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（无 P0 缺陷）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `AtomCode` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux` |
| 被测版本（SUT） | `2.0.0-next.4` |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：探针脚本（.mjs）直调 npm 包 `plugins/huaweicloud-core/dist/*` 导出函数（v2 已从平铺 `.mjs` 源码改为 TypeScript `src/` + 编译产物 `dist/`，探针统一 path-rewrite 到 `dist/*.js`）；CLI 真机执行 `huaweicloud-devkit doctor`；MCP 协议 stdio 探针 + D10 路由评测 harness；真云 E2E（D3-C1/C2/C3/C6 建删资源归零）。决策/结果落 `stdout.log`，证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `135 / 10 / 0 / 0 / 1` |
| 通过率（分母 = PASS+FAIL = 145） | `93.1%` |
| P0 / P1 / P2 新增缺陷 | `0 / 9 / 1` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `真云建删均归零（D3-C1 无残留、D3-C2 删桶成功、D3-C3/C6 无残留、D3-C7 total_count=0）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `97` | 有证据且通过 PASS 门禁 |
| FAIL | `9` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `1` | 未执行 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P1 | `D1-3` | D1安装 | doctor健康自检 | `doctor-native.ts` skills-tree 检查（L143 一带）；npm -g 未预置 skills-tree，doctor 报 2 fail 且无「All checks passed」 | 待提单 |
| 2 | P1 | `D3-C1` | D3功能 | ECS生命周期E2E | `dist/approval-gate.js` + `run_approved_command` 收紧 token 审批，VPC/ECS 创建被 USER_CONFIRMATION_REQUIRED 拒 | 待提单 |
| 3 | P1 | `D3-C2` | D3功能 | OBS静态站部署E2E | `huaweicloud_obs_set_website_config` 被审批门 USER_CONFIRMATION_REQUIRED 拒，静态站未 set → get 404 | 待提单 |
| 4 | P1 | `D3-C3` | D3功能 | 沙箱部署E2E | `huaweicloud_sandbox_connect` 被审批门拒（rejected），后续 workspace_id 缺失 | 待提单 |
| 5 | P1 | `D3-C6` | D3功能 | 沙箱 7 隐式工具具名冒烟（check_user/credentials/sign_agreement/exec_one_shot/upload_file/close_session/deploy_check） | `huaweicloud_sandbox_connect` 被审批门拒，connect 链路断裂 | 待提单 |
| 6 | P1 | `D3-C7` | D3功能 | 跨区域资源操作引导（区域维度） | 账号 IAM 项目绑定 cn-north-4，ap-southeast-3 建 EIP 被云侧 VPC.0501 拒（非产品缺陷） | 待提单 |
| 7 | P1 | `D3-S1` | D3功能 | 场景-只读查ECS(带不改约束) | `dist/capability-catalog.js:391` routeMap 关键词缺口+分词粘连，中文意图 MISS 兜底 | 待提单 |
| 8 | P1 | `D3-S2` | D3功能 | 场景-删VPC先确认 | 同上 serviceCatalog 路由 MISS（`capability-catalog.js`） | 待提单 |
| 9 | P2 | `D8-9` | D8质量 | 安装 ID 与遥测值脱敏 | `dist/telemetry/telemetry-values.js:21` sanitizeValue 不再脱敏密钥 | 待提单 |
| 10 | P1 | `EXP-E01` | D10评测 | serviceCatalog 意图→ECS 路由 | `dist/capability-catalog.js` 路由 MISS（意图含「云主机」未命中） | 待提单 |

### 根因详情

> 完整根因、精确断言、证据路径见 `FINDINGS.md`（本清单是 `file_issue.py` 的解析输入）。关键根因：
> - **serviceCatalog 路由 MISS（D3-S1/S2、EXP-E01）**：`plugins/huaweicloud-core/src/capability-catalog.ts` `routeMap` 关键词缺口（「云主机」未列，仅「弹性云服务器/云服务器」）+ 分词器按 `[\s,./-]+` 切分导致「列出…ECS」粘连，兜底 `capability-catalog.js:391` 返回 `Run hcloud --help`。
> - **审批门 SPEC 漂移（D3-C1/C2/C3/C6）**：`dist/approval-gate.js`（L53/77/91/99/578/587/596 均 `status:'rejected'`）+ `huaweicloud_run_approved_command`/`obs_set_website_config`/`sandbox_connect` 收紧为 token 模式 USER_CONFIRMATION_REQUIRED，真云 E2E 旧审批契约失效。
> - **telemetry 脱敏回归（D8-9）**：`dist/telemetry/telemetry-values.js:21` `sanitizeValue` 仅空白折叠+截断，密钥脱敏移出后未回补。
> - **doctor 契约变化（D1-3）**：`doctor-native.ts` skills-tree 检查（npm -g 未预置）报 2 fail，成功码改为 `Results: N pass...`。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | **【调归属】** OS 专属（Windows EINVAL 语义）；OS 列标注「专属」，Linux 由 D1 系列 queryDistTagsSync 代表覆盖 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`无`（探针只读凭证，不打印 AK/SK 明文）
- [x] 写操作误判 read-only：`无`
- [x] 红线（I 类）违规：`0`
- [x] 脱敏复核：`D8-9 发现 telemetry sanitizeValue 不再脱敏，已记为缺陷 #2`

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC/Subnet（D3-C1） | 被审批门拒，未创建 | 无需删除 | `无残留`（finally 归零 True） |
| ECS（D3-C1） | 被审批门拒，未创建 | 无需删除 | `无残留` |
| OBS 桶（D3-C2） | hcloud mb 成功 | hcloud rm 成功 | `删桶归零 True` |
| EIP（D3-C7） | VPC.0501 区域/项目不匹配，创建失败 | 无需删除 | `total_count=0` |
| Sandbox（D3-C3/C6） | connect 被审批门拒，未建会话 | 无需删除 | `无残留` |

> 真云用例均真机执行；本次因 v2 审批门收紧，写资源创建被拒，故未产生残留资源，归零验证全部通过。

---

## 八、遗留与建议

- 无待裁决 SPEC；无未覆盖项（除 D1-39 Windows 专属 NOT_RUN）。
- 修复建议：① serviceCatalog `routeMap` 增补「云主机/云服务器/服务器」等中文关键词并改善分词粘连；② telemetry `sanitizeValue` 回补密钥脱敏；③ 真云 E2E 与新审批门对齐（DEVKIT_APPROVAL_MODE=ask + token approve 流程）；④ 全新 `npm install -g` 后自动预置 skills-tree 使 `doctor` 全绿。
