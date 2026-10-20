# FINDINGS — 缺陷分析清单（OpenCode-glm-5.2）

> **归档路径**：`results/OpenCode/2026-10-21-119.8.181.45/Windows/FINDINGS.md`
> **生成时间**：2026-10-21 11:45:00（北京时间）
> **被测版本**：huaweicloud-devkit@1.1.10 (gitHead b0e9f02)
> **客户端/OS**：OpenCode / Windows
> **执行结果**：118 PASS / 13 FAIL / 12 BLOCKED / 3 SPEC-MISMATCH / 0 NOT_RUN（共 146）
> **BLOCKED 原因**：STS token 过期（APIGW.0301），credentials 已配置但临时 token 失效，非缺凭证

---

## #1【P0】D1-39 parseDistTagsOutput 拒绝数组格式 dist-tags（Windows 升级检测链失效）

- **现象**：实测 2026-10-21 Windows: queryDistTagsSync/queryDistTags 返回 null（npm view 返回 [{latest,next}] 数组格式）
- **断言**：queryDistTagsSync 返回非 null 对象（含 latest 键）
- **根因**：`update-check.mjs:86 parseDistTagsOutput 的 Array.isArray(parsed) 检查拒绝数组格式输出，本机 npm 返回 [{latest,next}] 而非 {latest,next}，导致解析返回 null`
- **证据**：`evidence/D1-39/stdout.txt`
- **状态**：待提单（file_issue.py 历史查重）

## #2【P0】D4-2 凭证 env 打印拦截未覆盖 generic access_key

- **现象**：classifyTextCommand 对 env | grep -i access_key 返回 allow(not_huaweicloud)
- **断言**：env | grep -i access_key decision=deny risk=credential
- **根因**：`safety-policy.mjs:514-515 env-dump 正则匹配移除前缀未匹配 access_key（非 HUAWEICLOUD 前缀的 AK env 名漏检）`
- **证据**：`evidence/D4-2/stdout.txt`
- **状态**：待提单（file_issue.py 历史查重）

## #3【P0】D4-21 hook_check_artifacts 未覆盖 HCL actions=["*"] 语法

- **现象**：hcl-probe 对 HCL actions=["*"] 未触发 hwc-iam-admin-policy 规则
- **断言**：HCL actions=["*"] 触发 deny（hwc-iam-admin-policy 命中）
- **根因**：`cloud-risk-rules.json:196-213 hwc-iam-admin-policy 未覆盖 HCL actions=["*"] 语法不匹配`
- **证据**：`evidence/D4-21/stdout.txt`
- **状态**：待提单（file_issue.py 历史查重）

## #4【P0】D9-12 initialize 握手协议安全基线未跑 runVersionCheck

- **现象**：d9-12-probe 显示 initialize 未执行 runVersionCheck，dispatch 在 initialize 前置状态错
- **断言**：initialize 响应后 runVersionCheck 执行（升级检测链在握手后触发）
- **根因**：`mcp-protocol.mjs:32-55 initialize 未跑 runVersionCheck；:57-59 dispatch 在 initialize 前置状态错`
- **证据**：`evidence/D9-12/stdout.txt`
- **状态**：待提单（file_issue.py 历史查重）

## #5【P0】D10-4 安全干预静态规则层规则数与设计契约漂移

- **现象**：规则库 19 条(9 deny+10 warn) 与设计契约 16 条不匹配
- **断言**：规则数与设计契约一致（16 条 = 9 deny + 7 warn）
- **根因**：`cloud-risk-rules.json 规则数 16->19 变化不匹配设计契约规则数和类型(SPEC)`
- **证据**：`evidence/D10-4/stdout.txt`
- **状态**：待提单（file_issue.py 历史查重）

## #6【P1】D4-6 adminPass 回显警告未覆盖 CLI flag 与 JSON 带引号 key 形态

- **现象**：redactSecrets 对 --admin_pass MyPwd123 和 {"adminPass":"xxx"} 未脱敏
- **断言**：--admin_pass <pwd> 与 JSON 带引号 adminPass key 均脱敏为 <redacted>
- **根因**：`cloud-risk-rules.json:68-72 hwc-command-adminpass-exposure 未覆盖 --admin_pass 空格形态与 JSON 带引号 key(缺 command 段)`
- **证据**：`evidence/D4-6/stdout.txt`
- **状态**：待提单（file_issue.py 历史查重）

## #7【P1】D4-17 hook 模糊 fail-closed 缺失（无规则命中默认 allow）

- **现象**：risk-rule-engine 对无规则命中的命令返回 allow(fail-open)
- **断言**：无规则命中时返回 deny(fail-closed) 或 warn
- **根因**：`risk-rule-engine.mjs:103-106 无规则命中默认 allow(fail-open)`
- **证据**：`evidence/D4-17/stdout.txt`
- **状态**：待提单（file_issue.py 历史查重）

## #8【P1】D3-S6 FunctionGraph CreateFunction 未支持定时触发器

- **现象**：CreateFunction 返回 [USE_ERROR]不正确的参数:function_name，定时触发器绑定失败
- **断言**：创建 Python 函数返回 URN + 定时触发器绑定成功
- **根因**：`tools.mjs CreateFunction 最小输入未支持定时触发器(code.filename 无效/参数校验失败)`
- **证据**：`evidence/D3-S6/stdout.txt`
- **状态**：待提单（file_issue.py 历史查重）

## #9【P1】D3-S7 serviceCatalog 无 Web 应用部署目标分解 + RDS 创建缺前置

- **现象**：复合意图未命中 RDS+部署目标，RDS 创建缺 VPC/子网/安全组前置
- **断言**：复合意图命中多个 service(RDS+部署) 且 RDS 创建前置完整
- **根因**：`tools.mjs:1983-2224 routeMap 无 Web 应用部署目标分解；RDS 创建缺 VPC/子网/安全组前置`
- **证据**：`evidence/D3-S7/stdout.txt`
- **状态**：待提单（file_issue.py 历史查重）

## #10【P1】EXP-E01 serviceCatalog 缺华为云主机意图路由

- **现象**：eval-harness EXP-E01 "帮我查一下我账号在华北北京四有哪些云主机" MISS(期望 ECS)
- **断言**：serviceCatalog 命中 ECS（路由命中）
- **根因**：`tools.mjs:1995-2002 routeMap 缺华为云主机意图路由，未命中`
- **证据**：`evidence/EXP-E01/stdout.txt`
- **状态**：待提单（file_issue.py 历史查重）

## #11【P1】D9-9 协议 capabilities 未声明 cancellation（契约漂移）

- **现象**：initialize 响应 capabilities 为 {tools:{}}，未声明 cancellation
- **断言**：capabilities 声明 cancellation 支持
- **根因**：`mcp-protocol.mjs:45-49 capabilities 为 {tools:{}}，未声明 cancellation(SPEC)`
- **证据**：`evidence/D9-9/stdout.txt`
- **状态**：待提单（file_issue.py 历史查重）

## #12【P2】D4-25 Python hook WRITE_OPERATION_RE 不匹配新空格前命令

- **现象**：huaweicloud-safety.py 对空格前 CreateVpc 不匹配 WRITE_OPERATION_RE
- **断言**：空格前 CreateVpc 匹配 WRITE_OPERATION_RE
- **根因**：`huaweicloud-safety.py:46 WRITE_OPERATION_RE 前置不匹配新空格前 CreateVpc`
- **证据**：`evidence/D4-25/stdout.txt`
- **状态**：待提单（file_issue.py 历史查重）

## #13【P2】D4-26 findings 证据脱敏未覆盖 JSON 带引号 key

- **现象**：redactEvidence 对 JSON {"adminPass":"xxx","secret_key":"xxx"} 未脱敏
- **断言**：JSON 带引号 adminPass/secret_key key 脱敏为 <redacted>
- **根因**：`risk-rule-engine.mjs:19-23 redactEvidence 未覆盖 JSON 带引号 key(adminPass/secret_key)`
- **证据**：`evidence/D4-26/stdout.txt`
- **状态**：待提单（file_issue.py 历史查重）

## #14【P2】D3-S5 serviceCatalog 无复合意图拆分路由

- **现象**：复合意图(存储+托管)未命中多个 service，拆分失败
- **断言**：复合意图拆分命中多个 service(存储+托管)
- **根因**：`tools.mjs:1983-2224 routeMap 无复合意图匹配，无复合意图分解路由`
- **证据**：`evidence/D3-S5/stdout.txt`
- **状态**：待提单（file_issue.py 历史查重）

## #15【P2】D1-70 undici 依赖约束与 Node zstd 下载路径异常

- **现象**：代理配置探测 undici ^8.11.2 约束需 8.12.2(engines>=22.19)，Node 22.22 缺 node:zlib zstd
- **断言**：undici 依赖约束与 Node 版本匹配，下载路径正常
- **根因**：`undici ^8.11.2 依赖约束需 8.12.2(engines>=22.19)；Node 22.22 缺 node:zlib zstd 下载路径异常`
- **证据**：`evidence/D1-70/stdout.txt`
- **状态**：待提单（file_issue.py 历史查重）

## #16【P2】D8-9 遥测 sanitizeValue 对 AK/SK/token 不脱敏（契约漂移）

- **现象**：telemetry sanitizeValue 对 AK/SK/token 值不脱敏
- **断言**：sanitizeValue 对 AK/SK/token 值脱敏
- **根因**：`telemetry/telemetry.mjs:189-191 sanitizeValue 对 AK/SK/token 不脱敏(SPEC)`
- **证据**：`evidence/D8-9/stdout.txt`
- **状态**：待提单（file_issue.py 历史查重）
