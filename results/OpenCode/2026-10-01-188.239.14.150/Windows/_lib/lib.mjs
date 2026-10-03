// 每日测试共享库：证据落盘 + 断言辅助 + 源码模块加载
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const PACK = join(__dirname, '..');
export const EVROOT = join(PACK, 'evidence');
export const REPO = 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/huaweicloud-devkit-test';
export const HDK = 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk';
export const SRC = HDK + '/plugins/huaweicloud-core/src';
export const NODEPKG = 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk';

export const now14 = () => {
    const d = new Date();
    const p = (n, w = 2) => String(n).padStart(w, '0');
    return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
};

export const j = (o) => {
    const seen = new WeakSet();
    return JSON.stringify(o, (k, v) => {
        if (typeof v === 'function') return `[fn ${v.name || 'anon'}]`;
        if (typeof v === 'bigint') return String(v);
        if (v && typeof v === 'object') { if (seen.has(v)) return '[circular]'; seen.add(v); }
        return v;
    });
};

export const clip = (s, n = 400) => (s === undefined || s === null ? s : String(s).length > n ? String(s).slice(0, n) + `…(+${String(s).length - n})` : String(s));

export class Ctx {
    constructor(caseId) {
        this.caseId = caseId;
        this.checks = [];
        this.info = {};
        this.status = 'PASS';
        this.why = '';
    }
    // 记录一条断言；ok=false → 状态置 FAIL
    ok(name, cond, detail) {
        this.checks.push({ name, ok: !!cond, detail: detail === undefined ? null : clip(j(detail), 600) });
        if (!cond) { this.status = 'FAIL'; if (!this.why) this.why = `断言不成立: ${name}`; }
        return !!cond;
    }
    eq(name, actual, expected) {
        const a = j(actual), b = j(expected);
        return this.ok(name, a === b, { actual: clip(a, 200), expected: b });
    }
    set(key, value) { this.info[key] = value; return this; }
    fail(why) { this.status = 'FAIL'; this.why = why; return this; }
    block(reason) { this.status = 'BLOCKED'; this.why = reason; return this; }
    spec(drift) { this.status = 'SPEC-MISMATCH'; this.why = drift; return this; }
    notRun(reason) { this.status = 'NOT_RUN'; this.why = reason; return this; }
    pass(why) { this.status = 'PASS'; if (why) this.why = why; return this; }
    finish() {
        const dir = join(EVROOT, this.caseId);
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
        const passed = this.checks.filter((c) => c.ok).length;
        const payload = {
            caseId: this.caseId,
            status: this.status,
            executedAt: now14(),
            os: 'Windows',
            client: 'OpenCode',
            why: this.why,
            summary: `${passed}/${this.checks.length} checks passed`,
            checks: this.checks,
            ...this.info
        };
        writeFileSync(join(dir, 'stdout.log'), JSON.stringify(payload, null, 2), 'utf8');
        console.log(`[${this.caseId}] ${this.status}  ${passed}/${this.checks.length}  ${this.why || ''}`);
        return payload;
    }
}

export const mk = (id) => new Ctx(id);

// 解析 MCP tools/call 返回的 content JSON
export function parseTool(res) {
    if (res === null || res === undefined) return { raw: res, parsed: null, isError: false };
    if (typeof res === 'object' && Array.isArray(res.content)) {
        const text = res.content.map((c) => (c && c.text) || '').join('\n');
        let parsed = null;
        try { parsed = JSON.parse(text); } catch { parsed = null; }
        return { raw: res, text, parsed, isError: !!res.isError };
    }
    if (typeof res === 'string') {
        let parsed = null;
        try { parsed = JSON.parse(res); } catch { parsed = null; }
        return { raw: res, text: res, parsed, isError: false };
    }
    return { raw: res, parsed: res, isError: false };
}

export async function callTool(name, args) {
    const { callTool: ct } = await import(SRC + '/tools.mjs');
    return ct(name, args);
}

export function srcFile(rel) { return `${SRC}/${rel}`; }
export function readSrc(rel) { return readFileSync(`${SRC}/${rel}`, 'utf8'); }
export function lineOf(rel, needle) {
    const lines = readSrc(rel).split('\n');
    for (let i = 0; i < lines.length; i++) if (lines[i].includes(needle)) return i + 1;
    return -1;
}

// 已安装正式包路径（自带 node_modules/undici，代理等模块必须从这里加载）
import { execFileSync } from 'node:child_process';
export const NPM_PREFIX = execFileSync(process.platform === 'win32' ? 'npm.cmd' : 'npm',
    ['prefix', '-g'], { encoding: 'utf8', shell: true }).trim();
export const INSTALLED = `${NPM_PREFIX}/node_modules/huaweicloud-devkit`;
export const INSTALLED_SRC = `${INSTALLED}/plugins/huaweicloud-core/src`;
export const instSrc = (rel) => `${INSTALLED_SRC}/${rel}`;
export function installedVersion() {
    try { return JSON.parse(readFileSync(`${INSTALLED}/package.json`, 'utf8')).version; } catch { return null; }
}
