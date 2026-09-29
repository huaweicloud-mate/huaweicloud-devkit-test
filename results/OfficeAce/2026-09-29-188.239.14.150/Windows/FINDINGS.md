# FINDINGS — 缺陷发现清单（OfficeAce-glm-5.2）

> **落盘路径**：`results/OfficeAce/2026-09-29-188.239.14.150/Windows/FINDINGS.md`
> **生成时间**：2026-09-29 09:15:00（北京时间）
> **被测版本**：huaweicloud-devkit@1.1.7

## #1【P0】D4-2 凭证env打印拦截规则缺失HW_前缀

- **现象**：hook_check_command 对 `echo %HW_SECRET_KEY%` 和 `printenv HW_ACCESS_KEY HW_SECRET_KEY` 返回 allow，未拦截
- **断言**：命令含 HW_ACCESS_KEY/HW_SECRET_KEY 时 decision 必须为 deny
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:39` + hwc-command-env-dump 规则 regex `(HUAWEICLOUD|HWC_|HCLOUD|OS_)` 缺少 `HW_` 前缀，devkit 自身使用 HW_ACCESS_KEY/HW_SECRET_KEY
- **影响**：凭证环境变量可通过 echo/printenv 泄露到 agent 上下文
- **证据**：`evidence/D4-2/stdout.log`
- **状态**：待提单

## #2【P0】D4-23 huawei-agent-rules.md全局规则注入文件缺失

- **现象**：huawei-agent-rules.md 在源码仓库和已安装 npm 包中均未找到
- **断言**：安装后 11 个目标均应有 huawei-agent-rules.md 注入系统提示/规则
- **根因**：`huaweicloud-devkit@1.1.7` 包未包含 huawei-agent-rules.md 文件
- **影响**：全局安全规则无法注入到 agent 系统提示
- **证据**：`evidence/D4-23/stdout.log`
- **状态**：待提单

## #3【P1】D4-6 adminPass回显警告规则缺失

- **现象**：hook_check_command 对 `hcloud ECS CreateServers --server.adminPass=Test12345!` 返回 allow
- **断言**：命令含 adminPass/password 字段时应触发 warn
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` + 缺少检测命令参数中 password/adminPass 字段的规则
- **证据**：`evidence/D4-6/stdout.log`
- **状态**：待提单

## #4【P1】EXP-E01 serviceCatalog路由未命中ECS(查云主机)

- **现象**："帮我查一下我账号在华北北京四有哪些云主机" 路由到 "Run hcloud --help"
- **断言**：serviceCatalog 应路由到 ECS
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs` serviceCatalog 路由层未匹配"云主机"关键词到 ECS
- **证据**：`eval/results/eval-run-20260929010520.csv`
- **状态**：待提单

## #5【P1】EXP-E02 serviceCatalog路由未命中ECS(创建云服务器)

- **现象**："创建一台 2C4G 的 Ubuntu 云服务器" 路由到 "Run hcloud --help"
- **断言**：serviceCatalog 应路由到 ECS
- **根因**：serviceCatalog 路由层未匹配"云服务器"创建意图到 ECS
- **证据**：`eval/results/eval-run-20260929010520.csv`
- **状态**：待提单

## #6【P1】EXP-E03 serviceCatalog路由未命中OBS(静态网站)

- **现象**："把本地 dist 目录部署成一个公网静态网站" 路由到 Sandbox
- **断言**：serviceCatalog 应路由到 OBS 或提供 OBS 选项
- **根因**：serviceCatalog 路由层将静态网站部署默认路由到 Sandbox
- **证据**：`eval/results/eval-run-20260929010520.csv`
- **状态**：待提单

## #7【P1】EXP-E04 serviceCatalog路由未命中EIP

- **现象**："给这台服务器绑定一个弹性公网IP" 路由到 "Run hcloud --help"
- **断言**：serviceCatalog 应路由到 VPC(EIP)
- **根因**：serviceCatalog 路由层未匹配"弹性公网IP"关键词
- **证据**：`eval/results/eval-run-20260929010520.csv`
- **状态**：待提单

## #8【P1】EXP-E05 serviceCatalog路由未命中RDS

- **现象**："看一下我的云数据库MySQL实例的状态" 路由到 "Run hcloud --help"
- **断言**：serviceCatalog 应路由到 RDS
- **根因**：serviceCatalog 路由层未匹配"云数据库MySQL"关键词
- **证据**：`eval/results/eval-run-20260929010520.csv`
- **状态**：待提单

## #9【P1】EXP-E07 serviceCatalog路由未命中CBR

- **现象**："给生产环境的服务器配置一个每日备份策略" 路由到 "Run hcloud --help"
- **断言**：serviceCatalog 应路由到 CBR
- **根因**：serviceCatalog 路由层未匹配"备份策略"关键词
- **证据**：`eval/results/eval-run-20260929010520.csv`
- **状态**：待提单

## #10【P1】EXP-E10 serviceCatalog路由未命中FunctionGraph

- **现象**："部署一个函数处理图片自动压缩" 路由到 "Run hcloud --help"
- **断言**：serviceCatalog 应路由到 FunctionGraph
- **根因**：serviceCatalog 路由层未匹配"函数处理"关键词
- **证据**：`eval/results/eval-run-20260929010520.csv`
- **状态**：待提单

## #11【P1】EXP-E11 serviceCatalog路由未命中BSS

- **现象**："查一下我账号这个月的费用情况" 路由到 "Run hcloud --help"
- **断言**：serviceCatalog 应路由到 BSS
- **根因**：serviceCatalog 路由层未匹配"费用"关键词
- **证据**：`eval/results/eval-run-20260929010520.csv`
- **状态**：待提单

## #12【P1】EXP-E12 serviceCatalog路由未命中CES

- **现象**："把应用日志指标推送到云监控告警" 路由到 "Run hcloud --help"
- **断言**：serviceCatalog 应路由到 CES
- **根因**：serviceCatalog 路由层未匹配"云监控告警"关键词
- **证据**：`eval/results/eval-run-20260929010520.csv`
- **状态**：待提单

## #13【P1】EXP-E13 serviceCatalog路由未命中ELB

- **现象**："申请HTTPS证书并配置到我的域名" 路由到 "Run hcloud --help"
- **断言**：serviceCatalog 应路由到 ELB
- **根因**：serviceCatalog 路由层未匹配"HTTPS证书"关键词
- **证据**：`eval/results/eval-run-20260929010520.csv`
- **状态**：待提单

## #14【P1】EXP-E14 serviceCatalog路由未命中IAM

- **现象**："我账号下的用户都有哪些权限 帮我审计一下" 路由到 "Run hcloud --help"
- **断言**：serviceCatalog 应路由到 IAM
- **根因**：serviceCatalog 路由层未匹配"权限审计"关键词
- **证据**：`eval/results/eval-run-20260929010520.csv`
- **状态**：待提单