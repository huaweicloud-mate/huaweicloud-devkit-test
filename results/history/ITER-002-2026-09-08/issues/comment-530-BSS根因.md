**根因定位更新（2026-09-08）**：

已定位 BSS 缺失的根因——**KooCLI Linux/ARM64 发行版的服务清单缺失 31 个服务**（构建差异，非账号/网络/配置问题）。

**实测对比**（同版本 7.2.12）：
- Windows 版 `hcloud --help`：**132 个服务**
- Linux ARM64 版（Ubuntu 24.04，4 台独立机器一致）：**101 个服务**
- **Windows 有而 Linux 无的 31 个**：ASM, BCC, BCS, **BSS**, CMS, DCOS, DRIS, DWR, EC, FRS, **GEIP**, GSL, IDT, IEC, IEF, IES, IVS, KVS, MSGSMS, MSSI, NLP, OA, OROAS, OSM, RES, SDRS, TICS, VAS, VCM, VIAS, VIS
- Linux 有而 Windows 无：0

**影响范围（不只是余额）**：
- **BSS（余额/成本）**：Linux 余额查询不可用（原报告 P1）
- **GEIP（弹性公网 IP）**：Linux 上 EIP 管理类操作不可用
- 其余 29 个（短信/人脸/NLP/云备份/DR 等增值服务）同样缺失
- 核心服务（ECS/VPC/OBS/FunctionGraph/RDS/IMS 等 101 个）Linux 正常

**建议**：① KooCLI 侧修复 ARM64 发行版服务元数据（补齐 31 个）② devkit 在 Linux 检测到 BSS/GEIP 缺失时给出明确提示或走 SDK 兜底 ③ 文档标注平台服务差异表