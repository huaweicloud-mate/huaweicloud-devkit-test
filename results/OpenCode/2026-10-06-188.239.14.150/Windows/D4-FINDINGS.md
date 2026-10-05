# D4 批次测试发现（OpenCode / Windows / 2026-10-06）

范围：`D4-4` `D4-6` `D4-7` `D4-8` `D4-11` `D4-13` `D4-17` `D4-20` `D4-24` `D4-27`，共 10 条，证据在 `evidence/<case-id>/`。

| 用例 | 结果 | 结论 |
| --- | --- | --- |
| D4-4 | PASS | 12 类写操作 `decision!="allow"`、`safeToRun=false` 且签发 `approvalToken` |
| D4-6 | FAIL | KooCLI 真实形态的密码参数不被脱敏 |
| D4-7 | FAIL | 凭证文件/凭证内容未覆盖 deny 规则 |
| D4-8 | FAIL | Node 与 Python hook 对同一命令判定不一致 |
| D4-11 | PASS | 检索工具仅返回数据，无注入、无副作用、无服从性声明 |
| D4-13 | FAIL | 结果对象内明文回显长期 AK/SK |
| D4-17 | FAIL | 5 类畸形/截断载荷 fail-open |
| D4-20 | PASS | 拒绝路径零执行；`approvedByUser=false` 与伪造 token 均被拒 |
| D4-24 | PASS | confirm/approval token 生命周期 7 项断言全部成立 |
| D4-27 | FAIL | 小写 `ak=`/`sk=` 不脱敏 |

## D4-13 明文凭证回显（P0，安全）

- 复现：`run_readonly_command` 传入 `--cli-access-key=<ak> --cli-secret-key=<sk>`，返回对象 `plan.args`、`plan.command` 已掩码为 `<redacted>`，但 `plan.classification.args[0..1]` 保留明文。
- 影响：凭证明文进入 Agent 上下文与日志/会话记录，违反凭证最小暴露原则。
- 证据：`evidence/D4-13/stdout.log` → `helper.steps[*].leakFieldPath`（记录字段路径，不记录密钥本身）。
- 期望：`classification.args` 与 `plan.args` 使用同一套掩码，或在构造 `classification` 前完成脱敏。

## D4-6 密码参数脱敏缺口（P1）

- `redactString()` 只识别 `key: value` / `key=value`，不识别 KooCLI 的 `--password value`、`--adminPass value`、`--user-data value` 形态。
- 同形态的 `adminPass=xxx`、`password=xxx`、JSON 对象键可脱敏，说明是形态覆盖缺口而非能力缺失。
- 期望：`redactString` 增加 `--flag value` / `--flag=value` 的 flag 白名单规则。

## D4-7 凭证类规则缺口（P1）

- `.obsutilconfig` 读取命令判 allow，而 `.hcloud/config.json` 判 deny —— 凭证文件白名单缺 `.obsutilconfig`。
- artifact 侧对 YAML `ak/sk`、JSON `secretAccessKey`、数据库密码 properties 均未 deny。
- 公网暴露类部署计划可被正确 deny（该子项通过）。

## D4-8 Node/Python hook 判定不一致（P1）

- `hcloud ECS DeleteServers --servers probe-id` 与 `bash -c 'hcloud ECS DeleteServers ...'`：Node deny，Python allow。
- 根因：Python `WRITE_OPERATION_RE` 为 `(^|[A-Za-z0-9])(prefix)\w*`，KooCLI Operation 前是空格，未命中。
- 期望：两侧共用同一份判定规则，或 Python 增加词边界/分隔符集合。

## D4-17 畸形载荷 fail-open（P1）

以下 5 类携带写操作标记的载荷被判 `allow`：

1. 截断 JSON 命令片段 `{"args":["ECS","Delete`
2. JSON 数组夹带写操作 `["hcloud","ECS","DeleteServers"]`
3. artifact 内截断 JSON `{"op":"ECS DeleteServers"`
4. artifact 内 10k 不透明串 + `ECS DeleteServers`
5. deploy plan 内 10k 不透明串 + `ECS DeleteServers`

正常形态 `hcloud ECS DeleteServers` 判 deny，说明缺口在「畸形/截断/夹带」形态缺少规范化与降级。

## D4-27 大小写敏感脱敏缺口（P1）

- 脱敏正则 `/(AK|SK)\s*[:=]\s*(...)/g` 缺少 `re.I`，小写 `ak=`、`sk=` 在 `redactSecrets` 与 `redactOutput` 文本路径均原样返回。

## 观察项（非失败，供改进）

- `auth_switch action=persist` 通过 `resolveManagedProfile()` 只读取 KooCLI `current` profile，不会在缺失时创建：全新环境（无 `.hcloud/config.json`）首次 persist 返回 `partial` + `hcloud.reason="KooCLI current profile unresolved"`，S2 不落盘。已写入 `evidence/D4-24/stdout.log` 的 `observation` 字段。
- 本机 S1 中的 STS 凭证已过期，经 devkit 调用 hcloud 统一返回 `APIGW.0301 / Unauthorized`，且未给出「会话凭证已过期，请重新认证」的明确提示。