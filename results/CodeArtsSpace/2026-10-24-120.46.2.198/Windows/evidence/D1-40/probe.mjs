// D1-40: 镜像 lag 检测
import {queryDistTags, judgeUpdate} from 'C:/Users/Administrator/devkit-test/testbot5-win-CodeArtsSpace/hdk/plugins/huaweicloud-core/src/update-check.mjs';
process.env.npm_config_registry='https://mirrors.huaweicloud.com/repository/npm/';
const r=await queryDistTags('huaweicloud-devkit');
console.log(JSON.stringify(r));