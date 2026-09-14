import { test } from 'node:test';
import assert from 'node:assert';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

process.env.HW_ACCESS_KEY = 'TESTAK';
process.env.HW_SECRET_KEY = 'TESTSK';
process.env.HDKITSERVICE_ENDPOINT = 'https://example.test/hdkitservice/';

const { hdkitConnect, hdkitVoucherStatus, hdkitVoucherClaim } =
  await import('../plugins/huaweicloud-core/src/sandbox/hdkitservice-api.mjs');
const { clearRuntimeCredentials } = await import('../plugins/huaweicloud-core/src/auth/credentials.mjs');

test('hdkitservice connect parses backend traceId (camelCase) on error', async () => {
  const originalFetch = global.fetch;
  let requestedUrl = null;
  global.fetch = async (url, _opts) => {
    requestedUrl = url;
    return new Response(
      JSON.stringify({
        code: 'HDKIT_INTERNAL',
        message: '服务内部错误',
        traceId: 'trace-123',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  };

  try {
    const err = await hdkitConnect({}).then(
      () => null,
      (error) => error,
    );
    assert.ok(err, 'expected hdkitConnect to reject');
    assert.equal(err.message, 'HDKIT_INTERNAL: 服务内部错误 [trace: trace-123]');
    assert.equal(err.code, 'HDKIT_INTERNAL');
    assert.equal(err.status, 500);
    assert.equal(err.traceId, 'trace-123');
    assert.equal(requestedUrl, 'https://example.test/hdkitservice/connect');
  } finally {
    global.fetch = originalFetch;
  }
});

test('voucher status returns CRED_MISSING when credentials are absent', async () => {
  const savedAk = process.env.HW_ACCESS_KEY;
  const savedSk = process.env.HW_SECRET_KEY;
  const savedHome = process.env.HUAWEICLOUD_HOME;
  const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'hdkit-test-'));
  try {
    delete process.env.HW_ACCESS_KEY;
    delete process.env.HW_SECRET_KEY;
    process.env.HUAWEICLOUD_HOME = tmpHome;
    clearRuntimeCredentials();

    const result = await hdkitVoucherStatus();
    assert.equal(result.claimed, false);
    assert.equal(result.code, 'HDKIT_CRED_MISSING');
    assert.match(result.message, /credentials are not configured/);
  } finally {
    if (savedAk === undefined) delete process.env.HW_ACCESS_KEY;
    else process.env.HW_ACCESS_KEY = savedAk;
    if (savedSk === undefined) delete process.env.HW_SECRET_KEY;
    else process.env.HW_SECRET_KEY = savedSk;
    if (savedHome === undefined) delete process.env.HUAWEICLOUD_HOME;
    else process.env.HUAWEICLOUD_HOME = savedHome;
    clearRuntimeCredentials();
    fs.rmSync(tmpHome, { recursive: true, force: true });
  }
});

test('voucher claim passes through error code and message on non-2xx', async () => {
  const originalFetch = global.fetch;
  global.fetch = async () =>
    new Response(JSON.stringify({ code: 'HDKIT_INTERNAL', message: '服务内部错误' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  try {
    const result = await hdkitVoucherClaim('some-domain');
    assert.equal(result.claimed, false);
    assert.equal(result.code, 'HDKIT_INTERNAL');
    assert.match(result.message, /HDKIT_INTERNAL/);
  } finally {
    global.fetch = originalFetch;
  }
});
