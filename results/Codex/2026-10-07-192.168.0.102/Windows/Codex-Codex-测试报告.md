# Codex-Codex 每日测试报告
> **报告名**：`Codex-Codex-测试报告.md`
> **生成时间**：2026-10-07 05:08:03（北京时间）
> **执行归档**：`results/Codex/2026-10-07-192.168.0.102/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（无 P0 缺陷）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Codex` + `Codex` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `1.1.8-next.1` |
| daily 基础用例 | 设计级 102 / 展开级 39 |

> **执行方法**：TODO: 待 agent 补充（探针直调 / MCP 真机 / 真云 E2E 等）

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `141`（设计级 102 + 展开级 39） |
| 已执行 | `141` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `97 / 13 / 31 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 110） | `88.2%` |
| P0 / P1 / P2 新增缺陷 | `0 / 13 / 0` |
| 红线（I 类）违规 | `TODO: 待填` |
| 资源释放 | `TODO: 待填` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `71` | 有证据且通过 PASS 门禁 |
| FAIL | `2` | 不符预期，根因见缺陷清单 |
| BLOCKED | `29` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`102`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `26` | 有证据且通过 PASS 门禁 |
| FAIL | `11` | 不符预期，根因见缺陷清单 |
| BLOCKED | `2` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P1 | `D4-17` | D4安全 | hook模糊fail-closed | TODO: 待补根因 | 待提单 |
| 2 | P1 | `D4-27` | D4安全 | 双路径输出脱敏 | TODO: 待补根因 | 待提单 |
| 3 | P1 | `EXP-E01` |  |  | TODO: 待补根因 | 待提单 |
| 4 | P1 | `EXP-E02` |  |  | TODO: 待补根因 | 待提单 |
| 5 | P1 | `EXP-E03` |  |  | TODO: 待补根因 | 待提单 |
| 6 | P1 | `EXP-E04` |  |  | TODO: 待补根因 | 待提单 |
| 7 | P1 | `EXP-E05` |  |  | TODO: 待补根因 | 待提单 |
| 8 | P1 | `EXP-E07` |  |  | TODO: 待补根因 | 待提单 |
| 9 | P1 | `EXP-E10` |  |  | TODO: 待补根因 | 待提单 |
| 10 | P1 | `EXP-E11` |  |  | TODO: 待补根因 | 待提单 |
| 11 | P1 | `EXP-E12` |  |  | TODO: 待补根因 | 待提单 |
| 12 | P1 | `EXP-E13` |  |  | TODO: 待补根因 | 待提单 |
| 13 | P1 | `EXP-E14` |  |  | TODO: 待补根因 | 待提单 |

### 根因详情

> TODO: 每个 FAIL 用例的「期望 / 实际 / 根因（文件:行号）/ 证据」需由 agent 依据 evidence/<case-id>/stdout.log 补充。

---

## 五、未执行用例与原因


### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D1-65` | D1安装 | 调试模式环境变量 | 本次 Codex/Windows 执行包没有该场景的 Codex-owned 可执行 fixture/harness，当前无法真实执行所需的宿主/云端工作流；解除条件：提供对应 Codex fixture/harness 或分配到具备该场景的客户端/真云测试环境。 用例: D1-65 |
| `D1-66` | D1安装 | 遥测开关与端点环境变量 | 本次 Codex/Windows 执行包没有该场景的 Codex-owned 可执行 fixture/harness，当前无法真实执行所需的宿主/云端工作流；解除条件：提供对应 Codex fixture/harness 或分配到具备该场景的客户端/真云测试环境。 用例: D1-66 |
| `D1-67` | D1安装 | Agent toolkit 模式与 DSH 跳过安装环境变量 | 本次 Codex/Windows 执行包没有该场景的 Codex-owned 可执行 fixture/harness，当前无法真实执行所需的宿主/云端工作流；解除条件：提供对应 Codex fixture/harness 或分配到具备该场景的客户端/真云测试环境。 用例: D1-67 |
| `D1-68` | D1安装 | 图标离线与区域环境变量 | 本次 Codex/Windows 执行包没有该场景的 Codex-owned 可执行 fixture/harness，当前无法真实执行所需的宿主/云端工作流；解除条件：提供对应 Codex fixture/harness 或分配到具备该场景的客户端/真云测试环境。 用例: D1-68 |
| `D1-69` | D1安装 | CLI help 子命令 | 本次 Codex/Windows 执行包没有该场景的 Codex-owned 可执行 fixture/harness，当前无法真实执行所需的宿主/云端工作流；解除条件：提供对应 Codex fixture/harness 或分配到具备该场景的客户端/真云测试环境。 用例: D1-69 |
| `D1-70` | D1安装 | 代理配置与 WebSocket 代理 | 本次 Codex/Windows 执行包没有该场景的 Codex-owned 可执行 fixture/harness，当前无法真实执行所需的宿主/云端工作流；解除条件：提供对应 Codex fixture/harness 或分配到具备该场景的客户端/真云测试环境。 用例: D1-70 |
| `D2-27` | D2认证 | KooCLI 版本管理 | 本次 Codex/Windows 执行包没有该场景的 Codex-owned 可执行 fixture/harness，当前无法真实执行所需的宿主/云端工作流；解除条件：提供对应 Codex fixture/harness 或分配到具备该场景的客户端/真云测试环境。 用例: D2-27 |
| `D3-C13` | D3功能 | OBS 静态网站托管配置 | 本次 Codex/Windows 执行包没有该场景的 Codex-owned 可执行 fixture/harness，当前无法真实执行所需的宿主/云端工作流；解除条件：提供对应 Codex fixture/harness 或分配到具备该场景的客户端/真云测试环境。 用例: D3-C13 |
| `D3-C14` | D3功能 | 沙箱 HDKit 服务参数与 hwlink 凭证 | 本次 Codex/Windows 执行包没有该场景的 Codex-owned 可执行 fixture/harness，当前无法真实执行所需的宿主/云端工作流；解除条件：提供对应 Codex fixture/harness 或分配到具备该场景的客户端/真云测试环境。 用例: D3-C14 |
| `D3-S1` | D3功能 | 场景-只读查ECS(带不改约束) | 本次 Codex/Windows 执行包没有该场景的 Codex-owned 可执行 fixture/harness，当前无法真实执行所需的宿主/云端工作流；解除条件：提供对应 Codex fixture/harness 或分配到具备该场景的客户端/真云测试环境。 用例: D3-S1 |
| `D3-S2` | D3功能 | 场景-删VPC先确认 | 本次 Codex/Windows 执行包没有该场景的 Codex-owned 可执行 fixture/harness，当前无法真实执行所需的宿主/云端工作流；解除条件：提供对应 Codex fixture/harness 或分配到具备该场景的客户端/真云测试环境。 用例: D3-S2 |
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | 本次 Codex/Windows 执行包没有该场景的 Codex-owned 可执行 fixture/harness，当前无法真实执行所需的宿主/云端工作流；解除条件：提供对应 Codex fixture/harness 或分配到具备该场景的客户端/真云测试环境。 用例: D3-S3 |
| `D3-S4` | D3功能 | 场景-领券闭环 | 本次 Codex/Windows 执行包没有该场景的 Codex-owned 可执行 fixture/harness，当前无法真实执行所需的宿主/云端工作流；解除条件：提供对应 Codex fixture/harness 或分配到具备该场景的客户端/真云测试环境。 用例: D3-S4 |
| `D3-S5` | D3功能 | 场景-复合意图分层路由 | 本次 Codex/Windows 执行包没有该场景的 Codex-owned 可执行 fixture/harness，当前无法真实执行所需的宿主/云端工作流；解除条件：提供对应 Codex fixture/harness 或分配到具备该场景的客户端/真云测试环境。 用例: D3-S5 |
| `D3-S6` | D3功能 | 场景-FunctionGraph定时任务 | 本次 Codex/Windows 执行包没有该场景的 Codex-owned 可执行 fixture/harness，当前无法真实执行所需的宿主/云端工作流；解除条件：提供对应 Codex fixture/harness 或分配到具备该场景的客户端/真云测试环境。 用例: D3-S6 |
| `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | 本次 Codex/Windows 执行包没有该场景的 Codex-owned 可执行 fixture/harness，当前无法真实执行所需的宿主/云端工作流；解除条件：提供对应 Codex fixture/harness 或分配到具备该场景的客户端/真云测试环境。 用例: D3-S7 |
| `D3-S8` | D3功能 | 场景-操作失败后排障指引 | 本次 Codex/Windows 执行包没有该场景的 Codex-owned 可执行 fixture/harness，当前无法真实执行所需的宿主/云端工作流；解除条件：提供对应 Codex fixture/harness 或分配到具备该场景的客户端/真云测试环境。 用例: D3-S8 |
| `D4-16` | D4安全 | 命令包裹穿透 | 本次 Codex/Windows 执行包没有该场景的 Codex-owned 可执行 fixture/harness，当前无法真实执行所需的宿主/云端工作流；解除条件：提供对应 Codex fixture/harness 或分配到具备该场景的客户端/真云测试环境。 用例: D4-16 |
| `D4-25` | D4安全 | Python hook 事件遥测分类 | 本次 Codex/Windows 执行包没有该场景的 Codex-owned 可执行 fixture/harness，当前无法真实执行所需的宿主/云端工作流；解除条件：提供对应 Codex fixture/harness 或分配到具备该场景的客户端/真云测试环境。 用例: D4-25 |
| `D4-26` | D4安全 | findings 证据脱敏 | 本次 Codex/Windows 执行包没有该场景的 Codex-owned 可执行 fixture/harness，当前无法真实执行所需的宿主/云端工作流；解除条件：提供对应 Codex fixture/harness 或分配到具备该场景的客户端/真云测试环境。 用例: D4-26 |
| `D4-28` | D4安全 | Node 版安全 hook 链路 | 本次 Codex/Windows 执行包没有该场景的 Codex-owned 可执行 fixture/harness，当前无法真实执行所需的宿主/云端工作流；解除条件：提供对应 Codex fixture/harness 或分配到具备该场景的客户端/真云测试环境。 用例: D4-28 |
| `D4-29` | D4安全 | 分类断言与原始命令分类入口 | 本次 Codex/Windows 执行包没有该场景的 Codex-owned 可执行 fixture/harness，当前无法真实执行所需的宿主/云端工作流；解除条件：提供对应 Codex fixture/harness 或分配到具备该场景的客户端/真云测试环境。 用例: D4-29 |
| `D6-9` | D6性能 | 缓存清理三入口 | 本次 Codex/Windows 执行包没有该场景的 Codex-owned 可执行 fixture/harness，当前无法真实执行所需的宿主/云端工作流；解除条件：提供对应 Codex fixture/harness 或分配到具备该场景的客户端/真云测试环境。 用例: D6-9 |
| `D8-9` | D8质量 | 安装 ID 与遥测值脱敏 | 本次 Codex/Windows 执行包没有该场景的 Codex-owned 可执行 fixture/harness，当前无法真实执行所需的宿主/云端工作流；解除条件：提供对应 Codex fixture/harness 或分配到具备该场景的客户端/真云测试环境。 用例: D8-9 |
| `D8-10` | D8质量 | MCP 配置备份与合并 | 本次 Codex/Windows 执行包没有该场景的 Codex-owned 可执行 fixture/harness，当前无法真实执行所需的宿主/云端工作流；解除条件：提供对应 Codex fixture/harness 或分配到具备该场景的客户端/真云测试环境。 用例: D8-10 |
| `D9-10` | D9协议 | MCP remote transport（HTTP/WS 远程服务） | 本次 Codex/Windows 执行包没有该场景的 Codex-owned 可执行 fixture/harness，当前无法真实执行所需的宿主/云端工作流；解除条件：提供对应 Codex fixture/harness 或分配到具备该场景的客户端/真云测试环境。 用例: D9-10 |
| `D9-11` | D9协议 | WebSocket 隧道通道生命周期 | 本次 Codex/Windows 执行包没有该场景的 Codex-owned 可执行 fixture/harness，当前无法真实执行所需的宿主/云端工作流；解除条件：提供对应 Codex fixture/harness 或分配到具备该场景的客户端/真云测试环境。 用例: D9-11 |
| `D9-12` | D9协议 | initialize 握手协议安全基线 | 本次 Codex/Windows 执行包没有该场景的 Codex-owned 可执行 fixture/harness，当前无法真实执行所需的宿主/云端工作流；解除条件：提供对应 Codex fixture/harness 或分配到具备该场景的客户端/真云测试环境。 用例: D9-12 |
| `D9-13` | D9协议 | tools/call 凭证不泄露与权限校验 | 本次 Codex/Windows 执行包没有该场景的 Codex-owned 可执行 fixture/harness，当前无法真实执行所需的宿主/云端工作流；解除条件：提供对应 Codex fixture/harness 或分配到具备该场景的客户端/真云测试环境。 用例: D9-13 |
| `EXP-D5-2-1` |  |  | 本次 Codex/Windows 执行包没有该场景的 Codex-owned 可执行 fixture/harness，当前无法真实执行所需的宿主/云端工作流；解除条件：提供对应 Codex fixture/harness 或分配到具备该场景的客户端/真云测试环境。 用例: EXP-D5-2-1 |
| `EXP-D5-2-3` |  |  | 本次 Codex/Windows 执行包没有该场景的 Codex-owned 可执行 fixture/harness，当前无法真实执行所需的宿主/云端工作流；解除条件：提供对应 Codex fixture/harness 或分配到具备该场景的客户端/真云测试环境。 用例: EXP-D5-2-3 |

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
