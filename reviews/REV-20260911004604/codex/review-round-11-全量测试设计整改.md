# 全量测试设计整改评审 Round-11

> 评审对象：`REV-20260911004604` Hermes Round-11
> 评审日期：2026-09-11
> 评审结论：`REVIEW_CHANGES_REQUESTED`

## 一、门禁实测

已在仓库根目录执行：

```text
python test-cases/design/verify_new.py
=> 23/23 PASS，exit 0

python test-cases/design/scan_gaps.py
=> [GATE-PASS] 展开规则 0 空
=> [GATE-PASS] 36 工具全部有覆盖
```

门禁执行结果符合本轮要求，但不能单独替代闭环放行门槛。当前门禁主要验证结构、字段、枚举、外键和工具命中；它没有把所有环境阻断、规格裁决和契约语义唯一性判定为可放行条件。

## 二、九类检查

### 1. 需求覆盖与追踪

部分通过。设计级 162 行、展开级 132 行、追踪表 168 行；追踪表实际为 10 列，列名稳定；`designCaseId` 外键校验通过，状态值统一为 `UNASSESSED/PASS/FAIL/BLOCKED/SPEC-MISMATCH/NOT_RUN`，专项 gap 有显式结论。

但追踪表中的 132 条设计基线仍为 `UNASSESSED`，且当前门禁没有验证追踪表状态与展开级 `status` 的逐项映射，也没有验证每个 `expandedCaseId` 外键和需求源资产的完整闭环。因此只能判为结构合格，不能判为执行闭环完成。

### 2. 测试层次

部分通过。COMMON、CLIENT_MATRIX、OS_MATRIX、AGENT_E2E、CROSS_PROCESS 已写入展开规则，真实客户端、OS、TTY、remote 和升级路径被单独列出。

但 Linux、macOS/ARM、CodeArtsSpace、PTY、remote session 仍未完成真实执行；D6-8、D9-9 仍主要依赖夹具/Inspector 证据入口，不能替代真实链路的放行证据。

### 3. 断言强度

不通过。9 条新增用例多数已增加错误码、字段、阈值和证据要求，但真源仍存在非唯一断言：

- D1-57：`EREPO_BAD_TARBALL（或自定义同码）`，不是唯一错误码。
- D3-C7：`Ecs.0021 或 message 含 region`、`Ecs.0200 或含 not found`，仍允许不同结果。
- D3-C8：`Ecs.0038 或 message 含 enterprise_project_id`，仍允许消息替代错误码。
- D3-C9：不存在/删除竞态仍使用错误码或消息二选一；预期结果也保留错误码枚举替代路径。
- D9-9：错误码已固定为 `-32000`，但 message 仍为“含 timeout”，取消能力按规格条件分支，尚未形成最终唯一契约。

D2-21、D4-24、D6-8 的算法、字段、窗口和内存阈值已明显增强；D6-8 的 `25~35s`、`ETIMEDOUT`、`<50MB` 可判定，但仍需在实际执行时留存对应证据。

### 4. 负向路径与恢复

部分通过。安装中断、坏包、凭证轮换、区域/项目/资源状态、令牌过期/重放、工具超时/恢复、协议取消均已有设计入口。

未通过放行的原因是关键路径仍有未执行状态：D1-39 为 P0 `FAIL`；Linux 补跑、macOS/ARM、CodeArtsSpace、TTY、remote session 仍为 `BLOCKED/NOT_RUN`；D1-57 的自动回滚语义尚无真实发布线证据。

### 5. 安全与兼容

部分通过。一次性 IAM 凭证、`tctest-` 标签、清理 owner、SIM 冻结级别、代表客户端和 OS 维度均已写入设计或追踪字段。

仍缺真实多终端证据：第二个 Hook 客户端 CodeArtsSpace 未验证，macOS/ARM 未验证，Windows P0 缺陷未修复；因此不能宣称兼容性和安全隔离已闭环。

### 6. 环境隔离

设计字段已补齐，尚未闭环。D3-C7/C8 的真云资源清理要求、D2-21 的一次性凭证、D3-C9 的 SIM 级冻结 fixture、D4-24 的可注入时钟均有说明；但当前目录中没有相应真实执行证据、清理清单或运行 manifest 可供本轮放行核对。

### 7. 可复现性

部分通过。`gen_matrix.py`、`gen_tracing.py` 可重生成固定行数和列结构，CSV 编码和字段已稳定；两个门禁实际可执行并能在失败条件下退出非零（`verify_new.py` 对失败项 `sys.exit(1)`，`scan_gaps.py` 对空规则或工具缺口 `sys.exit(1)`）。

但生成脚本重建的是设计/追踪数据，不会产生真实执行证据；门禁也未覆盖完整证据路径、展开级外键和环境状态闭环，故可复现性只能判为设计数据层通过。

### 8. 多终端覆盖

不通过。当前 NR3 状态为：`PASS 13 / BLOCKED 9 / FAIL 1 / SPEC-MISMATCH 1 / NOT_RUN 1`。未闭合项包括：

- `EXP-NR3-09`：Windows D1-39 P0 `FAIL`。
- `EXP-NR3-02/04/06/08/24`：Linux 探针尚未补跑。
- `EXP-NR3-11`：macOS/ARM `BLOCKED`。
- `EXP-NR3-15b`：CodeArtsSpace `BLOCKED`。
- `EXP-NR3-16`：Linux 升级链 `BLOCKED`。
- `EXP-NR3-19`：remote 双请求为 `SPEC-MISMATCH`。
- `EXP-NR3-20`：remote session 为 `NOT_RUN`。
- `EXP-NR3-21`：真实 TTY/PTY 为 `BLOCKED`。

### 9. 统计口径与状态

部分通过。展开级状态列独立存在，BLOCKED/NOT_RUN 的 `blockedReason` 和 `requiredEvidence` 已补齐，PASS/FAIL/SPEC-MISMATCH 也有 `requiredEvidence`；追踪表状态枚举统一。

但状态仍明确表示未闭环事实，不能把门禁 PASS 或字段齐全解释为测试设计已完成。尤其 `SPEC-MISMATCH`、`FAIL`、`BLOCKED`、`NOT_RUN` 仍存在，符合规范的审计记录要求，但不满足放行条件。

## 三、对 Round-10 六项整改逐项结论

1. **追踪表：部分闭合。** 10 列、统一状态、设计级外键和 gap 结论已落实；仍需补强展开级外键、设计到展开到证据的机器化一致性，以及 132 条 `UNASSESSED` 的后续证据闭环。
2. **9 条契约：部分闭合。** D2-21、D4-24、D6-8 的固定字段/算法/阈值明显改善；D1-57、D3-C7、D3-C8、D3-C9 仍保留“或/同码/message 含/二选一”，D9-9 仍有条件化取消语义，未达到 Round-10 要求的唯一机器判定契约。
3. **四段展开规则：结构闭合。** 当前 162/162 均可按 4 段切分，枚举首段均在五枚举集合内，代表/证据/阻塞段存在；`verify_new.py` 实测通过。需注意脚本对标签的校验较宽，允许 `<代表2:>`、`<真云代表:>` 等变体，并非严格限定为规范要求的 `<代表: ...>`。
4. **状态模型：部分闭合。** 12 列展开级矩阵、独立状态列及 BLOCKED/NOT_RUN `requiredEvidence` 已补齐，门禁实测通过；但未闭合状态本身仍然存在，且追踪表与展开级逐项状态一致性尚未被门禁强制验证。
5. **门禁与工具全名：结构闭合，放行未闭合。** `verify_new.py` 23/23、exit 0；`scan_gaps.py` 为 `GATE-PASS`；关联工具列中的认证初始化工具使用 `huaweicloud_auth_init`，未发现以 `auth_init` 作为独立关联工具的简称兜底。门禁具备对其已覆盖条件的阻断能力，但没有阻断契约模糊断言、环境状态和规格状态，因此不能据此放行。
6. **隔离方案：设计闭合，证据未闭合。** 一次性凭证、`tctest-` 标签、清理 owner、SIM 冻结级别已落字段；仍需真实执行记录、清理结果、凭证轮换/失效证据和夹具 manifest。

## 四、剩余必须闭合项

- 修复并回归验证 D1-39 / `EXP-NR3-09` 的 Windows P0 #554。
- 完成 Linux D1-27/42/46/53/45 探针补跑并归档 stdout/stderr/exit/manifest。
- 提供 macOS/ARM、CodeArtsSpace、真实 TTY/PTY 的执行证据，或正式撤销对应支持承诺。
- 对 remote session 和 `hintConsumed` 完成产品/规格裁决，不能保留 `SPEC-MISMATCH`/`NOT_RUN` 作为放行状态。
- 将 D1-57、D3-C7、D3-C8、D3-C9、D9-9 的允许结果收敛为唯一结构化断言，删除“或自定义同码”“或 message 含”“二选一”等替代路径；若确需多结果，必须拆成独立契约和独立状态。
- 增强追踪门禁：校验 `expandedCaseId` 外键、设计级到展开级映射、追踪表与展开级状态逐项一致性及证据字段完整性。
- 完成 ITER-005/P2 白名单项的最终 `OBSOLETE` 或 D1-58 回填，避免长期保留待回填结论。

## 五、最终结论

```text
REVIEW_CHANGES_REQUESTED
```

依据闭环规范，当前存在 P0 `FAIL`、环境类 `BLOCKED/NOT_RUN`、规格类 `SPEC-MISMATCH`，且契约仍有非唯一断言；因此本轮不得输出 `TEST_DESIGN_READY`。
