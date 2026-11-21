# AtomCode-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`AtomCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-21 06:05（北京时间）
> **执行归档**：`results/AtomCode/2026-11-21-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`FAIL`（P0 1 项 + P1 9 项 + P2 3 项，serviceCatalog 路由与凭证脱敏存在实质缺陷）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `AtomCode` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux aarch64`（ecs-hd-ai-work-00-0003，Ubuntu 6.8.0-106） |
| Node / npm / Python | `v22.23.5` / `10.9.2` / `3.12.3` |
| 被测版本（SUT） | `1.1.15`（npm latest，gitHead `bf79b643`，src 布局 `.mjs`） |
| 工具全集 | `49`（`tools.mjs` TOOL_DEFINITIONS） |
| 真云凭证 | `cn-north-4`（AK/SK 已配置，`~/.config/huaweicloud/credentials.json`） |
| 测试类型 | 源码级探针直调 / 真机 CLI（install/doctor/status/update）/ MCP 协议 / 真云 E2E |
| daily 基础用例 | 设计级 107 / 展开级 39 / 使命 mission-001（9 条，映射 D4 安全用例） |

> **执行方法**：探针脚本（.mjs）直调 `plugins/huaweicloud-core/src/*.mjs` 导出函数，决策落 `evidence/<case-id>/stdout.log`（JSON）；CLI 子命令真机运行（`huaweicloud-devkit doctor` 等）；真云 D3-C1/C2/C3/C6 用 `scripts/realcloud_e2e.mjs` 真机建删资源并归零。本轮 SUT 从上一日 `2.0.0-next.4`（dist 布局）切回 `1.1.15`（src 布局），探针已做 dist→src、`.js`→`.mjs` 机械改写后真实重跑（subprocess node 执行，非 mock）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `132 / 13 / 0 / 0 / 1` |
| 通过率（分母 = PASS+FAIL = 145） | `91.0%` |
| P0 / P1 / P2 新增缺陷 | `1 / 9 / 3` |
| 红线（I 类）违规 | `1`（D3-C1 真云 ECS 首轮删除未在轮询期确认归零，已人工补齐删除并验证归零） |
| 资源释放 | `全部归零`（ECS=0、VPC/subnet 已删、EIP 随 ECS 释放、OBS 桶已删） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `94` | 有证据且通过 PASS 门禁 |
| FAIL | `12` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `1` | D1-39 Windows 专属用例，Linux 不适用（由展开级 EXP-NR3-10 代表覆盖） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01 路由未命中，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

### 3.3 使命清单（mission-001）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `7` | D4-1/2/4/5/7/15/16 通过 |
| FAIL | `2` | D4-25、D4-27 与设计级同源 |
| **合计** | **`9`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏正确性 | `safety-policy.mjs:34-46` | 待提单 |
| 2 | P1 | `D3-C1` | D3功能 | ECS生命周期E2E | 真云删除确认窗口不足（回归零补齐） | 待提单 |
| 3 | P1 | `D3-C2` | D3功能 | OBS静态站部署E2E | 测试侧 exit-code 判据（非产品缺陷） | 待提单 |
| 4 | P1 | `D3-C7` | D3功能 | 跨区域资源操作引导（区域维度） | `tools.mjs` 跨 region 执行/region 绑定（VPC.0501） | 待提单 |
| 5 | P1 | `D3-S1` | D3功能 | 场景-只读查ECS(带不改约束) | `tools.mjs:2574,2813,2827-2829` | 待提单 |
| 6 | P1 | `D3-S2` | D3功能 | 场景-删VPC先确认 | `tools.mjs:2574,2813,2827-2829` | 待提单 |
| 7 | P1 | `D3-S3` | D3功能 | 场景-沙箱预览出URL | `tools.mjs:2574,2813,2827-2829` | 待提单 |
| 8 | P2 | `D3-S5` | D3功能 | 场景-复合意图分层路由 | `tools.mjs:2574,2813,2827-2829` | 待提单 |
| 9 | P2 | `D4-25` | D4安全 | Python hook 事件遥测分类 | `huaweicloud-safety.py:46,111-112` | 待提单 |
| 10 | P1 | `D4-27` | D4安全 | 双路径输出脱敏 | `safety-policy.mjs:42,45` | 待提单 |
| 11 | P2 | `D8-9` | D8质量 | 安装 ID 与遥测值脱敏 | `telemetry.mjs:190-197` | 待提单 |
| 12 | P1 | `D10-3` | D10评测 | 路由准确率+混淆矩阵 | `tools.mjs:2574,2813,2827-2829` | 待提单 |
| 13 | P1 | `EXP-E01` | 展开级 | 云主机查询意图路由 | `tools.mjs:2574,2813,2827-2829` | 待提单 |

### 根因详情

**#1 [P0] D2-4 凭证脱敏正确性**
- 期望：`redactSecrets` 输出无明文凭证字段（AK 中段、SK 永不完整）
- 实际：`redactSecrets('{"ak":"AKID123456","sk":"secret789","token":"TOKEN123"}')` 原样返回，明文未替换
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:34-46` `redactString()` 正则仅覆盖 `key=value`/`key: value` 命令行形态，不覆盖 JSON `"ak":"..."` 键值形态；字符串入参走 `redactString()` 而非对象 `isSecretKeyName()` 路径
- 证据：`evidence/D2-4/stdout.log`

**#2 [P1] D3-C1 ECS 生命周期 E2E**
- 期望：创建资源 100% 释放并归零验证通过
- 实际：ECS 创建成功（返回 serverIds），`DeleteServers` 提交后 ~150s 轮询仍「仍在/未确认」，脚本 FAIL；VPC/subnet 正常删除
- 根因：ECS 异步删除确认窗口不足（真云清理时序）；本轮已人工二次删除并验证 ListServersDetails 归零
- 证据：`evidence/D3-C1/stdout.log`

**#3 [P1] D3-C2 OBS 静态站部署 E2E（测试侧）**
- 期望：建桶→置静态站→读取→删桶归零全链路成功
- 实际：建桶实际成功（输出 `successfully` 且删桶成功），但脚本「OBS建桶」步 `mb.ok && /success/i.test(...)` 判 false
- 根因：测试断言以 obs CLI exit-code 为判据，与「successfully」成功文本不一致（测试侧判定问题，非产品缺陷），资源已归零
- 证据：`evidence/D3-C2/stdout.log`

**#4 [P1] D3-C7 跨区域资源操作引导**
- 期望：跨区域命令含 `--cli-region` 且可执行；最小 EIP 创建后释放归零
- 实际：创建 EIP 返回 `VPC.0501`（token project `cn-north-4` 含 region 信息，与 `ap-southeast-3` 不匹配）
- 根因：跨 region 写操作时 IAM token 绑定 cn-north-4 项目、执行链未切换目标 region project 上下文（`plugins/huaweicloud-core/src/tools.mjs` 跨区域执行/region 绑定）
- 证据：`evidence/D3-C7/stdout.log`

**#5~#8、#12、#13 serviceCatalog 意图路由未命中**
- 期望：中文意图路由命中对应 service（ECS/VPC/Sandbox/复合分层等），D10-3 路由准确率 ≥ 50%
- 实际：`service_catalog` 对「列出 ECS/删除 VPC/沙箱预览/复合意图/云主机查询」等意图全量返回 `recommendedServices=['Run hcloud --help to list available services.']`，D10-3 eval-set 15 条 acc=0.0%（no-verdict）
- 根因：`plugins/huaweicloud-core/src/tools.mjs:2574` `serviceCatalog()` 意图匹配为空 → `:2813,2827-2829` 空结果回落 `Run hcloud --help`
- 证据：`evidence/D3-S1|D3-S2|D3-S3|D3-S5|D10-3|EXP-E01/stdout.log`

**#9 [P2] D4-25 Python hook 事件遥测分类**
- 期望：写→cli:write、只读→cli:read、其他→cli:invoke
- 实际：`hcloud ECS DeleteServers ...` 落 `cli:invoke` 而非 `cli:write`
- 根因：`plugins/huaweicloud-core/hooks/huaweicloud-safety.py:46` `WRITE_OPERATION_RE` 左边界 `(^|[A-Za-z0-9])` 要求写动词前为字母/数字，空格分隔命令未命中；`:111-112` 判定落入 cli:invoke
- 证据：`evidence/D4-25/stdout.log`

**#10 [P1] D4-27 双路径输出脱敏**
- 期望：redactSecrets 与 redactOutput 双路径均替换明文凭证
- 实际：`redactSecrets("token=abc123 ak=AKID456 sk=secret789")` → `token=<redacted> ak=AKID456 sk=secret789`，ak/sk 未脱敏
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:42,45` 正则大小写敏感、未覆盖小写 `ak`/`sk` 缩写
- 证据：`evidence/D4-27/stdout.log`

**#11 [P2] D8-9 安装 ID 与遥测值脱敏**
- 期望：sanitizeValue 移除 AK/SK/token 等敏感值
- 实际：`sanitizeValue("AK=ABC123XYZ")` 原样返回
- 根因：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:190-197` `sanitizeValue()` 仅 trim/截断，无脱敏逻辑
- 证据：`evidence/D8-9/stdout.log`

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 |
|---|---|---|---|---|---|
| `D1-39` | 设计级 | P0 | NOT_RUN | 调归属 | OS 列标注「Windows 专属」（升级检测链 EINVAL 专属），本机 Linux 不适用；Linux 侧由展开级 EXP-NR3-10 终端矩阵代表覆盖 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`（D4-5/D4-9/D4-16 等写操作拦截用例均 PASS）
- [x] 红线（I 类）违规：`1`（D3-C1 ECS 删除首轮未确认归零，已人工补齐删除并验证归零）
- [x] 脱敏复核：证据目录无原始凭证明文（D2-4/D4-27/D8-9 已作为脱敏缺陷记录）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（D3-C1，c6.large.2） | 是 | 已删（二次删除补齐） | `ListServersDetails` 返回空（ECS=0） |
| VPC / 子网（D3-C1） | 是 | 已删 | 脚本校验 subnet:OK vpc:OK |
| EIP（D3-C1） | 是 | 随 ECS `--delete_publicip=true` 释放 | 无残留 |
| OBS 桶（D3-C2） | 是 | 已删 | 删桶输出 `successfully` |
| 沙箱会话（D3-C3/D3-C6） | 是 | close_session | 返回 `ok`，无计费残留 |

> 真云只删本次创建资源（`testbot3-hermes-*` 时间戳名，逐项盘点），未触碰既有/他人资源。

---

## 八、遗留与建议

- 待裁决 SPEC：无。
- 本轮未覆盖说明：D1-39（Windows 专属）由 Linux 展开级代表覆盖，不适用标注 NOT_RUN。
- 建议：① `serviceCatalog` 中文意图路由（D3-S1/S2/S3/S5、D10-3、EXP-E01 同源）与凭证脱敏（D2-4/D4-27/D8-9）为最高优先修复项；② 关注上一日已报告的「npm @next 安装回落 latest」现象，本轮 prepare_env 自动取 latest=1.1.15（自 2.0.0-next.4 切回），SUT 版本抖动需维护方确认 dist-tag 策略。