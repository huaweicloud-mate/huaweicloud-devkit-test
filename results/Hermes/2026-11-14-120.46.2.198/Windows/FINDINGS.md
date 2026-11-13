# FINDINGS — 缺陷发现清单（Hermes-DeepSeek-V4-Pro）

> **落盘路径**：`results/Hermes/2026-11-14-120.46.2.198/Windows/FINDINGS.md`
> **生成时间**：2026-11-14（北京时间）
> **被测版本**：huaweicloud-devkit v2.0.0-next.3（npm @next，v2 TypeScript 重构分支）

## #1【P1】D3-C2 / EXP-C4-03 OBS 桶操作经 hcloud CLI 不可用（exit 3）

- **现象**：真机 `hcloud OBS mb obs://bucket` 与 `hcloud OBS ListBuckets` 均返回 exit 3（USE_ERROR），OBS 静态站 E2E 无法经 KooCLI hcloud 完成建桶/set/get/删桶链路
- **断言**：OBS 静态网站部署 E2E 应可完成建桶→set/get 静态站→删桶归零
- **根因**：`plugins/huaweicloud-core/dist/hcloud-obs-redact.js` / KooCLI hcloud OBS 服务不提供 `mb`/`ListBuckets` 子命令，OBS 桶操作需经 obsutil 或 devkit `obs_set_website_config`（AWS4 签名 REST）；与前序「OBS AWS4 签名 x-amz-security-token 未纳入 SignedHeaders → HTTP 400」历史缺陷关联
- **影响**：OBS 静态站场景在 CLI 路径不可达
- **证据**：`evidence/D3-C2/stdout.log`、`evidence/EXP-C4-03/stdout.log`

## #2【P1】EXP-E01 评测路由「云主机查询」MISS

- **现象**：`serviceCatalog(intent="帮我查一下我账号在华北北京四有哪些云主机")` 回退「Run hcloud --help to list available services.」，未路由到 ECS 查询
- **断言**：期望路由 ECS 查询→read
- **根因**：`plugins/huaweicloud-core/dist/capability-catalog.js` serviceCatalog 路由层——中文意图「云主机」未映射到 ECS 服务别名
- **影响**：「云主机」类高频查询意图漏路由
- **证据**：`evidence/EXP-E01/stdout.log`

## #3【P1】EXP-E08 评测路由「ECS 启动失败诊断」N/A

- **现象**：`serviceCatalog(intent="我的ECS启动失败了 帮我分析原因")` 回退 help，未路由到 explain_error 诊断
- **断言**：期望路由诊断（explain_error）
- **根因**：`plugins/huaweicloud-core/dist/capability-catalog.js` serviceCatalog——「分析原因」诊断类意图未映射到 explain_error
- **影响**：排障/诊断意图无法自动路由到诊断工具
- **证据**：`evidence/EXP-E08/stdout.log`

## #4【P1】D10-3 路由准确率未达标（86.7% < 90%）

- **现象**：serviceCatalog 中文意图路由 15 条评测集命中 13 条（EXP-E01「云主机」、EXP-E08「分析原因」两条 MISS），准确率 86.7%，低于 90% 阈值
- **断言**：路由准确率 ≥ 90%
- **根因**：`plugins/huaweicloud-core/dist/capability-catalog.js` serviceCatalog 路由层缺「云主机」别名与「诊断」意图映射（同 #2/#3 根因）
- **影响**：路由准确率不达契约目标
- **证据**：`evidence/D10-3/stdout.log`、`evidence/EXP-E*.stdout.log`

## #5【测试侧】D3-C1 真云 ECS 生命周期 E2E 未完成完整建删（BLOCKED，含真机只读+网络建删已证）

- **现象**：真机已验证 ECS ListServersDetails 可用（count=0）且 VPC/子网真机建删归零成功，但完整 ECS 实例建删（CreateServers→ACTIVE→Delete→归零）未执行
- **断言**：ECS 最小实例创建→验证→删除→归零
- **根因**：本机可用 flavor 仅 ac7/ac8 高配系列 + Windows 镜像 protected，完整建删需预选最小规格 Linux 镜像，为避免误建高配计费实例，本轮未创建 ECS（0 残留）
- **影响**：ECS 真机全生命周期未闭环（阻塞类）
- **证据**：`evidence/D3-C1/stdout.log`、`evidence/D3-S2/stdout.log`
- **分类**：【测试侧】环境预置限制（非产品缺陷）

## #6【P2】D8-9 sanitizeValue 未脱敏 AK/SK/token（SPEC-MISMATCH）

- **现象**：`sanitizeValue("AKID-abc SK-xyz password=hunter2 token=abc123")` 返回原样（不脱敏），仅折叠空白
- **断言**：用例断言「sanitizeValue 移除 AK/SK/token 等敏感值与非法字符」
- **根因**：`plugins/huaweicloud-core/dist/telemetry/telemetry.js` sanitizeValue——无凭证脱敏逻辑，与用例契约漂移
- **影响**：遥测 value 字段若携带凭证值会原样上报
- **证据**：`evidence/D8-9/stdout.log`

## #7【P0】D10-4 规则库规则数漂移（文档 16 vs 实际 25）（SPEC-MISMATCH）

- **现象**：`loadRiskRules()` 返回 `{version, rules}` 其中 rules=25 条，用例文档断言「9 deny + 7 warn = 16」
- **断言**：规则库完整加载（9 deny + 7 warn = 16）
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json`——v2 规则演进至 25 条，用例文档快照未同步
- **影响**：用例断言快照过期，非产品缺陷（规则完整加载满足）
- **证据**：`evidence/D10-4/stdout.log`
- **分类**：【SPEC-MISMATCH】用例文档快照需同步（16→25）