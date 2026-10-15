# UX 真机专项 FINDINGS

## 执行信息

- **客户端**: testbot4-win-Opencode
- **日期**: 2026-10-15
- **IP**: 192.168.0.208
- **被测包**: huaweicloud-devkit@1.1.9-next.0 (npm @next)
- **Node**: v22.22.2
- **区域**: cn-north-4
- **插件 src**: `C:\Users\Administrator\.workbuddy\binaries\node\versions\22.22.2-3\node_modules\huaweicloud-devkit\plugins\huaweicloud-core\src`

## 执行结果汇总

| 指标 | 数量 |
|------|------|
| 执行夹具数 | 24 |
| PASS | 4 |
| 需求未实现 (NOT_IMPLEMENTED) | 19 |
| BLOCKED | 1 |
| HARNESS_ERROR | 0 |
| D11-34 真机归零 | 已归零（无残留） |

## D11-13 登录后自检五项（真机，NOT_IMPLEMENTED）

**判据**: 登录后自检五项（凭据/OBS/KooCLI版本/project-id/MCP注册）全部 ready，且返回中文体检摘要。

**实测**: 使用真云凭证（HW_ACCESS_KEY/HW_SECRET_KEY）执行，夹具未 BLOCKED，正常进入断言。

- 自检五项仅 1/5 ready（KooCLI 版本 ready，凭据/OBS/project-id/MCP注册 均未就绪）
- 无中文体检摘要字段（selfCheck 相关字段为空）
- nextStep 不为空（kooCliNextStep=huaweicloud_show_profile_redacted，onboardingScenario=4）
- 体检摘要不含内部代号：PASS

**根因**: `getAuthStatus()` 在隔离 HOME 环境下（运行器隔离 HOME，仅通过 HW_* 环境变量注入凭证）未能识别环境变量凭证，导致凭据/OBS/project-id/MCP 均报未就绪。且未实现中文体检摘要字段。

## D11-34 资源归零体验（真机，NOT_IMPLEMENTED + 真建真删归零）

### 夹具断言结果

**判据**: 清理后返回中文归零报告（逐资源列出「已释放/未释放」+ 剩余计数），未释放项附唯一补删命令。

- 真机只读复核可执行（ECS/EIP/EVS 三类列表）：PASS（3/3 成功）
- 归零报告为中文且逐资源列出：FAIL（无归零报告字段）
- 零残留时给出明确中文结论：FAIL（无「无残留/已归零」结论）
- 未释放项附唯一补删命令：FAIL（无补删命令）

**根因**: `huaweicloud_run_readonly_command` 工具返回原始 API JSON，未封装中文归零报告。

### 真建真删归零全链路（追加要求）

**执行命令**:
```
# 创建前快照
hcloud EIP ListPublicips/v2 --cli-region=cn-north-4
# 结果: 1 个已有 EIP

# 创建最小按需 EIP（流量计费，1Mbit/s）
hcloud EIP CreatePublicip --bandwidth.share_type=PER --bandwidth.size=1 --bandwidth.charge_mode=traffic --bandwidth.name=ux-testbot4-<ts>-bw --publicip.type=5_bgp --publicip.alias=ux-testbot4-<ts> --cli-region=cn-north-4
# 结果: EIP ID=4f924a85-e7f6-4186-9d1f-3b65b4f4058e, IP=123.249.16.246

# 列表核验
hcloud EIP ListPublicips/v2 --cli-region=cn-north-4
# 结果: 2 个 EIP，新 EIP 在列表中 ✓

# 删除 EIP
hcloud EIP DeletePublicip --publicip_id=4f924a85-e7f6-4186-9d1f-3b65b4f4058e --cli-region=cn-north-4
# 结果: SUCCESS

# 复核为空
hcloud EIP ListPublicips/v2 --cli-region=cn-north-4
# 结果: 1 个 EIP（回到创建前数量），新 EIP 不在列表中 ✓
```

**归零结果**: 已归零（无残留），已清理，无残留资源与费用。

**证据路径**: `results/testbot4-win-Opencode/2026-10-15-192.168.0.208/ux-真机/evidence/D11-34-real-eip/`

## 其他 NOT_IMPLEMENTED 用例汇总

### 1. effective.source 契约字段未实现（影响 D11-3/D11-4/D11-5/D11-30）

`getAuthStatus()` 未返回 `effective.source`（应区分 runtime/s1/env）、`effective.fingerprint`、`effective.region` 字段。状态机 7 条迁移路径仅 1/7 一致（空态正确，其余均返回 null）。

### 2. 中文本地化不完整（影响 D11-11/D11-12/D11-22/D11-26/D11-28/D11-43）

- D11-11: auth init 未显式询问 region（静默硬编码）
- D11-12: IAM 401 失败提示含英文裸串 "IAM rejected the credentials"
- D11-22: KooCLI 隐私协议指引缺中文说明和两条路径
- D11-26: 114 处工具/参数描述为纯英文，且含内部代号（S1/S2 等）
- D11-28: STS 到期提示缺中文「已过期」和唯一 action
- D11-43: NO_COLOR 未被尊重，COLUMNS=40 下关键标识被截断

### 3. 统一错误卡契约未实现（D11-16）

六种错误码未统一为 `{code, messageZh, action}` 格式：
- IAM-401 返回 code=HDKIT_CRED_INVALID（应为 IAM-401）
- IAM-403 返回 code=HDKIT_CRED_FORBIDDEN（应为 IAM-403）
- KooCLI-未装 和 project-id-未设 无错误卡（code=null）
- 六码 action 仅 4/6 有值，不互不相同

### 4. 切换语义未显式化（D11-8/D11-9）

- temporary 切换未返回 `persistsAfterRestart=false`、`affects.hcloud=false`
- persist 后未标记 `S1.configuredBySession=true`
- clear 后未返回 `effective.source=s1` 回退结论
- 切换后无「已生效，无需重启会话」提示（D11-29）

### 5. 审批拦截指引未实现（D11-19）

未审批写命令被拦截时，无 permissionDecision=deny、无中文拦截理由、无两点可执行指引（plan + run_approved 工具名）。

### 6. 只读结果摘要未实现（D11-27）

只读结果未返回中文字段摘要（资源标识/名称/状态映射），长输出无截断/分页提示。

### 7. 非交互引导英文残留（D11-2）

非交互会话提示文本仍含英文整句。

## BLOCKED 用例

### D11-42 编码契约（BLOCKED - 环境问题）

Windows 环境下子进程无输出（exit=0 但无 sentinel），夹具自身异常。非产品缺口，属 Windows 环境兼容性问题。

## 复现命令

```bash
# 准备环境
cd ~/devkit-test/testbot4-win-Opencode/huaweicloud-devkit-test
git pull --rebase origin main

# 安装被测包
npm install -g huaweicloud-devkit@next --registry https://registry.npmjs.org

# 导出真云凭证
export HW_ACCESS_KEY=<your-ak>
export HW_SECRET_KEY=<your-sk>
export HW_REGION=cn-north-4

# 运行 UX 夹具全集
HDK_SRC=$(npm root -g)/huaweicloud-devkit/plugins/huaweicloud-core/src
node eval/harness/fixtures/run-ux.mjs "$HDK_SRC" \
  --evid results/testbot4-win-Opencode/2026-10-15-192.168.0.208/ux-真机/evidence \
  --json results/testbot4-win-Opencode/2026-10-15-192.168.0.208/ux-真机/UX专项-2026-10-15.json

# D11-34 真建真删归零
hcloud EIP CreatePublicip --bandwidth.share_type=PER --bandwidth.size=1 --bandwidth.charge_mode=traffic --bandwidth.name=test-bw --publicip.type=5_bgp --cli-region=cn-north-4
hcloud EIP ListPublicips/v2 --cli-region=cn-north-4
hcloud EIP DeletePublicip --publicip_id=<eip-id> --cli-region=cn-north-4
hcloud EIP ListPublicips/v2 --cli-region=cn-north-4
```

## 证据路径

- UX 专项 JSON: `results/testbot4-win-Opencode/2026-10-15-192.168.0.208/ux-真机/UX专项-2026-10-15.json`
- 逐夹具证据: `results/testbot4-win-Opencode/2026-10-15-192.168.0.208/ux-真机/evidence/`
- stdout 日志: `results/testbot4-win-Opencode/2026-10-15-192.168.0.208/ux-真机/stdout.log`
- D11-34 真机归零证据: `results/testbot4-win-Opencode/2026-10-15-192.168.0.208/ux-真机/evidence/D11-34-real-eip/`
