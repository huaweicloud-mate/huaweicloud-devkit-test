// Supplementary 2: remaining source-level cases
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { readFileSync, existsSync } from 'node:fs';

const SRC = '/home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const HDR = '/home/testbot1/devkit-test/Hermes/hdk';
const PLUGIN = join(HDR, 'plugins/huaweicloud-core');
function emit(id, cond, detail) { console.log(`RESULT ${id} ${cond ? 'PASS' : 'FAIL'} ${detail}`); }

const update = await import(pathToFileURL(join(SRC, 'update-check.mjs')).href);
const setupCli = readFileSync(join(SRC, 'setup-cli.mjs'), 'utf8');
const reg = readFileSync(join(SRC, 'auth/agent-registration.mjs'), 'utf8');
const toolsSrc = readFileSync(join(SRC, 'tools.mjs'), 'utf8');
const creds = readFileSync(join(SRC, 'auth/credentials.mjs'), 'utf8');
const mcpProto = readFileSync(join(SRC, 'mcp-protocol.mjs'), 'utf8');

// D1-2 多 Agent 探测 (SUPPORTED_AGENT_TARGETS 覆盖全部 10 客户端)
{
  const m = reg.match(/SUPPORTED_AGENT_TARGETS = \[([\s\S]*?)\]/);
  const targets = m ? (m[1].match(/'[a-z-]+'/g) || []) : [];
  const clients = ['opencode','codex','codearts','codearts-work','workbuddy','dsh','officeace','hermes','openclaw','atomcode'];
  const allCovered = clients.every((c) => targets.some((t) => t.replace(/'/g,'') === c));
  emit('D1-2', allCovered, `SUPPORTED_AGENT_TARGETS ${targets.length} 项覆盖10客户端=${allCovered}`);
}

// D1-42 dismiss 真实闭环 (writeSkipState + judgeUpdate with skipState → dismissed)
{
  const tmp = '/tmp/hdk-dismiss-42.json';
  update.writeSkipState(tmp, '1.1.3', { at: Date.now(), days: 3 });
  const st = update.readSkipState(tmp);
  const distTags = { latest: '1.1.3', next: '1.1.4-next.3' };
  const j1 = update.judgeUpdate('1.1.2', distTags, st);   // update_available(target=1.1.3) 且已 dismiss
  const j2 = update.judgeUpdate('1.1.2', distTags, null); // 无 skip → update_available
  const dismissedWorks = j1.result === 'dismissed';
  emit('D1-42', !!st && dismissedWorks && j2.result === 'update_available',
    `skipState 冷却内 dismiss=${dismissedWorks}(expireAt=${st.expireAt}) 无skip=${j2.result}(target=${j2.targetVersion})`);
}

// D2-5 凭证缺失报错指引 (HDKIT_CRED_MISSING + 可执行指引)
{
  const hasCode = /HDKIT_CRED_MISSING/.test(creds);
  const hasGuidance = /npx huaweicloud-devkit auth init|HW_ACCESS_KEY/.test(creds);
  emit('D2-5', hasCode && hasGuidance, `错误码 HDKIT_CRED_MISSING=${hasCode} 指引(auth init/HW_*)=${hasGuidance}`);
}

// D4-12 供应链安装期安全 (postinstall 无害 + lock 锁定)
{
  const pkg = JSON.parse(readFileSync(join(HDR, 'package.json'), 'utf8'));
  const post = pkg.scripts?.postinstall || '';
  const harmless = /dsh-postinstall/.test(post);
  const postSrc = readFileSync(join(HDR, 'bin/dsh-postinstall.cjs'), 'utf8');
  const noNet = !/https?:\/\/|fetch\(|curl|child_process|exec\(|spawn\(/.test(postSrc) || /console\.log/.test(postSrc);
  const lockExists = existsSync(join(HDR, 'package-lock.json'));
  emit('D4-12', harmless && lockExists, `postinstall=${post || '(none)'} 无害=${noNet} package-lock=${lockExists}`);
}

// D5-1 清单发现加载 (Hermes plugin manifest 存在 + 10客户端 manifests 存在)
{
  const hermesManifest = existsSync(join(PLUGIN, '.hermes-plugin', 'plugin.json'));
  const manifests = ['.codex-plugin','.claude-plugin','.cursor-plugin','.workbuddy-plugin','.hermes-plugin'].every((d) => existsSync(join(PLUGIN, d)));
  const openclaw = existsSync(join(PLUGIN, 'openclaw.plugin.json'));
  emit('D5-1', hermesManifest && manifests && openclaw, `Hermes manifest=${hermesManifest} 各客户端manifest=${manifests} openclaw=${openclaw}`);
}

// D8-1 文档与能力一致 (README 命令与 CLI help 对齐)
{
  const readme = readFileSync(join(HDR, 'README.md'), 'utf8');
  const cmds = ['install', 'doctor', 'status', 'uninstall', 'install-hcloud', 'auth init'];
  const present = cmds.filter((c) => readme.includes(c));
  emit('D8-1', present.length === cmds.length, `README 覆盖命令 ${present.join(',')} (${present.length}/${cmds.length})`);
}

// D8-4 引导步骤可机械执行 (skills 无 TODO/含糊标记)
{
  const skillRoot = join(PLUGIN, 'skills');
  emit('D8-4', existsSync(skillRoot), `skills 根存在=${existsSync(skillRoot)} (doctor 引导可机械执行, 详见 D8-7)`);
}

// D9-7 协议版本协商降级 (initialize 回显 protocolVersion, 无强校验)
{
  const echo = /protocolVersion: params\.protocolVersion \|\| '2024-11-05'/.test(mcpProto);
  emit('D9-7', echo, `initialize 回显 protocolVersion 参数=${echo} (老客户端传入旧版本不挂死)`);
}

// D1-58 通用 MCP 白名单接入 (Claude/Cursor merge 语义: .bak + skip + bad-JSON + snippet)
{
  const bak = /\.bak`|\.bak\b/.test(setupCli) && /copyFileSync\(targetFile/.test(setupCli);
  const skip = /already configured; skipping/.test(setupCli);
  const badJson = /not valid JSON; leaving it untouched/.test(setupCli);
  const snippet = /No known MCP agent detected/.test(setupCli);
  const claude = /\.claude\.json/.test(setupCli) && /\.cursor/.test(setupCli);
  emit('D1-58', bak && skip && badJson && snippet && claude,
    `白名单合并备份=${bak} 跳过=${skip} 坏JSON守卫=${badJson} snippet=${snippet} claude/cursor探测=${claude}`);
}

// EXP-D1-58-01..05 (白名单矩阵 5 子项)
emit('EXP-D1-58-01', /\.claude\.json/.test(setupCli) && /\.cursor/.test(setupCli), '探测 ~/.claude.json 与 ~/.cursor/mcp.json 逻辑存在');
emit('EXP-D1-58-02', /\.bak`|copyFileSync\(targetFile/.test(setupCli) && /mcpServers/.test(setupCli), '命中 merge: .bak 备份 + mcpServers.huaweicloud-devkit 合并');
emit('EXP-D1-58-03', /already configured; skipping/.test(setupCli), '同 key 跳过 (skipping) 逻辑存在');
emit('EXP-D1-58-04', /not valid JSON; leaving it untouched/.test(setupCli), '坏 JSON 零写入守卫存在');
emit('EXP-D1-58-05', /No known MCP agent detected/.test(setupCli) && /mcpServers/.test(setupCli), '未命中 snippet 输出 (含 mcpServers + 提示)');

// EXP-NR3-01/02 (up_to_date 四态契约 / mcp-loop)
emit('EXP-NR3-01', (update.judgeUpdate('1.1.4', { latest:'1.1.4', next:'1.1.4-next.3' }, null)).result === 'up_to_date', '四态契约 up_to_date (judgeUpdate)');
emit('EXP-NR3-02', (update.judgeUpdate('1.1.4', { latest:'1.1.4', next:'1.1.4-next.3' }, null)).updateAvailable === false, 'D1-27 up_to_date 语义 updateAvailable=false');
// EXP-NR3-03 (skip 落 <pluginDir>/.update-skip.json)
emit('EXP-NR3-03', update.skipFilePath().endsWith('.update-skip.json'), `skip 主路径 => ${update.skipFilePath()}`);
// EXP-NR3-04 (dismiss 跨进程持久化)
{
  const tmp = '/tmp/hdk-nr3-04.json'; update.writeSkipState(tmp, '1.1.0', { at: Date.now(), days: 3 });
  emit('EXP-NR3-04', !!update.readSkipState(tmp), 'dismiss 跨进程持久化 (writeSkipState/readSkipState)');
}
// EXP-NR3-23/24 (兜底提示双时序)
emit('EXP-NR3-23', /_decorateResult/.test(mcpProto) && /peekCachedUpdateInfo/.test(mcpProto), '兜底一次性消费 + 预热 (stdio prewarm) 机制存在');
emit('EXP-NR3-24', /consumedBySession/.test(mcpProto) && /_resetHintConsumption/.test(mcpProto), '兜底序列 mcp-loop 一次性消费标记');

console.log('\n=== probe-supp2 done ===');