# ITER-002-2026-09-08 RDS 高价值资源真云 E2E——全链路真实创建/操作/销毁

## 结论：**RDS MySQL 真云 E2E 全通 ✅（创建→ACTIVE→建库→查询→销毁全链路真实执行），资源已 100% 归零，成本极低（postPaid 分钟级）**

> 2026-09-09 00:30~01:00 执行（跨夜，按真实执行日归档至 ITER-002-2026-09-08 补充节）。真云实测为权威（用户偏好：能真机真云就走真机）。

## E2E 全链路实录

### 第 1 阶段：基础设施准备
| 资源 | 值 | 说明 |
|---|---|---|
| VPC | `rds-e2e-vpc-20260909` / `e4c95f2b-...` (192.168.0.0/16) | 创建成功（账号原无 VPC） |
| 子网 | `rds-e2e-subnet-20260909` / `160cbdfe-...` (192.168.1.0/24, cn-north-4a) | 创建成功 |
| 安全组 | 复用账号 default `88658db8-...` | 不新建（最小化变动） |

### 第 2 阶段：RDS 实例创建（核心）
| 项 | 值 |
|---|---|
| 规格 | `rds.mysql.n1.large.2`（2 vCPU / 4 GB，单机版，cn-north-4a 在售） |
| 引擎 | MySQL 5.7.44（8.0 需权限，5.7 通用） |
| 存储 | CLOUDSSD 40GB |
| 计费 | **postPaid**（按需分钟级） |
| 实例 ID | `8e65a03236ae4ccbb2cb173d127b43dain01` |
| 状态流转 | BUILD → **ACTIVE（~4.5 分钟，16:31:43→16:36:08 UTC）** |
| 内网 IP | 192.168.1.197 |

### 第 3 阶段：数据库操作（只读+写）
- **CreateDatabase** `e2etestdb`（utf8mb4）→ `{"resp":"successful"}` ✅
- **ListDatabases** → `total_count: 1`，返回 `{"name":"e2etestdb","character_set":"utf8mb4"}` ✅

### 第 4 阶段：销毁 + 复核归零（红线合规）
- DeleteInstance → job_id 确认 → ListInstances 实例数 **0**（删除极快，<30s）✅
- DeleteSubnet 首次报 `VPC.0209 subnet still used`（RDS 网卡释放延迟）→ 轮询 3 轮（~90s）后删除成功（中途 `VPC.0208 used by private IP` → 最终空响应=成功）✅
- DeleteVpc → `VPC.0104 Router contains subnets`（子网未删时）→ 子网删后重试 → **成功** ✅
- **最终全量复核：RDS 0 / VPC 0 / Subnet 0** ✅

## KooCLI RDS 实操要点（排坑记录，可复用）

1. **ListFlavors 超时**：全量查询响应大（152KB+）易超时（readTimeout=10s 默认）。绕法：`--spec_code=xxx` 过滤单规格查询，或输出到文件再解析（成功 152KB）
2. **CreateInstance 参数**：
   - `--password` 与 KooCLI 系统参数同名 → **必须用 `--cli-jsonInput=jsonFile`**，文件格式为 `{"body": {...}}`（裸 body 格式报错）
   - 必填：`name/datastore.type/datastore.version/flavor_ref/vpc_id/subnet_id/security_group_id/volume.type/volume.size/region/availability_zone/password`
   - MySQL 8.0 需权限（5.7 通用）
3. **RDS 密码策略**：8~32 位，含大写+小写+数字+特殊字符；特殊字符限 `~!@#$%^*-_=+?()&.`（含 `[]{};:<>,.` 会报 DBS.200052 / DBS.01010160）
4. **CreateDatabase 是单库**：`--name` + `--character_set` 直接参数，**不是** databases 数组 body（数组形式报 DBS.280631 Invalid database name）
5. **删除顺序**：先删 RDS 实例 → 等网卡释放（~90s）→ 删子网（需带 `--vpc_id`）→ 删 VPC。子网占用错误 VPC.0209/0208 是释放延迟，轮询即可
6. 安全组 default 可复用；ListVpcs 输出含版本提示行（"ListVpcs有多个版本"），解析需先截到 `{`

## 成本

- postPaid 按分钟计费，实例存活 ~15 分钟（BUILD 4.5min + ACTIVE 操作 + 删除）→ 估算 <0.1 元（2C4G 单机约 0.3~0.5 元/小时量级）
- 密码等敏感信息全程仅存 %TEMP%（已清理），不入对话明文

## 资源红线确认

- 创建：VPC/子网/RDS 全为本次新增（前缀 rds-e2e- 唯一标识）
- 销毁：**只删本次创建资源**，default 安全组（既有）未触碰
- 复核：RDS ListInstances 0 / VPC ListVpcs 0 / Subnet ListSubnets 0（全量）

## 复现脚本（工作区 test-cases/，未入仓）

- rds-parse-flavors.py / rds-find-min.py（规格最小档选择）
- rds-create5/6/7.py（cli-jsonInput 格式与密码策略排坑链）
- rds-wait-query.py（BUILD→ACTIVE 轮询）
- rds-create-db2.py / rds-cleanup.py / rds-cleanup2.py（建库/清理归零）