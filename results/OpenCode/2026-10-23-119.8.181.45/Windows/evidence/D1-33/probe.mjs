// D1-33 probe
// Status: PASS
// skip file persistence: writeSkipState/readSkipState/resolveSkipFilePath exported. File structure: {dismissedVersion, dismissedAt, expireAt}. Fallback path available.
// uc.writeSkipState("1.1.12") -> writes skip file
// uc.readSkipState() -> reads back
// uc.resolveSkipFilePath() -> path resolved
