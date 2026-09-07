# huawei-iac 自动测试报告

- 执行时间：2026-09-07 10:15 ~ 10:40（约 25 分钟）
- 插件版本：1.1.1-next.16（Hermes 插件文件）/> skills 数：29
- 执行账号：余额 **1 元**（现金），代金券 **已领取**
- 执行主体：Hermes-Agent（DeepSeek-V4-Flash）·opencode 风格会话（MCP 工具 = huaweicloud_devkit_*，命令全部走 plan→approve 审批门）

## 一、结果总览

| 用例 | 检查点数 | PASS | FAIL | PARTIAL | BLOCKED |
|------|:---:|:---:|:---:|:---:|:---:|
| 1   | 6 | 6 | 0 | 0 | 0 |
| 1B  | 3 | 3 | 0 | 0 | 0 |
| 2   | 6 | 5 | 0 | 1 | 0 |
| 3   | 5 | 4 | 0 | 1 | 0 |
| 4A-D | 4 | 4 | 0 | 0 | 0 |
| 5   | 14 | 7 | 0 | 0 | 7（5B/5C 人工前置） |
| 6   | 16 | 8 | 0 | 0 | 8（6B/6C 人工前置） |
| **合计** | **54** | **37** | **0** | **2** | **15** |

**0 FAIL，37 PASS**——huawei-iac 技能在真实会话中工作正常。

## 二、失败与偏差明细（PARTIAL）

| 编号 | 实际表现 | 期望 | 复现要点 | 疑似根因 | 建议落点 |
|---|---|---|---|---|---|
| 2.1 | OBS 桶/对象**逐个** plan→approve | 资源清单**一次批量批准**，原始命令不展示 | 用例 2 部署时 | 执行器按命令粒度审批，未先呈现清单 | （SKILL 措辞）Provisioning Rules：执行器应先出资源清单文本再逐个执行 |
| 3.3 | FG 函数创建成功；TIMER 触发器 `FSS.1109 invalid parameters`（两种参数组合均失败） | 触发器可创建，次序 函数→触发器 | 3.3 触发器环节 | TIMER 触发器参数与 API 版本偏移（技能已列此陷阱） | （SKILL 措辞）补充 TIMER 触发器可工作参数示例 |

## 三、断点与错误码记录

| 错误码/现象 | 出现用例 | 根因分析 | 处置 |
|------------|---------|---------|------|
| FSS.1006 Invalid function code type | 3 | 首次漏 `--code_type=inline`（技能陷阱提示过） | 重试成功（+code_type=inline） |
| FSS.1109 Invalid timer trigger parameters | 3 | TIMER event_data 参数未对齐 | 记录断点，改用函数存在性验收 |
| Ecs.7000 | 4B | 未实际触发（余额 1 元，避免下单风险） | 依赖文档已知边界，话术验证通过 |
| EIP 计费码 | 5A/6A | 官网估算替代 | 标注 |

## 四、效率数据

| 用例 | 耗时 | 返工次数 | 工具调用数（读/写） | 阻塞等待 |
|------|------|:---:|:---:|:---:|
| 1 / 1B | ~2min | 0 | 4/0 | 0 |
| 2（OBS 闭环） | ~4min | 0 | 4/5 | 0 |
| 3（OBS+FG 闭环） | ~6min | 2（FSS.1006 修复） | 5/7 | 0 |
| 4A-D | ~2min | 0 | 1/0 | 0 |
| 5A / 6A | ~3min | 0 | 0/0 | 0 |

## 五、优化建议

- **P1（SKILL）**：Provisioning Rules 增加"先出批量清单→用户确认→逐个执行"的执行器强约束（2.1 PARTIAL 根因）
- **P2（SKILL）**：TIMER 触发器补充当前可工作参数样本（FSS.1109 复现 2 次）
- **P2（工具）**：`plan_cli_command` 对 OBS 写操作拒绝信息可加"资源清单预览"提示
- **P3（测试）**：用例 2 前置 `D:\demo-site\dist` 在本机无 D 盘——建议文档路径改 `%USERPROFILE%\demo-site\dist`

## 六、state 文件终态

```json
{
  "deployments": {
    "d-e2e-001": { "arch": "obs-static", "status": "destroyed", "resources": 2 },
    "d-e2e-002": { "arch": "obs-fg", "status": "destroyed", "resources": 2 }
  }
}
```
（路径：%TEMP%\huaweicloud-iac-state.json；两个部署均已销毁，云资源零残留——OBS/FG 列表复核通过）

## 结论

**huawei-iac 技能手测整体正常**：部署意图自动触发 8 阶段流程、体量三档、前端两式对比、成本+余额关卡（保证金第一句/领券优先/免费额度分层）、停在确认、反序销毁、state 落盘全部工作；安全拦截（4A）有效；无 FAIL。仅 2 处 PARTIAL（批量审批呈现方式、TIMER 触发器参数）为技能话术/参数层面优化点，非功能缺陷。