# UX 真机专项（第 2 批：环境门控用例）FINDINGS

**执行日期**: 2026-10-15  
**客户端**: testbot5-win-CodeArtsIDE  
**机器 IP**: 192.168.1.56  
**被测包**: huaweicloud-devkit@1.1.9-next.0  
**KooCLI**: 7.2.12（可用）  
**环境**: 码道（CodeArts IDE），`~/.codeartsdoer` + `~/.codeartswork` + `CODEARTS_CLI_AK/SK` 均存在

---

## 夹具全集汇总

| 指标 | 数量 |
|------|------|
| 总夹具数 | 41 |
| PASS | 4 |
| NOT_IMPLEMENTED | 35 |
| BLOCKED | 2 |
| HARNESS_ERROR | 0 |

PASS: D11-1, D11-37, D11-41, D11-44  
BLOCKED: D11-35（需沙箱/devbridge 通道）, D11-42（编码契约，环境不满足）

---

## 本批重点用例详查

### D11-13 登录后自检五项 — NOT_IMPLEMENTED

**断言结果**: pass=1 fail=3

| 断言 | 结果 | 说明 |
|------|------|------|
| D11-13-five-ready | FAIL | 自检五项仅 1/5 ready（KooCLI 版本=true，凭证/OBS/project-id/MCP注册=false） |
| D11-13-summary-zh | FAIL | 未返回中文体概要（逐项中文 + 状态） |
| D11-13-nextstep-empty | FAIL | 未就绪项 nextStep 非空（kooCliNextStep=huaweicloud_show_profile_redacted） |
| D11-13-no-codename | PASS | 体概要不含内部代号 |

**真机发现**: 自检五项中仅 KooCLI 版本就绪，其余四项（凭证、OBS、project-id、MCP 注册）均未就绪且无中文逐项概要。需求 UX-R3 未实现。

### D11-24 码道沙箱阻断 KooCLI — NOT_IMPLEMENTED

**断言结果**: pass=1 fail=2

| 断言 | 结果 | 说明 |
|------|------|------|
| D11-24-sandbox-block-zh | FAIL | 输出未含中文「码道沙箱模式阻止 KooCLI 运行」说明 |
| D11-24-recovery-path | FAIL | 未给出可执行恢复路径 |
| D11-24-actionable | PASS | 恢复路径唯一且可执行（非纯说明性文字） |

**真机发现**: 本机确认为码道环境（`~/.codeartsdoer` + `~/.codeartswork` + `CODEARTS_CLI_AK/SK`），但 `huaweicloud_check_cli` 返回 KooCLI 已安装且正常（status=ok, version=7.2.12），未检测到沙箱阻断场景，也未输出中文阻断说明与恢复路径。需求 UX-R13「码道沙箱阻断 KooCLI 的指引」未实现。

**复现命令**:
```
node eval/harness/fixtures/d11-24-codearts-sandbox-koocli.mjs <hdk-src> --evid <evid-dir>
```

### D11-34 资源归零 — NOT_IMPLEMENTED

**断言结果**: pass=1 fail=3

| 断言 | 结果 | 说明 |
|------|------|------|
| D11-34-readonly-recheck | PASS | 真机只读复核可执行（ECS/EIP/EVS 三类列表 3/3） |
| D11-34-report-zh | FAIL | 归零报告未含中文且逐项列出（已释放/未释放 + 剩余计数） |
| D11-34-zero-conclusion | FAIL | 零留时未给出显式中文结论（无残留 / 已归零） |
| D11-34-delete-hint | FAIL | 未释放项未附一补删命令 |

**真机归零验证（手动）**: 
- Before: EIP 列表 1 个（已存在 02fb8998-...）
- 创建测试 EIP: `hcloud EIP CreatePublicIp --cli-region=cn-north-4 --publicip.type=5_bgp --bandwidth.name=ux-test-bw --bandwidth.size=1 --bandwidth.share_type=PER` → ID=4ef69a4e-df00-4570-89f7-d556b326ec82, IP=123.249.16.246
- 列表核验: After create = 2 个，测试 EIP 在列 ✓
- 删除: `hcloud EIP DeletePublicIp --cli-region=cn-north-4 --publicip_id=4ef69a4e-...` → 成功
- 复核归零: After delete = 1 个（回到初始状态），测试 EIP 已消失，残留=0 ✓
- **归零结果: 残留 0，无费用泄漏**

证据路径: `evidence/D11-34/真机归零/`

### D11-35 沙箱连不通排障 — BLOCKED

**BLOCKED 原因**: 需沙箱环境与 devbridge 通道。本机为码道 IDE 环境，沙箱探针 `huaweicloud_sandbox_check_user` 未就绪（返回未配置凭证片段）。需由具备 devbridge 通道的客户端真机执行。

### D11-38 独立观测双轨（范式③：三轨一致） — NOT_IMPLEMENTED

**断言结果**: pass=1 fail=3

| 断言 | 结果 | 说明 |
|------|------|------|
| D11-38-self-report | FAIL | 自述轨未输出生效指纹与来源（effective.fingerprint 不存在） |
| D11-38-independent-match | FAIL | 独立观测（文件/env 反推）与自述指纹不一致（自述=null, 反推=abf7fe87） |
| D11-38-cross-track | PASS | 独立连通轨证实「已登录」为真（真实只读调用成功） |
| D11-38-three-track-consistent | FAIL | 三轨不一致（自述=null ≠ 反推=abf7fe87） |

**真机三轨验证**:
- 轨1 自述轨: `auth_status.reconciled.stores.s1Fingerprint` = abf7fe87, `currentFingerprint` = abf7fe87，但 `effective.fingerprint` 字段不存在
- 轨2 独立反推: sha256(AK+SK)[:8] = abf7fe87
- 轨3 真实只读: `hcloud ECS ListServersDetails --limit=1` → count=1, 可达=true
- **实质一致**: s1Fingerprint/currentFingerprint == 独立反推 == abf7fe87，且真实调用可达
- **缺口**: `effective.fingerprint` 与 `effective.source` 字段未暴露，自述轨不完整

证据路径: `evidence/D11-38/真机双轨/three-track-summary.txt`

---

## 缺陷单

### 缺陷 1: D11-24 码道沙箱阻断 KooCLI 指引未实现

- **用例**: D11-24
- **严重度**: P2
- **现象**: 码道环境下 `huaweicloud_check_cli` 返回 KooCLI 正常（status=ok），未检测沙箱阻断场景，无中文阻断说明与恢复路径
- **期望**: 输出含中文「码道沙箱模式阻止 KooCLI 运行」且给出可执行恢复路径（码道外终端安装 / 设置→对话流→智能体→终端命令运行模式→自动运行）
- **复现命令**: `node eval/harness/fixtures/d11-24-codearts-sandbox-koocli.mjs <hdk-src> --evid <evid-dir>`
- **证据路径**: `results/testbot5-win-CodeArtsIDE/2026-10-15-192.168.1.56/ux-真机/evidence/D11-24/`

### 缺陷 2: D11-38 effective.fingerprint 字段未暴露

- **用例**: D11-38
- **严重度**: P2
- **现象**: `auth_status` 返回中无 `effective.fingerprint` 和 `effective.source` 字段，指纹仅在 `reconciled.stores.s1Fingerprint` / `currentFingerprint` 中可用
- **期望**: `effective.fingerprint` 暴露生效指纹，`effective.source` 暴露来源，与独立反推和真实调用三轨一致
- **复现命令**: `node eval/harness/fixtures/d11-38-independent-observation.mjs <hdk-src> --evid <evid-dir>`
- **证据路径**: `results/testbot5-win-CodeArtsIDE/2026-10-15-192.168.1.56/ux-真机/evidence/D11-38/`

---

## 归零结果

D11-34 真机归零验证完成：
- 创建 1 个最小按需 EIP（5_bgp, PER, 1M）
- 列表核验通过（创建后 2 个，含测试 EIP）
- 删除成功
- 复核归零通过（删除后 1 个，回到初始状态，残留=0）
- **无残留资源，无费用泄漏**
