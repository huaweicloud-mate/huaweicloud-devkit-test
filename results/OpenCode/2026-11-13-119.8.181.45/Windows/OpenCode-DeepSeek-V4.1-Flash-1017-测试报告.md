# OpenCode-DeepSeek-V4.1-Flash-1017 每日测试报告

> **报告时间**：2026-11-13 05:35:00（北京时间）
> **执行归档**：`results/OpenCode/2026-11-13-119.8.181.45/Windows/`
> **被测产品**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：PARTIAL（P0 存在 2 条 FAIL、1 条 SPEC-MISMATCH，不得判 PASS）

---

## 一、测试概况

| 项 | 值 |
|---|---|
| 客户端 / Agent | OpenCode（agent: testbot4-win-Opencode） + DeepSeek-V4.1-Flash-1017 |
| OS / 架构 | Windows Server 2022 Standard 10.0.20348 / AMD64 |
| Node / npm / Python | Node v22.22.2 / npm 12.1.0 / Python 3.11.9 |
| 被测版本（SUT） | `huaweicloud-devkit@1.1.13`（npm dist-tag latest），源码 `hdk` checkout `8a6d8be2`（tag v1.1.13） |
| 工具全集 | 46（`tools.mjs` TOOL_DEFINITIONS 注册源数量） |
| hcloud / 版本 | hcloud 7.3.12，`configure show` 正常，只读命令可执行 |
| 云端凭证 | cn-north-4；S1 全局凭证（占位/测试态）+ 只读子账号 test001（`credentials.readonly.json`） |
| 测试方法 | 源码级探针（直调 `hdk/plugins/huaweicloud-core/src/*`）+ 真实 hcloud/API 调用 + MCP stdio 协议会话 + npm 包审计 |
| 用例来源 | daily 精选：设计级 107 / 展开级 39（已按 OpenCode+Windows 预筛）/ 使命 mission-001 9 |
| daily 执行量 | 146 个唯一用例（107 + 39，使命 9 覆盖同一批 D4 用例） |

> **执行方式**：每个用例生成独立探针 `evidence/<case-id>/probe.mjs`，真实执行后把 JSON 结论写入 `evidence/<case-id>/stdout.log`；真云用例通过 hcloud 真机调用 API 并记录 request/code，创建类用例未产生任何残留资源（见 §七）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例数（daily） | `146`（设计级 107 + 展开级 39） |
| 实际执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `121 / 11 / 12 / 2 / 0`（设计级+展开级） |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH，剔除 BLOCKED） | `121/134 = 90.3%` |
| P0 / P1 / P2 遗留缺陷 | `2 / 6 / 2`（产品缺陷，另 2 条契约漂移） |
| 红线（I 类）违规 | `0` |
| 资源释放 | 全部归零（ECS/VPC/EIP/RDS/CCE/FunctionGraph 均 0 个 tctest-* 资源） |
| PASS 门禁 | `verify_no_fake_pass.py` 通过（0 虚报） |
| 覆盖率门禁 | `verify_coverage.py` 通过（P0 NOT_RUN=0，NOT_RUN+空=0.0%） |

---

## 三、状态汇总

### 3.1 设计级（107）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 86 | 有实测 + 证据落盘 + evidencePath 回填 |
| FAIL | 9 | 不符预期，明细见 FINDINGS.md |
| BLOCKED | 10 | 真云写权限/沙箱上游/参数不可用，均附实测错误码 |
| SPEC-MISMATCH | 2 | 契约漂移，见 FINDINGS.md #9/#10 |
| NOT_RUN | 0 | — |
| **合计** | **107** | |

### 3.2 展开级（39）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 35 | D5 客户端矩阵 2 + C4 服务矩阵 18 + D10 评测集 13 + 其他 2 |
| FAIL | 2 | EXP-E01 / EXP-E08 路由未命中 |
| BLOCKED | 2 | EXP-C4-01/04 真机建删被 IAM 拒绝 |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **39** | |

### 3.3 按维度（设计级）

| 维度 | PASS | FAIL | BLOCKED | SPEC-MISMATCH |
|---|---|---|---|---|
| D1 安装 | 17 | 2 | 0 | 0 |
| D2 认证 | 10 | 1 | 0 | 0 |
| D3 功能 | 10 | 2 | 9 | 0 |
| D4 安全 | 27 | 2 | 0 | 0 |
| D5 客户端 | 2 | 0 | 0 | 0 |
| D6 性能 | 4 | 0 | 0 | 0 |
| D8 质量 | 5 | 1 | 0 | 0 |
| D9 协议 | 11 | 0 | 1 | 1 |
| D10 评测 | 0 | 1 | 0 | 1 |

---

## 四、缺陷清单（详见 FINDINGS.md）

| # | 级别 | 用例 ID | 缺陷标题 | 期望（唯一可判定） | 实际结果 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|---|
| 1 | P0 | D1-39 | Windows 更新检测链静默降级 | Windows 下 `queryDistTags` 返回真实 dist-tags，不得静默失败 | `distTags=null`，`result=check_failed`（npm `dist-tags --json` 实际返回数组被丢弃） | `update-check.mjs:86` | 待提单 |
| 2 | P0 | D4-19 | 确认流程风险预检未生效 | 公网 0.0.0.0/0 + 22 端口在 plan/确认流程应被判 deny/warn | `plan_cli_command` 返回 `warnings` 仅缺参提示，`sgFindings=[]`、无 `blockedByRiskRule` | `tools.mjs:1319` / `hcloud-cli.mjs:371` | 待提单 |
| 3 | P1 | D2-10 | profile 参数形式错误 | `runHcloudConfigure` 应传 `--cli-profile=<name>`（单参数） | 传 `--cli-profile default` 两参数，KooCLI 返回 `[USE_ERROR]参数default的格式错误` | `tools.mjs:1988` | 待提单 |
| 4 | P1 | D3-B3 | 只读工具认证源选择错误 | `run_readonly_command` 在 KooCLI profile 可用时应成功返回实例清单 | 工具返回 `APIGW.0301 Unauthorized`，而直连 `hcloud ECS ListServersDetails` 成功（code=0） | `tools.mjs:1806` / `hcloud-cli.mjs:300` | 待提单 |
| 5 | P1 | D4-8 | hook 双路径判定不一致 | `classifyTextCommand` 与 `hook_check_command` 对同一命令判定一致 | 源码判 `deny`，MCP hook 工具判 `warn`（删除命令无 `--force`） | `tools.mjs:1334` | 待提单 |
| 6 | P1 | D10-3 | 意图路由准确率不达标 | serviceCatalog 中文意图命中率 ≥90% | 13/15 = 86.7%，EXP-E01（"云主机"）与 EXP-E08（失败诊断）落兜底路由 | `tools.mjs:2298`（routeMap） | 待提单 |
| 7 | P2 | D1-68 | region 优先级与契约相反 | 同时设置时 `HUAWEICLOUD_REGION` 应优先于 `HW_REGION` | 实际取 `HW_REGION`（cn-north-4），`HUAWEICLOUD_REGION` 被覆盖 | `credentials.mjs:225` | 待提单 |
| 8 | P2 | D8-9 | sanitizeValue 未脱敏敏感值 | `sanitizeValue` 应移除 AK/SK/token 等敏感值 | 仅去控制字符/截断，`token=abc123 password=Passw0rd` 原样保留 | `telemetry.mjs:190` | 待提单 |
| 9 | P2 | D10-4 | 风险规则数量契约漂移（SPEC-MISMATCH） | 规则库 9 deny + 7 warn | 实际 9 deny + 10 warn（多 3 条 warn） | `safety/rules/cloud-risk-rules.json` | 契约确认 |
| 10 | P1 | D9-9 | 取消/超时能力未声明（SPEC-MISMATCH） | 按 capabilities 实测取消能力，不存在应标注 | `capabilities={"tools":{}}`，无 cancellation/cancel | `mcp-protocol.mjs:50` | 契约确认 |

> EXP-E01 / EXP-E08 与 #6 同源（路由 miss），不重复开单。

---

## 五、未执行用例与原因（BLOCKED 逐条）

| ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 解除条件 |
|---|---|---|---|---|---|---|
| D3-C1 | 设计级 | P1 | BLOCKED | 【补环境】 | 真机 `ECS CreateServers` 被 IAM 拒绝：`Pdp.0001`（user test001 无 `ecs:cloudServers:createServers`），未创建实例、零残留 | 下发具备 ECS 写权限的凭证 |
| D3-C2 | 设计级 | P1 | BLOCKED | 【补环境】 | `setup_obs_config` 成功，但 KooCLI 无 `OBS CreateBucket` 命令，无法完成建桶→部署→归零 | 提供 obsutil 或支持 OBS 建桶的命令通道 |
| D3-C3 | 设计级 | P1 | BLOCKED | 【补环境】 | `sandbox_check_user` 上游失败 `HDKIT_UPSTREAM_ERROR: 查询实名状态失败` | HDKIT 服务恢复实名状态查询 |
| D3-C6 | 设计级 | P1 | BLOCKED | 【补环境】 | 7 个沙箱工具已注册，但 `check_user` 上游失败（同上） | HDKIT 服务恢复 |
| D3-C14 | 设计级 | P2 | BLOCKED | 【补环境】 | `sandbox_credentials` 凭证校验 401（APIGW.0301）+ `agreements` 接口失败 | HDKIT 服务恢复 + 有效凭据注入 |
| D3-S2 | 设计级 | P1 | BLOCKED | 【补环境】 | 确认流程正确（未确认零执行），但真机 `VPC CreateVpc` 被 IAM/策略拒绝（`PolicyNotAuthorized`），tctest-s2 归零 | 下发 VPC 写权限 |
| D3-S3 | 设计级 | P1 | BLOCKED | 【补环境】 | 沙箱编排 `GET /open-api-public/v1/agreements` 失败，无法产出公网 URL | HDKIT 服务恢复 |
| D3-S6 | 设计级 | P2 | BLOCKED | 【补环境】 | `FunctionGraph CreateFunction` 缺必填参数 `memory_size/package/timeout`，未创建函数 | 补齐创建参数并具备写权限 |
| D3-S7 | 设计级 | P1 | BLOCKED | 【补环境】 | 沙箱上游不可用 + test001 无 RDS 写权限（`Pdp.0001`），无法完成建库→部署→清理闭环 | HDKIT 服务恢复 + RDS 写权限 |
| D9-11 | 设计级 | P1 | BLOCKED | 【补环境】 | hwlink mux 模块存在但缺可控夹具，无法验证 attach/ready/close 生命周期 | 提供 hwlink mux 测试夹具 |
| EXP-C4-01 | 展开级 | P1 | BLOCKED | 【补环境】 | 只读规划通过；真机 `ECS CreateServers` 被 IAM 拒绝 `Pdp.0001`，未创建资源 | 下发 ECS 写权限 |
| EXP-C4-04 | 展开级 | P1 | BLOCKED | 【补环境】 | 只读规划通过；真机 `RDS DeleteInstance` 无权限（`Insufficient permissions`） | 下发 RDS 写权限 |

**D3-C7（FAIL，非阻塞）说明**：区域参数断言通过；但 `hcloud ECS ListServersDetails --server_id=nonexistent` 实际返回 `count=1` + `fault: Instance ... could not be found`，未返回用例要求的精确错误码 `Ecs.0200`。分类【改用例】（断言与 hcloud 实际 API 行为不一致），非产品缺陷。

---

## 六、安全与红线

- **PASS 门禁**：`verify_no_fake_pass.py OpenCode Windows` → 通过；146 个 PASS/FAIL/SPEC 用例均有 `evidence/<case-id>/probe.mjs` + 非空 `stdout.log` + evidencePath 回填。
- **覆盖率门禁**：`verify_coverage.py` → 通过；设计级 NOT_RUN=0、NOT_RUN+空=0.0%；展开级 NOT_RUN=0。
- **真云红线**：所有写操作均走真机 API（未 mock）；创建类调用均被 IAM 拒绝或参数校验失败，**未创建任何资源**；未发现残留。
- **凭证安全**：所有探针输出与证据已检查无明文 AK/SK/token（D4-26/D4-27/D9-13 PASS）；`creds-import.json` 读取后无条件擦除（D2-16 PASS）。
- **目录权限**：仅提交 `results/OpenCode/2026-11-13-119.8.181.45/`，未触碰 Summary、其他客户端目录与 test-cases 母版。

---

## 七、资源释放

| 资源 | 检查命令 | 结果 |
|---|---|---|
| ECS | `hcloud ECS ListServersDetails` | `count=0`，无 `tctest-*` |
| VPC | `hcloud VPC ListVpcs` | 无 `tctest-*`（`tctest-s2` 未创建） |
| EIP | `hcloud EIP ListPublicips` | `total_count=0` |
| RDS | `hcloud RDS ListInstances` | `total_count=0` |
| CCE | `hcloud CCE ListClusters` | `items=[]` |
| FunctionGraph | `hcloud FunctionGraph ListFunctions` | `count=0` |
| OBS | KooCLI 无 CreateBucket 通道 | 未创建桶 |

> 说明：本轮所有创建请求均在 IAM 授权阶段失败（`Pdp.0001` / `PolicyNotAuthorized` / 参数校验失败），因此无资源产生，无需删除。

---

## 八、遗留建议

1. **P0-1 更新检测（D1-39）**：`parseDistTagsOutput` 对数组型 npm 输出直接判失败，导致 Windows/npm 12 环境更新检测永久降级为 `check_failed`；建议兼容数组形态并补 Windows 门禁用例。
2. **P0-2 风险预检（D4-19）**：`plan_cli_command` 未合并 `evaluateCommandRisk`，确认流程缺少高危参数（0.0.0.0/0 + 22/3306）拦截；建议在 plan 阶段合并风险规则并回填 `blockedByRiskRule/findings`。
3. **认证源一致性（D3-B3/D2-10）**：`run_readonly_command` 在 KooCLI profile 可用时仍因注入占位 S1 凭证而 401；建议明确“profile 可用时以 profile 为准”的优先级，并修正 `--cli-profile=` 单参数形式。
4. **路由覆盖（D10-3/EXP-E01/EXP-E08）**：中文意图“云主机”“启动失败/诊断”未命中，建议扩充 routeMap 关键词并回归 eval 集至 ≥90%。
5. **契约对齐（D10-4/D9-9）**：风险规则数量与 MCP 取消能力声明需与设计契约统一（补文档或补实现）。
6. **沙箱链路**：DevStation 上游 `agreements/实名状态` 接口持续失败，阻塞 4 条沙箱用例，建议运维侧排查 HDKIT 服务。