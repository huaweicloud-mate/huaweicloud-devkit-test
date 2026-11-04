# OpenClaw-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`OpenClaw-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-04 19:14:49（北京时间）
> **执行归档**：`results/OpenClaw/2026-11-04-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 4 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenClaw` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux aarch64 (Node v22.13.0 / hcloud 7.2.12 / Python 3.12)` |
| 被测版本（SUT） | `huaweicloud-devkit@1.1.13-next.4 (gitHead 049c8d8a)` |
| 工具全集 | `46`（tools.mjs TOOL_DEFINITIONS） |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status/update/uninstall）/ MCP 协议 / 真云 E2E |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：探针脚本（.mjs/.sh）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数 + 真机 hcloud CLI + MCP server 协议探针 + 真云 AK/SK 建删归零；结果落 `evidence/<case-id>/stdout.log`，回填三份 CSV。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `125 / 13 / 4 / 3 / 1` |
| 通过率（分母 = PASS+FAIL = 138） | `90.6%` |
| P0 / P1 / P2 缺陷 | `4 / 4 / 5`（全部历史复现，无新增，见 HISTORY_LINKS.md） |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `87` | 有证据且通过 PASS 门禁 |
| FAIL | `12` | 不符预期，根因见缺陷清单 |
| BLOCKED | `4` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `3` | 契约漂移 |
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
| 1 | P1 | `D1-70` | D1安装 | 代理配置与 WebSocket 代理 | TODO: 待补根因 | 待提单 |
| 2 | P2 | `D3-S5` | D3功能 | 场景-复合意图分层路由 | TODO: 待补根因 | 待提单 |
| 3 | P0 | `D4-3` | D4安全 | 明文secret API拦截 | TODO: 待补根因 | 待提单 |
| 4 | P0 | `D4-15` | D4安全 | hook绕过尝试 | TODO: 待补根因 | 待提单 |
| 5 | P1 | `D4-17` | D4安全 | hook模糊fail-closed | TODO: 待补根因 | 待提单 |
| 6 | P0 | `D4-21` | D4安全 | hook_check_artifacts 具名回归（代码/IaC/策略制品预检） | TODO: 待补根因 | 待提单 |
| 7 | P2 | `D4-25` | D4安全 | Python hook 事件遥测分类 | TODO: 待补根因 | 待提单 |
| 8 | P2 | `D4-26` | D4安全 | findings 证据脱敏 | TODO: 待补根因 | 待提单 |
| 9 | P1 | `D4-27` | D4安全 | 双路径输出脱敏 | TODO: 待补根因 | 待提单 |
| 10 | P2 | `D8-1` | D8质量 | 文档与能力一致 | TODO: 待补根因 | 待提单 |
| 11 | P2 | `D8-9` | D8质量 | 安装 ID 与遥测值脱敏 | TODO: 待补根因 | 待提单 |
| 12 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线 | TODO: 待补根因 | 待提单 |
| 13 | P1 | `EXP-E01` |  |  | TODO: 待补根因 | 待提单 |

### 根因详情

> 全部 13 项 FAIL 为历史复现（根因详见 FINDINGS.md 与 HISTORY_LINKS.md，均命中上游 open issue，本次未重复提单）。关键项：
> - D1-70（P0）：undici 浮点依赖（^8.12.3）与 engines `>=22` 不一致，Node 22.13 无 zstd → `lib/interceptor/decompress.js:78` import 期崩溃（历史 #915）。
> - D4-3/D4-15/D4-21/D9-12（P0）：安全策略清单缺口 / ANSI-C 编码绕过 / HCL IaC 未拦截 / initialize 时序未强制。
> - D4-17/D4-27/EXP-E01（P1）、D3-S5/D4-25/D4-26/D8-1/D8-9（P2）。
> - SPEC-MISMATCH 3 项：D1-65（telemetry DEBUG '1' 不生效）、D1-68（region 优先级 HW_REGION 前置）、D9-9（cancellation 能力未声明）。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | 【调归属】OS 专属用例在非对应 OS，Linux 侧由展开级 EXP-NR3-10 代表覆盖 |

### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D3-C3` | D3功能 | 沙箱部署E2E | 真·外部依赖：HDKIT_SANDBOX_MAINTENANCE 沙箱服务维护中，连接/上传/部署均不可用；解除条件=沙箱维护窗口结束 |
| `D3-C6` | D3功能 | 沙箱 7 隐式工具具名冒烟（check_user/credentials/sign_agreement/exec_one_shot/upload_file/close_session/deploy_check） | 真·外部依赖：HDKIT_SANDBOX_MAINTENANCE 沙箱服务维护中；解除条件=沙箱维护窗口结束 |
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | 真·外部依赖：HDKIT_SANDBOX_MAINTENANCE 沙箱服务维护中；解除条件=沙箱维护窗口结束 |
| `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | 真·外部依赖：RDS 实例创建需 VPC/子网/安全组前置环境 + 正确 db 参数 + 长 provisioning 窗口 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`无`（show_profile_redacted 全脱敏；D9-13 无明文残留；真云探针 stdout 二次 redact 复核无 AK/SK 泄漏）
- [x] 写操作误判 read-only：`无`（D4-5 写动词均 deny/write；D4-8 py/Node 一致）
- [x] 红线（I 类）违规：`0`（真云建删归零、未 mock、未以无凭证标 BLOCKED）
- [x] 脱敏复核：`D4-27 空格形态缺口为已知缺陷（历史），其余路径 <redacted> 正常`

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC（D3-C1）| `a3f3e872` | DeleteVpc + 手工二次删除 | 已消失（VPC.9904 not found） |
| 子网（D3-C1）| `e38f488b` | 随 VPC 级联 / DeleteSubnet | 已消失（SYS.0404） |
| ECS（D3-C1）| `7158e039` | DeleteServers | 已消失（Ecs.0114 not found） |
| VPC（D4-14 审计）| 建 → CTS → 删 | DeleteVpc | 归零验证通过 |
| VPC（D3-S2）| `319a5212` | 确认后 DeleteVpc | 归零 true |
| FunctionGraph（D3-S6）| CreateFunction URN | DeleteFunction | 归零 true |
| OBS（D3-C2/C13）| mb 建桶 | rm 对象 + 删桶 | 归零 true |
| EIP（D3-C7）| 创建含 region | 未实际绑定（plan 级）| ListEips 空 |
| 只读子账号（D4-13）| 写 CreateVpc 被拒 | 未创建 | 归零 true（created=false） |

> 真云用例均建删归零（只删本次创建资源），无残留。

---

## 八、遗留与建议

- SPEC-MISMATCH 3 项待维护者裁决（D1-65 / D1-68 / D9-9）。
- D3-C3/C6/S3 沙箱 HDKIT_SANDBOX_MAINTENANCE 维护恢复后补测（含历史 #981 deploy_nginx 验证误判）。
- D3-S7 RDS 跨服务交付需补 VPC/子网/安全组前置编排 + 正确 db 参数（--cli-jsonInput）。
- D1-70 undici 浮点依赖建议锁定 engines `>=22.19` 或降级 undici（历史 #915 持续复现）。
