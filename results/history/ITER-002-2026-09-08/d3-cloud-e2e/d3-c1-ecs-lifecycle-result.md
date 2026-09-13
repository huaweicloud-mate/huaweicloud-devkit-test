# ITER-001-2026-09-05 D3-C1 真云 E2E 执行结果（ECS 生命周期）

> 执行：2026-09-07 10:45~11:00 ｜ 账号 hw018619646 / cn-north-4 / 余额 1 元（按需计费）
> 前置：D3-C-真云E2E手工清单（manual/D3-C-真云E2E手工清单.md）实际执行——**全链 PASS**

## 执行记录

| 步骤 | 命令 | 结果 |
|---|---|---|
| P1 规格 | ECS ListFlavors | ✅（c6.large.2 等可用） |
| P2 镜像 | IMS ListImages gold | ✅ EulerOS 3.0（9c2f37…96fde） |
| P3 网络 | VPC ListVpcs/ListSubnets/ListSecurityGroups | ✅ 无 VPC/子网（仅 default SG）→ 走完整创建链 |
| 建 VPC | CreateVpc hwc-e2e-vpc 192.168.0.0/16 | ✅ id=7e62778f… |
| 建子网 | CreateSubnet 192.168.0.0/24 | ✅ id=0565b26e… |
| 建 ECS | CreateServers c6.large.2 + EulerOS3.0 + 40G | ✅ serverId=0b2a77cc…（按需） |
| 查状态 | ListServersDetails | ✅ BUILD（2C4G/内网 192.168.0.12/charging_mode 0） |
| **销毁** | DeleteServers --servers.1.id --delete_publicip --delete_volume | ✅ job 提交 |
| 释放确认 | NovaListServers | ✅ 50s 后无残留 |
| 删子网 | DeleteSubnet（含 vpc_id，技能提醒） | ✅ |
| 删 VPC | DeleteVpc | ✅ |
| **最终复核** | VPC/子网/ECS 列表 | ✅ **全部归零** |

## 过程中记录的真实陷阱（技能提示逐一命中）

| 现象 | 错误码 | 处置 | 技能预警 |
|---|---|---|---|
| kc1(鲲鹏) 与 x86 镜像不匹配 | Ecs.0005 | 换 c6.large.2 | 规格/镜像架构匹配 |
| SATA 盘在 AZ 售罄 | Ecs.0044 | 换 SSD | 磁盘类型可用性 |
| DeleteServers 参数名 | USE_ERROR | --help 查证 --servers.1.id | 铁律 --help first |

## 结论

- **D3-C1 PASS**：ECS 创建→查询→销毁全链正常；审批门（每个写操作 plan→deny→approve）全程生效
- **费用**：ECS 存活约 3 分钟按需扣费 ≈0.01 元级；资源零泄漏
- **预处理发现**：账号初始无 VPC——真云从零开始建网（VPC→Subnet→ECS）全链验证完成，补 D3-C4 网络用例空白