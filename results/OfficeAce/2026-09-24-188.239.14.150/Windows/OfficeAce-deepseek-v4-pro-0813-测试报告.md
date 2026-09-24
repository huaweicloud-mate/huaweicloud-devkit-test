# OfficeAce-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`OfficeAce-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-09-24 18:34:14（北京时间）
> **执行归档**：`results/OfficeAce/2026-09-24-188.239.14.150/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（无 P0 缺陷）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OfficeAce` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `v1.1.7-next.1` |
| daily 基础用例 | 设计级 102 / 展开级 39 |

> **执行方法**：TODO: 待 agent 补充（探针直调 / MCP 真机 / 真云 E2E 等）

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `141`（设计级 102 + 展开级 39） |
| 已执行 | `0` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `0 / 0 / 0 / 0 / 141` |
| 通过率（分母 = PASS+FAIL = 0） | `0.0%` |
| P0 / P1 / P2 新增缺陷 | `0 / 0 / 0` |
| 红线（I 类）违规 | `TODO: 待填` |
| 资源释放 | `TODO: 待填` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `0` | 有证据且通过 PASS 门禁 |
| FAIL | `0` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `102` | 未执行 |
| **合计** | **`102`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `0` | 有证据且通过 PASS 门禁 |
| FAIL | `0` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `39` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

本轮无 FAIL 用例。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-3` | D1安装 | doctor健康自检 | TODO: 待补原因 |
| `D1-4` | D1安装 | status/update幂等 | TODO: 待补原因 |
| `D1-26` | D1安装 | 升级提醒工具注册与协议暴露 | TODO: 待补原因 |
| `D1-27` | D1安装 | 检测语义-已是最新 | TODO: 待补原因 |
| `D1-28` | D1安装 | 检测语义-有新版本 | TODO: 待补原因 |
| `D1-30` | D1安装 | semver 比对正确性 | TODO: 待补原因 |
| `D1-31` | D1安装 | dismiss 冷却期 | TODO: 待补原因 |
| `D1-33` | D1安装 | skip 文件持久化与多路径 | TODO: 待补原因 |
| `D1-39` | D1安装 | Windows 升级检测链可用性 | TODO: 待补原因 |
| `D1-40` | D1安装 | 镜像 lag 下检测正确性(反向提醒防护) | TODO: 待补原因 |
| `D1-41` | D1安装 | check_update 真实 MCP 返回契约 | TODO: 待补原因 |
| `D1-42` | D1安装 | dismiss 真实闭环与跨调用持久化 | TODO: 待补原因 |
| `D1-45` | D1安装 | 兜底提示真实序列与预热竞态 | TODO: 待补原因 |
| `D1-65` | D1安装 | 调试模式环境变量 | TODO: 待补原因 |
| `D1-66` | D1安装 | 遥测开关与端点环境变量 | TODO: 待补原因 |
| `D1-67` | D1安装 | Agent toolkit 模式与 DSH 跳过安装环境变量 | TODO: 待补原因 |
| `D1-68` | D1安装 | 图标离线与区域环境变量 | TODO: 待补原因 |
| `D1-69` | D1安装 | CLI help 子命令 | TODO: 待补原因 |
| `D1-70` | D1安装 | 代理配置与 WebSocket 代理 | TODO: 待补原因 |
| `D2-10` | D2认证 | R7 current档跟随 | TODO: 待补原因 |
| `D2-11` | D2认证 | R3 STS token拒绝落盘 | TODO: 待补原因 |
| `D2-12` | D2认证 | R10 runtime非空禁止落盘 | TODO: 待补原因 |
| `D2-13` | D2认证 | R9 configuredBySession优先env | TODO: 待补原因 |
| `D2-16` | D2认证 | import文件读取后擦除 | TODO: 待补原因 |
| `D4-18` | D4安全 | confirm-not-deny审批语义 | TODO: 待补原因 |
| `D4-19` | D4安全 | 确认流下预检仍生效 | TODO: 待补原因 |
| `D4-20` | D4安全 | 拒绝后零操作 | TODO: 待补原因 |
| `D2-1` | D2认证 | auth init三端同步 | TODO: 待补原因 |
| `D2-2` | D2认证 | auth status判定准确性 | TODO: 待补原因 |
| `D2-4` | D2认证 | 凭证脱敏正确性 | TODO: 待补原因 |
| `D2-5` | D2认证 | 凭证缺失报错指引 | TODO: 待补原因 |
| `D2-26` | D2认证 | 凭证备份与恢复 | TODO: 待补原因 |
| `D2-27` | D2认证 | KooCLI 版本管理 | TODO: 待补原因 |
| `D3-A1` | D3功能 | skill检索完整性 | TODO: 待补原因 |
| `D3-B1` | D3功能 | list_operations规范名 | TODO: 待补原因 |
| `D3-B3` | D3功能 | run_readonly脱敏执行 | TODO: 待补原因 |
| `D3-B5` | D3功能 | detect_framework识别 | TODO: 待补原因 |
| `D3-C4` | D3功能 | 服务创建类回归 | TODO: 待补原因 |
| `D3-C5` | D3功能 | 工具冒烟 | TODO: 待补原因 |
| `D3-C13` | D3功能 | OBS 静态网站托管配置 | TODO: 待补原因 |
| `D3-C14` | D3功能 | 沙箱 HDKit 服务参数与 hwlink 凭证 | TODO: 待补原因 |
| `D3-S1` | D3功能 | 场景-只读查ECS(带不改约束) | TODO: 待补原因 |
| `D3-S2` | D3功能 | 场景-删VPC先确认 | TODO: 待补原因 |
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | TODO: 待补原因 |
| `D3-S4` | D3功能 | 场景-领券闭环 | TODO: 待补原因 |
| `D3-S5` | D3功能 | 场景-复合意图分层路由 | TODO: 待补原因 |
| `D3-S6` | D3功能 | 场景-FunctionGraph定时任务 | TODO: 待补原因 |
| `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | TODO: 待补原因 |
| `D3-S8` | D3功能 | 场景-操作失败后排障指引 | TODO: 待补原因 |
| `D4-1` | D4安全 | 凭证文件读取拦截 | TODO: 待补原因 |
| `D4-2` | D4安全 | 凭证env打印拦截 | TODO: 待补原因 |
| `D4-3` | D4安全 | 明文secret API拦截 | TODO: 待补原因 |
| `D4-4` | D4安全 | 写操作审批门 | TODO: 待补原因 |
| `D4-5` | D4安全 | 写操作误判检测 | TODO: 待补原因 |
| `D4-6` | D4安全 | adminPass回显警告 | TODO: 待补原因 |
| `D4-7` | D4安全 | hook三工具有效性 | TODO: 待补原因 |
| `D4-8` | D4安全 | Python/Node策略一致 | TODO: 待补原因 |
| `D4-9` | D4安全 | 公开暴露/破坏性预检 | TODO: 待补原因 |
| `D4-10` | D4安全 | 规则库新增回归 | TODO: 待补原因 |
| `D4-11` | D4安全 | 提示注入防护 | TODO: 待补原因 |
| `D4-12` | D4安全 | 供应链安装期安全 | TODO: 待补原因 |
| `D4-13` | D4安全 | 最小权限凭证通过率 | TODO: 待补原因 |
| `D4-14` | D4安全 | 操作可审计性 | TODO: 待补原因 |
| `D4-15` | D4安全 | hook绕过尝试 | TODO: 待补原因 |
| `D4-16` | D4安全 | 命令包裹穿透 | TODO: 待补原因 |
| `D4-17` | D4安全 | hook模糊fail-closed | TODO: 待补原因 |
| `D4-21` | D4安全 | hook_check_artifacts 具名回归（代码/IaC/策略制品预检） | TODO: 待补原因 |
| `D4-22` | D4安全 | hook_check_deploy_plan 具名回归（部署计划预检） | TODO: 待补原因 |
| `D4-23` | D4安全 | 全局规则 huawei-agent-rules.md 注入生效性（11 安装目标） | TODO: 待补原因 |
| `D4-24` | D4安全 | 确认令牌过期与重复确认边界（审批流健壮性） | TODO: 待补原因 |
| `D4-25` | D4安全 | Python hook 事件遥测分类 | TODO: 待补原因 |
| `D4-26` | D4安全 | findings 证据脱敏 | TODO: 待补原因 |
| `D4-27` | D4安全 | 双路径输出脱敏 | TODO: 待补原因 |
| `D4-28` | D4安全 | Node 版安全 hook 链路 | TODO: 待补原因 |
| `D4-29` | D4安全 | 分类断言与原始命令分类入口 | TODO: 待补原因 |
| `D5-1` | D5客户端 | 清单发现加载 | TODO: 待补原因 |
| `D5-3` | D5客户端 | 工具全量枚举 | TODO: 待补原因 |
| `D6-1` | D6性能 | 检索响应延迟 | TODO: 待补原因 |
| `D6-3` | D6性能 | MCP冷启时间 | TODO: 待补原因 |
| `D6-4` | D6性能 | 并发调度正确性 | TODO: 待补原因 |
| `D6-9` | D6性能 | 缓存清理三入口 | TODO: 待补原因 |
| `D9-9` | D9协议 | tools/call 超时协议语义与取消 | TODO: 待补原因 |
| `D8-1` | D8质量 | 文档与能力一致 | TODO: 待补原因 |
| `D8-4` | D8质量 | 引导步骤可机械执行 | TODO: 待补原因 |
| `D8-6` | D8质量 | 中英文文档一致 | TODO: 待补原因 |
| `D8-7` | D8质量 | 7 个 meta/通用技能指引可机械执行验证 | TODO: 待补原因 |
| `D8-9` | D8质量 | 安装 ID 与遥测值脱敏 | TODO: 待补原因 |
| `D8-10` | D8质量 | MCP 配置备份与合并 | TODO: 待补原因 |
| `D9-1` | D9协议 | tools/list合规 | TODO: 待补原因 |
| `D9-2` | D9协议 | JSON-RPC错误码 | TODO: 待补原因 |
| `D9-3` | D9协议 | tools/call响应格式 | TODO: 待补原因 |
| `D9-4` | D9协议 | 协议生命周期 | TODO: 待补原因 |
| `D9-5` | D9协议 | stdio传输健壮 | TODO: 待补原因 |
| `D9-6` | D9协议 | 跨客户端互通 | TODO: 待补原因 |
| `D9-7` | D9协议 | 协议版本协商降级 | TODO: 待补原因 |
| `D9-8` | D9协议 | inputSchema版本合规 | TODO: 待补原因 |
| `D9-10` | D9协议 | MCP remote transport（HTTP/WS 远程服务） | TODO: 待补原因 |
| `D9-11` | D9协议 | WebSocket 隧道通道生命周期 | TODO: 待补原因 |
| `D9-12` | D9协议 | initialize 握手协议安全基线 | TODO: 待补原因 |
| `D9-13` | D9协议 | tools/call 凭证不泄露与权限校验 | TODO: 待补原因 |
| `D10-3` | D10评测 | 路由准确率+混淆矩阵 | TODO: 待补原因 |
| `D10-4` | D10评测 | 安全干预-静态规则层 | TODO: 待补原因 |
| `EXP-D5-7-1` |  |  | TODO: 待补原因 |
| `EXP-D5-7-3` |  |  | TODO: 待补原因 |
| `EXP-C4-01` |  |  | TODO: 待补原因 |
| `EXP-C4-02` |  |  | TODO: 待补原因 |
| `EXP-C4-03` |  |  | TODO: 待补原因 |
| `EXP-C4-04` |  |  | TODO: 待补原因 |
| `EXP-C4-05` |  |  | TODO: 待补原因 |
| `EXP-C4-06` |  |  | TODO: 待补原因 |
| `EXP-C4-07` |  |  | TODO: 待补原因 |
| `EXP-C4-08` |  |  | TODO: 待补原因 |
| `EXP-C4-09` |  |  | TODO: 待补原因 |
| `EXP-C4-10` |  |  | TODO: 待补原因 |
| `EXP-C4-11` |  |  | TODO: 待补原因 |
| `EXP-C4-12` |  |  | TODO: 待补原因 |
| `EXP-C4-13` |  |  | TODO: 待补原因 |
| `EXP-C4-14` |  |  | TODO: 待补原因 |
| `EXP-C4-15` |  |  | TODO: 待补原因 |
| `EXP-C4-16` |  |  | TODO: 待补原因 |
| `EXP-C4-17` |  |  | TODO: 待补原因 |
| `EXP-C4-18` |  |  | TODO: 待补原因 |
| `EXP-C4-19` |  |  | TODO: 待补原因 |
| `EXP-C4-20` |  |  | TODO: 待补原因 |
| `EXP-C4-21` |  |  | TODO: 待补原因 |
| `EXP-C4-22` |  |  | TODO: 待补原因 |
| `EXP-E01` |  |  | TODO: 待补原因 |
| `EXP-E02` |  |  | TODO: 待补原因 |
| `EXP-E03` |  |  | TODO: 待补原因 |
| `EXP-E04` |  |  | TODO: 待补原因 |
| `EXP-E05` |  |  | TODO: 待补原因 |
| `EXP-E06` |  |  | TODO: 待补原因 |
| `EXP-E07` |  |  | TODO: 待补原因 |
| `EXP-E08` |  |  | TODO: 待补原因 |
| `EXP-E09` |  |  | TODO: 待补原因 |
| `EXP-E10` |  |  | TODO: 待补原因 |
| `EXP-E11` |  |  | TODO: 待补原因 |
| `EXP-E12` |  |  | TODO: 待补原因 |
| `EXP-E13` |  |  | TODO: 待补原因 |
| `EXP-E14` |  |  | TODO: 待补原因 |
| `EXP-E15` |  |  | TODO: 待补原因 |

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
