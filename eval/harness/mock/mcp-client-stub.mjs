// mcp-client-stub.mjs — D9-6 跨客户端互通桩客户端 mock
// 模拟 ≥2 个虚拟 MCP 客户端，覆盖 initialize / tools/list / tools/call / resources/list 协议交互
// 基于 JSON-RPC 2.0 over stdio（Content-Length framing），与 MCP 标准协议一致
// 用法:
//   import { McpClientStub } from './mcp-client-stub.mjs';
//   const client = new McpClientStub({ name: 'Hermes/Agent', version: '1.0' });
//   await client.connect(serverPath);   // spawn mcp-server 子进程
//   const init = await client.initialize();
//   const tools = await client.toolsList();
//   await client.disconnect();
import { spawn } from 'node:child_process';
import { EventEmitter } from 'node:events';

class McpClientStub extends EventEmitter {
  constructor(options = {}) {
    super();
    this.clientName = options.name || 'mcp-stub';
    this.clientVersion = options.version || '1.0';
    this.protocolVersion = options.protocolVersion || '2024-11-05';
    this.capabilities = options.capabilities || {};
    this.serverPath = null;
    this.child = null;
    this._id = 0;
    this._pending = new Map();
    this._rxBuffer = Buffer.alloc(0);
    this._serverInfo = null;
    this._toolsCache = null;
    this._notifications = [];
    this._connected = false;
  }

  async connect(serverPath) {
    this.serverPath = serverPath;
    return new Promise((resolve, reject) => {
      this.child = spawn(process.execPath, [serverPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' },
      });

      const onError = (err) => {
        if (!this._connected) reject(err);
        this.emit('error', err);
      };
      this.child.on('error', onError);

      this.child.stdout.on('data', (data) => {
        this._rxBuffer = Buffer.concat([this._rxBuffer, data]);
        this._processBuffer();
      });

      this.child.stderr.on('data', (data) => {
        // stderr is server logs, not protocol data
      });

      this.child.on('close', (code) => {
        this._connected = false;
        this.emit('close', code);
      });

      // Give it a moment to start
      setTimeout(() => {
        this._connected = true;
        resolve(this);
      }, 100);
    });
  }

  _processBuffer() {
    while (true) {
      const h = this._rxBuffer.indexOf('\r\n\r\n');
      if (h < 0) break;
      const headerStr = this._rxBuffer.slice(0, h).toString();
      const m = /Content-Length:\s*(\d+)/i.exec(headerStr);
      if (!m) {
        this._rxBuffer = this._rxBuffer.slice(h + 4);
        continue;
      }
      const n = +m[1];
      if (this._rxBuffer.length < h + 4 + n) break;
      const body = this._rxBuffer.slice(h + 4, h + 4 + n).toString();
      this._rxBuffer = this._rxBuffer.slice(h + 4 + n);
      try {
        const msg = JSON.parse(body);
        this._handleMessage(msg);
      } catch {
        // ignore malformed
      }
    }
  }

  _handleMessage(msg) {
    // Response to a request
    if (msg.id != null && this._pending.has(msg.id)) {
      this._pending.get(msg.id)(msg);
      this._pending.delete(msg.id);
      return;
    }
    // Notification (no id)
    if (msg.method && msg.id == null) {
      this._notifications.push(msg);
      this.emit('notification', msg);
    }
  }

  _send(method, params = {}, isNotification = false) {
    const msg = { jsonrpc: '2.0', method, params };
    if (!isNotification) {
      msg.id = ++this._id;
    }
    const body = JSON.stringify(msg);
    const frame = `Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`;
    this.child.stdin.write(frame);
    if (isNotification) return Promise.resolve(null);
    return new Promise((resolve) => {
      this._pending.set(msg.id, resolve);
      // Timeout safety
      setTimeout(() => {
        if (this._pending.has(msg.id)) {
          this._pending.delete(msg.id);
          resolve({ error: { code: -32000, message: 'timeout' } });
        }
      }, 15000);
    });
  }

  async initialize() {
    const resp = await this._send('initialize', {
      protocolVersion: this.protocolVersion,
      capabilities: this.capabilities,
      clientInfo: { name: this.clientName, version: this.clientVersion },
    });
    if (resp?.result) {
      this._serverInfo = resp.result.serverInfo;
    }
    // Send initialized notification
    this._send('notifications/initialized', {}, true);
    return resp;
  }

  async toolsList() {
    const resp = await this._send('tools/list', {});
    if (resp?.result?.tools) {
      this._toolsCache = resp.result.tools;
    }
    return resp;
  }

  async toolsCall(name, args = {}) {
    return this._send('tools/call', { name, arguments: args });
  }

  async resourcesList() {
    return this._send('resources/list', {});
  }

  async ping() {
    return this._send('ping', {});
  }

  get serverInfo() {
    return this._serverInfo;
  }

  get tools() {
    return this._toolsCache;
  }

  get notifications() {
    return this._notifications;
  }

  get isAlive() {
    return this._connected && this.child && !this.child.killed;
  }

  async disconnect() {
    if (this.child && !this.child.killed) {
      this.child.kill();
    }
    this._connected = false;
    this._pending.clear();
  }

  // Protocol conformance check helpers
  checkInitResponse(resp) {
    return resp?.result?.serverInfo?.name === 'huaweicloud-devkit' &&
      resp?.result?.protocolVersion != null;
  }

  checkToolsResponse(resp) {
    return Array.isArray(resp?.result?.tools) && resp.result.tools.length > 0;
  }

  checkCallResponse(resp) {
    const result = resp?.result;
    if (!result) return false;
    return !result.isError && Array.isArray(result.content) && result.content.length > 0;
  }
}

export { McpClientStub };
