# D1-39 Windows 升级检测链可用性
# Probe: call huaweicloud check_update, observe EINVAL/result
# Expected: Windows 下检测链真实可用，不得 EINVAL 静默失败
import subprocess, json, sys
# Use the devkit's check_update via node
result = subprocess.run(['huaweicloud-devkit', 'update', '--check'], capture_output=True, text=True, timeout=60)
print('RC:', result.returncode)
print('STDOUT:', result.stdout[:2000])
print('STDERR:', result.stderr[:1000])
