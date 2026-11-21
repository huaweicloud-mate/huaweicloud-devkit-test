import os,glob,re
b=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
f=[x for x in os.listdir(b) if x.endswith(".md") and "报告" in x][0]
p=os.path.join(b,f)
t=open(p,encoding="utf-8").read()
t=t.replace("> **执行方法**：TODO: 待 agent 补充（探针直调 / MCP 真机 / 真云 E2E 等）",
"> **执行方法**：① 源码级直调（update-check/risk-rule/safety-policy/detect-framework 等 mjs 函数）② MCP JSON-RPC 真机调用（49 工具、initialize/tools list、hook 预检、plan/confirm）③ 官方夹具 harness（eval/harness/fixtures 24 项）④ 真云 E2E（hcloud + OBS SDK：VPC/ECS 建删、OBS 桶与网站托管建删、只读查询、只读子账号最小权限）⑤ D10-3 路由评测（run-eval.mjs，15 条命中 13、N/A 1、准确率 92.9%）。全部证据落 `evidence/<case-id>/`。")
roots = """| # | 用例 | 根因（文件:行号） |
|---|---|---|
| 1 | D1-39 | `update-check.mjs` parseDistTagsOutput 仅接受对象，未兼容 npm 12 数组输出 |
| 2 | D2-12 | `tools.mjs` auth_sync 调 `auth/service.mjs` syncAuth 仅读持久凭证，未走 runtime 凭证 |
| 3 | D4-19 | `hcloud-cli.mjs` consumeApprovalToken 调用方未将 null 映射为拒绝 |
| 4 | D2-1 | `auth/service.mjs` initAuth 隔离 HOME 下未落盘 S1/KooCLI/OBS |
| 5 | D3-C14 | `auth/credentials.mjs` resolveCredentials 清空 runtime 后回退实例文件凭证 |
| 6 | D3-S6 | 探针 func_code 传参/编码不适配（FSS.0400），非产品缺陷，不计入缺陷单 |
| 7 | D4-2 | `safety/rules/cloud-risk-rules.json` 缺 Windows `set VAR` 规则；`risk-rule-engine.mjs` |
| 8 | D4-3 | `cloud-risk-rules.json` blockedSecretOperations 未覆盖 KMS DecryptData |
| 9 | D4-9 | `risk-rule-engine.mjs` 缺 0.0.0.0/0 安全组入方向规则 |
| 10 | D4-15 | `safety-policy.mjs` classifyTextCommand 未剥离连续/转义双引号 |
| 11 | D4-16 | `safety-policy.mjs` stripExecutable/classifyTextCommand 未递归解析内层命令 |
| 12 | D4-17 | `safety-policy.mjs` classifyTextCommand 未对 NUL/非字符串 fail-closed |
| 13 | D4-25 | `huaweicloud-safety.py` record_cli_event capability 恒为 `cli`，缺 cli:invoke |
| 14 | D4-26 | `risk-rule-engine.mjs` evidence 直接 excerpt(text) 未调用 redactEvidence |
| 15 | D8-9 | `telemetry/telemetry.mjs` sanitizeValue 无凭证脱敏正则 |
| 16 | D9-4 | `mcp-protocol.mjs` tools/list 前未校验 initialized |
| 17 | D9-12 | 同 D9-4，`mcp-server.mjs` 无强制握手门禁 |
| 18 | EXP-E01 | `tools.mjs` serviceCatalog routeMap 未覆盖「华北北京四/云主机」组合 |
| 19 | D10-4 | `cloud-risk-rules.json` 新增 3 条 warn（19=9+10 vs 基线 16=9+7，SPEC 漂移） |
"""
t=t.replace("TODO: 待补根因","见 FINDINGS.md 根因列")
t=t.replace("> TODO: 每个 FAIL 用例的「期望 / 实际 / 根因（文件:行号）/ 证据」需由 agent 依据 evidence/<case-id>/stdout.log 补充。",roots)
t=t.replace("- [ ] 凭证泄漏事件：`TODO: 待填`\n- [ ] 写操作误判 read-only：`TODO: 待填`\n- [ ] 红线（I 类）违规：`TODO: 待填`\n- [ ] 脱敏复核：`TODO: 待填`",
"- [x] 凭证泄漏事件：无明文 AK/SK 写入 results（D2-4/PROFILE 脱敏 PASS；D4-26 findings.evidence 未脱敏已提单）\n- [x] 写操作误判 read-only：D4-5/D4-10 写=deny或warn、只读=allow，无误判\n- [x] 红线（I 类）违规：无（未创建未删除资源；未以 mock 冒充真云）\n- [x] 脱敏复核：evidence 内无明文凭证；hcloud 输出已过滤 secret-key")
res = """| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC（D3-S2） | tctest-daily-20261122053114 | hcloud VPC DeleteVpc rc=0 | VPC ListVpcs 无该 id（仅他机 hermes 资源） |
| ECS（D3-C1） | tctest-ecs-20261122054351（c6.large.2/EulerOS 3.0） | DeleteServers(servers.1.id, delete_publicip/volume) | ListServersDetails count=0，ShowServer=DELETED |
| 子网/安全组（D3-C1） | tctest-ecs-* 随 VPC 创建 | DeleteSubnet(vpc_id)+DeleteSecurityGroup | 子网/安全组列表无本次创建 |
| OBS 桶（D3-C2） | tctest-obs-* | deleteObject+deleteBucket | headBucket=404 |
| OBS 桶与网站配置（D3-C13） | tctest-obsweb-* | deleteBucketWebsite+deleteBucket | headBucket=404 |
| FunctionGraph（D3-S6） | 创建失败(FSS.0400) | 无资源产生 | ListFunctions 无本次函数 |
| 只读子账号写测试（D4-13） | VPC.0010 被 IAM 拒绝，未创建 | 无需清理 | 无残留 |
"""
t=t.replace("| 资源 | 创建 | 销毁 | 归零验证 |\n|---|---|---|---|\n| TODO | TODO | TODO | TODO |\n\n> TODO: 真云用例的资源创建/销毁/归零情况由 agent 依据执行过程补充。",res)
t=t.replace("- TODO: 待裁决 SPEC / 未覆盖项 / 修复建议由 agent 补充。",
"- **D10-4 SPEC-MISMATCH**：规则库 19 条（9 deny+10 warn）与用例基线 16 条漂移，建议维护者更新用例基线或标注版本化规则数。\n- **P0 安全缺口（建议优先修复）**：D4-2/D4-3/D4-9/D4-15/D4-16/D4-19/D9-12 共 7 项，全部为 hook/预检/握手层可绕过或漏判，建议在 1.1.16 前修复并回归。\n- **升级链 D1-39**：npm 12 `dist-tags --json` 输出为数组，Windows 检测链静默降级为 check_failed，属用户可感知回归。\n- **未覆盖/阻塞**：沙箱（D3-C3/C6/S3）缺 DevStation 配额，RDS 编排（D3-S7）需长窗口，提示注入（D4-11）需 LLM harness；建议维护者提供沙箱与 harness 后补测。\n- **环境提示**：本机 credentials.json 曾被前次 D2-26 测试写入占位 AK（AK_BK_00…），已恢复真实凭证并留备份，建议用例执行后自愈。")
open(p,"w",encoding="utf-8").write(t)
print("report updated",len(t))