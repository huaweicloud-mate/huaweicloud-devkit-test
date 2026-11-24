// Real probe for D3-C2: OBS静态站部署E2E(真机建删)
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const b = 'tctest-codearts1-' + stamp;
  const xml = '<CreateBucketConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/"><LocationConstraint>cn-north-4</LocationConstraint></CreateBucketConfiguration>';
  const c = await signedRequest('PUT', '/' + b, { body: xml, contentType: 'application/xml', headers: { 'x-obs-acl': 'public-read' } });
  const put = await signedRequest('PUT', '/index.html', { bucket: b, body: '<html><body><h1>tctest daily</h1></body></html>', contentType: 'text/html' });
  const acl = await signedRequest('PUT', '/index.html', { bucket: b, headers: { 'x-obs-acl': 'public-read' } });
  const sigGet = await signedRequest('GET', '/index.html', { bucket: b });
  let sigBody = await sigGet.text();
  if (!sigBody) { const g2 = await signedRequest('GET', '/index.html', { bucket: b }); sigBody = await g2.text(); }
  const pub = await fetch('https://' + b + '.obs.cn-north-4.myhuaweicloud.com/index.html').catch(() => ({ status: 0 }));
  const pubStatus = pub.status;
  const delObj = await signedRequest('DELETE', '/index.html', { bucket: b });
  const delBucket = await signedRequest('DELETE', '/', { bucket: b });
  const head = await signedRequest('HEAD', '/', { bucket: b });
  const cleaned = head.status === 404 && delObj.status === 204 && delBucket.status === 204;
  const deployed = c.status === 200 && put.status === 200 && sigGet.status === 200;
  const result = { create: c.status, put: put.status, acl: acl.status, sigGet: sigGet.status, sigBody: sigBody.slice(0, 120), publicStatus: pubStatus, delObj: delObj.status, delBucket: delBucket.status, headAfter: head.status };
  if (deployed && pubStatus === 200 && cleaned) return { status: 'PASS', why: '真机 OBS: 建桶 ' + b + ' 200→上传 200→对象ACL=' + acl.status + '→签名GET 200→公网GET 200→删对象/桶→head 404 归零', result };
  if (deployed && cleaned && pubStatus === 403) return { status: 'BLOCKED', why: '真机已建桶/上传/签名读/删桶归零（create=200 put=200 sigGET=200 cleaned=true），但账号级公共访问策略阻断匿名 GET（403 AccessDenied）；影响：静态站公网可访问无法验证；解除条件：解除账号 OBS BlockPublicAccess 或提供可公开读的桶策略权限', result };
  return { status: 'FAIL', why: 'OBS 静态站部署失败 create=' + c.status + ' put=' + put.status + ' sigGet=' + sigGet.status + ' public=' + pubStatus + ' cleaned=' + cleaned, result };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
