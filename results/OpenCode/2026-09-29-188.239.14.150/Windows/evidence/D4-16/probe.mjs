Command wrapping penetration:
bash -c "hcloud ECS DeleteServers --instance_ids xxx": warn (denied=true, findings=1)
sh -c "cat ~/.config/huaweicloud/credentials.json": deny (denied=true, findings=1)
echo "hcloud ECS DeleteServers" | sh: warn (denied=true, findings=1)
All wrapping attempts blocked: true
Note: sh -c "cat ~/.config/huaweicloud/credentials.json" should match hwc-command-credential-file rule.
The rule regex checks (hcloud|huaweicloud)[/\\](config|credentials) but the path uses / not \\ on the text level.