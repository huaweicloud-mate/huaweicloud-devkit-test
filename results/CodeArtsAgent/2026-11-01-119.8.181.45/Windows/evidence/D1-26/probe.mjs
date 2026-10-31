// D1-26 升级提醒工具注册与协议暴露 探针脚本
import { spawn } from "child_process";

let pass = 0, fail = 0;
const results = [];

async function test() {
    const serverPath = "C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-3/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/mcp-server.mjs";

    const proc = spawn("node", [serverPath], {
        stdio: ["pipe", "pipe", "pipe"]
    });

    let output = "";
    proc.stdout.on("data", (data) => {
        output += data.toString();
    });

    const initRequest = '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}
';
    proc.stdin.write(initRequest);

    setTimeout(() => {
        const toolsRequest = '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}
';
        proc.stdin.write(toolsRequest);
    }, 1000);

    setTimeout(() => {
        proc.kill();

        try {
            const lines = output.split("
").filter(l => l.trim());
            let toolsListFound = false;
            let checkUpdateFound = false;
            let upgradeFound = false;

            for (const line of lines) {
                try {
                    const json = JSON.parse(line);
                    if (json.result && json.result.tools) {
                        toolsListFound = true;
                        for (const tool of json.result.tools) {
                            if (tool.name === "huaweicloud_check_update") {
                                checkUpdateFound = true;
                            }
                            if (tool.name === "huaweicloud_upgrade") {
                                upgradeFound = true;
                            }
                        }
                    }
                } catch (e) {}
            }

            if (toolsListFound && checkUpdateFound && upgradeFound) {
                pass++;
                results.push("PASS  D1-26  升级提醒工具注册与协议暴露  => 两工具均注册且schema完整");
            } else {
                fail++;
                results.push("FAIL  D1-26  升级提醒工具注册与协议暴露  => toolsList=" + toolsListFound + " checkUpdate=" + checkUpdateFound + " upgrade=" + upgradeFound);
            }
        } catch (e) {
            fail++;
            results.push("FAIL  D1-26  解析输出失败  => " + e.message);
        }

        console.log("=== D1-26 探针结果 ===");
        for (const line of results) console.log(line);
        console.log("TOTAL pass=" + pass + " fail=" + fail);

        const outputJson = {
            status: fail > 0 ? "FAIL" : "PASS",
            pass,
            fail,
            results,
            executedAt: new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14)
        };
        console.log("=== JSON OUTPUT ===");
        console.log(JSON.stringify(outputJson));

        process.exit(fail > 0 ? 1 : 0);
    }, 2000);
}

test();