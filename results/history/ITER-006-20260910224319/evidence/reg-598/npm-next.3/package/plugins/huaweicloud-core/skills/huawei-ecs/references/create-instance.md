# Create ECS Instance SOP

**Before executing any command: If MCP tools are not available** (new session after install), restart your session or use hcloud CLI directly with caution. Commands using adminPass/password WILL appear in shell history — prefer key_name.

## 1. Discover flavors

hcloud ECS ListFlavors --cli-region=<region> --cli-output=json
Filter for `os_extra_specs.cond:operation:status == normal` — most results are abandoned. See references/flavors.md.

## 2. Find availability zones

hcloud ECS NovaListAvailabilityZones --cli-region=<region>

## 3. Find image

```bash
# Broad search — specific names may return empty in some regions
hcloud IMS ListImages --cli-region=<region> --__imagetype=gold --__isregistered=true --limit=20
```

If searching by name (e.g. --name="Ubuntu") returns empty: use broad search without name filter, pick from results. Some regions only offer Huawei Cloud EulerOS (HCE).

Common images (verify live per region):

| Image            | Region     | ID                                   |
| ---------------- | ---------- | ------------------------------------ |
| HCE 2.0 Standard | cn-north-4 | 7d940784-ac0a-425f-b3fa-8478f1a1df70 |
| Ubuntu 22.04     | Query live | Query live                           |
| CentOS 8.2       | Query live | Query live                           |

## 4. Verify or create VPC/subnet

hcloud VPC ListVpcs --cli-region=<region>
hcloud VPC ListSubnets --vpc_id=<vpc-id> --cli-region=<region>
If no VPC/subnet exists: load `huawei-vpc` skill → create VPC → create subnet (with DNS) → create security group → return here.

## 5. Create keypair (recommended over adminPass)

**MCP 环境下必须用"本地生成 + 导入"流程**——`NovaCreateKeypair` 返回的 `private_key` 会被 MCP 脱敏管道替换为 `<redacted>`，而私钥仅此一次机会，读不到即作废：

```bash
# 1. 本地生成
ssh-keygen -t rsa -b 2048 -f ./<name> -N '""'
# 2. 导入公钥
hcloud ECS NovaCreateKeypair --keypair.name=<name> --keypair.public_key=<本地 .pub 文件内容>
# 3. 使用私钥文件 ./<name> 连接实例
```

> **陷阱**：删除密钥对的参数是 `--keypair_name=<name>`（path 风格），不是 `--keypair.name=<name>`（body 风格），混用报 USE_ERROR。

Password alternative:

- adminPass: 8-26 chars, must have uppercase + lowercase + digit + special char
- Passwords appear ONCE in creation output and are not retrievable
- Passwords are logged in shell history — this is a security risk

## 6. Create instance

hcloud ECS CreateServers --cli-region=<region> --server.name=<name> --server.flavorRef=<flavor-id> --server.imageRef=<image-id> --server.nics.1.subnet_id=<subnet-id> --server.root_volume.volumetype=<type> --server.root_volume.size=<minsize> --server.vpcid=<vpc-id> --server.availability_zone=<az> --server.key_name=<keypair-name> --server.count=1

### Bootstrap with user_data (cloud-init)

Use `--server.user_data` to run a cloud-init script at first boot. The value must be **base64-encoded**. This is also the recommended bootstrap path when SCP policies block SSH access — user_data serves as the full deployment path, no SSH needed.

**中国区镜像源强制规则**（实测：`deb.nodesource.com` 从北京四不可达，cloud-init 全链失败）：

```bash
#!/bin/bash
set -eux
# Node: 用华为云镜像二进制直装，固定小版本，禁用 NodeSource/curl Nodesource 脚本
# ⚠️ ARCH 必须与实例架构一致：kc1/kc2 等鲲鹏 = arm64；s6/s7/c7 等 x86 = x64
NODE_VERSION=v22.14.0
ARCH=arm64   # x86 实例改为 x64
curl -fsSL "https://mirrors.huaweicloud.com/nodejs/${NODE_VERSION}/node-${NODE_VERSION}-linux-${ARCH}.tar.xz" -o /tmp/node.tar.xz
mkdir -p /usr/local/lib/nodejs && tar -xJf /tmp/node.tar.xz -C /usr/local/lib/nodejs
export PATH=/usr/local/lib/nodejs/node-${NODE_VERSION}-linux-${ARCH}/bin:$PATH
ln -sf /usr/local/lib/nodejs/node-${NODE_VERSION}-linux-${ARCH}/bin/{node,npm,npx} /usr/local/bin/
# npm registry 指向华为云
npm config set registry https://repo.huaweicloud.com/repository/npm/
# DNS 兜底（子网 dnsList 缺失时自救）
grep -q 100.125.0.20 /etc/resolv.conf || echo "nameserver 100.125.0.20" >> /etc/resolv.conf
```

**可观测性模板**（实测教训：cloud-init 失败后无感知、固定 sleep 空等 ≈8 分钟）：

```bash
# 每阶段落 sentinel，收尾打标记；agent 侧轮询标记而非固定 sleep
touch /var/log/kit-step1-deps-done
# ... 构建完成后：
touch /var/log/kit-deploy-done   # ← agent 轮询此文件出现即成功
# 失败时：cloud-init status --long + /var/log/cloud-init-output.log 定位
```

> **SSR/Next.js 项目强烈推荐"本地构建 + 上传产物"**（next standalone / `.next` + node_modules），服务器零构建可省 ~20 分钟且绕开服务器侧依赖解析风险。必须服务器构建时：先本地 `npm install` 验证 lockfile 再上传；已知坏组合黑名单——`isomorphic-dompurify@^2` 场景加 `overrides: {"html-encoding-sniffer":"4.0.0","jsdom":"25.0.1"}`（最新 jsdom→cssstyle→@csstools 链全 ESM-only，Next 14 构建期 CJS require 必挂，首个 `ERR_REQUIRE_ESM` 即跑 `npm ls <包>` 查依赖树，不要盲目重装）。

```bash
# Encode the script
user_data=$(cat << 'SCRIPT' | base64
#!/bin/bash
# Your bootstrap commands here.
# Output logs: /var/log/cloud-init-output.log
SCRIPT
)

hcloud ECS CreateServers ... --server.user_data=$user_data
```

> **Security**: Never embed secrets (passwords, AK/SK, tokens) in user_data. It is stored unencrypted and readable from within the instance via IMDS. Fetch secrets at boot from DEW/CSMS instead.
>
> **Debugging**: If the script didn't run, check `/var/log/cloud-init-output.log` on the instance.
>
> **Recovery after failure**: user_data only executes on **first boot**. Restarting the instance will NOT re-run user_data scripts. If cloud-init fails (e.g., DNS missing → `yum`/`apt` cannot resolve repos):
>
> 1. Fix the root cause (e.g., update subnet DNS via `VPC UpdateSubnet`)
> 2. Either: SSH into the instance and run the setup commands manually (see `huawei-ecs` → SSH Connection Verification → Running Commands Inside the Instance)
> 3. Or: Delete the instance and recreate with corrected user_data (fresh boot)

## 7. EIP (two methods)

### Method A: Inline with CreateServers (Recommended)

Add EIP parameters to the `CreateServers` command in step 6:

```bash
hcloud ECS CreateServers \
  --server.publicip.eip.iptype=<type> \
  --server.publicip.eip.bandwidth.sharetype=<share-type> \
  --server.publicip.eip.bandwidth.size=<size> \
  --server.publicip.eip.bandwidth.chargemode=traffic \
  ...
```

> **Trap**: Parameter names differ from `EIP CreatePublicip`. Use `iptype` (not `type`), `sharetype` (not `share_type`), and `chargemode` (not `charging_mode`). Always verify with `hcloud ECS CreateServers --help`.

### Method B: Create and bind separately

hcloud EIP CreatePublicip --publicip.type=<type> --bandwidth.size=<size> --bandwidth.share_type=<share-type> --bandwidth.name=<name>

```bash
# Get the ECS network port ID
hcloud ECS ListServersDetails --cli-region=<region> --server_id=<instance-id>
# → addresses.<vpc-id>[].OS-EXT-IPS:port_id

# Bind EIP via port
hcloud EIP AssociatePublicips --publicip_id=<eip-id> --publicip.associate_instance_id=<port-id> --publicip.associate_instance_type=PORT
```

## 8. Verify

ECS creation is asynchronous. Wait times vary widely (20s to 3min). Status transitions: `BUILD` → `ACTIVE` (or `ERROR`). Never use fixed sleep — poll actively:

```bash
for i in $(seq 1 30); do
  status=$(hcloud ECS ListServersDetails --cli-region=<region> --server_id=<instance-id> --cli-output=json | jq -r '.servers[0].status')
  if [ "$status" = "ACTIVE" ]; then break; fi
  if [ "$status" = "ERROR" ]; then echo "Creation failed"; exit 1; fi
  sleep 10
done
```

- Poll interval: 10 seconds
- Maximum wait: 5 minutes (30 iterations)
- After ACTIVE, confirm once more: `hcloud ECS ListServersDetails --cli-region=<region> --server_id=<instance-id>`

### Verify HTTP accessibility (if EIP bound)

```bash
# Get the EIP address from instance details
hcloud ECS ListServersDetails --cli-region=<region> --server_id=<instance-id>
# → addresses.<vpc-id>[].OS-EXT-IPS:addr

curl http://<eip-address>
# Expected: HTTP 200 (if port 80 open and web server installed)

## 9. Delete instance (with cleanup)
hcloud ECS DeleteServers --servers.1.id=<instance-id> --delete_publicip=true --delete_volume=true
Warning: --delete_publicip and --delete_volume default to false. Set to true to avoid orphaned charges.

## Constraints
- Name: 1-64 chars, letters/digits/hyphens
- Flavor: must be available in target region — always ListFlavors first
- Root volume: SSD 40GB min
- Keypair is safer than adminPass (passwords leak into shell history)
```
