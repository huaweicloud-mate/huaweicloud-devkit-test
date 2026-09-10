# 版本升级提醒测试设计第四轮评审

> 评审时间：2026-09-10T19:00:00+08:00
> 评审者：Codex
> 评审对象：Hermes 第四轮修订
> 归档迭代：`ITER-004-20260910155945`
> 被测项目：`C:\Users\Administrator\devkit-test\hdk`
> 评审结论：`USER_DECISION_REQUIRED`

## 一、总体结论

Hermes 已经完成第三轮要求的文档、矩阵、展开级用例、D1-55 证据分级和
manifest 修订。当前测试设计包已经具备较好的交接质量，可以作为后续执行的
候选基线。

但按照仓库中已经固化的放行门槛，本轮仍不能签署
`TEST_DESIGN_READY`。原因是代表终端硬门槛仍未满足：

- Windows：已实际覆盖；
- 非 Hook 客户端 OpenCode：已实际覆盖；
- Linux：仍为 `BLOCKED`，没有真实运行证据；
- Hook 客户端：仍为 `BLOCKED`，没有真实客户端生命周期证据；
- Hermes Agent 会话：D1-54 仍为 `BLOCKED`；
- 真实 MCP session：remote transport 不支持 session，D1-55-session 为
  `BLOCKED(NOT_RUN)`。

当前已不是 Hermes 可以通过继续整理文档自行解决的问题，需要用户决定是否
接入 Linux/Hook 测试环境，或明确批准“带终端阻塞项进入受限执行”的范围豁免。
在没有该决定前，最终状态为 `USER_DECISION_REQUIRED`，不是
`TEST_DESIGN_READY`。

## 二、评审结果

### [P1] Linux 和 Hook 代表终端仍未实际覆盖

`hermes/candidate-matrix.csv` 和顶层 `terminal-matrix.csv` 已正确列出
Linux、Hook、macOS/ARM、TTY 等路径，并且未执行项都写了原因、影响和解除条件。
这是矩阵记录上的通过。

但状态并不等于证据：

- Linux 的 D1-39、D1-49、D1-52、D1-55 仍是 `BLOCKED`；
- Hook 客户端的 D1-52 仍是 `BLOCKED`；
- D1-54 Hermes 真实 Agent 会话仍是 `BLOCKED`；
- TTY 和真实 MCP session 仍未执行。

闭环文档的放行门槛明确要求至少有一个 Hook 客户端、一个非 Hook 客户端、
Windows 和 Linux 的实际覆盖。因此当前不能把矩阵中的 `BLOCKED` 行计作
覆盖完成。

请用户二选一：

1. 接入 Linux 测试机和测试专用 Hook/Hermes 实例，Hermes 按矩阵补跑并再次交接；
2. 明确批准本轮只作为“Windows + OpenCode 非 Hook 的受限执行基线”，并接受
   Linux、Hook、Hermes Agent、TTY 和真实 session 用例不纳入本轮执行放行。

第二种选择只能改变本轮范围，不代表这些路径已经通过，也不代表产品可以作
全终端发布验收。

### [P1] D1-55 的 session 验证已经正确降级，但仍需产品语义裁决

本轮扩展探针真实探测到 remote `initialize` 没有 `MCP-Session-Id`，并确认
remote 实现没有 session 状态绑定。Hermes 已将当前证据准确标为
`PROCESS_SHARED_STATE`，并新增 `D1-55-session` 的
`BLOCKED(NOT_RUN)` 行，没有伪造真实 session 通过。这一处理正确。

同时，D1-55b 已实锤：

- A 请求序列消费 `_updateInfo` 后，B 请求序列拿不到；
- `hintConsumed` 是模块级单例，按进程共享；
- 该行为与设计文档“会话中第一个 tool 调用附加”的表述冲突。

仍需产品/开发裁决以下二者之一：

- 将 `hintConsumed` 改为真正按 session 隔离，并在 remote 支持 session 后补测；
- 明确设计语义就是按 server 进程共享，并同步设计文档、矩阵预期和用户影响说明。

在裁决前，D1-55b 必须继续保持 `SPEC-MISMATCH`。

### [P2] 执行报告没有同步最新 manifest 的时间

最新 manifest 的实际执行时间为：

`2026-09-10T18:02:09+08:00` 至 `2026-09-10T18:03:52+08:00`

但执行报告 `NR3版本升级提醒-补充执行记录.md` 仍写：

`生成时间/更新时间：2026-09-10T17:20:00+08:00`

Hermes 设计交接和状态文件已经更新到 18:40。三者时间不一致，容易让后续
执行者误以为报告不是 manifest 对应的那一轮。

**要求：**

- 将执行报告更新为与 v2 manifest 一致的生成、更新时间；
- 明确报告对应的 runner 重跑时间；
- 所有时间继续使用 `YYYY-MM-DDTHH:mm:ss+08:00`。

### [P2] sandbox 运行产物当前不在归档目录

manifest 和文档引用：

`results/ITER-004-2026-09-10/evidence/nr3/.sandbox`

但当前目录中该 sandbox 不存在，包含的
`.sandbox/source-commit.json` 也无法直接读取。脚本和 manifest 已保留完整
commit，因此通过重新运行 `build-sandbox.mjs` 可以重建，这不影响当前脚本
结果的真实性判断；但现状会让复核者无法直接打开本轮实际执行产物。

**要求：**

- 要么保留本轮 sandbox 的结构化来源清单和 source commit 归档；
- 要么在归档规则中明确 sandbox 为临时产物，并在报告中写明“需按固定 commit
  重建”，同时保存重建校验值；
- 不要在文档中把不存在的 sandbox 路径表述为当前可直接访问的证据。

## 三、已确认通过的交接项

本轮以下内容可以作为后续执行基线：

- Hermes 正式交接文件已填写，状态保持 `HERMES_REVISION_READY`；
- 候选矩阵和顶层矩阵均为 38 行、16 列，内容一致；
- NR3 展开级矩阵已加入 24 行，保留历史 D5 的 70 行，总计 131 行；
- D1-49 已补齐并有原始 stdout/stderr/exit 证据；
- D1-55 已将当前能力准确降级为进程级共享状态；
- 真实 session 不可执行项已显式 `BLOCKED(NOT_RUN)`；
- 四个探针日志和 manifest 均存在，最新四个探针退出码均为 0；
- manifest 已使用带 `+08:00` 的北京时间表示，并从 sandbox source commit
  采集版本；
- `120/120 checks` 与设计级 `PASS 24 / SPEC-MISMATCH 4 / FAIL 1 /
  BLOCKED 1` 已分开统计；
- D1-39 的 Windows P0 FAIL、D1-29/D1-43c/D1-46g/D1-55b 的规格偏差、
  D1-54 的 Hermes Agent BLOCKED 均未被隐藏；
- `node --check` 已通过全部 NR3 证据脚本。

## 四、当前统计

### 设计级 D1-26~D1-55

| 分类 | 数量 |
|---|---:|
| PASS | 24 |
| SPEC-MISMATCH | 4 |
| FAIL | 1 |
| BLOCKED | 1 |
| UNASSESSED | 0 |

### 终端展开路径

| 分类 | 数量 |
|---|---:|
| PASS | 24 行 |
| SPEC-MISMATCH | 4 行 |
| FAIL | 1 行 |
| BLOCKED | 9 行 |

设计级结果与终端展开行不是同一分母，执行报告应继续分开表达。

## 五、当前状态和下一步

当前状态：`USER_DECISION_REQUIRED`

请用户确认以下一项后再继续：

1. **补环境方案**：提供 Linux 测试机、测试专用 Hook/Hermes 实例，Hermes
   补跑后由 Codex 复评；
2. **范围豁免方案**：明确批准本轮仅按 Windows + OpenCode 非 Hook 范围执行，
   并接受其余 BLOCKED 项单独留待后续迭代。

无论选择哪一项，以下事项都必须继续保留在执行结果中：

- D1-39 P0 FAIL；
- D1-29、D1-43c、D1-46g、D1-55b SPEC-MISMATCH；
- D1-54 BLOCKED；
- D1-55-session BLOCKED(NOT_RUN)；
- Linux、Hook、macOS/ARM、TTY 等未执行路径。
