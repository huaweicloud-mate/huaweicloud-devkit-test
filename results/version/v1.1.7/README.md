# 迭代版本 v1.1.7

## 版本信息

- 稳定版本：`v1.1.7`（npm latest）
- 实际测试对象：`v1.1.7` @ commit `7456d059`（release-1.1.7，latest 正式版）
- 工具全集：—
- Node / npm / Python：—
- 测试类型：版本全量测试（母版全量 `init_day --full`），双 OS/单 OS 对照

## 执行归档（实质文件）

| OS | 归档目录 | 测试报告 | 执行结果 CSV | 缺陷清单 |
|---|---|---|---|---|
| Windows | `results/version/v1.1.7/Windows/` | `OpenCode-glm-5.2-v1.1.7-测试报告.md` | 设计级/展开级/追踪表 3 CSV | `FINDINGS.md` + `HISTORY_LINKS.md` |

## 执行状态

- 设计级：PASS 192 / FAIL 8 / SPEC-MISMATCH 1 / NOT_RUN 6
- 展开级：PASS 28 / FAIL 11 / NOT_RUN 6
- 通过率（分母=PASS+FAIL+SPEC，不含 NOT_RUN）：91.7%

## 缺陷（均经 file_issue.py 查重，见 HISTORY_LINKS.md）

| 用例 | 级别 | 缺陷 |
|---|---|---|
| — | D4-16 P0 | sh -c 包装器绕过未拦截 |
| — | D4-27 P1 | JSON 凭证双路径脱敏不完整 |
| — | D9-2 P1 | JSON-RPC invalid params 错误码未正确返回 |
| — | D9-9 SPEC-MISMATCH | notifications.cancellation 未声明 |
| — | EXP-E01~E14 P1 | service_catalog 路由准确率低 21.4% |
| — | D3-C1/C2 P1 | 真云 ECS/OBS E2E 认证失败 |
| — | D3-C3/C6 P1 | 沙箱 E2E 连接失败 |
| — | D3-C7 P1 | list_regions 返回 undefined |

## 历史关联单

- #814, #809, #797, #791, #761, #752, #730, #699, #694, #692, #689, #683, #682, #681, #679

## 其他客户端

- 待其余客户端补齐该版本全量后由维护者汇总合并。
