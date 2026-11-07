# AtomCode-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`AtomCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-08 05:16:29（北京时间）
> **执行归档**：`results/AtomCode/2026-11-08-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 1 项，均为历史缺陷复核 + 测试侧/环境问题，无新增确定性产品缺陷）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `AtomCode` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux`（aarch64，Ubuntu 24.04） |
| 被测版本（SUT） | `huaweicloud-devkit v1.1.14-next.0`（npm @next，gitHead `ac955889`，PR #1111） |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：源码探针直调（`probe.mjs` 经 `import(pathToFileURL(hdk/plugins/huaweicloud-core/src/*.mjs))` 动态引入真实函数并断言回填 142 例）+ 真云 E2E 真机执行（`scripts/realcloud_e2e.mjs` 建删 ECS/VPC/subnet/OBS/沙箱会话 4 例）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `131 / 13 / 0 / 1 / 1` |
| 通过率（分母 = PASS+FAIL = 144） | `91.0%` |
| P0 / P1 / P2 新增缺陷 | `1 / 9 / 3`（均为历史缺陷复核，0 项新增确定性产品缺陷） |
| 红线（I 类）违规 | 无（见 §六） |
| 资源释放 | 已归零（ECS 首次清理轮询未确认，人工补删并归零验证通过，见 §七） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `93` | 有证据且通过 PASS 门禁 |
| FAIL | `12` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `1` | 契约漂移 |
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
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏正确性 | `safety-policy.mjs:34-47` redactString 未覆盖 JSON 引号键+小写 ak/sk | 历史 #1055/#857/#752 等 |
| 2 | P1 | `D3-C1` | D3功能 | ECS生命周期E2E | `realcloud_e2e.mjs` finally 归零轮询未确认 ECS 删除（测试侧） | 测试侧，人工补删已归零 |
| 3 | P1 | `D3-C2` | D3功能 | OBS静态站部署E2E | `realcloud_e2e.mjs` OBS建桶断言对返回结构误判（测试侧） | 测试侧 |
| 4 | P1 | `D3-C3` | D3功能 | 沙箱部署E2E | 沙箱编排 flaky：upload_project 120s 超时 / deploy_check 端口不匹配（环境） | 环境不稳定，非确定性缺陷 |
| 5 | P1 | `D3-C7` | D3功能 | 跨区域资源操作引导（区域维度） | `tools.mjs` get_regional_availability 未校验目标区域 IAM 项目绑定 | 历史 |
| 6 | P1 | `D3-S1` | D3功能 | 场景-只读查ECS(带不改约束) | `tools.mjs:2546` serviceCatalog 分词不切中文夹英文 token | 历史 #844 等 |
| 7 | P1 | `D3-S2` | D3功能 | 场景-删VPC先确认 | 同上（serviceCatalog 中文路由 miss fallback） | 历史 |
| 8 | P1 | `D3-S3` | D3功能 | 场景-沙箱预览出URL | 同上（serviceCatalog 中文路由 miss fallback） | 历史 |
| 9 | P2 | `D3-S5` | D3功能 | 场景-复合意图分层路由 | 同上（serviceCatalog 中文路由 miss fallback） | 历史 |
| 10 | P2 | `D4-25` | D4安全 | Python hook 事件遥测分类 | `hooks/huaweicloud-safety.py:46` WRITE_OPERATION_RE 前向边界未命中空格分隔写命令 | 历史 |
| 11 | P1 | `D4-27` | D4安全 | 双路径输出脱敏 | `safety-policy.mjs:45` `(AK\|SK)` 未加 `i`，小写 ak=/sk= 不命中 | 历史 |
| 12 | P2 | `D8-9` | D8质量 | 安装 ID 与遥测值脱敏 | `telemetry/telemetry.mjs:190-199` sanitizeValue 无键名脱敏逻辑 | 历史 #980 |
| 13 | P1 | `EXP-E01` |  | serviceCatalog 中文意图路由 | 同 #6（中文夹英文服务名不切词 → miss fallback） | 历史 |

### 根因详情

- **D2-4**（期望：输出不含明文 `AKID123456`；实际：`{"ak":"AKID123456","sk":"secret789","token":"TOKEN123"}` 原样返回）：`plugins/huaweicloud-core/src/safety-policy.mjs:34-47` `redactString()` 仅匹配未加引号键的 `key=value`/`key: value`，且 `(AK|SK)` 正则未加 `i`，JSON 对象字符串 `{"ak":"..."}` 引号键+小写键不在覆盖范围。
- **D3-C1**（测试侧）：ECS 真机创建成功（VPC/subnet 均建成功），`finally` 提交 DeleteServers 后 150s 轮询未确认 ECS 进入 DELETED 即判 FAIL；本日账号残留 ACTIVE ECS `testbot3-hermes-ecs-4085491387`，测试侧人工补删并归零验证通过（VPC/subnet 已删除）。
- **D3-C2**（测试侧）：OBS 建桶实际成功（`successfully` + request id），`set/get/删桶归零` 均 PASS，仅「OBS建桶」断言对返回结构判误导致整例 FAIL；桶已删除归零。
- **D3-C3**（环境）：4 次真机尝试中 1 次全 PASS，另 3 次分别因 connect 空 ws、`upload_project` 120s `WebSocketExecError` 超时、`deploy_check` 端口不匹配（nginx 落 8082 vs 断言 8080）而 FAIL，属沙箱/DevStation 编排并发不稳定，非确定性产品缺陷。
- **D7 / D3-S1/S2/S3/S5 / EXP-E01**：`tools.mjs:2546` 分词 `it.split(/[\s,./-]+/)` 对「中文+英文无空格」不切分英文 token，且英文关键词仅全等匹配（CJK 关键词才走子串），中文夹英文意图（`cn-north-4的ECS`、`云主机`）命中为空 → fallback `tools.mjs:2572`。
- **D8-9**：`telemetry.mjs:190-199` `sanitizeValue()` 仅做 `[\r\n\t]+`→空格 + 长度截断，无 AK/SK/secret 键名脱敏。
- **D9-9**（SPEC-MISMATCH）：`mcp-protocol.mjs` 未声明 cancellation/notifications/cancel 能力（契约漂移待裁决）。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | OS 专属用例（升级检测链 EINVAL 专属 Windows），本客户端为 Linux，按 AGENTS.md 属 OS 专属 NOT_RUN 例外，Linux 侧由 NR3 终端矩阵覆盖 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：无运行时凭证泄漏事件；D2-4/D4-27/D8-9 为**脱敏能力不足**（输入样例明文残留，属 II 类安全缺陷，非真凭据泄露）。
- [x] 写操作误判 read-only：无；D4 安全基线（deny/read-only 分类、approval token、hook 注入）均 PASS（除 D4-25 写命令分类偏差记录）。
- [x] 红线（I 类）违规：无。
- [x] 脱敏复核：D2-4（FAIL）/ D4-27（FAIL）/ D8-9（FAIL）三项脱敏缺陷复核，均复现且已在上游 issue 关联（HISTORY_LINKS.md）。

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS `testbot3-hermes-ecs-4085491387` | 是（c6.large.2，cn-north-4） | 是（首次提交删除后轮询未确认，人工补删） | 已归零（`hcloud ECS ListServersDetails` 核对该 id 不存在） |
| VPC `testbot3-hermes-e2e-4085491387` | 是 | 是 | 已归零（subnet:OK vpc:OK） |
| Subnet（同名 -subnet） | 是 | 是 | 已归零 |
| OBS `testbot3-hermes-obs-4085491387` | 是 | 是 | 已归零（删桶 success） |
| 沙箱会话（D3-C3/D3-C6） | 是（devStage） | 是（close_session） | 已关闭 |

> 说明：账号在核查期间另现并发其他客户端刚创建的 ECS `testbot3-hermes-ecs-4085739952`（BUILD 状态，TS 晚于本次），非本次创建，未触碰。

---

## 八、遗留与建议

- D9-9 取消/超时协议语义（SPEC-MISMATCH）待维护者裁决是否纳入 MCP 协议契约。
- D3-C3 沙箱编排并发稳定性（connect 偶发空 ws / upload_project 120s 超时 / deploy_check 端口漂移）建议后置到沙箱基础设施侧观测，不宜作为产品缺陷计入。
- D3-C1/D3-C2 为 `scripts/realcloud_e2e.mjs` 测试脚本清理/断言缺陷，建议测试侧修正（延长归零轮询窗口、放宽建桶断言）。
- 其余 FAIL 均为历史缺陷复核（见 HISTORY_LINKS.md 关联上游 issue），建议持续跟踪上游修复进度。