# AI Native 运维工具：前置探活 / 失败分诊 / 根因聚类 / 使命自主展开

> 生成时间：2026-11-03 10:11:58（北京时间；2026-11-03 追加 Layer 3）
> 定位：补齐三个能力域里「还差」的项 —— ① **Agent 编排可靠性**、② **AI 自主用例设计（Layer 3）**、③ **多源证据融合与根因分析**。
> 除 Layer 3 是「技能 + 门禁」外，其余都是**维护者侧确定性脚本**（不依赖 LLM、可离线、有单测），单测随 `npm run test:python` 一起跑。

---

## 一、速查

| 工具 | 命令 | 解决什么 | 退出码 |
|---|---|---|---|
| **前置探活** | `npm run preflight`（= `python scripts/preflight_probe.py`） | 派发/开工前探活 凭证文件 / 云端身份 / 账户余额，**提前**暴露断供，避免空跑一轮 | `0` OK / `1` WARN / `2` FAIL |
| **失败签名分类器** | `npm run classify`（= `python scripts/classify_failure.py --scan --limit 2`） | 把「人工逐台读 autopilot `result.output`」变成**确定性签名 + 处置分支** | `0` 无问题 / `1` 有问题 |
| **同根因聚类** | `npm run clusters`（= `python scripts/cluster_rootcauses.py`） | 把「同一根因被 N 个客户端各记一遍」合并成**根因簇**（一簇=一结论/一单） | `0`（加 `--fail-on-cross` → 存在跨客户端簇时 `1`） |
| **使命自主展开（Layer 3）** | `展开使命 <mission-id>`（技能 `skills/mission-expand/SKILL.md`） | Worker 收到使命后**自主设计**用例（正常+边界+异常，3–8 条）并执行回填，落执行包 `autocases/` | 门禁 `python scripts/verify_mission_expansion.py <执行包> --mission <id>` → `0`/`1` |
| **失败自动处置** | `npm run remediate`（= `python scripts/auto_remediator.py --scan --limit 2`） | 按签名分支：重发（带限流）/ 机器侧告警 / 人工复核；**默认 dry-run**，真触发须 `--live` | `0`（dry-run 恒 0） |
| **候选用例生成** | `npm run candidates`（= `python scripts/gen_candidate_cases.py --diff origin/main..HEAD`） | 读源码变更 → 命中维度 → 生成**候选用例骨架**（`CAND-` 前缀，不写母版） | `0`（无变更也 0）/ `2` 解析失败 |
| **跨端一致性复核** | `npm run consistency`（= `python scripts/cross_client_consistency.py`） | 同一用例各机位结论分歧 → **孤例 PASS（假绿嫌疑）/ 孤例 FAIL** + 机位离群率画像 | `0`（分歧不算失败）/ `2` 数据不可用 |
| **单号关联** | `npm run links`（= `python scripts/link_rootcause_case_issue.py`） | FAIL/SPEC 用例 × 执行包单号 → **待查重清单**（对齐 daily_issue_triage 口径） | `0` / `2` |

---

## 二、前置探活 `scripts/preflight_probe.py`

三类探针：

| 探针 | 检查内容 | 说明 |
|---|---|---|
| `credential_file` | `~/.config/huaweicloud/credentials.json` 存在且含 `ak/sk/region` | **只报是否齐全，不打印密钥值** |
| `cloud_identity` | `hcloud STS GetCallerIdentity` | 最轻量只读调用，同时验证「凭证有效 + 网络可达」 |
| `account_balance` | `hcloud BSS ShowCustomerAccountBalances` | 余额低于 `--balance-threshold`（默认 1.0）→ WARN |

```bash
python scripts/preflight_probe.py                    # 人读摘要
python scripts/preflight_probe.py --json             # 机器可读
python scripts/preflight_probe.py --balance-threshold 5
python scripts/preflight_probe.py --skip-balance     # 账号无 BSS 只读权限时
```

**踩坑（已内置处置）**：
- BSS 是**全局服务**，region 必须用 `cn-north-1`（传 `cn-north-4` 报 `[USE_ERROR]cli-region的值不支持`）。
- hcloud **退出码恒为 0**（连参数错也是）→ 判定走「解析输出文本 + 抠 JSON」，不看 `$?`。
- 输出带 UTF-8 BOM 且前置有升级提示行 → 从第一个 `{` 起 `raw_decode`。

**接入建议**：客户端 agent 开工第一步跑一次；FAIL 项未解除前不开跑（避免空跑）。无 BSS 权限的机器加 `--skip-balance`。

---

## 三、失败签名分类器 `scripts/classify_failure.py`

八类签名（源自 2026-10-08 报告 §二）+ 1 类实测补充：

| 签名 | 含义 | 处置分支 |
|---|---|---|
| `BALANCE_403` | 余额不足 403 | machine-alert |
| `MISSING_CREDENTIAL` | 模型凭证缺失 / 401 | machine-alert |
| `SHIM_SECOND_EXIT` | shim 秒退（init failed / 守护未起） | machine-alert |
| `PUSH_FAILED` | push 失败（差最后推送） | resend |
| `TOOL_CALL_LIMIT` | 工具调用上限中断 | resend |
| `FAKE_PASS` | 空壳探针（硬编码 PASS / stdout 空） | manual |
| `DRIFT` | 执行偏离（未回填 results） | resend |
| `EMPTY_RUN` | 空跑（零产出） | resend |
| `TIMEOUT_KILLED` | 疑似超时/看门狗掐断（实测 900s 固定值） | resend |

```bash
python scripts/classify_failure.py --scan --limit 2          # 扫「每日测试-*」全部机位
python scripts/classify_failure.py --scan --only-problems
python scripts/classify_failure.py --autopilot 93cc06ab      # 单个 autopilot
python scripts/classify_failure.py --text "fatal: failed to push some refs"
python scripts/classify_failure.py --scan --json
```

**实测分布（2026-11-03，60 次运行）**：NORMAL 38 / SHIM_SECOND_EXIT 8 / TIMEOUT_KILLED 4 / MISSING_CREDENTIAL 3 / DRIFT 3 / UNKNOWN_FAILED 2 / EMPTY_RUN 1。

**⚠️ 已修的误报**：早期规则用 `fake[_-]?pass` 匹配，把门禁脚本名 `verify_no_fake_pass.py`（输出「门禁通过」）误判成 FAKE_PASS —— 60 次里误报 24 次。现规则只认「硬编码 PASS / 空壳探针 / stdout 为空」，并有负向单测兜底。

---

## 四、同根因聚类 `scripts/cluster_rootcauses.py`

数据源：`results/Summary/每日测试汇总-<日期>.md` 的「缺陷根因明细」表。

```bash
python scripts/cluster_rootcauses.py                 # 自动取最新一天
python scripts/cluster_rootcauses.py --date 2026-11-02
python scripts/cluster_rootcauses.py --min-clients 2
python scripts/cluster_rootcauses.py --json
python scripts/cluster_rootcauses.py --fail-on-cross # 门禁：存在跨客户端簇则 1
```

**实测效果（2026-11-02）**：91 条根因记录 → **19 簇**，其中**跨客户端簇 7 个**：

| 簇 | 记录 | 客户端 | 用例 |
|---|---|---|---|
| 服务目录路由（关键词/别名缺失） | 21 | 6 | D10-3 / D3-S1 / D3-S2 / D3-S3 / D3-S5 / EXP-E01 |
| 凭证脱敏（大小写/短键/带引号 key） | 21 | 5 | D2-4 / D4-2 / D4-27 / D4-6 |
| MCP 握手 / 协议时序 | 12 | 4 | D9-12 / D9-9 |
| 制品预检（HCL / Terraform / 宽 IAM） | 7 | 4 | D4-21 / D2-10 |
| Python hook 写动词正则失配 | 5 | 3 | D4-25 |
| KMS 明文解密未拦截 | 3 | 3 | D4-3 |
| 写拦截 fail-open | 5 | 2 | D4-17 / D4-16 |

**聚类键**：主题词典（20 类）→ 源码文件名 → misc。主题判定同时看**标题 + 根因**（客户端根因常写得简略，语义主题多在标题里）。

**表格解析坑**：根因单元格里含 `|`（如正则 `(AK|SK)`），不能按 `|` 切 4 列 —— 多出的段要并回第 4 列（已在 `parse_rootcause_rows` 内处理）。

---

## 五、使命自主展开（Layer 3）`skills/mission-expand/` + `scripts/verify_mission_expansion.py`

### 链路（全在仓库内可追）

```
test-manager/run-plan.mjs（读 git diff → 策略 + 使命）
  → test-manager/scripts/publish-missions.mjs（维护者提交）
  → test-cases/missions/<mission-id>.yaml（scope / affectedTools / qualityCriteria / affectedCases）
  → scripts/mission_ingest.py（各客户端 prepare_env --update 时摄入到当日执行包）
  → 【本技能】skills/mission-expand/SKILL.md：agent 按使命自主展开用例 → 执行 → 回填
  → scripts/verify_mission_expansion.py（门禁）
```

**触发语**：`展开使命 <mission-id>`。

### 产物契约

落执行包内 `autocases/<mission-id>.csv`，固定 9 列：

```
case_id,步骤,输入,预期结果,判据,判据强度,关联工具,结果,证据路径
```

- `case_id` = **`AUTO-<mission-id>-<n>`** —— 与母版 ID（`D3-S1` / `EXP-*`）**空间隔离**，不污染真源。
- `判据强度` ∈ `L1`（文案）/ `L2`（双向断言）/ `L3`（闭环有效性）/ `L4`（独立回读 + 归零）。
- 证据按用例 ID 组织：`evidence/AUTO-<mission-id>-<n>/{probe.mjs,stdout.log}`。

### 与用例母版的边界（铁律）

- 自主用例**只落执行包 `autocases/`**；**不得回改** `test-cases/` 母版（母版由 `gen_matrix.py` 生成 + `verify_new.py` 门禁）。
- 值得固化的自主用例 → 走 `用例规范`（`skills/case-design`）提交流程，不直接写母版。
- 汇总层把自主用例与母版用例**分开统计**（`autocases` 不计入母版通过率）。

### 门禁 12 项（`verify_mission_expansion.py`）

`mission_file` / `artifact` / `header`（9 列）/ `case_count`（3–8）/ `case_id_prefix` / `required_fields` /
`judgement_strength` / `l1_ratio`（L1 ≤ 1/3）/ `no_self_proof`（禁自证式判据）/ `tools_in_mission`（工具须落在使命 `affectedTools` 内）/
`result_enum` / `pass_evidence`（PASS 必须有真实非空证据）。

**实测**：合规产物 `12/12 项通过`（exit 0）；违规产物（工具越界 + L1 判据）精确定位 `AUTO-mission-001-3:huaweicloud_not_in_mission`（exit 1）。

---

## 六、失败自动处置 `scripts/auto_remediator.py`

把签名结果变成**处置计划**并按分支执行：

| 签名分支 | 动作 | 是否真执行 |
|---|---|---|
| `resend`（可重试签名） | 自动重发对应 autopilot 触发语 | 仅 `--live`；且受台账限流 |
| `machine-alert` | 只产出机器侧告警条目 | 不触发（重发无用） |
| `manual` | 只产出人工复核条目 | 不触发（如需看证据的 fake-pass） |

```bash
python scripts/auto_remediator.py --scan --limit 2                        # 默认 dry-run：只出计划
python scripts/auto_remediator.py --scan --limit 2 --live --max-per-ap 1  # 真触发（限流 1 次/窗口）
python scripts/auto_remediator.py --scan --write-report                   # 落 results/Summary/失败处置-<日期>.md
```

**安全设计（重要）**：
- **默认 dry-run**，任何真触发都必须显式 `--live`。
- 台账 `metrics/remediation-ledger.csv` **只记 live 的真实触发**；dry-run 不写台账（已实测确认 dry-run 后该文件不存在）。
- 限流：同一 autopilot 在 `--window-hours`（默认 12h）内最多重发 `--max-per-ap`（默认 1）次，超限标 `skip_limited`，防无限重发。

**实测（2026-11-03，全机队 60 次运行）**：三类分支均命中 —— `execute`（可重试：执行偏离类）／`alert_only`（机器侧：凭证缺失、秒退类）／`manual`（需复核：空壳探针嫌疑等）；dry-run 未产生任何平台动作。

---

## 七、候选用例生成 `scripts/gen_candidate_cases.py`

把「看 git diff 想该补哪些用例」半自动化：`git diff → module-map（模块↔维度）→ 候选用例骨架`。

```bash
python scripts/gen_candidate_cases.py --diff origin/main..HEAD
python scripts/gen_candidate_cases.py --files src/safety-policy.mjs src/tools.mjs --no-write
python scripts/gen_candidate_cases.py --diff HEAD~20..HEAD --out test-cases/design/candidates
```

产物：`test-cases/design/candidates/候选用例-<日期>.csv`（11 列），ID 用 **`CAND-` 前缀**。

**纪律（铁律）**：
- **只落 candidates 目录，绝不写母版**（母版由 `gen_matrix.py` 生成 + `verify_new.py` 门禁）。
- 候选只给**骨架**（标题/优先级/变更依据/建议判据占位），判据必须补完并**走评审**（`HERMES_DRAFT_READY` → `用例规范`）才可固化。
- 每条候选挂「生成依据 = 变更文件」，可追证；同时提示**母版该维度已有条数**，避免重复设计。

**实测（2026-11-03）**：变更 `safety-policy.mjs / tools.mjs / mcp-protocol.mjs` → 命中 **D3 / D4 / D9 / D10**，并提示母版既有覆盖（D3 38 / D4 29 / D9 13 / D10 9 条）。
**踩坑（已修）**：母版 CSV 的「维度」列是 `D4安全` 形态，与候选的 `D4` 对不上，早期整列显示「已有 0 条」—— 现统一 `norm_dim()` 归一化，并有回归单测。

---

## 八、跨端一致性复核 `scripts/cross_client_consistency.py`

回答「同一 SUT、同一条用例，某机位 38 条 FAIL 而其他机位 1~13 条 —— 谁更准」。

数据源：`results/Summary/用例矩阵-设计级-总执行结果-<日期>.csv`（各机位列并列）。

两类分歧：
- **孤例 PASS（假绿嫌疑，优先查）**：多数机位 FAIL/SPEC-MISMATCH，个别机位 PASS
- **孤例 FAIL（环境/探针嫌疑）**：多数机位 PASS，个别机位 FAIL

```bash
python scripts/cross_client_consistency.py                 # 最新一天
python scripts/cross_client_consistency.py --date 2026-11-03 --min-peers 2
python scripts/cross_client_consistency.py --write          # 落 results/Summary/跨端一致性-<日期>.md
```

**实测（2026-11-03，107 条用例 / 11 机位）**：**孤例 PASS 9 条**（含 `D2-4` / `D4-21` / `D9-12` 三条 P0 —— 多数机位判 FAIL 而个别机位判 PASS，正是「假绿」嫌疑）、孤例 FAIL 22 条；离群率最高的机位 9.7%（`Hermes-120.46.222.180`）。

**口径**：`--min-peers` 控制「构成多数」所需的一致机位数（默认 2）；参与数不足多数门槛的用例不判。

---

## 九、单号关联 `scripts/link_rootcause_case_issue.py`

把「这条 FAIL 到底提没提单、提的哪张单」自动连起来。

**关键设计：用例全集取自执行结果矩阵的 FAIL/SPEC-MISMATCH 行，不是根因明细表** ——
后者只含「客户端报了根因」的项，会漏掉「报了失败但没写根因」的用例。
（实测踩坑：流水线点名 6 条未标注用例，**全部不在**根因明细表里，用根因表当全集会恒得 0。）

```bash
python scripts/link_rootcause_case_issue.py --date 2026-11-03
python scripts/link_rootcause_case_issue.py --date 2026-11-03 --write   # 落 results/Summary/根因单号关联-<日期>.md
```

**实测（2026-11-03）**：FAIL/SPEC 用例 **37** 条 → 已关联 **29** / **未关联 8**（待查重，全部为 D3 真云 E2E 类，且未记根因）。
流水线 `daily_issue_triage` 同口径给出 6 条 —— 本工具**更严格**（只认客户端本地标注，不做事后语义查重）。

**两个踩坑（都已修 + 有回归单测）**：
1. 「关联单」必须取段内**最外层**列表项 —— 历史单摘要里的嵌套引用（`历史 #673`）会被误算（曾让 D2-4 关联出 47 个单号）。
2. **不扫 `测试报告.md`** —— 它常引用各类单号，会把「未标注」冲成 0。

---

## 十、LLM 影响域分析 `test-manager/tm-impact-llm.mjs`

把「源码变更 → 受影响维度」从确定性映射表升级为 LLM 分析（架构 §2.2 目标态），**且永远有回退**。

```bash
# 配置（不硬编码）：TM_LLM_ENDPOINT / TM_LLM_API_KEY / TM_LLM_MODEL（默认 deepseek-v4-flash）
node test-manager/run-plan.mjs --diff main..HEAD --analyzer auto --out ./out
```

**纪律**：
- LLM 输出必须通过「维度 ∈ D1~D10 + 风险 ∈ low/medium/high」校验，任一不合法即**整体判不可信 → 回退**（结果带 `fallbackReason`）。
- **数据真源不变**：LLM 只决定「哪些维度受影响」，模块与用例仍取 `module-map`（映射表没有的维度标注来源）。
- 无凭证 / 超时 / HTTP 错 → 自动回退，**流水线不中断**；默认路径（`--analyzer rules`）始终是确定性的，CI 不依赖外部服务。

**实测**：无配置时 `auto` 正确回退 —— `analyzer=rules（回退：缺 LLM 配置（TM_LLM_ENDPOINT / TM_LLM_API_KEY））`；mock 场景测试覆盖「合法采纳 / 编造维度拒绝 / HTTP 500 / 无配置回退」四类。

---

## 十一、MCP 工具补齐（4 → 7）`test-manager/mcp-server.mjs`

| 新工具 | 作用 | 关键纪律 |
|---|---|---|
| `tm_analyze_result` | 质量分析（§2.4）：verdict → **三态决策** `PASS/FAIL/NEED_REVIEW` + 敏感泄漏检查 | 空基线 fail-closed（BASELINE_INVALID） |
| `tm_generate_report` | 结构化报告（§五 Step 5）：汇总 / 明细 / 失败详情 / 需复核 / 建议 | 未标注 decision 记 UNKNOWN，**不误算 PASS** |
| `tm_update_baseline` | 基线更新（§五 Step 6） | **`approvedByUser=true` 才写**（fail-closed）；`dryRun` 预演；`scenarioId` 防路径穿越 |

- 原 4 工具（`tm_analyze_impact` / `tm_generate_strategy` / `tm_generate_missions` / `tm_plan_test_run`）不变；`tm_analyze_impact` 新增可选 `analyzer: rules|auto`（默认 rules，保持兼容）。
- MCP handler 已支持 async（LLM 路径）；同步工具行为不变。
- 自检：`node test-manager/mcp-server.mjs --selftest` → `tools=7`。

---

## 十二、接入方式与尚未接入项

**已接入**：
- 七条快捷命令：`npm run preflight` / `classify` / `clusters` / `remediate` / `candidates` / `consistency` / `links`。
- 前置探活联动：`python scripts/prepare_env.py --preflight`（客户端本就会跑的入口）。
- 技能库索引：`skills/README.md` 能力地图第 7 项（`展开使命 <mission-id>`）。
- 单测随 `npm run test:python` 跑（CI 覆盖，合计 134 例）：preflight(11) / classify(13) / clusters(9) /
  mission_expansion(12) / auto_remediator(11) / candidate_cases(8) / consistency(9) / links(11) 等。

**尚未接入（需拍板，涉及每日产物格式、平台状态与下游链条）**：
1. ~~前置探活写进客户端开工流程~~ → **已接入** `prepare_env.py --preflight`（`AGENTS.md` 属受保护文件，仍不直接改）。
2. **六个运维件自动进「每日测试汇总」报告**（签名分布 / 根因簇 / 跨端一致性 / 单号关联 / 使命展开产物 / 候选用例）—— 需改 `build_summary.py` / `run_daily_report.py`，会影响下游看板与邮件。
3. **周期化自动处置**：`auto_remediator.py` 已能按分支出计划并支持 `--live` 重发，但「定时自动跑 `--live`」未接入调度（属改变平台状态，需拍板）。
4. 使命展开产物（`autocases/`）与候选用例（`candidates/`）纳入汇总统计与看板（需与维护者侧汇总口径一起改）。

> 口径：以上四项为**未接入**，当前只能手动跑；文档提及 ≠ 已自动执行。
