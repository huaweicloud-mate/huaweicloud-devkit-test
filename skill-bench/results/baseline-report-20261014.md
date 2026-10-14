# huaweicloud-devkit 技能评测 · 首份基线报告（v1）

- 报告日期：2026-10-14
- 专项目录：`skill-bench/`（独立于每日测试流水线 `test-cases/`、`results/`，维护者侧技能评测专项）
- 数据采集 runid 前缀：`20261014040351`（T2/T3）、`20261014043933`（T1），均为 harness 生成的 UTC 时间戳

## 一、三指标基线

| 任务 | 期望技能 | 成功率 | token 中位（IN / OUT / TOT） | 步数中位 |
|---|---|---|---|---|
| T1 部署静态网站（OBS） | huawei-obs | 100% (3/3) | 219,830 / 10,167 / 228,741 | 21 |
| T2 查账户余额（BSS） | huawei-billing | 100% (3/3) | 68,281 / 1,857 / 70,138 | 8 |
| T3 配置安全组（VPC） | huawei-vpc | 100% (3/3) | 405,978 / 17,803 / 425,205 | 26 |

- **IN** = 模型输入 token（`prompt_tokens`，含每轮工具 schema + 上下文）｜**OUT** = 模型输出 token（`completion_tokens`）｜**TOT** = IN + OUT
- 上述 token / 步数均为 3 次采样的**中位数**

## 二、评测口径与方法

- **模型**：deepseek-v4-pro-0813（固定），temperature=0，每任务采样 3 次
- **环境**：opengw 网关模型 + devkit MCP **37 工具** + `retrieve_skill` 检索技能 —— 忠实复现「agent 用 devkit 插件」；不包 dsh（其 headless 输出为黑盒、拿不到 token/步数）
- **成功率**：独立 ground-truth verifier **真机回读**判定（非 agent 自报）
- **token**：该 run 模型 input/output 累计（成本折算待模型单价确认后追加）
- **步数**：工具调用次数
- **写任务**（T1/T3）真机创建 + 每 run 后归零

## 三、关键发现（「做深做准」的产出）

1. **input token 占比 95.5% ~ 97.4%，成本集中在「上传侧」**：每轮把 37 个工具的 `description/schema` + 全历史重发给模型（T1 96.1%、T2 97.4%、T3 95.5%）。降本落点 = 工具 schema 精简 / 描述压缩 / 上下文 compact，而非压缩 agent 输出。
2. **verifier 假阴性已修**：首跑 T1 现 1 次 FAIL，复验系评测机到 OBS 端点公网匿名 fetch 网络抖动（FAIL 桶 curl 实为 200、PASS 桶反而 000）。修正 verifier 为「匿名 HTTP 重试 3 次 + hcloud 认证通道 stat 兜底 + 区分 403=没设 public-read vs 网络不可判定」，重跑 3/3。
3. **安全 Hook 真实生效**：T3 中 agent 两次尝试 `0.0.0.0/0` 放行 80，被 devkit 安全 Hook `hwc-network-public-admin-port`（severity=deny）拦截，agent 主动收窄为 `10.0.0.0/8` 后成功。护栏在真实 agent 行为层生效。
4. **工具数为 37 非 40**：当前安装版（`.dsh/huaweicloud-plugins`）`tools/list` 实测 37 工具；规划文档「40 工具」为较早版本口径，基线以实测 37 为准。
5. **OBS 删桶语义坑**：obsutil `rm -r -f` 只删对象、删空桶需单独 `rm -f`；首版 cleanup「报 OK 但残留空桶」，已修正并终验归零。

## 四、归零确认

OBS 无 `devkit-bench` 残留、VPC 无 `devkit-bench` 安全组残留（终验通过）。

## 五、限制与下一步

- **范围**：本次为 L1 端到端任务层 3 个典型任务（覆盖 ~6 个服务技能 + 8 横向技能），**非 29 skill 全覆盖**（覆盖地图见 `coverage-map.md`）。
- **已补**：L2 覆盖地图（`coverage-map.md`）、L3 对照组初步（`baseline-bare-comparison-20261014.md`）。
- **待补**：① L1 任务集扩到 8~10 场景（T4~T10）② L2 轻量激活评测 11 技能落地 ③ L3 裸模型补 3 次采样 + 工具 schema 精简实验。

## 六、token 统计

首份基线 9 runs 总 token（IN=prompt 输入 / OUT=completion 输出）：

| 任务 | IN 合计 | OUT 合计 | total |
|---|---|---|---|
| T1 部署网站 | 689,107 | 31,572 | 720,679 |
| T2 查账单 | 204,751 | 5,864 | 210,615 |
| T3 配安全组 | 1,227,319 | 45,668 | 1,272,987 |
| **合计** | **2,121,177** | **83,104** | **2,204,281** |