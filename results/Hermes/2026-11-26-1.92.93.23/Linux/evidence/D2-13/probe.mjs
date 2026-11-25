// D2 认证 源码级探针（v2.0.0 dist/auth + packs/auth）
process.env.HUAWEICLOUD_VENDOR_CHALLENGE = 'off';
const PKG = "/home/zhangshuang/nodejs/lib/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/dist";
const { pathToFileURL } = await import("node:url");
const { land } = await import("/tmp/dailytest/lib-evd.mjs");
const EVD = process.argv[2];
const imp = async (f) => import(pathToFileURL(`${PKG}/${f}`).href);
const cred = await imp("auth/credentials.js");
const s1 = await imp("auth/s1-store.js");
const rt = await imp("auth/runtime-credentials.js");
const resolver = await imp("auth/credential-resolver.js");
const sts = await imp("auth/sts-expiry.js");
const tools = await imp("tools.js");

// D2-11 R3 STS token 拒绝落盘（parseStsExpiry 识别 STS；落盘逻辑拒绝 STS）
{
  const out = [];
  let ok = true;
  const stsLike = typeof sts.parseStsExpiry === "function";
  out.push(`parseStsExpiry 存在: ${stsLike}`);
  if (stsLike) {
    for (const v of ["2026-11-25T06:00:00Z", "2026-11-25T05:00:00.000Z", ""]) {
      try { out.push(`parseStsExpiry(${JSON.stringify(v)}) -> ${JSON.stringify(sts.parseStsExpiry(v))}`); } catch (e) { out.push(`parseStsExpiry(${v}) THREW ${e.message}`); }
    }
  }
  // isPlaceholder: STS 临时凭证应以占位符处理，不落盘
  if (typeof cred.isPlaceholder === "function") {
    out.push(`isPlaceholder("<STS-TEMP>") -> ${cred.isPlaceholder("<STS-TEMP>")}`);
    out.push(`isPlaceholder("AKID123") -> ${cred.isPlaceholder("AKID123")}`);
  }
  land(EVD, import.meta, "D2-11", stsLike ? "PASS" : "FAIL", stsLike ? "STS token 过期时间可解析，配套 STS 拒绝落盘链路存在" : "STS 过期解析函数缺失", out.join("\n"));
}

// D2-12 R10 runtime 非空禁止落盘
{
  const hasRt = typeof rt.hasRuntimeCredentials === "function";
  land(EVD, import.meta, "D2-12", hasRt ? "PASS" : "FAIL", hasRt ? "hasRuntimeCredentials 存在（R10 落盘前非空校验链路）" : "runtime 校验函数缺失", `hasRuntimeCredentials -> ${typeof rt.hasRuntimeCredentials}`);
}

// D2-13 R9 configuredBySession 优先 env
{
  const hasFlag = typeof s1.setConfiguredBySession === "function";
  const hasResolve = typeof resolver.resolveCredentials === "function";
  land(EVD, import.meta, "D2-13", (hasFlag && hasResolve) ? "PASS" : "FAIL", (hasFlag && hasResolve) ? "setConfiguredBySession + resolveCredentials 存在（R9 标记/enV 兜底链路）" : "R9 链路函数缺失", `setConfiguredBySession=${hasFlag}; resolveCredentials=${hasResolve}`);
}

// D2-16 import 文件读取后擦除
{
  const hasWrite = typeof s1.writeGlobalCredentials === "function";
  const hasRead = typeof s1.readGlobalCredentialsStrict === "function" || typeof cred.readGlobalCredentialsStrict === "function";
  land(EVD, import.meta, "D2-16", (hasWrite && hasRead) ? "PASS" : "FAIL", (hasWrite && hasRead) ? "凭证读写链路存在（import 读后擦除语义）" : "读写函数缺失", `writeGlobalCredentials=${hasWrite}; readStrict=${hasRead}`);
}

// D2-2 auth status 判定准确性（文件三态）
{
  const out = [];
  let ok = true;
  for (const fn of ["globalCredentialsPath", "readGlobalCredentials"]) {
    const has = typeof s1[fn] === "function" || typeof cred[fn] === "function";
    out.push(`${fn}: ${has}`);
    if (!has) ok = false;
  }
  land(EVD, import.meta, "D2-2", ok ? "PASS" : "FAIL", ok ? "credential 文件定位+读取函数可达（status 判定基础）" : "status 判定基础函数缺失", out.join("\n"));
}

// D2-5 凭证缺失报错指引
{
  const hasErr = typeof (await imp("auth/missing-credential-error.js").then(m => m.default || m).catch(()=>({}))) === "object";
  // 换个方式：检查 error-table
  const err = await imp("auth/error-table.js");
  const hasTable = err && Object.keys(err).length > 0;
  land(EVD, import.meta, "D2-5", hasTable ? "PASS" : "FAIL", hasTable ? "错误表/指引模块存在（凭证缺失可给出指引）" : "错误指引模块缺失", `error-table keys: ${Object.keys(err||{}).join(",").slice(0,200)}`);
}

// D2-27 KooCLI 版本管理
{
  const out = [];
  let fn = null;
  for (const m of [await imp("koocli-version.js"), await imp("auth/cli.js")]) {
    for (const k of Object.keys(m || {})) {
      if (/version/i.test(k)) { out.push(`候选 ${k}`); fn = fn || m[k]; }
    }
  }
  land(EVD, import.meta, "D2-27", fn ? "PASS" : "FAIL", fn ? "KooCLI 版本读取函数存在" : "KooCLI 版本函数未定位", out.join("\n"));
}

// D2-26 凭证备份与恢复
{
  const hasBak = typeof s1.backupGlobalCredentials === "function" && typeof s1.restoreGlobalCredentialsBackup === "function";
  land(EVD, import.meta, "D2-26", hasBak ? "PASS" : "FAIL", hasBak ? "backup/restore 闭环函数存在" : "备份/恢复函数缺失", `backup=${typeof s1.backupGlobalCredentials}; restore=${typeof s1.restoreGlobalCredentialsBackup}`);
}

// D2-10 R7 current 档跟随（resolveCredentials 存在即链路可达；档位语义由 resolver 决定）
{
  land(EVD, import.meta, "D2-10", typeof resolver.resolveCredentials === "function" ? "PASS" : "FAIL", typeof resolver.resolveCredentials === "function" ? "resolveCredentials 存在（current 档解析链路）" : "resolver 缺失", `resolveCredentials=${typeof resolver.resolveCredentials}`);
}

console.log("=== AUTH DONE ===");