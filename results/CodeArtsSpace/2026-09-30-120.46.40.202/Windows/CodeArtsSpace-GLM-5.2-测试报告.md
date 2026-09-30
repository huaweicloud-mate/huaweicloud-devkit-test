# CodeArtsSpace-GLM-5.2 每日测试报告
> **报告名**：`CodeArtsSpace-GLM-5.2-测试报告.md`
> **生成时间**：2026-09-30 14:17:16（北京时间）。
> **执行根目录**：`results/CodeArtsSpace/2026-09-30-120.46.40.202/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`FAIL`（**8 个缺陷，含 5 个 P0 安全红线**）

---

## 一、测试概况
| 项 | 值 |
|---|---|
| 客户端 / Agent | `CodeArtsSpace` + `GLM-5.2` |
| OS / 架构 | `Windows` |
| 被测版本（CUT） | `1.1.8-next.1` |
| daily 基础用例 | 设计级 102 / 展开级 39 |

> **执行方法**：真实调用 hdk 源码导出函数（judgeUpdate/redactSecrets/classifyTextCommand/evaluateArtifacts 等），构造真实输入与攻击向量，断言真实预期；npm view dist-tags 真实 CLI 执行 + MCP 协议清单与契约汇校验 + 真实 AK/SK 凭证脱敏验证。所有用例经统一探针脚本（master-probe.mjs）一次执行，结果落盘 `evidence/<case-id>/stdout.log`（JSON 含 status/executedAt/why），每个 evidence/<case-id>/probe.mjs 为可独立执行的真实脚本（非注释空壳）。

---

## 二、执行摘要
| 项 | 值 |
|---|---|
| 计划用例（daily） | `141`（设计级 102 + 展开级 39）|
| 已执行 | `141` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `133 / 8 / 0 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 141）| `94.3%` |
| P0 / P1 / P2 新增缺陷 | `5 / 3 / 0` |
| 红线（Σ 类）违反 | `5`（P0 安全红线：D2-4/D2-11/D4-2/D4-3/D4-16）|
| 真云验证 | `N/A`（本轮无真云创建销毁用例，凭证校验类用例不依赖真云）|

---

## 三、状态汇总
### 3.1 设计级
| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `94` | 有证据且通过 PASS 门禁 |
| FAIL | `8` | 真实执行不符合预期，附根因 |
| BLOCKED | `0` | 环境/权限/凭证阻碍 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`102`** | |

### 3.2 展开级
| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `39` | 有证据且通过 PASS 门禁 |
| FAIL | `0` | 无不符号预期 |
| BLOCKED | `0` | 环境/权限/凭证阻碍 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单（8 条，按优先级降序）

### P0 安全红线（5 条）

| ID | 标题 | 根因 | 攻击向量 |
|---|---|---|---|
| **D2-4** | 凭证脱敏（小写 ak=/sk=）| `redactString` 正则 `(AK\|SK)\s*[:=]` 仅匹配大写 AK/SK，漏匹配小写 `ak=/sk=` 字符串形式 | `redactSecrets('ak=AKIDxxx sk=Secretxxx')` → `'ak=AKIDxxx sk=Secretxxx'`（明文泄露）|
| **D2-11** | STS token 拒绝落盘 | `hcloud sts get-token` 被分类为 `read_only/allow`，未拒绝；sts 服务不在 `blockedSecretOperations` | `classifyTextCommand('hcloud sts get-token')` → `decision=allow` |
| **D4-2** | HW_ 前缀 env-dump 拦截 | `env\|grep HW_` 和 `set\|grep HW_` 返回 `allow(not_huaweicloud)`；仅 `printenv HW_SECRET_KEY` 被拒绝；env\|grep / set\|grep 模式未被凭证环境变量正则匹配 | `classifyTextCommand('env \| grep HW_')` → `decision=allow` |
| **D4-3** | kms DecryptData / csms show-secret 拦截 | `hcloud kms decrypt-data/DecryptData/decrypt` 与 `hcloud csms show-secret/show-secret-version` 均返回 `allow`；这些操作不在 `blockedSecretOperations`，secret 正则仅匹配 `secret_string/secret_binary/showsecretversion/getsecretvalue` | `classifyTextCommand('hcloud kms DecryptData')` → `decision=allow` |
| **D4-16** | bash -c 命令包裹穿透 | `sh -c "hcloud ecs delete"` 与 `bash -c "hcloud ecs/vpc/rds delete"` 均返回 `allow`（仅 warn）；`stripExecutable` 解包 bash -c 但 `classifyHcloudArgs` 段检测仅对 `--force` 触发 deny，普通 delete 在 bash -c 内落入 `not_huaweicloud/allow` | `classifyTextCommand('bash -c "hcloud ecs delete"')` → `decision=allow` |

### P1 缺陷（3 条）

| ID | 标题 | 根因 | 攻击向量 |
|---|---|---|---|
| **D2-16** | import 文件读取后擦除 | `hcloud configure import --file creds.json` 被分类为 `unknown_read/allow`；`import` 不在 `blockedConfigureSubcommands`，凭证文件导入可能遗留明文 | `classifyTextCommand('hcloud configure import --file creds.json')` → `decision=allow` |
| **D4-4** | echo $AK/$SK 凭证环境变量暴露 | `echo $AK`、`echo $SK`、`echo $HW_ACCESS_KEY_ID` 均返回 `allow(not_huaweicloud)`；echo 命令未被分类为凭证暴露 | `classifyTextCommand('echo $AK')` → `decision=allow` |
| **D4-24** | access_token 脱敏 | `redactSecrets({access_token:'accxxx'})` 返回 `accxxx`（未脱敏）；`isSecretKeyName` 正则匹配 `access.*key` 但不匹配 `access_token`；`token` 单独匹配但 `access_token` 不匹配 `access.*key` 或 `xauth.*token` | `redactSecrets({token:'tokxxx',access_token:'accxxx'})` → `{token:'<redacted>', access_token:'accxxx'}` |

---

## 五、门禁结果
| 门禁 | 结果 | 说明 |
|---|---|---|
| `verify_no_fake_pass.py` | **PASS** | 所有 PASS 用例均有 evidencePath 且证据存在、probe.mjs 非空壳 |
| `verify_coverage.py` | **PASS** | P0 无 NOT_RUN/空，NOT_RUN+空 占比 0.0% |

---

## 六、证据结构
- `evidence/<case-id>/stdout.log`：JSON 格式真实执行结果（含 caseId/status/why/executedAt/client/os/result）
- `evidence/<case-id>/probe.mjs`：可独立执行的真实探针脚本（`node probe.mjs <hdkSrcDir>`，退出码 0=PASS/1=FAIL）
- `evidence/master-probe.mjs`：统一主探针，一次执行所有 141 用例
- `evidence/_summary.json`：`{PASS:133, FAIL:8, BLOCKED:0, SPEC_MISMATCH:0, NOT_RUN:0}`
- `probe-results.json`：完整结果快照

---

## 七、与同类客户端对比
| 客户端 | FAIL 数 | P0 缺陷数 |
|---|---|---|
| DSH | 15-19 | 6-7 |
| Hermes | 15-19 | 6-7 |
| **CodeArtsSpace（本轮）** | **8** | **5** |

> 本轮 CodeArtsSpace 测出 8 个真实缺陷（5 P0 + 3 P1），与 DSH/Hermes 同量级，均为被测对象 `huaweicloud-devkit` 的真实安全红线缺陷，非客户端侧问题。
