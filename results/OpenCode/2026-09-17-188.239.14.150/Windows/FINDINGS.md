# FINDINGS — 缺陷发现清单（OpenCode-glm-5.2）

> **落盘路径**：`results/OpenCode/2026-09-17-188.239.14.150/Windows/FINDINGS.md`
> **生成时间**：2026-09-17 06:55:00（北京时间）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，**格式必须严格遵循**。

---

## #1【P0】D4-2 凭证env打印拦截不完整（Windows echo %HW_SECRET_KEY% 未拦截）

- **现象**：`hook_check_command("echo %HW_SECRET_KEY%")` 返回 `decision=allow, findings=[]`；`hook_check_command("printenv HW_ACCESS_KEY")` 同样返回 `allow`
- **断言**：`echo %HW_SECRET_KEY%` 和 `printenv HW_ACCESS_KEY` 应返回 `decision=deny`（凭证 env 打印拦截）
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:39` — `hwc-command-env-dump` 规则的 regex `(HUAWEICLOUD|HWC_|HCLOUD|OS_)` 未覆盖 `HW_ACCESS_KEY`/`HW_SECRET_KEY` 前缀（`HW_` 不匹配 `HWC_`）；且 `echo` 不在 env dump 命令列表 `(env|printenv|Get-ChildItem Env:|gci Env:|dir Env:)` 中
- **影响**：Windows 环境下凭证 env 变量可通过 `echo %HW_*%` 泄漏到 agent 上下文
- **证据**：`evidence/source-probe-results.log`（D4-2 classifyTextCommand echo FAIL）
- **状态**：待提单

## #2【P0】D4-3 明文secret API参数未拦截（hcloud --backup-password 等）

- **现象**：`hook_check_command("hcloud RDS ShowBackupPolicy --backup-password secret123")` 返回 `decision=allow, findings=[]`
- **断言**：含 `--backup-password`/`--password`/`--secret` 等明文密码参数的 hcloud 命令应返回 `decision=deny` 或 `warn`
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:47-66` — `hwc-command-secret-value-read` 规则仅匹配 `(ShowSecretVersion|DownloadSecret|GetSecretValue)` 和 `(secret_string|secret_binary)`，不覆盖命令行参数中的明文密码
- **影响**：hcloud 命令中的明文密码参数可泄漏到 agent 上下文
- **证据**：`evidence/remaining-probe-results.log`（D4-3 测试项）
- **状态**：待提单

## #3【P0】D4-21 hook_check_artifacts 未检测 IaC 中的明文密码（admin_pass/user_data）

- **现象**：`hook_check_artifacts([{path:"main.tf", content:"admin_pass = \"Admin@123456\" ... user_data = \"...password=secret123\""}])` 返回 `decision=allow, findings=[]`
- **断言**：IaC 制品中的 `admin_pass`/`password`/`user_data` 含明文密码应返回 `findings.length > 0`
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` — artifact stage 规则仅有 `hwc-network-public-admin-port`/`hwc-obs-anonymous-write`/`hwc-iam-admin-policy`/`hwc-sandbox-missing-ttl`/`hwc-cost-unbounded-scale`，缺少检测 IaC 中明文密码的规则
- **影响**：IaC 制品中的明文密码不会被 hook 预检拦截
- **证据**：`evidence/remaining-probe-results.log`（D4-21 测试项）
- **状态**：待提单

## #4【P0】D4-22 hook_check_deploy_plan 未检测公网暴露（0.0.0.0/0 all ports）

- **现象**：`hook_check_deploy_plan({resources:[{type:"security_group",ingress:[{source:"0.0.0.0/0",ports:"all"}]}]})` 返回 `decision=allow, findings=[]`
- **断言**：部署计划中 `0.0.0.0/0` 开放所有端口应返回 `findings.length > 0`
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:110-129` — `hwc-network-public-admin-port` 规则要求同时匹配 `0.0.0.0/0` 和特定端口数字 `\b(22|3389|3306|...)\b`，`ports:"all"` 不含数字故不匹配
- **影响**：部署计划中 "all ports" 的公网暴露不会被预检拦截
- **证据**：`evidence/remaining-probe-results.log`（D4-22 测试项）
- **状态**：待提单

## #5【P0】D4-9/D4-7 evaluateDeployPlan/evaluateArtifacts 破坏性/公开暴露未检测（源码级）

- **现象**：源码级直调 `evaluateDeployPlan({action:"delete",resource:"rds_instance"})` 返回 `findings=[]`；`evaluateArtifacts([{content:"admin_pass=..."}])` 同样返回 `findings=[]`
- **断言**：破坏性部署计划和含明文密码的制品应返回 `findings.length > 0`
- **根因**：同 #3/#4，`cloud-risk-rules.json` 的 artifact/deploy_plan stage 规则覆盖不足
- **影响**：源码级风险规则引擎对制品/部署计划的安全检测覆盖不完整
- **证据**：`evidence/source-probe-results.log`（D4-7/D4-9 测试项）
- **状态**：待提单

## #6【P0】D4-23 全局规则 huawei-agent-rules.md 未安装到 safety 目录

- **现象**：源码仓库 `hdk/rules/huawei-agent-rules.mdc` 存在（3840字节），但安装后 safety 目录 `~/.config/opencode/huaweicloud-plugins/safety/` 仅有 `policy.json` 和 `rules/cloud-risk-rules.json`，无 `huawei-agent-rules.md`/`.mdc`
- **断言**：`update` 后 safety 目录应包含全局规则文件
- **根因**：`plugins/huaweicloud-core/src/setup-cli.mjs` update 流程未将 `hdk/rules/huawei-agent-rules.mdc` 复制到各安装目标的 safety 目录
- **影响**：全局 agent 安全规则未注入到 11 个安装目标
- **证据**：`evidence/final-probe-results.log`（D4-23 测试项）
- **状态**：待提单

## #7【P1】D4-24 无效确认令牌返回空响应

- **现象**：`run_approved_command(approvalToken:"invalid-token-12345", approvedByUser:true)` 返回空响应（content 为空）
- **断言**：无效令牌应返回明确错误信息（如 `error: invalid approval token`）
- **根因**：`plugins/huaweicloud-core/src/hcloud-cli.mjs` `consumeApprovalToken()` 对无效令牌的处理可能直接返回空而非错误消息
- **影响**：用户无法区分令牌无效还是命令执行失败
- **证据**：`evidence/remaining-probe-results.log`（D4-24 测试项）
- **状态**：待提单

## #8【P1】D8-4 README 缺少可机械执行的安装命令

- **现象**：README.md 中未找到 `npm install -g huaweicloud-devkit` 或 `npx huaweicloud-devkit install` 的精确命令模式
- **断言**：README 应包含可复制粘贴执行的安装命令
- **根因**：`README.md` 安装说明可能使用了不同的命令格式或位置
- **影响**：用户无法从 README 直接机械执行安装
- **证据**：`evidence/final-probe-results.log`（D8-4 测试项）
- **状态**：待提单

## #9【P1】EXP-E01~E14 serviceCatalog 中文意图路由准确率低（11/14 MISS）

- **现象**：D10 评测集 15 条中文意图经 `run-eval.mjs` 测试，HIT=3/MISS=11/N/A=1，准确率 21.4%
- **断言**：serviceCatalog 应命中期望服务（ECS/VPC/OBS/RDS/EIP/CBR/FunctionGraph/BSS/CES/ELB/IAM 等）
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` `serviceCatalog` 函数对中文意图的路由匹配覆盖不足，多数意图返回 "Run hcloud --help to list available services" 而非具体服务
- **影响**：Agent 无法正确路由中文用户意图到对应华为云服务
- **证据**：`evidence/D10-eval-stdout.log`（EXP-E01~E15 全量结果）
- **状态**：待提单（已知基线 21.4%，可能已有历史单）

## #10【P2】D4-12 package.json 路径与 npm pack 一致性

- **现象**：`hdk/plugins/huaweicloud-core/package.json` 不存在（package.json 在仓库根目录），`npm pack --dry-run` 输出为空
- **断言**：被测包应有 package.json 且 `npm pack --dry-run` 输出文件清单
- **根因**：package.json 位于 `hdk/package.json` 而非 `hdk/plugins/huaweicloud-core/package.json`；npm pack 在 cwd 不正确时无输出
- **影响**：供应链审计无法在插件子目录执行
- **证据**：`evidence/final-probe-results.log`（D4-12 测试项）
- **状态**：待提单

## #11【非产品缺陷】D2-16 import 文件擦除时序与描述不一致（SPEC-MISMATCH）

- **现象**：`auth_switch mode=import` 读取 `creds-import.json` 后文件仍存在（未立即擦除）；工具描述说 "then wipes it" 但实现对有效文件保留以供重放
- **说明**：`tools.mjs:992-993` 注释 "A VALID file is kept so a rejected persist can be replayed (see #502)"，这是设计决策（保留有效文件供重放），非产品缺陷。但描述与实现不一致构成 SPEC-MISMATCH
- **证据**：`evidence/final-probe-results.log`（D2-16 测试项）
- **状态**：SPEC-MISMATCH，待裁决
