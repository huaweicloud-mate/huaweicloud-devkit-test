# DSH-deepseek-v4-pro-0813 每日测试报告（真云补测版）

> **生成时间**：2026-09-16 00:45（北京时间）
> **执行归档**：`results/DSH/2026-09-16-124.70.78.131/Linux/`
> **被测对象**：huaweicloud-devkit `v1.1.4`（npm latest，gitHead `9b67256e`）
> **结论**：`FAIL`（新增真云补测：D4-13 最小权限动态切换失效 → FAIL；D4-14/18/19/20、D3-C4、D2 真云项全部实测 PASS）

---

## 一、补测概述

本轮为「真云 BLOCKED 补测」：真云凭证已重新下发（管理员 `credentials.json` + 只读子账号 `credentials.readonly.json`/test001），对 2026-09-15 因「无 AK/SK / 凭证无效 APIGW.0301 / 只读子账号缺失」标 BLOCKED 的真云用例用新凭证重跑。

| 项 | 值 |
|---|---|
| 客户端 / Agent | DSH + deepseek-v4-pro-0813 |
| OS / 架构 | Linux x86_64（机器 IP 124.70.78.131） |
| 被测版本 | v1.1.4（gitHead 9b67256e） |
| 管理员凭证 | cn-north-4 / 账号 hw018619646（`KeystoneListUsers` 实测 200，凭证有效） |
| 只读子账号 | test001（认证成功，写被 IAM 拒绝） |

## 二、本次补测结果（真云 BLOCKED → 实测）

| 用例 | 结果 | 证据 | 关键结论 |
|---|---|---|---|
| D4-13 最小权限通过率 | **FAIL** | evidence/D4-13 | run-as-readonly.py 动态切换失效（见缺陷 #1）；test001 写被 IAM 拒绝 5 服务只读规划可用 |
| D3-C4 服务矩阵 | PASS | evidence/D3-C4 | 22 服务只读规划 22/22 可用 + 最小 VPC 创建→归零 |
| D4-14 操作可审计 | PASS | evidence/D4-14 | CTS system 追踪命中 `createVpc`（VPC/vpc，user=hw018619646）→ 删→归零 |
| D4-18 confirm-not-deny | PASS | evidence/D4-18 | 写不直接放行(需要 approvalToken)也不直接拒绝(可批准执行) |
| D4-19 确认流下预检 | PASS | evidence/D4-19 | 公网 22 端口 SG → preflight deny(public_exposure)，批准后仍拦截 |
| D4-20 拒绝后零操作 | PASS | evidence/D4-20 | approvedByUser=false 抛错 / 无 token 抛错 → 资源计数不变 |
| D2-1 auth init 三端同步 | PASS | evidence/D2-1 | S1/S2/S3 三端落位 + S2 真云 ListVpcs 200（另见 S3 漂移备注） |
| D2-11 STS token 拒绝落盘 | PASS | evidence/D2-11 | persist+token → {status:error, scope:rejected}，S1 不落 token |
| D2-16 import 读取后擦除 | PASS | evidence/D2-16 | mode=import → S1 写入导入 ak 后 creds-import.json 擦除(exists=False) |

> 展开级 D3-C4 服务矩阵 22 条（EXP-C4-01~22）随 D3-C4 一同回填 PASS（evidence/D3-C4）。

## 三、状态汇总（今日执行包）

| 层级 | 行数 | PASS | FAIL | BLOCKED | SPEC-MISMATCH | NOT_RUN/空 |
|---|---|---|---|---|---|---|
| 设计级 | 78 | 59 | 12 | 6 | 1 | 0 |
| 展开级 | 39 | 27 | 12 | 0 | 0 | 0 |

> 较 2026-09-15：BLOCKED 11→6（消解真云 D4-13/14/18/19/20 + 新增 D3-C4 已跑）；FAIL 11→12（新增 D4-13）；设计级新增 D3-C4、展开级新增 22 条 EXP-C4-*。

## 四、真云红线合规

- [x] 最低配置创建：仅 VPC（免费）/ 安全组（免费），未创建任何计费实例（ECS/RDS 等 0 创建）。
- [x] 测后删除归零：全部 `tctest-dsh-*` 资源已删除；`ListVpcs`/`ListSecurityGroups` 过滤 `tctest-dsh-` 计数 = 0。
- [x] 只删本次创建资源：仅操作 `tctest-dsh-` 前缀资源，未触碰既有/他人资源。
- [x] 凭证脱敏：证据仅含指纹/前缀脱敏，无明文 AK/SK；未达 redis 红线。

## 五、剩余 BLOCKED（6 项 · 真外部依赖/时钟夹具）

| 用例 | 阻塞原因（摘要） |
|---|---|
| D1-5 | 多客户端残留矩阵 + Windows 文件锁 | 
| D4-12 | SBOM 产出工具链缺失 |
| D4-24 | 可注入时钟夹具缺（令牌 TTL 加速）；代码 TTL=300s+"Invalid/expired token" 与用例契约 CONFIRM_TOKEN_EXPIRED/already_processed 漂移 |
| D7-4 | 国内网络 + 华为云 npm 镜像源不可控 |
| D9-6 | MCP Inspector + ≥3 客户端 |
| D10-4 | 真实 Agent 会话评测 harness |

## 六、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC（tctest-dsh-*） | 4 | 4 | ListVpcs 计数 0 |
| 安全组（tctest-dsh-*） | 3 | 3 | ListSecurityGroups 计数 0 |

## 七、遗留建议

- D4-13 最小权限动态切换 R9 缺陷为高优先修复项（见 FINDINGS #1），修复后按回归复测。
- D4-24 的响应契约（CONFIRM_TOKEN_EXPIRED/already_processed）与实现（Invalid/expired approval token + TTL300s）漂移需回归。
