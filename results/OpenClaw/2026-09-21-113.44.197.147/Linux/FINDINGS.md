# FINDINGS — 缺陷发现清单（OpenClaw-deepseek-v4-pro-0813）

> **落盘路径**：`results/OpenClaw/2026-09-21-113.44.197.147/Linux/FINDINGS.md`
> **生成时间**：2026-09-21（北京时间）
> **被测版本**：`v1.1.5`（npm latest 正式版，gitHead `e7ed6f6`，release-1.1.5）
> **工具全集**：40（`tools.mjs` TOOL_DEFINITIONS）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，格式必须严格。

## 去重结论（本轮先读）

本轮按「每日测试」强制完整重跑，全量探针 fresh 执行、证据全新落盘。被测 v1.1.5（e7ed6f6）。`file_issue.py` 将自动做历史查重：13 项 FAIL/SPEC 为**历史同源**（D4-2/6/7/16/17/21/23/27、D9-2/4/7/9、D10-3），不重复提单。**本轮新增 2 项未查重命中的新缺陷**，列入统一合并单。

---

## #1【P1】D4-25 Python hook 写命令遥测误分类为 cli:invoke（WRITE_OPERATION_RE 无词边界）

- **现象**：`huaweicloud-safety.py` 的 `record_cli_event(text)` 对真实写命令 `hcloud VPC CreateSecurityGroup --security_group.name=x`、`hcloud RDS CreateInstance ...` 产出的事件 key 为 `cli:invoke`，而非预期的 `cli:write`。
- **断言**：`record_cli_event("hcloud VPC CreateSecurityGroup")` 产出的事件 `key` 应等于 `cli:write`（唯一可判定：写操作动词 Create/Delete/Update… 命中 write 分类）。
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.py:46` `WRITE_OPERATION_RE = re.compile(r"(^|[A-Za-z0-9])(" + "|".join(write_prefixes) + r")\w*", re.I)`。该正则以「行首 或 单个紧邻字母/数字」作为写操作动词前缀，要求动词紧贴行首或前一个字符为字母数字；而 `command_text()` 产出的命令串是 `hcloud VPC CreateSecurityGroup`，动词 `CreateSecurityGroup` 前是**空格**（VPC 与 Create 之间），`(^|[A-Za-z0-9])` 既不命中行首、也不命中字母数字 → 整条写命令漏判写分类，回退 `cli:invoke`。对比同仓库 Node 版 `integrations/dsh/hook-plugin.mjs` / `integrations/opencode/hooks/skill-tracker.js` / `integrations/hermes/hooks/huaweicloud-telemetry.py` 的 classifyHcloud 均用 `\b`（词边界）+ `(List|Show|Get|Describe|NovaList|NovaShow)` read、`(Create|Delete|...)` write 匹配，语义正确。
- **影响**：Python hook 遥测三态分类（读→cli:read/写→cli:write/其他→cli:invoke）对写命令全部误报为 invoke，遥测数据中「写操作」维度失真；下游用量统计/安全审计无法区分写操作。
- **证据**：`evidence/new-cases/probe-d4-25-telemetry.stdout.log`（实测 keys=['cli:read','cli:invoke','cli:invoke']，期望 ['cli:read','cli:write','cli:invoke']）
- **状态**：待提单（新缺陷，历史查重未命中）

## #2【P1】D3-S5 复合中文意图分层路由拆分失败（全角逗号不拆分，仅命中单路 sandbox）

- **现象**：`serviceCatalog('部署一个网站，数据库用 MySQL，还需要对象存储')` 返回 `recommendedServices=["Sandbox","DevStation"]`，只命中「部署」单路；「MySQL→RDS」「对象存储→OBS」两路均未命中。
- **断言**：复合意图 `serviceCatalog('部署一个网站，数据库用 MySQL，还需要对象存储').recommendedServices` 应同时含 `RDS` 与 `OBS`（唯一可判定：多路命中）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1884` tokenizer `it.split(/[\s,./-]+/)` 仅以 ASCII 逗号 `,` 断开；中文用户输入用全角逗号 `，` 分隔，`MySQL，`/`数据库，`/`网站，` 等 token 无法被拆分，导致 MySQL（→RDS）、对象存储（→OBS）关键词邻接中文逗号后失配。同文件 routeMap 的 RDS/OBS 关键词为英文词元（`mysql`/`rds`/`obs`/`bucket`），中文「对象存储」无对应中文关键词（仅 sandbox route 有「网站/网页/静态」中文词），双重原因叠加造成单路命中。
- **影响**：中文复合意图分层路由失效，单次意图含多个服务需求时只推荐单一服务，影响「先建库后部署」类多服务编排场景的意图理解准确率。
- **证据**：`evidence/new-cases/probe-new-deterministic.stdout.log`（D3-S5 ≥2 失败断言；#2 与 D10-3/EXP-E 中文路由缺失同族，但全角逗号不拆分是独立新根因）
- **状态**：待提单（新缺陷，历史查重未命中）

---

## 历史同源（不重复提单，详见 HISTORY_LINKS.md）

以下 13 项 FAIL/SPEC 均命中上游已有历史 issue，本轮**不新开单**：

| 用例 | 现象 | 历史单 |
|---|---|---|
| D4-2 | `env\|grep HW_SECRET_KEY` 仍 allow（HW_ 前缀漏网） | #651/#652/#673/#674/#676/#679/#681/#682/#690/#694 |
| D4-6 | adminPass 空格形式未脱敏 | #712/#651/#673/#679 |
| D4-7 | hook_check_artifacts HCL broad IAM 未拦截 | #651/#652 |
| D4-16 | `sh -c "env\|grep ..."` 未解包 | #651/#652/#673/#674/#676/#679 |
| D4-17 | hook 三工具畸形输入 fail-open | #564/#689 |
| D4-21 | hook_check_artifacts HCL actions=[\u0022*\u0022] 漏检 | #651/#652 |
| D4-23 | huawei-agent-rules.mdc 注入失效 | #651/#673/#674/#676/#679 |
| D4-27 | 裸 token=/小写 ak=/sk= 未脱敏 | #726/#683 |
| D9-2 | tools/list 传 string params 未返回 -32602 | #704/#643/#672 |
| D9-4 | initialize 前 tools/list 未按规范报错 | #699 |
| D9-7 | protocolVersion 不校验不回显 | #702 |
| D9-9 | capabilities.cancellation 未暴露（SPEC） | #698 |
| D10-3 | serviceCatalog 中文意图 21.4% MISS | #705/#706/#714/#689/#680 |

（D10-3 与 #2 D3-S5 同族但根因不同：D10-3 为中文关键词缺失，D3-S5 追加全角逗号不拆分这一独立根因。）