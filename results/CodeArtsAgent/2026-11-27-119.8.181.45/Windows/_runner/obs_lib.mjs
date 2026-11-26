import { createHash, createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';

export const OBS_HOST = 'obs.cn-north-4.myhuaweicloud.com';
export const REGION = 'cn-north-4';

export function creds() {
  const files = [homedir() + '/.config/huaweicloud/credentials.json.bak-d3c2-20261120', homedir() + '/.config/huaweicloud/credentials.json'];
  for (const f of files) {
    try { const c = JSON.parse(readFileSync(f, 'utf8')); if (c.ak && !/^AK_BK/.test(c.ak)) return c; } catch { /* next */ }
  }
  return JSON.parse(readFileSync(homedir() + '/.config/huaweicloud/credentials.json', 'utf8'));
}

function sha256Hex(buf) { return createHash('sha256').update(buf).digest('hex'); }
function hmac(key, s) { return createHmac('sha256', key).update(s).digest(); }

export function signedRequest(method, path, { body = '', subresource = '', headers = {}, contentType = null, bucket = null } = {}) {
  const c = creds();
  const now = new Date();
  const amzDate = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = sha256Hex(Buffer.from(body || ''));
  const host = bucket ? bucket + '.' + OBS_HOST : OBS_HOST;
  const h = { host, 'x-amz-date': amzDate, 'x-amz-content-sha256': payloadHash };
  if (c.securityToken) h['x-amz-security-token'] = c.securityToken;
  if (contentType) h['content-type'] = contentType;
  for (const [k, v] of Object.entries(headers)) h[k.toLowerCase()] = v;
  const sortedKeys = Object.keys(h).sort();
  const canonicalHeaders = sortedKeys.map((k) => k + ':' + h[k].trim() + '\n').join('');
  const signedHeaders = sortedKeys.join(';');
  const canonicalUri = path.split('?')[0];
  const canonicalQuery = subresource ? subresource + '=' : '';
  const canonicalRequest = [method, canonicalUri, canonicalQuery, canonicalHeaders, signedHeaders, payloadHash].join('\n');
  const scope = dateStamp + '/' + REGION + '/s3/aws4_request';
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, scope, sha256Hex(Buffer.from(canonicalRequest))].join('\n');
  let k = hmac('AWS4' + c.sk, dateStamp);
  k = hmac(k, REGION); k = hmac(k, 's3'); k = hmac(k, 'aws4_request');
  const signature = createHmac('sha256', k).update(stringToSign).digest('hex');
  const auth = 'AWS4-HMAC-SHA256 Credential=' + c.ak + '/' + scope + ', SignedHeaders=' + signedHeaders + ', Signature=' + signature;
  const url = 'https://' + host + path + (subresource ? '?' + subresource + (subresource === 'acl' ? '' : '') : '');
  const sendHeaders = { ...h, Authorization: auth };
  delete sendHeaders.host;
  return fetch(url, { method, headers: sendHeaders, body: method === 'GET' || method === 'HEAD' ? undefined : (body || undefined) });
}
