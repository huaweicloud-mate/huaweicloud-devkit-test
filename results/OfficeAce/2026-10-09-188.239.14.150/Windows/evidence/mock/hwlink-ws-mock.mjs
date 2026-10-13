// hwlink-ws-mock.mjs — D9-11 WebSocket 隧道 mock server
// 模拟 hwlink WebSocket 隧道端点，覆盖 connect/auth/heartbeat/disconnect/reconnect 全生命周期
// 纯 Node.js 实现（node:http + crypto），不依赖外部 npm 包（如 ws）
// 用法:
//   import { HwlinkMockServer } from './hwlink-ws-mock.mjs';
//   const srv = new HwlinkMockServer();
//   await srv.start();          // 监听 127.0.0.1:随机端口
//   srv.url;                    // ws://127.0.0.1:PORT
//   await srv.close();          // 关闭并清理
import { createServer } from 'node:http';
import { createHash, randomBytes } from 'node:crypto';
import { EventEmitter } from 'node:events';

const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

// --- WebSocket frame codec (RFC 6455, minimal subset, no extensions) ---

function encodeFrame(data, opcode = 2, fin = true) {
  const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
  const len = buf.length;
  let header;
  if (len < 126) {
    header = Buffer.alloc(2);
    header[0] = (fin ? 0x80 : 0) | opcode;
    header[1] = len;
  } else if (len < 65536) {
    header = Buffer.alloc(4);
    header[0] = (fin ? 0x80 : 0) | opcode;
    header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = (fin ? 0x80 : 0) | opcode;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(len), 2);
  }
  return Buffer.concat([header, buf]);
}

function decodeFrame(buf) {
  if (buf.length < 2) return null;
  const opcode = buf[0] & 0x0f;
  const masked = (buf[1] & 0x80) !== 0;
  let payloadLen = buf[1] & 0x7f;
  let offset = 2;
  if (payloadLen === 126) {
    if (buf.length < 4) return null;
    payloadLen = buf.readUInt16BE(2);
    offset = 4;
  } else if (payloadLen === 127) {
    if (buf.length < 10) return null;
    payloadLen = Number(buf.readBigUInt64BE(2));
    offset = 10;
  }
  let mask = null;
  if (masked) {
    if (buf.length < offset + 4) return null;
    mask = buf.subarray(offset, offset + 4);
    offset += 4;
  }
  if (buf.length < offset + payloadLen) return null;
  let payload = Buffer.from(buf.subarray(offset, offset + payloadLen));
  if (masked) {
    for (let i = 0; i < payload.length; i++) payload[i] ^= mask[i % 4];
  }
  return { opcode, payload, totalLen: offset + payloadLen };
}

// --- HwlinkMockServer ---

class HwlinkMockServer extends EventEmitter {
  constructor(options = {}) {
    super();
    this.port = options.port || 0;
    this.protocol = options.protocol || 'devenv';
    this.authToken = options.authToken || 'mock-auth-token-' + randomBytes(4).toString('hex');
    this.heartbeatIntervalMs = options.heartbeatIntervalMs || 0; // 0 = disabled by default
    this.httpServer = null;
    this.connections = new Map(); // id -> { socket, authed, createdAt }
    this.nextConnId = 1;
    this._heartbeatTimer = null;
    this._closed = false;
    this.frameLog = []; // 记录所有收发帧（用于断言）
  }

  async start() {
    return new Promise((resolve) => {
      this.httpServer = createServer();
      this.httpServer.on('upgrade', (req, socket, head) => {
        this._handleUpgrade(req, socket, head);
      });
      this.httpServer.listen(this.port, '127.0.0.1', () => {
        this.port = this.httpServer.address().port;
        this.url = `ws://127.0.0.1:${this.port}`;
        if (this.heartbeatIntervalMs > 0) {
          this._startHeartbeat();
        }
        this.emit('listening', this.port);
        resolve(this);
      });
    });
  }

  _handleUpgrade(req, socket, head) {
    const key = req.headers['sec-websocket-key'];
    if (!key) {
      socket.destroy();
      return;
    }
    const accept = createHash('sha1').update(key + WS_GUID).digest('base64');
    const protocols = (req.headers['sec-websocket-protocol'] || '').split(',').map(s => s.trim());
    const proto = protocols.includes(this.protocol) ? this.protocol : (protocols[0] || '');

    let resp = 'HTTP/1.1 101 Switching Protocols\r\n' +
      'Upgrade: websocket\r\n' +
      'Connection: Upgrade\r\n' +
      'Sec-WebSocket-Accept: ' + accept + '\r\n';
    if (proto) resp += 'Sec-WebSocket-Protocol: ' + proto + '\r\n';
    resp += '\r\n';
    socket.write(resp);

    const connId = this.nextConnId++;
    const conn = {
      id: connId,
      socket,
      authed: false,
      createdAt: Date.now(),
      authAttempts: 0,
      messagesReceived: 0,
      bytesReceived: 0,
    };
    this.connections.set(connId, conn);
    this.emit('connect', connId);

    let rxBuffer = Buffer.alloc(0);

    socket.on('data', (data) => {
      rxBuffer = Buffer.concat([rxBuffer, data]);
      while (true) {
        const frame = decodeFrame(rxBuffer);
        if (!frame) break;
        rxBuffer = rxBuffer.subarray(frame.totalLen);
        conn.messagesReceived++;
        conn.bytesReceived += frame.payload.length;
        this._handleMessage(connId, frame);
      }
    });

    socket.on('close', () => {
      this.connections.delete(connId);
      this.emit('disconnect', connId);
    });

    socket.on('error', () => {
      this.connections.delete(connId);
      this.emit('disconnect', connId);
    });
  }

  _handleMessage(connId, frame) {
    const conn = this.connections.get(connId);
    if (!conn) return;

    this.frameLog.push({ dir: 'in', connId, opcode: frame.opcode, len: frame.payload.length, ts: Date.now() });

    // opcode 1 = text (auth/heartbeat/control), 2 = binary (hwlink packet), 8 = close
    if (frame.opcode === 8) {
      // Close frame
      conn.socket.end();
      return;
    }

    if (frame.opcode === 1) {
      // Text frame — treat as auth/heartbeat control
      const text = frame.payload.toString('utf8');
      if (text.startsWith('auth:')) {
        conn.authAttempts++;
        const token = text.slice(5).trim();
        if (token === this.authToken || token === 'mock-auth-token') {
          conn.authed = true;
          this.emit('auth', connId, true);
          // Reply with auth success
          this._send(connId, Buffer.from('auth:ok'), 1);
        } else {
          this.emit('auth', connId, false);
          this._send(connId, Buffer.from('auth:fail'), 1);
        }
      } else if (text === 'ping' || text === 'heartbeat') {
        this.emit('heartbeat', connId);
        this._send(connId, Buffer.from('pong'), 1);
      } else if (text === 'disconnect') {
        conn.socket.end();
      } else {
        this.emit('message', connId, { type: 'text', data: text });
      }
    } else if (frame.opcode === 2) {
      // Binary frame — hwlink packet, echo back
      this.emit('message', connId, { type: 'binary', data: frame.payload });
      // Echo the binary frame back (simulates tunnel data round-trip)
      this._send(connId, frame.payload, 2);
    }
  }

  _send(connId, data, opcode) {
    const conn = this.connections.get(connId);
    if (!conn || conn.socket.destroyed) return false;
    const frame = encodeFrame(data, opcode);
    conn.socket.write(frame);
    this.frameLog.push({ dir: 'out', connId, opcode, len: data.length, ts: Date.now() });
    return true;
  }

  sendBinary(connId, data) {
    return this._send(connId, data, 2);
  }

  sendText(connId, text) {
    return this._send(connId, Buffer.from(text, 'utf8'), 1);
  }

  closeConnection(connId) {
    const conn = this.connections.get(connId);
    if (conn && !conn.socket.destroyed) {
      // Send close frame
      conn.socket.write(encodeFrame(Buffer.alloc(0), 8));
      conn.socket.end();
    }
  }

  _startHeartbeat() {
    this._heartbeatTimer = setInterval(() => {
      for (const [id, conn] of this.connections) {
        if (conn.authed && !conn.socket.destroyed) {
          this._send(id, Buffer.from('heartbeat'), 1);
        }
      }
    }, this.heartbeatIntervalMs);
  }

  get connectionCount() {
    return this.connections.size;
  }

  get isConnected() {
    return this.connections.size > 0 && !this._closed;
  }

  get hasAuthedConnection() {
    for (const conn of this.connections.values()) {
      if (conn.authed) return true;
    }
    return false;
  }

  async close() {
    this._closed = true;
    if (this._heartbeatTimer) {
      clearInterval(this._heartbeatTimer);
      this._heartbeatTimer = null;
    }
    // Close all connections
    for (const connId of this.connections.keys()) {
      this.closeConnection(connId);
    }
    this.connections.clear();
    return new Promise((resolve) => {
      if (this.httpServer) {
        this.httpServer.close(() => resolve());
      } else {
        resolve();
      }
    });
  }
}

export { HwlinkMockServer, encodeFrame, decodeFrame };
