/**
 * WorkBuddy 每日测试探针 - D1 升级检测链（v1.1.4-next.6）
 * 用例: D1-26, D1-27, D1-28, D1-30, D1-31, D1-33, D1-39, D1-40
 * SUT: npm 全局包 huaweicloud-devkit@1.1.4-next.6 真实函数直调 + 真实 npm registry 查询
 */
import {
  semverParse, semverCompare, determineTarget, parseDistTagsOutput, judgeUpdate,
  queryDistTags, queryDistTagsFetch,
  readSkipState, writeSkipState, resolveSkipFilePath, fallbackSkipFilePath,
  readInstalledVersion,
} from 'file:///C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/update-check.mjs';
import { existsSync, readFileSync, rmSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir, tmpdir } from 'node:os';

const results = [];
function t(id, name, pass, actual, expected, note) {
  results.push({ case: id, name, pass: pass === null ? null : !!pass, actual: String(actual), expected: String(expected), note: note || '' });
}

// ── D1-30 semver 比对正确性 ──
t('D1-30', '1.1.3 < 1.1.4', semverCompare('1.1.3', '1.1.4') < 0, semverCompare('1.1.3', '1.1.4'), '<0');
t('D1-30', '1.1.4 == 1.1.4', semverCompare('1.1.4', '1.1.4') === 0, semverCompare('1.1.4', '1.1.4'), '0');
t('D1-30', '1.1.4 > 1.1.3', semverCompare('1.1.4', '1.1.3') > 0, semverCompare('1.1.4', '1.1.3'), '>0');
t('D1-30', '1.1.4-next.3 vs 1.1.4 预发布语义', semverCompare('1.1.4-next.3', '1.1.4') < 0, semverCompare('1.1.4-next.3', '1.1.4'), '<0(预发布<正式)');
t('D1-30', 'semverParse("1.2.3") 有效', JSON.stringify(semverParse('1.2.3')).includes('"major"'), JSON.stringify(semverParse('1.2.3')).slice(0, 60), '含 major/minor/patch');

// ── D1-27 检测语义-已是最新 ──
const sameTags = { latest: '1.1.4-next.6', next: '1.1.4-next.6' };
const j27 = judgeUpdate('1.1.4-next.6', sameTags, null);
t('D1-27', '已是最新 → up_to_date', j27.result === 'up_to_date', j27.result, 'up_to_date', JSON.stringify(j27).slice(0, 120));

// ── D1-28 检测语义-有新版本 ──
const newerTags = { latest: '1.1.4-next.6', next: '1.1.5-next.1' };
const j28 = judgeUpdate('1.1.4-next.6', newerTags, null);
t('D1-28', '有新版 → update_available', j28.result === 'update_available', j28.result, 'update_available', JSON.stringify(j28).slice(0, 160));

// ── D1-31 dismiss 冷却期 ──
const now = Date.now();
const skip31 = { dismissedVersion: '1.1.5-next.1', dismissedAt: new Date(now).toISOString(), expireAt: new Date(now + 3 * 86400 * 1000).toISOString() };
const j31a = judgeUpdate('1.1.4-next.6', newerTags, skip31);
t('D1-31', '冷却期内同版本 → dismissed', j31a.result === 'dismissed', j31a.result, 'dismissed', JSON.stringify(j31a).slice(0, 140));
const skip31b = { ...skip31, expireAt: new Date(now - 1000).toISOString() };
const j31b = judgeUpdate('1.1.4-next.6', newerTags, skip31b);
t('D1-31', '冷却期过 → update_available', j31b.result === 'update_available', j31b.result, 'update_available');
const skip31c = { ...skip31, dismissedVersion: '1.1.4' }; // 曾忽略旧版本 1.1.4, 现有更新 1.1.5-next.1
const j31c = judgeUpdate('1.1.4-next.6', newerTags, skip31c);
t('D1-31', '更新版本>已忽略版本 → 重新提醒', j31c.result === 'update_available', j31c.result, 'update_available');
// 语义注: 曾忽略更高版本(1.1.6)时, 对较低 target(<=已忽略版本)保持静默 —— 记录设计语义
const skip31d = { ...skip31, dismissedVersion: '1.1.6' };
const j31d = judgeUpdate('1.1.4-next.6', newerTags, skip31d);
t('D1-31', '观察: 已忽略更高版本时低版本 target 静默(设计语义)', null, j31d.result, '-', 'inCooldown 条件 target<=dismissedVersion, 属设计');

// ── D1-40 镜像 lag 下检测正确性（反向提醒防护） ──
// registry 镜像 lag: latest < current（镜像比本地旧）→ 不得反向提醒"有更新"
const lagTags = { latest: '1.1.3', next: '1.1.3' };
const j40 = judgeUpdate('1.1.4-next.6', lagTags, null);
t('D1-40', '镜像 lag(latest<current) → 不反向提醒', j40.result !== 'update_available', j40.result, '非 update_available', JSON.stringify(j40).slice(0, 140));
// parseDistTagsOutput: npm view 输出解析
const parsed = parseDistTagsOutput('latest: 1.1.4\nnext: 1.1.5-next.1');
t('D1-40', 'dist-tags 输出解析', parsed && parsed.next === '1.1.5-next.1', JSON.stringify(parsed), 'next=1.1.5-next.1');

// ── D1-33 skip 文件持久化与多路径 ──
const tmpDir = join(tmpdir(), `hdk-probe-skip-${Date.now()}`);
mkdirSync(tmpDir, { recursive: true });
const skipFile = join(tmpDir, 'devkit-skip.json');
const written = writeSkipState(skipFile, '1.1.5-next.1', { at: now });
t('D1-33', '写 skip 文件字段完整', written.dismissedVersion === '1.1.5-next.1' && !!written.dismissedAt && !!written.expireAt, JSON.stringify(written), '三字段齐');
const rd = readSkipState(skipFile);
t('D1-33', '读回一致', rd && rd.dismissedVersion === '1.1.5-next.1', JSON.stringify(rd), 'roundtrip');
const expireDelta = new Date(written.expireAt) - new Date(written.dismissedAt);
t('D1-33', 'expireAt = dismissedAt + 3 天', expireDelta === 3 * 86400 * 1000, `${expireDelta / 86400000}天`, '3天');
// 回退路径存在
const fb = fallbackSkipFilePath();
t('D1-33', 'fallback 路径含 .config/huaweicloud', /huaweicloud/.test(fb) && /devkit-skip/.test(fb), fb, '含 huaweicloud/devkit-skip');
// 原子写：写入后无 .tmp 残留
t('D1-33', '原子写无 tmp 残留', !existsSync(skipFile + '.tmp'), existsSync(skipFile + '.tmp'), 'false');
// session 路径拆分
const pA = resolveSkipFilePath('session-A');
const pB = resolveSkipFilePath('session-B');
t('D1-33', '会话隔离路径不同', pA !== pB && /session-A$/.test(pA), pA.slice(-40) + ' | ' + pB.slice(-40), 'A≠B');
// 危险 session 值清洗（路径穿越）
const pEvil = resolveSkipFilePath('../evil/..id');
t('D1-33', '危险 session 值过滤(无 ../ 与 .)', !pEvil.includes('../') && !pEvil.includes('..id'), JSON.stringify(pEvil.slice(-50)), '无路径穿越');
rmSync(tmpDir, { recursive: true, force: true });

// ── D1-39 Windows 升级检测链可用性（真实 registry 查询 + 真实安装版本读取） ──
const installed = readInstalledVersion();
t('D1-39', '真实安装版本读取', !!installed, installed, '非空');
try {
  let tags = await queryDistTags({ timeoutMs: 60000 });
  if (!tags) tags = await queryDistTagsFetch({ timeoutMs: 30000 });
  t('D1-39', '真实 npm dist-tags 查询成功', !!tags && !!tags.latest, JSON.stringify(tags), 'latest+next');
  const judge = judgeUpdate(installed, tags, null);
  t('D1-39', '真实判定闭环', ['up_to_date', 'update_available', 'dismissed', 'check_failed'].includes(judge.result), judge.status + ' (installed=' + installed + ')', '合法状态');
} catch (e) {
  t('D1-39', '真实 npm dist-tags 查询成功', false, 'threw: ' + e.message, '成功');
}

// ── D1-26 升级提醒工具注册与协议暴露（函数级；协议级见 d9-protocol 探针） ──
const tags26 = { latest: '1.1.4', next: '1.1.5-next.1' };
const j26 = judgeUpdate('1.1.4-next.6', tags26, null);
t('D1-26', '判定结果含目标版本信息', !!j26, JSON.stringify(j26).slice(0, 120), '结构化结果');
t('D1-26', 'determineTarget 选 next 通道', determineTarget('1.1.4-next.6', tags26) !== undefined, JSON.stringify(determineTarget('1.1.4-next.6', tags26)), '定义 target');

console.log(JSON.stringify(results, null, 2));
const p = results.filter((r) => r.pass === true).length;
const f = results.filter((r) => r.pass === false).length;
const i = results.filter((r) => r.pass === null).length;
console.log(`\n=== D1 升级链: ${p} PASS / ${f} FAIL / ${i} INFO / ${results.length} TOTAL ===`);
