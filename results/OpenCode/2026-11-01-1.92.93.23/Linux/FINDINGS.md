# FINDINGS — 缺陷发现清单（OpenCode-deepseek-v4-pro-0813）

> **落盘路径**：`results/OpenCode/2026-11-01-1.92.93.23/Linux/FINDINGS.md`
> **生成时间**：`2026-11-01 05:42:00`（北京时间）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，格式必须严格遵循。

---

## #1【P0】D2-4 凭证脱敏正确性：小写 ak=/sk= 未脱敏导致凭证明文泄漏

- **现象**：`redactSecrets("config: ak=TESTAKXXXXXXXXXXXXXXXX sk=TESTSKYYYY...")` 原样返回小写 `ak=`/`sk=` 后的凭证值（`akLeak=true, skLeak=true`）；而大写 `AK=`/`SK=` 与 `access_key=` 均正确脱敏。
- **断言**：凭证类字符串脱敏后不得包含原始 AK/SK 值（大小写不敏感）。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:45` `/(AK|SK)\s*[:=]\s*(...)/g` 仅带 `g` 旗标、无 `i` 旗标，只匹配大写 `AK=`/`SK=`；小写 `ak=`/`sk=`（配置文件/脚本常见写法）漏脱敏。`isSecretKeyName` 的 `ak`/`sk` 只作用于对象键名，不作用于字符串值。
- **影响**：red-line 脱敏防线被绕过，小写 `ak=`/`sk=` 形式凭证可进入 agent 上下文/日志，属 I 类凭证泄漏风险。
- **证据**：`evidence/D2-4/stdout.log`
- **状态**：待提单

## #2【P0】D4-3 明文 secret API 拦截：KMS DecryptData 被放行

- **现象**：`classifyTextCommand("hcloud KMS DecryptData --cipher_text=xxx")` 返回 `allow`（未拦截）；KMS 解密可返回明文 secret 进入 agent 上下文。
- **断言**：返回明文/二进制 secret 的 API（如 KMS DecryptData）应被判 `deny`/`warn`，不得 `allow`。
- **根因**：`plugins/huaweicloud-core/safety/policy.json:26` `blockedSecretOperations=["ShowSecret","ShowSecretVersion","DownloadSecret","GetSecretValue"]` 未含 `DecryptData`；`safety-policy.mjs:249` 据此不拦截 KMS 解密操作。
- **影响**：明文 secret API 放行，`cipher_text` 解密结果可进 agent 上下文，属 P0 安全缺陷。
- **证据**：`evidence/D4-3/stdout.log`
- **状态**：待提单

## #3【P1】D3-C1 ECS 生命周期 E2E：删除归零未自证完成，资源残留需人工二次删除

- **现象**：真云 E2E 中建 VPC/子网/ECS 成功（`serverIds` 返回）；但 finally 归零环节 `DeleteServers` 返回 `job_id` 后实例在 150s 轮询窗口内仍 `ACTIVE`，`DeleteSubnet`/`DeleteVpc` 返回 exit0 但 VPC/子网仍 ACTIVE 残留（探针 5 项子步 4 通过、归零 false）。
- **断言**：ECS 生命周期 E2E 删除后，云上 ECS/VPC/子网应真实消失并自证归零。
- **根因**：KooCLI 异步删除语义——`DeleteServers`/`DeleteSubnet`/`DeleteVpc` 提交即返回 exit0（job 受理）但资源未即时删除；归零验证以 `hcloud` exit0 判「已删除」并依赖有限轮询窗口，导致误判；实例删除耗时超过 150s 窗口。
- **影响**：真云用例「建删归零」红线未可靠达成，资源残留；本次已人工二次删除并核实 VPC `cd5ec176...`/子网 `1a2922dc...`/ECS `a7692436...` 均消失。
- **证据**：`evidence/D3-C1/stdout.log`
- **状态**：待提单

## #4【P1】EXP-E01 路由准确率：意图「查云主机」未命中 ECS

- **现象**：`huaweicloud_service_catalog(intent="帮我查一下我账号在华北北京四有哪些云主机")` 返回兜底 "Run hcloud --help to list available services."，未路由到 ECS（MISS）。15 条评测集基线：13 HIT / 1 MISS / 1 N/A = 92.9%。
- **断言**：含「云主机/云服务器」的查询意图应命中 `ECS`。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2199-2212` serviceCatalog ECS route `keywords` 缺「云主机」别名（仅含 云服务器/服务器/虚拟机/镜像），导致「云主机」意图无法命中 ECS。
- **影响**：路由准确率下降，用户「查云主机」意图无法引导到 ECS 能力路径。
- **证据**：`evidence/EXP-E01/stdout.log`、`evidence/D10-3/stdout.log`
- **状态**：待提单