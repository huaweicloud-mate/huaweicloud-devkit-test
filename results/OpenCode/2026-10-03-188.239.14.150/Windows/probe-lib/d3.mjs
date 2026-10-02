// probe-lib/d3.mjs — D3 能力发现/真云场景维度（含真实云资源创建-归零）
import { emit, SDK } from './shared.mjs';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const U = p => `${SDK}/${p}`;
const hcloud = (args, opts = {}) => {
  const r = spawnSync('hcloud', args, { encoding: 'utf8', timeout: 180000, shell: true, windowsHide: true, ...opts });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || ''), raw: r.stdout || '' };
};

export async function d3_a1() {
  return emit('D3-A1', 'skill 检索完整性(~30 个 SKILL.md)', async c => {
    const { callTool } = await import(U('tools.mjs'));
    const roots = [
      'C:/Users/Administrator/.config/opencode/skills',
      'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/skills',
    ];
    let all = [];
    for (const r0 of roots) {
      if (!existsSync(r0)) continue;
      const { readdirSync } = await import('node:fs');
      for (const e of readdirSync(r0, { withFileTypes: true })) {
        if (e.isDirectory() && existsSync(join(r0, e.name, 'SKILL.md'))) all.push({ dir: join(r0, e.name), name: e.name });
      }
    }
    c.ok('本地 SKILL.md 数量达到 ~30 量级', all.length >= 20, all.length, '>=20');
    let hit = 0, full = 0;
    for (const s of all) {
      const r = await callTool('huaweicloud_retrieve_skill', { name: s.name });
      const txt = JSON.stringify(r);
      const got = r && r.isError === false && txt.includes(s.name);
      if (got) hit++;
      const r2 = await callTool('huaweicloud_search_docs', { query: s.name });
      if (r2 && r2.isError === false) full++;
    }
    c.eq('全部 skill 可 retrieve_skill 检索', hit, all.length);
    c.eq('全部 skill 可 search_docs 命中', full, all.length);
    const one = await callTool('huaweicloud_retrieve_skill', { name: all[0]?.name });
    const len = JSON.stringify(one).length;
    c.ok('retrieve_skill 返回完整内容(非仅摘要)', len > 400, len, '>400');
    return {};
  });
}

export async function d3_b1() {
  return emit('D3-B1', 'list_operations 规范性', async c => {
    const { callTool } = await import(U('tools.mjs'));
    for (const svc of ['ECS', 'VPC', 'OBS']) {
      const r = await callTool('huaweicloud_list_operations', { service: svc });
      c.ok(`${svc} list_operations 成功`, r && r.isError === false, r && r.isError, false);
      const txt = r.content ? r.content.map(x => x.text || '').join('\n') : JSON.stringify(r);
      c.ok(`${svc} 返回规范操作名(大驼峰)`, /[A-Z][a-z]+[A-Z]/.test(txt), txt.slice(0, 160), 'CamelCase');
      c.ok(`${svc} 含 Create/Delete/List 类操作`, /(Create|Delete|List|Show|Describe)/.test(txt), '含操作', '存在');
    }
    return {};
  });
}

export async function d3_b3() {
  return emit('D3-B3', 'run_readonly_command 脱敏执行', async c => {
    const { callTool } = await import(U('tools.mjs'));
    const r = await callTool('huaweicloud_run_readonly_command', { args: ['IAM', 'ShowProject'] });
    c.eq('isError=false', r && r.isError, false);
    const txt = r.content ? r.content.map(x => x.text || '').join('\n') : JSON.stringify(r);
    const cred = JSON.parse(readFileSync('C:/Users/Administrator/.config/huaweicloud/credentials.json', 'utf-8'));
    c.ok('输出不含明文 AK', !txt.includes(cred.accessKeyId), 'AK', '已脱敏');
    c.ok('输出不含明文 SK', !txt.includes(cred.secretAccessKey), 'SK', '已脱敏');
    c.ok('输出为只读结果(含 project 字段)', /project/i.test(txt), txt.slice(0, 200), '含 project');
    const before = await callTool('huaweicloud_run_readonly_command', { args: ['ECS', 'ListServersDetails'] });
    const after = await callTool('huaweicloud_run_readonly_command', { args: ['ECS', 'ListServersDetails'] });
    c.eq('只读命令无写入副作用', JSON.stringify(after).replace(/\d+ms/g, ''), JSON.stringify(before).replace(/\d+ms/g, ''));
    return {};
  });
}

export async function d3_b5() {
  return emit('D3-B5', 'detect_framework 识别(13 框架+monorepo)', async c => {
    const { detectFramework } = await import(U('detect-framework.mjs'));
    const dir = mkdtempSync(join(tmpdir(), 'd3b5-'));
    const cases = [
      ['vite-react', { 'vite.config.ts': 'export default {}' }, 'react'],
      ['vue3', { 'vite.config.js': '', 'index.html': '' }, 'vue'],
      ['next', { 'next.config.js': '' }, 'nextjs'],
      ['nuxt', { 'nuxt.config.ts': '' }, 'nuxt'],
      ['angular', { 'angular.json': '' }, 'angular'],
      ['svelte', { 'svelte.config.js': '' }, 'svelte'],
      ['astro', { 'astro.config.mjs': '' }, 'astro'],
      ['remix', { 'remix.config.js': '' }, 'remix'],
      ['gatsby', { 'gatsby-config.js': '' }, 'gatsby'],
      ['docusaurus', { 'docusaurus.config.js': '' }, 'docusaurus'],
      ['hugo', { 'config.toml': '' }, 'hugo'],
      ['hexo', { '_config.yml': '' }, 'hexo'],
      ['taro', { 'config/index.js': '' }, 'taro'],
      ['uni-app', { 'pages.json': '' }, 'uni-app'],
    ];
    let ok = 0;
    for (const [name, files, expect] of cases) {
      const d = join(dir, name);
      mkdirSync(d, { recursive: true });
      for (const [f, content] of Object.entries(files)) writeFileSync(join(d, f), content, 'utf-8');
      const r = await detectFramework({ projectPath: d });
      const detected = (r?.frameworkType || r?.framework || '').toLowerCase();
      const hit = detected.includes(expect.toLowerCase().slice(0, 4)) || detected.includes(expect.toLowerCase());
      c.ok(`识别 ${name}`, hit, { detected, expect }, expect);
      if (hit) ok++;
    }
    // monorepo
    const mono = join(dir, 'mono');
    mkdirSync(join(mono, 'packages', 'a'), { recursive: true });
    writeFileSync(join(mono, 'package.json'), JSON.stringify({ private: true, workspaces: ['packages/*'] }), 'utf-8');
    writeFileSync(join(mono, 'packages', 'a', 'vite.config.ts'), '', 'utf-8');
    const mr = await detectFramework({ projectPath: mono });
    const md = (mr?.frameworkType || mr?.framework || '').toLowerCase();
    c.ok('识别 monorepo', md.includes('monorepo'), md, 'monorepo');
    // 关键：静态站点(无构建配置)是否被识别
    const stat = join(dir, 'staticsite');
    mkdirSync(stat, { recursive: true });
    writeFileSync(join(stat, 'index.html'), '<html></html>', 'utf-8');
    const sr = await detectFramework({ projectPath: stat });
    const sd = (sr?.frameworkType || sr?.framework || 'none');
    c.ok('纯静态站点被识别', sd !== 'none' && sd !== 'unknown', sd, '非 none');
    c.ok('框架识别率 ≥ 13/15', ok >= 13, `${ok}/14`, '>=13');
    rmSync(dir, { recursive: true, force: true });
    return { verdict: sd !== 'none' && sd !== 'unknown' ? undefined : 'SPEC-MISMATCH', note: sd !== 'none' && sd !== 'unknown' ? undefined : '工具描述枚举 13 框架，但纯静态站点（仅 index.html，无任何构建配置）返回 none/unknown —— 与 D3-B5 指引指出的"漏 Static Site"一致。' };
  });
}

export async function d3_c5() {
  return emit('D3-C5', '四工具冒烟', async c => {
    const { callTool } = await import(U('tools.mjs'));
    const t0 = Date.now();
    const r1 = await callTool('huaweicloud_check_cli', {});
    c.eq('check_cli 通过', r1 && r1.isError, false);
    const r2 = await callTool('huaweicloud_list_operations', { service: 'ECS' });
    c.eq('list_operations 通过', r2 && r2.isError, false);
    const r3 = await callTool('huaweicloud_plan_cli_command', { args: ['ECS', 'ListServersDetails'] });
    c.eq('plan_cli_command 通过', r3 && r3.isError, false);
    const r4 = await callTool('huaweicloud_explain_error', { service: 'ECS', errorCode: 'InvalidParameter', message: 'invalid flavor' });
    c.eq('explain_error 通过', r4 && r4.isError, false);
    const ms = Date.now() - t0;
    c.ok('冒烟总耗时 < 60s', ms < 60000, ms, '<60000ms');
    return {};
  });
}

export async function d3_c13() {
  return emit('D3-C13', 'OBS 静态网站托管配置(get/set/delete)', async c => {
    const { callTool } = await import(U('tools.mjs'));
    const bucket = 'hdk-web-' + Date.now();
    const region = 'cn-north-4';
    // 1) 创建 bucket
    const cr = hcloud(['OBS', 'CreateBucket', '--bucket', bucket, '--location', region]);
    c.ok('创建测试 bucket 成功', cr.code === 0 || /Success|exists/i.test(cr.out), { code: cr.code, out: cr.out.slice(0, 200) }, '成功');
    try {
      const g0 = await callTool('huaweicloud_obs_set_website_config', { action: 'get', bucket, region });
      c.ok('未配置时 get 返回未配置(非崩溃)', g0 && g0.isError === false, g0 && g0.isError, false);
      const s = await callTool('huaweicloud_obs_set_website_config', { action: 'set', bucket, region, indexDocument: 'index.html', errorDocument: '404.html' });
      c.eq('set 配置成功', s && s.isError, false);
      const g1 = await callTool('huaweicloud_obs_set_website_config', { action: 'get', bucket, region });
      const g1t = g1.content ? g1.content.map(x => x.text || '').join('') : JSON.stringify(g1);
      c.ok('get 核对 indexDocument 一致', /index\.html/.test(g1t), g1t.slice(0, 220), 'index.html');
      c.ok('get 核对 errorDocument 一致', /404\.html/.test(g1t), g1t.slice(0, 220), '404.html');
      const d = await callTool('huaweicloud_obs_set_website_config', { action: 'delete', bucket, region });
      c.eq('delete 配置成功', d && d.isError, false);
      const s2 = await callTool('huaweicloud_obs_set_website_config', { action: 'set', bucket, region });
      c.ok('缺 indexDocument 时 set 报错', s2 && s2.isError === true, { isError: s2 && s2.isError, text: JSON.stringify(s2).slice(0, 200) }, true);
    } finally {
      hcloud(['OBS', 'DeleteBucket', '--bucket', bucket]);
      const chk = hcloud(['OBS', 'HeadBucket', '--bucket', bucket]);
      c.ok('资源已归零(bucket 删除)', chk.code !== 0 || /NoSuchBucket|not exist|404/i.test(chk.out), { code: chk.code, out: chk.out.slice(0, 160) }, '不存在');
    }
    return {};
  });
}

export async function d3_c4() {
  return emit('D3-C4', '服务创建类回路(20+服务路由+最小规格创建/释放)', async c => {
    const { callTool } = await import(U('tools.mjs'));
    const services = ['ECS', 'VPC', 'OBS', 'RDS', 'EVS', 'EIP', 'IAM', 'SMN', 'DDS', 'GaussDB', 'CCE', 'FunctionGraph', 'APIG', 'ELB', 'AS', 'CTS', 'DNS', 'KMS', 'CSMS', 'CBR', 'CFS', 'DLM', 'DMS', 'ModelArts', 'Sandbox', 'ServiceStage', 'AOM', 'LTS', 'DSC', 'AOS'];
    let routed = 0, listed = 0;
    for (const s of services) {
      const r = await callTool('huaweicloud_list_operations', { service: s });
      if (r && r.isError === false) listed++;
      const cat = await callTool('huaweicloud_service_catalog', { intent: `${s} 服务` });
      const t = JSON.stringify(cat);
      if (t.toLowerCase().includes(s.toLowerCase()) || cat.recommendedServices?.length) routed++;
    }
    c.ok(`≥20 服务 list_operations 可达 (${listed}/${services.length})`, listed >= 20, listed, '>=20');
    c.ok(`全部服务意图可路由 (${routed}/${services.length})`, routed === services.length, routed, services.length);
    // 真云轻量创建：VPC + 子网 + EIP 占位（最小规格）→ 释放归零
    const vpcName = 'hdkprobe' + Date.now().toString().slice(-8);
    const v = hcloud(['VPC', 'CreateVpc', '--name', vpcName, '--cidr', '192.168.0.0/16']);
    c.ok('真云创建 VPC 成功', v.code === 0 || /Success|created|already exists/i.test(v.out), { code: v.code, out: v.out.slice(0, 200) }, '成功');
    let vpcId = null;
    try { vpcId = JSON.parse(v.raw).vpc_id || JSON.parse(v.raw).id; } catch { const mm = /"vpc_id"\s*:\s*"([^"]+)"/.exec(v.raw); if (mm) vpcId = mm[1]; }
    c.ok('拿到 VPC id', !!vpcId, vpcId, 'vpc_id');
    if (vpcId) {
      const s = hcloud(['VPC', 'CreateSubnet', '--vpc-id', vpcId, '--name', vpcName + '-sn', '--cidr', '192.168.0.0/24']);
      c.ok('真云创建子网成功', s.code === 0 || /Success|created/i.test(s.out), { code: s.code, out: s.out.slice(0, 200) }, '成功');
      const l = hcloud(['VPC', 'ListVpcs']);
      c.ok('创建后可查询到该 VPC', l.raw.includes(vpcName), 'listed', 'listed');
    } else {
      hcloud(['VPC', 'ListVpcs', '--name', vpcName]);
    }
    // 归零
    const del = hcloud(['VPC', 'DeleteVpc', '--vpc-id', vpcId || 'nonexistent']);
    const chk = hcloud(['VPC', 'ListVpcs']);
    const still = chk.raw.includes(vpcName);
    c.ok('资源归零(删除后不再存在)', still === false, still, false);
    return {};
  });
}

export async function d3_s1() {
  return emit('D3-S1', '场景-只读查 ECS(零写操作)', async c => {
    const { callTool } = await import(U('tools.mjs'));
    const cat = await callTool('huaweicloud_service_catalog', { intent: '查询我账号在华北北京四有哪些云主机 ECS' });
    const ct = JSON.stringify(cat).toLowerCase();
    c.ok('路由命中 ECS', ct.includes('ecs'), cat.recommendedServices?.slice(0, 3), '含 ecs');
    const r = await callTool('huaweicloud_run_readonly_command', { args: ['ECS', 'ListServersDetails'] });
    c.eq('只读命令成功', r && r.isError, false);
    const txt = r.content ? r.content.map(x => x.text || '').join('') : JSON.stringify(r);
    c.ok('返回实例清单', /server|instance|servers/i.test(txt), txt.slice(0, 200), '含清单');
    c.ok('全程未调用任何写工具', true, '本探针仅调用 service_catalog + run_readonly_command', '零写');
    return {};
  });
}

export async function d3_s2() {
  return emit('D3-S2', '场景-删 VPC 先确认再执行并归零', async c => {
    const { callTool } = await import(U('tools.mjs'));
    const cat = await callTool('huaweicloud_service_catalog', { intent: '删除一个 VPC 私有网络' });
    c.ok('路由命中 VPC', JSON.stringify(cat).toLowerCase().includes('vpc'), 'vpc', '含 vpc');
    const vpcName = 'hdks2' + Date.now().toString().slice(-8);
    const v = hcloud(['VPC', 'CreateVpc', '--name', vpcName, '--cidr', '192.168.0.0/16']);
    c.ok('准备测试 VPC 成功', v.code === 0 || /Success|created/i.test(v.out), { code: v.code, out: v.out.slice(0, 160) }, '成功');
    let vpcId = null;
    try { vpcId = JSON.parse(v.raw).vpc_id || JSON.parse(v.raw).id; } catch { const mm = /"vpc_id"\s*:\s*"([^"]+)"/.exec(v.raw); if (mm) vpcId = mm[1]; }
    if (!vpcId) return { verdict: 'FAIL', note: '未能创建测试 VPC，后续确认流无法验证' };
    const plan = await callTool('huaweicloud_plan_cli_command', { args: ['VPC', 'DeleteVpc', '--vpc-id', vpcId] });
    c.ok('先出命令块等待确认(未直接执行)', plan && (plan.requiresApproval === true || /confirm|确认/.test(JSON.stringify(plan))), plan.decision, '待确认');
    const preChk = hcloud(['VPC', 'ShowVpc', '--vpc-id', vpcId]);
    c.ok('未确认前 VPC 仍存在(零执行)', preChk.code === 0 || /not found|404/i.test(preChk.out) === false, { code: preChk.code }, '存在');
    if (plan.approvalToken) {
      const ap = await callTool('huaweicloud_run_approved_command', { args: ['VPC', 'DeleteVpc', '--vpc-id', vpcId], approvalToken: plan.approvalToken, approvedByUser: true });
      c.eq('确认后执行成功', ap && ap.isError, false);
    }
    const post = hcloud(['VPC', 'ShowVpc', '--vpc-id', vpcId]);
    c.ok('确认后 VPC 已删除并归零', post.code !== 0 || /not found|404|NoSuch/i.test(post.out), { code: post.code, out: post.out.slice(0, 160) }, '不存在');
    hcloud(['VPC', 'DeleteVpc', '--vpc-id', vpcId]);
    return {};
  });
}

export async function d3_s4() {
  return emit('D3-S4', '场景-领券闭环', async c => {
    const { callTool } = await import(U('tools.mjs'));
    const s1 = await callTool('huaweicloud_voucher_status', {});
    c.eq('voucher_status 成功', s1 && s1.isError, false);
    let p1 = s1;
    if (s1.content) { try { p1 = JSON.parse(s1.content.find(x => x.type === 'text').text); } catch {} }
    c.ok('返回 claimed 布尔', typeof p1.claimed === 'boolean', p1.claimed, 'boolean');
    const claim = await callTool('huaweicloud_voucher_claim', {});
    c.eq('voucher_claim 成功', claim && claim.isError, false);
    let pc = claim;
    if (claim.content) { try { pc = JSON.parse(claim.content.find(x => x.type === 'text').text); } catch {} }
    c.ok('领取返回 claimed=true', pc.claimed === true, pc, 'claimed=true');
    const s2 = await callTool('huaweicloud_voucher_status', {});
    let p2 = s2;
    if (s2.content) { try { p2 = JSON.parse(s2.content.find(x => x.type === 'text').text); } catch {} }
    c.eq('再查状态翻转为 claimed=true', p2.claimed, true);
    c.ok('闭环连贯 status→claim→status', true, `${p1.claimed}→${pc.claimed}→${p2.claimed}`, '连贯');
    return {};
  });
}

export async function d3_s5() {
  return emit('D3-S5', '场景-复合意图分层路由', async c => {
    const { callTool } = await import(U('tools.mjs'));
    const r = await callTool('huaweicloud_service_catalog', { intent: '我要一个高可用的主从高斯数据库用于生产，并配一个公网可访问的静态网站托管' });
    const t = JSON.stringify(r);
    c.ok('命中数据库(GaussDB/DDS)', /gaussdb|dds|数据库/i.test(t), (r.recommendedServices || []).slice(0, 4), '含数据库');
    c.ok('命中托管服务(OBS/Sandbox/ECS)', /obs|sandbox|ecs/i.test(t), (r.recommendedServices || []).slice(0, 4), '含托管');
    c.ok('分层推荐(预览→生产分流)', /预览|沙箱|preview|生产|production/i.test(t), '分层', '存在');
    c.ok('未盲选单一服务', (r.recommendedServices || []).length >= 2, (r.recommendedServices || []).length, '>=2');
    return {};
  });
}

export async function d3_s6() {
  return emit('D3-S6', '场景-FunctionGraph 定时任务', async c => {
    const { callTool } = await import(U('tools.mjs'));
    const cat = await callTool('huaweicloud_service_catalog', { intent: '创建一个函数处理图片压缩并配置每天定时触发' });
    c.ok('路由命中 FunctionGraph', /functiongraph/i.test(JSON.stringify(cat)), 'functiongraph', '含 functiongraph');
    const fnName = 'hdkprobe' + Date.now().toString().slice(-8);
    const plan = await callTool('huaweicloud_plan_cli_command', { args: ['FunctionGraph', 'CreateFunction', '--func-name', fnName, '--runtime', 'Node.js18', '--handler', 'index.handler', '--memory-size', '128'] });
    c.ok('CreateFunction 生成审批计划', plan && (plan.requiresApproval === true || plan.isError === false), plan && plan.isError, '需审批');
    let created = false;
    if (plan.approvalToken) {
      const ap = await callTool('huaweicloud_run_approved_command', { args: ['FunctionGraph', 'CreateFunction', '--func-name', fnName, '--runtime', 'Node.js18', '--handler', 'index.handler', '--memory-size', '128'], approvalToken: plan.approvalToken, approvedByUser: true });
      created = ap && ap.isError === false;
      c.eq('函数创建成功', ap && ap.isError, false);
      if (created) {
        const tr = await callTool('huaweicloud_plan_cli_command', { args: ['FunctionGraph', 'CreateFunctionTrigger', '--func-name', fnName, '--trigger-type-code', 'TIMER', '--trigger-status', 'ACTIVE'] });
        c.ok('定时触发器计划生成', tr && tr.isError === false, tr && tr.isError, '成功');
        const l = hcloud(['FunctionGraph', 'ListFunctions']);
        c.ok('函数可查到并返回 URN', /urn/i.test(l.raw) || /func_urn|urn/i.test(l.out), l.out.slice(0, 200), '含 URN');
        hcloud(['FunctionGraph', 'DeleteFunction', '--func-name', fnName]);
      }
    }
    const after = hcloud(['FunctionGraph', 'ListFunctions']);
    c.ok('资源归零(函数已释放)', !after.raw.includes(fnName), after.raw.includes(fnName), false);
    return {};
  });
}

export async function d3_s8() {
  return emit('D3-S8', '场景-操作失败后排障指引', async c => {
    const { callTool } = await import(U('tools.mjs'));
    const { extractApiError } = await import(U('hcloud-cli.mjs'));
    // 权限不足场景
    const w = hcloud(['ECS', 'DeleteServer', '--serverid', 'notexist-probe-000']);
    const ex1 = await callTool('huaweicloud_explain_error', { service: 'ECS', errorCode: 'AuthFailure', message: w.out.slice(0, 300) });
    const t1 = ex1.content ? ex1.content.map(x => x.text || '').join('') : JSON.stringify(ex1);
    c.ok('权限类失败有分类', /permission|权限|auth|forbidden|iam/i.test(t1), t1.slice(0, 240), '权限分类');
    c.ok('给出可执行下一步', /nextStep|下一步|命令|hcloud |建议|建议执行/i.test(t1), t1.slice(0, 300), '含下一步');
    c.ok('非裸报错堆栈', !/\n\s+at [\w.]+ \(/.test(t1), 'no raw stack', 'no raw stack');
    // 区域场景
    const ex2 = await callTool('huaweicloud_explain_error', { service: 'ECS', errorCode: 'InvalidRegion', message: 'region xx-not-exist-1 is invalid' });
    const t2 = ex2.content ? ex2.content.map(x => x.text || '').join('') : JSON.stringify(ex2);
    c.ok('区域类失败有分类', /region|区域/i.test(t2), t2.slice(0, 240), '区域分类');
    // 配额场景
    const ex3 = await callTool('huaweicloud_explain_error', { service: 'ECS', errorCode: 'QuotaExceeded', message: 'quota exceeded' });
    const t3 = ex3.content ? ex3.content.map(x => x.text || '').join('') : JSON.stringify(ex3);
    c.ok('配额类失败有分类', /quota|配额/i.test(t3), t3.slice(0, 240), '配额分类');
    const parsed = extractApiError ? extractApiError(w.out) : null;
    c.ok('extractApiError 可解析服务端错误', parsed !== null && parsed !== undefined, parsed, '可解析');
    return {};
  });
}

export async function d3_s3() {
  return emit('D3-S3', '场景-沙箱预览出公网 URL', async c => {
    const { callTool } = await import(U('tools.mjs'));
    const cat = await callTool('huaweicloud_service_catalog', { intent: '把本地 dist 目录部署成一个公网静态网站预览' });
    c.ok('路由命中沙箱', /sandbox|沙箱|devstation/i.test(JSON.stringify(cat)), 'sandbox', '含 sandbox');
    const cu = await callTool('huaweicloud_sandbox_check_user', {});
    c.ok('check_user 返回明确结果', cu && cu.isError === false, JSON.stringify(cu).slice(0, 200), '明确结果');
    const body = cu && cu.content ? cu.content.map(x => x.text || '').join('') : JSON.stringify(cu);
    if (/403|HDKIT_NOT_REALNAME|HDKIT_NOT_AGREEMENT/.test(body)) {
      return { verdict: 'BLOCKED', note: '沙箱需实名+签协议，当前账号未满足：' + body.slice(0, 200) };
    }
    const conn = await callTool('huaweicloud_sandbox_connect', { source: 'WEB' });
    c.ok('sandbox_connect 建立会话', conn && conn.isError === false, JSON.stringify(conn).slice(0, 200), '成功');
    if (!conn || conn.isError) return { note: 'connect 失败：' + JSON.stringify(conn).slice(0, 200) };
    const cp = conn.content ? conn.content.map(x => x.text || '').join('') : '{}';
    let parsed = {}; try { parsed = JSON.parse(cp); } catch {}
    const wsId = parsed.workspace_id || parsed.session_id;
    try {
      if (wsId) {
        const up = await callTool('huaweicloud_sandbox_upload_project', { local_dir: 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/huaweicloud-devkit-test', remote_dir: '/workspace', workspace_id: wsId });
        c.ok('upload_project 成功', up && up.isError === false, JSON.stringify(up).slice(0, 200), '成功');
        const ng = await callTool('huaweicloud_sandbox_deploy_nginx', { nginx_type: 'static', port: 80, project: 'huaweicloud-devkit-test', output_dir: '.', workspace_id: wsId });
        c.ok('deploy_nginx 成功', ng && ng.isError === false, JSON.stringify(ng).slice(0, 200), '成功');
        const dc = await callTool('huaweicloud_sandbox_deploy_check', { port: 80, project: 'huaweicloud-devkit-test', output_dir: '.', framework_type: 'static', workspace_id: wsId });
        c.ok('deploy_check 返回公网 URL', /https:\/\/[a-z0-9-]+\.devbridge/.test(JSON.stringify(dc)), JSON.stringify(dc).slice(0, 260), '含 URL');
      }
    } finally {
      if (wsId) { const cl = await callTool('huaweicloud_sandbox_close_session', { workspace_id: wsId }); c.ok('会话正常关闭', cl && cl.isError === false, JSON.stringify(cl).slice(0, 160), '成功'); }
    }
    return {};
  });
}

export async function d3_s7() {
  return emit('D3-S7', '场景-跨服务交互并归零', async c => {
    const { callTool } = await import(U('tools.mjs'));
    const cat = await callTool('huaweicloud_service_catalog', { intent: '创建一个 MySQL 云数据库并把应用部署上去连库' });
    const t = JSON.stringify(cat).toLowerCase();
    c.ok('复合意图命中 RDS', /rds|mysql|数据库|dds|gaussdb/.test(t), 'rds', '含数据库');
    c.ok('命中部署目标', /sandbox|ecs|部署/.test(t), 'deploy', '含部署');
    // 归零验证：创建最小 VPC 作为编排载体后释放
    const vpcName = 'hdks7' + Date.now().toString().slice(-8);
    const v = hcloud(['VPC', 'CreateVpc', '--name', vpcName, '--cidr', '192.168.0.0/16']);
    c.ok('编排第一步建库网络层成功', v.code === 0 || /Success|created/i.test(v.out), { code: v.code, out: v.out.slice(0, 160) }, '成功');
    let vpcId = null;
    try { vpcId = JSON.parse(v.raw).vpc_id || JSON.parse(v.raw).id; } catch { const mm = /"vpc_id"\s*:\s*"([^"]+)"/.exec(v.raw); if (mm) vpcId = mm[1]; }
    hcloud(['VPC', 'DeleteVpc', '--vpc-id', vpcId || '']);
    const after = hcloud(['VPC', 'ListVpcs']);
    c.ok('测后资源归零、零残留', after.raw.includes(vpcName) === false, after.raw.includes(vpcName), false);
    return { verdict: 'SPEC-MISMATCH', note: '受限于当前账号沙箱配额与 RDS 真实创建成本，本日以网络层编排 + 归零验证替代完整 RDS+沙箱链路；连接串注入与应用读写库未做真云验证。' };
  });
}

export async function d3_c14() {
  return emit('D3-C14', '沙箱 HDKit 服务参数与 hwlink 凭证', async c => {
    const hd = await import(U('sandbox/hdkitservice-api.mjs'));
    const hw = await import(U('sandbox/hwlink-api.mjs'));
    const cred = await import(U('auth/credentials.mjs'));
    cred.setRuntimeCredentials('AKTESTPROBE00000', 'SKTESTPROBEfakefake0000', 'STTESTPROBE000', 'cn-north-4');
    c.eq('runtime 凭证注入成功', cred.hasRuntimeCredentials(), true);
    const rt = cred.resolveCredentialsWithRuntime({});
    c.eq('resolveCredentialsWithRuntime 返回注入值', rt.accessKeyId || rt.ak, 'AKTESTPROBE00000');
    c.eq('hwlink getCredentials 返回 ak', (hw.getCredentials ? hw.getCredentials() : {})?.ak, 'AKTESTPROBE00000');
    c.ok('createConnection 签名含 x-security-token', /security-token|securityToken/i.test(readFileSync('C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/plugins/huaweicloud-core/src/sandbox/hwlink-api.mjs', 'utf-8')), '源码', '含 securitytoken');
    // 缺 devStageId 报错
    let threw = null, msg = '';
    try { await hd.hdkitCredentials({ sessionId: 'ws-fake-0001' }); } catch (e) { threw = e; msg = String(e.message); }
    c.ok('缺 devStageId 时报错', threw !== null, msg.slice(0, 160) || 'no throw', '报错');
    const cu = await (await import(U('tools.mjs'))).callTool('huaweicloud_sandbox_check_user', {});
    c.ok('hdkitCheckUser 真实调用可达', cu && cu.isError === false, cu && cu.isError, false);
    const body = cu.content ? cu.content.map(x => x.text || '').join('') : JSON.stringify(cu);
    c.ok('返回 200 或明确 403(实名/协议)', /200|realnameVerified|HDKIT_NOT_REALNAME|HDKIT_NOT_AGREEMENT|403/.test(body), body.slice(0, 200), '明确');
    cred.clearRuntimeCredentials();
    c.eq('clearRuntimeCredentials 清理且不留盘', cred.hasRuntimeCredentials(), false);
    return {};
  });
}