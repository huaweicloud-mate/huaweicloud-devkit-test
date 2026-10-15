# UX 真机专项 FINDINGS — testbot4-win-Opencode

**测试日期**: 2026-10-15  
**测试机**: testbot4-win-Opencode (IP: 119.8.181.45)  
**被测包**: huaweicloud-devkit@1.1.9-next.0  
**区域**: cn-north-4  

## 执行汇总

| 指标 | 数量 |
|------|------|
| 执行夹具总数 | 41 |
| PASS | 4 |
| 需求未实现 (NOT_IMPLEMENTED) | 35 |
| BLOCKED (环境不可判定) | 2 |
| HARNESS_ERROR | 0 |

## PASS 列表
- D11-1: onboarding 首次触达引导（中文 message + steps 含 obtain-aksk）
- D11-37: 引导闭环有效性（无凭证→按引导登录→症状消失）
- D11-41: 误导性归因防护（占位符遮蔽 / STS 过期 / KooCLI 归因分类）
- D11-44: 故障注入下有界性与归因正确性（网络不可达 / HTTP 429/404/401）

## BLOCKED 列表（含原因）
- **D11-35** (沙箱连不通排障): 需沙箱环境 + devbridge 通道。夹具探针 `huaweicloud_sandbox_check_user` 在隔离 HOME 下无凭证，返回"未配置华为云凭证"。本机无沙箱/devbridge 通道，无法满足前置条件。
- **D11-42** (编码契约): 子进程无输出 (exit=0 但无 stdout)，夹具自身异常。非产品缺口，环境/编码相关。

## 本批专项重点用例结果

### D11-13 登录后自检五项 — NOT_IMPLEMENTED
- **自检五项**: 仅 1/5 ready (KooCLI 版本 ok)，凭据/OBS/project-id/MCP 注册均 false
- **原因**: 运行器隔离 HOME 后不读 ~/.config 的 S1 凭证，`getAuthStatus()` 在空 HOME 下无法检测到已配置的凭据。即便提供了 HW_ACCESS_KEY/HW_SECRET_KEY env 变量，`getAuthStatus()` 仍返回 credentialsConfigured=false
- **体检摘要**: 无 selfCheck 字段，未实现中文体检摘要
- **nextStep**: kooCliNextStep="huaweicloud_show_profile_redacted"（非空，仍在催促）
- **结论**: 体检摘要功能未实现（effective.source/fingerprint 字段缺失，自检五项不读取 env 凭证）

### D11-34 资源归零 — NOT_IMPLEMENTED (E2E 归零成功)
- **只读复核**: 3/3 成功 (ECS/EIP/EVS 三类列表均可执行)
- **归零报告**: 未实现。工具返回裸 JSON，无中文"已释放/未释放/剩余计数"报告格式
- **归零结论**: 未实现。无"无残留/已归零"中文结论
- **补删命令**: 未实现。无补删命令提示
- **E2E 真机归零**: PASS — 手动创建→列表核验→删除→复核为空全流程成功，证据见 `evidence/D11-34-真机-e2e/`
  - 创建 EIP fdfe3fc7-1e9e-4484-9779-64557bdb7a11 (123.249.16.246, 1Mbit/s traffic 按需)
  - 删除后复核：EIP 已不在列表，原有 EIP 未受影响，无残留

### D11-38 独立观测双轨 — NOT_IMPLEMENTED
- **自述轨**: effective.fingerprint = null, effective.source = null（未实现）
- **独立文件/env 轨**: 反推指纹 = caae65f2（正确，与 S1 指纹一致）
- **独立连通轨**: 只读调用 ECS ListServersDetails 成功，返回 servers 列表（连通成功）
- **三轨一致**: 失败 — 自述轨为 null，无法与独立轨匹配
- **结论**: effective.source/fingerprint 字段未实现，导致自述轨缺失。独立观测面（文件反推 + 连通）均可正常工作

### D11-24 码道沙箱阻断 KooCLI — NOT_IMPLEMENTED
- **码道环境探测**: 成功（检测到 ~/.codeartsdoer / ~/.codeartswork / CODEARTS_CLI_AK/SK）
- **check_cli 输出**: KooCLI 正常运行 (installed=true, status=ok, version=7.2.12)
- **缺失**: 无中文"码道沙箱模式阻止 KooCLI 运行"说明，无恢复路径指引
- **原因**: 本机码道环境下 KooCLI 实际可正常运行（未被沙箱阻断），插件未检测到沙箱限制场景或未实现阻断检测逻辑

### D11-35 沙箱连不通排障 — BLOCKED
- **原因**: 需沙箱环境 + devbridge 通道。夹具探针在隔离 HOME 下无凭证，无法触发沙箱连接路径
- **建议**: 由具备 devbridge 通道的客户端真机执行

## 缺陷汇总

以上 NOT_IMPLEMENTED 项均为「需求未实现」（插件 UX 功能缺口），非测试环境问题。主要缺口集中在：

1. **effective.source/fingerprint 字段未实现** (D11-3/4/5/6/7/8/9/30/38): auth_status 缺少 effective 三元组 (source/fingerprint/region)，导致自述轨、状态机、冲突态、独立观测等多个用例 FAIL
2. **中文体检摘要未实现** (D11-13/14): getAuthStatus 无 selfCheck 体检摘要字段
3. **归零报告未实现** (D11-34): 只读调用返回裸 JSON，无中文归零报告格式
4. **提示文案未中文化** (D11-10/11/12/16/19/20/21/22/23/24/25/26/27/28/31/32/33): 多处英文提示、错误码、能力清单未母语化
5. **路由命中率不达标** (D11-17/18): 中文口语路由命中率 5% (目标 85%)
6. **审批拦截/拒绝路径未实现** (D11-19/33): 无中文拦截理由、无两点指引、无"资源未发生变更"复核
