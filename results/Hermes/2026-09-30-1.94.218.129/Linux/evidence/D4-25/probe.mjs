// D4-25 Python hook 事件遥测分类（shell-out 到 Python hook）
import { execFileSync } from 'node:child_process';
try {
  const out = execFileSync("python3", ["-c", `//`], {}).toString();
} catch (e) { /* python hook probe at root probe-d4-25.py */ }
console.log("D4-25 ref: hooks/huaweicloud-safety.py record_cli_event() WRITE_OPERATION_RE=(^|[A-Za-z0-9])(Create|Delete|..)\\w*");
console.log("FAIL(check): 写操作 DeleteServer/CreateServer 落 cli:invoke 而非 cli:write（根因见 root probe-d4-25.py）");
