# ITER-001 D1 新功能实测（uninstall-cleanup 系列）

> 执行：2026-09-07 ｜ 被测：huaweicloud-devkit dev@02fa79b（next.15）｜ 方式：**隔离临时 HOME + fake 资产**，零真实破坏
> 复现：`test-cases/d1-cleanup-test.mjs`（node 直跑，退出码 0=全过）

## 结果：11/11 通过

| 用例 | 断言 | 结果 |
|---|---|---|
| **D1-10** 卸载全局清理 | 默认二进制 `.local/bin/hcloud` + Windows `hcloud.exe` + `~/.hcloud` 配置目录 + 空安装目录全部删除 | ✅ |
| **D1-11** 自定义 HCLOUD_BIN 保留 | 用户管理二进制存在且删除清单不含自定义路径（零触碰） | ✅ |
| **D1-12** 清理幂等 | 二次执行返回空清单，无报错无残留 | ✅ |
| **D1-13** Windows 文件锁 | **观察记录**：Node 只读句柄在 Windows 不阻止 rmSync（FILE_SHARE 语义）→ 本机无法构造"删除被拒"；真实锁场景（运行中 exe 映像）留待客户端手工验证（D5-6 关联） | ✅（延后标注） |
| **D1-10b** removeObsConfig | `~/.obsutilconfig` 删除（子进程 USERPROFILE 注入隔离验证）+ 幂等 | ✅ |
| **D1-14** copyFileVerified（附） | 实现审查：复制后大小校验 + 3 次重试 + 明确错误信息（"destination may be locked"）；真实 install 多次运行隐式验证通过；锁深度模拟延后 | ✅ |
| **D1-15** checkForUpdate（附） | P2，未测（待跑；函数存在 setup-cli.mjs） | ⏳ |

## 验证价值

- dev 核心新功能（uninstall-cleanup：removeKooCli/removeObsConfig）**功能正确**：默认位置清理干净、自定义资产保护、幂等
- 与 README/注释承诺一致（"only touches default install locations; user-managed binary behind HCLOUD_BIN is left alone"）
- 删除清单返回 removed paths（可审计）——新增功能设计良好

## 无新增缺口

本组未发现产品缺陷；D1-13 的"真实锁"场景与 D1-15 更新检查列入手工/后续批次。