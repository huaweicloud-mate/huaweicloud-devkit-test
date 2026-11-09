# AtomCode-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`AtomCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-10 05:24:46（北京时间）
> **执行归档**：`results/AtomCode/2026-11-10-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷；均为历史缺陷复核 + 测试侧真云脚本缺陷，无新增确定性产品缺陷）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `AtomCode` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux`（aarch64，Ubuntu 24.04） |
| Node / npm / Python | `Node v22.13.0` / npm / `Python 3.12.3` |
| 被测版本（SUT） | `huaweicloud-devkit v1.1.14-next.1`（npm @next，gitHead `c6e30cdb`） |
| 真云凭证 | `cn-north-4`（AK/SK 已配置，真机执行 ECS/OBS/沙箱 E2E） |
| daily 基础用例 | 设计级 107（预筛后）/ 展开级 39（预筛本客户端+OS） |

> **执行方法**：源码探针直调（`probe.mjs` 经 `import(pathToFileURL(hdk/plugins/huaweicloud-core/src/*.mjs))` 动态引入真实函数并断言回填 142 例）+ 真云 E2E 真机执行（`scripts/realcloud_e2e.mjs` 建删 ECS/VPC/subnet/OBS/沙箱会话 4 例）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `132 / 12 / 0 / 1 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH = 145） | `91.0%` |
| P0 / P1 / P2 新增缺陷 | `0 / 0 / 0`（均为历史缺陷复核，0 项新增确定性产品缺陷） |
| 红线（I 类）违规 | 无（见 §六） |
| 资源释放 | 已归零（ECS 首次清理轮询未确认，人工补删并归零验证通过，见 §七） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `94` | 有证据且通过 PASS 门禁 |
| FAIL | `11` | 不符预期，根因见缺陷清单 |
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
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏正确性（JSON 小写键） | `safety-policy.mjs:34-47` redactString 未覆盖 JSON 引号键+小写 ak/sk | 历史 #1055/#857/#752 等 |
| 2 | P1 | `D3-C1` | D3功能 | ECS 生命周期 E2E | `realcloud_e2e.mjs` finally 归零轮询未确认 ECS 删除（测试侧） | 测试侧，人工补删已归零 |
| 3 | P1 | `D3-C2` | D3功能 | OBS 静态站部署 E2E | `realcloud_e2e.mjs` OBS建桶断言对返回结构误判（测试侧） | 测试侧 |
| 4 | P1 | `D3-C7` | D3功能 | 跨区域资源操作引导（区域维度） | `tools.mjs` get_regional_availability 未校验目标区域 IAM 项目绑定 | 历史 |
| 5 | P1 | `D3-S1` | D3功能 | 场景-只读查 ECS（带不改约束） | `tools.mjs:2546` serviceCatalog 分词不切中文夹英文 token | 历史 #844 等 |
| 6 | P1 | `D3-S2` | D3功能 | 场景-删 VPC 先确认 | 同上（serviceCatalog 中文路由 miss fallback） | 历史 |
| 7 | P1 | `D3-S3` | D3功能 | 场景-沙箱预览出 URL | 同上（serviceCatalog 中文路由 miss fallback） | 历史 |
| 8 | P2 | `D3-S5` | D3功能 | 场景-复合意图分层路由 | 同上（serviceCatalog 中文路由 miss fallback） | 历史 |
| 9 | P2 | `D4-25` | D4安全 | Python hook 事件遥测分类 | `hooks/huaweicloud-safety.py:46` WRITE_OPERATION_RE 前向边界未命中空格分隔写命令 | 历史 |
| 10 | P1 | `D4-27` | D4安全 | 双路径输出脱敏 | `safety-policy.mjs:45` `(AK\|SK)` 未加 `i`，小写 ak=/sk= 不命中 | 历史 |
| 11 | P2 | `D8-9` | D8质量 | 安装 ID 与遥测值脱敏 | `telemetry/telemetry.mjs:190-199` sanitizeValue 无键名脱敏逻辑 | 历史 #980 |
| 12 | P1 | `EXP-E01` |  | serviceCatalog 中文意图路由 | 同 #5（中文夹英文服务名不切词 → miss fallback） | 历史 |
| 13 | P1 | `D9-9` | D9协议 | tools/call 超时协议语义与取消 | `mcp-protocol.mjs` 未声明 cancellation（SPEC-MISMATCH） | SPEC 待裁决 |

### 根因详情

- **D2-4**（期望：输出不含明文 `AKID123456`；实际：`{"ak":"AKID123456","sk":"secret789","token":"TOKEN123"}` 原样返回）：`plugins/huaweicloud-core/src/safety-policy.mjs:34-47` `redactString()` 仅匹配未加引号键的 `key=value`/`key: value`，且 `(AK|SK)` 正则未加 `i`，JSON 对象字符串 `{"ak":"..."}` 引号键+小写键不在覆盖范围。
- **D3-C1**（测试侧）：ECS 真机创建成功（VPC/subnet 均建成功），`finally` 提交 DeleteServers 后 150s 轮询未确认 ECS 进入 DELETED 即判 FAIL；本日账号残留 ACTIVE ECS `testbot3-hermes-ecs-4258995160`（id `9ef3cf1b-cf72-4888-a72a-7575c4a4abe2`），测试侧人工补删并归零验证通过（VPC `32368931`/subnet `b72cc220` 已删除，EIP 归零）。
- **D3-C2**（测试侧）：OBS 建桶实际成功（`successfully` + request id `000001A1C22DFEA0...`），`set/get/删桶归零` 均 PASS，仅「OBS建桶」断言对返回结构判误导致整例 FAIL；桶 `testbot3-hermes-obs-4258995160` 已删除归零。
- **D3-C7**：`get_regional_availability(ecs,ap-southeast-3)` 返回 `available=true`，但最小 EIP 创建返回 `VPC.0501`（token 项目 cn-north-4 与目标区域不匹配），`tools.mjs` 仅校验服务级可用性、未校验目标区域 IAM 项目绑定。
- **D3-S1/S2/S3/S5 / EXP-E01**：`tools.mjs:2546` 分词 `it.split(/[\s,./-]+/)` 对「中文+英文无空格」不切分英文 token，且英文关键词仅全等匹配（CJK 关键词才走子串），中文夹英文意图（`cn-north-4的ECS`、`云主机`）命中为空 → fallback `tools.mjs:2572`。
- **D4-25**：`hooks/huaweicloud-safety.py:46` `WRITE_OPERATION_RE` 前向边界 `(^|[A-Za-z0-9])` 在空格分隔命令 token 场景未命中，写命令遥测分类落到 `cli:invoke`。
- **D4-27**（期望：`ak=AKID456` 后输出不含 `AKID456`；实际：`token=<redacted> ak=AKID456 sk=secret789`）：`safety-policy.mjs:45` 仅匹配大写 `AK=`/`SK=`，小写 `ak=`/`sk=` 不命中。
- **D8-9**（期望：遥测 sanitize 含 `AK=...` 时不泄露明文；实际：`AK=ABC123XYZ` 原样返回）：`telemetry/telemetry.mjs:190-199` `sanitizeValue()` 仅做控制字符清理 + 长度截断，无 AK/SK/secret 键名脱敏。
- **D9-9**（SPEC-MISMATCH）：`mcp-protocol.mjs` 未声明 cancellation/notifications/cancel 能力（契约漂移待裁决）。

> 说明：昨日 FAIL 的 D3-C3（沙箱部署 E2E）本日 5/5 全 PASS，不再列为缺陷；D3-C1/D3-C2 仍为 `scripts/realcloud_e2e.mjs` 测试脚本清理/断言缺陷（非产品缺陷）。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 |
|---|---|---|---|---|---|
| `D1-39` | 设计级 | P0 | NOT_RUN | 不适用本OS | Windows 专属用例（升级检测链 EINVAL 逻辑专属 Windows，OS=Windows 专属标注），本客户端为 Linux，按 AGENTS.md 属 OS 专属 P0 NOT_RUN 唯一例外，Linux 侧由展开级 NR3 终端矩阵覆盖 |

> BLOCKED：`0` 项。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：无运行时真凭据泄漏事件；D2-4/D4-27/D8-9 为**脱敏能力不足**（样例明文残留，属 II 类安全缺陷，非真凭据泄露）。
- [x] 写操作误判 read-only：无；D4 安全基线（deny/read-only 分类、approval token、hook 注入）均 PASS（除 D4-25 写命令分类偏差记录）。
- [x] 红线（I 类）违规：无。
- [x] 脱敏复核：D2-4（FAIL）/ D4-27（FAIL）/ D8-9（FAIL）三项脱敏缺陷复核，均复现且将在 HISTORY_LINKS.md 关联上游 issue。

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS `testbot3-hermes-ecs-4258995160` | 是（c6.large.2，cn-north-4） | 是（首次提交删除后轮询未确认，人工补删） | 已归零（`hcloud ECS ListServersDetails` 轮询确认 id `9ef3cf1b` 不存在） |
| VPC `testbot3-hermes-e2e-4258995160` | 是 | 是（DeleteSubnet + DeleteVpc） | 已归零（id `32368931` 已不在 VPC 列表） |
| Subnet（同名 -subnet，id `b72cc220`） | 是 | 是 | 已归零（SYS.0404 资源不存在） |
| EIP（ECS 公网 IP） | 是（随 ECS --delete_publicip） | 是 | 已归零（EIP 列表 total_count=0） |
| OBS `testbot3-hermes-obs-4258995160` | 是 | 是 | 已归零（删桶 success） |
| 沙箱会话（D3-C3/D3-C6） | 是（devStage） | 是（close_session） | 已关闭 |

> 说明：ECS 删除首次未被 150s 轮询确认，属测试脚本清理窗口缺陷；测试侧已人工补删并逐一归零验证（ECS/VPC/subnet/EIP/OBS 全部归零），只删本次创建资源。

---

## 八、遗留与建议

- D9-9 取消/超时协议语义（SPEC-MISMATCH）待维护者裁决是否纳入 MCP 协议契约。
- D3-C1/D3-C2 为 `scripts/realcloud_e2e.mjs` 测试脚本清理/断言缺陷，建议测试侧修正（延长归零轮询窗口、放宽建桶断言）。
- 其余 FAIL 均为历史缺陷复核（见 HISTORY_LINKS.md 关联上游 issue），建议持续跟踪上游修复进度。