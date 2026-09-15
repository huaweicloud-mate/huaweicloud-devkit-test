# AtomCode-deepseek-v4-pro 测试报告（真云补测）

> **报告名**：`AtomCode-deepseek-v4-pro-测试报告.md`
> **生成时间**：`2026-09-16`（北京时间）
> **执行归档**：`results/AtomCode/2026-09-16-113.44.197.147/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`FAIL`（历史 5 项缺陷 latest v1.1.4 复测仍复现；本次真云补测新增 1 项「测试侧」发现：只读子账号 test001 只读面过窄）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | AtomCode + deepseek-v4-pro |
| OS / 架构 | Linux x86_64 |
| Node / npm | Node v24.19.0 / npm 11.17.0 |
| 被测版本（SUT） | `v1.1.4`（npm latest，gitHead `9b67256e`） |
| hcloud / 依赖 | hcloud 7.2.12 已配置，真实凭证可调云 API |
| 真云凭证 | 管理员 `~/.config/huaweicloud/credentials.json`（cn-north-4）+ 只读子账号 `credentials.readonly.json`（test001） |
| 测试类型 | 源码级探针 / 真机 CLI / 真云 E2E / MCP 协议 |
| daily 执行包 | 设计级 77 / 展开级 17（建包按 agent/OS 预筛） |

> **本轮为「真云补测」**：凭证已于 2026-09-16 重新下发（管理员 + 只读子账号），对 2026-09-15 因「无 AK/SK / 凭证无效 APIGW.0301 / 只读子账号缺失」标 BLOCKED 的真云用例逐条重跑。红线遵守：最低配置创建 → 测后删除并归零 → 只删本次创建资源。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `94`（设计级 77 + 展开级 17） |
| PASS / FAIL / BLOCKED | `61 / 6 / 27` |
| 通过率（分母 = PASS+FAIL，不含 BLOCKED） | `91.0%`（61/67） |
| 本轮真云补测用例 | D3-B3、D3-C4(服务矩阵)、D4-13、D4-14、D2-1/D2-11/D2-16、D4-18/D4-19/D4-20 |
| 新增缺陷 | `0` 产品缺陷 / `1` 测试侧（D4-13 只读子账号只读面过窄） |
| 红线（I 类）违规 | `0` |
| 资源释放 | 本轮真云创建 2 个最小规格 VPC，均测后删除并归零（list 计数=0） |

---

## 三、真云补测结果（重跑 BLOCKED → 实际状态）

| 用例 | 2026-09-15 | 2026-09-16 | 结论 |
|---|---|---|---|
| D3-B3 run_readonly 脱敏执行 | BLOCKED（缺真云/只读子账号） | PASS | 只读命令执行成功 + 输出脱敏 + 无写入 |
| D3-C4 服务矩阵 | 未覆盖 | PASS | 22 服务 list_operations 全部有规范路由；高危服务轻量创建→立即释放 |
| D4-13 最小权限凭证通过率 | BLOCKED（缺只读凭证） | FAIL | 写被 IAM 拒（✓）；只读 100% 可用不达标（1/5 服务可读） |
| D4-14 操作可审计性 | BLOCKED（需 CTS） | PASS | 建 VPC → CTS 查到 createVpc trace → 删除归零 |
| D2-1 auth init 三端同步 | PASS | PASS（重验） | S1/S2/S3 三端落位 + 真云只读 API 可用 |
| D2-11 STS token 拒绝落盘 | PASS | PASS（重验） | persist+token → {status:error, scope:rejected}，token 不落盘 |
| D2-16 import 读取后擦除 | PASS | PASS（重验） | mode=import 读后无条件擦除（exists=False） |
| D4-18 confirm-not-deny | PASS | PASS（重验） | 写未审批拦截 + 可产出 approvalToken |
| D4-19 确认流下预检仍生效 | PASS | PASS（重验） | 高危写操作确认流中预检仍 deny |
| D4-20 拒绝后零操作 | PASS | PASS（重验） | assertAllowed(deny) 抛错 + runHcloud 阻断无执行 |

### D4-13 详述（新增「测试侧」发现）

- **只读子账号 test001**（`iam::842591186fa245929e1b5c186a4cf784:user:test001`）真实凭证有效（可认证），但 IAM 策略**只读面过窄**：实测 `ECS ListServersDetails`、`VPC ListVpcs`、`IMS ListImages`、`RDS ListInstances` 均被 IAM 拒绝（`Pdp.0001` / `SYS.0403`），仅 `EVS ListVolumes` 可读（1/5）。
- **写操作门**：`VPC CreateVpc` 被 IAM 拒绝（`create_router disallowed by policy`），符合「写被拒」预期。
- 结论：`D4-13` 判 **FAIL**，根因不在产品代码，而在**只读子账号 IAM 策略配置**（需补挂 ECS/VPC/IMS/RDS 只读权限，方可满足「只读 100% 可用」）。此为【测试侧】发现，不向产品仓提单。

---

## 四、历史缺陷（latest v1.1.4 复测仍复现，去重）

| # | 级别 | 用例 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|
| 1 | P0 | D4-2 | safety-policy.mjs:336 | 已提单 #650 |
| 2 | P0 | D4-16 | safety-policy.mjs:335 | 已提单 #650 |
| 3 | P0 | D4-21 | cloud-risk-rules.json:192 | 已提单 #651 |
| 4 | P0 | D4-23 | policy.json:26 / safety-policy.mjs:177 | 已提单 #650/#651 |
| 5 | P1 | D9-2 | mcp-server.mjs:169 | 已提单 #650/#652 |

## 五、红线与资源回收

- 本机真云仅创建 2 个最小规格 VPC（`ac-*`），均测后删除并归零验证（`VPC ListVpcs` 计数=0）。
- 未触碰既有/他人资源（机器上存在的 `testbot5-*`、`tctest-*` 等为其他 agent 资源，未删除）。