# OpenCode-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`OpenCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-18 05:23:00（北京时间）
> **执行归档**：`results/OpenCode/2026-10-18-1.92.93.23/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 4 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenCode` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux aarch64` |
| Node / npm / Python | `Node v22.13.0 / npm 10.9.2 / Python 3.12.3` |
| 被测版本（SUT） | `v1.1.9-next.1`（npm @next，gitHead `12efbe8c`，OpenCode native in-process 工具） |
| 真云凭证 | `cn-north-4（主账号 hw018619646 + 只读子账号 test001）` |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **版本升级说明**：本轮 SUT 由 `v1.1.9-next.0 @ 6302921c` 升级至 `v1.1.9-next.1 @ 12efbe8c`，主要变更为 OpenCode native plugin（42 MCP 工具 as in-process custom tools，a843f70）+ #919-#922 修复（沙箱隧道假成功 / auth persist 假输出 / CLI ok 判定 / ECS 指引）+ skills 部署目标门禁（#918）。**15 项缺陷与上一版本逐条一致、均未修复**，无新增缺陷、无回归修复。

> **执行方法**：探针直调（源码级 `import tools.mjs/mcp-server.mjs/safety-policy.mjs` 等）+ MCP 真机（plan/approve/run_readonly 工具链）+ 真云 E2E（ECS 生命周期 / OBS 静态站 / 沙箱部署 / 跨区域 EIP / VPC 审计 / 只读子账号）。所有探针本轮真实运行，证据落 `evidence/<case-id>/stdout.log`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145`（NOT_RUN 1 = OS 专属 D1-39） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `130 / 12 / 0 / 3 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH = 145） | `89.7%` |
| P0 / P1 / P2 缺陷（含 SPEC） | `4 / 6 / 5` |
| 红线（I 类）违规 | `无` |
| 资源释放 | `已归零（见 §七）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `92` | 有证据且通过 PASS 门禁 |
| FAIL | `11` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `3` | 契约漂移 |
| NOT_RUN | `1` | 未执行（D1-39 Windows 专属） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | 不符预期（EXP-E01），根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D4-2` | D4安全 | 凭证 env 打印拦截未覆盖 generic access_key | `safety-policy.mjs:515` | 历史问题 |
| 2 | P0 | `D4-21` | D4安全 | hook_check_artifacts 未拦截 HCL broad IAM 制品 | `cloud-risk-rules.json`（hwc-iam-admin-policy） | 历史问题 |
| 3 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线两处缺口 | `mcp-protocol.mjs:32-55` | 历史问题 |
| 4 | P0 | `D10-4` | D10评测 | 安全规则库 16→19 条（用例断言契约漂移） | 规则库 16→19 条 | 历史问题 |
| 5 | P1 | `D4-6` | D4安全 | hook_check_command 对 --admin-pass 命令不告警 | `cloud-risk-rules.json:68-72` | 历史问题 |
| 6 | P1 | `D4-17` | D4安全 | hook 模糊输入 fail-open（默认放行） | `risk-rule-engine.mjs:106` | 历史问题 |
| 7 | P1 | `D3-S7` | D3功能 | 跨服务交付（Web 应用+RDS）复合意图部署目标未命中 | `tools.mjs:1999-2224` | 历史问题 |
| 8 | P1 | `D1-70` | D1安装 | 代理配置后 ProxyAgent/WebSocket 代理崩溃 | `package.json` undici 浮点依赖 | 历史问题 |
| 9 | P1 | `D9-9` | D9协议 | capabilities.cancellation 未声明（契约漂移） | `mcp-protocol.mjs:45-49` | 历史问题 |
| 10 | P1 | `EXP-E01` | D10评测 | serviceCatalog 中文意图「云主机」未命中 | `tools.mjs:1999-2002` | 历史问题 |
| 11 | P2 | `D3-S5` | D3功能 | 场景-复合意图分层路由未分解 | `tools.mjs:1999-2224` | 历史问题 |
| 12 | P2 | `D3-S6` | D3功能 | FunctionGraph 定时任务 CreateFunction 最小参数校验失败 | CreateFunction 最小参数集不被接受 | 历史问题 |
| 13 | P2 | `D4-25` | D4安全 | Python hook 写操作遥测误分类 cli:invoke | `huaweicloud-safety.py:46` | 历史问题 |
| 14 | P2 | `D4-26` | D4安全 | findings.evidence 脱敏未覆盖 JSON 带引号 key | `risk-rule-engine.mjs:19-23` | 历史问题 |
| 15 | P2 | `D8-9` | D8质量 | sanitizeValue 未脱敏 AK/SK/token（契约漂移） | `telemetry.mjs:189-191` | 历史问题 |

### 根因详情

完整「现象 / 断言 / 根因（文件:行号）/ 证据」见同目录 `FINDINGS.md`（#1~#15，本轮新鲜复测复现，与 10-16/10-17 逐条一致、均未修复）。要点见上表。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 |
|---|---|---|---|---|---|
| `D1-39` | 设计级 | P0 | NOT_RUN | 调归属 | OS 列标注「Windows 专属」，Linux 侧由展开级代表覆盖（`queryDistTags` 返回对象无 EINVAL 异常，已在本轮 disttags.log 验证），非本 OS 用例 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：无（探针统一 redact，AK/SK 落 `HPUA***REDACTED***`，未向仓库落盘明文）
- [x] 写操作误判 read-only：无（D4-18/19/20 审批流 confirm-not-deny / 预检 / 拒绝零操作均通过）
- [x] 红线（I 类）违规：无
- [x] 脱敏复核：evidence 中 AK/SK/token 均已按 `HPUA***REDACTED***` 处理
- [x] 真云写真机执行（非 mock）：D3-C1/C2/C3/C6/C7、D2-1、D3-C4、D4-14、D4-18/19/20、D4-13 均本机实测建删，无 BLOCKED 冒充

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| D3-C1 ECS 生命周期 | VPC+子网+ECS 最小规格（c6.large.2） | DeleteServers(含磁盘) + DeleteSubnet + DeleteVpc | 归零 OK（ECS/serverId dd053970、VPC beaaf2dd、子网 015edf65 均已复核删除，ListVpcs/ListServersDetails 无本次资源） |
| D3-C2 OBS 静态站 | 建桶 + 上传 + 静态站 + curl200 | rm 清对象 + 删桶 | 归零 OK |
| D3-C3 沙箱部署 | sandbox connect 建 session | close_session | 无残留 |
| D3-C6 沙箱冒烟 | 上传 probe 文件 | close_session | 无残留 |
| D3-C7 跨区域 EIP | CreatePublicip | DeletePublicip | 归零 OK（EIP 已释放） |
| D4-14 VPC 审计 | CreateVpc（本轮干净跑成功） | DeleteVpc | 归零 OK |
| D4-13 只读子账号 | KooCLI profile test001 | 清理 profile 恢复 default | 未创建资源（写创建 VPC 返回 VPC.0010 PolicyNotAuthorized IAM 拒绝，residualZero=true） |

> 说明：本轮真云写路径（D4-14 CreateVpc / D4-13 只读子账号写拒绝）**均干净跑**，无 VPC 路由器配额（`VPC.0114 OverQuota`）干扰（10-17 曾受共享账号外部残留 VPC 挤占配额影响）。D3-C1 ECS 异步删除耗时 >120s，探针归零轮询窗口（120s）不足致探针第 7 步短暂报 FAIL，事后已手动复核并确认云端 ECS/VPC/子网全部归零（详见 D3-C1 stdout.log 备注）。所有本客户端创建的资源均已归零。

---

## 八、遗留与建议

- 15 项缺陷（12 FAIL + 3 SPEC）与 10-16/10-17 逐条一致，虽版本升级至 `1.1.9-next.1` 仍均未修复；`file_issue.py` 已内置历史查重，预计全部命中既有单（生成 `HISTORY_LINKS.md`），不重复开新单。
- D10-4「规则库 16→19 条」契约漂移仍待维护者修订 `test-cases/` 母版计数。
- D1-70 建议 `package.json` 将 `undici` 上界 pin 至 `<8.12` 或提升 `engines.node` 到 `>=22.19`，规避企业代理场景崩溃（本轮以真实安装包 undici 8.12.2 复现确认）。
- D3-C1 建议探针归零轮询窗口由 120s 增至 240s+（华为云 ECS 含系统盘删除异步耗时 >2min），避免「删除已受理但轮询超时」误判；非产品缺陷。