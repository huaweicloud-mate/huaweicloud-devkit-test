# FINDINGS — huaweicloud-devkit@1.1.7 每日测试缺陷清单

> 客户端: OfficeAce | OS: Windows | 日期: 2026-09-29 | 模型: glm-5.2

## FINDING-1: P0 — 凭证 env 打印拦截规则缺失 HW_ 前缀

- **级别**: P0
- **用例**: D4-2
- **描述**: hook_check_command 对 `echo %HW_SECRET_KEY%` 和 `printenv HW_ACCESS_KEY HW_SECRET_KEY` 返回 allow，未拦截凭证环境变量打印
- **断言**: 命令含 HW_ACCESS_KEY/HW_SECRET_KEY 时 decision 必须为 deny
- **根因**: `plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` 第 39 行，hwc-command-env-dump 规则 regex `(HUAWEICLOUD|HWC_|HCLOUD|OS_)` 缺少 `HW_` 前缀。devkit 自身使用 HW_ACCESS_KEY/HW_SECRET_KEY（见 huaweicloud-cli-and-auth 技能凭证解析优先级表第 3 行）
- **证据**: evidence/D4-2/stdout.log

## FINDING-2: P0 — huawei-agent-rules.md 全局规则注入文件缺失

- **级别**: P0
- **用例**: D4-23
- **描述**: huawei-agent-rules.md 在源码仓库和已安装 npm 包中均未找到
- **断言**: 安装后 11 个目标均应有 huawei-agent-rules.md 注入系统提示/规则
- **根因**: `huaweicloud-devkit@1.1.7` 包未包含 huawei-agent-rules.md 文件
- **证据**: evidence/D4-23/stdout.log

## FINDING-3: P1 — adminPass 回显警告规则缺失

- **级别**: P1
- **用例**: D4-6
- **描述**: hook_check_command 对 `hcloud ECS CreateServers --server.adminPass=Test12345!` 返回 allow，未检测到 adminPass 明文
- **断言**: 命令含 adminPass/password 字段时应触发 warn
- **根因**: `plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` 缺少检测命令参数中 password/adminPass 字段的规则
- **证据**: evidence/D4-6/stdout.log

## FINDING-4: P1 — serviceCatalog 路由未命中 ECS（查云主机）

- **级别**: P1
- **用例**: EXP-E01
- **描述**: "帮我查一下我账号在华北北京四有哪些云主机" 路由到 "Run hcloud --help" 而非 ECS
- **断言**: serviceCatalog 应路由到 ECS
- **根因**: `plugins/huaweicloud-core/src/mcp-server.mjs` serviceCatalog 路由层未匹配"云主机"关键词到 ECS
- **证据**: eval/results/eval-run-20260929010520.csv

## FINDING-5: P1 — serviceCatalog 路由未命中 ECS（创建云服务器）

- **级别**: P1
- **用例**: EXP-E02
- **描述**: "创建一台 2C4G 的 Ubuntu 云服务器" 路由到 "Run hcloud --help" 而非 ECS
- **断言**: serviceCatalog 应路由到 ECS
- **根因**: serviceCatalog 路由层未匹配"云服务器"创建意图到 ECS
- **证据**: eval/results/eval-run-20260929010520.csv

## FINDING-6: P1 — serviceCatalog 路由未命中 OBS（静态网站部署）

- **级别**: P1
- **用例**: EXP-E03
- **描述**: "把本地 dist 目录部署成一个公网静态网站" 路由到 Sandbox 而非 OBS
- **断言**: serviceCatalog 应路由到 OBS（或提供 OBS 选项）
- **根因**: serviceCatalog 路由层将静态网站部署默认路由到 Sandbox，未提供 OBS 选项
- **证据**: eval/results/eval-run-20260929010520.csv

## FINDING-7: P1 — serviceCatalog 路由未命中 EIP

- **级别**: P1
- **用例**: EXP-E04
- **描述**: "给这台服务器绑定一个弹性公网IP" 路由到 "Run hcloud --help" 而非 EIP/VPC
- **断言**: serviceCatalog 应路由到 VPC (EIP)
- **根因**: serviceCatalog 路由层未匹配"弹性公网IP"关键词
- **证据**: eval/results/eval-run-20260929010520.csv

## FINDING-8: P1 — serviceCatalog 路由未命中 RDS

- **级别**: P1
- **用例**: EXP-E05
- **描述**: "看一下我的云数据库MySQL实例的状态" 路由到 "Run hcloud --help" 而非 RDS
- **断言**: serviceCatalog 应路由到 RDS
- **根因**: serviceCatalog 路由层未匹配"云数据库MySQL"关键词到 RDS
- **证据**: eval/results/eval-run-20260929010520.csv

## FINDING-9: P1 — serviceCatalog 路由未命中 CBR

- **级别**: P1
- **用例**: EXP-E07
- **描述**: "给生产环境的服务器配置一个每日备份策略" 路由到 "Run hcloud --help" 而非 CBR
- **断言**: serviceCatalog 应路由到 CBR
- **根因**: serviceCatalog 路由层未匹配"备份策略"关键词到 CBR
- **证据**: eval/results/eval-run-20260929010520.csv

## FINDING-10: P1 — serviceCatalog 路由未命中 FunctionGraph

- **级别**: P1
- **用例**: EXP-E10
- **描述**: "部署一个函数处理图片自动压缩" 路由到 "Run hcloud --help" 而非 FunctionGraph
- **断言**: serviceCatalog 应路由到 FunctionGraph
- **根因**: serviceCatalog 路由层未匹配"函数处理"关键词到 FunctionGraph
- **证据**: eval/results/eval-run-20260929010520.csv

## FINDING-11: P1 — serviceCatalog 路由未命中 BSS

- **级别**: P1
- **用例**: EXP-E11
- **描述**: "查一下我账号这个月的费用情况" 路由到 "Run hcloud --help" 而非 BSS
- **断言**: serviceCatalog 应路由到 BSS
- **根因**: serviceCatalog 路由层未匹配"费用"关键词到 BSS
- **证据**: eval/results/eval-run-20260929010520.csv

## FINDING-12: P1 — serviceCatalog 路由未命中 CES

- **级别**: P1
- **用例**: EXP-E12
- **描述**: "把应用日志指标推送到云监控告警" 路由到 "Run hcloud --help" 而非 CES
- **断言**: serviceCatalog 应路由到 CES (Cloud Eye)
- **根因**: serviceCatalog 路由层未匹配"云监控告警"关键词到 CES
- **证据**: eval/results/eval-run-20260929010520.csv

## FINDING-13: P1 — serviceCatalog 路由未命中 ELB

- **级别**: P1
- **用例**: EXP-E13
- **描述**: "申请HTTPS证书并配置到我的域名" 路由到 "Run hcloud --help" 而非 ELB
- **断言**: serviceCatalog 应路由到 ELB (或 WAF)
- **根因**: serviceCatalog 路由层未匹配"HTTPS证书"关键词到 ELB
- **证据**: eval/results/eval-run-20260929010520.csv

## FINDING-14: P1 — serviceCatalog 路由未命中 IAM

- **级别**: P1
- **用例**: EXP-E14
- **描述**: "我账号下的用户都有哪些权限 帮我审计一下" 路由到 "Run hcloud --help" 而非 IAM
- **断言**: serviceCatalog 应路由到 IAM
- **根因**: serviceCatalog 路由层未匹配"权限审计"关键词到 IAM
- **证据**: eval/results/eval-run-20260929010520.csv