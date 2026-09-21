# FINDINGS — 缺陷发现清单（WorkBuddy-GLM-5.2）

> **落盘路径**：`results/WorkBuddy/2026-09-22-188.239.14.150/Windows/FINDINGS.md`
> **生成时间**：2026-09-22 05:25:00（北京时间）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，格式必须严格遵循。

---

## #1【P1】EXP-E01~E15 serviceCatalog 中文意图路由大面积 MISS（12/15 未命中）

- **现象**：`node eval/harness/run-eval.mjs` 跑 serviceCatalog 路由评测，15 条中文意图中 12 条 MISS：
  - EXP-E01: "帮我查一下我账号在华北北京四有哪些云主机" → 期望 ECS，实际 "Run hcloud --help"
  - EXP-E02: "创建一台 2C4G 的 Ubuntu 云服务器" → 期望 ECS，实际 "Run hcloud --help"
  - EXP-E03: "把本地 dist 目录部署成一个公网静态网站" → 期望 OBS，实际 Sandbox+DevStation
  - EXP-E04: "给这台服务器绑定一个弹性公网IP" → 期望 EIP，实际 "Run hcloud --help"
  - EXP-E05: "看一下我的云数据库MySQL实例的状态" → 期望 RDS，实际 "Run hcloud --help"
  - EXP-E07: "给生产环境的服务器配置一个每日备份策略" → 期望 CBR，实际 "Run hcloud --help"
  - EXP-E08: "我的ECS启动失败了 帮我分析原因" → 期望 explain_error/诊断，实际 "Run hcloud --help"
  - EXP-E10: "部署一个函数处理图片自动压缩" → 期望 FunctionGraph，实际 "Run hcloud --help"
  - EXP-E11: "查一下我账号这个月的费用情况" → 期望 BSS，实际 "Run hcloud --help"
  - EXP-E12: "把应用日志指标推送到云监控告警" → 期望 CES，实际 "Run hcloud --help"
  - EXP-E13: "申请HTTPS证书并配置到我的域名" → 期望 ELB，实际 "Run hcloud --help"
  - EXP-E14: "我账号下的用户都有哪些权限 帮我审计一下" → 期望 IAM，实际 "Run hcloud --help"
  - HIT 的 3 条：EXP-E06 (DCS/Redis), EXP-E09 (CCE/Kubernetes), EXP-E15 (Voucher/代金券)
  - 基线准确率：21.4%（3/14 HIT+MISS）

- **断言**：serviceCatalog 中文意图应命中对应服务路由（如 "云主机"→ECS, "数据库"→RDS, "备份"→CBR, "函数"→FunctionGraph, "费用"→BSS, "监控"→CES, "证书"→ELB/DEW, "权限"→IAM, "弹性公网IP"→EIP）

- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1786-1890` — `serviceCatalog()` 的 `routeMap` 关键词列表几乎全是英文（'ecs', 'server', 'vm', 'rds', 'mysql', 'backup', 'function', 'billing', 'monitor', 'iam' 等），缺少中文服务名关键词（云主机, 服务器, 数据库, 备份, 函数, 费用, 监控, 证书, 权限, 弹性公网IP, 审计 等）。中文意图经 `it.includes(kw)` 匹配时，因 routeMap 无对应中文关键词而全部 fallback 到 "Run hcloud --help to list available services."。唯一命中中文关键词的路由是 Sandbox（含 '网站','网页','静态'）和 Voucher（含 '领券','代金券'），导致 EXP-E03 的"静态网站"被 Sandbox 路由抢占而非 OBS。

  具体缺失（逐路由）：
  - ECS 路由 (line 1788): 缺 '云主机','服务器','云服务器','实例'
  - VPC/EIP 路由 (line 1793): 缺 '虚拟私有云','子网','安全组','弹性公网IP','公网IP','带宽'
  - OBS 路由 (line 1798): 缺 '对象存储','桶','静态网站托管'（'静态' 被 Sandbox 路由抢占）
  - RDS 路由 (line 1813): 缺 '数据库','云数据库','实例状态'
  - CBR 路由 (line 1855): 缺 '备份','恢复','快照'
  - FunctionGraph 路由 (line 1803): 缺 '函数','无服务器','定时任务'
  - BSS 路由 (line 1835): 缺 '费用','账单','消费','预算'
  - CES 路由 (line 1850): 缺 '监控','告警','指标','仪表盘'
  - IAM 路由 (line 1820): 缺 '权限','审计','用户','角色','策略'
  - ELB: 路由表中完全缺失 ELB 路由条目（无 'elb', 'loadbalancer', '负载均衡', '证书' 关键词）

- **影响**：中文用户使用 serviceCatalog 路由时 78.6% 的意图无法正确路由到对应服务，导致 Agent 无法自动激活正确技能，严重影响中文场景下的用户体验。基线 21.4% 准确率远低于 ≥90% 的设计目标。

- **证据**：
  - `evidence/EXP-E01/stdout.log` ~ `evidence/EXP-E15/stdout.log`（逐条评测结果）
  - 评测 CSV: `eval/results/eval-run-20260921210840.csv`
  - 源码: `hdk/plugins/huaweicloud-core/src/tools.mjs:1784-1934`

- **状态**：已提单 #785 (https://github.com/huaweicloud/huaweicloud-devkit/issues/785)

## #2【非产品缺陷】凭证文件 trailing space 导致 API 认证失败

- **现象**：`~/.config/huaweicloud/credentials.json` 中 ak/sk/region 字段含 trailing space（AK 21→20, SK 41→40, region "cn-north-4 "→"cn-north-4"），导致 hcloud API 调用返回 APIGW.0301 Unauthorized。
- **说明**：测试侧环境问题（凭证文件被前序会话写入时引入空格），非产品代码缺陷。已在测试过程中修复（strip trailing space + 配置 domain_id/project_id）。记录供其他 agent 参考排查。
