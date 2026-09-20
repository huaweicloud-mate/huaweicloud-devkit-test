# D10-3: 路由准确率 + 混淆矩阵

## 结果: PASS ✅ (harness成功运行并产出结果)

## 评测概要

| 指标 | 值 |
| --- | --- |
| 评测集 | eval-set-v1.csv |
| 总用例 | 15 |
| HIT | 3 |
| MISS | 11 |
| N/A | 1 |
| **准确率** | **21.4%** (分母=HIT+MISS=14) |
| 宏精确率 | NaN% |
| 宏召回率 | 15.4% |

## 逐条结果

| ID | 期望路由 | 实际路由 | 判定 |
| --- | --- | --- | --- |
| EXP-E01 | ECS | Run hcloud --help to list available services. | MISS |
| EXP-E02 | ECS | Run hcloud --help to list available services. | MISS |
| EXP-E03 | OBS | Sandbox+DevStation | MISS |
| EXP-E04 | EIP | Run hcloud --help to list available services. | MISS |
| EXP-E05 | RDS | Run hcloud --help to list available services. | MISS |
| EXP-E06 | DCS | DDS+DCS | HIT |
| EXP-E07 | CBR | Run hcloud --help to list available services. | MISS |
| EXP-E08 | (诊断) | Run hcloud --help to list available services. | N/A |
| EXP-E09 | CCE | CCE+SWR | HIT |
| EXP-E10 | FunctionGraph | Run hcloud --help to list available services. | MISS |
| EXP-E11 | BSS | Run hcloud --help to list available services. | MISS |
| EXP-E12 | CES | Run hcloud --help to list available services. | MISS |
| EXP-E13 | ELB | Run hcloud --help to list available services. | MISS |
| EXP-E14 | IAM | Run hcloud --help to list available services. | MISS |
| EXP-E15 | Incentive Voucher | Incentive Voucher | HIT |

## 混淆矩阵

| 期望 \ 实际 | CCE | DCS | DDS | DevStation | Incentive Voucher | Run hcloud --help to list available services. | SWR | Sandbox |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ECS |  |  |  |  |  | 2 |  |  |
| OBS |  |  |  | 1 |  |  |  | 1 |
| EIP |  |  |  |  |  | 1 |  |  |
| RDS |  |  |  |  |  | 1 |  |  |
| DCS |  | 1 | 1 |  |  |  |  |  |
| CBR |  |  |  |  |  | 1 |  |  |
| CCE | 1 |  |  |  |  |  | 1 |  |
| FunctionGraph |  |  |  |  |  | 1 |  |  |
| BSS |  |  |  |  |  | 1 |  |  |
| CES |  |  |  |  |  | 1 |  |  |
| ELB |  |  |  |  |  | 1 |  |  |
| IAM |  |  |  |  |  | 1 |  |  |
| Incentive Voucher |  |  |  |  | 1 |  |  |  |


## 每服务精确率/召回率

| 服务 | TP | FN | FP | 精确率 | 召回率 |
| --- | --- | --- | --- | --- | --- |
| ECS | 0 | 2 | 0 | N/A | 0.0% |
| OBS | 0 | 2 | 0 | N/A | 0.0% |
| EIP | 0 | 1 | 0 | N/A | 0.0% |
| RDS | 0 | 1 | 0 | N/A | 0.0% |
| DCS | 1 | 1 | 0 | 100.0% | 50.0% |
| CBR | 0 | 1 | 0 | N/A | 0.0% |
| CCE | 1 | 1 | 0 | 100.0% | 50.0% |
| FunctionGraph | 0 | 1 | 0 | N/A | 0.0% |
| BSS | 0 | 1 | 0 | N/A | 0.0% |
| CES | 0 | 1 | 0 | N/A | 0.0% |
| ELB | 0 | 1 | 0 | N/A | 0.0% |
| IAM | 0 | 1 | 0 | N/A | 0.0% |
| Incentive Voucher | 1 | 0 | 0 | 100.0% | 100.0% |

## 结论

Eval harness成功运行，产出路由准确率 21.4% (HIT=3, MISS=11, N/A=1)。
混淆矩阵和每服务精确率/召回率已落盘。
准确率较低的主要原因是多数查询返回 "Run hcloud --help" 而非具体服务名，
表明 service_catalog 工具在缺少 KooCLI 时回退到通用提示而非服务匹配。
