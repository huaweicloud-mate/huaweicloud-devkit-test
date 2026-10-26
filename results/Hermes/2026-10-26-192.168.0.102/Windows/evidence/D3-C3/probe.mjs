// Hermes/Windows 真云 E2E D3-C3
// status: FAIL
// 沙箱部署E2E: connect/close_session PASS，但 sandbox_upload_project 在 Windows 上 tar -czf 打包失败(tar -czf C:\Users\ADMINI~1\AppData\Local\Temp\sandbox-upload-... Command failed)，导致 deploy_nginx 无项目(undefined)。根因疑似 Windows 路径/probe 用 /tmp 绝对路径 + tar 参数问题，待源码核对 sandbox_upload_project 的 tar 打包逻辑。
