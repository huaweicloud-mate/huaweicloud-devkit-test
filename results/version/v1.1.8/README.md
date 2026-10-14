# 迭代版本 v1.1.8

## 版本信息

- 稳定版本：`v1.1.8`（npm latest）
- 实际测试对象：`v1.1.8` @ commit ``（latest 正式版）
- 工具全集：—
- Node / npm / Python：| Node v22.13.0 / npm 10 / Python 3.12.3 |
- 测试类型：版本全量测试（母版全量 `init_day --full`），双 OS/单 OS 对照

## 执行归档（实质文件）

| OS | 归档目录 | 测试报告 | 执行结果 CSV | 缺陷清单 |
|---|---|---|---|---|
| Linux | `results/version/v1.1.8/Linux/` | `Hermes-DeepSeek-V4-Pro-v1.1.8-测试报告.md` | 设计级/展开级/追踪表 3 CSV | `FINDINGS.md` + `HISTORY_LINKS.md` |

## 执行状态

- 设计级：PASS 173 / FAIL 19 / SPEC-MISMATCH 2 / BLOCKED 13 / NOT_RUN 5
- 展开级：PASS 55 / FAIL 1 / NOT_RUN 1
- 通过率（分母=PASS+FAIL+SPEC，不含 NOT_RUN）：91.2%

## 缺陷（均经 file_issue.py 查重，见 HISTORY_LINKS.md）

| 用例 | 级别 | 缺陷 |
|---|---|---|
| D9-12 | P0 | D9-12 initialize 握手协议安全基线——tools/list 无 initialize 前置状态机，非法时 |
| D2-4,D4-26 | P0 | D2-4/D4-26 凭证脱敏缺口——redactString 大小写敏感，小写 ak/sk 与 --password  |
| D4-4 | P1 | D4-4 写操作审批门——Change* 高危写操作判 allow 且 isWrite=undefined |
| D9-2 | P1 | D9-2 JSON-RPC 错误码——invalid params 未返回 -32602 |
| D10-3,D3-S1,D3-S5,EXP-E01 | P1 | D10-3 / EXP-E01 / D3-S1 / D3-S5 服务目录路由——中文意图 MISS |
| D3-C1 | P1 | D3-C1 真云 E2E——异步资源删除归零不可靠（ECS/VPC 泄漏） |
| D9-9 | P1 | D9-9 tools/call 超时协议语义与取消——capabilities.cancellation 未声明（SPE |
| D3-C7 | P1 | D3-C7 跨区域资源操作引导——不存在资源错误码不精确 |
| D4-25 | P2 | D4-25 安全钩子——Python hook 写操作正则漏匹配 + 遥测路径错位 |
| D1-65,D1-66 | P2 | D1-65/D1-66 环境变量契约漂移——DEBUG=1 与 TELEMETRY=off 不生效 |
| D8-9 | P2 | D8-9 安装 ID 与遥测值脱敏——sanitizeValue 未做凭证脱敏（SPEC-MISMATCH） |
| D1-60 | P2 | D1-60 HTTP 查询路径与自定义 registry——慢响应超时未按边界收敛 |
| D1-68,D3-C14 | 非产品缺陷 | D1-68/D3-C14 探针凭证注入缺失（测试侧） |
| D3-C2 | 非产品缺陷 | D3-C2 OBS建桶检测误报（测试侧） |
| D3-C3 | 非产品缺陷 | D3-C3 sandbox_deploy_nginx 响应契约（产品侧轻微） |
| D3-S3 | 非产品缺陷 | D3-S3 沙箱端口耗尽（环境） |

## 历史关联单

- #900, #896, #875, #868, #866, #864, #858, #857, #852, #845, #844, #841, #828, #826, #817

## 其他客户端

- 待其余客户端补齐该版本全量后由维护者汇总合并。
