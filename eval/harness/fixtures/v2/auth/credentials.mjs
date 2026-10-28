/**
 * v2 shim：auth/credentials.mjs → v2 dist/auth/credentials.js
 * v1 夹具依赖的 22 个符号在 v2 里同名存在。
 */
import { load } from '../_loader.mjs';

const m = await load('auth/credentials.js');

export const backupGlobalCredentials = m.backupGlobalCredentials;
export const clearRuntimeCredentials = m.clearRuntimeCredentials;
export const getParentCwd = m.getParentCwd;
export const globalCredentialsPath = m.globalCredentialsPath;
export const hasRuntimeCredentials = m.hasRuntimeCredentials;
export const isCodeArtsContext = m.isCodeArtsContext;
export const isPlaceholder = m.isPlaceholder;
export const lastSyncPath = m.lastSyncPath;
export const obsConfigPath = m.obsConfigPath;
export const parseStsExpiry = m.parseStsExpiry;
export const pickDevkitMcpServer = m.pickDevkitMcpServer;
export const readCodeArtsCredentials = m.readCodeArtsCredentials;
export const readGlobalCredentials = m.readGlobalCredentials;
export const readLastSync = m.readLastSync;
export const resolveCredentials = m.resolveCredentials;
export const resolveCredentialsWithRuntime = m.resolveCredentialsWithRuntime;
export const restoreGlobalCredentialsBackup = m.restoreGlobalCredentialsBackup;
export const setConfiguredBySession = m.setConfiguredBySession;
export const setRuntimeCredentials = m.setRuntimeCredentials;
export const writeGlobalCredentials = m.writeGlobalCredentials;
export const writeLastSync = m.writeLastSync;
export const writeObsConfig = m.writeObsConfig;