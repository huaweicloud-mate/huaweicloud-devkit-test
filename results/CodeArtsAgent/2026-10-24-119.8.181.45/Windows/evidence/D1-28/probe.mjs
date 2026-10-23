import { judgeUpdate } from "file:///C:/Users/Administrator/devkit-test/testbot4-codearts1/hdk/plugins/huaweicloud-core/src/update-check.mjs";
const result = judgeUpdate({current: "1.1.10", distTags: {latest: "1.1.12"}});
console.log(JSON.stringify(result));