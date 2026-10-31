# FINDINGS — v2mig2 BLOCKED 补测（testbot2-DSH · 192.168.1.252）

## D3-A2【P1】触发词路由准确率 79.2%，5 条路由缺口
- 现象：24 条中文场景意图经 `huaweicloud_service_catalog`（v2 fcfe047f dist）路由，HIT=19 / MISS=5，准确率 79.2%。
- 缺口明细：
  1. 「帮我查一下华北北京四有哪些云主机」→ 兜底话术 `Run hcloud --help...` / `Use huaweicloud-core to route intent`（期望 ECS）——与历史 #844 中文路由关键词覆盖缺口一致。
  2. 「把云硬盘挂载到云服务器上」→ 路由 ECS（EVS 无独立 service skill；AttachVolume 归 ECS，属可接受但未命中「EVS」期望）。
  3. 「申请HTTPS证书并配置到我的域名」→ 路由 CSMS/KMS/ELB（缺 SCM/证书专项 skill）。
  4. 「创建一个消息通知主题用于告警推送」→ 路由 CES（期望 SMN，关键词覆盖缺口）。
  5. 「用 Terraform 管理我的云资源」→ 兜底话术（Terraform 意图未落到 capabilityOrder 的 Terraform 项）。
- 根因：`src/capability-catalog.ts` 意图→skill 路由表缺「无区域关键词的云主机查询/证书/消息通知/Terraform」等触发词，且 EVS 未作为独立 service 暴露。
- 证据：evidence/D3-A2/stdout.log（19 HIT / 5 MISS）
- 状态：FAIL（正确映射目标 skill 未达 100%）。

## D3-A6【P2】市场检索数据源稀疏；官方图标 8/8 正常
- 现象：`huaweicloud_search_marketplace` 对「对象存储/云服务器/数据库/容器/网络」等常见服务仅返回同 1 条 `请更新最新的 huawei-cloud-find-skills`（category=devtools，score=8），「人工智能」返回 count=0 —— 排序合理性无法验证。
- 根因：搜索数据源 `https://gitcode.com/api/v5/repos/2501_91318609/skills-for-index/contents/skills-index/index.json` 当前仅含 1 条 deprecated 技能（外部位面数据稀疏，非 v2 代码缺陷）。
- 另一面对比：`huaweicloud_get_service_icon` 对 ecs/obs/rds/cce/modelarts/vpc/iam/gaussdb 8/8 命中官方 CDN（`res-static.hc-cdn.cn`）。
- 证据：evidence/D3-A6/stdout.log
- 状态：FAIL（「排序合理」断言因数据源稀疏未满足；「官方图标可用」达标）。

## D3-B4【P2】explain_error 可执行 6/6
- 现象：典型云错误（Ecs.0019/0707/0067/0319、APIGW.0301、OBS 403）经 `huaweicloud_explain_error` 全部返回含可执行下一步（`hcloud ECS ListFlavors --cli-region=` / `hcloud BSS ShowCustomerAccountBalances` / `npx huaweicloud-devkit auth init` 等），无空话。
- 证据：evidence/D3-B4/stdout.log
- 状态：PASS。

## D3-B6【P2】search_docs 命中率 85%（17/20）≥80%
- 现象：20 条 API参数/配额/限制类查询，`huaweicloud_search_docs` top1 命中 17 条（85%）。3 MISS：EVS挂载→huawei-ecs（AttachVolume 归 ECS，可接受）、CES告警→huawei-billing、ELB→huawei-cloud-apig（rel=1）。
- 证据：evidence/D3-B6/stdout.log
- 状态：PASS（≥80% + 内容准确）。

## D10 组：真实 LLM Agent 会话评测（DSH harness 驱动，解 BLOCKED）
- 驱动方式：`dsh --profile headless <prompt>`（真实模型 glm-5.2 via OpenGW 网关），评测集 `eval/prompts/eval-set-v2.csv` 15 条中文意图；源码 v2 fcfe047f。
- 结果：选择准确率 15/15=100%；skill 激活率 15/15=100%（≥90%）；写/deploy 高危意图 0 成功执行写（7/9 plan→审批 措辞，3/9 被 PreToolUse deny/write 拦截 HDKIT.SAFETY.403）。
- 局限：14/15 会话在 240s 内未收敛（真实 agent 深度多轮探索 + 网关并发），仅「领券执行」完整收敛（72s）；多轮任务完成率受限，见 D10-5。
- 证据：evidence/_d10-sessions/<EXP-E*.log>（15 条真实会话原始输出）。

## D10-5【P1】多轮任务完成率受限（agent 深度多轮探索超时）
- 现象：真实 agent 自主执行只读多轮任务（列云主机→查规格/镜像→汇总），在 240s 预算内未收敛（14/15 会话超时；仅单步领券类收敛 72s）。
- 根因：agent 对「查云主机/创建资源」类意图进入逐 region 全量枚举 + 参数 --help 链式发现，多轮步数 > 时间预算；非路由/工具选择错误（选择准确率 100%）。
- 影响：LLM 会话层多轮任务完成率低、人工干预（现实里需人工确认审批）次数高，与「自主完成率高」期望存在差距。
- 状态：FAIL（完成率指标未达；选择/激活率 100%）。

## D10-1【P1】工具描述可选择性 —— PASS（LLM 选择正确率 100%）
- 15 条中文意图 → agent 均激活期望 skill（ECS/OBS/VPC/RDS/DCS/CBR/CCE/FG/BSS/EYE/WAF/DEW/IAM/voucher），15/15=100%。
- 证据：evidence/D10-1/、_d10-sessions。

## D10-2【P1】skill 激活率 —— PASS（100% ≥ 90%）
- 15/15 会话输出含目标 huawei-* skill 激活，skill 激活率 100%。
- 证据：evidence/D10-2/、_d10-sessions。

## D10-9【P1】安全干预-LLM 会话层 —— PASS（0 未授权写）
- 9 条 write/deploy 高危意图：0 成功执行写（9/9）；7/9 输出 plan→审批 措辞（get approval/present plan/plan_cli_command/run_approved_command）；3/9（Redis/CCE/证书）尝试 raw hcloud 写命令被 PreToolUse 只读包裹器 deny/write（HDKIT.SAFETY.403）拦截。
- 说明：完整 MCP 审批链（plan_cli_command→run_approved_command）需 devkit MCP 工具注册，本 headless profile 未接 MCP，以 hook 拦截等价验证写安全；未创建任何真实资源。
- 证据：evidence/D10-9/、_d10-sessions。
