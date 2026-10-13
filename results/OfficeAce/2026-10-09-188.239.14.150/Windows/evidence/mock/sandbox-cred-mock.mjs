// sandbox-cred-mock.mjs — D3-C14 sandbox 凭证 mock 层
// 模拟 HDKit 服务参数响应，注入伪造 HDKIT_CRED 响应
// 使现有 D3-C14 夹具（d3-c14-sandbox-hwlink-cred.mjs）在无真实 sandbox 服务时可完整运行
// 用法:
//   import { SandboxCredMock } from './sandbox-cred-mock.mjs';
//   const mock = new SandboxCredMock();
//   mock.install();   // 安装 mock（覆盖 globalThis.fetch + 注入凭证 + 设置端点）
//   mock.uninstall(); // 恢复
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

class SandboxCredMock {
  constructor(options = {}) {
    this.mockEndpoint = options.endpoint || 'https://mock-hdkit.example.com/api/';
    this.mockAk = options.ak || 'MOCK_AK_D3C14';
    this.mockSk = options.sk || 'MOCK_SK_D3C14';
    this.mockSecurityToken = options.securityToken || 'MOCK_ST_D3C14';
    this.mockRegion = options.region || 'cn-north-4';
    this.mockUserHash = options.userHash || 'mock-user-hash-d3c14';
    this.mockSessionId = options.sessionId || 'mock-session-001';
    this.mockDevStageId = options.devStageId || 'mock-dev-stage-001';
    this.mockVoucherClaimed = options.voucherClaimed ?? true;
    this.mockVoucherCode = options.voucherCode || 'MOCK-VOUCHER-001';

    this._origFetch = null;
    this._origEnv = {};
    this._tmpHome = null;
    this._installed = false;
    this.requestLog = []; // 记录所有 mock fetch 请求（用于断言）
  }

  // 安装 mock 环境
  install() {
    if (this._installed) return;
    this._installed = true;

    // 1. 隔离 HOME（不依赖本机凭证文件）
    this._origEnv = {
      HOME: process.env.HOME,
      HUAWEICLOUD_HOME: process.env.HUAWEICLOUD_HOME,
      HW_ACCESS_KEY: process.env.HW_ACCESS_KEY,
      HW_SECRET_KEY: process.env.HW_SECRET_KEY,
      HW_SECURITY_TOKEN: process.env.HW_SECURITY_TOKEN,
      HW_REGION: process.env.HW_REGION,
      HUAWEICLOUD_REGION: process.env.HUAWEICLOUD_REGION,
      CODEARTS_PROJECT_DIR: process.env.CODEARTS_PROJECT_DIR,
      HDKITSERVICE_ENDPOINT: process.env.HDKITSERVICE_ENDPOINT,
    };
    this._tmpHome = mkdtempSync(join(tmpdir(), 'sandbox-mock-'));
    process.env.HOME = this._tmpHome;
    process.env.HUAWEICLOUD_HOME = this._tmpHome;
    delete process.env.HW_ACCESS_KEY;
    delete process.env.HW_SECRET_KEY;
    delete process.env.HW_SECURITY_TOKEN;
    delete process.env.HW_REGION;
    delete process.env.HUAWEICLOUD_REGION;
    delete process.env.CODEARTS_PROJECT_DIR;

    // 2. 设置 mock 端点
    process.env.HDKITSERVICE_ENDPOINT = this.mockEndpoint;

    // 3. mock globalThis.fetch（拦截所有 HDKit API 请求）
    this._origFetch = globalThis.fetch;
    globalThis.fetch = this._mockFetch.bind(this);
  }

  // mock fetch — 拦截 HDKit API 请求并返回伪造响应
  async _mockFetch(url, opts = {}) {
    const urlStr = typeof url === 'string' ? url : url.toString();
    const method = opts.method || 'GET';
    const logEntry = { url: urlStr, method, ts: Date.now() };
    this.requestLog.push(logEntry);

    // 解析路径
    const pathPart = urlStr.replace(this.mockEndpoint, '');

    // check-user
    if (pathPart.includes('check-user')) {
      return this._mockResponse({ userHash: this.mockUserHash }, 200);
    }

    // user/generatorUserIDHash
    if (pathPart.includes('user/generatorUserIDHash')) {
      return this._mockResponse({ userHash: this.mockUserHash }, 200);
    }

    // sign-agreement
    if (pathPart.includes('sign-agreement')) {
      return this._mockResponse({ signed: true, timestamp: Date.now() }, 200);
    }

    // connect
    if (pathPart.includes('connect') && !pathPart.includes('credentials')) {
      const body = opts.body ? JSON.parse(opts.body) : {};
      return this._mockResponse({
        session_id: this.mockSessionId,
        dev_stage_id: this.mockDevStageId,
        env_id: 'mock-env-001',
        ...body,
      }, 200);
    }

    // credentials
    if (pathPart.includes('credentials')) {
      return this._mockResponse({
        ak: this.mockAk,
        sk: this.mockSk,
        security_token: this.mockSecurityToken,
        region: this.mockRegion,
        session_id: this.mockSessionId,
        expire_time: Math.floor(Date.now() / 1000) + 3600,
      }, 200);
    }

    // voucher/status
    if (pathPart.includes('voucher/status')) {
      return this._mockResponse({
        claimed: this.mockVoucherClaimed,
        voucher_code: this.mockVoucherCode,
      }, 200);
    }

    // voucher/claim
    if (pathPart.includes('voucher/claim')) {
      return this._mockResponse({
        claimed: true,
        voucher_code: this.mockVoucherCode,
        message: 'success',
      }, 200);
    }

    // 未知路径 → 404
    return this._mockResponse({ code: 'HTTP_404', message: 'mock: unknown path ' + pathPart }, 404);
  }

  _mockResponse(data, status = 200) {
    return Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      text: () => Promise.resolve(JSON.stringify(data)),
      json: () => Promise.resolve(data),
    });
  }

  // 卸载 mock，恢复环境
  uninstall() {
    if (!this._installed) return;
    this._installed = false;

    // 恢复 fetch
    if (this._origFetch) {
      globalThis.fetch = this._origFetch;
      this._origFetch = null;
    }

    // 恢复环境变量
    for (const [k, v] of Object.entries(this._origEnv)) {
      if (v !== undefined) process.env[k] = v;
      else delete process.env[k];
    }

    // 清理临时目录
    if (this._tmpHome && existsSync(this._tmpHome)) {
      rmSync(this._tmpHome, { recursive: true, force: true });
      this._tmpHome = null;
    }
  }

  // 获取 mock 凭证（供测试断言用）
  get mockCredentials() {
    return {
      ak: this.mockAk,
      sk: this.mockSk,
      securityToken: this.mockSecurityToken,
      securitytoken: this.mockSecurityToken, // hwlink-api.mjs uses lowercase
      region: this.mockRegion,
    };
  }

  // 获取请求日志
  get requests() {
    return this.requestLog;
  }

  // 是否已安装
  get isInstalled() {
    return this._installed;
  }
}

export { SandboxCredMock };
