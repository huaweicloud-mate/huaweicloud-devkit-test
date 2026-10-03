// 真实 MCP stdio 客户端 + 本地 mock registry
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, delimiter } from 'node:path';
import { tmpdir } from 'node:os';
import { SRC } from './lib.mjs';

export class McpClient {
    constructor(proc) {
        this.proc = proc;
        this.buf = '';
        this.pending = new Map();
        this.nextId = 1;
        this.stderr = '';
        this.stdoutRaw = '';
        proc.stdout.setEncoding('utf8');
        proc.stdout.on('data', (d) => {
            this.stdoutRaw += d;
            this.buf += d;
            let idx;
            while ((idx = this.buf.indexOf('\n')) !== -1) {
                const line = this.buf.slice(0, idx).trim();
                this.buf = this.buf.slice(idx + 1);
                if (!line) continue;
                if (line.startsWith('Content-Length:')) continue;
                try {
                    const msg = JSON.parse(line);
                    if (msg.id !== undefined && msg.id !== null && this.pending.has(msg.id)) {
                        const { resolve, reject } = this.pending.get(msg.id);
                        this.pending.delete(msg.id);
                        resolve(msg);
                    }
                } catch { /* 非协议行（stdout 污染）在此被记录 */ }
            }
        });
        proc.stderr.setEncoding('utf8');
        proc.stderr.on('data', (d) => { this.stderr += d; });
    }
    static start(env = {}, args = []) {
        const proc = spawn(process.execPath, [join(SRC, 'mcp-server.mjs'), ...args], {
            env: { ...process.env, ...env },
            stdio: ['pipe', 'pipe', 'pipe'],
            windowsHide: true
        });
        return new McpClient(proc);
    }
    send(method, params, timeoutMs = 30000) {
        const id = this.nextId++;
        const msg = { jsonrpc: '2.0', id, method, params };
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                this.pending.delete(id);
                reject(new Error(`timeout waiting for ${method} (${timeoutMs}ms)`));
            }, timeoutMs);
            this.pending.set(id, {
                resolve: (m) => { clearTimeout(timer); resolve(m); },
                reject: (e) => { clearTimeout(timer); reject(e); }
            });
            this.proc.stdin.write(JSON.stringify(msg) + '\n');
        });
    }
    notify(method, params) {
        this.proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', method, params }) + '\n');
    }
    raw(text) { this.proc.stdin.write(text); }
    async initialize(extra = {}) {
        const r = await this.send('initialize', {
            protocolVersion: '2025-06-18',
            capabilities: {},
            clientInfo: { name: 'hdk-daily-probe', version: '1.0.0' },
            ...extra
        });
        this.notify('notifications/initialized', {});
        return r;
    }
    async toolsList() { return (await this.send('tools/list', {})).result; }
    async call(name, args, timeoutMs = 60000) { return this.send('tools/call', { name, arguments: args }, timeoutMs); }
    kill() { try { this.proc.kill(); } catch { /* already dead */ } }
}

// 本地 mock npm registry：返回可控 dist-tags
// 需同时服务 npm view 使用的完整 packument 路径 `/{pkg}` 与 fetch 路径 `/-/package/{pkg}/dist-tags`
export async function startMockRegistry(tags, { status = 200 } = {}) {
    const packument = {
        name: 'huaweicloud-devkit',
        'dist-tags': tags,
        versions: {},
        time: {}
    };
    const server = createServer((req, res) => {
        const url = req.url.split('?')[0];
        const send = (code, body) => {
            res.writeHead(code, { 'Content-Type': 'application/json' });
            res.end(typeof body === 'string' ? body : JSON.stringify(body));
        };
        if (status !== 200) { send(status, '{}'); return; }
        if (url === '/-/package/huaweicloud-devkit/dist-tags') { send(200, tags); return; }
        if (url === '/huaweicloud-devkit') { send(200, packument); return; }
        send(404, { error: 'not_found', url });
    });
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    const { port } = server.address();
    return {
        url: `http://127.0.0.1:${port}`,
        port,
        close: () => new Promise((r) => server.close(r))
    };
}

export function isoHome(tag) {
    const home = mkdtempSync(join(tmpdir(), `hdk-${tag}-`));
    mkdirSync(join(home, '.config', 'huaweicloud'), { recursive: true });
    return home;
}

// npm CLI 替身：在 PATH 前置一个 npm.cmd，只回放固定的 dist-tags JSON。
// 用于替代本机 npm view 拉取官方源的 dist-tags——不 mock 被测产品逻辑，
// 被测的 spawn/parse/缓存/judgeUpdate/dismiss 全部走真实代码路径。
// 说明：本机 npm 无法访问本地 plain-HTTP registry（FETCH_ERROR 黑洞），
// 因此 dist-tags 取值改由该替身注入，registry HTTP 路径另由 mock registry 覆盖。
export function npmStub(distTagsJson, { exitCode = 0, asArray = false } = {}) {
    const dir = mkdtempSync(join(tmpdir(), 'hdk-npmstub-'));
    const payload = asArray ? JSON.stringify([distTagsJson]) : JSON.stringify(distTagsJson);
    if (process.platform === 'win32') {
        writeFileSync(join(dir, 'npm.cmd'), `@echo off\r\necho ${payload}\r\nexit /b ${exitCode}\r\n`, 'utf8');
        // sh 形式兜底（cmd.exe 命中 .cmd 即可，保留 npm 无扩展名调用）
        writeFileSync(join(dir, 'npm'), `#!/bin/sh\necho '${payload}'\nexit ${exitCode}\n`, 'utf8');
    } else {
        writeFileSync(join(dir, 'npm'), `#!/bin/sh\necho '${payload}'\nexit ${exitCode}\n`, { mode: 0o755 });
    }
    return { dir, payload };
}

export function stubEnv(stub, base = {}) {
    return {
        ...base,
        PATH: `${stub.dir}${delimiter}${process.env.PATH || ''}`,
        Path: `${stub.dir}${delimiter}${process.env.PATH || ''}`
    };
}

export function writeJson(p, obj) {
    mkdirSync(join(p, '..'), { recursive: true });
    writeFileSync(p, JSON.stringify(obj, null, 2), 'utf8');
}
