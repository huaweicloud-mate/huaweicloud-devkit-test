# DSH-deepseek-v4.1-flash-1017 每日测试报告
> **报告名**：`DSH-deepseek-v4.1-flash-1017-测试报告.md`
> **生成时间**：2026-11-20 05:20:38（北京时间）
> **执行归档**：`results/DSH/2026-11-20-1.94.193.150/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 3 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `DSH` + `deepseek-v4.1-flash-1017` |
| OS / 架构 | `Linux` |
| 被测版本（SUT） | `2.0.0-next.4` |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：TODO: 待 agent 补充（探针直调 / MCP 真机 / 真云 E2E 等）

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `129 / 7 / 7 / 2 / 1` |
| 通过率（分母 = PASS+FAIL = 136） | `94.9%` |
| P0 / P1 / P2 新增缺陷 | `3 / 3 / 1` |
| 红线（I 类）违规 | `TODO: 待填` |
| 资源释放 | `TODO: 待填` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `91` | 有证据且通过 PASS 门禁 |
| FAIL | `6` | 不符预期，根因见缺陷清单 |
| BLOCKED | `7` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `2` | 契约漂移 |
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
| 1 | P1 | `D2-10` | D2认证 | R7 current档跟随 | TODO: 待补根因 | 待提单 |
| 2 | P0 | `D4-16` | D4安全 | 命令包裹穿透 | TODO: 待补根因 | 待提单 |
| 3 | P0 | `D4-21` | D4安全 | hook_check_artifacts 具名回归（代码/IaC/策略制品预检） | TODO: 待补根因 | 待提单 |
| 4 | P2 | `D8-9` | D8质量 | 安装 ID 与遥测值脱敏 | TODO: 待补根因 | 待提单 |
| 5 | P1 | `D9-6` | D9协议 | 跨客户端互通 | TODO: 待补根因 | 待提单 |
| 6 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线 | TODO: 待补根因 | 待提单 |
| 7 | P1 | `EXP-E01` |  |  | TODO: 待补根因 | 待提单 |

### 根因详情

> TODO: 每个 FAIL 用例的「期望 / 实际 / 根因（文件:行号）/ 证据」需由 agent 依据 evidence/<case-id>/stdout.log 补充。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | TODO: 待补原因 |

### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D3-C3` | D3功能 | 沙箱部署E2E | 沙箱部署被 v2 审批门拦截（connect 返回 USER_CONFIRMATION_REQUIRED）：自动化会话无交互终端，无法完成「上传→nginx→预览 URL」真机链路。解除条件：宿主代用户批准（DEVKIT_APPROVAL_MODE=ask + approvedByUser）或测试免批通道后复测（补环境·审批门交互） |
| `D3-C6` | D3功能 | 沙箱 7 隐式工具具名冒烟（check_user/credentials/sign_agreement/exec_one_shot/upload_file/close_session/deploy_check） | 沙箱 connect 被 v2 审批门拦截（USER_CONFIRMATION_REQUIRED/ASK_CONFIRMATION_REQUIRED）：自动化会话无交互终端，token 模式 approve 拒绝非 TTY；7 个隐式工具的落盘/执行链路无法建立。解除条件：DEVKIT_APPROVAL_MODE=ask 下由宿主代用户批准，或提供测试专用免批通道后复测（补环境·审批门交互） |
| `D3-C7` | D3功能 | 跨区域资源操作引导（区域维度） | 跨区域 ap-southeast-3 不在账号项目范围（账号 project 仅 cn-north-4）——ECS 只读返回 Common.0013（region 与 tk 项目不符）、EIP 创建返回 VPC.0501，无法建删跨区资源。已实测通过项：list_regions 含 ap-southeast-3=true、plan_cli_command 含 --cli-region=true。解除条件：账号开通 ap-southeast-3 项目/region 权限（补环境·真云多region权限） |
| `D3-C13` | D3功能 | OBS 静态网站托管配置 | OBS 静态网站 set 被 v2 审批门拦截（USER_CONFIRMATION_REQUIRED）：自动化会话无交互终端，set 与随后的 get 均无法验证。解除条件：宿主代用户批准或测试免批通道后复测（补环境·审批门交互） |
| `D3-C14` | D3功能 | 沙箱 HDKit 服务参数与 hwlink 凭证 | v2 已移除 sandbox/hwlink-api 模块（改 devbridge 链路），夹具凭证注入断言无对应实现可测 |
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | 沙箱预览被 v2 审批门拦截（connect 返回 USER_CONFIRMATION_REQUIRED）：自动化会话无交互终端，预览 URL 链路无法建立。解除条件：宿主代用户批准或测试免批通道后复测（补环境·审批门交互） |
| `D9-9` | D9协议 | tools/call 超时协议语义与取消 | 探针无法构造延迟 MCP server：v2 已移除 mcp-protocol dispatch 导出（改为 MCP SDK createDevkitMcpServer），夹具自定义 server 启动即 SyntaxError，超时/取消断言均无有效 SUT 证据 |

---

## 六、安全与红线合规

- [ ] 凭证泄漏事件：`TODO: 待填`
- [ ] 写操作误判 read-only：`TODO: 待填`
- [ ] 红线（I 类）违规：`TODO: 待填`
- [ ] 脱敏复核：`TODO: 待填`

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| TODO | TODO | TODO | TODO |

> TODO: 真云用例的资源创建/销毁/归零情况由 agent 依据执行过程补充。

---

## 八、遗留与建议

- TODO: 待裁决 SPEC / 未覆盖项 / 修复建议由 agent 补充。
