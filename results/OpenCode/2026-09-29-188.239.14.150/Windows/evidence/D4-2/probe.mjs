Credential env print interception:
printenv HUAWEICLOUD_ACCESS_KEY: deny (denied=true)
printenv HW_SECRET_KEY: allow (denied=false)
Note: HW_SECRET_KEY is the actual env var used by the plugin (auth/credentials.mjs).
The risk rule regex (HUAWEICLOUD|HWC_|HCLOUD|OS_) does NOT include HW_ prefix.
This is a REAL DEFECT: printenv HW_SECRET_KEY is not intercepted.